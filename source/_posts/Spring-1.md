---
title: Spring框架——Spring框架概述及工作原理
categories:
    - Java框架
    
date: 2018-10-22 19:39:58
tags:
	- 框架
    - Spring
---

![Spring](/images/spring_logo.jpg)

### 一、简介
Spring 是个java企业级应用的开源开发框架。Spring主要用来开发Java应用，但是有些扩展是针对构建J2EE平台的web应用。Spring 框架目标是简化Java企业级应用开发，并通过Pojo为基础的编程模型促进良好的编程习惯。

---

### 二、工作原理
<font style="color: red"><b>1、 IoC(Inversion of Control): 控制反转<b></font>
概念：控制权由对象本身转向容器；由容器根据配置文件去创建实例并创建各个实例之间的依赖关系 
 
核心：bean工厂。在Spring中，bean工厂创建的各个实例称作bean。  

作用：IoC 负责创建对象，管理对象（通过依赖注入（DI），装配对象，配置对象，并且管理这些对象的整个生命周期。

优点：IoC 或 依赖注入把应用的代码量降到最低。它使应用容易测试，单元测试不再需要单例和JNDI查找机制。最小的代价和最小的侵入性使松散耦合得以实现。IoC容器支持加载服务时的饿汉式初始化和懒加载。

动态注入，让一个对象的创建不用new了，可以自动的生产，这其实就是利用java里的反射，反射其实就是在运行时动态的去创建、调用对象，Spring就是在运行时，根据xml里面的Spring的配置文件来动态的创建对象，和调用对象里的方法的。 

DI：(全称：Dependency Injection)依赖注入，IoC的另一种表现方式，组件以一种预先定义好的方式来接受容器注入的资源。

<font style="color: red"><b>2、AOP(Aspect-Oriented Programming): 面向方面编程<b></font> 

	可以为某一类对象进行监督和控制（也就是 在调用这类对象的具体方法的前后去调用你指定的模块）从而达到对一个模块扩充的功能。这些都是通过配置类达到的。 

优点：AOP采取横向抽取机制，取代了传统纵向继承体系重复性代码；利用AOP可以对业务逻辑的各个部分进行隔离，使得业务逻辑各部分之间的耦合度降低，提高程序的可重用性，同时提高了开发的效率。

经典应用：事务管理、性能监视、安全检查、缓存 、日志等。

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xsi:schemaLocation="http://www.springframework.org/schema/beans 
                           http://www.springframework.org/schema/beans/spring-beans.xsd
                           http://www.springframework.org/schema/aop 
                           http://www.springframework.org/schema/aop/spring-aop.xsd">
    <!-- 1 创建目标类 -->
    <bean id="userServiceId" class="com.loonycoder.service.UserServiceImpl"></bean>
    <!-- 2 创建切面类（通知） -->
    <bean id="myAspectId" class="com.loonycoder.service.MyAspect"></bean>
    <!-- 3 aop编程 
        3.1 导入命名空间
        3.2 使用 <aop:config>进行配置
                proxy-target-class="true" 声明时使用cglib代理
            <aop:pointcut> 切入点 ，从目标对象获得具体方法
            <aop:advisor> 特殊的切面，只有一个通知 和 一个切入点
                advice-ref 通知引用
                pointcut-ref 切入点引用
        3.3 切入点表达式
            execution(* com.loonycoder.service.*.*(..))
            选择方法         返回值任意   包             类名任意   方法名任意   参数任意
 
    -->
    <aop:config proxy-target-class="true">
        <aop:pointcut expression="execution(* com.loonycoder.service.*.*(..))" id="myPointCut"/>
        <aop:advisor advice-ref="myAspectId" pointcut-ref="myPointCut"/>
    </aop:config>
</beans>
```

代理的两种方式——静态代理和动态代理静态代理：  
- 针对每个具体类分别编写代理类；  
- 针对一个接口编写一个代理类；  
动态代理：  
针对一个方面编写一个InvocationHandler，然后借用JDK反射包中的Proxy类为各种接口动态生成相应的代理类

3、三种注入方式
1. setter属性注入，通过构建实体类属性的setting方法注入
```bash
<!-- 相当于User user = new User(); -->
        <bean id="user" class="com.loonycoder.domain.User">
            <property name="name" value="张三"></property>
            <property name="age" value="18"></property>
            <property name="sex" value="男"></property>
        </bean>
```

2. constructor构造方法注入，通过构建实体类相应构造方法
```bash
<!-- 相当于User user = new User();-->
<!-- index属性指的是参数索引，从0开始 -->
<bean id="user" class="com.loonycoder.domain.User">
    <constructor-arg type="java.lang.String" index="0" value="张三"></constructor-arg>
    <constructor-arg type="java.lang.Integer" index="1" value="18"></constructor-arg>
    <constructor-arg type="java.lang.String" index="2" value="男"></constructor-arg>
</bean>
```
另外还有一种是Interface接口注入，因为此种方式使用的极少，所以在此就不进行介绍了。

4、单例和多例
1)当scope="singleton"时，容器一加载就创建实体类

**注意：只有在单例的时候，这个配置才有效**
- lazy-init="true" 延迟加载，在使用对象时创建实体对象 
- lazy-init="false" 不延迟加载，容器启动立即创建

2)当scope="prototype"时，获取使用对象时创建对象

5、Spring目的
<font style="color: red"><b>就是让对象与对象（模块与模块）之间的关系没有通过代码来关联，都是通过配置类说明管理的（Spring根据这些配置 内部通过反射去动态的组装对象）</b></font>  
Spring是一个容器，凡是在容器里的对象才会有Spring所提供的这些服务和功能。  
Spring里用的最经典的一个设计模式就是：模板方法模式。Spring里的配置是很多的，很难都记住，但是Spring里的精华也无非就是以上的两点，把以上两点跟理解了也就基本上掌握了Spring。

### 三、组成体系
![spring](/images/spring-framework.gif)

图中包含了 Spring 框架的所有模块，这些模块可以满足一切企业级应用开发的需求，在开发过程中可以根据需求有选择性地使用所需要的模块。下面分别对这些模块的作用进行简单介绍。
**1. Data Access/Integration（数据访问／集成）**

数据访问/集成层包括 JDBC、ORM、OXM、JMS 和 Transactions 模块，具体介绍如下。
- JDBC 模块：提供了一个 JDBC 的抽象层，大幅度减少了在开发过程中对数据库操作的编码。
- ORM 模块：对流行的对象关系映射 API，包括 JPA、JDO、Hibernate 和 iBatis 提供了的集成层。
- OXM 模块：提供了一个支持对象/XML 映射的抽象层实现，如 JAXB、Castor、XMLBeans、JiBX 和 XStream。
- JMS 模块：指 Java 消息服务，包含的功能为生产和消费的信息。
- Transactions 事务模块：支持编程和声明式事务管理实现特殊接口类，并为所有的 POJO。

**2. Web 模块**

Spring 的 Web 层包括 Web、Servlet、Struts 和 Portlet 组件，具体介绍如下。
- Web 模块：提供了基本的 Web 开发集成特性，例如多文件上传功能、使用的 Servlet 监听器的 IoC 容器初始化以及 Web 应用上下文。
- Servlet模块：包括 Spring 模型—视图—控制器（MVC）实现 Web 应用程序。
- Struts 模块：包含支持类内的 Spring 应用程序，集成了经典的 Struts Web 层。
- Portlet 模块：提供了在 Portlet 环境中使用 MV C实现，类似 Web-Servlet 模块的功能。

**3. Core Container（核心容器）**

Spring 的核心容器是其他模块建立的基础，由 Beans 模块、Core 核心模块、Context 上下文模块和 Expression Language 表达式语言模块组成，具体介绍如下。
- Beans 模块：提供了 BeanFactory，是工厂模式的经典实现，Spring 将管理对象称为 Bean。
- Core 核心模块：提供了 Spring 框架的基本组成部分，包括 IoC 和 DI 功能。
- Context 上下文模块：建立在核心和 Beans 模块的基础之上，它是访问定义和配置任何对象的媒介。ApplicationContext 接口是上下文模块的焦点。
- Expression Language 模块：是运行时查询和操作对象图的强大的表达式语言。

**4. 其他模块**

Spring的其他模块还有 AOP、Aspects、Instrumentation 以及 Test 模块，具体介绍如下。
- AOP 模块：提供了面向切面编程实现，允许定义方法拦截器和切入点，将代码按照功能进行分离，以降低耦合性。
- Aspects 模块：提供与 AspectJ 的集成，是一个功能强大且成熟的面向切面编程（AOP）框架。
- Instrumentation 模块：提供了类工具的支持和类加载器的实现，可以在特定的应用服务器中使用。
- Test 模块：支持 Spring 组件，使用 JUnit 或 TestNG 框架的测试。


