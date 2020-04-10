---
title: 优秀而又强大的表现层框架——SpringMVC（二）
categories:
    - Java框架
    
date: 2019-05-28 21:56:59
tags:
  - web
  - 表现层框架

---

### 写在前面

最近系统的学习了下这个优秀而又强大的表现层框架——SpringMVC，拜读了**应癫**老师的《SpringMVC源码剖析》，深表感谢！

**源码地址：**[手写SpringMVC框架](https://github.com/LoonyCoder/springmvc)
**欢迎star/fork，给作者一些鼓励！**

### SpringMVC高级技术

#### 拦截器(Intecepter)使用

##### 监听器、过滤器和拦截器对比

- **过滤器（Filter）**：对Request请求起到过滤的作⽤，作⽤在Servlet之前，如果配置为/\*可以对所
有的资源访问（servlet、js/css静态资源等）进⾏过滤处理。

- **监听器（Listener）**：实现了<code>javax.servlet.ServletContextListener</code>接⼝的服务器端组件，它随
Web应⽤的启动⽽启动，只初始化⼀次，然后会⼀直运⾏监视，随Web应⽤的停⽌⽽销毁。
	- 作⽤⼀：做⼀些初始化⼯作，web应⽤中spring容器启动ContextLoaderListener
	- 作⽤⼆：监听web中的特定事件，⽐如HttpSession,ServletRequest的创建和销毁；变量的创建、
销毁和修改等。可以在某些动作前后增加处理，实现监控，⽐如统计在线⼈数，利⽤
HttpSessionLisener等。

- **拦截器（Interceptor）**：是SpringMVC、Struts等表现层框架⾃⼰的，不会拦截
jsp/html/css/image的访问等，只会拦截访问的控制器⽅法（Handler）。
从配置的⻆度也能够总结发现：serlvet、filter、listener是配置在web.xml中的，⽽interceptor是
配置在表现层框架⾃⼰的配置⽂件中的。
	- 在Handler业务逻辑执⾏之前拦截⼀次
	- 在Handler逻辑执⾏完毕但未跳转⻚⾯之前拦截⼀次
	- 在跳转⻚⾯之后拦截⼀次

![springmvc](/images/springmvc/springmvc4.png)

##### 拦截器的执行流程

在运⾏程序时，拦截器的执⾏是有⼀定顺序的，该顺序与配置⽂件中所定义的拦截器的顺序相关。 单个
拦截器，在程序中的执⾏流程如下图所示：

![springmvc](/images/springmvc/springmvc5.png)

1. 程序先执⾏<code>preHandle()</code>⽅法，如果该⽅法的返回值为true，则程序会继续向下执⾏处理器中的⽅
法，否则将不再向下执⾏。
2. 在业务处理器（即控制器Controller类）处理完请求后，会执⾏<code>postHandle()</code>⽅法，然后会通过
DispatcherServlet向客户端返回响应。
3. 在DispatcherServlet处理完请求后，才会执⾏<code>afterCompletion()</code>⽅法。

##### 多个拦截器的执行流程

多个拦截器（假设有两个拦截器Interceptor1和Interceptor2，并且在配置⽂件中， Interceptor1拦截
器配置在前），在程序中的执⾏流程如下图所示：

![springmvc](/images/springmvc/springmvc6.png)

从图可以看出，当有多个拦截器同时⼯作时，它们的<code>preHandle()</code>⽅法会按照配置⽂件中拦截器的配置
顺序执⾏，⽽它们的<code>postHandle()⽅法和<code>afterCompletion()</code>⽅法则会按照配置顺序的反序执⾏。

**示例代码**

⾃定义SpringMVC拦截器

```bash
/**
* ⾃定义springmvc拦截器
*/
public class MyIntercepter01 implements HandlerInterceptor {
/**
* 会在handler⽅法业务逻辑执⾏之前执⾏
* 往往在这⾥完成权限校验⼯作
* @param request
* @param response
* @param handler
* @return 返回值boolean代表是否放⾏，true代表放⾏，false代表中⽌
* @throws Exception
*/
@Override
public boolean preHandle(HttpServletRequest request, HttpServletResponse
	response, Object handler) throws Exception {
	System.out.println("MyIntercepter01 preHandle......");
	return true;
 }
/**
* 会在handler⽅法业务逻辑执⾏之后尚未跳转⻚⾯时执⾏
* @param request
* @param response
* @param handler
* @param modelAndView 封装了视图和数据，此时尚未跳转⻚⾯呢，你可以在这⾥针对返回的
数据和视图信息进⾏修改
* @throws Exception
*/
@Override
public void postHandle(HttpServletRequest request, HttpServletResponse
response, Object handler, ModelAndView modelAndView) throws Exception {
	System.out.println("MyIntercepter01 postHandle......");
 }
/**
* ⻚⾯已经跳转渲染完毕之后执⾏
* @param request
* @param response
* @param handler
* @param ex 可以在这⾥捕获异常
* @throws Exception
*/
@Override
public void afterCompletion(HttpServletRequest request,
HttpServletResponse response, Object handler, Exception ex) throws Exception {
	System.out.println("MyIntercepter01 afterCompletion......");
 }
}
```

注册SpringMVC拦截器

```bash
<mvc:interceptors>
	<!--拦截所有handler-->
	<!--<bean class="com.loonycoder.interceptor.MyIntercepter01"/>-->
	<mvc:interceptor>
	<!--配置当前拦截器的url拦截规则，**代表当前⽬录下及其⼦⽬录下的所有url-->
		<mvc:mapping path="/**"/>
	<!--exclude-mapping可以在mapping的基础上排除⼀些url拦截-->
	<!--<mvc:exclude-mapping path="/demo/**"/>-->
		<bean class="com.loonycoder.interceptor.MyIntercepter01"/>
	</mvc:interceptor> 
	<mvc:interceptor> 
		<mvc:mapping path="/**"/>
		<bean class="com.loonycoder.interceptor.MyIntercepter02"/>
	</mvc:interceptor>
</mvc:interceptors>
```

#### 处理multipart形式的数据

multipart用于文件上传，首先引入jar包

```bash
<!--⽂件上传所需jar坐标-->
<dependency> <groupId>commons-fileupload</groupId> <artifactId>commons-fileupload</artifactId> <version>1.3.1</version>
</dependency>
```

配置⽂件上传解析器

```bash
	<!--配置⽂件上传解析器，id是固定的multipartResolver-->
	<bean id="multipartResolver" class="org.springframework.web.multipart.commons.CommonsMultipartResolver">
		<!--设置上传⼤⼩，单位字节-->
		<property name="maxUploadSize" value="1000000000"/>
	</bean>
```

前端Form

```bash
<%--
1 method="post"
2 enctype="multipart/form-data"
3 type="file"
--%> 
<form method="post" enctype="multipart/form-data" action="/demo/upload"> <input type="file" name="uploadFile"/>
	<input type="submit" value="上传"/>
</form>
```

后台接收Handler

```bash
@RequestMapping("upload")
public String upload(MultipartFile uploadFile, HttpServletRequest request)
throws IOException {
	// ⽂件原名，如xxx.jpg
	String originalFilename = uploadFile.getOriginalFilename();
	// 获取⽂件的扩展名,如jpg
	String extendName =
	originalFilename.substring(originalFilename.lastIndexOf(".") + 1,
	originalFilename.length());
	String uuid = UUID.randomUUID().toString();
	// 新的⽂件名字
	String newName = uuid + "." + extendName;
	String realPath =
	request.getSession().getServletContext().getRealPath("/uploads");
	// 解决⽂件夹存放⽂件数量限制，按⽇期存放
	String datePath = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
	File floder = new File(realPath + "/" + datePath);
	if(!floder.exists()) {
	floder.mkdirs();
	 }
	uploadFile.transferTo(new File(floder,newName));
	return "success"; 
}
```

#### 在控制器中处理异常

使用<code>@ControllerAdvice</code>注解
```bash
// 可以让我们优雅的捕获所有Controller对象handler⽅法抛出的异常
@ControllerAdvice
public class GlobalExceptionResolver {
@ExceptionHandler(ArithmeticException.class)
	public ModelAndView handleException(ArithmeticException exception,
		HttpServletResponse response) {
		ModelAndView modelAndView = new ModelAndView();
		modelAndView.addObject("msg",exception.getMessage());
		modelAndView.setViewName("error");
		return modelAndView;
 	}
}
```

#### 基于Flash属性的跨重定向请求数据传递

重定向时请求参数会丢失，我们往往需要重新携带请求参数，我们可以进⾏⼿动参数拼接如下：

```bash
return "redirect:handle01?name=" + name;
```

但是上述拼接参数的⽅法属于get请求，携带参数⻓度有限制，参数安全性也不⾼，此时，我们可以使
⽤SpringMVC提供的flash属性机制，向上下⽂中添加flash属性，框架会在session中记录该属性值，当
跳转到⻚⾯之后框架会⾃动删除flash属性，不需要我们⼿动删除，通过这种⽅式进⾏重定向参数传递，
参数⻓度和安全性都得到了保障，如下：

```bash
/**
* SpringMVC 重定向时参数传递的问题
* 转发：A 找 B 借钱400，B没有钱但是悄悄的找到C借了400块钱给A
* url不会变,参数也不会丢失,⼀个请求
* 重定向：A 找 B 借钱400，B 说我没有钱，你找别⼈借去，那么A ⼜带着400块的借钱需求找到C
* url会变,参数会丢失需要重新携带参数,两个请求
*/
@RequestMapping("/handleRedirect")
public String handleRedirect(String name,RedirectAttributes
redirectAttributes) {
	//return "redirect:handle01?name=" + name; // 拼接参数安全性、参数⻓度都有
	局限
	// addFlashAttribute⽅法设置了⼀个flash类型属性，该属性会被暂存到session中，在
	跳转到⻚⾯之后该属性销毁
	redirectAttributes.addFlashAttribute("name",name);
	return "redirect:handle01";
 }
```









