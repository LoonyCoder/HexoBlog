---
title: Redis入门
categories:
    - 数据库
    
date: 2018-11-28
tags:
	- 数据库
    - Redis
---
![redis](/images/redis-logo.png)

### Redis 概述
在我们日常的Java Web开发中，无不都是使用数据库来进行数据的存储，由于一般的系统任务中通常不会存在高并发的情况，所以这样看起来并没有什么问题，可是一旦涉及大数据量的需求，比如一些商品抢购的情景，或者是主页访问量瞬间较大的时候，单一使用数据库来保存数据的系统会因为面向磁盘，磁盘读/写速度比较慢的问题而存在严重的性能弊端，一瞬间成千上万的请求到来，需要系统在极短的时间内完成成千上万次的读/写操作，这个时候往往不是数据库能够承受的，极其容易造成数据库系统瘫痪，最终导致服务宕机的严重生产问题。

---

### NoSQL 技术
为了克服上述的问题，Java Web项目通常会引入NoSQL技术，这是一种**基于内存的数据库**，并且提供一定的持久化功能。

**Redis**和**MongoDB**是当前使用最广泛的NoSQL，而就Redis技术而言，它的性能十分优越，可以**支持每秒十几万此的读/写操作**，其性能远超数据库，并且还**支持集群、分布式、主从同步等**配置，原则上可以无限扩展，让更多的数据存储在内存中，更让人欣慰的是它还**支持一定的事务能力**，这保证了高并发的场景下数据的安全和一致性。

---

### Redis 在 Java Web 中的应用
Redis 在 Java Web 主要有两个应用场景：

- 存储 **缓存** 用的数据；
- 需要高速读/写的场合**使用它快速读/写**；

#### 缓存
在日常对数据库的访问中，读操作的次数远超写操作，比例大概在 **1:9** 到 **3:7**，所以需要读的可能性是比写的可能大得多的。当我们使用SQL语句去数据库进行读写操作时，数据库就会**去磁盘把对应的数据索引取回来**，这是一个相对较慢的过程。

如果我们把数据放在 Redis 中，也就是直接放在内存之中，让服务端**直接去读取内存中的数据**，那么这样速度明显就会快上不少，并且会极大减小数据库的压力，但是使用内存进行数据存储开销也是比较大的，限于成本的原因，一般我们**只是使用 Redis 存储一些常用和主要的数据**，比如用户登录的信息等。

一般而言在使用 Redis 进行存储的时候，我们需要从以下几个方面来考虑：

- **业务数据常用吗？命中率如何？**如果命中率很低，就没有必要写入缓存；
- **该业务数据是读操作多，还是写操作多？**如果写操作多，频繁需要写入数据库，也没有必要使用缓存；
- **业务数据大小如何？**如果要存储几百兆字节的文件，会给缓存带来很大的压力，这样也没有必要；
在考虑了这些问题之后，如果觉得有必要使用缓存，那么就使用它！使用 Redis 作为缓存的读取逻辑如下图所示：
![redis](/images/redis8.png)
从上图我们可以知道以下两点：

1. 当**第一次读取数据的时候**，读取 Redis 的数据就会失败，此时就会触发程序读取数据库，把数据读取出来，并且写入 Redis 中；
2. 当**第二次以及以后需要读取数据时**，就会直接读取 Redis，读到数据后就结束了流程，这样速度就大大提高了。
从上面的分析可以知道，读操作的可能性是远大于写操作的，所以使用 Redis 来处理日常中需要经常读取的数据，速度提升是显而易见的，同时也降低了对数据库的依赖，使得数据库的压力大大减少。

分析了读操作的逻辑，下面我们来看看**写操作的流程**：
![redis](/images/redis9.png)
从流程可以看出，更新或者写入的操作，需要多个 Redis 的操作，如果业务数据写次数远大于读次数那么就没有必要使用 Redis。
> 关于使用内存存储数据，我知道谷歌好像就是**把所有互联网的数据都存储在内存条**的，所以才会有如此高质量、高效的搜索，但它毕竟是谷歌...

#### 高速读/写的场合
在如今的互联网中，越来越多的存在高并发的情况，比如天猫双11、抢红包、抢演唱会门票等，这些场合都是在某一个瞬间或者是某一个短暂的时刻有**成千上万的请求**到达服务器，如果单纯的使用数据库来进行处理，就算不崩，也会很慢的，**轻则造成用户体验极差用户量流失，重则数据库瘫痪，服务宕机**，而这样的场合都是不允许的！

所以我们需要使用 Redis 来应对这样的高并发需求的场合，我们先来看看一次**请求操作的流程图**：
![redis](/images/redis10.png)
我们来进一步阐述这个过程：

1. 当一个请求到达服务器时，只是把业务数据在 Redis 上进行读写，而没有对数据库进行任何的操作，这样就能大大提高读写的速度，从而满足**高速响应的需求**；
2. 但是这些缓存的数据仍然需要持久化，也就是存入数据库之中，所以在一个请求操作完 Redis 的读/写之后，会去**判断该高速读/写的业务是否结束**，这个判断通常会在秒杀商品为0，红包金额为0时成立，如果不成立，则不会操作数据库；如果成立，则触发事件将 Redis 的缓存的数据以批量的形式**一次性写入数据库**，从而完成持久化的工作。

---

### Redis 的安装

> 操作系统：CentOS 7
> redis版本：5.0

#### 下载安装包
```bash
$ wget http://download.redis.io/releases/redis-5.0.0.tar.gz
```
![redis](/images/redis11.png)
#### 解压安装包
```bash
$ tar -zxvf redis-5.0.0.tar.gz
```
![redis](/images/redis12.png)
没有报错就代表解压成功！
#### yum安装gcc依赖
```bash
$ yum install gcc
```
遇到选择，输入y即可
#### 编译&安装
```bash
$ cd redis-5.0.0/
$ make
$ make install
```
#### 测试是否安装成功
先切换到redis src目录下
```bash
$ cd src/
```
#### 直接启动redis
```bash
$ ./redis-server
```
![redis](/images/redis13.png)
如上图：redis启动成功，但是这种启动方式需要一直打开窗口，不能进行其他操作，不太方便。
按 ctrl + c可以关闭窗口。
#### 以后台进程方式启动redis
##### 第一步：修改redis.conf文件
redis.conf文件就在redis目录下
```bash
$ cd redis-5.0.0/
$ vim redis.conf
```
将**daemonize no**修改为**daemonize yes**
![redis](/images/redis14.png)
配置允许所有ip都可以访问redis，将bind 127.0.0.1注释掉:
![redis](/images/redis15.png)
并且将protected-mode改为no
![redis](/images/redis16.png)
##### 第二步：指定redis.conf文件启动
```bash
$ ./redis-server ~/redis-5.0.0/redis.conf 
```
![redis](/images/redis17.png)
##### 第三步：关闭redis进程
首先使用<code>ps -aux&brvbar;grep redis</code>查看redis进程
```bash
$ ps -aux | grep redis
```
![redis](/images/redis18.png)
使用kill命令杀死进程,并检查是否成功关闭
```bash
$ kill -9 2751
```
##### 第四步：检查是否开启了所有ip访问：
```bash
$ ps -ef |grep redis
```
如果端口号前面显示的是\*则说明客户端可以访问了，如果是127.0.0.1，则需要重新配置了。

#### 设置redis开机自启动
##### 在/etc目录下新建redis目录
```bash
$ cd /etc
$ mkdir redis
```
##### 将/root/redis-5.0.0/redis.conf文件复制一份到/etc/redis目录下，并命名为6379.conf
```bash
$ cp /root/redis-5.0.0/redis.conf /etc/redis/6379.conf
```
##### 将redis的启动脚本复制一份放到/etc/init.d目录下
```bash
$ cp /root/redis-5.0.0/utils/redis_init_script /etc/init.d/redisd
```
##### 设置redis开机自启动
先切换到/etc/init.d目录下，然后执行自启命令
```bash
$ chkconfig redisd on
```
如果redisd不支持chkconfig，使用vim编辑redisd文件，在第一行加入如下两行注释，保存退出
```bash
# chkconfig:   2345 90 10
# description:  Redis is a persistent key-value database
```
注释的意思是，redis服务必须在运行级2，3，4，5下被启动或关闭，启动的优先级是90，关闭的优先级是10。
再次执行开机自启命令，成功。
```bash
$ chkconfig redisd on
```

#### 以服务的形式启动和关闭redis
##### 启动
```bash
$ service redisd start
```
##### 关闭
```bash
$ service redisd stop
```
![redis](/images/redis19.png)

---

### 在 Java 中使用 Redis
#### 第一步：添加 Jedis 依赖
想要在 Java 中使用 Redis 缓存，需要添加相关的Jar包依赖，打开Maven仓库的网站：<https://mvnrepository.com/> ，搜索Jedis：
![redis](/images/redis20.png)
```bash
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>3.1.0</version>
</dependency>
```
写个简单的性能测试：
```bash
@Test
public void redisTester() {
    Jedis jedis = new Jedis("localhost", 6379, 100000);
    int i = 0;
    try {
        long start = System.currentTimeMillis();// 开始毫秒数
        while (true) {
            long end = System.currentTimeMillis();
            if (end - start >= 1000) {// 当大于等于1000毫秒（相当于1秒）时，结束操作
                break;
            }
            i++;
            jedis.set("test" + i, i + "");
        }
    } finally {// 关闭连接
        jedis.close();
    }
    // 打印1秒内对Redis的操作次数
    System.out.println("redis每秒操作：" + i + "次");
}
-----------测试结果-----------
redis每秒操作：99776次
```
#### 第二步：使用 Redis 连接池
跟数据库连接池相同，Java Redis也同样提供了类<code>redis.clients.jedis.JedisPool</code>来管理我们的Reids连接池对象，并且我们可以使用<code>redis.clients.jedis.JedisPoolConfig</code>来对连接池进行配置，代码如下：
```bash
JedisPoolConfig poolConfig = new JedisPoolConfig();
// 最大空闲数
poolConfig.setMaxIdle(50);
// 最大连接数
poolConfig.setMaxTotal(100);
// 最大等待毫秒数
poolConfig.setMaxWaitMillis(20000);
// 使用配置创建连接池
JedisPool pool = new JedisPool(poolConfig, "localhost");
// 从连接池中获取单个连接
Jedis jedis = pool.getResource();
// 如果需要密码
//jedis.auth("password");
```
Redis 只能支持六种数据类型（string/hash/list/set/zset/hyperloglog）的操作，但在 Java 中我们却通常以类对象为主，所以在需要 Redis 存储的五中数据类型与 Java 对象之间进行转换，如果自己编写一些工具类，比如一个角色对象的转换，还是比较容易的，但是涉及到许多对象的时候，这其中无论工作量还是工作难度都是很大的，所以总体来说，**就操作对象而言，使用 Redis 还是挺难的**，好在 Spring 对这些进行了封装和支持。

#### 第三步：在 Spring 中使用 Redis
上面说到了 Redis 无法操作对象的问题，无法在那些基础类型和 Java 对象之间方便的转换，但是在 Spring 中，这些问题都可以**通过使用RedisTemplate**得到解决！

想要达到这样的效果，除了 Jedis 包以外还需要在 Spring 引入 spring-data-redis 包：<https://mvnrepository.com/artifact/org.springframework.data/spring-data-redis>
![redis](/images/redis21.png)
```bash
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-redis</artifactId>
    <version>2.2.0.RELEASE</version>
</dependency>
```
**(1) 第一步：使用Spring配置JedisPoolConfig对象**
大部分的情况下，我们还是会用到连接池的，于是先用 Spring 配置一个 JedisPoolConfig 对象：
```bash
<bean id="poolConfig" class="redis.clients.jedis.JedisPoolConfig">
    <!--最大空闲数-->
    <property name="maxIdle" value="50"/>
    <!--最大连接数-->
    <property name="maxTotal" value="100"/>
    <!--最大等待时间-->
    <property name="maxWaitMillis" value="20000"/>
</bean>
```
**(2) 第二步：为连接池配置工厂模型**
好了，我们现在配置好了连接池的相关属性，那么具体使用哪种工厂实现呢？在Spring Data Redis中有四种可供我们选择的工厂模型，它们分别是：
- JredisConnectionFactory
- JedisConnectionFactory
- LettuceConnectionFactory
- SrpConnectionFactory
我们这里就简单配置成JedisConnectionFactory：
```bash
<bean id="connectionFactory" class="org.springframework.data.redis.connection.jedis.JedisConnectionFactory">
    <!--Redis服务地址-->
    <property name="hostName" value="localhost"/>
    <!--端口号-->
    <property name="port" value="6379"/>
    <!--如果有密码则需要配置密码-->
    <!--<property name="password" value="password"/>-->
    <!--连接池配置-->
    <property name="poolConfig" ref="poolConfig"/>
</bean>
```
**(3) 第三步：配置RedisTemplate**
普通的连接根本没有办法直接将对象直接存入 Redis 内存中，我们需要替代的方案：将对象序列化（可以简单的理解为继承Serializable接口）。我们可以把对象序列化之后存入Redis缓存中，然后在取出的时候又通过转换器，将序列化之后的对象反序列化回对象，这样就完成了我们的要求：
![redis](/images/redis22.png)
RedisTemplate可以帮助我们完成这份工作，它会找到对应的序列化器去转换Redis的键值：
```bash
<bean id="redisTemplate"
      class="org.springframework.data.redis.core.RedisTemplate"
      p:connection-factory-ref="connectionFactory"/>
```

> 我从《JavaEE互联网轻量级框架整合开发》中了解到，这一步需要配置单独的序列化器去支撑这一步的工作，但是自己在测试当中，发现只要我们的Pojo类实现了Serializable接口，就不会出现问题，所以我直接省略掉了配置序列化器这一步。
**(4) 第四步：编写测试**
```bash
/**
 * @author: @loonycoder
 * @create: 2018-11-28 下午 18:22:06
 */
public class Student implements Serializable{

    private String name;
    private int age;

    /**
     * 给该类一个服务类用于测试
     */
    public void service() {
        System.out.println("学生名字为：" + name);
        System.out.println("学生年龄为：" + age);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```
然后编写测试类：
```bash
@Test
public void test() {
    ApplicationContext context =
            new ClassPathXmlApplicationContext("applicationContext.xml");
    RedisTemplate redisTemplate = context.getBean(RedisTemplate.class);
    Student student = new Student();
    student.setName("loonycoder");
    student.setAge(24);
    redisTemplate.opsForValue().set("student_1", student);
    Student student1 = (Student) redisTemplate.opsForValue().get("student_1");
    student1.service();
}
```
![redis](/images/redis23.png)

#### 第四步：在 SpringBoot 中使用 Redis
**(1)在SpringBoot中添加Redis依赖：**
```bash
<!-- Radis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```
**(2)添加配置文件：**
在SpringBoot中使用<code>.properties</code>或者<code>.yml</code>都可以，这里给出<code>.properties</code>的例子，因为自己的<code>.yml</code>文件看上去感觉乱糟糟的：
```bash
# REDIS (RedisProperties)
# Redis数据库索引（默认为0）
spring.redis.database=0
# Redis服务器地址
spring.redis.host=localhost
# Redis服务器连接端口
spring.redis.port=6379
# Redis服务器连接密码（默认为空）
spring.redis.password=
# 连接池最大连接数（使用负值表示没有限制）
spring.redis.pool.max-active=8
# 连接池最大阻塞等待时间（使用负值表示没有限制）
spring.redis.pool.max-wait=-1
# 连接池中的最大空闲连接
spring.redis.pool.max-idle=8
# 连接池中的最小空闲连接
spring.redis.pool.min-idle=0
# 连接超时时间（毫秒）
spring.redis.timeout=0
```
**(3)测试访问：**
```bash
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest()
public class ApplicationTests {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Test
    public void test() throws Exception {

        // 保存字符串
        stringRedisTemplate.opsForValue().set("loonycoder", "24");
        Assert.assertEquals("24", stringRedisTemplate.opsForValue().get("loonycoder"));

    }
}
```
通过上面这段极为简单的测试案例演示了如何通过自动配置的**StringRedisTemplate**对象进行Redis的读写操作，该对象从命名中就可注意到支持的是String类型。原本是RedisTemplate<K, V>接口，StringRedisTemplate就相当于RedisTemplate<String, String>的实现。
**(4)存储对象：**
这一步跟上面使用Spring一样，只需要将Pojo类实现Serializable接口就可以了，这里直接贴测试代码：
```bash
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest()
public class ApplicationTests {

    @Autowired
    private RedisTemplate redisTemplate;

    @Test
    public void test() throws Exception {

        User user = new User();
        user.setName("loonycoder");
        user.setAge(24);

        redisTemplate.opsForValue().set("user_1", user);
        User user1 = (User) redisTemplate.opsForValue().get("user_1");

        System.out.println(user1.getName());
    }
}
```

> 参考文章：
> <https://www.cnblogs.com/ityouknow/p/5748830.html>
> <http://blog.didispace.com/springbootredis/>

---

### 在Redis中操作集合

> 引用文章：<https://www.jianshu.com/p/29aaac3172b5>

直接贴上两段简单的示例代码：

#### 在Redis中操作List
```bash
// list数据类型适合于消息队列的场景:比如12306并发量太高，而同一时间段内只能处理指定数量的数据！必须满足先进先出的原则，其余数据处于等待
@Test
public void listPushResitTest() {
    // leftPush依次由右边添加
    stringRedisTemplate.opsForList().rightPush("myList", "1");
    stringRedisTemplate.opsForList().rightPush("myList", "2");
    stringRedisTemplate.opsForList().rightPush("myList", "A");
    stringRedisTemplate.opsForList().rightPush("myList", "B");
    // leftPush依次由左边添加
    stringRedisTemplate.opsForList().leftPush("myList", "0");
}

@Test
public void listGetListResitTest() {
    // 查询类别所有元素
    List<String> listAll = stringRedisTemplate.opsForList().range("myList", 0, -1);
    logger.info("list all {}", listAll);
    // 查询前3个元素
    List<String> list = stringRedisTemplate.opsForList().range("myList", 0, 3);
    logger.info("list limit {}", list);
}

@Test
public void listRemoveOneResitTest() {
    // 删除先进入的B元素
    stringRedisTemplate.opsForList().remove("myList", 1, "B");
}

@Test
public void listRemoveAllResitTest() {
    // 删除所有A元素
    stringRedisTemplate.opsForList().remove("myList", 0, "A");
}
```
#### 在Redis中操作Hash
```bash
@Test
public void hashPutResitTest() {
    // map的key值相同，后添加的覆盖原有的
    stringRedisTemplate.opsForHash().put("banks:12600000", "a", "b");
}

@Test
public void hashGetEntiresResitTest() {
    // 获取map对象
    Map<Object, Object> map = stringRedisTemplate.opsForHash().entries("banks:12600000");
    logger.info("objects:{}", map);
}

@Test
public void hashGeDeleteResitTest() {
    // 根据map的key删除这个元素
    stringRedisTemplate.opsForHash().delete("banks:12600000", "c");
}

@Test
public void hashGetKeysResitTest() {
    // 获得map的key集合
    Set<Object> objects = stringRedisTemplate.opsForHash().keys("banks:12600000");
    logger.info("objects:{}", objects);
}

@Test
public void hashGetValueListResitTest() {
    // 获得map的value列表
    List<Object> objects = stringRedisTemplate.opsForHash().values("banks:12600000");
    logger.info("objects:{}", objects);
}

@Test
public void hashSize() { // 获取map对象大小
    long size = stringRedisTemplate.opsForHash().size("banks:12600000");
    logger.info("size:{}", size);
}
```

---

### 总结
在网上看到了关于MySQL的性能测试，读写操作大概就**每秒1000以下**的样子，而且这还和引擎相关，所以可以看出Redis确实能在性能方面帮助许多。

