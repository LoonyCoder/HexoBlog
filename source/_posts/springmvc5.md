---
title: 优秀而又强大的表现层框架——SpringMVC（五）
categories:
    - Java框架
    
date: 2019-06-19 19:33:29
tags:
  - web
  - 表现层框架

---

### 写在前面

最近系统的学习了下这个优秀而又强大的表现层框架——SpringMVC，拜读了**应癫**老师的《SpringMVC源码剖析》，深表感谢！

**源码地址：**[手写SpringMVC框架](https://github.com/LoonyCoder/springmvc)
**欢迎star/fork，给作者一些鼓励！**

### SSM整合

#### 整合策略

SSM = Spring + SpringMVC + Mybatis = （Spring + Mybatis）+ SpringMVC

先整合 Spring + Mybatis 然后再整合 SpringMVC

基于的需求：查询 Account 表的全部数据显示到⻚⾯。

#### Mybatis整合Spring

- 整合⽬标
	- 数据库连接池以及事务管理都交给Spring容器来完成
	- SqlSessionFactory对象应该放到Spring容器中作为单例对象管理
	- Mapper动态代理对象交给Spring管理，我们从Spring容器中直接获得Mapper的代理对象
- 整合所需 Jar 分析
	- Junit测试jar（4.12版本）
	- Mybatis的jar（3.4.5）
	- Spring相关jar（spring-context、spring-test、spring-jdbc、spring-tx、spring-aop、aspectjweaver）
	- Mybatis/Spring整合包jar（mybatis-spring-xx.jar）
	- Mysql数据库驱动jar
	- Druid数据库连接池的jar
- 整合后的 Pom 坐标
```bash
<dependency> 
	<groupId>junit</groupId> 
	<artifactId>junit</artifactId> 
	<version>4.12</version> 
	<scope>test</scope>
</dependency>
<!--mybatis-->
<dependency> 
	<groupId>org.mybatis</groupId> 
	<artifactId>mybatis</artifactId> 
	<version>3.4.5</version>
</dependency>
<!--spring相关-->
<dependency> 
	<groupId>org.springframework</groupId> 
	<artifactId>spring-context</artifactId> 
	<version>5.1.12.RELEASE</version>
</dependency> 
<dependency>
	<groupId>org.springframework</groupId>
	<artifactId>spring-test</artifactId>
	<version>5.1.12.RELEASE</version>
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
<dependency> 
	<groupId>org.springframework</groupId> 
	<artifactId>spring-aop</artifactId> 
	<version>5.1.12.RELEASE</version>
</dependency> 
<dependency> 
	<groupId>org.aspectj</groupId> 
	<artifactId>aspectjweaver</artifactId> 
	<version>1.8.9</version>
</dependency>
<!--mybatis与spring的整合包-->
<dependency> 
	<groupId>org.mybatis</groupId> 
	<artifactId>mybatis-spring</artifactId> 
	<version>2.0.3</version>
</dependency>
<!--数据库驱动jar-->
<dependency> 
	<groupId>mysql</groupId> 
	<artifactId>mysql-connector-java</artifactId> 
	<version>5.1.46</version>
</dependency>
<!--druid连接池-->
<dependency> 
	<groupId>com.alibaba</groupId> 
	<artifactId>druid</artifactId> 
	<version>1.1.21</version>
</dependency>	
```

- jdbc.properties
```bash
jdbc.driver=com.mysql.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/bank
jdbc.username=root
jdbc.password=root
```

- Spring 配置⽂件

	- applicationContext-dao.xml

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
xmlns:context="http://www.springframework.org/schema/context"
xmlns:tx="http://www.springframework.org/schema/tx"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="
http://www.springframework.org/schema/beans
http://www.springframework.org/schema/beans/spring-beans.xsd
http://www.springframework.org/schema/context
http://www.springframework.org/schema/context/spring-context.xsd
http://www.springframework.org/schema/tx
http://www.springframework.org/schema/tx/spring-tx.xsd
">
	<!--包扫描-->
	<context:component-scan base-package="com.loonycoder.mapper"/>
	<!--数据库连接池以及事务管理都交给Spring容器来完成-->
	<!--引⼊外部资源⽂件-->
	<context:property-placeholder
	location="classpath:jdbc.properties"/>
	<!--第三⽅jar中的bean定义在xml中-->
	<bean id="dataSource" class="com.alibaba.druid.pool.DruidDataSource"> <property name="driverClassName" value="${jdbc.driver}"/>
		<property name="url" value="${jdbc.url}"/>
		<property name="username" value="${jdbc.username}"/>
		<property name="password" value="${jdbc.password}"/>
	</bean>
	<!--SqlSessionFactory对象应该放到Spring容器中作为单例对象管理原来mybaits中sqlSessionFactory的构建是需要素材的：SqlMapConfig.xml中的内容-->
	<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
		<!--别名映射扫描-->
		<property name="typeAliasesPackage" value="com.loonycoder.pojo"/>
		<!--数据源dataSource-->
		<property name="dataSource" ref="dataSource"/>
	</bean>
	<!--Mapper动态代理对象交给Spring管理，我们从Spring容器中直接获得Mapper的代理对
	象-->
	<!--扫描mapper接⼝，⽣成代理对象，⽣成的代理对象会存储在ioc容器中-->
	<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
		<!--mapper接⼝包路径配置-->
		<property name="basePackage" value="com.loonycoder.mapper"/>
		<property name="sqlSessionFactoryBeanName" value="sqlSessionFactory"/>
	</bean>
</beans>
```

	- applicationContext-service.xml

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
xmlns:lcContext="http://www.springframework.org/schema/context"
xmlns:tx="http://www.springframework.org/schema/tx"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="
http://www.springframework.org/schema/beans
http://www.springframework.org/schema/beans/spring-beans.xsd
http://www.springframework.org/schema/context
http://www.springframework.org/schema/context/spring-context.xsd
http://www.springframework.org/schema/tx
http://www.springframework.org/schema/tx/spring-tx.xsd
">
	<!--包扫描-->
	<lcContext:component-scan base-package="com.loonycoder.service"/>
	<!--事务管理-->
	<bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager"> <property name="dataSource" ref="dataSource"/>
	</bean>
	<!--事务管理注解驱动-->
	<tx:annotation-driven transaction-manager="transactionManager"/>
</beans>
```

- AccountMapper接⼝

```bash
import com.loonycoder.pojo.Account;
import java.util.List;
public interface AccountMapper {
	// 定义dao层接⼝⽅法--> 查询account表所有数据
	List<Account> queryAccountList() throws Exception; 
}
```

- AccountMapper.xml

```bash
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.loonycoder.mapper.AccountMapper"> 
	<select id="queryAccountList" resultType="com.loonycoder.pojo.Account">
	 	select * from account
	</select>
</mapper>
```

- 测试程序

```bash
import com.loonycoder.pojo.Account;
import com.loonycoder.service.AccountService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import java.util.List;
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath*:application*.xml"})
public class MybatisSpringTest {
	// 希望测试ioc容器中的哪个对象你注⼊即可。
	@Autowired
	private AccountService accountService;
	@Test
	public void testMybatisSpring() throws Exception {
		List<Account> accounts = accountService.queryAccountList();
		for (int i = 0; i < accounts.size(); i++) {
			Account account = accounts.get(i);
			System.out.println(account);
	 	}
	}
}
```

#### 整合SpringMVC

- 整合思路

把SpringMVC的⼊⻔案例整合进来即可（在已有⼯程基础之上开发⼀个SpringMVC⼊⻔案例）

- 引⼊pom坐标

```bash
<!--SpringMVC-->
<dependency> 
	<groupId>org.springframework</groupId> 
	<artifactId>spring-webmvc</artifactId> 
	<version>5.1.12.RELEASE</version>
</dependency>
<!--jsp-api&servlet-api-->
<dependency> 
	<groupId>javax.servlet</groupId> 
	<artifactId>jsp-api</artifactId> 
	<version>2.0</version>
	<scope>provided</scope>
</dependency> 
<dependency> 
	<groupId>javax.servlet</groupId>
	<artifactId>javax.servlet-api</artifactId>
	<version>3.1.0</version> 
	<scope>provided</scope>
</dependency>
<!--⻚⾯使⽤jstl表达式-->
<dependency> 
	<groupId>jstl</groupId> 
	<artifactId>jstl</artifactId> 
	<version>1.2</version>
</dependency>
<dependency> 
	<groupId>taglibs</groupId> 
	<artifactId>standard</artifactId> 
	<version>1.1.2</version>
</dependency>
<!--json数据交互所需jar，start-->
<dependency> 
	<groupId>com.fasterxml.jackson.core</groupId> 
	<artifactId>jackson-core</artifactId> 
	<version>2.9.0</version>
</dependency> 
<dependency> 
	<groupId>com.fasterxml.jackson.core</groupId>
	 <artifactId>jackson-databind</artifactId> 
	 <version>2.9.0</version>
</dependency>
<dependency> 
	<groupId>com.fasterxml.jackson.core</groupId> 
	<artifactId>jackson-annotations</artifactId> 
	<version>2.9.0</version>
</dependency>
<!--json数据交互所需jar，end-->
```

- 添加SpringMVC ⼊⻔案例

	- springmvc.xml

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
xmlns:context="http://www.springframework.org/schema/context"
xmlns:mvc="http://www.springframework.org/schema/mvc"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.springframework.org/schema/beans
http://www.springframework.org/schema/beans/spring-beans.xsd
http://www.springframework.org/schema/context
http://www.springframework.org/schema/context/springcontext.xsd
http://www.springframework.org/schema/mvc
http://www.springframework.org/schema/mvc/spring-mvc.xsd
">
	<!--扫描controller-->
	<context:component-scan base-package="com.loonycoder.controller"/>
	<mvc:annotation-driven/>
</beans>
```

	- Controller类

```bash
import com.loonycoder.pojo.Account;
import com.loonycoder.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import java.util.List;
@Controller
@RequestMapping("/account")
public class AccountController {
	/**
	* Spring容器和SpringMVC容器是有层次的（⽗⼦容器）
	* Spring容器：service对象+dao对象
	* SpringMVC容器：controller对象————可以引⽤到Spring容器中的对象
	*/
	@Autowired
	private AccountService accountService;
	@RequestMapping("/queryAll")
	@ResponseBody
	public List<Account> queryAll() throws Exception {
		return accountService.queryAccountList();
	}
}
```

	- web.xml

```bash
<!DOCTYPE web-app PUBLIC
"-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN"
"http://java.sun.com/dtd/web-app_2_3.dtd" >
<web-app> 
	<display-name>Archetype Created Web Application</display-name> 
	<context-param> 
		<param-name>contextConfigLocation</param-name> 
		<param-value>classpath*:applicationContext*.xml</param-value>
	</context-param>
	<!--spring框架启动-->
	<listener> 
		<listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
	</listener>
	<!--springmvc启动-->
	<servlet> 
		<servlet-name>springmvc</servlet-name> 
		<servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
			<init-param> 
			<param-name>contextConfigLocation</param-name> 
			<param-value>classpath*:springmvc.xml</param-value>
		</init-param> 
		<load-on-startup>1</load-on-startup>
	</servlet> 
	<servlet-mapping> 
		<servlet-name>springmvc</servlet-name> 
		<url-pattern>/</url-pattern>
	</servlet-mapping>
</web-app>
```



