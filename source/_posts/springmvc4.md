---
title: 优秀而又强大的表现层框架——SpringMVC（四）
categories:
    - Java框架
    
date: 2019-06-19 22:50:15
tags:
  - web
  - 表现层框架

---

### 写在前面

最近系统的学习了下这个优秀而又强大的表现层框架——SpringMVC，拜读了**应癫**老师的《SpringMVC源码剖析》，深表感谢！

**源码地址：**[手写SpringMVC框架](https://github.com/LoonyCoder/springmvc)
**欢迎star/fork，给作者一些鼓励！**

### SpringMVC源码深度剖析

#### 前端控制器DispatcherServlet继承结构

![springmvc](/images/springmvc/springmvc8.png)

#### 重要时机点剖析

1. Handler⽅法的执⾏时机

**打断点**

![springmvc](/images/springmvc/springmvc9.png)

**观察调用栈**

![springmvc](/images/springmvc/springmvc10.png)

doDispathch⽅法中的1064⾏代码完成handler⽅法的调⽤

2. ⻚⾯渲染时机（打断点并观察调⽤栈）

![springmvc](/images/springmvc/springmvc11.png)

- SpringMVC处理请求的流程即为
<code>org.springframework.web.servlet.DispatcherServlet#doDispatch</code>⽅法的执⾏过程，其中步骤2、3、4、5是核⼼步骤
1. 调⽤<code>getHandler()</code>获取到能够处理当前请求的执⾏链 HandlerExecutionChain（Handler+拦截
器）**但是如何去getHandler的？后⾯进⾏分析**
2. 调⽤<code>getHandlerAdapter()</code>；获取能够执⾏1中Handler的适配器
但是如何去getHandlerAdapter的？后⾯进⾏分析
3. 适配器调⽤Handler执⾏ha.handle（总会返回⼀个ModelAndView对象）
4. 调⽤<code>processDispatchResult()</code>⽅法完成视图渲染跳转

```bash
protected void doDispatch(HttpServletRequest request, HttpServletResponse
response) throws Exception {
	HttpServletRequest processedRequest = request;
	HandlerExecutionChain mappedHandler = null;
	boolean multipartRequestParsed = false;
	WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
	try {
		ModelAndView mv = null;
		Exception dispatchException = null;
		try {
			// 1 检查是否是⽂件上传的请求
			processedRequest = checkMultipart(request);
			multipartRequestParsed = (processedRequest != request);
			// Determine handler for the current request.
			/*
			   2 取得处理当前请求的Controller，这⾥也称为Handler，即处理器
				 这⾥并不是直接返回 Controller，⽽是返回 HandlerExecutionChain 请求处理链对象,该对象封装了Handler和Inteceptor
			*/
			mappedHandler = getHandler(processedRequest);
			if (mappedHandler == null) {
				// 如果 handler 为空，则返回404
				noHandlerFound(processedRequest, response);
				return; 
			}
			// Determine handler adapter for the current request.
			// 3 获取处理请求的处理器适配器 HandlerAdapter
			HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
			// Process last-modified header, if supported by the handler.
			// 处理 last-modified 请求头
			String method = request.getMethod();
			boolean isGet = "GET".equals(method);
			if (isGet || "HEAD".equals(method)) {
				long lastModified = ha.getLastModified(request,mappedHandler.getHandler());
				if (new ServletWebRequest(request,response).checkNotModified(lastModified) && isGet) {
					return; 
				} 
			}
			if (!mappedHandler.applyPreHandle(processedRequest, response)) {
				return; 
			}
			// Actually invoke the handler.
			// 4 实际处理器处理请求，返回结果视图对象
			mv = ha.handle(processedRequest, response,mappedHandler.getHandler());
			if (asyncManager.isConcurrentHandlingStarted()) {
				return; 
			}
			// 结果视图对象的处理
			applyDefaultViewName(processedRequest, mv);
			mappedHandler.applyPostHandle(processedRequest, response, mv);
		}catch (Exception ex) {
			dispatchException = ex; 
		}catch (Throwable err) {
			// As of 4.3, we’re processing Errors thrown from handler methods as well,
			// making them available for @ExceptionHandler methods and other scenarios.
			dispatchException = new NestedServletException("Handler dispatch failed", err);
		}
			// 5 跳转⻚⾯，渲染视图
		processDispatchResult(processedRequest, response, mappedHandler, mv,dispatchException);
	}catch (Exception ex) {
		//最终会调⽤HandlerInterceptor的afterCompletion ⽅法
		triggerAfterCompletion(processedRequest, response, mappedHandler,ex);
	}catch (Throwable err) {
		//最终会调⽤HandlerInterceptor的afterCompletion ⽅法
		triggerAfterCompletion(processedRequest, response, mappedHandler,
		new NestedServletException("Handler processing failed", err));
	}
	finally {
		if (asyncManager.isConcurrentHandlingStarted()) {
			// Instead of postHandle and afterCompletion
			if (mappedHandler != null) {
				mappedHandler.applyAfterConcurrentHandlingStarted(processedRequest,response);
			} 
		}else {
			// Clean up any resources used by a multipart request.
			if (multipartRequestParsed) {
				cleanupMultipart(processedRequest);
			} 
		} 
	} 
}
```

#### 核心步骤getHandler方法剖析

遍历两个HandlerMapping，试图获取能够处理当前请求的执⾏链

![springmvc](images/springmvc/springmvc12.png)

#### 核心步骤getHandlerAdapter方法剖析

遍历各个HandlerAdapter，看哪个Adapter⽀持处理当前Handler

![springmvc](images/springmvc/springmvc13.png)

#### 核心步骤ha.handler方法剖析

- 入口

![springmvc](images/springmvc/springmvc14.png)

- 断点从⼊⼝进⼊

![springmvc](images/springmvc/springmvc15.png)
![springmvc](images/springmvc/springmvc16.png)
![springmvc](images/springmvc/springmvc17.png)
![springmvc](images/springmvc/springmvc18.png)

#### 核心步骤processDispatcherResult方法剖析

- render⽅法完成渲染

![springmvc](images/springmvc/springmvc19.png)

- 视图解析器解析出View视图对象

![springmvc](images/springmvc/springmvc20.png)

- 在解析出View视图对象的过程中会判断是否重定向、是否转发等，不同的情况封装的是不同的View实现

![springmvc](images/springmvc/springmvc21.png)

- 解析出View视图对象的过程中，要将逻辑视图名解析为物理视图名

![springmvc](images/springmvc/springmvc22.png)

- 封装View视图对象之后，调⽤了view对象的render⽅法

![springmvc](images/springmvc/springmvc23.png)

- 渲染数据

![springmvc](images/springmvc/springmvc24.png)

- 把modelMap中的数据暴露到request域中，这也是为什么后台model.add之后在jsp中可以从请求域取出来的根本原因

![springmvc](images/springmvc/springmvc25.png)

- 将数据设置到请求域中

![springmvc](images/springmvc/springmvc26.png)

#### SpringMVC九大组件初始化

1. 在DispatcherServlet中定义了九个属性，每⼀个属性都对应⼀种组件

```bash
/** MultipartResolver used by this servlet. */
// 多部件解析器
@Nullable
private MultipartResolver multipartResolver;
/** LocaleResolver used by this servlet. */
// 区域化 国际化解析器
@Nullable
private LocaleResolver localeResolver;
/** ThemeResolver used by this servlet. */
// 主题解析器
@Nullable
private ThemeResolver themeResolver;
/** List of HandlerMappings used by this servlet. */
// 处理器映射器组件
@Nullable
private List<HandlerMapping> handlerMappings;
/** List of HandlerAdapters used by this servlet. */
// 处理器适配器组件
@Nullable
private List<HandlerAdapter> handlerAdapters;
/** List of HandlerExceptionResolvers used by this servlet. */
// 异常解析器组件
@Nullable
private List<HandlerExceptionResolver> handlerExceptionResolvers;
/** RequestToViewNameTranslator used by this servlet. */
// 默认视图名转换器组件
@Nullable
private RequestToViewNameTranslator viewNameTranslator;
/** FlashMapManager used by this servlet. */
// flash属性管理组件
@Nullable
private FlashMapManager flashMapManager;
/** List of ViewResolvers used by this servlet. */
// 视图解析器
@Nullable
private List<ViewResolver> viewResolvers;
```

九⼤组件都是定义了接⼝，接⼝其实就是定义了该组件的规范，⽐如ViewResolver、HandlerAdapter等都是接⼝。

2. 九⼤组件的初始化时机

- DispatcherServlet中的<code>onRefresh()</code>，该⽅法中初始化了九⼤组件
![springmvc](/images/springmvc/springmvc27.png)

- initStrategies⽅法
![springmvc](/images/springmvc/springmvc28.png)

- 观察其中的⼀个组件initHandlerMappings(context)
![springmvc](/images/springmvc/springmvc29.png)

- 如果按照类型和按照固定id从ioc容器中找不到对应组件，则会按照默认策略进⾏注册初始化，默认策略在DispatcherServlet.properties⽂件中配置
![springmvc](/images/springmvc/springmvc30.png)

- DispatcherServlet.properties
![springmvc](/images/springmvc/springmvc31.png)

- 注意：多部件解析器的初始化必须按照id注册对象（multipartResolver）
![springmvc](/images/springmvc/springmvc32.png)









