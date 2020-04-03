---
title: Java多线程状态切换及基本操作
categories:
    - Java
    
date: 2019-04-28 22:21:15
tags:
  - 线程
  - 并发

---

#### 写在前面

上篇文章我们讲了Java多线程的基础知识，本文将拓展讲解一下Java多线程状态及状态之间的切换问题，以及常用的基本操作。

---

#### 线程调度

##### 什么是线程调度

线程调度就是系统为线程分配执行时间的过程。

##### 线程调度的方式

根据线程调度的控制权是由系统控制或者线程本身来控制划分为：协同式的线程调度和抢占式的线程调度。

1. 协同式线程调度：线程之间的系统执行时间，由线程本身进行进行控制。这种线程调度方式就像接力赛，一个执行完毕后交由下一个接力。如当前线程执行完毕后，通知系统调度到其他线程执行。
- 协同的好处：线程的切换是可预知的。线程之间不存在同步的问题。
- 协同的坏处：协同调度的致命缺点是当某个线程执行有问题的时候，会导致整个运行阻塞和系统崩溃。

2. 抢占式线程调度：线程之间的系统执行时间，是由系统进行控制。而抢占式的线程调度对线程的不可预知，系统定期的中断当前正在执行的线程，将CPU执行权切换到下一个等待的线程。所以任何一个线程都不能独占CPU。正因为这种定期的线程切换导致线程之间存在不同的问题。当线程执行过程中，某个线程出现问题的时候，由线程对CPU不具有独占性。因此不会造成阻塞。

> 我们所使用的操作系统都是是用抢占性的线程调度。如果使用协同式的线程调度情况下，如果我们再使用某个软件出现问题时候，操作系统处于阻塞状态，导致整个操作系统崩溃，我们肯定会抓狂。

3. JAVA线程调度：Java线程调度就是抢占式调度。

#### Java线程的实现方式

JAVA提供了3中创建线程的方式：

- Thread
  继承Thread类重写run方法，这种创建线程的方式在我们的编程中很少使用。
```bash
   private static class TheadExtends extends Thread{
       @Override
       public void run() {
           System.out.println("TheadExtends");
       }
   }
```

- Runnable
  既然JAVA提供了Thread创建线程的方式，为什么还要提供Runnable接口的方式进行创建线程？因为JAVA是单继承，不能多继承。因此就有了Runnable接口的方式来进行创建线程。
```bash
    private static class RunnableImpl implements Runnable{
        @Override
        public void run() {
            System.out.println("RunnableImpl");
        }
    }
```

- Callable
  Callable接口与Runnable接口的区别在于Callable在线程调用完毕后有返回结果，而Runnable没有，而对于一些业务处理比较耗时并且无需立即返回处理结果的情况下，我们都会通过asynchronous+Future的方式处理，而对于这种业务情景我们可以通过Callable进行处理。
```bash
public class ThreadImplement {

    private static class CallableImpl implements Callable<String>{

        @Override
        public String call() throws Exception {
            Thread.sleep(2000);
            return "Callable";
        }
    }

    public static void main(String[] args) throws InterruptedException, ExecutionException {
        
        CallableImpl callableImpl=new CallableImpl();
        FutureTask<String> futureTask = new FutureTask<String>(callableImpl);
        Thread  CallableThread= new Thread(futureTask);
        CallableThread.start();
        System.out.println(futureTask.get());
    }
}
```

#### JAVA线程状态转换

##### Java线程状态转换图
![线程状态转换图](/images/thread/thread3.png)

##### Java线程状态
JAVA线程状态包括：

- <code>New</code>：新创建一个线程是处于该状态。

- <code>Runnable</code>：线程的调度是由操作系统可以决定，因此Runnable是包含Ready和Running。当我们调用了<code>start()</code>方法后，当前的线程处于一个Ready的状态，等待操作系统线程调用到当前线程分配CPU执行时间，若当前线程获得CPU执行时间时，线程就处于一个Running的状态。而在Running状态的情况下，我们可以调用<code>yield()</code>方法，放弃当前线程的CPU执行。而调用yield后当前线程处于一个Ready的状态，这种状态下操作系统在线程调度的时候分配CPU执行时间给当前的线程。

- <code>Blocked</code>：阻塞状态下代表着当前的线程被挂起。而这挂起的原因的线程在等待一个锁。如我们在一个方法或者代码块中使用Synchronized时，同一时间有2个线程进入该方法的时候，先获取到锁的线程执行。而没有获得锁的线程就处于这种阻塞状态。

- <code>WAITING</code>：等待状态下，当前线程不被执行和操作系统不会给该线程进行线程调度。而当前线程处于等待其他线程唤醒。只有被唤醒后，操作系统才会给该线程进行线程调度。这种线程的等待的主要作用是为了线程之间的协作。一般情况下通过Synchronized获得锁后，调用锁的wait的方法进入等待状态，而调用wait方法后，当前的线程会释放锁，而另外一个线程获得锁后，通过<code>notifyall()/notify()</code>进行唤醒处于等待的线程。

- <code>TIMED_WAITING</code>：处于这种有限期的等待的情况下，在限期内当前线程不会被执行和操作系统不会给该线程进行线程调度。在限期过后，操作系统才给该线程进行线程调度。

- <code>TERMINATED</code>：该状态下线程处于终止，而这种终止引起的原因分为正常的执行完毕的终止和非正常情况下的终止，而非正常情况下可能是线程执行异常或者调用<code>interrupt()</code>中止线程引起。

#### 多线程编程

##### 多线程编程的好处
- 充分利用CPU的资源。
- 加快请求响应
- 异步化

##### 多线程带来的问题
- 设计更复杂
  - 线程之间是共享进程资源，存在资源冲突。
  - 线程之间的协作往往是非常复杂。若不能正确的使用锁的机制，通常会造成数据错误，整个业务功能出现问题。
- 上下文切换的开销
- 增加资源消耗，多线程变成是一种空间换时间的方式。线程在运行的时候需要从计算机里面得到一些资源。除了CPU，线程还需要一些内存来维持它本地的堆栈，若开启过多的线程时会导致程序占用过多的内存和机器崩溃。

#### 线程基本操作

**interrupt**

- JAVA提倡通过协作的方式结束线程，而不是使用强制停止的方式进行结束线程如<code>stop()</code>，<code>resume()</code>,<code>suspend()</code>已不建议使用，<code>stop()</code>会导致线程不会正确释放资源，<code>suspend()</code>容易导致死锁。那么怎样协同的方式结束线程呢？就是同过Thread的<code>interrupt()</code>方法进行协作中断线程。而调用interrupt方法是在线程中设置一个中断的标志位，中断标志默认为false。被中断的线程通过循环的方式监听这个标志位确定当前线程需要中断。
```bash
    public static class SafeEndRunnable implements Runnable{

        @Override
        public void run() {
            System.out.println("flag = "+Thread.currentThread().isInterrupted());
            while(!Thread.currentThread().isInterrupted()) {
                System.out.println(Thread.currentThread().getName()+"running");
            }
            System.out.println(Thread.currentThread().getName()+"is end ,flag = "+Thread.currentThread().isInterrupted());
        }
    }

    
    public static void main(String[] args) throws InterruptedException {
        SafeEndRunnable safeEndRunnable = new SafeEndRunnable();
        Thread t1 = new Thread(safeEndRunnable);
        t1.start();
        Thread.sleep(1);
        t1.interrupt();
}
输出：
flag = false
Thread-0running
Thread-0running
Thread-0running
Thread-0running
Thread-0is end ,flag = true
```

- 相关方法

方法名 | 方法类型 | Demo | 描述
:- | :- | :- |:- 
isInterrupted | 对象方法 | <code>Thread.currentThread().isInterrupted()</code> | 判断当前线程是否处于中断状态
interrupt | 对象方法 | <code>Thread.currentThread().interrupt()</code> | 设置标志位为true
interrupted | 静态方法 | <code>Thread.interrupted()</code> | 判断当前线程是否处于中断状态并且设置中断状态为false

- 在进行协作处理线程结束的时候清除标志位。在我们的被中断的线程中如果使用到了sleep方法时，如果中断线程调用时，该线程处于sleep时，会抛出InterruptedException，如果使用进行try/catch捕捉该异常的时候会清除标志位。所以我们需要再调用被中断的线程的<code>interrupt()</code>方法。

```bash
public static class SafeEndThread implements Runnable{
        @Override
        public void run() {
            while(!Thread.currentThread().isInterrupted()) {
                System.out.println(Thread.currentThread().getName()+"running");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e){
                    e.printStackTrace();
                    System.out.println("flag = "+Thread.currentThread().isInterrupted());
                    Thread.currentThread().interrupt();
                }
            }
            System.out.println(Thread.currentThread().getName()+"is end ,flag = "+Thread.currentThread().isInterrupted());          
        }
            
    public static void main(String[] args) throws InterruptedException {
        SafeEndThread safeEndThread = new SafeEndThread();
        Thread t2 = new Thread(safeEndThread);
        t2.start(); 
        Thread.sleep(1);
        t2.interrupt();
    }
输出：
Thread-0running
java.lang.InterruptedException: sleep interrupted
flag = false
Thread-0is end ,flag = true
```

**yield**

yield的主要作用的是让出CPU的执行时间，需要注意的时候，调用yield虽然让出了CPU的执行时间，但是会参与下一次的CPU执行时间的竞争中，如果当前线程重新获得CPU执行时间，那么当前的线程再次执行。如下：

```bash
public static class ThreadYieldRunnable implements Runnable{

        @Override
        public void run() {
            for (int i = 0; i < 20; i++) {
                System.out.println(Thread.currentThread().getName()+"running"+i);
                Thread.yield();
            }
        }
    }
    
    public static void main(String[] args) {
        ThreadYieldRunnable threadYieldRunnable= new ThreadYieldRunnable();
        Thread t1 = new Thread(threadYieldRunnable);
        t1.start();
        try {
            Thread.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("t1.yield");
    }

输出：
Thread-0running0
Thread-0running1
t1.yield
Thread-0running2
Thread-0running3
Thread-0running4
Thread-0running5
Thread-0running6
Thread-0running7
Thread-0running8
Thread-0running9
Thread-0running10
Thread-0running11
Thread-0running12
Thread-0running13
Thread-0running14
Thread-0running15
Thread-0running16
Thread-0running17
Thread-0running18
Thread-0running19
```

#### 线程共享

锁的主要作用是保护临界区资源，在多线程访问临界区时互斥。那么在线程访问共享的资源时，JAVA提供了以下保存线程之间的线程共享资源。

**Synchronized**
- Synchronized的实现方式
方式 | 锁对象 | Demo
:- | :- | :- 
对象同步 | 当前对象 | <code>synchronized void demo()</code>
静态同步 | 当前类 | <code>static synchronized void demo()</code>
代码块 | 当前对象、其他对象、类 | <code>Demo demo = new Demo(); synchronized (demo) {}<br>synchronized (this){}<br>synchronized(Demo.class) {}</code>

- Synchronized的综述
  1. Synchronized主要作用实现同步。而这种同步是通过互斥锁来保证多线程访问时实现同步。即在同一时间内只有一个线程可以访问临界区的资源，同时保证了共享资源的可预见性和原子性。
  2. Synchronized的使用：可以在方法定义中使用，也可以使用同步代码块的形式使用。在使用Synchronized的时候，尽量使用代码块的形式，将同步的操作控制在最小的粒度中。如果使用在Synchronized在方法定义中，那么该方法中不存在锁竞争的部分会被同步。如果该方法高并发情况下，可能会导致多线程等待从而引起应用dump掉。

- Synchronized死锁
  死锁引起的原因是由于两个线程之间，相互持有对象的锁和相互等待对象释放锁。在使用Synchronized的时候不允许出现死锁的情况。
```bash
    public static void main(String[] args) {
        Object lock1 = new Object();
        Object lock2 = new Object();
        Thread t1 = new Thread(() -> {
            synchronized (lock1) {
                System.out.println("Thread1 get locke1");
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                synchronized (lock2) {
                    System.out.println("Thread1 get locke2");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (lock2) {
                System.out.println("Thread2 get locke2");
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                synchronized (lock1) {
                    System.out.println("Thread2 get locke1");
                }
            }

        });
        t1.start();
        t2.start();
    }
```

- 避免使用常量池对象作为锁对象
  Java为我们提供了String、Integer、Long常量池，因此我们再使用这些常量池的对象作为锁对象的时候，会存在锁隐患。
```bash
public class ConstLock implements Runnable {
    private Object  lock ;
    
    public ConstLock(Object lock) {
        super();
        this.lock = lock;
    }

    public void run() {
        synchronized (lock) {
            while(true) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    // TODO Auto-generated catch block
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread().getName()+"sayHello");
            }
        }
    }
    
    public static void main(String[] args) {
        ConstLock constLock1 = new ConstLock("lock");
        ConstLock constLock2 = new ConstLock("lock");
        Thread t1 = new Thread(constLock1,"Thread1");
        Thread t2 = new Thread(constLock2,"Thread2");
        t1.start();
        t2.start();
    }
    public static void main(String[] args) {
        ConstLock constLock1 = new ConstLock(21);
        ConstLock constLock2 = new ConstLock(21);
        Thread t1 = new Thread(constLock1,"Thread1");
        Thread t2 = new Thread(constLock2,"Thread2");
        t1.start();
        t2.start();
    }
    
    public static void main(String[] args) {
        ConstLock constLock1 = new ConstLock(21l);
        ConstLock constLock2 = new ConstLock(21l);
        Thread t1 = new Thread(constLock1,"Thread1");
        Thread t2 = new Thread(constLock2,"Thread2");
        t1.start();
        t2.start();
    }

}

输出：
Thread1sayHello
Thread1sayHello
Thread1sayHello
```

**volatile关键字**

volatile是JAVA中提供的一种轻量级的同步机制。而这种轻量级的同步机制是通过线程之间的通讯来保证。而不是通过锁的机制进行处理。因此不会对执行的线程造成阻塞。

- 线程通讯过程
![线程通讯过程](/images/thread/thread4.png)

- volatile主要作用
  1. 确保了所有的线程对volatile修饰的变量具有可见性。
  2. 禁止操作系统指令重排序，如果变量没有被volatile表示禁止指令重排优化的情况下。操作系统默认会对不相关的执行指令进行重排序提高执行的效率。
```bash
public class Reorder {

    public static int x = 0;
    public static int y = 0;
    public static int a = 0;
    public static int b = 0;

    public static void main(String[] args) throws InterruptedException {
        Thread thread1 = new Thread(()->{
            a = 1;
            x = b;
        }) ;
        Thread thread2 = new Thread(()->{
            b = 1;
            y = a;
        });
        thread1.start();
        thread2.start();
        thread1.join();
        thread2.join();
        System.out.println("x=" + x + ";y=" + y);
    }
}
```

如没有禁止指令重排序就会出现:x=1;y=0、x=0;y=1、x=1;y=1、x=0;y=0四种结果。

![结果](/images/thread/thread5.png)

- volatile原子性
  - 原子性表示一个操作或者多个操作的情况下，要么全部执行成功，要么全部执行失败。
  - volatile在符合条件以下条件的情况下具有原子性：
    1. 对volatile修饰的变量的操作不依赖变量本身，如i++这种复合操作不具有原子性。代码如下：
    ```bash

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            Thread thread = new Thread(new Runnable() {
                @Override
                public void run() {
                    for (int i = 0; i < 10000; i++)
                        counter++;
                }
            });
            thread.start();
        }
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println(counter);
    }
    ```
    2. 确保只有一个线程修改变量的值的情况。

- volatile适用场景
  1. 禁止系统重排序的情况
  2. 只有一个线程写，多个线程读的情况。

**ThreadLocal**

ThreadLocal是一个线程本地存储，而每个线程有自己独立的副本。也就是说每个线程可以存放各自变量到线程本地存储中，并且线程之间各自访问各自的线程本地存储。当线程结束后，线程的本地存储会被垃圾回收。如果线程本地存储中的变量被其他引用到的情况下，是不会被回收。我们可以把ThreadLocal看作一个Map<Thread,Object>。

```bash
static ThreadLocal<Integer> threadLocal = new ThreadLocal<Integer>() {
        protected Integer initialValue() {
            return 1;
        };
    };

    public void startThread() {
        for (int i = 0; i < 2; i++) {
            Thread t1 = new Thread(new ThreadLocalRunnable(i));
            t1.start();
        }

    }

    @Data
    @AllArgsConstructor
    public static class ThreadLocalRunnable implements Runnable {

        private int id;

        @Override
        public void run() {
            System.out.println(Thread.currentThread().getName() + "  id=" + id);
            int beforeId = threadLocal.get();
            int afterId = beforeId + id;
            threadLocal.set(afterId);
            System.out.println(Thread.currentThread().getName() + "  after id =" + threadLocal.get());
        }

    }

    public static void main(String[] args) {
        new UseThreadLocal().startThread();
    }
输出：
Thread-0  id=0
Thread-0  after id =1
Thread-1  id=1
Thread-1  after id =2
```





