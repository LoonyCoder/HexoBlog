---
title: 轻量级控制反转和面向切面的容器框架——Spring（一）
categories:
    - Java框架
    
date: 2019-07-08 23:47:34
tags:
  - Spring全家桶
  - IoC
  - AOP

---

![spring](/images/spring_logo.jpg)

### 写在前面

之前整理过一些关于Spring框架零散的知识点，一直没时间整理，恰好最近又拜读了**应癫**老师的课程，所以赶紧梳理一下关于Spring的相关知识。

---

### Spring 概述

#### Spring 简介

Spring 是分层的 full-stack（全栈） 轻量级开源框架，以 IoC 和 AOP 为内核，提供了展现层 Spring MVC 和业务层事务管理等众多的企业级应⽤技术，还能整合开源世界众多著名的第三⽅框架和类库，已经成为使⽤最多的 Java EE 企业应⽤开源框架。
Spring 官⽅⽹址：<http://spring.io/>
我们经常说的 Spring 其实指的是Spring Framework（spring 框架）。

#### Spring 发展历程

- 1997年 IBM 提出了EJB的思想； 1998年，SUN 制定开发标准规范EJB1.0； 1999年，EJB 1.1发
布； 2001年，EJB 2.0发布； 2003年，EJB 2.1发布； 2006年，EJB 3.0发布；
- Rod Johnson（spring之⽗）
	- Expert One-to-One J2EE Design and Development(2002) 阐述了J2EE使⽤EJB开发设计的优点及解决⽅案
	- Expert One-to-One J2EE Development without EJB(2004) 阐述了J2EE开发不使⽤EJB的解决⽅式（Spring雏形）
	2017 年 9 ⽉份发布了 Spring 的最新版本 Spring 5.0 通⽤版（GA）

#### Spring 的优势

> 整个 Spring 优势，传达出⼀个信号，Spring 是⼀个综合性，且有很强的思想性框架，每学习⼀天，就能体会到它的⼀些优势。

- **⽅便解耦，简化开发**

通过Spring提供的IoC容器，可以将对象间的依赖关系交由Spring进⾏控制，避免硬编码所造成的过度程序耦合。⽤户也不必再为单例模式类、属性⽂件解析等这些很底层的需求编写代码，可以更专注于上层的应⽤。

- **AOP编程的⽀持**

通过Spring的AOP功能，⽅便进⾏⾯向切⾯的编程，许多不容易⽤传统OOP实现的功能可以通过AOP轻松应付。

- **声明式事务的⽀持**
<code>@Transactional</code>可以将我们从单调烦闷的事务管理代码中解脱出来，通过声明式⽅式灵活的进⾏事务的管理，提⾼开发效率和质量。

- **⽅便程序的测试**

可以⽤⾮容器依赖的编程⽅式进⾏⼏乎所有的测试⼯作，测试不再是昂贵的操作，⽽是随⼿可做的事情。

- **⽅便集成各种优秀框架**

Spring可以降低各种框架的使⽤难度，提供了对各种优秀框架（Struts、Hibernate、Hessian、Quartz等）的直接⽀持。

- **降低JavaEE API的使⽤难度**

Spring对JavaEE API（如JDBC、JavaMail、远程调⽤等）进⾏了薄薄的封装层，使这些API的使⽤难度⼤为降低。

- **源码是经典的 Java 学习范例**
Spring的源代码设计精妙、结构清晰、匠⼼独⽤，处处体现着⼤师对Java设计模式灵活运⽤以及对Java技术的⾼深造诣。它的源代码⽆意是Java技术的最佳实践的范例。

#### Spring 的核心结构

Spring是⼀个分层⾮常清晰并且依赖关系、职责定位⾮常明确的轻量级框架，主要包括⼏个⼤模块：数
据处理模块、Web模块、AOP（Aspect Oriented Programming）、Aspects模块、Core Container模块
和 Test 模块，如下图所示，Spring依靠这些基本模块，实现了⼀个令⼈愉悦的融合了现有解决⽅案的零
侵⼊的轻量级框架。

![spring](images/spring/s1.png)

- Spring核⼼容器（Core Container） 容器是Spring框架最核⼼的部分，它管理着Spring应⽤中bean的创建、配置和管理。在该模块中，包括了Spring bean⼯⼚，它为Spring提供了DI的功能。基于bean⼯⼚，我们还会发现有多种Spring应⽤上下⽂的实现。所有的Spring模块都构建于核⼼容器之上。
- ⾯向切⾯编程（AOP）/Aspects Spring对⾯向切⾯编程提供了丰富的⽀持。这个模块是Spring应⽤系统中开发切⾯的基础，与DI⼀样，AOP可以帮助应⽤对象解耦。
- 数据访问与集成（Data Access/Integration）
Spring的JDBC和DAO模块封装了⼤量样板代码，这样可以使得数据库代码变得简洁，也可以更专注于我们的业务，还可以避免数据库资源释放失败⽽引起的问题。 另外，Spring AOP为数据访问提供了事务管理服务，同时Spring还对ORM进⾏了集成，如Hibernate、MyBatis等。该模块由JDBC、Transactions、ORM、OXM 和 JMS 等模块组成。
- Web 该模块提供了SpringMVC框架给Web应⽤，还提供了多种构建和其它应⽤交互的远程调⽤⽅
案。SpringMVC框架在Web层提升了应⽤的松耦合⽔平。
- Test 为了使得开发者能够很⽅便的进⾏测试，Spring提供了测试模块以致⼒于Spring应⽤的测
试。通过该模块，Spring为使⽤Servlet、JNDI等编写单元测试提供了⼀系列的mock对象实现。


#### Spring 框架版本

![spring](images/spring/s2.png)

Spring Framework不同版本对 Jdk 的要求

![spring](images/spring/s3.png)

---

### 核心思想 

注意：IoC和AOP不是spring提出的，在Spring之前就已经存在，只不过更偏向于理论化，Spring在技
术层次把这两个思想做了⾮常好的实现（Java）

#### IoC

##### 什么是IoC

IoC Inversion of Control (控制反转/反转控制)，注意它是⼀个技术思想，不是⼀个技术实现。
描述的事情：Java开发领域对象的创建，管理的问题
传统开发⽅式：⽐如类A依赖于类B，往往会在类A中new⼀个B的对象
IoC思想下开发⽅式：我们不⽤⾃⼰去new对象了，⽽是由IoC容器（Spring框架）去帮助我们实例化对
象并且管理它，我们需要使⽤哪个对象，去问IoC容器要即可
我们丧失了⼀个权利（创建、管理对象的权利）,得到了⼀个福利（不⽤考虑对象的创建、管理等⼀系列
事情）
为什么叫做控制反转？
控制：指的是对象创建（实例化、管理）的权利
反转：控制权交给外部环境了（spring框架、IoC容器）

![spring](images/spring/s4.png)

##### IoC解决了什么问题

**IoC解决对象之间的耦合问题**

![spring](images/spring/s5.png)

##### IoC和DI的区别

DI：Dependancy Injection（依赖注⼊）
怎么理解：
IOC和DI描述的是同⼀件事情，只不过⻆度不⼀样罢了

![spring](images/spring/s6.png)

#### AOP

##### 什么是AOP

AOP: Aspect oriented Programming ⾯向切⾯编程/⾯向⽅⾯编程
AOP是OOP的延续，从OOP说起
OOP三⼤特征：封装、继承和多态
OOP是⼀种垂直继承体系

![spring](images/spring/s7.png)

OOP编程思想可以解决⼤多数的代码重复问题，但是有⼀些情况是处理不了的，⽐如下⾯的在顶级⽗类
Animal中的多个⽅法中相同位置出现了重复代码，OOP就解决不了

![spring](images/spring/s8.png)

横切逻辑代码

![spring](images/spring/s9.png)

横切逻辑代码存在什么问题：
- 横切代码重复问题
- 横切逻辑代码和业务代码混杂在⼀起，代码臃肿，维护不⽅便
AOP出场，AOP独辟蹊径提出横向抽取机制，将横切逻辑代码和业务逻辑代码分析

![spring](images/spring/s10.png)

代码拆分容易，那么如何在不改变原有业务逻辑的情况下，悄⽆声息的把横切逻辑代码应⽤到原有的业
务逻辑中，达到和原来⼀样的效果，这个是⽐较难的。

##### AOP解决了什么问题

在不改变原有业务逻辑情况下，增强横切逻辑代码，根本上解耦合，避免横切逻辑代码重复

##### 为什么叫做面向切面编程

「切」：指的是横切逻辑，原有业务逻辑代码我们不能动，只能操作横切逻辑代码，所以⾯向横切逻辑
「⾯」：横切逻辑代码往往要影响的是很多个⽅法，每⼀个⽅法都如同⼀个点，多个点构成⾯，有⼀个⾯的概念在⾥⾯



