---
title: 分布式集群架构场景化解决方案——一致性Hash算法
categories:
    - 分布式架构
    
date: 2019-09-30 17:36:51
tags:
  - Hash算法
  - 分布式


---

### 前言

**分布式和集群**

分布式和集群是不⼀样的，**分布式⼀定是集群，但是集群不⼀定是分布式**（因为集群就是多个实例⼀起⼯作，分布式将⼀个系统拆分之后那就是多个实例；集群并不⼀定是分布式，因为复制型的集群不是拆分⽽是复制）

![dcs](/images/dcs/dcs1.png)

### 一致性Hash算法

Hash算法，⽐如说在安全加密领域MD5、SHA等加密算法，在数据存储和查找⽅⾯有Hash表等, 以上都应⽤到了Hash算法。

**为什么需要使⽤Hash？**

Hash算法较多的应⽤在数据存储和查找领域，最经典的就是Hash表，它的查询效率⾮常之⾼，其中的哈希算法如果设计的⽐较ok的话，那么Hash表的数据查询时间复杂度可以接近于O(1)，示例：

**需求**
提供⼀组数据1,5,7,6,3,4,8，对这组数据进⾏存储，然后随便给定⼀个数n，请你判断n是否存在于刚才的数据集中？
```bash
list:List[1,5,7,6,3,4,8]
// 通过循环判断来实现
for(int element: list) {
	if(element == n) {
		如果相等，说明n存在于数据集中
	}
}
```
以上这种⽅法叫做**顺序查找法**：这种⽅式我们是通过循环来完成，⽐较原始，效率也不⾼

**⼆分查找**：排序之后折半查找，相对于顺序查找法会提⾼⼀些效率，但是效率也并不是特别好

**我能否不循环！不⼆分！⽽是通过⼀次查询就把数据n从数据集中查询出来？？？可以！**

定义⼀个数组，数组⻓度⼤于等于数据集⻓度，此处⻓度为9，数据1就存储在下标为1的位置，3就存储
在下标为3的元素位置，依次类推。

这个时候，我想看下5存在与否，只需要判断list.get(5) array[5] 是否为空，如果为空，代表5不存在于数据集，如果不为空代表5在数据集当中，通过⼀次查找就达到了⽬的，时间复杂度为O(1)。

这种⽅式叫做“**直接寻址法**”：直接把数据和数组的下标绑定到⼀起，查找的时候，直接array[n]就取出了数据。

**优点**：速度快，⼀次查找得到结果
**缺点**：
- 浪费空间，⽐如 1,5,7,6,3,4,8,12306 ，最⼤值12306 ，按照上述⽅式需要定义⼀个⽐如⻓度为12307的数组，但是只存储零星的⼏个数据，其他位置空间都浪费着
- 数据如：1,5,7,6,3,4,8,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2最⼤值12，⽐如开辟13个空间，存储不了这么多内容。

现在，换⼀种设计，如果数据是3，5，7，12306，⼀共4个数据，我们开辟任意个空间，⽐如5个，那么具体数据存储到哪个位置呢，我们可以对数据进⾏求模（对空间位置数5），根据求模余数确定存储位置的下标，⽐如3%5=3，就可以把3这个数据放到下标为3的位置上，12306%5=1，就把12306这个数据存储到下标为1的位置上。

![dcs](/images/dcs/dcs2.png)

上⾯对数据求模 （数据%空间位置数） 他就是⼀个hash算法，只不过这是⼀种⽐较普通⼜简单的hash算法，这种构造Hash算法的⽅式叫做**除留余数法**
如果数据是1，6，7，8，把这4个数据存储到上⾯的数组中

![dcs](/images/dcs/dcs3.png)

在此基础上采⽤开放寻址法

**开放寻址法**：1放进去了，6再来的时候，向前或者向后找空闲位置存放，不好的地⽅，如果数组⻓度定
义好了⽐如10，⻓度不能扩展，来了11个数据，不管Hash冲突不冲突，肯定存不下这么多数据。

**拉链法**：数据⻓度定义好了，怎么存储更多内容呢，算好Hash值，在数组元素存储位置放了⼀个链表。

![dcs](/images/dcs/dcs4.png)

如果Hash算法设计的⽐较好的话，那么查询效率会更接近于O(1)，如果Hash算法设计的⽐较low，那么
查询效率就会很低了。

![dcs](/images/dcs/dcs5.png)

所以，Hash表的查询效率⾼不⾼取决于Hash算法，hash算法能够让数据平均分布，既能够节省空间⼜能提⾼查询效率。Hash算法的研究是很深的⼀⻔学问，⽐较复杂，⻓久以来，Hash表内部的Hash算法也⼀直在更新，很多数学家也在研究。

#### Hash算法应⽤场景

Hash算法在分布式集群架构中的应⽤场景。

Hash算法在很多分布式集群产品中都有应⽤，⽐如分布式集群架构Redis、Hadoop、ElasticSearch、Mysql分库分表、Nginx负载均衡等。

主要的应⽤场景归纳起来两个：

- 请求的负载均衡（⽐如nginx的ip_hash策略）
Nginx的IP_hash策略可以在客户端ip不变的情况下，将其发出的请求始终路由到同⼀个⽬标服务器上，实现会话粘滞，避免处理session共享问题
如果没有IP_hash策略，那么如何实现会话粘滞？
可以维护⼀张映射表，存储客户端IP或者sessionid与具体⽬标服务器的映射关系
(ip,tomcat1)
缺点：
1. 那么，在客户端很多的情况下，映射表⾮常⼤，浪费内存空间
2. 客户端上下线，⽬标服务器上下线，都会导致重新维护映射表，映射表维护成本很⼤

如果使⽤哈希算法，事情就简单很多，我们可以对ip地址或者sessionid进⾏计算哈希值，哈希值与服务
器数量进⾏取模运算，得到的值就是当前请求应该被路由到的服务器编号，如此，同⼀个客户端ip发送过来的请求就可以路由到同⼀个⽬标服务器，实现会话粘滞。

- 分布式存储
以分布式内存数据库Redis为例,集群中有redis1，redis2，redis3 三台Redis服务器
那么,在进⾏数据存储时,(key1,value1)数据存储到哪个服务器当中呢？针对key进⾏hash处理
hash(key1)%3=index, 使⽤余数index锁定存储的具体服务器节点。

#### 普通Hash算法存在的问题

普通Hash算法存在⼀个问题，以ip_hash为例，假定下载⽤户ip固定没有发⽣改变，现在tomcat3出现
了问题，宕机或者下线了，服务器数量由3个变为了2个，之前所有的求模都需要重新计算。

![dcs](/images/dcs/dcs6.png)

如果在真实⽣产情况下，后台服务器很多台，客户端也有很多，那么影响是很⼤的，缩容和扩容都会存在这样的问题，⼤量⽤户的请求会被路由到其他的⽬标服务器处理，⽤户在原来服务器中的会话都会丢失。

#### ⼀致性Hash算法

⼀致性哈希算法思路如下：

![dcs](/images/dcs/dcs7.png)

⾸先有⼀条直线，直线开头和结尾分别定为为1和2的32次⽅减1，这相当于⼀个地址，对于这样⼀条线，弯过来构成⼀个圆环形成闭环，这样的⼀个圆环称为hash环。我们把服务器的ip或者主机名求hash值然后对应到hash环上，那么针对客户端⽤户，也根据它的ip进⾏hash求值，对应到环上某个位置，然后如何确定⼀个客户端路由到哪个服务器处理呢？按照顺时针⽅向找最近的服务器节点。

![dcs](/images/dcs/dcs8.png)

假如将服务器3下线，服务器3下线后，原来路由到3的客户端重新路由到服务器4，对于其他客户端没有影响只是这⼀⼩部分受影响（请求的迁移达到了最⼩，这样的算法对分布式集群来说⾮常合适的，避免了⼤量请求迁移）

![dcs](/images/dcs/dcs9.png)

增加服务器5之后，原来路由到3的部分客户端路由到新增服务器5上，对于其他客户端没有影响只是这⼀⼩部分受影响（请求的迁移达到了最⼩，这样的算法对分布式集群来说⾮常合适的，避免了⼤量请求迁移）

![dcs](/images/dcs/dcs10.png)

- 如前所述，每⼀台服务器负责⼀段，⼀致性哈希算法对于节点的增减都只需重定位环空间中的⼀⼩部分数据，具有较好的容错性和可扩展性。
**但是**，⼀致性哈希算法在服务节点太少时，容易因为节点分部不均匀⽽造成数据倾斜问题。例如系统中只有两台服务器，其环分布如下，节点2只能负责⾮常⼩的⼀段，⼤量的客户端请求落在了节点1上，这就是**数据（请求）倾斜问题**。

- 为了解决这种数据倾斜问题，⼀致性哈希算法引⼊了虚拟节点机制，即对每⼀个服务节点计算多个哈希，每个计算结果位置都放置⼀个此服务节点，称为虚拟节点。具体做法可以在服务器ip或主机名的后⾯增加编号来实现。⽐如，可以为每台服务器计算三个虚拟节点，于是可以分别计算“节点1的ip#1”、“节点1的ip#2”、“节点1的ip#3”、“节点2的ip#1”、“节点2的ip#2”、“节点2的ip#3”的哈希值，于是形成六个虚拟节点，当客户端被路由到虚拟节点的时候其实是被路由到该虚拟节点所对应的真实节点。

![dcs](/images/dcs/dcs11.png)

#### ⼿写实现⼀致性Hash算法

- 普通Hash算法实现

```bash
/**
* 普通Hash算法实现
*/
public class GeneralHash {
	public static void main(String[] args) {
		// 定义客户端IP
		String[] clients = new String[]{"10.78.12.3","113.25.63.1","126.12.3.8"};
		// 定义服务器数量
		int serverCount = 5;// (编号对应0，1，2)
		// hash(ip) % node_counts = index
		//根据index锁定应该路由到的tomcat服务器
		for(String client: clients) {
			int hash = Math.abs(client.hashCode());
			int index = hash%serverCount;
			System.out.println("客户端：" + client + " 被路由到服务器编号为：" + index);
		}
	 }
}
```

- ⼀致性Hash算法实现（不含虚拟节点）

```bash
public class ConsistentHashNoVirtual {
	public static void main(String[] args) {
		//step1 初始化：把服务器节点IP的哈希值对应到哈希环上
		// 定义服务器ip
		String[] tomcatServers = new String[]{"123.111.0.0","123.101.3.1","111.20.35.2","123.98.26.3"};
		SortedMap<Integer,String> hashServerMap = new TreeMap<>();
		for(String tomcatServer: tomcatServers) {
			// 求出每⼀个ip的hash值，对应到hash环上，存储hash值与ip的对应关系
			int serverHash = Math.abs(tomcatServer.hashCode());
			// 存储hash值与ip的对应关系
			hashServerMap.put(serverHash,tomcatServer);
		 }
		//step2 针对客户端IP求出hash值
		// 定义客户端IP
		String[] clients = new String[]{"10.78.12.3","113.25.63.1","126.12.3.8"};
		for(String client : clients) {
			int clientHash = Math.abs(client.hashCode());
			//step3 针对客户端,找到能够处理当前客户端请求的服务器（哈希环上顺时针最
			近）
			// 根据客户端ip的哈希值去找出哪⼀个服务器节点能够处理（）
			SortedMap<Integer, String> integerStringSortedMap =
			hashServerMap.tailMap(clientHash);
			if(integerStringSortedMap.isEmpty()) {
				// 取哈希环上的顺时针第⼀台服务器
				Integer firstKey = hashServerMap.firstKey();
				System.out.println("==========>>>>客户端：" + client + " 被路由到服务器：" + hashServerMap.get(firstKey));
			 }else{
				Integer firstKey = integerStringSortedMap.firstKey();
				System.out.println("==========>>>>客户端：" + client + " 被路由到服务器：" + hashServerMap.get(firstKey));
			 }
		 }
	 }
}
```

- ⼀致性Hash算法实现（含虚拟节点）

```bash
public class ConsistentHashWithVirtual {
	public static void main(String[] args) {
		//step1 初始化：把服务器节点IP的哈希值对应到哈希环上
		// 定义服务器ip
		String[] tomcatServers = new String[]{"123.111.0.0","123.101.3.1","111.20.35.2","123.98.26.3"};
		SortedMap<Integer,String> hashServerMap = new TreeMap<>();
		// 定义针对每个真实服务器虚拟出来⼏个节点
		int virtaulCount = 3;
		for(String tomcatServer: tomcatServers) {
			// 求出每⼀个ip的hash值，对应到hash环上，存储hash值与ip的对应关系
			int serverHash = Math.abs(tomcatServer.hashCode());
			// 存储hash值与ip的对应关系
			hashServerMap.put(serverHash,tomcatServer);
			// 处理虚拟节点
			for(int i = 0; i < virtaulCount; i++) {
				int virtualHash = Math.abs((tomcatServer + "#" + i).hashCode());
				hashServerMap.put(virtualHash,"----由虚拟节点"+ i + "映射过来的请求："+ tomcatServer);
		 	}
		 }
		//step2 针对客户端IP求出hash值
		// 定义客户端IP
		String[] clients = new String[]{"10.78.12.3","113.25.63.1","126.12.3.8"};
		for(String client : clients) {
			int clientHash = Math.abs(client.hashCode());
			//step3 针对客户端,找到能够处理当前客户端请求的服务器（哈希环上顺时针最
			近）
			// 根据客户端ip的哈希值去找出哪⼀个服务器节点能够处理（）
			SortedMap<Integer, String> integerStringSortedMap =
			hashServerMap.tailMap(clientHash);
			if(integerStringSortedMap.isEmpty()) {
				// 取哈希环上的顺时针第⼀台服务器
				Integer firstKey = hashServerMap.firstKey();
				System.out.println("==========>>>>客户端：" + client + " 被路由到服务器：" + hashServerMap.get(firstKey));
		 	}else{
				Integer firstKey = integerStringSortedMap.firstKey();
				System.out.println("==========>>>>客户端：" + client + " 被路由到服务器：" + hashServerMap.get(firstKey));
			}
		 }
	}
}
```

#### Nginx 配置⼀致性Hash负载均衡策略

<code>ngx_http_upstream_consistent_hash</code>模块是⼀个负载均衡器，使⽤⼀个内部⼀致性hash算法来选择合适的后端节点。
该模块可以根据配置参数采取不同的⽅式将请求均匀映射到后端机器，
<code>consistent_hash $remote_addr</code>：可以根据客户端ip映射
<code>consistent_hash $request_uri</code>：根据客户端请求的uri映射
<code>consistent_hash $args</code>：根据客户端携带的参数进⾏映
<code>ngx_http_upstream_consistent_hash</code>模块是⼀个第三⽅模块，需要我们下载安装后使⽤

1. github下载nginx⼀致性hash负载均衡模块<https://github.com/replay/ngx_http_consistent_hash>

![dcs](/images/dcs/dcs12.png)

2. 将下载的压缩包上传到nginx服务器，并解压

3. 我们已经编译安装过nginx，此时进⼊当时nginx的源码⽬录，执⾏如下命令
```bash
$ ./configure —add-module=/root/ngx_http_consistent_hash-master
$ make
$ make install
```

4. Nginx就可以使⽤啦，在nginx.conf⽂件中配置

![dcs](/images/dcs/dcs13.png)