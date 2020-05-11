---
title: Tomcat体系架构分析
categories:
    - Servlet容器
    
date: 2019-09-11 21:53:12
tags:
  - Servlet
  - Http服务器


---

![spring](/images/tomcat/tomcat_logo.jpg)

### 写在前面

**源码地址：**[手写mini版tomcat](https://github.com/LoonyCoder/learn-repository)
**欢迎star/fork，给作者一些鼓励！**

### 架构分析

虽然网上对于tomcat架构描述已经十分详细了，但在这里还是要先讲讲**架构**

#### 总体设计

![Tomcat顶层架构](/images/tomcat/tomcat01.png)

**先来看Connector和Container - 两个Tomcat的心脏：**

- <code>Connector</code>用于处理连接相关的事情，并提供Socket与Request和Response相关的转化;
- <code>Container</code>用于封装和管理Servlet，以及具体处理Request请求；

**Service - 面向外界的连接体**

- 主要结合<code>Connector</code>和<code>Container</code>，实现封装，向外提供功能
- 一个Service只能有一个<code>Container</code>，但可以有多个<code>Connector</code>

**Server**

- 掌控<code>Service</code>的生杀大权，管理整个Tomcat生命周期

#### 请求流程

请求进入Tomcat，经由Service交付到<code>Connector</code>，<code>Connector</code>将接收的请求封装为Request和Response，然后讲封装后的数据传递到<code>Container</code>处理，处理完成后返回<code>Connector</code>，通过Socket将结果返还给客户端。

![Tomcat连接示意图](/images/tomcat/tomcat02.png)

**Connector**

<code>Connector</code>最底层使用的是（TCP/IP）Socket来进行连接的，Request和Response是按照HTTP协议来封装的。
![Connector结构图](/images/tomcat/tomcat03.png)

1. 通过不同类型的<code>ProtocolHandler</code>，<code>Connector</code>可以处理类型的连接请求，比如Socket、nio等连接
2. 每个<code>ProtocolHandler</code>都包含了三个组件：<code>Endpoint</code>、<code>Processor</code>、<code>Adapter</code>
3. <code>Endpoint</code>实现TCP/IP协议，<code>Processor</code>实现HTTP协议的并将<code>Endpoint</code>接收到的Socket封装成Request，<code>Adapter</code>将Request适配大宋<code>Container</code>进行具体的处理
4. <code>在Endpoint</code>中，其抽象实现<code>AbstractEndpoint</code>里包含<code>Acceptor</code>（监听请求）和<code>AsyncTimeout</code>（检查异步Request的超时）两个内部类和<code>Handler</code>（处理接收到的Socket，并调用<code>Processor</code>进行处理）接口。

**Container**

管理Servlet，处理Request请求

![Container结构图](/images/tomcat/tomcat04.png)

1. Engine 可以管理多个主机，一个Service最多只能有一个Engine；
2. Host 是虚拟主机，通过配置Host就可以添加多台主机；
3. Context 就意味着一个WEB应用程序；
4. Wrapper 是Tomcat对Servlet的一层封装；

**Container处理请求的方式 - 管道流与阀门**

- 像普通的责任链设计模式一样，上一个处理者将处理过的请求移交到下一个继续处理。
- <code>Pipeline-Valve</code>与责任链模式存在一些差异：
	- 每一个Pipeline都有一个特定的Valve，这个Valve处于责任链的末端
	- 上面讲的四个容器都对应有自己特定的Valve：<code>StandardEngineValve、StandardHostValve、StandardContextValve、StandardWrapperValve</code>。
	- 在这个特定的Valve中会调用下层级的管道，比如：<code>EnginePipeline1 -> EnginePipeline2 -> StandardEngineValve(调用下级Pipeline) -> HostValve1 -> ... -> StandardHostValve -> ... -> StandardWrapperValve</code>
	- 当执行到最后一个Pipeline的特定Valve时，比如这里的<code>StandardWrapperValve</code>，会在<code>StandardWrapperValve</code>中创建FilterChain，其包含了配置的与请求相匹配的Filter和Servlet，并调用其<code>doFilter()</code>方法来处理请求，其<code>doFilter()</code>方法会依次调用所有的Filter的<code>doFilter()</code>方法和Servlet的<code>service()</code>方法，从而完成请求的处理，然后将结果返回给Connector，返还给客户端。











