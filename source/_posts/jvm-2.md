---
title: 深入浅出JVM虚拟机——JVM调优
categories:
    - JVM虚拟机
    
date: 2019-02-27 18:40:24
tags:
  - Java
  - JVM

---

**参考文章:** [JVM调优指南](https://www.jianshu.com/p/aaee11115f37)

---

### JVM参数的类型
#### 标准参数：在各jdk版本中较稳定
<code>
	-help<br>
	-server -client<br>
	-version -showversion<br>
	-cp -classpath<br>
</code>

#### X参数
##### 非标准化参数
##### -Xint：完全解释执行
调整为<code>完全解释执行</code>编译模式:

```bash
MacBook-Pro:dubbo-learn loonycoder$ java -Xint -version
java version "1.8.0_161"
Java(TM) SE Runtime Environment (build 1.8.0_161-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.161-b12, interpreted mode)
```

##### -Xcomp：第一次使用就编译成本地代码
调整为<code>编译执行</code>编译模式：

```bash
MacBook-Pro:dubbo-learn loonycoder$ java -Xcomp -version
java version "1.8.0_161"
Java(TM) SE Runtime Environment (build 1.8.0_161-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.161-b12, compiled mode)
```

##### -Xmixed：混合模式，JVM自己来决定是否编译成本地代码

```bash
MacBook-Pro:~ loonycoder$ java -version
java version "1.8.0_161"
Java(TM) SE Runtime Environment (build 1.8.0_161-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.161-b12, mixed mode)
```

最后一行的<code>mixed mode</code>表明JVM默认使用的编译模式是<code>混合模式</code>

#### XX参数

使用最多的一种参数类型

##### Boolean类型

格式：<code>-XX:[+/-] &lt;name&gt;</code>表示启用或者禁用name属性
比如：
<code>-XX:+UseConcMarkSweepGC</code> 表示启用CMS垃圾回收器
<code>-XX:+UseG1GC</code> 表示启用G1垃圾回收器

##### 非Boolean类型

格式：<code>-XX:&lt;name&gt; = &lt;value&gt;</code> 表示name属性的值为value
比如：
<code>-XX:MaxGCPauseMillis=500</code> 表示GC最大停顿时间是500毫秒
<code>-XX:GCTimeRatio=19</code> 表示吞吐量大小(通常是0-100之间的整数)假设 GCTimeRatio 的值为 n，那么系统将花费不超过 1/(1+n) 的时间用于垃圾收集。 

##### -Xmx -Xms

虽然1以X开头，但是不是X类型参数，而是XX类型的参数

- -Xmx等价于-XX:MaxHeapSize 表示最大堆内存大小，可使用<code>jinfo -flag MaxHeapSize</code>进程id查看，如下：
```bash
[root@izwz93osmk5vi5qwqyscxaz bin]# ps -ef|grep java
root      9723     1  0 4月24 ?       04:28:59 /usr/program/jdk1.8.0_72/jre/bin/java -Djava.util.logging.config.file=/opt/tomcat/apache-tomcat-8.0.50/conf/logging.properties -Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager -Djdk.tls.ephemeralDHKeySize=2048 -Djava.protocol.handler.pkgs=org.apache.catalina.webresources -Dignore.endorsed.dirs= -classpath /opt/tomcat/apache-tomcat-8.0.50/bin/bootstrap.jar:/opt/tomcat/apache-tomcat-8.0.50/bin/tomcat-juli.jar -Dcatalina.base=/opt/tomcat/apache-tomcat-8.0.50 -Dcatalina.home=/opt/tomcat/apache-tomcat-8.0.50 -Djava.io.tmpdir=/opt/tomcat/apache-tomcat-8.0.50/temp org.apache.catalina.startup.Bootstrap start
root     20037 19984  0 20:53 pts/2    00:00:00 grep --color=auto java
[root@izwz93osmk5vi5qwqyscxaz bin]# ./jinfo -flag MaxHeapSize 9723
-XX:MaxHeapSize=482344960
[root@izwz93osmk5vi5qwqyscxaz bin]#
```

- -Xms等价于-XX:InitalHeapSize 表示堆内存初始大小

- -Xss等价于-XX:InitalStackSize 表示线程栈的初始大小，可以使用<code>jinfo -flag ThreadStackSize</code>进程id查看，如下：
```bash
[root@izwz93osmk5vi5qwqyscxaz bin]# ps -ef
[root@izwz93osmk5vi5qwqyscxaz bin]# ps -ef|grep java
root      9723     1  0 4月24 ?       04:28:59 /usr/program/jdk1.8.0_72/jre/bin/java -Djava.util.logging.config.file=/opt/tomcat/apache-tomcat-8.0.50/conf/logging.properties -Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager -Djdk.tls.ephemeralDHKeySize=2048 -Djava.protocol.handler.pkgs=org.apache.catalina.webresources -Dignore.endorsed.dirs= -classpath /opt/tomcat/apache-tomcat-8.0.50/bin/bootstrap.jar:/opt/tomcat/apache-tomcat-8.0.50/bin/tomcat-juli.jar -Dcatalina.base=/opt/tomcat/apache-tomcat-8.0.50 -Dcatalina.home=/opt/tomcat/apache-tomcat-8.0.50 -Djava.io.tmpdir=/opt/tomcat/apache-tomcat-8.0.50/temp org.apache.catalina.startup.Bootstrap start
root     20037 19984  0 20:53 pts/2    00:00:00 grep --color=auto java
[root@izwz93osmk5vi5qwqyscxaz bin]# ./jinfo -flag MaxHeapSize 9723
-XX:MaxHeapSize=482344960
[root@izwz93osmk5vi5qwqyscxaz bin]# ./jinfo -flag ThreadStackSize 9723
-XX:ThreadStackSize=1024
[root@izwz93osmk5vi5qwqyscxaz bin]#
```

---

### VM运行时参数查看
- <code>-XX:+printFlagsInitial</code> 查看JVM运行时初始值
- <code>-XX:+printFlagsFinal</code> 查看JVM运行时最终值
- <code>-XX:+UnlockExperimentalVMOptions</code> 解锁实验参数
- <code>-XX:+UnlockDiagnosticVMOptions</code> 解锁诊断参数
- <code>-XX:+PrintCommandLineFlags</code> 打印命令行参数

如查看JVM版本信息：<code>java -XX:+PrintFlagsFinal -version &gt; \~/version.txt</code>

```bash
version.txt中部分参数：
[Global flags]
    uintx AdaptiveSizeDecrementScaleFactor          = 4                                   {product}
    uintx AdaptiveSizeMajorGCDecayTimeScale         = 10                                  {product}
    uintx AdaptiveSizePausePolicy                   = 0                                   {product}
    uintx AdaptiveSizePolicyCollectionCostMargin    = 50                                  {product}
    uintx AdaptiveSizePolicyInitializingSteps       = 20                                  {product}
    uintx AdaptiveSizePolicyOutputInterval          = 0                                   {product}
    uintx AdaptiveSizePolicyWeight                  = 10                                  {product}
    uintx AdaptiveSizeThroughPutPolicy              = 0                                   {product}
    uintx AdaptiveTimeWeight                        = 25                                  {product}
     bool AdjustConcurrency                         = false                               {product}
     bool AggressiveOpts                            = false                               {product}
     bool C1ProfileVirtualCalls                     = true                                {C1 product}
     bool C1UpdateMethodData                        = true                                {C1 product}
     intx CICompilerCount                          := 2                                   {product}
     bool CICompilerCountPerCPU                     = true                                {product}
     bool CITime                                    = false                               {product}
     bool CMSAbortSemantics                         = false                               {product}
    uintx CMSAbortablePrecleanMinWorkPerIteration   = 100                                 {product}
     intx CMSAbortablePrecleanWaitMillis            = 100                                 {manageable}
    uintx CMSBitMapYieldQuantum                     = 10485760
```

注：<code>=</code>表示默认值，<code>=:</code>表示修改后的值

#### jps：查看Java进程

```bash
[root@izwz93osmk5vi5qwqyscxaz bin]# ./jps
20160 Jps
9723 Bootstrap
[root@izwz93osmk5vi5qwqyscxaz bin]# ./jps -l
20170 sun.tools.jps.Jps
9723 org.apache.catalina.startup.Bootstrap
[root@izwz93osmk5vi5qwqyscxaz bin]#
```

关于jps等命令的详解，可参考此文档<https://docs.oracle.com/javase/8/docs/technotes/tools/unix/index.html>

#### jinfo：查看指定Java进程运行时参数

如查看一个java进程id为9723的tomcat服务最大堆内存大小

```bash
[root@izwz93osmk5vi5qwqyscxaz bin]# ps -ef|grep java
root      9723     1  0 4月24 ?       04:29:03 /usr/program/jdk1.8.0_72/jre/bin/java -Djava.util.logging.config.file=/opt/tomcat/apache-tomcat-8.0.50/conf/logging.properties -Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager -Djdk.tls.ephemeralDHKeySize=2048 -Djava.protocol.handler.pkgs=org.apache.catalina.webresources -Dignore.endorsed.dirs= -classpath /opt/tomcat/apache-tomcat-8.0.50/bin/bootstrap.jar:/opt/tomcat/apache-tomcat-8.0.50/bin/tomcat-juli.jar -Dcatalina.base=/opt/tomcat/apache-tomcat-8.0.50 -Dcatalina.home=/opt/tomcat/apache-tomcat-8.0.50 -Djava.io.tmpdir=/opt/tomcat/apache-tomcat-8.0.50/temp org.apache.catalina.startup.Bootstrap start
root     20187 20123  0 21:34 pts/2    00:00:00 grep --color=auto java
[root@izwz93osmk5vi5qwqyscxaz bin]# ./jinfo -flag MaxHeapSize 9723
-XX:MaxHeapSize=482344960
[root@izwz93osmk5vi5qwqyscxaz bin]#
```

查看一个进程的所有运行时参数：

```bash
[root@izwz93osmk5vi5qwqyscxaz bin]# ./jinfo -flags 9732
Attaching to process ID 9732, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.72-b15
Non-default VM flags: -XX:CICompilerCount=2 
-XX:InitialHeapSize=31457280 -XX:MaxHeapSize=482344960 
-XX:MaxNewSize=160759808 -XX:MinHeapDeltaBytes=196608 
-XX:NewSize=10485760 -XX:OldSize=20971520 
-XX:+UseCompressedClassPointers -XX:+UseCompressedOops
Command line:  -Djava.util.logging.config.file=/opt/tomcat/apache-tomcat-8.0.50/conf/logging.properties 
-Djava.util.logging.manager=org.apache.juli.ClassLoaderLogManager -Djdk.tls.ephemeralDHKeySize=2048 
-Djava.protocol.handler.pkgs=org.apache.catalina.webresources 
-Dignore.endorsed.dirs= -Dcatalina.base=/opt/tomcat/apache-tomcat-8.0.50 
-Dcatalina.home=/opt/tomcat/apache-tomcat-8.0.50 
-Djava.io.tmpdir=/opt/tomcat/apache-tomcat-8.0.50/temp
[root@izwz93osmk5vi5qwqyscxaz bin]#
```

<code>Non-default VM flags</code>表示手动赋值过的参数，其中有些是tomcat设置的
<code>Command line</code>：与<code>Non-default VM flags</code>

查看垃圾回收器信息

```bash
MacBook-Pro:dubbo-learn loonycoder$ jinfo -flag UseConcMarkSweepGc 29159
no such flag 'UseConcMarkSweepGc'
MacBook-Pro:dubbo-learn loonycoder$ jinfo -flag UseG1Gc 29159
no such flag 'UseG1Gc'
MacBook-Pro:dubbo-learn loonycoder$ jinfo -flag UseParallelGc 29159
no such flag 'UseParallelGc'
```

---

### jstat查看虚拟机统计信息
####  类装载

格式：<code>jstat -class 进程id 每隔多少毫秒 一共输出多少次</code>
如：查看一个进程id为29159的java进程，每隔1s输出，一共输出10次

```bash
MacBook-Pro:dubbo-learn loonycoder$ jstat -class 29159 1000 10
Loaded  Bytes  Unloaded  Bytes     Time
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
  3204  6088.2        0     0.0       2.14
```

- Loaded：表示类加载的个数
- Bytes：表示类加载的大小，单位为kb
- UnLoaded：表示类卸载的个数
- Bytes：表示类卸载的大小，单位为kb
- Time：表示类加载和卸载的时间

#### 垃圾收集

要查看一个java进程的垃圾收集器信息，可使用<code>jstat -gc 进程id 每隔多少毫秒 一共输出多少次</code>

```bash
MacBook-Pro:dubbo-learn loonycoder$ jstat -gc 29159 1000 3
 S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT     GCT
5120.0 5120.0 4308.8  0.0   33280.0  17845.6   87552.0      88.0    18944.0 18304.7 2304.0 2144.9      2    0.014   0      0.000    0.014
5120.0 5120.0 4308.8  0.0   33280.0  17845.6   87552.0      88.0    18944.0 18304.7 2304.0 2144.9      2    0.014   0      0.000    0.014
5120.0 5120.0 4308.8  0.0   33280.0  17845.6   87552.0      88.0    18944.0 18304.7 2304.0 2144.9      2    0.014   0      0.000    0.014
```

<code>S0C</code>: Current survivor space 0 capacity (kB).<code>表示survivor 0区的总大小</code>
<code>S1C</code>: Current survivor space 1 capacity (kB).<code>表示survivor 1区的总大小</code>
<code>S0U</code>: Survivor space 0 utilization (kB).<code>表示survivor 0区使用了的大小</code>
<code>S1U</code>: Survivor space 1 utilization (kB).<code>表示survivor 1区使用了的大小</code>
<code>EC</code>: Current eden space capacity (kB).<code>表示eden区总大小</code>
<code>EU</code>: Eden space utilization (kB).<code>表示eden区使用了的大小</code>
<code>OC</code>: Current old space capacity (kB).<code>表示old区总大小</code>
<code>OU</code>: Old space utilization (kB).<code>表示old区使用了的大小</code>
<code>MC</code>: Metaspace capacity (kB).<code>表示Metaspace区总大小</code>
<code>MU</code>: Metacspace utilization (kB).<code>表示Metaspace区使用了的大小</code>
<code>CCSC</code>: Compressed class space capacity (kB).<code>表示压缩类空间总量</code>
<code>CCSU</code>: Compressed class space used (kB).<code>表示压缩类空间使用量</code>
<code>YGC</code>: Number of young generation garbage collection events.<code>表示Young GC的次数</code>
<code>YGCT</code>: Young generation garbage collection time.<code>表示Young GC的时间</code>
<code>FGC</code>: Number of full GC events.<code>表示full GC的次数</code>
<code>FGCT</code>: Full garbage collection time.<code>表示full GC的时间</code>
<code>GCT</code>: Total garbage collection time.<code>表示总的 GC的时间</code>

#### JIT编译
##### -compiler参数
```bash
MacBook-Pro:dubbo-learn loonycoder$ jstat -compiler 29159 1000 5
Compiled Failed Invalid   Time   FailedType FailedMethod
    1284      0       0     3.50          0
    1284      0       0     3.50          0
    1284      0       0     3.50          0
    1284      0       0     3.50          0
    1284      0       0     3.50          0
```

- Compiled：表示编译成功的方法数量
- Failed：表示编译失败的方法数量
- Invalid：表示编译无效的方法数量
- Time：编译所花费的时间
- FailedType：编译失败类型
- FailedMethod：编译失败方法

##### -printcompilation参数

---

### jmap+MAT实战内存溢出
模拟内存溢出：
```bash
@RestController
public class MemoryController {
    
    private List<User>  userList = new ArrayList<User>();
    private List<Class<?>>  classList = new ArrayList<Class<?>>();
    
    /**
     * -Xmx32M -Xms32M
     * */
    @GetMapping("/heap")
    public String heap() {
        int i=0;
        while(true) {
            userList.add(new User(i++, UUID.randomUUID().toString()));
        }
    }
    
    
    /**
     * -XX:MetaspaceSize=32M -XX:MaxMetaspaceSize=32M
     * */
    @GetMapping("/nonheap")
    public String nonheap() {
        while(true) {
            classList.addAll(Metaspace.createClasses());
        }
    }
    
}

```

```bash
package com.imooc.monitor_tuning.chapter2;
import java.util.ArrayList;
import java.util.List;

import org.objectweb.asm.ClassWriter;
import org.objectweb.asm.MethodVisitor;
import org.objectweb.asm.Opcodes;

/*
 * https://blog.csdn.net/bolg_hero/article/details/78189621
 * 继承ClassLoader是为了方便调用defineClass方法，因为该方法的定义为protected
 * */
public class Metaspace extends ClassLoader {
    
    public static List<Class<?>> createClasses() {
        // 类持有
        List<Class<?>> classes = new ArrayList<Class<?>>();
        // 循环1000w次生成1000w个不同的类。
        for (int i = 0; i < 10000000; ++i) {
            ClassWriter cw = new ClassWriter(0);
            // 定义一个类名称为Class{i}，它的访问域为public，父类为java.lang.Object，不实现任何接口
            cw.visit(Opcodes.V1_1, Opcodes.ACC_PUBLIC, "Class" + i, null,
                    "java/lang/Object", null);
            // 定义构造函数<init>方法
            MethodVisitor mw = cw.visitMethod(Opcodes.ACC_PUBLIC, "<init>",
                    "()V", null, null);
            // 第一个指令为加载this
            mw.visitVarInsn(Opcodes.ALOAD, 0);
            // 第二个指令为调用父类Object的构造函数
            mw.visitMethodInsn(Opcodes.INVOKESPECIAL, "java/lang/Object",
                    "<init>", "()V");
            // 第三条指令为return
            mw.visitInsn(Opcodes.RETURN);
            mw.visitMaxs(1, 1);
            mw.visitEnd();
            Metaspace test = new Metaspace();
            byte[] code = cw.toByteArray();
            // 定义类
            Class<?> exampleClass = test.defineClass("Class" + i, code, 0, code.length);
            classes.add(exampleClass);
        }
        return classes;
    }
}
```

```bash
package com.imooc.monitor_tuning.chapter2;

public class User {
    private int id;
    private String name;
    public User(int id, String name) {
        super();
        this.id = id;
        this.name = name;
    }
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    
}
```

设置启动参数：

![jvm](images/jvm/jvm16.png)

启动application，发现出现内存溢出

#### 如何导出内存溢出映像文件
##### 内存溢出自动导出
<code>
-XX:+HeapDumpOnOutOfMemoryError<br>
-XX:HeapDumpPath=./<br>
</code>

![jvm](images/jvm/jvm17.png)

##### 使用jmap命令手动导出

格式：<code>jmap -dump:format=b,file=路径/heap.hprof 进程id</code>
其他命令：<code>jmap -heap 进程id</code> 查看堆信息

```bash
[root@izwz93osmk5vi5qwqyscxaz bin]# ./jmap -heap 9723
Attaching to process ID 9723, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.72-b15

using thread-local object allocation.
Mark Sweep Compact GC

Heap Configuration:
   MinHeapFreeRatio         = 40
   MaxHeapFreeRatio         = 70
   MaxHeapSize              = 482344960 (460.0MB)
   NewSize                  = 10485760 (10.0MB)
   MaxNewSize               = 160759808 (153.3125MB)
   OldSize                  = 20971520 (20.0MB)
   NewRatio                 = 2
   SurvivorRatio            = 8
   MetaspaceSize            = 21807104 (20.796875MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize         = 17592186044415 MB
   G1HeapRegionSize         = 0 (0.0MB)

Heap Usage:
New Generation (Eden + 1 Survivor Space):
   capacity = 32178176 (30.6875MB)
   used     = 16081160 (15.336189270019531MB)
   free     = 16097016 (15.351310729980469MB)
   49.97536218336303% used
Eden Space:
   capacity = 28639232 (27.3125MB)
   used     = 16054760 (15.311012268066406MB)
   free     = 12584472 (12.001487731933594MB)
   56.058626153103546% used
From Space:
   capacity = 3538944 (3.375MB)
   used     = 26400 (0.025177001953125MB)
   free     = 3512544 (3.349822998046875MB)
   0.7459852430555556% used
To Space:
   capacity = 3538944 (3.375MB)
   used     = 0 (0.0MB)
   free     = 3538944 (3.375MB)
   0.0% used
tenured generation:
   capacity = 71221248 (67.921875MB)
   used     = 57115304 (54.469398498535156MB)
   free     = 14105944 (13.452476501464844MB)
   80.19419148622613% used

27532 interned Strings occupying 3194040 bytes.
```

##### 使用MAT分析映像文件

![jvm](images/jvm/jvm18.png)

- Class Name：类名
- Objects：对象数量
- Shallow Heap：
- Retained Heap：占用的内存大小

右键查看com.imooc.monitor_tuning.chapter2.User的强引用

![jvm](images/jvm/jvm19.png)
![jvm](images/jvm/jvm20.png)

也可以查看对象树：

![jvm](images/jvm/jvm21.png)

---

### jstack实战死循环与死锁

格式：<code>jstack 进程id</code>
```bash
2018-09-05 07:59:21
Full thread dump Java HotSpot(TM) 64-Bit Server VM (25.72-b15 mixed mode):

"Attach Listener" #16 daemon prio=9 os_prio=0 tid=0x00007f3d9c001000 nid=0x521f waiting on condition [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"localhost-startStop-1" #15 daemon prio=5 os_prio=0 tid=0x00007f3dac002800 nid=0x5208 runnable [0x00007f3da15d1000]
   java.lang.Thread.State: RUNNABLE
    at java.io.FileInputStream.readBytes(Native Method)
    at java.io.FileInputStream.read(FileInputStream.java:255)
    at sun.security.provider.SeedGenerator$URLSeedGenerator.getSeedBytes(SeedGenerator.java:539)
    at sun.security.provider.SeedGenerator.generateSeed(SeedGenerator.java:144)
    at sun.security.provider.SecureRandom$SeederHolder.<clinit>(SecureRandom.java:203)
    at sun.security.provider.SecureRandom.engineNextBytes(SecureRandom.java:221)
    - locked <0x00000000e3e90be0> (a sun.security.provider.SecureRandom)
    at java.security.SecureRandom.nextBytes(SecureRandom.java:468)
    - locked <0x00000000e3e910c0> (a java.security.SecureRandom)
    at java.security.SecureRandom.next(SecureRandom.java:491)
    at java.util.Random.nextInt(Random.java:329)
    at org.apache.catalina.util.SessionIdGeneratorBase.createSecureRandom(SessionIdGeneratorBase.java:240)
    at org.apache.catalina.util.SessionIdGeneratorBase.getRandomBytes(SessionIdGeneratorBase.java:174)
    at org.apache.catalina.util.StandardSessionIdGenerator.generateSessionId(StandardSessionIdGenerator.java:34)
    at org.apache.catalina.util.SessionIdGeneratorBase.generateSessionId(SessionIdGeneratorBase.java:167)
    at org.apache.catalina.util.SessionIdGeneratorBase.startInternal(SessionIdGeneratorBase.java:260)
    at org.apache.catalina.util.LifecycleBase.start(LifecycleBase.java:145)
    - locked <0x00000000e3e90730> (a org.apache.catalina.util.StandardSessionIdGenerator)
    at org.apache.catalina.session.ManagerBase.startInternal(ManagerBase.java:717)
    at org.apache.catalina.session.StandardManager.startInternal(StandardManager.java:352)
    - locked <0x00000000e42eefb0> (a org.apache.catalina.session.StandardManager)
    at org.apache.catalina.util.LifecycleBase.start(LifecycleBase.java:145)
    - locked <0x00000000e42eefb0> (a org.apache.catalina.session.StandardManager)
    at org.apache.catalina.core.StandardContext.startInternal(StandardContext.java:5339)
    - locked <0x00000000ed3c6ca0> (a org.apache.catalina.core.StandardContext)
    at org.apache.catalina.util.LifecycleBase.start(LifecycleBase.java:145)
    - locked <0x00000000ed3c6ca0> (a org.apache.catalina.core.StandardContext)
    at org.apache.catalina.core.ContainerBase.addChildInternal(ContainerBase.java:753)
    at org.apache.catalina.core.ContainerBase.addChild(ContainerBase.java:729)
    at org.apache.catalina.core.StandardHost.addChild(StandardHost.java:717)
    at org.apache.catalina.startup.HostConfig.deployWAR(HostConfig.java:974)
    at org.apache.catalina.startup.HostConfig$DeployWar.run(HostConfig.java:1850)
    at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)
    at java.lang.Thread.run(Thread.java:745)

"Catalina-startStop-1" #14 daemon prio=5 os_prio=0 tid=0x00007f3dc4437000 nid=0x5207 waiting on condition [0x00007f3da16d2000]
   java.lang.Thread.State: WAITING (parking)
    at sun.misc.Unsafe.park(Native Method)
    - parking to wait for  <0x00000000ed3c6fc0> (a java.util.concurrent.FutureTask)
    at java.util.concurrent.locks.LockSupport.park(LockSupport.java:175)
    at java.util.concurrent.FutureTask.awaitDone(FutureTask.java:429)
    at java.util.concurrent.FutureTask.get(FutureTask.java:191)
    at org.apache.catalina.startup.HostConfig.deployWARs(HostConfig.java:766)
    at org.apache.catalina.startup.HostConfig.deployApps(HostConfig.java:436)
    at org.apache.catalina.startup.HostConfig.start(HostConfig.java:1580)
    at org.apache.catalina.startup.HostConfig.lifecycleEvent(HostConfig.java:322)
    at org.apache.catalina.util.LifecycleSupport.fireLifecycleEvent(LifecycleSupport.java:95)
    at org.apache.catalina.util.LifecycleBase.fireLifecycleEvent(LifecycleBase.java:90)
    at org.apache.catalina.util.LifecycleBase.setStateInternal(LifecycleBase.java:388)
    - locked <0x00000000ed03ec38> (a org.apache.catalina.core.StandardHost)
    at org.apache.catalina.util.LifecycleBase.setState(LifecycleBase.java:333)
    - locked <0x00000000ed03ec38> (a org.apache.catalina.core.StandardHost)
    at org.apache.catalina.core.ContainerBase.startInternal(ContainerBase.java:960)
    - locked <0x00000000ed03ec38> (a org.apache.catalina.core.StandardHost)
    at org.apache.catalina.core.StandardHost.startInternal(StandardHost.java:871)
    - locked <0x00000000ed03ec38> (a org.apache.catalina.core.StandardHost)
    at org.apache.catalina.util.LifecycleBase.start(LifecycleBase.java:145)
    - locked <0x00000000ed03ec38> (a org.apache.catalina.core.StandardHost)
    at org.apache.catalina.core.ContainerBase$StartChild.call(ContainerBase.java:1408)
    at org.apache.catalina.core.ContainerBase$StartChild.call(ContainerBase.java:1398)
    at java.util.concurrent.FutureTask.run(FutureTask.java:266)
    at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1142)
    at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:617)
    at java.lang.Thread.run(Thread.java:745)

"NioBlockingSelector.BlockPoller-2" #13 daemon prio=5 os_prio=0 tid=0x00007f3dc4429800 nid=0x5206 runnable [0x00007f3da17d4000]
   java.lang.Thread.State: RUNNABLE
    at sun.nio.ch.EPollArrayWrapper.epollWait(Native Method)
    at sun.nio.ch.EPollArrayWrapper.poll(EPollArrayWrapper.java:269)
    at sun.nio.ch.EPollSelectorImpl.doSelect(EPollSelectorImpl.java:93)
    at sun.nio.ch.SelectorImpl.lockAndDoSelect(SelectorImpl.java:86)
    - locked <0x00000000ed3c75a8> (a sun.nio.ch.Util$2)
    - locked <0x00000000ed3c75b8> (a java.util.Collections$UnmodifiableSet)
    - locked <0x00000000ed3c7560> (a sun.nio.ch.EPollSelectorImpl)
    at sun.nio.ch.SelectorImpl.select(SelectorImpl.java:97)
    at org.apache.tomcat.util.net.NioBlockingSelector$BlockPoller.run(NioBlockingSelector.java:301)

"NioBlockingSelector.BlockPoller-1" #12 daemon prio=5 os_prio=0 tid=0x00007f3dc440e800 nid=0x5205 runnable [0x00007f3da18d5000]
   java.lang.Thread.State: RUNNABLE
    at sun.nio.ch.EPollArrayWrapper.epollWait(Native Method)
    at sun.nio.ch.EPollArrayWrapper.poll(EPollArrayWrapper.java:269)
    at sun.nio.ch.EPollSelectorImpl.doSelect(EPollSelectorImpl.java:93)
    at sun.nio.ch.SelectorImpl.lockAndDoSelect(SelectorImpl.java:86)
    - locked <0x00000000ed3c77e0> (a sun.nio.ch.Util$2)
    - locked <0x00000000ed3c77f0> (a java.util.Collections$UnmodifiableSet)
    - locked <0x00000000ed3c7798> (a sun.nio.ch.EPollSelectorImpl)
    at sun.nio.ch.SelectorImpl.select(SelectorImpl.java:97)
    at org.apache.tomcat.util.net.NioBlockingSelector$BlockPoller.run(NioBlockingSelector.java:301)

"GC Daemon" #11 daemon prio=2 os_prio=0 tid=0x00007f3dc4356800 nid=0x5204 in Object.wait() [0x00007f3dc81a0000]
   java.lang.Thread.State: TIMED_WAITING (on object monitor)
    at java.lang.Object.wait(Native Method)
    - waiting on <0x00000000ed0d57f0> (a sun.misc.GC$LatencyLock)
    at sun.misc.GC$Daemon.run(GC.java:117)
    - locked <0x00000000ed0d57f0> (a sun.misc.GC$LatencyLock)

"AsyncFileHandlerWriter-789451787" #10 daemon prio=5 os_prio=0 tid=0x00007f3dc4105000 nid=0x5203 waiting on condition [0x00007f3dc8338000]
   java.lang.Thread.State: TIMED_WAITING (parking)
    at sun.misc.Unsafe.park(Native Method)
    - parking to wait for  <0x00000000ecec1210> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
    at java.util.concurrent.locks.LockSupport.parkNanos(LockSupport.java:215)
    at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.awaitNanos(AbstractQueuedSynchronizer.java:2078)
    at java.util.concurrent.LinkedBlockingDeque.pollFirst(LinkedBlockingDeque.java:522)
    at java.util.concurrent.LinkedBlockingDeque.poll(LinkedBlockingDeque.java:684)
    at org.apache.juli.AsyncFileHandler$LoggerThread.run(AsyncFileHandler.java:153)

"Service Thread" #7 daemon prio=9 os_prio=0 tid=0x00007f3dc40b3800 nid=0x5201 runnable [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"C1 CompilerThread1" #6 daemon prio=9 os_prio=0 tid=0x00007f3dc40b0800 nid=0x5200 waiting on condition [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"C2 CompilerThread0" #5 daemon prio=9 os_prio=0 tid=0x00007f3dc40ae800 nid=0x51ff waiting on condition [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"Signal Dispatcher" #4 daemon prio=9 os_prio=0 tid=0x00007f3dc40ad000 nid=0x51fe runnable [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

"Finalizer" #3 daemon prio=8 os_prio=0 tid=0x00007f3dc407a000 nid=0x51fd in Object.wait() [0x00007f3dc893e000]
   java.lang.Thread.State: WAITING (on object monitor)
    at java.lang.Object.wait(Native Method)
    - waiting on <0x00000000ecec2320> (a java.lang.ref.ReferenceQueue$Lock)
    at java.lang.ref.ReferenceQueue.remove(ReferenceQueue.java:143)
    - locked <0x00000000ecec2320> (a java.lang.ref.ReferenceQueue$Lock)
    at java.lang.ref.ReferenceQueue.remove(ReferenceQueue.java:164)
    at java.lang.ref.Finalizer$FinalizerThread.run(Finalizer.java:209)

"Reference Handler" #2 daemon prio=10 os_prio=0 tid=0x00007f3dc4075000 nid=0x51fc in Object.wait() [0x00007f3dc8a3f000]
   java.lang.Thread.State: WAITING (on object monitor)
    at java.lang.Object.wait(Native Method)
    - waiting on <0x00000000ecec24d8> (a java.lang.ref.Reference$Lock)
    at java.lang.Object.wait(Object.java:502)
    at java.lang.ref.Reference.tryHandlePending(Reference.java:191)
    - locked <0x00000000ecec24d8> (a java.lang.ref.Reference$Lock)
    at java.lang.ref.Reference$ReferenceHandler.run(Reference.java:153)

"main" #1 prio=5 os_prio=0 tid=0x00007f3dc4009000 nid=0x51fa waiting on condition [0x00007f3dcc417000]
   java.lang.Thread.State: WAITING (parking)
    at sun.misc.Unsafe.park(Native Method)
    - parking to wait for  <0x00000000ed3c7340> (a java.util.concurrent.FutureTask)
    at java.util.concurrent.locks.LockSupport.park(LockSupport.java:175)
    at java.util.concurrent.FutureTask.awaitDone(FutureTask.java:429)
    at java.util.concurrent.FutureTask.get(FutureTask.java:191)
    at org.apache.catalina.core.ContainerBase.startInternal(ContainerBase.java:943)
    - locked <0x00000000ecfb7038> (a org.apache.catalina.core.StandardEngine)
    at org.apache.catalina.core.StandardEngine.startInternal(StandardEngine.java:262)
    - locked <0x00000000ecfb7038> (a org.apache.catalina.core.StandardEngine)
    at org.apache.catalina.util.LifecycleBase.start(LifecycleBase.java:145)
    - locked <0x00000000ecfb7038> (a org.apache.catalina.core.StandardEngine)
    at org.apache.catalina.core.StandardService.startInternal(StandardService.java:441)
    - locked <0x00000000ecfb7038> (a org.apache.catalina.core.StandardEngine)
    at org.apache.catalina.util.LifecycleBase.start(LifecycleBase.java:145)
    - locked <0x00000000ecfa2330> (a org.apache.catalina.core.StandardService)
    at org.apache.catalina.core.StandardServer.startInternal(StandardServer.java:789)
    - locked <0x00000000ecf4e258> (a java.lang.Object)
    at org.apache.catalina.util.LifecycleBase.start(LifecycleBase.java:145)
    - locked <0x00000000ecf1c578> (a org.apache.catalina.core.StandardServer)
    at org.apache.catalina.startup.Catalina.start(Catalina.java:641)
    at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.lang.reflect.Method.invoke(Method.java:498)
    at org.apache.catalina.startup.Bootstrap.start(Bootstrap.java:349)
    at org.apache.catalina.startup.Bootstrap.main(Bootstrap.java:483)

"VM Thread" os_prio=0 tid=0x00007f3dc406d800 nid=0x51fb runnable

"VM Periodic Task Thread" os_prio=0 tid=0x00007f3dc40b7000 nid=0x5202 waiting on condition

JNI global references: 59
```

- localhost-startStop-1：线程名
- daemon：后台线程
- prio：优先级
- os_prio：系统优先级
- tid：线程id
- nid：操作系统id
- java.lang.Thread.State：线程状态；NEW-线程尚未启动， RUNNABLE- 线程运行中，BLOCKED-等待一个锁， WAITINH-等待另一个线程， TIMED_WAITING-限时等待另一个线程， TERMINATED-已退出

#### 实战死循环

```bash
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CpuController {
    
    /**
     * 死循环
     * */
    @RequestMapping("/loop")
    public List<Long> loop(){
        String data = "{\"data\":[{\"partnerid\":]";
        return getPartneridsFromJson(data);
    }
    
    private Object lock1 = new Object();
    private Object lock2 = new Object();
    
    /**
     * 死锁
     * */
    @RequestMapping("/deadlock")
    public String deadlock(){
        new Thread(()->{
            synchronized(lock1) {
                try {Thread.sleep(1000);}catch(Exception e) {}
                synchronized(lock2) {
                    System.out.println("Thread1 over");
                }
            }
        }) .start();
        new Thread(()->{
            synchronized(lock2) {
                try {Thread.sleep(1000);}catch(Exception e) {}
                synchronized(lock1) {
                    System.out.println("Thread2 over");
                }
            }
        }) .start();
        return "deadlock";
    }
    public static List<Long> getPartneridsFromJson(String data){  
        //{\"data\":[{\"partnerid\":982,\"count\":\"10000\",\"cityid\":\"11\"},{\"partnerid\":983,\"count\":\"10000\",\"cityid\":\"11\"},{\"partnerid\":984,\"count\":\"10000\",\"cityid\":\"11\"}]}  
        //上面是正常的数据  
        List<Long> list = new ArrayList<Long>(2);  
        if(data == null || data.length() <= 0){  
            return list;  
        }      
        int datapos = data.indexOf("data");  
        if(datapos < 0){  
            return list;  
        }  
        int leftBracket = data.indexOf("[",datapos);  
        int rightBracket= data.indexOf("]",datapos);  
        if(leftBracket < 0 || rightBracket < 0){  
            return list;  
        }  
        String partners = data.substring(leftBracket+1,rightBracket);  
        if(partners == null || partners.length() <= 0){  
            return list;  
        }  
        while(partners!=null && partners.length() > 0){  
            int idpos = partners.indexOf("partnerid");  
            if(idpos < 0){  
                break;  
            }  
            int colonpos = partners.indexOf(":",idpos);  
            int commapos = partners.indexOf(",",idpos);  
            if(colonpos < 0 || commapos < 0){  
                //partners = partners.substring(idpos+"partnerid".length());//1  
                continue;
            }  
            String pid = partners.substring(colonpos+1,commapos);  
            if(pid == null || pid.length() <= 0){  
                //partners = partners.substring(idpos+"partnerid".length());//2  
                continue;
            }  
            try{  
                list.add(Long.parseLong(pid));  
            }catch(Exception e){  
                //do nothing  
            }  
            partners = partners.substring(commapos);  
        }  
        return list;  
    }  
    
}
```

访问/loop端点三次，然后使用top命令：

![jvm](/images/jvm/jvm22.png)

```bash
#导出线程堆栈
$ jstack 7930 > 7930.txt
#打印该进程下的线程
$ top -p 7930 -H
```

![jvm](/images/jvm/jvm23.png)

```bash
#将十进制线程id转换为16进制
$ printf "%x" 8247
2037
```

然后在导出的7930.txt文件中找到2037

![jvm](/images/jvm/jvm24.png)

访问/loop端点，制造死循环，使用jstack命令导出线程堆栈信息：

![jvm](/images/jvm/jvm25.png)

最后一行已提示：Found 1 deadlock
