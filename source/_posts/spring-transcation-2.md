---
title: Spring事务管理实现方式之编程式事务与声明式事务详解
categories:
    - Spring
    
date: 2019-04-10 18:06:15
tags:
  - Spring
  - 事务

---

### 写在前面

关于Spring事务的传播级别和隔离级别以及分布式事务的简单配置可以参考我上一篇文章[Spring事务隔离级别、传播行为以及Spring+Mybatis+Atomikos实现分布式事务管理]();

---

### 编程式事务

**编码方式实现事务管理（代码演示为JDBC事务管理）**

Spring实现编程式事务，依赖于2大类，分别是上篇文章提到的PlatformTransactionManager，与模版类TransactionTemplate（推荐使用）。下面分别详细介绍Spring是如何通过该类实现事务管理。

1. PlatformTransactionManager，上篇文章已经详情解说了该类所拥有的方法，具体请参考上一篇文章。

> 事务管理器配置
```bash
<bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">
  <property name="jdbcUrl" value="${db.jdbcUrl}" />
  <property name="user" value="${user}" />
  <property name="password" value="${password}" />
  <property name="driverClass" value="${db.driverClass}" />
   <!--连接池中保留的最小连接数。 --> 
     <property name="minPoolSize"> 
         <value>5</value> 
     </property> 
     <!--连接池中保留的最大连接数。Default: 15 --> 
     <property name="maxPoolSize"> 
         <value>30</value> 
     </property> 
     <!--初始化时获取的连接数，取值应在minPoolSize与maxPoolSize之间。Default: 3 --> 
     <property name="initialPoolSize"> 
         <value>10</value> 
     </property> 
     <!--最大空闲时间,60秒内未使用则连接被丢弃。若为0则永不丢弃。Default: 0 --> 
     <property name="maxIdleTime"> 
         <value>60</value> 
     </property> 
     <!--当连接池中的连接耗尽的时候c3p0一次同时获取的连接数。Default: 3 --> 
     <property name="acquireIncrement"> 
         <value>5</value> 
     </property> 
     <!--JDBC的标准参数，用以控制数据源内加载的PreparedStatements数量。但由于预缓存的statements 属于单个connection而不是整个连接池。所以设置这个参数需要考虑到多方面的因素。  如果maxStatements与maxStatementsPerConnection均为0，则缓存被关闭。Default: 0 --> 
     <property name="maxStatements"> 
         <value>0</value> 
     </property> 
     <!--每60秒检查所有连接池中的空闲连接。Default: 0 --> 
     <property name="idleConnectionTestPeriod"> 
         <value>60</value> 
     </property> 
     <!--定义在从数据库获取新连接失败后重复尝试的次数。Default: 30 --> 
     <property name="acquireRetryAttempts"> 
         <value>30</value> 
     </property> 
     <!--获取连接失败将会引起所有等待连接池来获取连接的线程抛出异常。但是数据源仍有效保留，并在下次调用getConnection()的时候继续尝试获取连接。如果设为true，那么在尝试获取连接失败后该数据源将申明已断开并永久关闭。Default: false --> 
     <property name="breakAfterAcquireFailure"> 
         <value>true</value> 
     </property> 
     <!--因性能消耗大请只在需要的时候使用它。如果设为true那么在每个connection提交的 时候都将校验其有效性。建议使用idleConnectionTestPeriod或automaticTestTable等方法来提升连接测试的性能。Default: false --> 
     <property name="testConnectionOnCheckout"> 
         <value>false</value> 
     </property> 
</bean>
<!--DataSourceTransactionManager位于org.springframework.jdbc.datasource包下，数据源事务管理类，提供对单个javax.sql.DataSource数据源的事务管理，主要用于JDBC，Mybatis框架事务管理。 -->
<bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
  <property name="dataSource" ref="dataSource" />
</bean>
```

> 业务中使用代码(以测试类展示)
```bash
import java.util.Map;
import javax.annotation.Resource;
import javax.sql.DataSource;
import org.apache.log4j.Logger;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;
 
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = { "classpath:spring-public.xml" })
public class test {
  @Resource
  private PlatformTransactionManager txManager;
  @Resource
  private  DataSource dataSource;
  private static JdbcTemplate jdbcTemplate;
  Logger logger=Logger.getLogger(test.class);
    private static final String INSERT_SQL = "insert into testtranstation(sd) values(?)";
    private static final String COUNT_SQL = "select count(*) from testtranstation";
  @Test
  public void testdelivery(){
    //定义事务隔离级别，传播行为，
      DefaultTransactionDefinition def = new DefaultTransactionDefinition();  
      def.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);  
      def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);  
      //事务状态类，通过PlatformTransactionManager的getTransaction方法根据事务定义获取；获取事务状态后，Spring根据传播行为来决定如何开启事务
      TransactionStatus status = txManager.getTransaction(def);  
      jdbcTemplate = new JdbcTemplate(dataSource);
      int i = jdbcTemplate.queryForInt(COUNT_SQL);  
      System.out.println("表中记录总数："+i);
      try {  
          jdbcTemplate.update(INSERT_SQL, "1");  
          txManager.commit(status);  //提交status中绑定的事务
      } catch (RuntimeException e) {  
          txManager.rollback(status);  //回滚
      }  
      i = jdbcTemplate.queryForInt(COUNT_SQL);  
      System.out.println("表中记录总数："+i);
  }
  
}
```

2. 使用TransactionTemplate，该类继承了接口DefaultTransactionDefinition，用于简化事务管理，事务管理由模板类定义，主要是通过TransactionCallback回调接口或TransactionCallbackWithoutResult回调接口指定，通过调用模板类的参数类型为TransactionCallback或TransactionCallbackWithoutResult的execute方法来自动享受事务管理。

TransactionTemplate模板类使用的回调接口：

- TransactionCallback：通过实现该接口的“T doInTransaction(TransactionStatus status) ”方法来定义需要事务管理的操作代码；
- TransactionCallbackWithoutResult：继承TransactionCallback接口，提供“void doInTransactionWithoutResult(TransactionStatus status)”便利接口用于方便那些不需要返回值的事务操作代码。

> 还是以测试类方式展示如何实现

```bash
@Test
public void testTransactionTemplate(){
  jdbcTemplate = new JdbcTemplate(dataSource);
    int i = jdbcTemplate.queryForInt(COUNT_SQL);  
    System.out.println("表中记录总数："+i);
  //构造函数初始化TransactionTemplate
  TransactionTemplate template = new TransactionTemplate(txManager);
  template.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);  
  //重写execute方法实现事务管理
  template.execute(new TransactionCallbackWithoutResult() {
    @Override
    protected void doInTransactionWithoutResult(TransactionStatus status) {
      jdbcTemplate.update(INSERT_SQL, "饿死");   //字段sd为int型，所以插入肯定失败报异常，自动回滚，代表TransactionTemplate自动管理事务
    }}
  );
  i = jdbcTemplate.queryForInt(COUNT_SQL);  
    System.out.println("表中记录总数："+i);
}
```

### 声明式事务

**可知编程式事务每次实现都要单独实现，但业务量大功能复杂时，使用编程式事务无疑是痛苦的，而声明式事务不同，声明式事务属于无侵入式，不会影响业务逻辑的实现。**

声明式事务实现方式主要有2种，一种为通过使用Spring的&lt;tx:advice&gt;定义事务通知与AOP相关配置实现，另为一种通过@Transactional实现事务管理实现，下面详细说明2种方法如何配置，以及相关注意点。

1. 方式一，配置文件如下
```bash
<!-- 
<tx:advice>定义事务通知，用于指定事务属性，其中“transaction-manager”属性指定事务管理器，并通过<tx:attributes>指定具体需要拦截的方法
  <tx:method>拦截方法，其中参数有：
  name:方法名称，将匹配的方法注入事务管理，可用通配符
  propagation：事务传播行为，
  isolation：事务隔离级别定义；默认为“DEFAULT”
  timeout：事务超时时间设置，单位为秒，默认-1，表示事务超时将依赖于底层事务系统；
  read-only：事务只读设置，默认为false，表示不是只读；
    rollback-for：需要触发回滚的异常定义，可定义多个，以“，”分割，默认任何RuntimeException都将导致事务回滚，而任何Checked Exception将不导致事务回滚；
    no-rollback-for：不被触发进行回滚的 Exception(s)；可定义多个，以“，”分割；
 -->
<tx:advice id="advice" transaction-manager="transactionManager">
  <tx:attributes>
      <!-- 拦截save开头的方法，事务传播行为为：REQUIRED：必须要有事务, 如果没有就在上下文创建一个 -->
    <tx:method name="save*" propagation="REQUIRED" isolation="READ_COMMITTED" timeout="" read-only="false" no-rollback-for="" rollback-for=""/>
    <!-- 支持,如果有就有,没有就没有 -->
    <tx:method name="*" propagation="SUPPORTS"/>
  </tx:attributes>
</tx:advice>
<!-- 定义切入点，expression为切人点表达式，如下是指定impl包下的所有方法，具体以自身实际要求自定义  -->
<aop:config>
    <aop:pointcut expression="execution(* com.loonycoder.*.service.impl.*.*(..))" id="pointcut"/>
    <!--<aop:advisor>定义切入点，与通知，把tx与aop的配置关联,才是完整的声明事务配置 -->
    <aop:advisor advice-ref="advice" pointcut-ref="pointcut"/>
</aop:config>
```

关于事务传播行为与隔离级别，可参考[]();

**注意：**
- 事务回滚异常只能为RuntimeException异常，而Checked Exception异常不回滚，捕获异常不抛出也不会回滚，但可以强制事务回滚：TransactionAspectSupport.currentTransactionStatus().isRollbackOnly();
- 解决“自我调用”而导致的不能设置正确的事务属性问题，可参考<http://www.iteye.com/topic/1122740>

2. 方式二通过@Transactional实现事务管理
```bash
<bean id="txManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">   
     <property name="dataSource" ref="dataSource"/>
</bean>    
<tx:annotation-driven transaction-manager="txManager"/> //开启事务注解
```

@Transactional(propagation=Propagation.REQUIRED,isolation=Isolation.READ_COMMITTED)，具体参数跟上面&lt;tx:method&gt;中一样
Spring提供的@Transaction注解事务管理，内部同样是利用环绕通知TransactionInterceptor实现事务的开启及关闭。
使用@Transactional注意点：
- 如果在接口、实现类或方法上都指定了@Transactional 注解，则优先级顺序为方法>实现类>接口；
- 建议只在实现类或实现类的方法上使用@Transactional，而不要在接口上使用，这是因为如果使用JDK代理机制（<font style="color: red">基于接口的代理</font>）是没问题；而使用使用CGLIB代理（继承）机制时就会遇到问题，因为其使用基于类的代理而不是接口，这是因为<font style="color: red">接口上的@Transactional注解是“不能继承的”</font>；
