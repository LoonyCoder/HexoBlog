---
title: 杂记
categories:
    - Interview
    
date: 2020-2-14
tags:
	- Java
    - 面试题
---

近些日子在拉勾网上看到了史上最难Java题，顺便答了一下，结果10道题错了6道，表示十分遗憾。后愤然去网上搜集各种资料，果然还是太年轻，于此记录以告诫自己，学无止境！

### Apache Dubbo的默认集群容错方案

A、Failover Cluster
B、Failfast Cluster
C、Failsafe Cluster
D、Failback Cluster

**答案：A**

**解析：**
Dubbo提供了随机、轮询、最少调用优先等多种负载均衡策略，提供对zk等多种注册中心等支持，能够自动完成服务的注册与发现。Dubbo提供可视化的管理后台，方便对服务状态进行监控和管理。dubbo的数据通信默认使用netty来实现，拥有非常不错的性能。Dubbo默认的容错方案是Failover Cluster，即：失败自动切换，当出现失败，重试其它服务器。

除此之外，还提供以下其他容错方式：

- Failfast Cluster
快速失败，只发起一次调用，失败立即报错。通常用于非幂等性的写操作，比如新增记录。
- Failsafe Cluster
失败安全，出现异常时，直接忽略。通常用于写入审计日志等操作。
- Failback Cluster
失败自动恢复，后台记录失败请求，定时重发。通常用于消息通知操作。
- Forking Cluster
并行调用多个服务器，只要一个成功即返回。通常用于实时性要求较高的读操作，但需要浪费更多服务资源。可通过 forks="2" 来设置最大并行数。
- Broadcast Cluster
广播调用所有提供者，逐个调用，任意一台报错则报错 。通常用于通知所有提供者更新缓存或日志等本地资源信息。

---

### 下面关于Kafka说法错误的是:

A、消息是按照topic进行划分的，一个topic就是一个queue，一个topic可以有多个消费方，当生产方在某个topic发出一条消息后，所有订阅了这个topic的消费方都可以接受到这条消息
B、kafka为每个topic维护了多个partition分区，能保证一个topic的消息消费有序
C、所有的消息读写都是在主partition中进行，其他副本分区只会从主分区复制数据
D、消息的发送有三种方式：同步、异步、以及oneway，异步为默认方式

**答案：B、D**

**解析：**
![kafka](/images/kafka1.png)
![kafka](/images/kafka2.png)
Kafka只保证一个分区内的消息有序，**不能保证一个topic的不同分区之间的消息有序。**
为了保证较高的处理效率，所有的消息读写都是在主patition中进行，其他副本分区只会从主分区复制数据。Kafka会在Zookeeper上针对每个Topic维护一个称为ISR(in-sync replica)，就是已同步的副本集。如果某个主分区不可用了，Kafka就会从ISR集合中选择一个副本作为新的主分区。
消息的发送有三种方式：同步、异步以及oneway。**同步模式下后台线程中发送消息时同步获取结果，这也是默认模式。**
异步的模式允许生产者批量发送数据，可以极大的提高性能，但是会增加丢失数据的风险。oneway模式只发送消息不需要返回发送结果，消息可靠性最低，但是低延迟、高吞吐，适用于对可靠性要求不高的场景。

---

### 下面关于排序算法的描述正确的是:

A、冒泡排序和插入排序都是稳定的排序算法
B、如果数组已经按照顺序排好序，使用插入排序，时间复杂度是O(n)
C、快速排序每次选择最大值座位基准值能够加入排序过程
D、快速排序最好情况的时间复杂度是O(nlogn)

**答案：A、B、D**

**解析：**
快速排序时间复杂度：
1、 最优情况：被选出来的基准值都是当前子数组的中间数。
不断地把一个规模为 n 的问题分解成规模为 n/2 的问题，一直分解到规模大小为 1。如果 n 等于 2，只需要分一次;如果 n 等于 4，需要分 2 次，以此类推，对于规模为 n 的问题，一共要进行 log(n) 次的切分。
把规模大小为 n 的问题分解成 n/2 的两个子问题时，和基准值进行了 n-1 次比较，复杂度就是 O(n)。
因此，在最优情况下，快速排序的复杂度是 O(nlogn)。

2、最坏情况：基准值选择了子数组里的最大或者最小值
每次都把子数组分成了两个更小的子数组，其中一个的长度为 1，另外一个的长度只比原子数组少 1，这样就需要n次的切分。
因此，算法复杂度为 O(n²)。

---

### 以下有关JVM的说法正确的是:

A、程序计数器是一个比较小的内存区域，用于指示当前线程所执行的字节码执行到了第几行，是线程隔离的。
B、虚拟机栈描述的是Java方法执行的内存模型，用于存储局部变量，操作数栈，动态链接，方法出口等信息，是线程隔离的。
C、方法区用于存储JVM加载的类信息、常量、静态变量、以及编译器编译后的代码等数据，是线程共享的。
D、堆被所有线程共享，目的是为了存放对象实例，几乎所有的对象实例都在这里分配。当堆内存没有可用空间时，会抛出OOM异常

**答案：A、B、C、D**

**解析：**
**虚拟机栈** 也叫方法栈，是线程私有的，线程在执行每个方法时都会同时创建一个栈帧，用来存储局部变量表、操作栈、动态链接、方法出口等信息。调用方法时执行入栈，方法返回时执行出栈。
**本地方法栈** 与虚拟机栈类似，也是用来保存线程执行方法时的信息，不同的是，执行java方法使用虚拟机栈，而执行native方法使用本地方法栈。
**程序计数器** 保存着当前线程所执行的字节码位置，每个线程工作时都有一个独立的计数器。程序计数器为执行java方法服务，执行native方法时，程序计数器为空。
栈、本地方法栈、程序计数器这三个部分都是线程独占的。
**堆** 是JVM管理的内存中最大的一块，堆被所有线程共享，目的是为了存放对象实例，几乎所有的对象实例都在这里分配。当堆内存没有可用的空间时，会抛出OOM异常。根据对象存活的周期不同，jvm把堆内存进行分代管理，由垃圾回收器来进行对象的回收管理。
方法区 也是各个线程共享的内存区域，又叫非堆区。用于存储已被虚拟机加载的类信息、常量、静态变量、即时编译器编译后的代码等数据，JDK7中的永久代和JDK8中的Metaspace都是方法区的一种实现。

---

### 关于TCP的关闭过程，说法正确的是:

A、处于TIME_WAIT状态的连接等待2MSL后真正关闭连接
B、对一个established状态的TCP连接，在调用shutdown函数之前调用close接口，可以让主动调用的一方进入半关闭状态
C、主动发送FIN消息的连接端，收到对方回应ack之前不能发只能收，在收到对方回复ack之后不能发也不能收，进入CLOSING状态
D、虽然TCP是可靠传输，但在已经成功建立连接的TCP连接上，也可能存在报文丢失

**答案：A、D**

**解析：**
![TCP](/images/tcp1.png)
A、等待2倍最大报文段生存时间之后在关闭链接，原因有两个：
- 一、保证TCP协议的全双工连接能够可靠关闭
- 二、保证这次连接的重复数据段从网络中消失，防止端口被重用时可能产生数据混淆

B、shutdown可以使TCP半双工，但是如果之前调用了close，则直接关闭了socket

C、收到了ack之后的状态，也是不能发只能收，进入FIN_WAIT_2
通信中client和server两端的链接都是ESTABLISHED状态，然后client先主动发起了关闭链接请求，client向server发送了一个fin包，表示client端已经没有数据要发送了，然后client进入了FIN_WAIT_1状态。
server端收到fin后，返回ack，然后进入CLOSE_WAIT状态。此时server属于半关闭状态，因为此时client向server方向已经不会发送数据了，可是server向client端可能还有数据要发送。
当server端数据发送完毕后，server端会向client端发送fin，表示server端也没有数据要发送了，此时server进入LAST_ACK状态，就等待client的应答就可以关闭链接了。
client端收到server端的fin后，回复ack，然后进入TIME_WAIT状态。TIME_WAIT状态下需要等待2倍的最大报文段生存时间，来保证链接的可靠关闭。之后才会进入CLOSED关闭状态。而server端收到ack后直接就进入CLOSED状态。

D、由于TCP的下层网络（IP）可能出现丢失、重复或失序的情况，TCP协议提供可靠数据传输服务。为保证数据传输的正确性，TCP会重传其认为已丢失（包括报文中的比特错误）的包。

---

### 关于B+树比B树更适合做索引，以下说法正确的是:

A、叶节点之间有指针相连，B+树更适合范围检索
B、非叶节点只保存关键字和指针，同样大小非叶节点，B+树可以容纳更多的关键字，可以降低树高，查询时磁盘读写代价更低
C、B+树的查询效率比较稳定。任何关键字的查找必须走一条从根节点到叶节点的路。所有关键字查询的路径长度相同，效率相当
D、非叶节点上，增加了指向同一层下一个非叶节点的指针，将节点的最低利用率从1/2提高到2/3

**答案：A、B、C**

**解析：**
B+树更适合索引系统，原因有：
1、由于叶节点之间有指针相连，B+树更适合范围检索;
2、由于非叶节点只保存关键字和指针，同样大小非叶节点，B+树可以容纳更多的关键字，可以降低树高，查询时磁盘读写代价更低;
3、B+树的查询效率比较稳定。任何关键字的查找必须走一条从根结点到叶子结点的路。所有关键字查询的路径长度相同，效率相当。

---

### 以下关于Netty说法，正确的是:

A、Netty线程模型采用"服务端监听线程"和"IO线程"分离的方式
B、通常情况下在NIO非阻塞模式下，Netty为每个Channel分配一个EventLoop，并且它的整个生命周期的时间都由这个EventLoop来处理
C、一个EventLoop可以绑定多个Channel
D、一般接收消息时，由pipeline处理完成会把消息提交到业务线程池进行处理

**答案：A、B、C、D**

**解析：**
Netty线程模型采用“服务端监听线程”和“IO线程”分离的方式，boss线程组负责监听事件，创建socket并绑定到Worker线程组。
Worker线程组负责IO处理。线程组由EventLoopGroup实现，其中包含了多个EventLoop事件处理器，每个EventLoop包含一个处理线程。
通常情况下在NIO非阻塞模式下，Netty为每个Channel分配一个EventLoop，并且它的整个生命周期中的事件都由这个EventLoop来处理。
一个EventLoop可以绑定多个Channel。
EventLoop的处理模型，Netty4中Channel的读写事件都是由Worker线程来处理。
请求处理中最主要的就是ChannelPipeline，其中包含了一组ChannelHandler。
这些Handler组成了责任链模式，依次对Channel中的消息进行处理。
一般接收消息时，由pipeline处理完成会把消息提交到业务线程池进行处理，当业务线程处理完成时，会封装成task，提交回Channel对应的EventLoop来写回返回值。

### Mybatis在执行SQL时，正确的调用顺序是:

①SqlSessionFactory
②SqlSession
③StatementHandler
④ParameterHandler
⑤ResultSetHandler
⑥Executor
⑦TypeHandler

A、①②③④⑤⑥⑦
B、①②⑥③④⑦⑤
C、①②④③⑦⑥⑤
D、①②③⑦④⑥⑤

**答案：B**

**解析：**
![mybatisflow](/images/mybatisflow.png)
在执行sql时，首先会从SqlSessionFactory中创建一个新的SqlSession。
sql语句是通过sqlSession中的Executor来执行，Executor根据SqlSession传递的参数执行query()方法，然后创建一个StatementHandler对象，将必要的参数传递给StatementHandler，由StatementHandler来完成对数据库的查询。
StatementHandler调用ParameterHandler的setParameters方法，把用户传递的参数转换成JDBC Statement所需要的参数， 调用原生JDBC来执行语句。
最后由ResultSetHandler的handleResultSets方法对JDBC返回的ResultSet结果集转换成对象集，并逐级返回结果，完成一次sql语句执行。

---

### 以下关于向线程池提交任务，正确的步骤是:

①判断是否达到了线程池设置的最大线程数，如果没有达到，就创建新线程来执行任务
②判断线程池中的线程数是否大于设置的核心线程数，创建核心线程执行任务
③判断缓冲队列是否满了，如果没满，放入队列等待执行
④执行拒绝策略

A、②①③④
B、②③①④
C、①②③④
D、①③②④

**答案：B**

**解析：**
![thread](/images/thread.png)
我们看看向线程池提交任务时的执行顺序。
向线程池提交任务时，会首先判断线程池中的线程数是否大于设置的核心线程数，如果不大于，就创建一个核心线程来执行任务。
如果大于核心线程数，就会判断缓冲队列是否满了，如果没有满，则放入队列，等待线程空闲时执行任务。
如果队列已经满了，则判断是否达到了线程池设置的最大线程数，如果没有达到，就创建新线程来执行任务。
如果已经达到了最大线程数，则执行指定的拒绝策略。

---

### 以下关于类的加载机制错误的是:

A、类的加载指的是将编译好的class类文件中的字节码读入到内存中，将其放在堆内并创建对应的Class对象
B、加载是文件到内存的过程。通过类的完全限定名查找类字节码文件，并利用字节码文件创建一个Class对象
C、准备阶段是进行内存分配。为类变量也就是类中由static修饰的变量分配内存，并且设置初始值是0或者null，而不是代码中设置的具体值
D、解析主要是解析字段、接口、方法。主要是将常量池中的符号引用替换为直接引用的过程。直接引用就是直接指向目标的指针、相对偏移量等。

**答案：A**

**解析：**
![classloader](/images/classloader.png)
类的加载指的是将编译好的class类文件中的字节码读入到内存中，将其放在方法区内并创建对应的Class对象。
类的加载分为加载、链接、初始化，其中链接又包括验证、准备、解析三步。
看到图中上半部分深绿色，我们逐个分析：
加载是文件到内存的过程。通过类的完全限定名查找此类字节码文件，并利用字节码文件创建一个Class对象
验证是对类文件内容验证。目的在于确保Class文件符合当前虚拟机要求，不会危害虚拟机自身安全。主要包括四种：
文件格式验证，元数据验证，字节码验证，符号引用验证。
准备阶段是进行内存分配。为类变量也就是类中由static修饰的变量分配内存，并且设置初始值，这里要注意，初始值是0或者null，而不是代码中设置的具体值，代码中设置的值是在初始化阶段完成的。另外这里也不包含用final修饰的静态变量，因为final在编译的时候就会分配了。
解析主要是解析字段、接口、方法。主要是将常量池中的符号引用替换为直接引用的过程。直接引用就是直接指向目标的指针、相对偏移量等。
最后是初始化：主要完成静态块执行与静态变量的赋值。这是类加载最后阶段，若被加载类的父类没有初始化，则先对父类进行初始化。
只有对类主动使用时，才会进行初始化，初始化的触发条件包括创建类的实例的时候、访问类的静态方法或者静态变量的时候、Class.forName()反射类的时候、或者某个子类被初始化的时候。
