---
title: 分布式集群架构场景化解决方案——分布式ID解决方案
categories:
    - 分布式架构
    
date: 2019-10-22 18:16:01
tags:
  - Hash算法
  - 分布式


---

### 分布式ID解决方案

为什么需要分布式ID (分布式集群环境下的全局唯⼀ID)

![dcs](/images/dcs/dcs17.png)

- UUID <font color="red">（可以用）</font>
UUID 是指Universally Unique Identifier，翻译为中⽂是**通⽤唯⼀识别码**
产⽣重复 UUID 并造成错误的情况⾮常低，是故⼤可不必考虑此问题。
Java中得到⼀个UUID，可以使⽤java.util包提供的⽅法。

![dcs](/images/dcs/dcs18.png)

- 独⽴数据库的⾃增ID
⽐如A表分表为A1表和A2表，那么肯定不能让A1表和A2表的ID⾃增，那么ID怎么获取呢？我们可以单独的创建⼀个Mysql数据库，在这个数据库中创建⼀张表，这张表的ID设置为⾃增，其他地⽅需要全局唯⼀ID的时候，就模拟向这个Mysql数据库的这张表中模拟插⼊⼀条记录，此时ID会⾃增，然后我们可以通过Mysql的select last_insert_id() 获取到刚刚这张表中⾃增⽣成的ID。

⽐如，我们创建了⼀个数据库实例global_id_generator，在其中创建了⼀个数据表，表结构如
下：

```bash
-- ----------------------------
-- Table structure for DISTRIBUTE_ID
-- ----------------------------
DROP TABLE IF EXISTS `DISTRIBUTE_ID`;
CREATE TABLE `DISTRIBUTE_ID` (
 `id` bigint(32) NOT NULL AUTO_INCREMENT COMMENT '主键',
 `createtime` datetime DEFAULT NULL,
 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

当分布式集群环境中哪个应⽤需要获取⼀个全局唯⼀的分布式ID的时候，就可以使⽤代码连接这个数据库实例，执⾏如下sql语句即可。

```bash
insert into DISTRIBUTE_ID(createtime) values(NOW());
select LAST_INSERT_ID();
```

**注意：**
1. 这⾥的createtime字段⽆实际意义，是为了随便插⼊⼀条数据以⾄于能够⾃增id。
2. 使⽤独⽴的Mysql实例⽣成分布式id，虽然可⾏，但是性能和可靠性都不够好，因为你需要代码连接到数据库才能获取到id，性能⽆法保障，另外mysql数据库实例挂掉了，那么就⽆法获取分布式id了。
2. 有⼀些开发者⼜针对上述的情况将⽤于⽣成分布式id的mysql数据库设计成了⼀个集群架构，
那么其实这种⽅式现在基本不⽤，因为过于麻烦了。

- SnowFlake 雪花算法 <font color="red">（可以用，推荐）</font>
雪花算法是Twitter推出的⼀个⽤于⽣成分布式ID的策略。
雪花算法是⼀个算法，基于这个算法可以⽣成ID，⽣成的ID是⼀个long型，那么在Java中⼀个long型是8个字节，算下来是64bit，如下是使⽤雪花算法⽣成的⼀个ID的⼆进制形式示意：

![dcs](/images/dcs/dcs19.png)

另外，⼀切互联⽹公司也基于上述的⽅案封装了⼀些分布式ID⽣成器，⽐如滴滴的tinyid（基于数据库实现）、百度的uidgenerator（基于SnowFlake）和美团的leaf（基于数据库和SnowFlake）等。

- 借助Redis的Incr命令获取全局唯⼀ID <font color="red">（推荐）</font>
Redis <code>Incr</code>命令将 key 中储存的数字值增⼀。如果 key 不存在，那么 key 的值会先被初始化为0，然后再执⾏ Incr 操作。
![dcs](/images/dcs/dcs20.png)
	- Redis安装（示意，我们这⾥安装单节点使⽤⼀下，具体Redis⾃身的内容在后续分布式缓存课程中详细讲解）
		- 官⽹下载redis-3.2.10.tar.gz
		- 上传到linux服务器解压 tar -zxvf redis-3.2.10.tar.gz
		- cd 解压⽂件⽬录，对解压的redis进⾏编译
		make
		- 然后cd 进⼊src⽬录，执⾏make install
		-修改解压⽬录中的配置⽂件redis.conf，关掉保护模式
		![dcs](/images/dcs/dcs21.png)
		在src⽬录下执⾏ ./redis-server ../redis.conf 启动redis服务
	- Java代码中使⽤Jedis客户端调⽤Reids的incr命令获得⼀个全局的id
		- 引⼊jedis客户端jar
		```bash
		<dependency> 
			<groupId>redis.clients</groupId> 
			<artifactId>jedis</artifactId>
			<version>2.9.0</version>
		</dependency>
		```
		- Java代码（此处我们就是连接单节点，也不使⽤连接池）
		```bash
		Jedis jedis = new Jedis("127.0.0.1",6379);
		try {
			long id = jedis.incr("id");
			System.out.println("从redis中获取的分布式id为：" + id);
		} finally {
			if (null != jedis) {
				jedis.close();
			} 
		}
		```
