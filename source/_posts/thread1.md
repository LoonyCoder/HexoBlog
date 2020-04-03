---
title: Java多线程基础
categories:
    - Java
    
date: 2019-04-19 21:25:15
tags:
  - 线程
  - 并发

---

### 写在前面

在我们工作和学习的过程中，Java线程我们或多或少的都会用到，但是在使用的过程上并不是很顺利，会遇到各种各样的坑，这里我通过讲解Thread类中的核心方法，以求重点掌握以下关键技术点：

- 线程的启动
- 如何使线程暂停
- 如何使线程停止
- 线程的优先级
- 线程安全相关的问题

---

#### 什么是进程和线程？

- **进程** - 进程是具有一定独立功能的程序（例如QQ.exe），关于某个数据集合上的一次运行活动，进程是系统进行资源分配和调度的一个独立单位。
- **线程** - 线程是进程的一个实体，是CPU调度和分派的基本单位，它是比进程更小的能独立运行的基本单位；线程自己基本上不拥有系统资源，只拥有一点在运行中必不可少的资源(如程序计数器，一组寄存器和栈)，但是它可与同属一个进程的其他的线程共享进程所拥有的全部资源。

一个线程可以创建和撤销另一个线程；同一个进程中的多个线程之间可以并发执行。

相对进程而言，线程是一个更加接近于执行体的概念，它可以与同进程中的其他线程共享数据，但拥有自己的栈空间，拥有独立的执行序列。

在串行程序基础上引入线程和进程是为了提高程序的并发度，从而提高程序运行效率和响应时间。

#### 多线程的优点

其实多线程从某方面可以等价于多任务，当你有多个任务要处理时，多个任务一起做所消耗的时间肯定比任务串行起来做，所消耗的时间短；下图可以很好的说明：
![单任务运行环境与多任务运行环境比较](/images/thread/thread1.png)

在我们现在的系统中，CPU的运行速度是很快的，其中很大的时间消耗是在等硬盘、IO输入、网络等资源；当多任务时，CPU完全可以在多个任务之间来回切换。使用的花费的时间远远少于所有任务需要消耗的少。

#### 使用多线程

在Java的JDK包中，已经自带了对多线程技术的支持，可以非常方便地进行多线程的编程。实现多线程编程的方式主要有两种：

- 继承Thread类
- 实现Runnable接口

![接口实现](/images/thread/thread2.png)

从上面的类图中发现，Thread类实现了Runnable接口，它们之间具有多态关系。

Runnable接口类源代码：
```bash
@FunctionalInterface
public interface Runnable {
   public abstract void run();
}
```
Thread类的主要源代码：
```bash
public class Thread implements Runnable {
  public static native Thread currentThread();
  public static native void yield();
  public static native void sleep(long millis) throws InterruptedException;
  public static void sleep(long millis, int nanos) throws InterruptedException {
    // ...
    sleep(millis);
  }
  public Thread() {
    init(null, null, "Thread-" + nextThreadNum(), 0);
  }
   public Thread(Runnable target) {
      init(null, target, "Thread-" + nextThreadNum(), 0);
   }
  public Thread(ThreadGroup group, Runnable target) {
        init(group, target, "Thread-" + nextThreadNum(), 0);
  }

  public synchronized void start() {
    // ...
    start0(); 
    // ...
  }
  private native void start0();
  @Deprecated
  public final void stop() {
    // ...
  }
  public void interrupt() {
     // ...
  }
  public static boolean interrupted() {
     return currentThread().isInterrupted(true);
  }
  public boolean isInterrupted() {
      return isInterrupted(false);
  }
  private native boolean isInterrupted(boolean ClearInterrupted);
  public final native boolean isAlive();
  @Deprecated
  public final void suspend() {
        checkAccess();
        suspend0();
  }
  @Deprecated
  public final void resume() {
        checkAccess();
        resume0();
  }
}
```

**这二种创建线程的方式有什么区别？**

这个主要是因为Java类是单继承的，而接口可以支持多继承，使用Thread类的方式创建新线程时，最大的局限就是不支持多继承。所以具体选择哪种方式来创建线程，就看你是不是需要具体多继承的特性；其他没有本质的区别。

#### Thread详解

通过Thread的源代码，我们现在对其主要的的一些方法进行讲解一下

- **native关键字** - native是与C++联合开发的时候用的！使用native关键字说明这个方法是原生函数，也就是说这个方法是用C/C++语言实现的，并且被编译成dll相关组件，由java来调用。所以从上面的Thread类源代码中可以看到，有好多是调用了原生的函数。
- **构造方法** - Thread有一组构造方法，具体指定了<code>线程名称(name)</code>、<code>线程组(ThreadGroup)</code>、<code>接口类(Runnable)</code>、<code>栈大小(stackSize)</code>等参数 具体如下：

> public Thread()
> public Thread(Runnable target)
> Thread(Runnable target, AccessControlContext acc)
> public Thread(ThreadGroup group, Runnable target)
> public Thread(String name)
> public Thread(ThreadGroup group, String name)
> public Thread(Runnable target, String name)
> public Thread(ThreadGroup group, Runnable target, String name)
> public Thread(ThreadGroup group, Runnable target, String name, long stackSize)

- **isAlive()** - 方法isAlive()是判断当前的线程是否处于活动状态。而这个活动状态指的是：线程已经启动且尚未终止，如<code>正在运行,准备开始运行</code>的状态，都认为线程是"存活"的。
- **sleep()** - 在指定的毫秒数内让当前“正在执行的线程”休眠（暂停执行）。这个“正在执行的线程”是指<code>this.currentThread()</code>返回的线程。
- **getId()** - 取得线程的唯一标识。每个线程在初始化的过程中都会调用<code>nextThreadID</code>方法获取到一个唯一标识。
> ```bash
private static long threadSeqNumber;
private static synchronized long nextThreadID() {
   return ++threadSeqNumber;
} 
```
> 在一个进程中，线程的ID是唯一的

- **停止线程** - 停止线程是在多线程开始时很重要的技术点，而停止线程在Java中并不像break语句那样干脆，需要一些技巧性的处理。
> 在Java中有以下3种方法可以终止正在运行的线程：
> - 使用退出标志，使线程正常退出，即当run方法完成后线程终止。
> - 使用stop方法强行终止线程，但是不推荐使用该方法，因为stop和suspend及resume一样，都是作废过期的方法，使用它们可能产生不可预料的结果。
> - 使用interrupt方法中断线程。

- **暂停线程** - 暂停线程意味着此线程还可以恢复运行。使用<code>suspend()</code>方法暂停线程，<code>resume()</code>方法恢复线程的执行。
yield - <code>yield()</code>方法的作用是放弃当前的CPU资源，将它让给其他的任务去占用CPU执行时间。但是放弃的时间不确定，有可能刚放弃，马上又获得CPU时间片了。

线程优先级 - 在操作系统中，线程可以划分优先级，优先级较高的线程得到的CPU资料较多，也就是CPU优先执行优先级较高的线程对象中的任务。在Thread中，我们使用<code>setPriority()</code>方法设置优先级别。

> Java的线程优先级分为1~10这10个等级
public final static int MIN_PRIORITY = 1;
public final static int NORM_PRIORITY = 5;
public final static int MAX_PRIORITY = 10;
> - 线程优先级具有继承特性，比如A线程启动B线程，则B线程的优先级与A是一样的。
> - 优先级具有规则性，虽然我们使用<code>setPriority()</code>方法设置了优先级，但是真正执行的过程中，不会保证优先级高的线程绝对比优先级低的线程优先完成。即<code>CPU尽量CPU尽量将执行资源让给优先级比较高的线程</code>。
优先级具有随机性，具优先级较高的线程不一定每一次都先执行完。
- **守护线程** - 在Java线程中有两种线程，一种是用户线程，另一种是守护线程。
> 守护线程是一种特殊的线程，它的特性有"陪伴"的含义，当进程中不存在非守护线程了，则守护线程自动销毁。
典型的守护线程就是垃圾回收线程，当进程中没有非守护线程了，则垃圾回收线程则没有存在的必要了，自动销毁。
只要当前JVM实例中存在任何一个非守护线程没有结束，守护线程就在工作，只有当最后一个非守护线程结束时，守护线程才随着JVM一同结束工作。
通过调用<code>Thread.setDaemon(true)</code>设置是否为守护线程。

