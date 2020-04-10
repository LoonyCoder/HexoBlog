---
title: 轻量级控制反转和面向切面的容器框架——Spring（三）
categories:
    - Java框架
    
date: 2019-07-29 00:43:19
tags:
  - Spring全家桶
  - IoC
  - AOP

---

![spring](/images/spring_logo.jpg)

### 写在前面

之前整理过一些关于Spring框架零散的知识点，一直没时间整理，恰好最近又拜读了**应癫**老师的课程，所以赶紧梳理一下关于Spring的相关知识。

---

### Spring IoC应用

#### Spring IoC 基础

![spring](/images/spring/s20.png)

##### BeanFactory与ApplicationContext区别

BeanFactory是Spring框架中IoC容器的顶层接⼝,它只是⽤来定义⼀些基础功能,定义⼀些基础规范,⽽ApplicationContext是它的⼀个⼦接⼝，所以ApplicationContext是具备BeanFactory提供的全部功能的。
通常，我们称BeanFactory为SpringIOC的基础容器，ApplicationContext是容器的⾼级接⼝，⽐BeanFactory要拥有更多的功能，⽐如说国际化⽀持和资源访问（xml，java配置类）等等。

![spring](/images/spring/s21.png)

启动 IoC 容器的⽅式
- Java环境下启动IoC容器
	- ClassPathXmlApplicationContext：从类的根路径下加载配置⽂件（推荐使⽤）
	- FileSystemXmlApplicationContext：从磁盘路径上加载配置⽂件
	- AnnotationConfigApplicationContext：纯注解模式下启动Spring容器
- Web环境下启动IoC容器
	- 从xml启动容器
```bash
<!DOCTYPE web-app PUBLIC
"-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN"
"http://java.sun.com/dtd/web-app_2_3.dtd" >
<web-app> 
	<display-name>Archetype Created Web Application</display-name>
	<!--配置Spring ioc容器的配置⽂件-->
	<context-param> 
		<param-name>contextConfigLocation</param-name> 
		<param-value>classpath:applicationContext.xml</param-value>
	</context-param>
	<!--使⽤监听器启动Spring的IOC容器-->
	<listener> 
		<listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
	</listener>
</web-app>
```
	- 从配置类启动容器
```bash
<!DOCTYPE web-app PUBLIC
"-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN"
"http://java.sun.com/dtd/web-app_2_3.dtd" >
<web-app>
	<display-name>Archetype Created Web Application</display-name>
	<!--告诉ContextloaderListener知道我们使⽤注解的⽅式启动ioc容器-->
	<context-param> 
		<param-name>contextClass</param-name>
		<param￾value>org.springframework.web.context.support.AnnotationConfigWebApplicationContext</param-value>
	</context-param>
	<!--配置启动类的全限定类名-->
	<context-param> 
		<param-name>contextConfigLocation</param-name> 
		<param-value>com.loonycoder.SpringConfig</param-value>
	</context-param>
	<!--使⽤监听器启动Spring的IOC容器-->
	<listener> 
		<listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
	</listener>
</web-app>
```

##### 纯xml模式

本部分内容我们不采⽤⼀⼀讲解知识点的⽅式，⽽是采⽤Spring IoC 纯 xml 模式改造我们前⾯⼿写的
IoC 和 AOP 实现，在改造的过程中，把各个知识点串起来。

- xml ⽂件头

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.springframework.org/schema/beans
https://www.springframework.org/schema/beans/spring-beans.xsd">
```

- 实例化Bean的三种⽅式
	- ⽅式⼀：使⽤⽆参构造函数。
	在默认情况下，它会通过反射调⽤⽆参构造函数来创建对象。如果类中没有⽆参构造函数，将创建失败。
```bash
<!--配置service对象-->
<bean id="userService" class="com.loonycoder.service.impl.TransferServiceImpl">
</bean>
```

	- ⽅式⼆：使⽤静态⽅法创。
	在实际开发中，我们使⽤的对象有些时候并不是直接通过构造函数就可以创建出来的，它可能在创建的过程 中会做很多额外的操作。此时会提供⼀个创建对象的⽅法，恰好这个⽅法是static修饰的⽅法，即是此种情况。例如，我们在做Jdbc操作时，会⽤到<code>java.sql.Connection</code>接⼝的实现类，如果是mysql数据库，那么⽤的就 是JDBC4Connection，但是我们不会去写 <code>JDBC4Connection connection = new JDBC4Connection() </code>，因为我们要注册驱动，还要提供URL和凭证信息，⽤ <code>DriverManager.getConnection </code>⽅法来获取连接。那么在实际开发中，尤其早期的项⽬没有使⽤Spring框架来管理对象的创建，但是在设计时使⽤了⼯⼚模式 解耦，那么当接⼊spring之后，⼯⼚类创建对象就具有和上述例⼦相同特征，即可采⽤此种⽅式配置。
```bash
<!--使⽤静态⽅法创建对象的配置⽅式-->
<bean id="userService" class="com.loonycoder.factory.BeanFactory"
factory-method="getTransferService"></bean>
```

	- ⽅式三：使⽤实例化⽅法创建。
	此种⽅式和上⾯静态⽅法创建其实类似，区别是⽤于获取对象的⽅法不再是static修饰的了，⽽是类中的⼀ 个普通⽅法。此种⽅式⽐静态⽅法创建的使⽤⼏率要⾼⼀些。在早期开发的项⽬中，⼯⼚类中的⽅法有可能是静态的，也有可能是⾮静态⽅法，当是⾮静态⽅法时，即可 采⽤下⾯的配置⽅式：
```bash
<!--使⽤实例⽅法创建对象的配置⽅式-->
<bean id="beanFactory" class="com.loonycoder.factory.instancemethod.BeanFactory"></bean> 
<bean id="transferService" factory-bean="beanFactory" factory-method="getTransferService"></bean>
```

- Bean的作用范围及⽣命周期
	- 作⽤范围的改变
	在spring框架管理Bean对象的创建时，Bean对象默认都是单例的，但是它⽀持配置的⽅式改变作⽤范围。作⽤范围官⽅提供的说明如下图：

![spring](/images/spring/s22.png)

在上图中提供的这些选项中，我们实际开发中⽤到最多的作⽤范围就是singleton（单例模式）和prototype（原型模式，也叫多例模式）。配置⽅式参考下⾯的代码：
```bash
<!--配置service对象-->
<bean id="transferService" class="com.loonycoder.service.impl.TransferServiceImpl" scope="singleton">
</bean>
```

	- 不同作⽤范围的⽣命周期
	**单例模式：singleton**
	对象出⽣：当创建容器时，对象就被创建了。
	对象活着：只要容器在，对象⼀直活着。
	对象死亡：当销毁容器时，对象就被销毁了。
	⼀句话总结：单例模式的bean对象⽣命周期与容器相同。
	**多例模式：prototype**
	对象出⽣：当使⽤对象时，创建新的对象实例。
	对象活着：只要对象在使⽤中，就⼀直活着。
	对象死亡：当对象⻓时间不⽤时，被java的垃圾回收器回收了。
	⼀句话总结：多例模式的bean对象，spring框架只负责创建，不负责销毁。

- Bean标签属性

在基于xml的IoC配置中，bean标签是最基础的标签。它表示了IoC容器中的⼀个对象。换句话说，如果⼀个对象想让spring管理，在XML的配置中都需要使⽤此标签配置，Bean标签的属性如下：
**id属性：**⽤于给bean提供⼀个唯⼀标识。在⼀个标签内部，标识必须唯⼀。
**class属性：**⽤于指定创建Bean对象的全限定类名。
**name属性：**⽤于给bean提供⼀个或多个名称。多个名称⽤空格分隔。
**factory-bean属性：**⽤于指定创建当前bean对象的⼯⼚bean的唯⼀标识。当指定了此属性之后，class属性失效。
**factory-method属性：**⽤于指定创建当前bean对象的⼯⼚⽅法，如配合factory-bean属性使⽤，则class属性失效。如配合class属性使⽤，则⽅法必须是static的。
**scope属性：**⽤于指定bean对象的作⽤范围。通常情况下就是singleton。当要⽤到多例模式时，可以配置为prototype。
**init-method属性：**⽤于指定bean对象的初始化⽅法，此⽅法会在bean对象装配后调⽤。必须是⼀个⽆参⽅法。
**destory-method属性：**⽤于指定bean对象的销毁⽅法，此⽅法会在bean对象销毁前执⾏。它只能为scope是singleton时起作⽤。

- DI 依赖注⼊的xml配置
	- 依赖注⼊分类
		- 按照注⼊的⽅式分类
		  **构造函数注⼊：**顾名思义，就是利⽤带参构造函数实现对类成员的数据赋值。
		  **set⽅法注⼊：**它是通过类成员的set⽅法实现数据的注⼊。（使⽤最多的）
		- 按照注⼊的数据类型分类
		  **基本类型和String**
		  注⼊的数据类型是基本类型或者是字符串类型的数据。
		  **其他Bean类型**
		  注⼊的数据类型是对象类型，称为其他Bean的原因是，这个对象是要求出现在IoC容器中的。那么针对当前Bean来说，就是其他Bean了。
		  **复杂类型（集合类型）**
		  注⼊的数据类型是Aarry，List，Set，Map，Properties中的⼀种类型。
	- 依赖注⼊的配置实现之构造函数注⼊ 顾名思义，就是利⽤构造函数实现对类成员的赋值。它的使⽤要求是，类中提供的构造函数参数个数必须和配置的参数个数⼀致，且数据类型匹配。同时需要注意的是，当没有⽆参构造时，则必须提供构造函数参数的注⼊，否则Spring框架会报错。

![spring](/images/spring/s23.png)
![spring](/images/spring/s24.png)

在使⽤构造函数注⼊时，涉及的标签是 <code>constructor-arg</code> ，该标签有如下属性：
**name：**⽤于给构造函数中指定名称的参数赋值。
**index：**⽤于给构造函数中指定索引位置的参数赋值。
**value：**⽤于指定基本类型或者String类型的数据。
**ref：**⽤于指定其他Bean类型的数据。写的是其他bean的唯⼀标识。
	- 依赖注⼊的配置实现之set⽅法注⼊
	顾名思义，就是利⽤字段的set⽅法实现赋值的注⼊⽅式。此种⽅式在实际开发中是使⽤最多的注⼊⽅式。

![spring](/images/spring/s25.png)
![spring](/images/spring/s26.png)

在使⽤set⽅法注⼊时，需要使⽤ <code>property</code> 标签，该标签属性如下：
**name：**指定注⼊时调⽤的set⽅法名称。（注：不包含set这三个字⺟,druid连接池指定属性名称）
**value：**指定注⼊的数据。它⽀持基本类型和String类型。
**ref：**指定注⼊的数据。它⽀持其他bean类型。写的是其他bean的唯⼀标识。
- 复杂数据类型注⼊。
⾸先，解释⼀下复杂类型数据，它指的是集合类型数据。集合分为两类，⼀类是List结构（数组结构），⼀类是Map接⼝（键值对）。接下来就是注⼊的⽅式的选择，只能在构造函数和set⽅法中选择，我们的示例选⽤set⽅法注⼊。

![spring](/images/spring/s27.png)
![spring](/images/spring/s28.png)

在List结构的集合数据注⼊时， <code>array , list , set</code> 这三个标签通⽤，另外注值的 <code>value</code> 标签内部
可以直接写值，也可以使⽤ <code>bean</code> 标签配置⼀个对象，或者⽤ <code>ref</code> 标签引⽤⼀个已经配合的bean
的唯⼀标识。
在Map结构的集合数据注⼊时， <code>map</code> 标签使⽤ <code>entry</code> ⼦标签实现数据注⼊， <code>entry</code> 标签可以使⽤**key**和**value**属性指定存⼊map中的数据。使⽤value-ref属性指定已经配置好的bean的引⽤。
同时 <code>entry</code> 标签中也可以使⽤ <code>ref</code> 标签，但是不能使⽤ <code>bean</code> 标签。⽽ <code>property</code> 标签中不能使⽤ <code>ref</code> 或者 <code>bean</code> 标签引⽤对象。

##### xml与注解相结合模式

注意：
1. 实际企业开发中，纯xml模式使⽤已经很少了
2. 引⼊注解功能，不需要引⼊额外的jar
3. xml+注解结合模式，xml⽂件依然存在，所以，spring IOC容器的启动仍然从加载xml开始
4. 哪些bean的定义写在xml中，哪些bean的定义使⽤注解

**第三⽅jar中的bean定义在xml，⽐如德鲁伊数据库连接池
⾃⼰开发的bean定义使⽤注解**

- xml中标签与注解的对应（IoC）

xml形式 | 对应的注解形式 | 
:-|:-|
标签|@Component("accountDao")，注解加在类上。bean的id属性内容直接配置在注解后⾯如果不配置，默认定义个这个bean的id为类的类名⾸字⺟⼩写；另外，针对分层代码开发提供了@Componenet的三种别名@Controller、@Service、@Repository分别⽤于控制层类、服务层类、dao层类的bean定义，这四个注解的⽤法完全⼀样，只是为了更清晰的区分⽽已。
标签的scope属性|@Scope("prototype")，默认单例，注解加在类上
标签的init-method属性|@PostConstruct，注解加在⽅法上，该⽅法就是初始化后调⽤的⽅法
标签的destorymethod属性|@PreDestory，注解加在⽅法上，该⽅法就是销毁前调⽤的⽅法

- DI 依赖注⼊的注解实现⽅式
**@Autowired**（推荐使⽤）
@Autowired为Spring提供的注解，需要导⼊包
<code>org.springframework.beans.factory.annotation.Autowired</code>
@Autowired采取的策略为按照类型注⼊。
```bash
public class TransferServiceImpl {
	@Autowired
	private AccountDao accountDao; 
}
```

如上代码所示，这样装配回去spring容器中找到类型为AccountDao的类，然后将其注⼊进来。这样会产⽣⼀个问题，当⼀个类型有多个bean值的时候，会造成⽆法选择具体注⼊哪⼀个的情况，这个时候我们需要配合着<code>@Qualifier</code>使⽤。<code>@Qualifier</code>告诉Spring具体去装配哪个对象。
```bash
public class TransferServiceImpl {
	@Autowired
	@Qualifier(name="jdbcAccountDaoImpl") 
	private AccountDao accountDao; 
}
```

这个时候我们就可以通过类型和名称定位到我们想注⼊的对象。
**@Resource**
<code>@Resource</code> 注解由 J2EE 提供，需要导⼊包 <code>javax.annotation.Resource</code>
<code>@Resource</code> 默认按照 ByName ⾃动注⼊。
```bash
public class TransferService {
	@Resource
	private AccountDao accountDao;
	@Resource(name="studentDao") 
	private StudentDao studentDao;
	@Resource(type="TeacherDao") 
	private TeacherDao teacherDao;
	@Resource(name="manDao",type="ManDao") 
	private ManDao manDao;
}
```

	- 如果同时指定了 name 和 type，则从Spring上下⽂中找到唯⼀匹配的bean进⾏装配，找不到则抛出异常。
	- 如果指定了 name，则从上下⽂中查找名称（id）匹配的bean进⾏装配，找不到则抛出异常。
	- 如果指定了 type，则从上下⽂中找到类似匹配的唯⼀bean进⾏装配，找不到或是找到多个，都会抛出异常。
	- 如果既没有指定name，⼜没有指定type，则⾃动按照byName⽅式进⾏装配；

**注意:**
<code>@Resource</code> 在 Jdk 11中已经移除，如果要使⽤，需要单独引⼊jar包
```bash
<dependency> 
	<groupId>javax.annotation</groupId> 
	<artifactId>javax.annotation-api</artifactId>
	<version>1.3.2</version>
</dependency>
```


##### 纯注解模式

改造xml + 注解模式，将xml中遗留的内容全部以注解的形式迁移出去，最终删除xml，从Java配置类启动。

**对应注解**
<code>@Configuration</code>：表名当前类是⼀个配置类
<code>@ComponentScan</code>：替代 context:component-scan
<code>@PropertySource</code>：引⼊外部属性配置⽂件
<code>@Import</code>：引⼊其他配置类
<code>@Value</code>：对变量赋值，可以直接赋值，也可以使⽤ ${} 读取资源配置⽂件中的信息
<code>@Bean</code>：将⽅法返回对象加⼊ SpringIoC 容器

#### SpringIoC高级特性

##### lazy-init延迟加载

Bean的延迟加载（延迟创建）
ApplicationContext 容器的默认⾏为是在启动服务器时将所有 singleton bean 提前进⾏实例化。提前实例化意味着作为初始化过程的⼀部分，ApplicationContext 实例会创建并配置所有的singleton bean。
⽐如：
```bash
<bean id="testBean" class="cn.loonycoder.LazyBean" />
 <!--该bean默认的设置为: -->
<bean id="testBean" calss="cn.loonycoder.LazyBean" lazy-init="false" />
```
lazy-init=“false”，⽴即加载，表示在spring启动时，⽴刻进⾏实例化。
如果不想让⼀个singleton bean 在 ApplicationContext实现初始化时被提前实例化，那么可以将bean设置为延迟实例化。

```bash
<bean id="testBean" calss="cn.loonycoder.LazyBean" lazy-init="true" />
```

设置 lazy-init 为 true 的 bean 将不会在 ApplicationContext 启动时提前被实例化，⽽是第⼀次向容器通过 getBean 索取 bean 时实例化的。
如果⼀个设置了⽴即加载的 bean1，引⽤了⼀个延迟加载的 bean2 ，那么 bean1 在容器启动时被实例化，⽽ bean2 由于被 bean1 引⽤，所以也被实例化，这种情况也符合延时加载的 bean 在第⼀次调⽤时才被实例化的规则。
也可以在容器层次中通过在 元素上使⽤ "default-lazy-init" 属性来控制延时初始化。如下⾯配置：

```bash
<beans default-lazy-init="true">
<!-- no beans will be eagerly pre-instantiated... -->
</beans>
```

如果⼀个 bean 的 scope 属性为 scope=“pototype” 时，即使设置了 lazy-init=“false”，容器启动时也不会实例化bean，⽽是调⽤ getBean ⽅法实例化的。

**应⽤场景**
1. 开启延迟加载⼀定程度提⾼容器启动和运转性能
2. 对于不常使⽤的 Bean 设置延迟加载，这样偶尔使⽤的时候再加载，不必要从⼀开始该 Bean 就占⽤资源

##### FactoryBean和BeanFactory

BeanFactory接⼝是容器的顶级接⼝，定义了容器的⼀些基础⾏为，负责⽣产和管理Bean的⼀个⼯⼚，具体使⽤它下⾯的⼦接⼝类型，⽐如ApplicationContext；此处我们重点分析FactoryBean
Spring中Bean有两种，⼀种是普通Bean，⼀种是⼯⼚Bean（FactoryBean），FactoryBean可以⽣成某⼀个类型的Bean实例（返回给我们），也就是说我们可以借助于它⾃定义Bean的创建过程。
Bean创建的三种⽅式中的静态⽅法和实例化⽅法和FactoryBean作⽤类似，FactoryBean使⽤较多，尤其在Spring框架⼀些组件中会使⽤，还有其他框架和Spring框架整合时使⽤。

```bash
// 可以让我们⾃定义Bean的创建过程（完成复杂Bean的定义）
public interface FactoryBean<T> {
	@Nullable
	// 返回FactoryBean创建的Bean实例，如果isSingleton返回true，则该实例会放到Spring容器
	的单例对象缓存池中Map
	T getObject() throws Exception;
	@Nullable
	// 返回FactoryBean创建的Bean类型
	Class<?> getObjectType();
	// 返回作⽤域是否单例
	default boolean isSingleton() {
		return true; 
	} 
}
```

Company类

```bash
package com.loonycoder.pojo;

public class Company {
	private String name;
	private String address;
	private int scale;
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getAddress() {
		return address;
	}
	public void setAddress(String address) {
		this.address = address;
	}
	public int getScale() {
		return scale;
	}
	public void setScale(int scale) {
		this.scale = scale;
	}
	@Override
	public String toString() {
		return "Company{" + "name='" + name + '\'' + ", address='" + address + '\'' + ", scale=" + scale + '}';
	}
}
```

CompanyFactoryBean类

```bash
package com.loonycoder.factory;
import com.loonycoder.pojo.Company;
import org.springframework.beans.factory.FactoryBean;

public class CompanyFactoryBean implements FactoryBean<Company> {
	private String companyInfo; // 公司名称,地址,规模
	public void setCompanyInfo(String companyInfo) {
		this.companyInfo = companyInfo;
	}
	@Override
	public Company getObject() throws Exception {
		// 模拟创建复杂对象Company
		Company company = new Company();
		String[] strings = companyInfo.split(",");
		company.setName(strings[0]);
		company.setAddress(strings[1]);
		company.setScale(Integer.parseInt(strings[2]));
		return company;
	}
	@Override
	public Class<?> getObjectType() {
		return Company.class;
	}
	@Override
	public boolean isSingleton() {
		return true;
	}
}
```

xml配置

```bash
<bean id="companyBean" class="com.loonycoder.factory.CompanyFactoryBean"> 
	<property name="companyInfo" value="loonycoder,望京,500"/>
</bean>
```

测试，获取FactoryBean产⽣的对象

```bash
Object companyBean = applicationContext.getBean("companyBean");
System.out.println("bean:" + companyBean);
// 结果如下
bean:Company{name='loonycoder', address='望京', scale=500}
```

测试，获取FactoryBean，需要在id之前添加“&”

```bash
Object companyBean = applicationContext.getBean("&companyBean");
System.out.println("bean:" + companyBean);
// 结果如下
bean:com.loonycoder.factory.CompanyFactoryBean@53f6fd09
```

##### 后置处理器

Spring提供了两种后处理bean的扩展接⼝，分别为 BeanPostProcessor 和BeanFactoryPostProcessor，两者在使⽤上是有所区别的。
⼯⼚初始化（BeanFactory）—> Bean对象
在BeanFactory初始化之后可以使⽤BeanFactoryPostProcessor进⾏后置处理做⼀些事情
在Bean对象实例化（并不是Bean的整个⽣命周期完成）之后可以使⽤BeanPostProcessor进⾏后置处理做⼀些事情
**注意：对象不⼀定是springbean，⽽springbean⼀定是个对象**

###### BeanPostProcessor

BeanPostProcessor是针对Bean级别的处理，可以针对某个具体的Bean。

![spring](/images/spring/s29.png)

该接⼝提供了两个⽅法，分别在Bean的初始化⽅法前和初始化⽅法后执⾏，具体这个初始化⽅法指的是什么⽅法，类似我们在定义bean时，定义了init-method所指定的⽅法。
定义⼀个类实现了BeanPostProcessor，默认是会对整个Spring容器中所有的bean进⾏处理。如果要对具体的某个bean处理，可以通过⽅法参数判断，两个类型参数分别为Object和String，第⼀个参数是每个bean的实例，第⼆个参数是每个bean的name或者id属性的值。所以我们可以通过第⼆个参数，来判断我们将要处理的具体的bean。
**注意：处理是发⽣在Spring容器的实例化和依赖注⼊之后。**

###### BeanFactoryPostProcessor

BeanFactory级别的处理，是针对整个Bean的⼯⼚进⾏处理，典型应⽤:PropertyPlaceholderConfigurer

![spring](/images/spring/s30.png)

此接⼝只提供了⼀个⽅法，⽅法参数为ConfigurableListableBeanFactory，该参数类型定义了⼀些⽅法。

![spring](/images/spring/s31.png)

其中有个⽅法名为<code>getBeanDefinition</code>的⽅法，我们可以根据此⽅法，找到我们定义bean 的BeanDefinition对象。然后我们可以对定义的属性进⾏修改，以下是BeanDefinition中的⽅法。

![spring](/images/spring/s32.png)

⽅法名字类似我们bean标签的属性，<code>setBeanClassName</code>对应bean标签中的class属性，所以当我们拿到BeanDefinition对象时，我们可以⼿动修改bean标签中所定义的属性值。
**BeanDefinition对象：**我们在 XML 中定义的 bean标签，Spring 解析 bean 标签成为⼀个 JavaBean，这个JavaBean 就是 BeanDefinition
**注意：调⽤ <code>BeanFactoryPostProcessor</code> ⽅法时，这时候bean还没有实例化，此时 bean 刚被解析成BeanDefinition对象**




