---
title: Spring框架——深入理解AOP实现原理
categories:
    - Java框架
    
date: 2018-11-07
tags:
	- 框架
    - Spring
---
> 阅读这篇文章前，最好有代理模式的基础，以及了解关于Spring扩展点例如BeanPostProcessor和如何使用自定义标签集成Spring，这些文章在我的博客里都能找到。当然，也最好有使用AOP的经验，这篇文章不会讲解如何使用AOP。

![Spring](/images/spring_logo.jpg)

### 1.AOP简介
说到AOP，其实这是一个**面向方面的编程思想** ，它解决了OOP的一些弊端，例如我们需要为**多个不具有继承关系的类引入一个公共行为**， 比如说日志、权限验证、事务管理等等，我们需要将这些代码**重复的添加**到一系列的类中，将**产生大量的重复代码**，如果需要修改，将在每个类中去进行修改，**不便于维护**，代码的**侵入性极高**。所以就有了AOP这样面向方面编程的编程思想，其功能可以为每个需要的类**加入共同的行为**，如果需要修改，只需要修改切面中的代码，改一处等于改多处，并且便于编程，写一个切面类即可达到在每个类中加入重复代码的目的。

阅读此篇文章，你将了解Spring是**如何实现AOP**（前置通知、后置通知、环绕通知），由于Spring中的事务管理是基于AOP的功能来做的，所以你将更好的能理解Spring是如何将事务统一管理起来的。

---

### 2.自定义标签开启AOP

只要用过AOP都知道，如果需要使用AOP，需要在配置文件中写这样一段配置：
```bash
<aop:aspectj-autoproxy />
```
只有写了这段配置才可以开启AOP功能，那么这个自定义标签又做了什么呢？在上一篇讲解自定义标签的文章中详细讲到了，此时我们需要关注其标签头aop去寻找对应的命名空间：
```bash
xmlns:aop="http://www.springframework.org/schema/aop"
```
全局搜索命名空间<code>&lt;http\://www.springframework.org/schema/aop&gt;</code>，注意http后加一个 "\" ，可以找到**spring.handlers**文件中对应的handler类：
```bash
http\://www.springframework.org/schema/aop=org.springframework.aop.config.AopNamespaceHandler
```
这样就找到了命名空间对应的handler：
```bash
public class AopNamespaceHandler extends NamespaceHandlerSupport {

  /**
   * Register the {@link BeanDefinitionParser BeanDefinitionParsers} for the
   * '{@code config}', '{@code spring-configured}', '{@code aspectj-autoproxy}'
   * and '{@code scoped-proxy}' tags.
   */
  @Override
  public void init() {
    // In 2.0 XSD as well as in 2.1 XSD.
    registerBeanDefinitionParser("config", new ConfigBeanDefinitionParser());
    registerBeanDefinitionParser("aspectj-autoproxy", new AspectJAutoProxyBeanDefinitionParser());
    registerBeanDefinitionDecorator("scoped-proxy", new ScopedProxyBeanDefinitionDecorator());

    // Only in 2.0 XSD: moved to context namespace as of 2.1
    registerBeanDefinitionParser("spring-configured", new SpringConfiguredBeanDefinitionParser());
  }
}
```
回到开头配置自定义标签，我们使用了<code>aspectj-autoproxy</code>这个Parser。在init方法中，我们找到<code>aspectj-autoproxy</code>对应的Parser是<code>AspectJAutoProxyBeanDefinitionParser</code>这个类：
```bash
@Override
@Nullable
//我们只关注解析的主方法，parse方法
public BeanDefinition parse(Element element, ParserContext parserContext) {
    //注册一个类到IOC容器中
    AopNamespaceUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(parserContext, element);
    extendBeanDefinition(element, parserContext);
    return null;
}
```

---

### 3.注册AnnotationAwareAspectJAutoProxyCreator
<code>AnnotationAwareAspectJAutoProxyCreator</code>是实现AOP功能的主要类，我们先来看看这个类的结构：
![spring](images/spring-aop1.png)
此类实现了<code>BeanPostProcessor</code>，稍后将关注其后置处理Bean的方法**postProcessAfterInitialization**，并且实现了<code>BeanFactorAware</code>接口，此类将取得并存有一个<code>BeanFactory</code>实例对象。
回到主线，关注注册此类的方法：
```bash
public static void registerAspectJAnnotationAutoProxyCreatorIfNecessary(
    ParserContext parserContext, Element sourceElement) {
//将一个类作为Bean注册到IOC容器中
    BeanDefinition beanDefinition = AopConfigUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(
        parserContext.getRegistry(), parserContext.extractSource(sourceElement));
    //处理proxy-target-class与expose-proxy属性
    useClassProxyingIfNecessary(parserContext.getRegistry(), sourceElement);
    //注册组件并通知
    registerComponentIfNecessary(beanDefinition, parserContext);
}
```
其中，在注册这个类的过程中主要完成了3件事：
1. 注册<code>AnnotationAwareAspectJAutoProxyCreator：</code>
```bash
@Nullable
public static BeanDefinition registerAspectJAnnotationAutoProxyCreatorIfNecessary(BeanDefinitionRegistry registry,
                                                                                  @Nullable Object source) {
//将AnnotationAwareAspectJAutoProxyCreator这个类注册到IOC容器中
    return registerOrEscalateApcAsRequired(AnnotationAwareAspectJAutoProxyCreator.class, registry, source);
}
```
```bash
@Nullable
private static BeanDefinition registerOrEscalateApcAsRequired(Class<?> cls, BeanDefinitionRegistry registry,
                                                              @Nullable Object source) {

    Assert.notNull(registry, "BeanDefinitionRegistry must not be null");

    //如果IOC容器中已经存在了此类型的Bean，则需要判断优先级
    if (registry.containsBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME)) {
        //获取此类的BeanDefinition信息
        BeanDefinition apcDefinition = registry.getBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME);
        //如果此Bean的ClassName与AnnotationAwareAspectJAutoProxyCreator类的
        //ClassName不同的话，判断优先级
        if (!cls.getName().equals(apcDefinition.getBeanClassName())) {
            int currentPriority = findPriorityForClass(apcDefinition.getBeanClassName());
            int requiredPriority = findPriorityForClass(cls);
            //如果已存在Bean优先级小于Creator的优先级
            if (currentPriority < requiredPriority) {
                //将ClassName替换成Creator
                apcDefinition.setBeanClassName(cls.getName());
            }
        }
        //不进行注册，因为已经注册了
        return null;
    }

    //如果到这里，说明IOC容器中没有配置对应Creator
    //使用Crearir的Class构造一个BeanDefinition
    RootBeanDefinition beanDefinition = new RootBeanDefinition(cls);
    beanDefinition.setSource(source);
    //配置依赖属性order，将其设置为最高优先级
    beanDefinition.getPropertyValues().add("order", Ordered.HIGHEST_PRECEDENCE);
    beanDefinition.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
    //将设置好属性的BeanDefinition注册进IOC容器中
    registry.registerBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME, beanDefinition);
    return beanDefinition;
}
```
2. 处理**proxy-target-class**与**expose-proxy**属性
```bash
private static void useClassProxyingIfNecessary(BeanDefinitionRegistry registry, @Nullable Element sourceElement) {
    if (sourceElement != null) {
        boolean proxyTargetClass = Boolean.valueOf(sourceElement.getAttribute(PROXY_TARGET_CLASS_ATTRIBUTE));
        //处理proxy-target-class属性
        if (proxyTargetClass) {
            AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry);
        }
        boolean exposeProxy = Boolean.valueOf(sourceElement.getAttribute(EXPOSE_PROXY_ATTRIBUTE));
        //处理expose-proxy属性
        if (exposeProxy) {
            AopConfigUtils.forceAutoProxyCreatorToExposeProxy(registry);
        }
    }
}
```
其中设置属性的过程：
```bash
public static void forceAutoProxyCreatorToUseClassProxying(BeanDefinitionRegistry registry) {
    if (registry.containsBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME)) {
        //根据之前注册的BeanName取出Creator
        BeanDefinition definition = registry.getBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME);
        //将Creator的BeanDefinition的属性proxyTargetClass设置为true
        definition.getPropertyValues().add("proxyTargetClass", Boolean.TRUE);
    }
}

public static void forceAutoProxyCreatorToExposeProxy(BeanDefinitionRegistry registry) {
    if (registry.containsBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME)) {
        //根据之前注册的BeanName取出Creator
        BeanDefinition definition = registry.getBeanDefinition(AUTO_PROXY_CREATOR_BEAN_NAME);
        //将Creator的BeanDefinition的属性exposeProxy设置为true
        definition.getPropertyValues().add("exposeProxy", Boolean.TRUE);
    }
}
```

- **proxy-target-class**：在Spring的AOP中，默认的如果目标类实现了至少一个接口，将使用**JDK动态代理**实现AOP，否则使用**CGLib动态代理**实现AOP，如果希望AOP都使用CGLib实现，你就可以设置proxy-target-class属性为**true**，但要注意几个问题：

1)**无法对final的方法进行动态代理**，原因很简单，CGLib使用继承实现，final方法无法重写，所以final的方法不能应用AOP。
2)需要配置CGLib的JAR包
- **expose-proxy**：在讲解事务的那篇文章中有提到，如果一个类中的事务A方法调用了同一个类中的事务B方法，**B方法将没有事务**，这个道理在AOP中也是这样的，相同类下的不同方法互相调用，内部方法将无法被应用通知（无法进行AOP），此时你需要将**expose-proxy属性设置为true**，暴露一个代理类（此属性的原理在下面会有详细讲解），然后在A方法中需要调用B方法的话需要这样写：
```bash
public class Service{
    public void A(){
        ((Service)AopContext.currentProxy()).B();
    }

    public void B(){
    //do something...
    }
}
```
这样，B方法就算再A方法内也可以被AOP。其中<code>AopContext</code>是存放线程变量的类，形象的称之为**AOP的上下文**。

---

### 4.实现AOP代理
#### 创建AOP代理
上面，自定义标签的配置完成了对**Creator类的自动注册**，我们可以知道，此类实现了<code>BeanPostProcessor</code>接口，将会在IOC容器初始化每个Bean时都调用此类的**postProcessAfterInitialization**方法，此方法即为AOP代理的入口，此方法在抽象父类<code>AbstractAutoProxyCreator</code>实现：
```bash
@Override
public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) throws BeansException {
    if (bean != null) {
        //先从缓存中获取Key，由要代理的Bean的Class与benaName组成
        Object cacheKey = getCacheKey(bean.getClass(), beanName);
        //判断是否是过早暴露的Bean，此概念在讲IOC解决循环依赖中有提到
        //如果是过早暴露的Bean，则此时连依赖注入都没有完成，则不对其进行代理
        //待其真正初始化之后再尝试代理
        if (!this.earlyProxyReferences.contains(cacheKey)) {
            //如果符合条件进行AOP代理
            return wrapIfNecessary(bean, beanName, cacheKey);
        }
    }
    return bean;
}
```
```bash
protected Object wrapIfNecessary(Object bean, String beanName, Object cacheKey) {
    //如果先前已经处理过的，不进行处理
    if (StringUtils.hasLength(beanName) && this.targetSourcedBeans.contains(beanName)) {
        return bean;
    }
    //如果此Bean已经被标记为无法代理，不进行处理
    if (Boolean.FALSE.equals(this.advisedBeans.get(cacheKey))) {
        return bean;
    }
    //如果Bean为AOP类的类型，或是需要跳过的类型，不进行处理
    if (isInfrastructureClass(bean.getClass()) || shouldSkip(bean.getClass(), beanName)) {
        //标记为不代理
        this.advisedBeans.put(cacheKey, Boolean.FALSE);
        return bean;
    }

    // Create proxy if we have advice.
    //寻找符合此Bean的增强方法（通知方法）
    Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null);
    //如果寻找到的增强方法列表不为空，也就是不为DO_NOT_PROXY
    if (specificInterceptors != DO_NOT_PROXY) {
        //标记为已代理
        this.advisedBeans.put(cacheKey, Boolean.TRUE);
        //根据找到的增强方法，对此Bean进行动态代理
        Object proxy = createProxy(
            bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean));
        this.proxyTypes.put(cacheKey, proxy.getClass());
        //将代理对象作为Bean返回给IOC容器
        return proxy;
    }
  //如果走到这里，说明代理失败，标记为代理失败
    this.advisedBeans.put(cacheKey, Boolean.FALSE);
    return bean;
}
```
文章到了这里，就已经基本完成AOP的实现了，剩下我们需要关注的就是两件事：
- 如何寻找符合Bean的增强器
- 如何对Bean创建动态代理

#### 寻找所有的增强器

```bash
@Override
@Nullable
protected Object[] getAdvicesAndAdvisorsForBean(Class<?> beanClass, String beanName, @Nullable TargetSource targetSource) {
    //寻找适合的Advisor
    List<Advisor> advisors = findEligibleAdvisors(beanClass, beanName);
    if (advisors.isEmpty()) {
        return DO_NOT_PROXY;
    }
    return advisors.toArray();
}
```
这里有一个<code>Advisor</code>的概念，其中Advisor**封装了切点信息与advise通知方法等等信息。**
```bash
protected List<Advisor> findEligibleAdvisors(Class<?> beanClass, String beanName) {
    //寻找所有适用的Advisor
    List<Advisor> candidateAdvisors = findCandidateAdvisors();
    //从所有Advisor中选出适合被当前Bean使用的Advisor
    List<Advisor> eligibleAdvisors = findAdvisorsThatCanApply(candidateAdvisors, beanClass, beanName);
    extendAdvisors(eligibleAdvisors);
    if (!eligibleAdvisors.isEmpty()) {
        eligibleAdvisors = sortAdvisors(eligibleAdvisors);
    }
    return eligibleAdvisors;
}
```

##### 寻找已存在的Advisor
首先，执行下面的方法寻找合适的<code>Advisor</code>（此方法在子类<code>Creator</code>中得到实现）：
```bash
@Override
protected List<Advisor> findCandidateAdvisors() {
    // Add all the Spring advisors found according to superclass rules.
    //首先调用父类findCandidateAdvisors的方法寻找在IOC容器中的Advisor类型的Bean
    List<Advisor> advisors = super.findCandidateAdvisors();
    // Build Advisors for all AspectJ aspects in the bean factory.
    if (this.aspectJAdvisorsBuilder != null) {
        //寻找注解的Advisor
        advisors.addAll(this.aspectJAdvisorsBuilder.buildAspectJAdvisors());
    }
    return advisors;
}
```
先调用父类的**findCandidateAdvisors**方法寻找所有的<code>Advisor</code>：
```bash
protected List<Advisor> findCandidateAdvisors() {
    Assert.state(this.advisorRetrievalHelper != null, "No BeanFactoryAdvisorRetrievalHelper available");
    //委派Helper类去寻找
    return this.advisorRetrievalHelper.findAdvisorBeans();
}
```
```bash
public List<Advisor> findAdvisorBeans() {
    // Determine list of advisor bean names, if not cached already.
    String[] advisorNames = null;
    synchronized (this) {
        //先从缓存中取
        advisorNames = this.cachedAdvisorBeanNames;
        //缓存中若没有再去IOC容器中取
        if (advisorNames == null) {
            // Do not initialize FactoryBeans here: We need to leave all regular beans
            // uninitialized to let the auto-proxy creator apply to them!
            //从IOC容器中寻找所有Advisor类型的BeanName
            advisorNames = BeanFactoryUtils.beanNamesForTypeIncludingAncestors(
                this.beanFactory, Advisor.class, true, false);
            //放入缓存
            this.cachedAdvisorBeanNames = advisorNames;
        }
    }
    //没有找到，返回空
    if (advisorNames.length == 0) {
        return new LinkedList<>();
    }

    List<Advisor> advisors = new LinkedList<>();
    //遍历上面得到的所有BeanName
    for (String name : advisorNames) {
        if (isEligibleBean(name)) {
            if (this.beanFactory.isCurrentlyInCreation(name)) {
                if (logger.isDebugEnabled()) {
                    logger.debug("Skipping currently created advisor '" + name + "'");
                }
            }
            else {
                try {
                    //根据BeanName从IOC获取Bean实例并存入List中
                    advisors.add(this.beanFactory.getBean(name, Advisor.class));
                }
                //catch方法 略...
            }
        }
    }
    return advisors;
}
```
注意此时仅仅是**只获取IOC容器中那些Advisor类型的Bean作为Advisor**，而在我们注解配置AOP的方式中并不是配置Advisor类的，下面会说到如何获取所有打了注解的切面，这里只是尝试去IOC容器中找是否存在这样的类，有的话也不会漏掉。

##### 寻找所有注解的Advisor
现在我们拿到了部分的Advisor，回到我们主类<code>AnnotationAwareAspectJAutoProxyCreatorS</code>的**findCandidateAdvisors** 方法，此时将委派<code>BeanFactoryAspectJAdvisorsBuilder</code>类去执行**buildAspectJAdvisors**方法，将继续获取被注解了的Advisor：
```bash
@Override
protected List<Advisor> findCandidateAdvisors() {
    // Add all the Spring advisors found according to superclass rules.
    List<Advisor> advisors = super.findCandidateAdvisors();
    // Build Advisors for all AspectJ aspects in the bean factory.
    if (this.aspectJAdvisorsBuilder != null) {
        //委派BeanFactoryAspectJAdvisorsBuilder去寻找注解Advisor
        advisors.addAll(this.aspectJAdvisorsBuilder.buildAspectJAdvisors());
    }
    return advisors;
}
```
```bash
public List<Advisor> buildAspectJAdvisors() {
    List<String> aspectNames = this.aspectBeanNames;

    if (aspectNames == null) {
        synchronized (this) {
            aspectNames = this.aspectBeanNames;
            //双重加锁保证在并发情况下不会寻找两次
            if (aspectNames == null) {
                List<Advisor> advisors = new LinkedList<>();
                aspectNames = new LinkedList<>();
                //从IOC容器中获取所有的BeanName
                String[] beanNames = BeanFactoryUtils.beanNamesForTypeIncludingAncestors(
                    this.beanFactory, Object.class, true, false);
                //遍历所有的BeanName
                for (String beanName : beanNames) {
                    if (!isEligibleBean(beanName)) {
                        continue;
                    }
                    // We must be careful not to instantiate beans eagerly as in this case they
                    // would be cached by the Spring container but would not have been weaved.
                    Class<?> beanType = this.beanFactory.getType(beanName);
                    if (beanType == null) {
                        continue;
                    }
                    //判断此时的Bean的类上是否打了@Aspect注解
                    if (this.advisorFactory.isAspect(beanType)) {
                        //如果是，判断此类将是一个Advisor
                        aspectNames.add(beanName);
                        AspectMetadata amd = new AspectMetadata(beanType, beanName);
                        //如果是单例，说明可以缓存下来
                        if (amd.getAjType().getPerClause().getKind() == PerClauseKind.SINGLETON) {
                            //封装成一个对象
                            MetadataAwareAspectInstanceFactory factory =
                                new BeanFactoryAspectInstanceFactory(this.beanFactory, beanName);
                            //委派advisorFactory工厂针对以上封装信息创建Advisor
                            List<Advisor> classAdvisors = this.advisorFactory.getAdvisors(factory);
                            //如果是单例，缓存
                            if (this.beanFactory.isSingleton(beanName)) {
                                this.advisorsCache.put(beanName, classAdvisors);
                            }
                            //如果不是，只缓存factory，待下一次进入取出缓存的factory
                            //然后再用advisorFactory创建一次Advisor，省去寻找Bean与创建factory的麻烦
                            else {
                                this.aspectFactoryCache.put(beanName, factory);
                            }
                            advisors.addAll(classAdvisors);
                        }
                        else {
                            // Per target or per this.
                            if (this.beanFactory.isSingleton(beanName)) {
                                throw new IllegalArgumentException("Bean with name '" + beanName +
                                                                   "' is a singleton, but aspect instantiation model is not singleton");
                            }
                            MetadataAwareAspectInstanceFactory factory =
                                new PrototypeAspectInstanceFactory(this.beanFactory, beanName);
                            this.aspectFactoryCache.put(beanName, factory);
                            advisors.addAll(this.advisorFactory.getAdvisors(factory));
                        }
                    }
                }
                this.aspectBeanNames = aspectNames;
                return advisors;
            }
        }
    }

    //如果走到这里，说明已经找过一遍了，这里从缓存获取信息
    if (aspectNames.isEmpty()) {
        return Collections.emptyList();
    }
    List<Advisor> advisors = new LinkedList<>();
    //遍历所有缓存的切面名
    for (String aspectName : aspectNames) {
        //根据切面名从缓存拿Advisor
        List<Advisor> cachedAdvisors = this.advisorsCache.get(aspectName);
        //如果可以拿到，直接获取
        if (cachedAdvisors != null) {
            advisors.addAll(cachedAdvisors);
        }
        //如果拿不到，说明此时缓存的是factory
        //根据factory使用advisorFactory创建Advisor
        else {
            MetadataAwareAspectInstanceFactory factory = this.aspectFactoryCache.get(aspectName);
            advisors.addAll(this.advisorFactory.getAdvisors(factory));
        }
    }
    return advisors;
}
```
到这里，我们已经**完成了对所有Advisor的获取**，这里值得关注的是工厂（**advisorFactory**）是**如何创建Advisor**的呢？进入<code>ReflectiveAspectJAdvisorFactory</code>类的**getAdvisors**方法：
```bash
@Override
public List<Advisor> getAdvisors(MetadataAwareAspectInstanceFactory aspectInstanceFactory) {
    //获取切面类类型
    Class<?> aspectClass = aspectInstanceFactory.getAspectMetadata().getAspectClass();
    //获取切面Name
    String aspectName = aspectInstanceFactory.getAspectMetadata().getAspectName();
    //验证
    validate(aspectClass);

    // We need to wrap the MetadataAwareAspectInstanceFactory with a decorator
    // so that it will only instantiate once.
    MetadataAwareAspectInstanceFactory lazySingletonAspectInstanceFactory =
        new LazySingletonAspectInstanceFactoryDecorator(aspectInstanceFactory);

    List<Advisor> advisors = new LinkedList<>();
    //遍历所有除了被打上@Pointcut注解的方法
    for (Method method : getAdvisorMethods(aspectClass)) {
        //在其每个方法中获取Advisor
        Advisor advisor = getAdvisor(method, lazySingletonAspectInstanceFactory, advisors.size(), aspectName);
        if (advisor != null) {
            advisors.add(advisor);
        }
    }

    // If it's a per target aspect, emit the dummy instantiating aspect.
    if (!advisors.isEmpty() && lazySingletonAspectInstanceFactory.getAspectMetadata().isLazilyInstantiated()) {
        Advisor instantiationAdvisor = new SyntheticInstantiationAdvisor(lazySingletonAspectInstanceFactory);
        advisors.add(0, instantiationAdvisor);
    }

    // Find introduction fields.
    //获取DeclareParents注解的filed
    for (Field field : aspectClass.getDeclaredFields()) {
        Advisor advisor = getDeclareParentsAdvisor(field);
        if (advisor != null) {
            advisors.add(advisor);
        }
    }

    return advisors;
}
```
我们需要关注两点：
1. **getAdvisorMethods**：此方法获取类上所有的<code>AdvisorMethods</code>，那么是如何进行的：
```bash
private List<Method> getAdvisorMethods(Class<?> aspectClass) {
    final List<Method> methods = new LinkedList<>();
    ReflectionUtils.doWithMethods(aspectClass, method -> {
        // Exclude pointcuts
        //获取方法上的注解，如果是Pointcut注解不处理
        if (AnnotationUtils.getAnnotation(method, Pointcut.class) == null) {
            methods.add(method);
        }
    });
    Collections.sort(methods, METHOD_COMPARATOR);
    return methods;
}
```
我们可以知道，其将**不是Pointcut的注解的方法加入到方法集合中作为AdvisorMethod**。
2. **getAdvisor**：从上面获得的方法中，提取出<code>Advisor</code>：
```bash
@Override
@Nullable
public Advisor getAdvisor(Method candidateAdviceMethod, MetadataAwareAspectInstanceFactory aspectInstanceFactory,
                          int declarationOrderInAspect, String aspectName) {

    validate(aspectInstanceFactory.getAspectMetadata().getAspectClass());

    //切点信息的获取
    AspectJExpressionPointcut expressionPointcut = getPointcut(
        candidateAdviceMethod, aspectInstanceFactory.getAspectMetadata().getAspectClass());
    if (expressionPointcut == null) {
        return null;
    }

    //根据获得的切点信息封装增强器
    return new InstantiationModelAwarePointcutAdvisorImpl(expressionPointcut, candidateAdviceMethod,
                                                          this, aspectInstanceFactory, declarationOrderInAspect, aspectName);
}
```
我们依然需要关注两个点：

- getPointcut：**切点信息的获取**
- InstantiationModelAwarePointcutAdvisorImpl：**根据切点信息封装成增强器**

##### 获取切点信息

依然是在创建Advisor的工厂中的方法**getPointcut**：
```bash
@Nullable
private AspectJExpressionPointcut getPointcut(Method candidateAdviceMethod, Class<?> candidateAspectClass) {
    //获取该方法的注解
    AspectJAnnotation<?> aspectJAnnotation =
        AbstractAspectJAdvisorFactory.findAspectJAnnotationOnMethod(candidateAdviceMethod);
    if (aspectJAnnotation == null) {
        return null;
    }

    //封装信息
    AspectJExpressionPointcut ajexp =
        new AspectJExpressionPointcut(candidateAspectClass, new String[0], new Class<?>[0]);
    //设置切点表达式
    //例如：@Before（"test()"）上的test()
    ajexp.setExpression(aspectJAnnotation.getPointcutExpression());
    if (this.beanFactory != null) {
        ajexp.setBeanFactory(this.beanFactory);
    }
    return ajexp;
}
```
需要关注的是获取方法的注解**findAspectJAnnotationOnMethod**：
```bash
@SuppressWarnings("unchecked")
@Nullable
protected static AspectJAnnotation<?> findAspectJAnnotationOnMethod(Method method) {
    //需要关注的类型
    Class<?>[] classesToLookFor = new Class<?>[] {
        Before.class, Around.class, After.class, AfterReturning.class, AfterThrowing.class, Pointcut.class};
    for (Class<?> c : classesToLookFor) {
        //将每个需要关注的类型都与方法进行匹配
        AspectJAnnotation<?> foundAnnotation = findAnnotation(method, (Class<Annotation>) c);
        //如果找到，返回
        if (foundAnnotation != null) {
            return foundAnnotation;
        }
    }
    return null;
}
```
**findAnnotation ：**
```bash
@Nullable
private static <A extends Annotation> AspectJAnnotation<A> findAnnotation(Method method, Class<A> toLookFor) {
    //根据指定的类型寻找方法上的注解
    A result = AnnotationUtils.findAnnotation(method, toLookFor);
    if (result != null) {
        //如果找到了，将其封装为AspectJAnnotation对象返回
        return new AspectJAnnotation<>(result);
    }
    else {
        return null;
    }
}
```
注意，在寻找注解的时候**仅仅是获取**了例如@Before("test()")中的**test()这样的切点方法名信息**，这个过程在封装AspectJAnnotation对象时在**构造函数**完成：
```bash
public AspectJAnnotation(A annotation) {
    this.annotation = annotation;
    this.annotationType = determineAnnotationType(annotation);
    // We know these methods exist with the same name on each object,
    // but need to invoke them reflectively as there isn't a common interface.
    try {
        //处理注解上的pointcut信息
        this.pointcutExpression = resolveExpression(annotation);
        this.argumentNames = (String) annotation.getClass().getMethod("argNames").invoke(annotation);
    }
    catch (Exception ex) {
        throw new IllegalArgumentException(annotation + " cannot be an AspectJ annotation", ex);
    }
}
```
```bash
private String resolveExpression(A annotation) throws Exception {
    //遍历获取注解中的两个方法名：value和pointcut
    for (String methodName : EXPRESSION_PROPERTIES) {
        Method method;
        try {
            //获取method对象
            method = annotation.getClass().getDeclaredMethod(methodName);
        }
        catch (NoSuchMethodException ex) {
            method = null;
        }
        if (method != null) {
            //获取切点方法名，也就是注解上设置的，例如@Before("test()")
            //此时获取"test()"这样的字符串
            String candidate = (String) method.invoke(annotation);
            if (StringUtils.hasText(candidate)) {
                return candidate;
            }
        }
    }
    throw new IllegalStateException("Failed to resolve expression: " + annotation);
}
```

##### 根据切点信息，封装成Advisor
根据切点信息生成增强器，所有的增强都由<code>InstantiationModelAwarePointcutAdvisorImpl</code>这个类来封装，当然，这个类是一个<code>Advisor</code>。进入此类的构造函数：
```bash
public InstantiationModelAwarePointcutAdvisorImpl(AspectJExpressionPointcut declaredPointcut,
                                                  Method aspectJAdviceMethod, AspectJAdvisorFactory aspectJAdvisorFactory,
                                                  MetadataAwareAspectInstanceFactory aspectInstanceFactory, int declarationOrder, String aspectName) {

    //将获得的信息都封装到这个对象的属性上
    this.declaredPointcut = declaredPointcut;
    this.declaringClass = aspectJAdviceMethod.getDeclaringClass();
    this.methodName = aspectJAdviceMethod.getName();
    this.parameterTypes = aspectJAdviceMethod.getParameterTypes();
    this.aspectJAdviceMethod = aspectJAdviceMethod;
    this.aspectJAdvisorFactory = aspectJAdvisorFactory;
    this.aspectInstanceFactory = aspectInstanceFactory;
    this.declarationOrder = declarationOrder;
    this.aspectName = aspectName;

    if (aspectInstanceFactory.getAspectMetadata().isLazilyInstantiated()) {
        // Static part of the pointcut is a lazy type.
        Pointcut preInstantiationPointcut = Pointcuts.union(
            aspectInstanceFactory.getAspectMetadata().getPerClausePointcut(), this.declaredPointcut);

        // Make it dynamic: must mutate from pre-instantiation to post-instantiation state.
        // If it's not a dynamic pointcut, it may be optimized out
        // by the Spring AOP infrastructure after the first evaluation.
        this.pointcut = new PerTargetInstantiationModelPointcut(
            this.declaredPointcut, preInstantiationPointcut, aspectInstanceFactory);
        this.lazy = true;
    }
    else {
        // A singleton aspect.
        this.pointcut = this.declaredPointcut;
        this.lazy = false;
        //解析当前切点适用的Advice，并保存到instantiatedAdvice属性上
        this.instantiatedAdvice = instantiateAdvice(this.declaredPointcut);
    }
}
```

在封装的过程中只是**简单的将信息放入类的属性中**，而值得关注的是最后一行的**instantiateAdvice**方法，此方法将**根据注解类型选择不同的Advise**，例如@Before、@After等等都是不同的Advice，它们需要前置或是后置通知，所体现的**增强的逻辑是不同的**，所以就需要不同的Advice来完成：
```bash
private Advice instantiateAdvice(AspectJExpressionPointcut pointcut) {
    //委派别的类去获取Advice
    Advice advice = this.aspectJAdvisorFactory.getAdvice(this.aspectJAdviceMethod, pointcut,
                                                         this.aspectInstanceFactory, this.declarationOrder, this.aspectName);
    return (advice != null ? advice : EMPTY_ADVICE);
}
```
此类又委派了<code>aspectJAdvisorFactory</code>去获取Advice：
```bash
@Override
@Nullable
public Advice getAdvice(Method candidateAdviceMethod, AspectJExpressionPointcut expressionPointcut,
                        MetadataAwareAspectInstanceFactory aspectInstanceFactory, int declarationOrder, String aspectName) {

    //根据之前的信息获取切面类类型
    Class<?> candidateAspectClass = aspectInstanceFactory.getAspectMetadata().getAspectClass();
    validate(candidateAspectClass);

    //寻找方法上的注解
    AspectJAnnotation<?> aspectJAnnotation =
        AbstractAspectJAdvisorFactory.findAspectJAnnotationOnMethod(candidateAdviceMethod);
    if (aspectJAnnotation == null) {
        return null;
    }

    // If we get here, we know we have an AspectJ method.
    // Check that it’s an AspectJ-annotated class
    if (!isAspect(candidateAspectClass)) {
        throw new AopConfigException("Advice must be declared inside an aspect type: " +
                                     "Offending method '" + candidateAdviceMethod + "' in class [" +
                                     candidateAspectClass.getName() + "]");
    }

    if (logger.isDebugEnabled()) {
        logger.debug("Found AspectJ method: " + candidateAdviceMethod);
    }

    AbstractAspectJAdvice springAdvice;

    //根据刚刚从方法上获得的注解，解析成枚举的类型进行swich
    switch (aspectJAnnotation.getAnnotationType()) {
            //@Before注解将会走这里
        case AtBefore:
            springAdvice = new AspectJMethodBeforeAdvice(
                candidateAdviceMethod, expressionPointcut, aspectInstanceFactory);
            break;
            //@After注解
        case AtAfter:
            springAdvice = new AspectJAfterAdvice(
                candidateAdviceMethod, expressionPointcut, aspectInstanceFactory);
            break;
            //@AfterReturning
        case AtAfterReturning:
            springAdvice = new AspectJAfterReturningAdvice(
                candidateAdviceMethod, expressionPointcut, aspectInstanceFactory);
            AfterReturning afterReturningAnnotation = (AfterReturning) aspectJAnnotation.getAnnotation();
            if (StringUtils.hasText(afterReturningAnnotation.returning())) {
                springAdvice.setReturningName(afterReturningAnnotation.returning());
            }
            break;
            //@AfterThrowing
        case AtAfterThrowing:
            springAdvice = new AspectJAfterThrowingAdvice(
                candidateAdviceMethod, expressionPointcut, aspectInstanceFactory);
            AfterThrowing afterThrowingAnnotation = (AfterThrowing) aspectJAnnotation.getAnnotation();
            if (StringUtils.hasText(afterThrowingAnnotation.throwing())) {
                springAdvice.setThrowingName(afterThrowingAnnotation.throwing());
            }
            break;
            //@Around
        case AtAround:
            springAdvice = new AspectJAroundAdvice(
                candidateAdviceMethod, expressionPointcut, aspectInstanceFactory);
            break;
            //@Pointcut
        case AtPointcut:
            if (logger.isDebugEnabled()) {
                logger.debug("Processing pointcut '" + candidateAdviceMethod.getName() + "'");
            }
            return null;
        default:
            throw new UnsupportedOperationException(
                "Unsupported advice type on method: " + candidateAdviceMethod);
    }

    // Now to configure the advice...
    //配置得到的Advice
    springAdvice.setAspectName(aspectName);
    springAdvice.setDeclarationOrder(declarationOrder);
    String[] argNames = this.parameterNameDiscoverer.getParameterNames(candidateAdviceMethod);
    if (argNames != null) {
        springAdvice.setArgumentNamesFromStringArray(argNames);
    }
    springAdvice.calculateArgumentBindings();
    return springAdvice;
}
```
从上面我们可以知道，不同的通知对应不同的Advice，那么这些不同的advice的执行逻辑有哪些不同呢？这个疑问留着后面的执行过程会进行解答，这里只需要知道**我们获取的Advisor封装了advice与其切点信息**。

#### 寻找适用的增强器
我们的思路回到主线，此时我们已经**寻找到所有的增强器**了，现在开始从中**筛选**出适用的增强器：
```bash
protected List<Advisor> findEligibleAdvisors(Class<?> beanClass, String beanName) {
    //寻找所有适用的Advisor
    //这一步在4.2中进行
    List<Advisor> candidateAdvisors = findCandidateAdvisors();
    //从所有Advisor中选出适合被当前Bean使用的Advisor
    List<Advisor> eligibleAdvisors = findAdvisorsThatCanApply(candidateAdvisors, beanClass, beanName);
    extendAdvisors(eligibleAdvisors);
    if (!eligibleAdvisors.isEmpty()) {
        eligibleAdvisors = sortAdvisors(eligibleAdvisors);
    }
    return eligibleAdvisors;
}
```
此时执行**findAdvisorsThatCanApply**方法寻找适用的增强器：
```bash
protected List<Advisor> findAdvisorsThatCanApply(
    List<Advisor> candidateAdvisors, Class<?> beanClass, String beanName) {

    ProxyCreationContext.setCurrentProxiedBeanName(beanName);
    try {
        //委派AopUtils去做
        return AopUtils.findAdvisorsThatCanApply(candidateAdvisors, beanClass);
    }
    finally {
        ProxyCreationContext.setCurrentProxiedBeanName(null);
    }
}
```
这里委派了<code>AopUtils</code>去做事情：
```bash
public static List<Advisor> findAdvisorsThatCanApply(List<Advisor> candidateAdvisors, Class<?> clazz) {
    if (candidateAdvisors.isEmpty()) {
        return candidateAdvisors;
    }
    List<Advisor> eligibleAdvisors = new LinkedList<>();
    //遍历之前找到的所有的Advisor
    for (Advisor candidate : candidateAdvisors) {
        //在这里会优先处理引介增强，并且判断Advisor是否适合此Bean
        if (candidate instanceof IntroductionAdvisor && canApply(candidate, clazz)) {
            //优先加入List中
            eligibleAdvisors.add(candidate);
        }
    }
    boolean hasIntroductions = !eligibleAdvisors.isEmpty();
    for (Advisor candidate : candidateAdvisors) {
        if (candidate instanceof IntroductionAdvisor) {
            // already processed
            //已经处理过引介增强
            continue;
        }
        //剩下的Advisor再进行判断
        if (canApply(candidate, clazz, hasIntroductions)) {
            //加入List中
            eligibleAdvisors.add(candidate);
        }
    }
    //返回适合的Advisor List
    return eligibleAdvisors;
}
```
我们重点关注**canApply**方法，看看是如何判断是否适合的：
```bash
public static boolean canApply(Advisor advisor, Class<?> targetClass, boolean hasIntroductions) {
    if (advisor instanceof IntroductionAdvisor) {
        //调用引介增强器的ClassFilter去匹配当前Bean是否适合
        return ((IntroductionAdvisor) advisor).getClassFilter().matches(targetClass);
    }
    else if (advisor instanceof PointcutAdvisor) {
        //如果是普通的Advisor，转换成PointcutAdvisor
        //PointcutAdvisor接口定义了获取切点的方法getPointcut
        PointcutAdvisor pca = (PointcutAdvisor) advisor;
        //根据切点信息，寻找是否适合
        return canApply(pca.getPointcut(), targetClass, hasIntroductions);
    }
    else {
        // It doesn't have a pointcut so we assume it applies.
        //如果没有切点，就假设它适合
        return true;
    }
}
```
这里我们先忽略引介增强器，关注普通的Advisor。这里进入**canApply**方法，根据切点信息去判断是否合适：
```bash
public static boolean canApply(Pointcut pc, Class<?> targetClass, boolean hasIntroductions) {
    Assert.notNull(pc, "Pointcut must not be null");
    //获取切点类过滤器，如果不符合直接返回false
    //如果符合进入下一步判断
    if (!pc.getClassFilter().matches(targetClass)) {
        return false;
    }

    //获取切点的方法匹配器
    MethodMatcher methodMatcher = pc.getMethodMatcher();
    //如果此时methodMatcher是一个MethodMatcher.TRUE，说明匹配任何方法，直接返回true
    if (methodMatcher == MethodMatcher.TRUE) {
        // No need to iterate the methods if we’re matching any method anyway...
        return true;
    }

    IntroductionAwareMethodMatcher introductionAwareMethodMatcher = null;
    if (methodMatcher instanceof IntroductionAwareMethodMatcher) {
        introductionAwareMethodMatcher = (IntroductionAwareMethodMatcher) methodMatcher;
    }

    //拿到目标类的所有父类（包括接口）
    Set<Class<?>> classes = new LinkedHashSet<>(ClassUtils.getAllInterfacesForClassAsSet(targetClass));
    //包括本类
    classes.add(targetClass);
    //遍历父类与本类
    for (Class<?> clazz : classes) {
        //获取本class的方法对象
        Method[] methods = ReflectionUtils.getAllDeclaredMethods(clazz);
        //遍历方法
        for (Method method : methods) {
            //两个验证器只要其中一个匹配，就返回true
            if ((introductionAwareMethodMatcher != null &&
                 introductionAwareMethodMatcher.matches(method, targetClass, hasIntroductions)) ||
                methodMatcher.matches(method, targetClass)) {
                return true;
            }
        }
    }

    return false;
}
```
到这里，就**完成了适用的增强器的查找**，从上面我们可以知道，当一个Bean中的任何一个方法（方法**包括在父类**中的方法）**匹配Advisor中的切点信息**，就认为当前的Advisor是**匹配当前Bean**的，就将此时的**Advisor加入此类的Advisors列表**中，注意，一个Bean中是可以有多个Advisor的，如果不能理解为什么一个Bean对应多个Advisor，你应该还没有明白Advisor的概念，Advisor中包含advice与切点信息，也就是说，一个通知方法例如前置通知@Before是对应一个Advisor的，如果一个类中既有前置通知又有后置通知，那么这个类中的Advisor是会匹配两个的。

#### 创建代理
##### 获取代理类型（JDK或CGLIB）
再次回到最开始的地方，还记得4.1的**wrapIfNecessary**方法吗？此时我们已经寻找完符合此Bean的增强器了（**getAdvicesAndAdvisorsForBean**方法），就像刚刚所说，如果有两个通知匹配的话，现在增强器列表应该会有两个Advisor，也就是说增强列表不为空，将进行下一步，创建代理的过程**createProxy**：
```bash
protected Object createProxy(Class<?> beanClass, @Nullable String beanName,
                             @Nullable Object[] specificInterceptors, TargetSource targetSource) {

    if (this.beanFactory instanceof ConfigurableListableBeanFactory) {
        AutoProxyUtils.exposeTargetClass((ConfigurableListableBeanFactory) this.beanFactory, beanName, beanClass);
    }

    ProxyFactory proxyFactory = new ProxyFactory();
    //复制当前Creator的一些属性例如proxyTargetClass或是exposeProxy等
    proxyFactory.copyFrom(this);

    //如果proxyTargetClass是false才会进入判断
    //如果proxyTargetClass是true就直接用CGLib代理了，不需要判断
    if (!proxyFactory.isProxyTargetClass()) {
        //判断是否需要代理本类
        if (shouldProxyTargetClass(beanClass, beanName)) {
            //也就是说，如果需要代理本类，将使用CGLib方式代理
            proxyFactory.setProxyTargetClass(true);
        }
        //如果不需要，则获取所有该类的接口，设置到proxyFactory对象中
        else {
            evaluateProxyInterfaces(beanClass, proxyFactory);
        }
    }

    //处理所有得到的适用的拦截器转换成Advisor
    Advisor[] advisors = buildAdvisors(beanName, specificInterceptors);
    //将Advisors加入proxyFactory对象中
    proxyFactory.addAdvisors(advisors);
    //将原本的Bean对象（原生未代理）加入proxyFactory对象中
    proxyFactory.setTargetSource(targetSource);
    //定制代理
    customizeProxyFactory(proxyFactory);

    proxyFactory.setFrozen(this.freezeProxy);
    if (advisorsPreFiltered()) {
        proxyFactory.setPreFiltered(true);
    }

    //设置好属性之后，就调用proxyFactory对象生成代理对象
    return proxyFactory.getProxy(getProxyClassLoader());
}
```
以上过程都在给<code>proxyFactory</code>这个对象设置属性，然后调用<code>proxyFactory</code>根据设置的一些属性生成代理对象，最后执行关键的创建代理方法**getProxy**：
```bash
public Object getProxy(@Nullable ClassLoader classLoader) {
    return createAopProxy().getProxy(classLoader);
}
```
```bash
protected final synchronized AopProxy createAopProxy() {
    if (!this.active) {
        activate();
    }
    //使用aopProxyFactory根据本类信息创建
    return getAopProxyFactory().createAopProxy(this);
}
```
其中<code>aopProxyFactory</code>是在其父类的构造函数中赋值的：
```bash
public ProxyCreatorSupport() {
    this.aopProxyFactory = new DefaultAopProxyFactory();
}
```
进入其创建方法**createAopProxy**：
```bash
@Override
public AopProxy createAopProxy(AdvisedSupport config) throws AopConfigException {
    //判断ProxyTargetClass属性和是否有代理接口等等判断使用何种方式做代理
    if (config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)) {
        Class<?> targetClass = config.getTargetClass();
        if (targetClass == null) {
            throw new AopConfigException("TargetSource cannot determine target class: " +
                                         "Either an interface or a target is required for proxy creation.");
        }
        if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
            return new JdkDynamicAopProxy(config);
        }
        return new ObjenesisCglibAopProxy(config);
    }
    else {
        return new JdkDynamicAopProxy(config);
    }
}
```
> 注意此时config对象是我们之前设置了各种信息的proxyFactory对象，在代理的构造函数中存放了这个属性，也就是说代理对象持有一个Advisor列表。

这段代码清晰明了，主要就是在**判断使用何种方式做代理**：

- optimize：这个属性适用于CGLib，对JDK动态代理无效。主要是控制CGLib创建的代理是否使用激进的优化策略。
- proxyTargetClass：文章开头也有提到，如果属性为true，将会使用CGLib进行代理。
- hasNoUserSuppliedProxyInterfaces：是否存在代理接口。

总结一下JDK于CGLIB如何选择：
- 如果目标对象实现了接口，默认情况下会采用JDK代理
- 如果目标对象实现了接口，但可以使用proxyTargetClass属性来强制使用CGLIB代理
- 如果对象没用实现接口，必须使用CGLIB代理

##### 获取代理

思路回到开头获取代理的方法中：
```bash
public Object getProxy(@Nullable ClassLoader classLoader) {
    return createAopProxy().getProxy(classLoader);
}
```
此时我们完成了**createAopProxy**，拿到了JDK代理对象（我们这里假设用JDK做代理）接着调用其**getProxy**方法：
```bash
@Override
public Object getProxy(@Nullable ClassLoader classLoader) {
    if (logger.isDebugEnabled()) {
        logger.debug("Creating JDK dynamic proxy: target source is " + this.advised.getTargetSource());
    }
    //拿到被代理类的接口
    Class<?>[] proxiedInterfaces = AopProxyUtils.completeProxiedInterfaces(this.advised, true);
    //检查上面得到的接口是否定义了equals、hashCode方法
    findDefinedEqualsAndHashCodeMethods(proxiedInterfaces);
    //创建代理对象
    return Proxy.newProxyInstance(classLoader, proxiedInterfaces, this);
}
```
注意此时的<code>advised</code>就是我们上面所说的<code>config</code>对象也就是封装半天信息的<code>proxyFactory</code>对象，里面存有一系列信息例如**Advisor、切点之类**。

这里不对动态代理进行解释，如果熟悉动态代理的看到这里应该已经懂了，其将当前对象作为实现代理的主要对象。毫无疑问，当前对象一定实现了<code>InvocationHandler</code>接口，我们需要关注的即为它的**invoke**方法：
```bash
@Override
@Nullable
public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    MethodInvocation invocation;
    Object oldProxy = null;
    boolean setProxyContext = false;

    //原生对象
    TargetSource targetSource = this.advised.targetSource;
    Object target = null;

    try {
        //eqauls()方法，如果目标对象未实现此方法
        if (!this.equalsDefined && AopUtils.isEqualsMethod(method)) {
            // The target does not implement the equals(Object) method itself.
            return equals(args[0]);
        }
        //hashCode()方法，如果目标对象未实现此方法
        else if (!this.hashCodeDefined && AopUtils.isHashCodeMethod(method)) {
            // The target does not implement the hashCode() method itself.
            return hashCode();
        }
        else if (method.getDeclaringClass() == DecoratingProxy.class) {
            // There is only getDecoratedClass() declared -> dispatch to proxy config.
            return AopProxyUtils.ultimateTargetClass(this.advised);
        }
        //Advised接口或者其父接口中定义的方法,直接反射调用,不应用通知
        else if (!this.advised.opaque && method.getDeclaringClass().isInterface() &&
                 method.getDeclaringClass().isAssignableFrom(Advised.class)) {
            // Service invocations on ProxyConfig with the proxy config...
            return AopUtils.invokeJoinpointUsingReflection(this.advised, method, args);
        }

        Object retVal;

        //这里就是先前提到的如果exposeProxy属性为true，将会暴露一个proxy代理对象
        //给AOP上下文对象，存在线程变量中
        if (this.advised.exposeProxy) {
            // Make invocation available if necessary.
            oldProxy = AopContext.setCurrentProxy(proxy);
            setProxyContext = true;
        }

        // Get as late as possible to minimize the time we "own" the target,
        // in case it comes from a pool.
        //获得目标对象的类
        target = targetSource.getTarget();
        Class<?> targetClass = (target != null ? target.getClass() : null);

        // Get the interception chain for this method.
        //获取可以应用到此方法上的Interceptor列表
        List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method, targetClass);

        // Check whether we have any advice. If we don't, we can fallback on direct
        // reflective invocation of the target, and avoid creating a MethodInvocation.
        //如果没有可以应用到此方法的通知(Interceptor)，此直接反射调用 method.invoke(target, args)
        if (chain.isEmpty()) {
            // We can skip creating a MethodInvocation: just invoke the target directly
            // Note that the final invoker must be an InvokerInterceptor so we know it does
            // nothing but a reflective operation on the target, and no hot swapping or fancy proxying.
            Object[] argsToUse = AopProxyUtils.adaptArgumentsIfNecessary(method, args);
            retVal = AopUtils.invokeJoinpointUsingReflection(target, method, argsToUse);
        }
        else {
            // We need to create a method invocation...
            //走到这里，说明该方法符合被通知的条件，创建MethodInvocation
            //执行其proceed方法
            invocation = new ReflectiveMethodInvocation(proxy, target, method, args, targetClass, chain);
            // Proceed to the joinpoint through the interceptor chain.
            retVal = invocation.proceed();
        }

        // Massage return value if necessary.
        Class<?> returnType = method.getReturnType();
        if (retVal != null && retVal == target &&
            returnType != Object.class && returnType.isInstance(proxy) &&
            !RawTargetAccess.class.isAssignableFrom(method.getDeclaringClass())) {
            // Special case: it returned "this" and the return type of the method
            // is type-compatible. Note that we can't help if the target sets
            // a reference to itself in another returned object.
            retVal = proxy;
        }
        else if (retVal == null && returnType != Void.TYPE && returnType.isPrimitive()) {
            throw new AopInvocationException(
                "Null return value from advice does not match primitive return type for: " + method);
        }
        return retVal;
    }
    finally {
        if (target != null && !targetSource.isStatic()) {
            // Must have come from TargetSource.
            targetSource.releaseTarget(target);
        }
        if (setProxyContext) {
            // Restore old proxy.
            AopContext.setCurrentProxy(oldProxy);
        }
    }
}
```
也就是说，每次调用代理对象的方法，将执行以下步骤：
1. **判断是否是equals或hashCode或Advised的方法**：如果是执行对应判断。
2. **判断是否需要暴露代理对象**（将代理对象存入AopContext）：在文章开头就有提到这个属性，还是之前的例子，在A方法中调用B方法，此时B方法其实是原生对象的B方法，但如果B方法需要被AOP，需要执行的是代理对象的B方法，而不是原生对象的B方法，原生对象的B方法是没有被代理AOP的。所以这里需要暴露出代理对象，从AopContext上下文中取出代理对象，将其强转成对应类，执行B方法，此时的B方法即可是被AOP的方法了。值得一提的是AopContext暴露出来的代理对象是线程变量。
3. **获取当前方法对应的拦截器链**：主要是使用<code>advised</code>去对当前方法进行判断**是否符合切点**如果符合取出对应需要执行的链。如果此时**链为空**，代表执行的该方法是**不需要被AOP**的，正常反射执行即可，如果**链不为空**，将链封装成<code>ReflectiveMethodInvocation</code>对象执行其**proceed**方法，该对象的该方法是执行AOP的核心，下面详细讲解。

#### 执行AOP通知
到此我们创建好了代理对象，并**返回出去作为一个Bean存放在IOC容器中**，当我们取出此Bean并执行方法时，如果碰到了需要被AOP的方法时，会找到一个**拦截器链**，然后将其传入<code>ReflectiveMethodInvocation</code>对象封装，接着不会执行原方法而是执行其**proceed**方法，所以该方法是执行AOP通知的核心方法：
```bash
//此属性默认为-1
private int currentInterceptorIndex = -1;

//存放interceptors的列表
protected final List<?> interceptorsAndDynamicMethodMatchers;

@Override
@Nullable
public Object proceed() throws Throwable {
    //  We start with an index of -1 and increment early.
    //如果Interceptor执行完了，则执行joinPoint
    if (this.currentInterceptorIndex == this.interceptorsAndDynamicMethodMatchers.size() - 1) {
        return invokeJoinpoint();
    }

    //根据游标获取对应的Advice
    Object interceptorOrInterceptionAdvice =
        this.interceptorsAndDynamicMethodMatchers.get(++this.currentInterceptorIndex);
    //如果要动态匹配joinPoint
    if (interceptorOrInterceptionAdvice instanceof InterceptorAndDynamicMethodMatcher) {
        // Evaluate dynamic method matcher here: static part will already have
        // been evaluated and found to match.
        InterceptorAndDynamicMethodMatcher dm =
            (InterceptorAndDynamicMethodMatcher) interceptorOrInterceptionAdvice;
        //动态匹配：运行时参数是否满足匹配条件
        if (dm.methodMatcher.matches(this.method, this.targetClass, this.arguments)) {
            return dm.interceptor.invoke(this);
        }
        else {
            // Dynamic matching failed.
            // Skip this interceptor and invoke the next in the chain.
            //动态匹配失败时,略过当前Intercetpor,调用下一个Interceptor
            return proceed();
        }
    }
    else {
        // It’s an interceptor, so we just invoke it: The pointcut will have
        // been evaluated statically before this object was constructed.
        //执行当前IntercetporAdvice
        //注意此时传了this对象，是为了执行链的保持
        return ((MethodInterceptor) interceptorOrInterceptionAdvice).invoke(this);
    }
}
```

到这里，需要解释几点：
1. **如何判断执行结束？在开头我们说到currentInterceptorIndex**属性是为-1的，**interceptorsAndDynamicMethodMatchers**的size是执行链的数量，刚进来的时候执行链一定大于等于1，所以其减1也不会等于-1，不会执行**invokeJoinpoint**方法，走到下面执行这样一行代码
```bash
Object interceptorOrInterceptionAdvice =
        this.interceptorsAndDynamicMethodMatchers.get(++this.currentInterceptorIndex);
```
注意此时**currentInterceptorIndex**游标变成了0，也就是取执行链的第一个执行器取执行，同时游标变成0。下面会执行Advice的**invoke**方法，这里举例Before类型的Advice的**invoke**方法：
```bash
@Override
public Object invoke(MethodInvocation mi) throws Throwable {
    this.advice.before(mi.getMethod(), mi.getArguments(), mi.getThis() );
    return mi.proceed();
}
```
注意此时<code>mi对象</code>就是上面传进来的<code>this</code>，也就是<code>ReflectiveMethodInvocation</code>对象，他在通知方法执行完成之后，又执行了<code>ReflectiveMethodInvocation</code>的**proceed**方法，然后第二次进入**proceed**时，游标已经变成了0，我们假设此时拦截器数量为一个，那么此时**currentInterceptorIndex=0,interceptorsAndDynamicMethodMatchers.size() - 1 = 0：**
```bash
if (this.currentInterceptorIndex == this.interceptorsAndDynamicMethodMatchers.size() - 1) {
    return invokeJoinpoint();
}
```
将中止执行下面的内容，直接执行**invokeJoinpoint**方法：
```bash
@Nullable
protected Object invokeJoinpoint() throws Throwable {
    return AopUtils.invokeJoinpointUsingReflection(this.target, this.method, this.arguments);
}
```
这里底层就是**通过反射执行原方法**，到此结束，也就是说其**利用游标索引与循环调用proceed方法来判断当前执行链的结束**，真是个聪明的方法。

2. **为什么@Before的Advice的invoke可以实现前置通知效果，同样的@After如何实现后置通知效果？在这里我们将补上上面没有详细讲解的一些Advice类 。**
1) <code>MethodBeforeAdviceInterceptor</code>前置通知：
```bash
public class MethodBeforeAdviceInterceptor implements MethodInterceptor, Serializable {

    private MethodBeforeAdvice advice;

    /**
   * Create a new MethodBeforeAdviceInterceptor for the given advice.
   * @param advice the MethodBeforeAdvice to wrap
   */
    //构造器初始化保存了advice对象
    public MethodBeforeAdviceInterceptor(MethodBeforeAdvice advice) {
        Assert.notNull(advice, "Advice must not be null");
        this.advice = advice;
    }

    @Override
    public Object invoke(MethodInvocation mi) throws Throwable {
        this.advice.before(mi.getMethod(), mi.getArguments(), mi.getThis() );
        return mi.proceed();
    }
}
```
2)<code>AfterReturningAdviceInterceptor</code>后置通知：
```bash
public class AfterReturningAdviceInterceptor implements MethodInterceptor, AfterAdvice, Serializable {

    private final AfterReturningAdvice advice;


    /**
   * Create a new AfterReturningAdviceInterceptor for the given advice.
   * @param advice the AfterReturningAdvice to wrap
   */
    public AfterReturningAdviceInterceptor(AfterReturningAdvice advice) {
        Assert.notNull(advice, "Advice must not be null");
        this.advice = advice;
    }

    @Override
    public Object invoke(MethodInvocation mi) throws Throwable {
        Object retVal = mi.proceed();
        this.advice.afterReturning(retVal, mi.getMethod(), mi.getArguments(), mi.getThis());
        return retVal;
    }

}
```
从上面两个不同的<code>Advice</code>可以看出，其**invoke**方法的逻辑只是**顺序不同**而已，但为什么可以达到前置后置通知的呢？其实前置通知很好理解，在invoke的逻辑中只要**先执行我们指定的前置通知逻辑**，然后**继续往下执行proceed**即可实现在执行原方法前加一段逻辑的功能，我们主要分析后置通知是如何实现的。还是进行一个假设，此时该方法**只有一个执行链后置通知@After**，那么刚开始进入proceed方法时，获取这个Advice执行invoke方法，然后**又去执行proceed方法**了，由上面的分析此时的游标显示执行链已经执行完毕，所以此时会**直接反射执行原方法**，然后**proceed方法执行完毕**，最后将会执行后置通知Advice的invoke方法的下一步，**advice.afterReturning**，也就是用户**自定义的后置方法逻辑**，实现了在方法最后插入一段代码逻辑的功能，如果是多个通知例如前置后置都有的话，留给读者思考，相信懂得以上逻辑之后推敲起来并不是很难。

---

### 总结
到这里为止，我们分析了AOP是从**自定义标签开始**，自定义标签注册了一个<code>Creator</code>类，而此<code>Creator</code>类是一个<code>BeanPostProcessor</code>，也就是说每个Bean都将调用Creator实现的方法。

来到了**如何实现AOP代理的分析**中，在此方法中判断Bean是否需要被代理，然后进一步判断此Bean是否可以获得增强器，在这个过程中会去拿所有的Advisor，然后在所有的Advisor列表中筛选出适用的增强器，如果适用的增强器Advisor为空证明此Bean不用被代理，如果不为空则会进入创建代理的流程。

所以我们开始分析**创建代理是怎样的过程** ，在什么情况下会进行JDK动态代理，在什么情况下会进行CGLIB动态代理，然后创建代理结束之后。

必不可少的也需要分析是**如何执行AOP通知**的，其核心类是<code>ReflectiveMethodInvocation</code>的**proceed**方法，轮询执行拦截器，并且不同的Advice根据其特有的逻辑执行调用顺序，来完成AOP通知的功能。
