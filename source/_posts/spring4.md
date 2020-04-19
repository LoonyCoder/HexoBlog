---
title: 轻量级控制反转和面向切面的容器框架——Spring（四）
categories:
    - Java框架
    
date: 2019-08-12 15:48:37
tags:
  - Spring全家桶
  - IoC
  - AOP

---

![spring](/images/spring_logo.jpg)

### 写在前面

之前整理过一些关于Spring框架零散的知识点，一直没时间整理，恰好最近又拜读了**应癫**老师的课程，所以赶紧梳理一下关于Spring的相关知识。

---

### Spring IoC源码深度剖析

- 好处：提⾼培养代码架构思维、深⼊理解框架
- 原则
	- 定焦原则：抓主线
	- 宏观原则：站在上帝视⻆，关注源码结构和业务流程（淡化具体某⾏代码的编写细节）
- 读源码的⽅法和技巧
	- 断点（观察调⽤栈）
	- 反调（Find Usages）
	- 经验（spring框架中doXXX，做具体处理的地⽅）
- Spring源码构建
	- 下载源码（github）
	- 安装gradle 5.6.3（类似于maven）idea 2019.1 jdk 11.0.5
	- 导⼊（耗费⼀定时间）
	- 编译⼯程（顺序：core-oxm-context-beans-aspects-aop）
	- ⼯程—>tasks—>compileTestJava

#### Spring IoC容器初始化主题流程

##### Spring IoC的容器体系

IoC容器是Spring的核⼼模块，是抽象了对象管理、依赖关系管理的框架解决⽅案。Spring 提供了很多
的容器，其中 BeanFactory 是顶层容器（根容器），不能被实例化，它定义了所有 IoC 容器 必须遵从
的⼀套原则，具体的容器实现可以增加额外的功能，⽐如我们常⽤到的<code>ApplicationContext</code>，其下更具
体的实现如 <code>ClassPathXmlApplicationContext</code> 包含了解析 xml 等⼀系列的内容，
<code>AnnotationConfigApplicationContext</code> 则是包含了注解解析等⼀系列的内容。Spring IoC 容器继承体系
⾮常聪明，需要使⽤哪个层次⽤哪个层次即可，不必使⽤功能⼤⽽全的。
BeanFactory 顶级接⼝⽅法栈如下

![spring](/images/spring/s33.png)

BeanFactory 容器继承体系

![spring](/images/spring/s34.png)

通过其接⼝设计，我们可以看到我们⼀贯使⽤的 <code>ApplicationContext</code> 除了继承<code>BeanFactory</code>的⼦接⼝，
还继承了<code>ResourceLoader</code>、<code>MessageSource</code>等接⼝，因此其提供的功能也就更丰富了。
下⾯我们以 <code>ClasspathXmlApplicationContext</code> 为例，深⼊源码说明 IoC 容器的初始化流程。

##### Bean生命周期关键时机点

思路：创建⼀个类 loonycoderBean ，让其实现⼏个特殊的接⼝，并分别在接⼝实现的构造器、接⼝⽅法中
断点，观察线程调⽤栈，分析出 Bean 对象创建和管理关键点的触发时机。

loonycoderBean类

```bash
public class loonycoderBean implements InitializingBean{
/**
* 构造函数
*/
	public loonycoderBean(){
		System.out.println("loonycoderBean 构造器...");
	}
	/**
	* InitializingBean 接⼝实现
	*/
	public void afterPropertiesSet() throws Exception {
		System.out.println("loonycoderBean afterPropertiesSet...");
	} 
}
```

BeanPostProcessor 接⼝实现类

```bash
public class MyBeanPostProcessor implements BeanPostProcessor {
	public MyBeanPostProcessor() {
		System.out.println("BeanPostProcessor 实现类构造函数...");
	}
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName)
	throws BeansException {
		if("loonycoderBean".equals(beanName)) {
			System.out.println("BeanPostProcessor 实现类 postProcessBeforeInitialization ⽅法被调⽤中......");
		}
		return bean; 
	}
	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName)
	throws BeansException {
		if("loonycoderBean".equals(beanName)) {
			System.out.println("BeanPostProcessor 实现类 postProcessAfterInitialization ⽅法被调⽤中......");
		}
		return bean; 
	}
}
```

BeanFactoryPostProcessor 接⼝实现类

```bash
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
	public MyBeanFactoryPostProcessor() {
		System.out.println("BeanFactoryPostProcessor的实现类构造函数...");
	}
	@Override
	public void postProcessBeanFactory(ConfigurableListableBeanFactory
	beanFactory) throws BeansException {
		System.out.println("BeanFactoryPostProcessor的实现⽅法调⽤中......");
	} 
}
```

applicationContext.xml

```bash
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="
	http://www.springframework.org/schema/beans
	https://www.springframework.org/schema/beans/spring-beans.xsd
	">
	<bean id="loonycoderBean" class="com.loonycoder.loonycoderBean"/>
	<bean id="myBeanFactoryPostProcessor"
	class="com.loonycoder.MyBeanFactoryPostProcessor"/>
	<bean id="myBeanPostProcessor" class="com.loonycoder.MyBeanPostProcessor"/>
</beans>
```

IoC 容器源码分析⽤例

```bash
@Test
public void testIoC() {
	ApplicationContext applicationContext = new ClassPathXmlApplicationContext("classpath:applicationContext.xml");
	loonycoderBean loonycoderBean = applicationContext.getBean(loonycoderBean.class);
	System.out.println(loonycoderBean);
}
```

1. 分析 Bean 的创建是在容器初始化时还是在 getBean 时

![spring](/images/spring/s35.png)

根据断点调试，我们发现，在未设置延迟加载的前提下，Bean 的创建是在容器初始化过程中完成的。

2. 分析构造函数调⽤情况

![spring](/images/spring/s36.png)

通过如上观察，我们发现构造函数的调⽤时机在<code>AbstractApplicationContext</code>类<code>refresh()</code>⽅法的
<code>finishBeanFactoryInitialization(beanFactory)</code>处

3. 分析 InitializingBean 之 afterPropertiesSet 初始化⽅法调⽤情况

![spring](/images/spring/s37.png)

通过如上观察，我们发现 <code>InitializingBean</code>中 <code>afterPropertiesSet()</code> ⽅法的调⽤时机也是在
<code>AbstractApplicationContext</code>类<code>refresh()</code>⽅法的<code>finishBeanFactoryInitialization(beanFactory)</code>

4. 分析BeanFactoryPostProcessor 初始化和调⽤情况

分别在构造函数、<code>postProcessBeanFactory()</code> ⽅法处打断点，观察调⽤栈，发现<code>BeanFactoryPostProcessor</code> 初始化在<code>AbstractApplicationContext</code>类<code>refresh()</code>⽅法的<code>invokeBeanFactoryPostProcessors(beanFactory)</code>;
<code>postProcessBeanFactory()</code> 调⽤在<code>AbstractApplicationContext</code>类<code>refresh()</code>⽅法的<code>invokeBeanFactoryPostProcessors(beanFactory)</code>;

5. 分析 BeanPostProcessor 初始化和调⽤情况

分别在构造函数、<code>postProcessBeanFactory()</code> ⽅法处打断点，观察调⽤栈，发现<code>BeanPostProcessor</code> 初始化在<code>AbstractApplicationContext</code>类<code>refresh()</code>⽅法的<code>registerBeanPostProcessors(beanFactory)</code>;
<code>postProcessBeforeInitialization()</code>调⽤在<code>AbstractApplicationContext</code>类<code>refresh()</code>⽅法的<code>finishBeanFactoryInitialization(beanFactory)</code>;
<code>postProcessAfterInitialization()</code> 调⽤在<code>AbstractApplicationContext</code>类<code>refresh()</code>⽅法的<code>finishBeanFactoryInitialization(beanFactory)</code>;

6. 总结

根据上⾯的调试分析，我们发现 Bean对象创建的⼏个关键时机点代码层级的调⽤都在<code>AbstractApplicationContext</code>⽅ 类的 <code>refresh()</code>⽅ ⽅法中，可⻅这个⽅法对于Spring IoC容器初始化来说相当
关键，汇总如下：

关键点|触发代码|
:-|:-|
构造器 | refresh#finishBeanFactoryInitialization(beanFactory)(beanFactory)
BeanFactoryPostProcessor初始化 | refresh#invokeBeanFactoryPostProcessors(beanFactory)
BeanFactoryPostProcessor ⽅法调⽤ | refresh#invokeBeanFactoryPostProcessors(beanFactory)
BeanPostProcessor 初始化 | registerBeanPostProcessors(beanFactory)
BeanPostProcessor ⽅法调⽤ | refresh#finishBeanFactoryInitialization(beanFactory)

##### Spring IoC容器初始化主流程

由上分析可知，Spring IoC 容器初始化的关键环节就在 <code>AbstractApplicationContext#refresh()</code> ⽅法中
，我们查看 <code>refresh()</code> ⽅法来俯瞰容器创建的主体流程，主体流程下的具体⼦流程我们后⾯再来讨论。

```bash
@Override
public void refresh() throws BeansException, IllegalStateException {
		synchronized (this.startupShutdownMonitor) {
		// 第⼀步：刷新前的预处理
		prepareRefresh();
		/*
		第⼆步：
		获取BeanFactory；默认实现是DefaultListableBeanFactory
		加载BeanDefition 并注册到 BeanDefitionRegistry
		*/
		ConfigurableListableBeanFactory beanFactory =
		obtainFreshBeanFactory();
		// 第三步：BeanFactory的预准备⼯作（BeanFactory进⾏⼀些设置，⽐如context的类加
		载器等）
		prepareBeanFactory(beanFactory);
		try {
			// 第四步：BeanFactory准备⼯作完成后进⾏的后置处理⼯作
			postProcessBeanFactory(beanFactory);
			// 第五步：实例化并调⽤实现了BeanFactoryPostProcessor接⼝的Bean
			invokeBeanFactoryPostProcessors(beanFactory);
			// 第六步：注册BeanPostProcessor（Bean的后置处理器），在创建bean的前后等执
			⾏
			registerBeanPostProcessors(beanFactory);
			// 第七步：初始化MessageSource组件（做国际化功能；消息绑定，消息解析）；
			initMessageSource();
			// 第⼋步：初始化事件派发器
			initApplicationEventMulticaster();
			// 第九步：⼦类重写这个⽅法，在容器刷新的时候可以⾃定义逻辑
			onRefresh();
			// 第⼗步：注册应⽤的监听器。就是注册实现了ApplicationListener接⼝的监听器
			bean
			registerListeners();
			/*
			第⼗⼀步：
			初始化所有剩下的⾮懒加载的单例bean
			初始化创建⾮懒加载⽅式的单例Bean实例（未设置属性）
			填充属性
			初始化⽅法调⽤（⽐如调⽤afterPropertiesSet⽅法、init-method⽅法）
			调⽤BeanPostProcessor（后置处理器）对实例bean进⾏后置处
			*/
			finishBeanFactoryInitialization(beanFactory);
			/*
			第⼗⼆步：
			完成context的刷新。主要是调⽤LifecycleProcessor的onRefresh()⽅法，并且发布事
			件 （ContextRefreshedEvent）
			*/
			finishRefresh();
	 	}
	 	......
 	}
}
```

#### BeanFactory创建流程

##### 获取BeanFactory子流程

时序图如下

![spring](/images/spring/s38.png)

##### BeanDefinition加载解析及注册子流程

1. 该⼦流程涉及到如下⼏个关键步骤

**Resource定位**：指对BeanDefinition的资源定位过程。通俗讲就是找到定义Javabean信息的XML⽂件，并将其封装成Resource对象。
**BeanDefinition载⼊** ：把⽤户定义好的Javabean表示为IoC容器内部的数据结构，这个容器内部的数据结构就是BeanDefinition。
**注册BeanDefinition到 IoC 容器**

2. 过程分析

**Step 1**：⼦流程⼊⼝在 <code>AbstractRefreshableApplicationContext#refreshBeanFactory</code> ⽅法中

![spring](/images/spring/s39.png)

**Step 2**：依次调⽤多个类的 loadBeanDefinitions ⽅法 —> AbstractXmlApplicationContext —> AbstractBeanDefinitionReader —> XmlBeanDefinitionReader ⼀直执⾏到 XmlBeanDefinitionReader 的 <code>doLoadBeanDefinitions</code> ⽅法。

![spring](/images/spring/s40.png)

**Step 3**：我们重点观察XmlBeanDefinitionReader 类的 <code>registerBeanDefinitions</code> ⽅法，期间产⽣了多
次重载调⽤，我们定位到最后⼀个。

![spring](/images/spring/s41.png)

此处我们关注两个地⽅：⼀个<code>createRederContext</code>⽅法，⼀个是DefaultBeanDefinitionDocumentReader类的<code>registerBeanDefinitions</code>⽅法，先进⼊<code>createRederContext</code> ⽅法看看。

![spring](/images/spring/s42.png)

我们可以看到，此处 Spring ⾸先完成了 NamespaceHandlerResolver 的初始化。
我们再进⼊ <code>registerBeanDefinitions</code> ⽅法中追踪，调⽤了<code>DefaultBeanDefinitionDocumentReader#registerBeanDefinitions</code> ⽅法。

![spring](/images/spring/s43.png)

进⼊ <code>doRegisterBeanDefinitions</code> ⽅法

![spring](/images/spring/s44.png)

进⼊ <code>parseBeanDefinitions</code> ⽅法

![spring](/images/spring/s45.png)

进⼊ <code>parseDefaultElement</code> ⽅法

![spring](/images/spring/s46.png)

进⼊ <code>processBeanDefinition</code> ⽅法

![spring](/images/spring/s47.png)

⾄此，注册流程结束，我们发现，所谓的注册就是把封装的 XML 中定义的 Bean信息封装为 BeanDefinition 对象之后放⼊⼀个Map中，BeanFactory 是以 Map 的结构组织这些 BeanDefinition 的。

![spring](/images/spring/s48.png)

可以在DefaultListableBeanFactory中看到此Map的定义

```bash
/** Map of bean definition objects, keyed by bean name. */
private final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<>(256);
```

3. 时序图

![spring](/images/spring/s49.png)

#### Bean创建流程

- 通过最开始的关键时机点分析，我们知道Bean创建⼦流程⼊⼝在<code>AbstractApplicationContext#refresh()</code>⽅法的<code>finishBeanFactoryInitialization(beanFactory)</code> 处

![spring](/images/spring/s50.png)

- 进⼊finishBeanFactoryInitialization

![spring](/images/spring/s51.png)

- 继续进⼊DefaultListableBeanFactory类的preInstantiateSingletons⽅法，我们找到下⾯部分的代码，看到⼯⼚Bean或者普通Bean，最终都是通过getBean的⽅法获取实例

![spring](/images/spring/s52.png)

- 继续跟踪下去，我们进⼊到了AbstractBeanFactory类的doGetBean⽅法，这个⽅法中的代码很多，我们直接找到核⼼部分

![spring](/images/spring/s53.png)

- 接着进⼊到AbstractAutowireCapableBeanFactory类的⽅法，找到以下代码部分

![spring](/images/spring/s54.png)

- 进⼊doCreateBean⽅法看看，该⽅法我们关注两块重点区域
	- 创建Bean实例，此时尚未设置属性
![spring](/images/spring/s55.png)
	- 给Bean填充属性，调⽤初始化⽅法，应⽤BeanPostProcessor后置处理器
![spring](/images/spring/s56.png)

#### lazy-init延迟加载机制原理

- lazy-init 延迟加载机制分析

普通 Bean 的初始化是在容器启动初始化阶段执⾏的，⽽被<code>lazy-init=true</code>修饰的 bean 则是在从容器⾥第⼀次进⾏<code>context.getBean()</code> 时进⾏触发。Spring 启动的时候会把所有bean信息(包括XML和注解)解析转化成Spring能够识别的BeanDefinition并存到Hashmap⾥供下⾯的初始化时⽤，然后对每个BeanDefinition 进⾏处理，如果是懒加载的则在容器初始化阶段不处理，其他的则在容器初始化阶段进⾏初始化并依赖注⼊。

```bash
public void preInstantiateSingletons() throws BeansException {
	// 所有beanDefinition集合
	List<String> beanNames = new ArrayList<String>(this.beanDefinitionNames);
	// 触发所有⾮懒加载单例bean的初始化
		for (String beanName : beanNames) {
		// 获取bean 定义
		RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
		// 判断是否是懒加载单例bean，如果是单例的并且不是懒加载的则在容器创建时初始化
			if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
			// 判断是否是 FactoryBean
				if (isFactoryBean(beanName)) {
					final FactoryBean<?> factory = (FactoryBean<?>)
					getBean(FACTORY_BEAN_PREFIX + beanName);
					boolean isEagerInit;
					if (System.getSecurityManager() != null && factory instanceof SmartFactoryBean) {
						isEagerInit = AccessController.doPrivileged(new PrivilegedAction<Boolean>() {
							@Override
							public Boolean run() {
								return ((SmartFactoryBean<?>) factory).isEagerInit();
							}
						}, getAccessControlContext());
					}
				 }else {
					/*
					如果是普通bean则进⾏初始化并依赖注⼊，此 getBean(beanName)接下来触发的逻辑
					和
					懒加载时 context.getBean("beanName") 所触发的逻辑是⼀样的
					*/
					getBean(beanName);
				 }
		 	}
	 	}
}
```

- 总结
	- 对于被修饰为lazy-init的bean Spring 容器初始化阶段不会进⾏ init 并且依赖注⼊，当第⼀次进⾏getBean时候才进⾏初始化并依赖注⼊
	- 对于⾮懒加载的bean，getBean的时候会从缓存⾥头获取，因为容器初始化阶段 Bean 已经初始化完成并缓存了起来

#### Spring IoC循环依赖问题

##### 什么是循环依赖

循环依赖其实就是循环引⽤，也就是两个或者两个以上的 Bean 互相持有对⽅，最终形成闭环。⽐如A依赖于B，B依赖于C，C⼜依赖于A。

![spring](/images/spring/s57.png)

注意，这⾥不是函数的循环调⽤，是对象的相互依赖关系。循环调⽤其实就是⼀个死循环，除⾮有终结条件。

Spring中循环依赖场景有：
- 构造器的循环依赖（构造器注⼊）
- Field 属性的循环依赖（set注⼊）
其中，构造器的循环依赖问题⽆法解决，只能拋出 BeanCurrentlyInCreationException 异常，在解决属性循环依赖时，spring采⽤的是提前暴露对象的⽅法。

##### 循环依赖处理机制

- 单例 bean 构造器参数循环依赖（⽆法解决）
- prototype 原型 bean循环依赖（⽆法解决）
对于原型bean的初始化过程中不论是通过构造器参数循环依赖还是通过setXxx⽅法产⽣循环依赖，Spring都 会直接报错处理。

AbstractBeanFactory.doGetBean()⽅法：

```bash
if (isPrototypeCurrentlyInCreation(beanName)) {
	throw new BeanCurrentlyInCreationException(beanName);
}
```

```bash
protected boolean isPrototypeCurrentlyInCreation(String beanName) {
	Object curVal = this.prototypesCurrentlyInCreation.get();
	return (curVal != null && (curVal.equals(beanName) || (curVal instanceof Set && ((Set<?>) curVal).contains(beanName))));
}
```

在获取bean之前如果这个原型bean正在被创建则直接抛出异常。原型bean在创建之前会进⾏标记这个beanName正在被创建，等创建结束之后会删除标记。

```bash
try {
	//创建原型bean之前添加标记
	beforePrototypeCreation(beanName);
	//创建原型bean
	prototypeInstance = createBean(beanName, mbd, args);
}
finally {
	//创建原型bean之后删除标记
	afterPrototypeCreation(beanName);
}
```

总结：Spring 不⽀持原型 bean 的循环依赖。

- 单例bean通过setXxx或者@Autowired进⾏循环依赖
Spring 的循环依赖的理论依据基于 Java 的引⽤传递，当获得对象的引⽤时，对象的属性是可以延后设置的，但是构造器必须是在获取引⽤之前
Spring通过setXxx或者@Autowired⽅法解决循环依赖其实是通过提前暴露⼀个ObjectFactory对象来完成的，简单来说ClassA在调⽤构造器完成对象初始化之后，在调⽤ClassA的setClassB⽅法之前就把ClassA实例化的对象通过ObjectFactory提前暴露到Spring容器中。
	- Spring容器初始化ClassA通过构造器初始化对象后提前暴露到Spring容器。
```bash
boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences && isSingletonCurrentlyInCreation(beanName));
if (earlySingletonExposure) {
	if (logger.isDebugEnabled()) {
		logger.debug("Eagerly caching bean '" + beanName +
		"'to allow for resolving potential circular references");
	}
	//将初始化后的对象提前已ObjectFactory对象注⼊到容器中
	addSingletonFactory(beanName, new ObjectFactory<Object>() {
		@Override
		public Object getObject() throws BeansException {
			return getEarlyBeanReference(beanName, mbd, bean);
		}
	});
}
```
	- ClassA调⽤setClassB⽅法，Spring⾸先尝试从容器中获取ClassB，此时ClassB不存在Spring容器中。
	- Spring容器初始化ClassB，同时也会将ClassB提前暴露到Spring容器中
	- ClassB调⽤setClassA⽅法，Spring从容器中获取ClassA ，因为第⼀步中已经提前暴露了
	- ClassA，因此可以获取到ClassA实例
		- ClassA通过spring容器获取到ClassB，完成了对象初始化操作。
	- 这样ClassA和ClassB都完成了对象初始化操作，解决了循环依赖问题。

