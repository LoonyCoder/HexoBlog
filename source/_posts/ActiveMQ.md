---
title: 消息中间件ActiveMQ入门学习
categories:
    - 中间件
    
date: 2018-12-22 13:42:35
tags:
	- ActiveMQ
    - 消息中间件

---

### 什么是消息中间件
**什么是消息中间件？**
消息中间件利用高效可靠的消息传递机制进行与平台无关的数据交流，并基于数据通信来进行分布式系统的集成。对于消息中间件，常见的角色有：Producer(生产者)、Consumer(消费者)。
常见的消息中间件产品有：
- ActiveMQ: Apache的一款完全支持JMS1.1和J2EE1.4规范的JMS Provider实现。
- RabbitMQ: AMQP协议的领导实现，支持多种场景。
- ZeroMQ: 号称史上最快的消息队列系统。
- Kafka: Apache下的一个子项目，具有高吞吐的特点。

---

### 安装

本例中将ArtiveMQ部署在虚拟机Centos服务器上。

**搭建**

首先去下载ActiveMQ: [官网地址](http://activemq.apache.org)

> 1. 打开虚拟机上的CentOS服务器，打开SecureCRT连接上服务器。

> 2. 输入命令：rz将本地下载的apache-activemq-bin.tar.gz文件上传到linux服务器上

输入以下命令解压文件并赋予权限
```bash
--解压
tar zxvf apache-activemq-5.15.6-bin.tar.gz
--赋予可读可写可执行的权限
chmod 777 apache-activemq-5.15.6

cd apache-activemq-5.15.6/bin
--赋予权限
chmod 755 activemq

--启动activemq
./activemq start
```

**拓展**

chmod是Linux下设置文件权限的命令，后面的数字代表了不同用户组的权限，一般时三个数字：
- 第一个数字表示文件所有者的权限
- 第二个数字表示与文件所有者同属于一个用户组的其他用户的权限
- 第三个数字表示其他用户组的权限
权限分为三种：读(r=4)、写(r=2)、执行(r=1)。综合起来：可读可执行(rx=5=4+1)、可读可写(rw=6=4+2)、可读可写可执行(rwx=7=4+2+1)。
![ActiveMQ](/images/active1.png)
在浏览器上访问ip:8161地址
![ActiveMQ](/images/active2.png)
8161端口是ActiveMQ默认的端口，点击Manage ActiveMQ broker，需要输入用户名密码：默认都是admin
![ActiveMQ](/images/active3.png)

---

### JMS入门

上面我们在服务器上部署了ActiveMQ，对应实际应用中肯定需要一个入口方式操作ActiveMQ，所以我们要学习：JMS（Java Messaging Service）。

JMS是Java平台上有关面向中间件的技术规范，它便于消息系统中的Java应用程序进行消息交换，并且通过提供标准的产生、发送、接收消息的接口简化企业应用的开发。

JMS本身定义了一系列的接口规范，可以用其访问ActiveMQ发送消息服务。JMS定义了五种不同的消息正文格式，以及调用的消息类型，允许你发送并接受一些不同形式的数据，提供现有消息格式的一些级别的兼容性：

- TextMessage – 一个字符串对象
- MapMessage – 一套名称-值对
- ObjectMessage – 一个序列化的Java对象
- BytesMessage – 一个字节的数据流
- StreamMessage – Java原始值的数据流

#### JMS消息传递类型

JMS有两种消息传递类型，适用于不同的情况，分别是：

- Producer-->Consumer点对点模式：一个生产者对应一个消费者。
- Producer-->Consumer/Consumer发布订阅模式：一个生产者可对应多个消费者。

#### 案例

先在工程中导入activemq依赖：
```bash
<dependency>
   <groupId>org.apache.activemq</groupId>
   <artifactId>activemq-client</artifactId>
   <version>5.13.4</version>
</dependency>
```

##### 点对点模式
点对点模式主要建立在一个队列上面，当连接一个队列的时候，发送端不需要知道接收端是否正在接收，可以直接向ActiveMQ发送消息，发送的消息将会先进入队列中，如果有接收端监听，则会发向接受端；如果没有接收端接收，则会保存在activeMQ服务器，直到接收端接收消息。点对点消息模式可以有多个发送端，多个接收端，但是一条消息，只会被一个接收端给接收到，那个接收端先连接上ActiveMQ，则会先接收到，而后来的接收端接收不到那条消息。

先在工程中导入activemq依赖：
```bash
<dependency>
  <groupId>org.apache.activemq</groupId>
  <artifactId>activemq-client</artifactId>
  <version>5.13.4</version>
</dependency>
```

> 1. 创建QueueProducer.java 生产者类

```bash
public class QueueProducer {
    public static void main(String[] args) throws JMSException {
        //1、创建连接工厂
        ConnectionFactory connectionFactory = new ActiveMQConnectionFactory("tcp://192.168.148.128:61616");

        //2、获取连接
        Connection connection = connectionFactory.createConnection();

        //3、启动连接
        connection.start();

        //4、获取session（参数1：是否启动事务；参数2：消息确认模式）
        //      AUTO_ACKNOWLEDGE = 1  自动确认
        //      CLIENT_ACKNOWLEDGE = 2  客户端手动确认
        //      DUPS_OK_ACKNOWLEDGE = 3  自动批量确认
        //      SESSION_TRANSACTED = 0  事务提交并确认
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

        //5、创建消息队列对象
        Queue queue = session.createQueue("test-queue");

        //6、创建消息生产者
        MessageProducer producer = session.createProducer(queue);

        //7、创建消息
        TextMessage textMessage = session.createTextMessage("ActiveMQ入门");

        //8、发送消息
        producer.send(textMessage);

        //9、关闭资源
        producer.close();
        session.close();
        connection.close();
    }
}
```

如上，步骤一中的连接地址根据自己的ActiveMQ服务器地址决定，但是**61616是ActiveMQ默认端口**，无需改变。这里我们创建了一个消息队列对象text-queue，并用TextMessage格式发送了一条消息：ActiveMQ入门。 如果我们理解运行着这个生产者类，在ActiveMQ控制台中会看到：
![ActiveMQ](/images/active4.png)

那么消费端是如何接受到这个消息的呢？

> 2. 创建QueueConsumer.java 消费者类

```bash
public class QueueConsumer {
    public static void main(String[] args) throws JMSException, IOException {
        //1、创建连接工厂
        ConnectionFactory connectionFactory = new ActiveMQConnectionFactory("tcp://192.168.148.128:61616");

        //2、获取连接
        Connection connection = connectionFactory.createConnection();

        //3、启动连接
        connection.start();

        //4、获取session（参数1：是否启动事务；参数2：消息确认模式）
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

        //5、创建队列对象
        Queue queue = session.createQueue("test-queue");

        //6、创建消息消费
        MessageConsumer consumer = session.createConsumer(queue);

        //7、监听消息
        consumer.setMessageListener(new MessageListener() {
            @Override
            public void onMessage(Message message) {
                TextMessage textMessage = (TextMessage) message;
                try {
                    System.out.println("接收到消息：" + textMessage.getText());
                } catch (JMSException e) {
                    e.printStackTrace();
                }
            }
        });
        //8、等待键盘输入
        System.in.read();
        //9、关闭资源
        consumer.close();
        session.close();
        connection.close();
    }
}
```
如上一共9个步骤，步骤一中创建连接地址要结合自己的ActiveMQ服务器地址。前6个步骤都是和生产者创建步骤相同的，只有第7个步骤是独特的，因为消费端要实现监听生产端的消息，如果生产端有消息就会打印出来。
运行QueueConsumer即可得到刚才发送的消息：Active入门。
如果我们再次运行QueueConsumer消费端，则不会再得到消息，因为点对点模式只能有一个消费端接收消息，第二个消费端是接收不到消息的。

##### 发布/订阅模式

> 1. 创建生产者TopicProducer.java

```bash
public class TopicProducer {

    public static void main(String[] args) throws JMSException {

        //1、创建连接工厂
        ConnectionFactory connectionFactory = new ActiveMQConnectionFactory("tcp://192.168.148.128:61616");

        //2、获取连接
        Connection connection = connectionFactory.createConnection();

        //3、启动连接
        connection.start();

        //4、获取session（参数1：是否启动事务；参数2：消息确认模式）
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

        //5、创建主题对象
        Topic topic = session.createTopic("test-topic");

        //6、创建消息生产者
        MessageProducer producer = session.createProducer(topic);

        //7、创建消息
        TextMessage textMessage = session.createTextMessage("ActiveMQ--->发布订阅模式消息...");

        //8、发送消息
        producer.send(textMessage);

        //9、关闭资源
        producer.close();
        session.close();
        connection.close();
    }
}
```

与点对点模式不同之处在与，发布/订阅模式创建的是Topic主题对象，而点对点模式创建的是Queue队列对象

> 2. 创建TopicConsumer.java 消费端

```bash
public class TopicConsumer {

    public static void main(String[] args) throws JMSException, IOException {

        //1、创建连接工厂
        ConnectionFactory connectionFactory = new ActiveMQConnectionFactory("tcp://192.168.148.128:61616");

        //2、获取连接
        Connection connection = connectionFactory.createConnection();

        //3、启动连接
        connection.start();

        //4、获取session（参数1：是否启动事务；参数2：消息确认模式）
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

        //5、创建主题对象
        Topic topic = session.createTopic("test-topic");

        //6、创建消息消费者
        MessageConsumer consumer = session.createConsumer(topic);

        //7、监听消息
        consumer.setMessageListener(new MessageListener() {
            @Override
            public void onMessage(Message message) {
                TextMessage textMessage = (TextMessage) message;
                try {
                    System.out.println("接收到的消息：" + textMessage.getText());
                } catch (JMSException e) {
                    e.printStackTrace();
                }
            }
        });

        //8、等待键盘输入
        System.in.read();

        //9、关闭资源
        consumer.close();
        session.close();
        connection.close();
    }
}
```

执行生产端和消费端，发现消费端并不显示消息；然后先运行消费端再运行生产端就打印出了消息：ActiveMQ—>发布订阅模式消息。
原因就是发布/订阅模式和点对点模式是不同的，发布订阅模式可以允许多个接收端接收同一个生产端发布的消息；你可以理解为只有订阅了消息，才能发布消息。


### Spring整合JMS

首先要在工程中导入spring-jms依赖：
```bash
<dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>activemq-client</artifactId>
    <version>5.13.4</version>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-jms</artifactId>
    <version>4.2.4.RELEASE</version>
</dependency>
```

#### 点对点模式
##### 环境配置

这里生产端和服务端是两个不同的项目。

> 1. 生产端jms-producer.xml

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
            http://www.springframework.org/schema/beans/spring-beans.xsd
            http://www.springframework.org/schema/context
            http://www.springframework.org/schema/context/spring-context.xsd">

    <context:component-scan base-package="cn.demo"/>

    <!-- 真正可以产生Connection的ConnectionFactory，由对应的JMS服务厂商提供 -->
    <bean id="targetConnectionFactory" class="org.apache.activemq.ActiveMQConnectionFactory">
        <property name="brokerURL" value="tcp://192.168.148.128:61616"/>
    </bean>

    <!-- Spring用于管理真正的ConnectionFactory的ConnectionFactory -->
    <bean id="connectionFactory" class="org.springframework.jms.connection.SingleConnectionFactory">
        <!-- 目标ConnectionFactory对应真实可以产生JMS Connection的ConnectionFactory -->
        <property name="targetConnectionFactory" ref="targetConnectionFactory"/>
    </bean>

    <!-- Spring提供的JMS工具类，它可以进行消息发送、接收等 -->
    <bean id="jmsTemplate" class="org.springframework.jms.core.JmsTemplate">
        <!-- 这个connectionFactory对应的是我们定义的Spring提供的那个ConnectionFactory对象 -->
        <property name="connectionFactory" ref="connectionFactory"/>
    </bean>

    <!-- 这个是队列的目的地，点对点 文本信息 -->
    <bean id="queueTextDestination" class="org.apache.activemq.command.ActiveMQQueue">
        <constructor-arg value="queue_text"/>
    </bean>
</beans>
```

以上了配置和之前的直接在Java代码上的配置类似，多了一个jmsTemplate模板工具类的配置，如同Spring-Data-Solr中有一个solrTemplate工具类、Spring-Data-Redis有一个redisTemplate工具类。jmsTemplate模板工具类提供了很多API供开发者操作JMS。

##### 测试

创建QueueProducer.java
```bash
@Component
public class QueueProducer {

    @Autowired
    private JmsTemplate jmsTemplate;

    @Autowired
    private Destination queueTextDestination;

    /**
     * 发送文本消息
     * @param text
     */
    public void sendTextMessage(final String text){
        jmsTemplate.send(queueTextDestination, new MessageCreator() {
            public Message createMessage(Session session) throws JMSException {
                return session.createTextMessage(text);
            }
        });
    }
}
```

除了要注入JmsTemplate模板类对象，还要注入Destination对象，之前我们是通过new Queue()来创建队列对象的，而spring整合jms后是在配置文件中配置的队列对象，

> 2. 消费端

创建jms-consumer-queue.xml

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
            http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!-- 真正可以产生Connection的ConnectionFactory，由对应的JMS服务厂商提供 -->
    <bean id="targetConnectionFactory" class="org.apache.activemq.ActiveMQConnectionFactory">
        <property name="brokerURL" value="tcp://192.168.148.128:61616"/>
    </bean>

    <!-- Spring用于真正的ConnectionFactory的ConnectionFactory -->
    <bean id="connectionFactory" class="org.springframework.jms.connection.SingleConnectionFactory">
        <!-- 目标ConnectionFactory对应真实的可以产生JMS Connection的ConnectionFactory -->
        <property name="targetConnectionFactory" ref="targetConnectionFactory"/>
    </bean>

    <!-- 这个是队列的目的地，点对点  文本信息 -->
    <bean id="queueTextDestination" class="org.apache.activemq.command.ActiveMQQueue">
        <constructor-arg value="queue_text"/>
    </bean>

    <!-- 我的监听类 -->
    <bean id="myMessageListener" class="cn.demo.MyMessageListener"/>

    <!-- 消息监听容器 -->
    <bean class="org.springframework.jms.listener.DefaultMessageListenerContainer">
        <property name="connectionFactory" ref="connectionFactory"/>
        <property name="destination" ref="queueTextDestination"/>
        <property name="messageListener" ref="myMessageListener"/>
    </bean>
</beans>
```

这里注入了自定义的消费端监听类MyMessageListener.java:
```bash
public class MyMessageListener implements MessageListener {
    @Override
    public void onMessage(Message message) {
        TextMessage textMessage = (TextMessage) message;
        try {
            System.out.println("接收到的消息：" + textMessage.getText());
        } catch (JMSException e) {
            e.printStackTrace();
        }
    }
}
```

> 3. 在消费端工程中创建测试方法，启动监听
```bash
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:applicationContext-jms-consumer-queue.xml")
public class TestQueueC {

    @Test
    public void testQueue(){
        try{
            System.in.read();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

> 4. 在生产端工程中创建测试方法，发送消息：
```bash
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:spring/applicationContext-jms-producer.xml")
public class TestQueueP {

    @Autowired
    private QueueProducer queueProducer;

    @Test
    public void testSend() {
        queueProducer.sendTextMessage("SpringJms-点对点");
    }
}
```

启动生产端，发送消息，在消费端立即点听到消息并打印出来。和之前JMS的案例是相同的。

#### 发布/订阅模式

> 1. 在上面的jms-producer.xml中添加配置：
```bash
<!-- 这个是订阅模式  文本信息 -->
<bean id="topicTextDestination" class="org.apache.activemq.command.ActiveMQTopic">
    <constructor-arg value="topic_text"/>
</bean>
```

> 2. 创建TopicProducer.java
```bash
@Component
public class TopicProducer {

    @Autowired
    private JmsTemplate jmsTemplate;

    @Autowired
    private Destination topicTextDestination;

    public void sendTextMessage(final String text){
        jmsTemplate.send(topicTextDestination, new MessageCreator() {
            @Override
            public Message createMessage(Session session) throws JMSException {
                return session.createTextMessage();
            }
        });
    }
}
```

> 3. 在上面消费端工程中创建jms-topic.xml
```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
            http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!-- 真正可以产生Connection的ConnectionFactory, 由对应的JMS服务厂商提供 -->
    <bean id="targetConnectionFactory" class="org.apache.activemq.ActiveMQConnectionFactory">
        <property name="brokerURL" value="tcp://192.168.148.128:61616"/>
    </bean>

    <!-- Spring用户管理真正的ConnectionFactory的ConnectionFactory -->
    <bean id="connectionFactory" class="org.springframework.jms.connection.SingleConnectionFactory">
        <!-- 目标ConnectionFactory对应真实的可以产生JMS Connection的ConnectionFactory -->
        <property name="targetConnectionFactory" ref="targetConnectionFactory"/>
    </bean>

    <!-- 这个是队列的目的地，点对点的文本信息 -->
    <bean id="topicTextDestination" class="org.apache.activemq.command.ActiveMQTopic">
        <constructor-arg value="topic_text"/>
    </bean>

    <!-- 我的监听类 -->
    <bean id="myMessageListener" class="cn.demo.MyMessageListener"/>

    <!-- 消息监听容器 -->
    <bean class="org.springframework.jms.listener.DefaultMessageListenerContainer">
        <property name="connectionFactory" ref="connectionFactory"/>
        <property name="destination" ref="topicTextDestination"/>
        <property name="messageListener" ref="myMessageListener"/>
    </bean>
</beans>
```

监听类还是之前的MyMessageListener.java。

> 4. 在生产端创建测试类
```bash
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:spring/applicationContext-jms-producer.xml")
public class TestTopicP {

    @Autowired
    private TopicProducer topicProducer;

    @Test
    public void sendTextQueue(){
        topicProducer.sendTextMessage("Spring JMS 发布订阅信息");
    }
}
```

启动消费端监听，并运行生产端发布消息，在消费端立即监听到消息并打印出来数据。

到此为止我们完成了基本的ActiveMQ入门学习。

思考：在上面我们使用ActiveMQ案例中明显就感觉到消息中间件的一大优势就是采用了一种与平台无关的数据交流方式，在分布式项目中用处很广，比如基本的增、删、改、查数据都可以通过ActiveMQ进行信息传递，ActiveMQ支持多种数据类型的传递。

这样我们就解决了分布式模板间的耦合关系，模块间的消息传递不再通过调用（高耦合）方式传递消息，而是通过ActiveMQ（低耦合）异步的发送消息。



