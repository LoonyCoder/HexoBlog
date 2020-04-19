---
title: 轻量级控制反转和面向切面的容器框架——Spring（五）
categories:
    - Java框架
    
date: 2019-08-22 16:39:22
tags:
  - Spring全家桶
  - IoC
  - AOP

---

![spring](/images/spring_logo.jpg)

### 写在前面

之前整理过一些关于Spring框架零散的知识点，一直没时间整理，恰好最近又拜读了**应癫**老师的课程，所以赶紧梳理一下关于Spring的相关知识。

---

### Spring AOP应用

AOP本质：在不改变原有业务逻辑的情况下增强横切逻辑，横切逻辑代码往往是权限校验代码、⽇志代码、事务控制代码、性能监控代码。

#### AOP相关术语

##### 业务主线

在讲解AOP术语之前，我们先来看⼀下下⾯这两张图，它们就是第三部分案例需求的扩展（针对这些扩展的需求，我们只进⾏分析，在此基础上去进⼀步回顾AOP，不进⾏实现）

![spring](/images/spring/s58.png)

上图描述的就是未采⽤AOP思想设计的程序，当我们红⾊框中圈定的⽅法时，会带来⼤量的重复劳动。程序中充斥着⼤量的重复代码，使我们程序的独⽴性很差。⽽下图中是采⽤了AOP思想设计的程序，它把红框部分的代码抽取出来的同时，运⽤动态代理技术，在运⾏期对需要使⽤的业务逻辑⽅法进⾏增强。

![spring](/images/spring/s58.png)

##### AOP术语

名词|解释
:-|:-|
**Joinpoint(连接点)** | 它指的是那些可以⽤于把增强代码加⼊到业务主线中的点，那么由上图中我们可以看出，这些点指的就是⽅法。在⽅法执⾏的前后通过动态代理技术加⼊增强的代码。在Spring框架AOP思想的技术实现中，也只⽀持⽅法类型的连接点。
**Pointcut(切⼊点)** | 它指的是那些已经把增强代码加⼊到业务主线进来之后的连接点。由上图中，我们看出表现层 transfer ⽅法就只是连接点，因为判断访问权限的功能并没有对其增强。
**Advice(通知/增强)** | 它指的是切⾯类中⽤于提供增强功能的⽅法。并且不同的⽅法增强的时机是不⼀样的。⽐如，开启事务肯定要在业务⽅法执⾏之前执⾏；提交事务要在业务⽅法正常执⾏之后执⾏，⽽回滚事务要在业务⽅法执⾏产⽣异常之后执⾏等等。那么这些就是通知的类型。其分类有：前置通知 后置通知 异常通知 最终通知 环绕通知。
**Target(⽬标对象)** | 它指的是代理的⽬标对象。即被代理对象。
**Proxy(代理)** | 它指的是⼀个类被AOP织⼊增强后，产⽣的代理类。即代理对象。
**Weaving(织⼊)** | 它指的是把增强应⽤到⽬标对象来创建新的代理对象的过程。spring采⽤动态代理织⼊，⽽AspectJ采⽤编译期织⼊和类装载期织⼊。
**Aspect(切⾯)**| 它指定是增强的代码所关注的⽅⾯，把这些相关的增强代码定义到⼀个类中，这个类就是切⾯类。例如，事务切⾯，它⾥⾯定义的⽅法就是和事务相关的，像开启事务，提交事务，回滚事务等等，不会定义其他与事务⽆关的⽅法。我们前⾯的案例中 TrasnactionManager 就是⼀个切⾯。

**连接点**：⽅法开始时、结束时、正常运⾏完毕时、⽅法异常时等这些特殊的时机点，我们称之为连接点，项⽬中每个⽅法都有连接点，连接点是⼀种候选点

**切⼊点**：指定AOP思想想要影响的具体⽅法是哪些，描述感兴趣的⽅法

**Advice增强**：
第⼀个层次：指的是横切逻辑
第⼆个层次：⽅位点（在某⼀些连接点上加⼊横切逻辑，那么这些连接点就叫做⽅位点，描述的是具体的特殊时机）

**Aspect切⾯**：切⾯概念是对上述概念的⼀个综合
Aspect切⾯ = 切⼊点 + 增强
		  = 切⼊点（锁定⽅法）+ ⽅位点（锁定⽅法中的特殊时机）+ 横切逻辑

**众多的概念，⽬的就是为了锁定要在哪个地⽅插⼊什么横切逻辑代码**

#### Spring中AOP的代理选择

Spring 实现AOP思想使⽤的是动态代理技术。
默认情况下，Spring会根据被代理对象是否实现接⼝来选择使⽤jdk还是cglib。当被代理对象没有实现任何接⼝时，Spring会选择cglib。当被代理对象实现了接⼝，Spring会选择JDK官⽅的代理技术，不过我们可以通过配置的⽅式，让Spring强制使⽤cglib。

#### Spring中AOP的配置方式

在Spring的AOP配置中，也和IoC配置⼀样，⽀持3类配置⽅式。
第⼀类：使⽤XML配置
第⼆类：使⽤XML+注解组合配置
第三类：使⽤纯注解配置

#### Spring中AOP实现

需求：横切逻辑代码是打印⽇志，希望把打印⽇志的逻辑织⼊到⽬标⽅法的特定位置(service层transfer⽅法)

##### XML模式

Spring是模块化开发的框架，使⽤aop就引⼊aop的jar

- 坐标

```bash
<dependency> 
	<groupId>org.springframework</groupId>
	<artifactId>spring-aop</artifactId> 
	<version>5.1.12.RELEASE</version>
</dependency> 
	<dependency> 
	<groupId>org.aspectj</groupId> 
	<artifactId>aspectjweaver</artifactId> 
	<version>1.9.4</version>
</dependency>
```

- AOP 核⼼配置

```bash
<!--
	Spring基于XML的AOP配置前期准备：
	在spring的配置⽂件中加⼊aop的约束
	xmlns:aop="http://www.springframework.org/schema/aop"
	http://www.springframework.org/schema/aop 
	https://www.springframework.org/schema/aop/spring-aop.xsd
	Spring基于XML的AOP配置步骤：
	第⼀步：把通知Bean交给Spring管理
	第⼆步：使⽤aop:config开始aop的配置
	第三步：使⽤aop:aspect配置切⾯
	第四步：使⽤对应的标签配置通知的类型
	⼊⻔案例采⽤前置通知，标签为aop:before
-->
<!--把通知bean交给spring来管理-->
<bean id="logUtil" class="com.loonycoder.utils.LogUtil"></bean>
<!--开始aop的配置-->
<aop:config>
<!--配置切⾯-->
<aop:aspect id="logAdvice" ref="logUtil">
<!--配置前置通知-->
<aop:before method="printLog" pointcut="execution(public * com.loonycoder.service.impl.TransferServiceImpl.updateAccountByCardNo(com.loonycoder.pojo.Account))"></aop:before>
</aop:aspect>
</aop:config>
```

- 细节
	- 关于切⼊点表达式
	上述配置实现了对 TransferServiceImpl 的 updateAccountByCardNo ⽅法进⾏增强，在其执⾏之前，输出了记录⽇志的语句。这⾥⾯，我们接触了⼀个⽐较陌⽣的名称：切⼊点表达式，它是做什么的呢？我们往下看。
		- 概念及作⽤
		切⼊点表达式，也称之为AspectJ切⼊点表达式，指的是遵循特定语法结构的字符串，其作⽤是⽤于对符合语法格式的连接点进⾏增强。它是AspectJ表达式的⼀部分。
		- 关于AspectJ
		AspectJ是⼀个基于Java语⾔的AOP框架，Spring框架从2.0版本之后集成了AspectJ框架中切⼊点表达式的部分，开始⽀持AspectJ切⼊点表达式。
		- 切⼊点表达式使⽤示例
		```bash
		全限定⽅法名 访问修饰符 返回值 包名.包名.包名.类名.⽅法名(参数列表)
		全匹配⽅式：
		public void com.loonycoder.service.impl.TransferServiceImpl.updateAccountByCardNo(com.loonycoder.pojo.Account)
		访问修饰符可以省略
		void com.loonycoder.service.impl.TransferServiceImpl.updateAccountByCardNo(com.loonycoder.pojo.Account)
		返回值可以使⽤*，表示任意返回值
		* com.loonycoder.service.impl.TransferServiceImpl.updateAccountByCardNo(com.loonycoder.pojo.Account)
		包名可以使⽤.表示任意包，但是有⼏级包，必须写⼏个
		* ....TransferServiceImpl.updateAccountByCardNo(com.loonycoder.pojo.Account)
		包名可以使⽤..表示当前包及其⼦包
		* ..TransferServiceImpl.updateAccountByCardNo(com.loonycoder.pojo.Account)
		类名和⽅法名，都可以使⽤.表示任意类，任意⽅法
		* ...(com.loonycoder.pojo.Account)
		参数列表，可以使⽤具体类型
		基本类型直接写类型名称 ： int
		引⽤类型必须写全限定类名：java.lang.String
		参数列表可以使⽤*，表示任意参数类型，但是必须有参数
		* *..*.*(*)
		参数列表可以使⽤..，表示有⽆参数均可。有参数可以是任意类型
		* *..*.*(..)
		全通配⽅式：
		* *..*.*(..)
		```
	- 改变代理⽅式的配置
	在前⾯我们已经说了，Spring在选择创建代理对象时，会根据被代理对象的实际情况来选择的。被代理对象实现了接⼝，则采⽤基于接⼝的动态代理。当被代理对象没有实现任何接⼝的时候，Spring会⾃动切换到基于⼦类的动态代理⽅式。但是我们都知道，⽆论被代理对象是否实现接⼝，只要不是final修饰的类都可以采⽤cglib提供的⽅式创建代理对象。所以Spring也考虑到了这个情况，提供了配置的⽅式实现强制使⽤基于⼦类的动态代理（即cglib的⽅式），配置的⽅式有两种
		- 使⽤aop:config标签配置
		```bash
		<aop:config proxy-target-class="true">
		```
		- 使⽤aop:aspectj-autoproxy标签配置
		```bash
		<!--此标签是基于XML和注解组合配置AOP时的必备标签，表示Spring开启注解配置AOP的⽀持-->
		<aop:aspectj-autoproxy proxy-target-class="true"></aop:aspectj-autoproxy>
		```
	- 五种通知类型
		- 前置通知
		配置⽅式：aop:before标签
		```bash
		<!--作⽤：
		⽤于配置前置通知。
		出现位置：
		它只能出现在aop:aspect标签内部
		属性：
		method：⽤于指定前置通知的⽅法名称
		pointcut：⽤于指定切⼊点表达式
		pointcut-ref：⽤于指定切⼊点表达式的引⽤
		-->
		<aop:before method="printLog" pointcut-ref="pointcut1">
		</aop:before>
		```
		**执⾏时机**：前置通知永远都会在切⼊点⽅法（业务核⼼⽅法）执⾏之前执⾏。
		**细节**：前置通知可以获取切⼊点⽅法的参数，并对其进⾏增强。

- 正常执⾏时通知
**配置⽅式**
```bash
<!--
	作⽤：
	⽤于配置正常执⾏时通知
	出现位置：
	它只能出现在aop:aspect标签内部
	属性：
	method:⽤于指定后置通知的⽅法名称
	pointcut:⽤于指定切⼊点表达式
	pointcut-ref:⽤于指定切⼊点表达式的引⽤
-->
<aop:after-returning method="afterReturningPrintLog" pointcut-ref="pt1"></aop:after-returning>
```

- 异常通知
**配置⽅式**
```bash
<!--
	作⽤：
	⽤于配置异常通知。
	出现位置：
	它只能出现在aop:aspect标签内部
	属性：
	method:⽤于指定异常通知的⽅法名称
	pointcut:⽤于指定切⼊点表达式
	pointcut-ref:⽤于指定切⼊点表达式的引⽤
-->
<aop:after-throwing method="afterThrowingPrintLog" pointcut-ref="pt1"></aop:after-throwing>
```
**执⾏时机**：最终通知的执⾏时机是在切⼊点⽅法（业务核⼼⽅法）执⾏完成之后，切⼊点⽅法返回之前执⾏。换句话说，⽆论切⼊点⽅法执⾏是否产⽣异常，它都会在返回之前执⾏。
**细节**：最终通知执⾏时，可以获取到通知⽅法的参数。同时它可以做⼀些清理操作。

- 环绕通知
**配置⽅式**
```bash
<!--
	作⽤：
	⽤于配置环绕通知。
	出现位置：
	它只能出现在aop:aspect标签的内部
	属性：
	method:⽤于指定环绕通知的⽅法名称
	pointcut:⽤于指定切⼊点表达式
	pointcut-ref:⽤于指定切⼊点表达式的引⽤
-->
<aop:around method="aroundPrintLog" pointcut-ref="pt1"></aop:around>
```
> **特别说明**
环绕通知，它是有别于前⾯四种通知类型外的特殊通知。前⾯四种通知（前置，后置，异常和最终）它们都是指定何时增强的通知类型。⽽环绕通知，它是Spring框架为我们提供的⼀种可以通过编码的⽅式，控制增强代码何时执⾏的通知类型。它⾥⾯借助的ProceedingJoinPoint接⼝及其实现类，实现⼿动触发切⼊点⽅法的调⽤。

##### XML+注解模式

- XML 中开启 Spring 对注解 AOP 的⽀持

```bash
<!--开启spring对注解aop的⽀持-->
<aop:aspectj-autoproxy/>
```

- 示例

```bash
@Component
@Aspect
	public class LogUtil {
	/**
	* 我们在xml中已经使⽤了通⽤切⼊点表达式，供多个切⾯使⽤，那么在注解中如何使⽤呢？
	* 第⼀步：编写⼀个⽅法
	* 第⼆步：在⽅法使⽤@Pointcut注解
	* 第三步：给注解的value属性提供切⼊点表达式
	* 细节：
	* 1.在引⽤切⼊点表达式时，必须是⽅法名+()，例如"pointcut()"。 * 2.在当前切⾯中使⽤，可以直接写⽅法名。在其他切⾯中使⽤必须是全限定⽅法名。
	*/
	@Pointcut("execution(* com.loonycoder.service.impl.*.*(..))")
	public void pointcut(){

	}
	@Before("pointcut()")
	public void beforePrintLog(JoinPoint jp){
		Object[] args = jp.getArgs();
		System.out.println("前置通知：beforePrintLog，参数是："+
		Arrays.toString(args));
	}
	@AfterReturning(value = "pointcut()",returning = "rtValue")
	public void afterReturningPrintLog(Object rtValue){
		System.out.println("后置通知：afterReturningPrintLog，返回值
		是："+rtValue);
	}
	@AfterThrowing(value = "pointcut()",throwing = "e")
	public void afterThrowingPrintLog(Throwable e){
		System.out.println("异常通知：afterThrowingPrintLog，异常是："+e);
	}
	@After("pointcut()")
	public void afterPrintLog(){
		System.out.println("最终通知：afterPrintLog");
	}
	/**
	* 环绕通知
	* @param pjp
	* @return
	*/
	@Around("pointcut()")
	public Object aroundPrintLog(ProceedingJoinPoint pjp){
		//定义返回值
		Object rtValue = null;
		try{
			//前置通知
			System.out.println("前置通知");
			//1.获取参数
			Object[] args = pjp.getArgs();
			//2.执⾏切⼊点⽅法
			rtValue = pjp.proceed(args);
			//后置通知
			System.out.println("后置通知");
		}catch (Throwable t){
			//异常通知
			System.out.println("异常通知");
			t.printStackTrace();
		 }finally {
			//最终通知
			System.out.println("最终通知");
		 }
		return rtValue;
	}
}
```

##### 注解模式

在使⽤注解驱动开发aop时，我们要明确的就是，是注解替换掉配置⽂件中的下⾯这⾏配置：

```bash
<!--开启spring对注解aop的⽀持-->
<aop:aspectj-autoproxy/>
```

在配置类中使⽤如下注解进⾏替换上述配置

```bash
@Configuration
@ComponentScan("com.loonycoder")
@EnableAspectJAutoProxy //开启spring对注解AOP的⽀持
public class SpringConfiguration {
}
```

#### Spring声明式事务的支持

**编程式事务**：在业务代码中添加事务控制代码，这样的事务控制机制就叫做编程式事务
**声明式事务**：通过xml或者注解配置的⽅式达到事务控制的⽬的，叫做声明式事务

##### 事务回顾

###### 事务的概念

事务指逻辑上的⼀组操作，组成这组操作的各个单元，要么全部成功，要么全部不成功。从⽽确保了数据的准确与安全。
例如：A——B转帐，对应于如下两条sql语句:

```bash
/*转出账户减钱*/
update account set money=money-100 where name='a';
/**转⼊账户加钱*/
update account set money=money+100 where name='b';
```
这两条语句的执⾏，要么全部成功，要么全部不成功。

###### 事务的四大特性

**原⼦性（Atomicity）**
原⼦性是指事务是⼀个不可分割的⼯作单位，事务中的操作要么都发⽣，要么都不发⽣。
从操作的⻆度来描述，事务中的各个操作要么都成功要么都失败。
**⼀致性（Consistency）**
事务必须使数据库从⼀个⼀致性状态变换到另外⼀个⼀致性状态。
例如转账前A有1000，B有1000。转账后A+B也得是2000。
⼀致性是从数据的⻆度来说的，（1000，1000）（900，1100），不应该出现（900，1000）
**隔离性（Isolation）**
事务的隔离性是多个⽤户并发访问数据库时，数据库为每⼀个⽤户开启的事务，每个事务不能被其他事务的操作数据所⼲扰，多个并发事务之间要相互隔离。
⽐如：事务1给员⼯涨⼯资2000，但是事务1尚未被提交，员⼯发起事务2查询⼯资，发现⼯资涨了2000块钱，读到了事务1尚未提交的数据（脏读）
**持久性（Durability）**
持久性是指⼀个事务⼀旦被提交，它对数据库中数据的改变就是永久性的，接下来即使数据库发⽣故障也不应该对其有任何影响。

###### 事务的隔离级别

不考虑隔离级别，会出现以下情况：（以下情况全是错误的），也即为隔离级别在解决事务并发问题
**脏读**：⼀个线程中的事务读到了另外⼀个线程中**未提交**的数据。
**不可重复读**：⼀个线程中的事务读到了另外⼀个线程中已经提交的**update**的数据（前后内容不⼀样）
场景：
员⼯A发起事务1，查询⼯资，⼯资为1w，此时事务1尚未关闭
财务⼈员发起了事务2，给员⼯A张了2000块钱，**并且提交了事务**
员⼯A通过事务1再次发起查询请求，发现⼯资为1.2w，原来读出来1w读不到了，叫做不可重复读
**虚读（幻读）**：⼀个线程中的事务读到了另外⼀个线程中已经提交的insert或者delete的数据（前后条数不⼀样）
场景：
事务1查询所有⼯资为1w的员⼯的总数，查询出来了10个⼈，此时事务尚未关闭
事务2财务⼈员发起，新来员⼯，⼯资1w，向表中插⼊了2条数据，**并且提交了事务**
事务1再次查询⼯资为1w的员⼯个数，发现有12个⼈，⻅了⻤了

数据库共定义了四种隔离级别：
**Serializable（串⾏化）**：可避免脏读、不可重复读、虚读情况的发⽣。（串⾏化） <font style="color: red">最⾼</font>
**Repeatable read（可重复读）**：可避免脏读、不可重复读情况的发⽣。(幻读有可能发⽣) <font style="color: red">第⼆</font>该机制下会对要update的⾏进⾏加锁
**Read committed（读已提交）**：可避免脏读情况发⽣。不可重复读和幻读⼀定会发⽣。 <font style="color: red">第三</font>
**Read uncommitted（读未提交）**：最低级别，以上情况均⽆法保证。(读未提交)  <font style="color: red">最低</font>

**注意：级别依次升⾼，效率依次降低**

MySQL的默认隔离级别是：REPEATABLE READ
查询当前使⽤的隔离级别： <code>select @@tx_isolation</code>;
设置MySQL事务的隔离级别： <code>set session transaction isolation level xxx</code>; （设置的是当前mysql连接会话的，并不是永久改变的）

###### 事务的传播行为

事务往往在service层进⾏控制，如果出现service层⽅法A调⽤了另外⼀个service层⽅法B，A和B⽅法本身都已经被添加了事务控制，那么A调⽤B的时候，就需要进⾏事务的⼀些协商，这就叫做事务的传播⾏为。
A调⽤B，我们站在B的⻆度来观察来定义事务的传播⾏为

PROPAGATION_REQUIRED | 如果当前没有事务，就新建⼀个事务，如果已经存在⼀个事务中，加⼊到这个事务中。这是最常⻅的选择。
:-|:-|
**PROPAGATION_SUPPORTS** | **⽀持当前事务，如果当前没有事务，就以⾮事务⽅式执⾏。**
**PROPAGATION_MANDATORY** | **使⽤当前的事务，如果当前没有事务，就抛出异常。**
**PROPAGATION_REQUIRES_NEW** | **新建事务，如果当前存在事务，把当前事务挂起。**
**PROPAGATION_NOT_SUPPORTED** | **以⾮事务⽅式执⾏操作，如果当前存在事务，就把当前事务挂起。**
**PROPAGATION_NEVER** | **以⾮事务⽅式执⾏，如果当前存在事务，则抛出异常。**
**PROPAGATION_NESTED** | **如果当前存在事务，则在嵌套事务内执⾏。如果当前没有事务，则执⾏与PROPAGATION_REQUIRED类似的操作。**

##### Spring中事务的API

mybatis: sqlSession.commit();
hibernate: session.commit();

**PlatformTransactionManager**

```bash
public interface PlatformTransactionManager {
	/**
	* 获取事务状态信息
	*/
	TransactionStatus getTransaction(@Nullable TransactionDefinition definition)
	throws TransactionException;
	/**
	* 提交事务
	*/
	void commit(TransactionStatus status) throws TransactionException;
	/**
	* 回滚事务
	*/
	void rollback(TransactionStatus status) throws TransactionException; 
}
```

**作⽤**
此接⼝是Spring的事务管理器核⼼接⼝。Spring本身并不⽀持事务实现，只是负责提供标准，应⽤底层⽀持什么样的事务，需要提供具体实现类。此处也是策略模式的具体应⽤。在Spring框架中，也为我们内置了⼀些具体策略，例如：DataSourceTransactionManager、HibernateTransactionManager 等等。（ 和 HibernateTransactionManager 事务管理器在 spring-orm-5.1.12.RELEASE.jar 中）Spring JdbcTemplate（数据库操作⼯具）、Mybatis（mybatis-spring.jar）—>DataSourceTransactionManager、Hibernate框架 —> HibernateTransactionManager DataSourceTransactionManager 归根结底是横切逻辑代码，声明式事务要做的就是使⽤Aop（动态代理）来将事务控制逻辑织⼊到业务代码。

##### Spring声明式事务配置

- 纯xml模式
	- 导⼊jar
	```bash
	<dependency> 
		<groupId>org.springframework</groupId> 
		<artifactId>spring-context</artifactId> 
		<version>5.1.12.RELEASE</version>
	</dependency> 
	<dependency> 
		<groupId>org.aspectj</groupId> 
		<artifactId>aspectjweaver</artifactId> 
		<version>1.9.4</version>
	</dependency> 
	<dependency> 
		<groupId>org.springframework</groupId> 
		<artifactId>spring-jdbc</artifactId> 
		<version>5.1.12.RELEASE</version>
	</dependency> 
	<dependency> 
		<groupId>org.springframework</groupId> 
		<artifactId>spring-tx</artifactId> 
		<version>5.1.12.RELEASE</version>
	</dependency>
	```
	- xml 配置
	```bash
	<tx:advice id="txAdvice" transaction-manager="transactionManager">
	<!--定制事务细节，传播⾏为、隔离级别等-->
	<tx:attributes>
	<!--⼀般性配置-->
	<tx:method name="*" read-only="false" propagation="REQUIRED" isolation="DEFAULT" timeout="-1"/>
	<!--针对查询的覆盖性配置-->
	<tx:method name="query*" read-only="true" propagation="SUPPORTS"/>
	</tx:attributes>
	</tx:advice> 
	<aop:config>
	<!--advice-ref指向增强=横切逻辑+⽅位-->
	<aop:advisor advice-ref="txAdvice" pointcut="execution(* com.loonycoder.edu.service.impl.TransferServiceImpl.*(..))"/>
	</aop:config>
	```

- 基于XML+注解
	- xml配置
	```bash
	<!--配置事务管理器-->
	<bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager"> 
		<property name="dataSource" ref="dataSource"></property>
	</bean>
	<!--开启spring对注解事务的⽀持-->
	<tx:annotation-driven transaction-manager="transactionManager"/>
	```
	- 在接⼝、类或者⽅法上添加@Transactional注解
	```bash
	@Transactional(readOnly = true,propagation = Propagation.SUPPORTS)
	```

- 基于纯注解
Spring基于注解驱动开发的事务控制配置，只需要把 xml 配置部分改为注解实现。只是需要⼀个
注解替换掉xml配置⽂件中的 <code>&lt;tx:annotation-driven transaction-manager="transactionManager"/&gt;</code> 配置。
在 Spring 的配置类上添加 <code>@EnableTransactionManagement</code> 注解即可
```bash
@EnableTransactionManagement//开启spring注解事务的⽀持
public class SpringConfiguration {
}
```
