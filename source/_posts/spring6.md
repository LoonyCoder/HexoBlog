---
title: 轻量级控制反转和面向切面的容器框架——Spring（六）
categories:
    - Java框架
    
date: 2019-09-01 17:22:29
tags:
  - Spring全家桶
  - IoC
  - AOP

---

![spring](/images/spring_logo.jpg)

### 写在前面

之前整理过一些关于Spring框架零散的知识点，一直没时间整理，恰好最近又拜读了**应癫**老师的课程，所以赶紧梳理一下关于Spring的相关知识。

---

### Spring AOP源码深度剖析

#### 代理对象创建

##### AOP基础用例准备

Bean定义

```bash
@Component
public class LagouBean {
	public void tech(){
		System.out.println("java learning......");
	}
}
```

Aspect定义

```bash
@Component
@Aspect
public class LagouAspect {
	@Pointcut("execution(* com.lagou.*.*(..))")
	public void pointcut(){
	}
	@Before("pointcut()")
	public void before() {
		System.out.println("before method ......");
	}
}
```

测试⽤例

```bash
/**
* 测试⽤例：Aop 代理对象创建
*/
@Test
public void testAopProxyBuild(){
	ApplicationContext applicationContext = new AnnotationConfigApplicationContext(SpringConfig.class);
	LagouBean lagouBean = applicationContext.getBean(LagouBean.class);
	lagouBean.tech();
}
```

##### 时机点分析

![spring](/images/spring/s60.png)

我们发现在 getBean 之前，LagouBean对象已经产⽣（即在第⼀⾏初始化代码中完成），⽽且该对象是⼀个代理对象（Cglib代理对象），我们断定，容器初始化过程中⽬标Ban已经完成了代理，返回了代理对象。

##### 代理对象创建流程

AbstractAutowireCapableBeanFactory#initializeBean(java.lang.String, java.lang.Object,org.springframework.beans.factory.support.RootBeanDefinition)

```bash
/**
*
* 初始化Bean
包括Bean后置处理器初始化
Bean的⼀些初始化⽅法的执⾏init-method
Bean的实现的声明周期相关接⼝的属性注⼊
*/
protected Object initializeBean(final String beanName, final Object bean,
@Nullable RootBeanDefinition mbd) {
	// 执⾏所有的AwareMethods
	if (System.getSecurityManager() != null) {
		AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
			invokeAwareMethods(beanName, bean);
			return null;
		}, getAccessControlContext());
	}
	else {
	ifnvokeAwareMethods(beanName, bean);
	}
	Object wrappedBean = bean;
	if (mbd == null || !mbd.isSynthetic()) {
		// 执⾏所有的BeanPostProcessor#postProcessBeforeInitialization 初始化之前的处理器⽅法
		wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean,beanName);
	}
	try {
		// 这⾥就开始执⾏afterPropertiesSet（实现了InitializingBean接⼝）⽅法和 initMethod
		invokeInitMethods(beanName, wrappedBean, mbd);
	}
	catch (Throwable ex) {
		throw new BeanCreationException((mbd != null ? mbd.getResourceDescription() : null),beanName, "Invocation of init method failed", ex);
	}
	if (mbd == null || !mbd.isSynthetic()) {
		// 整个Bean初始化完成，执⾏后置处理器⽅法
		wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean,beanName);
	}
	return wrappedBean; 
}
```

AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsAfterInitialization

```bash
@Override
public Object applyBeanPostProcessorsAfterInitialization(Object existingBean, String beanName) throws BeansException {
	Object result = existingBean;
	// 循环执⾏后置处理器
	for (BeanPostProcessor processor : getBeanPostProcessors()) {
		Object current = processor.postProcessAfterInitialization(result,
		beanName);
		if (current == null) {
			return result; 
		}
		result = current; 
	}
	return result; 
}
```

![spring](/images/spring/s61.png)

创建代理对象的后置处理器AbstractAutoProxyCreator#postProcessAfterInitialization

```bash
/**
* Create a proxy with the configured interceptors if the bean is
* identified as one to proxy by the subclass.
* @see #getAdvicesAndAdvisorsForBean
*/
@Override
public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) {
	if (bean != null) {
	// 检查下该类是否已经暴露过了（可能已经创建了，⽐如A依赖B时，创建A时候，就会先去创建B。
	// 当真正需要创建B时，就没必要再代理⼀次已经代理过的对象）,避免重复创建
	Object cacheKey = getCacheKey(bean.getClass(), beanName);
		if (this.earlyProxyReferences.remove(cacheKey) != bean) {
			return wrapIfNecessary(bean, beanName, cacheKey);
		} 
	}
	return bean; 
}
```

AbstractAutoProxyCreator#wrapIfNecessary

```bash
/**
* Wrap the given bean if necessary, i.e. if it is eligible for being
proxied.
* @param bean the raw bean instance
* @param beanName the name of the bean
* @param cacheKey the cache key for metadata access
* @return a proxy wrapping the bean, or the raw bean instance as-is
*/
protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
	// targetSourcedBeans包含，说明前⾯创建过
	if (StringUtils.hasLength(beanName) && this.targetSourcedBeans.contains(beanName)) {
		return bean; 
	}
	if (Boolean.FALSE.equals(this.advisedBeans.get(cacheKey))) {
		return bean; 
	}
	if (isInfrastructureClass(bean.getClass()) || shouldSkip(bean.getClass(), beanName)) {
		this.advisedBeans.put(cacheKey, Boolean.FALSE);
		return bean; 
	}
	// Create proxy if we have advice.
	// 得到所有候选Advisor，对Advisors和bean的⽅法双层遍历匹配，最终得到⼀个 List<Advisor>，即specificInterceptors
	Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
	if (specificInterceptors != DO_NOT_PROXY) {
		this.advisedBeans.put(cacheKey, Boolean.TRUE);
		// 重点，创建代理对象
		Object proxy = createProxy(bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
		this.proxyTypes.put(cacheKey, proxy.getClass());
		return proxy; 
	}
	this.advisedBeans.put(cacheKey, Boolean.FALSE);
	return bean; 
}
```

AbstractAutoProxyCreator#createProxy

```bash
/**
* Create an AOP proxy for the given bean.
* 为指定 bean 创建代理对象
*/
protected Object createProxy(Class<?> beanClass, @Nullable String beanName, @Nullable Object[] specificInterceptors, TargetSource targetSource) {
	if (this.beanFactory instanceof ConfigurableListableBeanFactory) {
		AutoProxyUtils.exposeTargetClass((ConfigurableListableBeanFactory)
		this.beanFactory, beanName, beanClass);
	}
	// 创建代理的⼯作交给ProxyFactory
	ProxyFactory proxyFactory = new ProxyFactory();
	proxyFactory.copyFrom(this);
	// 根据⼀些情况判断是否要设置proxyTargetClass=true
	if (!proxyFactory.isProxyTargetClass()) {
		if (shouldProxyTargetClass(beanClass, beanName)) {
			proxyFactory.setProxyTargetClass(true);
		}
		else {
		evaluateProxyInterfaces(beanClass, proxyFactory);
		} 
	}
	// 把指定和通⽤拦截对象合并, 并都适配成Advisor
	Advisor[] advisors = buildAdvisors(beanName, specificInterceptors);
	proxyFactory.addAdvisors(advisors);
	// 设置参数
	proxyFactory.setTargetSource(targetSource);
	customizeProxyFactory(proxyFactory);
	proxyFactory.setFrozen(this.freezeProxy);
	if (advisorsPreFiltered()) {
	proxyFactory.setPreFiltered(true);
	}
	// 上⾯准备做完就开始创建代理
	return proxyFactory.getProxy(getProxyClassLoader());
}
```

接着跟进到ProxyFactory中

```bash
public class ProxyFactory extends ProxyCreatorSupport {
	public Object getProxy(ClassLoader classLoader) {
		// ⽤ProxyFactory创建AopProxy, 然后⽤AopProxy创建Proxy, 所以这⾥重要的是看获取的AopProxy对象是什么,
		// 然后进去看怎么创建动态代理, 提供了两种：jdk proxy, cglib
		return createAopProxy().getProxy(classLoader);
	} 
}
public class ProxyCreatorSupport extends AdvisedSupport {
	private AopProxyFactory aopProxyFactory;
	public ProxyCreatorSupport() {
		this.aopProxyFactory = new DefaultAopProxyFactory();
	}
	protected final synchronized AopProxy createAopProxy() {
		if (!this.active) {
			activate();
		}
		//先获取创建AopProxy的⼯⼚, 再由此创建AopProxy
		return getAopProxyFactory().createAopProxy(this);
	}
	public AopProxyFactory getAopProxyFactory() {
		return this.aopProxyFactory; 
	} 
}
```

流程就是⽤AopProxyFactory创建AopProxy, 再⽤AopProxy创建代理对象，这⾥的AopProxyFactory默认是DefaultAopProxyFactory，看它的<code>createAopProxy</code>⽅法

```bash
public class DefaultAopProxyFactory implements AopProxyFactory, Serializable {
	@Override
	public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
		if (config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)) {
			Class<?> targetClass = config.getTargetClass();
			if (targetClass == null) {
				throw new AopConfigException("TargetSource cannot determine target class: " + "Either an interface or a target is required for proxy creation.");
			}
			if (targetClass.isInterface()) {
				return new JdkDynamicAopProxy(config);
			}
			return new ObjenesisCglibAopProxy(config);
		} else {
			return new JdkDynamicAopProxy(config);
		} 
	}
	/**
	* Determine whether the supplied {@link AdvisedSupport} has only the
	* {@link org.springframework.aop.SpringProxy} interface specified (or no
	* proxy interfaces specified at all).
	*/
	private boolean hasNoUserSuppliedProxyInterfaces(AdvisedSupport config) {
		Class<?>[] interfaces = config.getProxiedInterfaces();
		return (interfaces.length == 0 || (interfaces.length == 1 && SpringProxy.class.equals(interfaces[0])));
	} 
}
```

这⾥决定创建代理对象是⽤JDK Proxy，还是⽤ Cglib 了，最简单的从使⽤⽅⾯使⽤来说：设置proxyTargetClass=true强制使⽤Cglib 代理，什么参数都不设并且对象类实现了接⼝则默认⽤JDK代理，如果没有实现接⼝则也必须⽤Cglib
ProxyFactory#getProxy(java.lang.ClassLoader)
CglibAopProxy#getProxy(java.lang.ClassLoader)

```bash
@Override
public Object getProxy(@Nullable ClassLoader classLoader) {
	if (logger.isTraceEnabled()) {
		logger.trace("Creating CGLIB proxy: " + this.advised.getTargetSource());
	}
	try {
		Class<?> rootClass = this.advised.getTargetClass();
		Assert.state(rootClass != null, "Target class must be available for creating a CGLIB proxy");
		Class<?> proxySuperClass = rootClass;
		if (ClassUtils.isCglibProxyClass(rootClass)) {
			proxySuperClass = rootClass.getSuperclass();
			Class<?>[] additionalInterfaces = rootClass.getInterfaces();
			for (Class<?> additionalInterface : additionalInterfaces) {
				this.advised.addInterface(additionalInterface);
			} 
		}
		// Validate the class, writing log messages as necessary.
		validateClassIfNecessary(proxySuperClass, classLoader);
		// 配置 Cglib 增强
		Enhancer enhancer = createEnhancer();
		if (classLoader != null) {
			enhancer.setClassLoader(classLoader);
			if (classLoader instanceof SmartClassLoader && ((SmartClassLoader) classLoader).isClassReloadable(proxySuperClass)) {
				enhancer.setUseCache(false);
			}
		}
		enhancer.setSuperclass(proxySuperClass);
		enhancer.setInterfaces(AopProxyUtils.completeProxiedInterfaces(this.advised));
		enhancer.setNamingPolicy(SpringNamingPolicy.INSTANCE);
		enhancer.setStrategy(new
		ClassLoaderAwareUndeclaredThrowableStrategy(classLoader));
		Callback[] callbacks = getCallbacks(rootClass);
		Class<?>[] types = new Class<?>[callbacks.length];
		for (int x = 0; x < types.length; x++) {
			types[x] = callbacks[x].getClass();
		}
		// fixedInterceptorMap only populated at this point, after getCallbacks call above
		enhancer.setCallbackFilter(new ProxyCallbackFilter(this.advised.getConfigurationOnlyCopy(), this.fixedInterceptorMap,this.fixedInterceptorOffset));
		enhancer.setCallbackTypes(types);
		// ⽣成代理类，并且创建⼀个代理类的实例
		return createProxyClassAndInstance(enhancer, callbacks);
	}catch (CodeGenerationException | IllegalArgumentException ex) {
		throw new AopConfigException("Could not generate CGLIB subclass of " + this.advised.getTargetClass() +": Common causes of this problem include using a final class or anon-visible class",ex);
	}catch (Throwable ex) {
		// TargetSource.getTarget() failed
		throw new AopConfigException("Unexpected AOP exception", ex);
	} 
}
```

**AOP源码分析类⽅法调⽤关系记录**

> org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#initializeBean
**调⽤**
org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsAfterInitialization
**调⽤**
org.springframework.aop.framework.autoproxy.AbstractAutoProxyCreator#postProcessAfterInitialization（后置处理器AbstractAutoProxyCreator完成bean代理对象创建）
**调⽤**
org.springframework.aop.framework.autoproxy.AbstractAutoProxyCreator#wrapIfNecessary
**调⽤**
org.springframework.aop.framework.autoproxy.AbstractAutoProxyCreator#createProxy （在这⼀步把委托对象的aop增强和通⽤拦截进⾏合并，最终给代理对象）
**调⽤**
org.springframework.aop.framework.DefaultAopProxyFactory#createAopProxy
**调⽤**
org.springframework.aop.framework.CglibAopProxy#getProxy(java.lang.ClassLoader)

#### Spring声明式事务控制

声明式事务很⽅便，尤其纯注解模式，仅仅⼏个注解就能控制事务了
思考：这些注解都做了什么？好神奇！
@EnableTransactionManagement @Transactional

##### @EnableTransactionManagement

```bash
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(TransactionManagementConfigurationSelector.class)
public @interface EnableTransactionManagement {...}
```

<code>@EnableTransactionManagement</code> 注解使⽤ <code>@Import</code> 标签引⼊了TransactionManagementConfigurationSelector类，这个类⼜向容器中导⼊了两个重要的组件

![spring](/images/spring/s62.png)

##### 加载事务控制组件

- AutoProxyRegistrar
AutoProxyRegistrar 类的 registerBeanDefinitions ⽅法中⼜注册了⼀个组件

![spring](/images/spring/s63.png)

进⼊ AopConfigUtils.registerAutoProxyCreatorIfNecessary ⽅法

![spring](/images/spring/s64.png)

发现最终，注册了⼀个叫做 InfrastructureAdvisorAutoProxyCreator 的 Bean，⽽这个类是AbstractAutoProxyCreator 的⼦类，实现了 SmartInstantiationAwareBeanPostProcessor 接⼝

```bash
public class InfrastructureAdvisorAutoProxyCreator extends AbstractAdvisorAutoProxyCreator
public abstract class AbstractAdvisorAutoProxyCreator extends AbstractAutoProxyCreator
public abstract class AbstractAutoProxyCreator extends ProxyProcessorSupport implements SmartInstantiationAwareBeanPostProcessor, BeanFactoryAware
```

继承体系结构图如下

![spring](/images/spring/s65.png)

它实现了SmartInstantiationAwareBeanPostProcessor，说明这是⼀个后置处理器，⽽且跟Spring AOP 开启@EnableAspectJAutoProxy 时注册的 AnnotationAwareAspectJProxyCreator实现的是同⼀个接⼝，所以说，声明式事务是 SpringAOP 思想的⼀种应⽤。

```bash
/*
* Copyright 2002-2017 the original author or authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* https://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
package org.springframework.transaction.annotation;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Role;
import org.springframework.transaction.config.TransactionManagementConfigUtils;
import org.springframework.transaction.interceptor.BeanFactoryTransactionAttributeSourceAdvisor;
import org.springframework.transaction.interceptor.TransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
/**
* {@code @Configuration} class that registers the Spring infrastructure beans
* necessary to enable proxy-based annotation-driven transaction management.
*
* @author Chris Beams
* @since 3.1
* @see EnableTransactionManagement
* @see TransactionManagementConfigurationSelector
*/
@Configuration
public class ProxyTransactionManagementConfiguration extends AbstractTransactionManagementConfiguration {
	@Bean(name = TransactionManagementConfigUtils.TRANSACTION_ADVISOR_BEAN_NAME)
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
		public BeanFactoryTransactionAttributeSourceAdvisor transactionAdvisor(){
		// 事务增强器
		BeanFactoryTransactionAttributeSourceAdvisor advisor = new BeanFactoryTransactionAttributeSourceAdvisor();
		// 向事务增强器中注⼊ 属性解析器 transactionAttributeSource
		advisor.setTransactionAttributeSource(transactionAttributeSource());
		// 向事务增强器中注⼊ 事务拦截器 transactionInterceptor
		advisor.setAdvice(transactionInterceptor());
		if (this.enableTx != null) {
			advisor.setOrder(this.enableTx.<Integer>getNumber("order"));
		}
		return advisor; 
	}
	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	// 属性解析器 transactionAttributeSource
	public TransactionAttributeSource transactionAttributeSource() {
		return new AnnotationTransactionAttributeSource();
	}
	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	// 事务拦截器 transactionInterceptor
	public TransactionInterceptor transactionInterceptor() {
		TransactionInterceptor interceptor = new TransactionInterceptor();
		interceptor.setTransactionAttributeSource(transactionAttributeSource());
		if (this.txManager != null) {
			interceptor.setTransactionManager(this.txManager);
		}
		return interceptor; 
	} 
}
```

ProxyTransactionManagementConfiguration是⼀个容器配置类，注册了⼀个组件transactionAdvisor，称为事务增强器，然后在这个事务增强器中⼜注⼊了两个属性：
transactionAttributeSource，即属性解析器transactionAttributeSource 和 
事务拦截器transactionInterceptor
- 属性解析器 AnnotationTransactionAttributeSource 部分源码如下
![spring](/images/spring/s66.png)
属性解析器有⼀个成员变量是annotationParsers，是⼀个集合，可以添加多种注解解析器
(TransactionAnnotationParser)，我们关注 Spring 的注解解析器，部分源码如下
![spring](/images/spring/s67.png)
属性解析器的作⽤之⼀就是⽤来解析<code>@Transaction</code>注解

- TransactionInterceptor 事务拦截器，部分源码如下
![spring](/images/spring/s68.png)
![spring](/images/spring/s69.png)

- 上述组件如何关联起来的？
	- 事务拦截器实现了MethodInterceptor接⼝，追溯⼀下上⾯提到的InfrastructureAdvisorAutoProxyCreator后置处理器，它会在代理对象执⾏⽬标⽅法的时候获取其拦截器链，⽽拦截器链就是这个TransactionInterceptor，这就把这两个组件联系起来；
	- 构造⽅法传⼊PlatformTransactionManager(事务管理器)、TransactionAttributeSource(属性解析器)，但是追溯⼀下上⾯贴的ProxyTransactionManagementConfiguration的源码，在注册事务拦截器的时候并没有调⽤这个带参构造⽅法，⽽是调⽤的⽆参构造⽅法，然后再调⽤set⽅法注⼊这两个属性，效果⼀样。
- invokeWithinTransaction ⽅法，部分源码如下（关注1、2、3、4 标注处）
![spring](/images/spring/s70.png)
![spring](/images/spring/s71.png)

**声明式事务分析过程记录**
```bash
@EnableTransactionManagement 注解
1)通过@Import引⼊了TransactionManagementConfigurationSelector类
它的selectImports⽅法导⼊了另外两个类：AutoProxyRegistrar和ProxyTransactionManagementConfiguration

2)AutoProxyRegistrar类分析
⽅法registerBeanDefinitions中，引⼊了其他类，通过AopConfigUtils.registerAutoProxyCreatorIfNecessary(registry)引⼊InfrastructureAdvisorAutoProxyCreator，它继承了AbstractAutoProxyCreator，是⼀个后置处理器类

3)ProxyTransactionManagementConfiguration是⼀个添加了@Configuration注解的配置类（注册bean）
注册事务增强器（注⼊属性解析器、事务拦截器）
	属性解析器：AnnotationTransactionAttributeSource，内部持有了⼀个解析器集合Set<TransactionAnnotationParser> annotationParsers;
	具体使⽤的是SpringTransactionAnnotationParser解析器，⽤来解析@Transactional的事务属性
	事务拦截器：TransactionInterceptor实现了MethodInterceptor接⼝，该通⽤拦截会在产⽣代理对象之前和aop增强合并，最终⼀起影响到代理对象TransactionInterceptor的invoke⽅法中invokeWithinTransaction会触发原有业务逻辑调⽤（增强事务）
```
