---
title: Spring事务隔离级别、传播行为以及Spring+Mybatis+Atomikos实现分布式事务管理
categories:
    - Spring
    
date: 2019-04-03 14:49:43
tags:
  - Spring
  - 事务

---

#### 事务的定义

**事务是指多个操作单元组成的合集，多个单元操作是整体不可分割的，要么都操作不成功，要么都成功。其必须遵循四个原则（ACID）。**

> <font style="color: red">**原子性（Atomicity）**</font>：即事务是不可分割的最小工作单元，事务内的操作要么全做，要么全不做；
<font style="color: red">**一致性（Consistency）**</font>：在事务执行前数据库的数据处于正确的状态，而事务执行完成后数据库的数据还是应该处于正确的状态，即数据完整性约束没有被破坏；如银行转帐，A转帐给B，必须保证A的钱一定转给B，一定不会出现A的钱转了但B没收到，否则数据库的数据就处于不一致（不正确）的状态。
<font style="color: red">**隔离性（Isolation）**</font>：并发事务执行之间互不影响，在一个事务内部的操作对其他事务是不产生影响，这需要事务隔离级别来指定隔离性；
<font style="color: red">**持久性（Durability）**</font>：事务一旦执行成功，它对数据库的数据的改变必须是永久的，不会因比如遇到系统故障或断电造成数据不一致或丢失。

#### 事务的类型

1. 数据库分为本地事务跟全局事务
本地事务：普通事务，独立一个数据库，能保证在该数据库上操作的ACID。
分布式事务：涉及两个或多个数据库源的事务，即跨越多台同类或异类数据库的事务（由每台数据库的本地事务组成的），分布式事务旨在保证这些本地事务的所有操作的ACID，使事务可以跨越多台数据库；
2. Java事务类型分为JDBC事务跟JTA事务
JDBC事务：即为上面说的数据库事务中的本地事务，通过connection对象控制管理。
JTA事务：JTA指Java事务API(Java Transaction API)，是Java EE数据库事务规范， JTA只提供了事务管理接口，由应用程序服务器厂商（如WebSphere Application Server）提供实现，JTA事务比JDBC更强大，支持分布式事务。
3. 按是否通过编程分为声明式事务和编程式事务，参考[Spring事务管理实现方式之编程式事务与声明式事务详解](https://loonycoder.github.io/2019/04/10/spring-transcation-2/);
声明式事务：通过XML配置或者注解实现。
编程式事务：通过编程代码在业务逻辑时需要时自行实现，粒度更小。

#### Spring事务隔离级别

**Spring有五大隔离级别，其在TransactionDefinition接口中定义。看源码可知，其默isolation_default（底层数据库默认级别），其他四个隔离级别跟数据库隔离级别一致。**

> <font style="color: red">**ISOLATION_DEFAULT**</font>：用底层数据库的默认隔离级别，数据库管理员设置什么就是什么
<font style="color: red">**ISOLATION_READ_UNCOMMITTED（未提交读）**</font>：最低隔离级别、事务未提交前，就可被其他事务读取（会出现幻读、脏读、不可重复读）
<font style="color: red">**ISOLATION_READ_COMMITTED（提交读）**</font>：一个事务提交后才能被其他事务读取到（该隔离级别禁止其他事务读取到未提交事务的数据、所以还是会造成幻读、不可重复读）、sql server默认级别
<font style="color: red">**ISOLATION_REPEATABLE_READ（可重复读）**</font>：可重复读，保证多次读取同一个数据时，其值都和事务开始时候的内容是一致，禁止读取到别的事务未提交的数据（该隔离基本可防止脏读，不可重复读（重点在修改），但会出现幻读（重点在增加与删除））（MySql默认级别，更改可通过set transaction isolation level 级别）
<font style="color: red">**ISOLATION_SERIALIZABLE（序列化）**</font>：代价最高最可靠的隔离级别（该隔离级别能防止脏读、不可重复读、幻读）
> - 丢失更新：两个事务同时更新一行数据，最后一个事务的更新会覆盖掉第一个事务的更新，从而导致第一个事务更新的数据丢失，这是由于没有加锁造成的；
> - 幻读：同样的事务操作过程中，不同时间段多次（不同事务）读取同一数据，读取到的内容不一致（一般是行数变多或变少）。
> - 脏读：一个事务读取到另外一个未提及事务的内容，即为脏读。
> - 不可重复读：同一事务中，多次读取内容不一致（一般行数不变，而内容变了）。

幻读与不可重复读的区别：幻读的重点在于<font style="color: red">插入与删除</font>，即第二次查询会发现比第一次查询数据变少或者变多了，以至于给人一种幻象一样，而不可重复读重点在于<font style="color: red">修改</font>，即第二次查询会发现查询结果比第一次查询结果不一致，即第一次结果已经不可重现了。

数据库隔离级别越高，执行代价越高，并发执行能力越差，因此在实际项目开发使用时要综合考虑，为了考虑<font style="color: red">并发性能</font>一般使用提交读隔离级别，它能避免丢失更新和脏读，尽管不可重复读和幻读不能避免，但可以在可能出现的场合使用<font style="color: red">悲观锁或乐观锁</font>来解决这些问题。

悲观锁与乐观锁可参考：[乐观锁与悲观锁随笔](https://loonycoder.github.io/2019/03/25/lock/)

#### 事务的传播行为

**有七大传播行为，也是在TransactionDefinition接口中定义。**

> <font style="color: red">**PROPAGATION_REQUIRED**</font>：支持当前事务，如当前没有事务，则新建一个。
<font style="color: red">**PROPAGATION_SUPPORTS**</font>：支持当前事务，如当前没有事务，则已非事务性执行（源码中提示有个注意点，看不太明白，留待后面考究）。
<font style="color: red">**PROPAGATION_MANDATORY**</font>：支持当前事务，如当前没有事务，则抛出异常（强制一定要在一个已经存在的事务中执行，业务方法不可独自发起自己的事务）。
<font style="color: red">**PROPAGATION_REQUIRES_NEW**</font>：始终新建一个事务，如当前原来有事务，则把原事务挂起。
<font style="color: red">**PROPAGATION_NOT_SUPPORTED**</font>：不支持当前事务，始终已非事务性方式执行，如当前事务存在，挂起该事务。
<font style="color: red">**PROPAGATION_NEVER**</font>：不支持当前事务；如果当前事务存在，则引发异常。
<font style="color: red">**PROPAGATION_NESTED**</font>：如果当前事务存在，则在嵌套事务中执行，如果当前没有事务，则执行与 PROPAGATION_REQUIRED 类似的操作（注意：当应用到JDBC时，只适用JDBC 3.0以上驱动）。

#### Spring事务支持

> 1. Spring提供了很多内置事务管理器，支持不同数据源。常见的有三大类

- <font style="color: red">DataSourceTransactionManager</font>：org.springframework.jdbc.datasource包下，数据源事务管理类，提供对单个javax.sql.DataSource数据源的事务管理，只要用于JDBC，Mybatis框架事务管理。
- <font style="color: red">HibernateTransactionManager</font>：org.springframework.orm.hibernate3包下，数据源事务管理类，提供对单个org.hibernate.SessionFactory事务支持，用于集成Hibernate框架时的事务管理；注意：该事务管理器只支持Hibernate3+版本，且Spring3.0+版本只支持Hibernate 3.2+版本；
- <font style="color: red">JtaTransactionManager</font>：位于org.springframework.transaction.jta包中，提供对分布式事务管理的支持，并将事务管理委托给Java EE应用服务器，或者自定义一个本地JTA事务管理器，嵌套到应用程序中。

内置事务管理器都继承了抽象类AbstractPlatformTransactionManager，而AbstractPlatformTransactionManager又继承了接口PlatformTransactionManager

Spring框架支持事务管理的核心是事务管理器抽象，对于不同的数据访问框架通过实现策略接口PlatformTransactionManager，从而能支持多钟数据访问框架的事务管理。

PlatformTransactionManager接口定义如下

```bash
public interface PlatformTransactionManager {
         TransactionStatus getTransaction(TransactionDefinition definition) throws TransactionException;//返回一个已经激活的事务或创建一个新的事务（具体由TransactionDefinition参数定义的事务属性决定），返回的TransactionStatus对象代表了当前事务的状态，其中该方法抛出TransactionException（未检查异常）表示事务由于某种原因失败。
         void commit(TransactionStatus status) throws TransactionException;//用于提交TransactionStatus参数代表的事务。
         void rollback(TransactionStatus status) throws TransactionException;//用于回滚TransactionStatus参数代表的事务。
｝
```

TransactionDefinition接口定义如下：

```bash
public interface TransactionDefinition {  
       int getPropagationBehavior();  //返回定义的事务传播行为
       int getIsolationLevel(); //返回事务隔离级别
       int getTimeout();  //返回定义的事务超时时间
       boolean isReadOnly();  //返回定义的事务是否是只读的
       String getName();  //返回事务名称
}  
```

TransactionStatus接口定义如下：

```bash
public interface TransactionStatus extends SavepointManager {  
       boolean isNewTransaction();  //返回当前事务是否是新的事务
       boolean hasSavepoint();  //返回当前事务是否有保存点
       void setRollbackOnly();  //设置事务回滚
       boolean isRollbackOnly();  //设置当前事务是否应该回滚
       void flush();  //用于刷新底层会话中的修改到数据库，一般用于刷新如Hibernate/JPA的会话，可能对如JDBC类型的事务无任何影响；
       boolean isCompleted();  //返回事务是否完成
}  
```

> 2. Spring分布式事务配置

- 引用应用服务器（如Tomcat）的JNDI数据源，间接实现JTA事务管理，依赖于应用服务器
- 直接集成JOTM（官网：<http://jotm.objectweb.org/>）、Atomikos（官网：<https://www.atomikos.com/>）提供JTA事务管理（无应用服务器支持，常用于单元测试）
- 使用特定于应用服务器的事务管理器，使用JTA事务的高级功能（Weblogic，Websphere）

> 引用应用服务器（如Tomcat）的JNDI数据源，间接实现JTA事务管理，配置如下

```bash
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:jee="http://www.springframework.org/schema/jee"
    xsi:schemaLocation="
       http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
       http://www.springframework.org/schema/jee
       http://www.springframework.org/schema/jee/spring-jee-3.0.xsd">
 <!-- JNDI数据源 -->
  <jee:jndi-lookup id="dataSource" jndi-name="jdbc/test"/>
    <!-- JTA事务管理器  -->
  	<bean id="txManager" class="org.springframework.transaction.jta.JtaTransactionManager">
  		<!--transactionManagerName指定JTA事务管理器的JNDI名字，从而将事务管理委托给该事务管理器  -->
    	<property name="transactionManagerName" value="java:comp/TransactionManager"/>
  	</bean>
</beans>
```

> 使用Atomikos实现分布式事务管理，配置如下：

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
	xmlns:p="http://www.springframework.org/schema/p"
	xmlns:aop="http://www.springframework.org/schema/aop"	
	xmlns:tx="http://www.springframework.org/schema/tx"
	xmlns:context="http://www.springframework.org/schema/context"
    xmlns:task="http://www.springframework.org/schema/task"
	xsi:schemaLocation="http://www.springframework.org/schema/beans 
	http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
	http://www.springframework.org/schema/context 
	http://www.springframework.org/schema/context/spring-context-3.0.xsd
	http://www.springframework.org/schema/tx
	http://www.springframework.org/schema/tx/spring-tx-3.0.xsd
	http://www.springframework.org/schema/task
	http://www.springframework.org/schema/task/spring-task-3.0.xsd
	http://www.springframework.org/schema/aop
	http://www.springframework.org/schema/aop/spring-aop-3.0.xsd"
	>
     
	<context:component-scan base-package="com.loonycoder.*.service.impl" />
	<context:component-scan base-package="com.loonycoder.util" />
    <!-- 此方法加载的配置文件仅仅在xml中使用,但是工具类都采用注解的方式 -->
	<bean class="org.springframework.beans.factory.config.PropertyPlaceholderConfigurer">
		<property name="location" value="classpath:conn.properties" />
	</bean>
	<!-- 仅仅支持注解不支持在xml配置中使用properties文件  在类中可以使用SPEL表达式来加载相应的值 -->
	<bean id="temp" class="org.springframework.beans.factory.config.PropertiesFactoryBean">
		<property name="locations">
			<array>
				<value>classpath:public.properties</value>
			</array>
		</property>
	</bean>
	<bean id="abstractXADataSource" class="com.atomikos.jdbc.AtomikosDataSourceBean" init-method="init"  destroy-method="close" abstract="true"> 
        <property name="borrowConnectionTimeout" value="60"/>  <!--获取连接失败重新获等待最大时间，在这个时间内如果有可用连接，将返回-->
        <property name="reapTimeout" value="20"/> <!--最大获取数据时间，如果不设置这个值，Atomikos使用默认的5分钟，那么在处理大批量数据读取的时候，一旦超过5分钟，就会抛出类似 Resultset is close 的错误.-->        
        <property name="maintenanceInterval" value="60" />  <!--连接回收时间-->    
        <property name="loginTimeout" value="60" />     <!--java数据库连接池，最大可等待获取datasouce的时间-->
        <property name="logWriter" value="60"/>
        <property name="minPoolSize" value="1" />  <!-- 连接池中保留的最小连接数   -->
        <property name="maxPoolSize" value="3" />  <!-- 连接池中保留的最大连接数    -->
        <property name="maxIdleTime" value="60" /> <!-- 最大空闲时间,60秒内未使用则连接被丢弃。若为0则永不丢弃。Default: 0 -->
    </bean> 
     <!-- 配置2个数据源 mysql -->
     <bean id="ds_loonycoder" parent="abstractXADataSource">  
     	<!-- uniqueResourceName表示唯一资源名，如有多个数据源不可重复； -->
     	<property name="uniqueResourceName" value="loonycoderfortest" />
     	<!--  xaDataSourceClassName是具体分布式数据源厂商实现； -->
     	<property name="xaDataSourceClassName" value="com.mysql.jdbc.jdbc2.optional.MysqlXADataSource"/>
     	<!-- xaProperties属性指定具体厂商数据库属性 -->
     	<property name="xaProperties">
            <props>
                <prop key="URL">${db.jdbcUrlOne}</prop>
                <prop key="user">${user}</prop>
                <prop key="password">${password}</prop>
            </props>
        </property>
    </bean>  
	<bean id="ds_loony"  parent="abstractXADataSource">  
		<!-- uniqueResourceName表示唯一资源名，如有多个数据源不可重复； -->
		<property name="uniqueResourceName" value="puildingpurchasefortest" />
		<!-- xaDataSourceClassName是具体分布式数据源厂商实现； -->
		<property name="xaDataSourceClassName" value="com.mysql.jdbc.jdbc2.optional.MysqlXADataSource"/>
		<!-- xaProperties属性指定具体厂商数据库属性 -->
		<property name="xaProperties">
            <props>
                <prop key="URL">${db.jdbcUrlTwo}</prop>
                <prop key="user">${user}</prop>
                <prop key="password">${password}</prop>
            </props>
        </property>
    </bean>  
    <!-- 动态配置数据源 --> 
    <bean id="dataSource2" class="com.loonycoder.common.datasource.DynamicDataSource">  
        <property name="targetDataSources">  
            <map key-type ="java.lang.String">  
                <entry value-ref ="ds_loonycoder" key="ds_loonycoder"></entry >  
                <entry value-ref ="ds_loony" key="ds_loony"></entry >  
            </map > 
        </property>  
        <property name ="defaultTargetDataSource" ref="ds_loonycoder"></property>  
    </bean>
    
   
    <bean id ="sqlSessionFactoryBeanA" class="org.mybatis.spring.SqlSessionFactoryBean" >  
       <!-- 指定数据源 -->  
       <property name ="dataSource" ref="ds_loonycoder" />  
       <!-- 指定mybatis 的配置文件 -->  
       <property name ="configLocation" value="classpath:mybatis.cfg.xml" />  
	</bean>
	
	<bean id ="sqlSessionFactoryBeanB" class="org.mybatis.spring.SqlSessionFactoryBean" >  
       <!-- 指定数据源 -->  
       <property name ="dataSource" ref="ds_loony" />  
       <!-- 指定mybatis 的配置文件 -->  
       <property name ="configLocation" value="classpath:mybatis.cfg.xml" />  
	</bean>
	<!--CustomSqlSessionTemplate继承SqlSessionTemplate重写getSqlSessionFactory方法，具体请下载查看--> 
	<bean id="sqlSessionTemplate" class="com.loonycoder.util.CustomSqlSessionTemplate" scope="prototype">
        <constructor-arg ref="sqlSessionFactoryBeanA" />
        <property name="targetSqlSessionFactorys">
            <map>     
                <entry value-ref ="sqlSessionFactoryBeanA" key="ds_loonycoder1"></entry >  
                <entry value-ref ="sqlSessionFactoryBeanB" key="ds_loony1"></entry >  
            </map> 
        </property>
    </bean>  
    
	<!-- 配置atomikos事务管理器 -->
	<bean id="atomikosTransactionManager" class = "com.atomikos.icatch.jta.UserTransactionManager" init-method="init" destroy-method = "close">    
	      <property name="forceShutdown" value="true"/>    
	</bean>    
	<bean id="atomikosUserTransaction" class="com.atomikos.icatch.jta.UserTransactionImp"></bean>
	<!-- 配置spring事务管理器 -->
	<bean id="transactionManager" class="org.springframework.transaction.jta.JtaTransactionManager">    
	    <property name="transactionManager">    
	        <ref bean="atomikosTransactionManager"/>    
	    </property>    
	    <property name="userTransaction">    
	        <ref bean="atomikosUserTransaction"/>    
	    </property> 
	    <!-- 必须设置，否则程序出现异常 JtaTransactionManager does not support custom isolation levels by default -->
	    <property name="allowCustomIsolationLevels" value="true"/>    
	</bean>
	
	<tx:advice id="advice" transaction-manager="transactionManager">
		<tx:attributes>
		    <!-- REQUIRED：必须要有事务, 如果没有就在上下文创建一个 -->
			<tx:method name="save*" propagation="REQUIRED"/>
			<tx:method name="creat*" propagation="REQUIRED"/>
			<tx:method name="add*" propagation="REQUIRED"/>
			<tx:method name="update*" propagation="REQUIRED"/>
			<tx:method name="delete*" propagation="REQUIRED"/>
			<!-- 支持,如果有就有,没有就没有 -->
			<tx:method name="*" propagation="SUPPORTS"/>
		</tx:attributes>
	</tx:advice>
	
	<aop:config>
	    <aop:pointcut expression="execution(* com.loonycoder.*.service.impl.*.*(..))" id="pointcut"/>
	    <!-- 吧 tx与aop的配置关联,才是完整的声明事务配置 -->
	    <aop:advisor advice-ref="advice" pointcut-ref="pointcut"/>
	</aop:config>
	<!-- 采用包扫描机制,自动会把指定的包里面的所有dao注册 -->
	<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
		<!-- 注意注入sqlSessionTemplate -->
        <property name="sqlSessionTemplateBeanName" value="sqlSessionTemplate"/>
		<property name="basePackage" value="com.loonycoder.*.dao" />
	</bean>
	<bean id="viewResolver" class="org.springframework.web.servlet.view.InternalResourceViewResolver">
		<property name="viewClass">
			<value>org.springframework.web.servlet.view.InternalResourceView</value>
		</property>
		<!--jsp存放的目录-->
		<property name="prefix">
			<value>/</value>
		</property>
		<!--jsp文件的后缀-->
		<property name="suffix">
			<value>.jsp</value>
		</property>
	</bean>
	<!-- 验证码 -->
	<bean id="captchaProducer" class="com.google.code.kaptcha.impl.DefaultKaptcha">  
        <property name="config">  
            <bean class="com.google.code.kaptcha.util.Config">  
                <constructor-arg>  
                    <props>  
                        <prop key="kaptcha.border">no</prop>  
                        <prop key="kaptcha.border.color">105,179,90</prop>  
                        <prop key="kaptcha.textproducer.font.color">red</prop>  
                        <prop key="kaptcha.image.width">200</prop>  
                        <prop key="kaptcha.textproducer.font.size">60</prop>  
                        <prop key="kaptcha.image.height">80</prop>  
                        <prop key="kaptcha.session.key">code</prop>  
                        <prop key="kaptcha.textproducer.char.length">4</prop>  
                        <prop key="kaptcha.textproducer.font.names">宋体,楷体,微软雅黑</prop>  
                    </props>  
                </constructor-arg>  
            </bean>  
        </property>  
    </bean>
    <bean id="messageSource" class="org.springframework.context.support.ReloadableResourceBundleMessageSource">  
        <property name="basename" value="classpath:messages"/>  
        <property name="fileEncodings" value="utf-8"/>  
        <property name="cacheSeconds" value="120"/>  
	</bean>
</beans> 
```

