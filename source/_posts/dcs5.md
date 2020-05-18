---
title: 分布式集群架构场景化解决方案——Session共享问题
categories:
    - 分布式架构
    
date: 2019-11-12 19:12:52
tags:
  - Hash算法
  - 分布式


---

### Session共享问题

Session共享及Session保持或者叫做Session⼀致性。

![dcs](/images/dcs/dcs29.png)

#### Session问题原因分析

出现这个问题的原因，从根本上来说是因为Http协议是⽆状态的协议。客户端和服务端在某次会话中产⽣的数据不会被保留下来，所以第⼆次请求服务端⽆法认识到你曾经来过， Http为什么要设计为⽆状态协议？早期都是静态⻚⾯⽆所谓有⽆状态，后来有动态的内容更丰富，就需要有状态，出现了两种⽤于保持Http状态的技术，那就是Cookie和Session。⽽出现上述不停让登录的问题，分析如下图：

场景：nginx默认轮询策略

![dcs](/images/dcs/dcs30.png)

#### 解决Session⼀致性的⽅案

- Nginx的 IP_Hash 策略**（可以使⽤）**
同⼀个客户端IP的请求都会被路由到同⼀个⽬标服务器，也叫做会话粘滞
优点：
	- 配置简单，不⼊侵应⽤，不需要额外修改代码
缺点：
	- 服务器重启Session丢失
	- 存在单点负载⾼的⻛险
	- 单点故障问题

- Session复制**（不推荐）**
也即，多个tomcat之间通过修改配置⽂件，达到Session之间的复制。
![dcs](/images/dcs/dcs31.png)
优点：
	- 不⼊侵应⽤
	- 便于服务器⽔平扩展
	- 能适应各种负载均衡策略
	- 服务器重启或者宕机不会造成Session丢失
缺点：
	- 性能低
	- 内存消耗
	- 不能存储太多数据，否则数据越多越影响性能
	- 延迟性
- Session共享，Session集中存储**（推荐）**
Session的本质就是缓存，那Session数据为什么不交给专业的缓存中间件呢？⽐如Redis.
![dcs](/images/dcs/dcs32.png)
优点:
	- 能适应各种负载均衡策略
	- 服务器重启或者宕机不会造成Session丢失
	- 扩展能⼒强
	- 适合⼤集群数量使⽤
缺点：
	- 对应⽤有⼊侵，引⼊了和Redis的交互代码

**Spring Session使得基于Redis的Session共享应⽤起来⾮常之简单**

1. 引⼊Jar

```bash
<dependency> 
	<groupId>org.springframework.boot</groupId> 
	<artifactId>spring-boot-starter-data-redis</artifactId>
</dependency> 
<dependency> 
	<groupId>org.springframework.session</groupId> 
	<artifactId>spring-session-data-redis</artifactId>
</dependency>
```

2. 配置redis

```bash
spring.redis.database=0
spring.redis.host=127.0.0.1
spring.redis.port=6379
```

3. 添加注解
![dcs](/images/dcs/dcs33.png)

**原理示意：**

![dcs](/images/dcs/dcs34.png)
