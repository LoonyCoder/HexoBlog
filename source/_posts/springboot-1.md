---
title: 初识Spring Boot——工程搭建
categories:
    - Spring Boot
    
date: 2019-03-06 19:42:38
tags:
  - Java框架
  - Spring Boot

---

### 写在前面

源码地址：[SpringBoot搭建](https://github.com/LoonyCoder/springboot)
欢迎star/fork，给作者一些孤立！

---

#### 初识Spring Boot

在之前我们一直使用Spring、SpringMVC、Mybatis进行开发，的确，Spring让我们认识到了项目开发原来可以这么方便。但是大量的配置文件却是令人头痛的，即使我们想写一个简单的请求映射并在浏览器上发送Get请求测试，那么需要：
1.在web.xml中配置DispatcherServlet; 
2.在application.xml中配置注解扫描、注解驱动。可以看到：虽然Spring是轻量级的，但是Spring的配置却是重量级的。并且搭建每个Spring项目我们都需要考虑依赖版本是否冲突的问题等。

So，SpringBoot将这一切都解决了。SpringBoot提供了一种固定的、约定优于配置风格的框架，让开发者能更快的创建基于Spring的应用程序和服务。

SpringBoot有如下特性：
- 更高效的创建基于Spring的应用服务
- 无需XML配置，可以修改默认值来满足特定的需求
- 提供了一些大型项目中常见的非功能性特性，如嵌入式服务器、安全
- Spring Boot并不是对Spring功能上的增强，而是提供了一种快速使用Spring的方式

#### SpringBoot项目搭建

**这里我选择使用IDEA来创建SpringBoot项目：**
> 1.选择Spring Initializr，并选择本地的JDK版本

![springboot](/images/springboot/springboot1.png)

> 2.Next，指定Group和Artifact名称，并选择本机JDK版本

![springboot](/images/springboot/springboot2.png)

> 3.选择项目所需依赖

![springboot](/images/springboot/springboot3.png)

**解释：**

- Spring Boot DevTools: SpringBoot提供的热部署插件，可以避免每次修改代码都要重新启动项目。。
- Lomback: 使用Lomback可以减少项目中很多重复代码的书写，比如getter/setter/toString等方法的书写（虽然这些可能我们都是用的快捷键生成的代码）。具体用法可以参考博文：lomback介绍
- Thymeleaf: 语法的支持
注意： 以上依赖非必选，如果仅仅想尝试一下Spring Boot-HelloWorld，只需要选择其中的web依赖即可。

#### SpringBoot起步

![springboot](/images/springboot/springboot4.png)

以上是新创建的Spring Boot项目。在SpringBoot中有一个启动器（引导类）的概念，我们首先看一下Application.java:

```bash
package com.loonycoder.spring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
```

如上，仅是一个简单的main方法，其中最核心的就是@SpringBootApplication注解，它是一下三个注解的总和：
- @Configuration: 用于定义一个配置类。
- @EnableAutoConfiguration: SpringBoot会自动根据你的jar包依赖来自动配置项目。
- @ComponentSacn: 告诉Spring哪个packages的用注解标识的类会被Spring自动扫描并且转入Bean容器。
通过以上三个注解你就应该了解到了SpringBoot的作用：自动化配置项目。之前我们要手动进行的XML配置在这里仅需要这一个注解就完成了。且SpringBoot项目不需要单独部署到Tomcat中才能启动，通过这个启动器，SpringBoot会自动构建一个web容器，并将项目部署到其中。

So,

> Run SpringBootApplication

![springboot](/images/springboot/springboot5.png)

发现报错，说DataSource数据源的url地址没有配置。之前我们提到了SpringBoot的特性就是自动化配置，它会根据你的依赖文件来配置项目，我们再看一下我们的pom.xml：

```bash
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.4.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.loonycoder</groupId>
    <artifactId>spring</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>spring</name>
    <description>Demo project for Spring Boot</description>

    <properties>
        <java.version>1.8</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>2.1.1</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

其中最上层的&lt;parent&gt;节点约束了整个下面所有spring-boot依赖的版本，即这里使用了SpringBoot-2.2.4。然后关注&lt;dependencies&gt;节点下的前四个依赖：

```bash
<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>2.1.1</version>
        </dependency>
```

Spring Boot应用启动器
- spring-boot-starter: Spring Boot的核心启动器，包含了自动配置、日志和YAML。
- spring-boot-starter-jdbc: 支持JDBC数据库。
- spring-boot-starter-thymeleaf: 支持Thymeleaf模板引擎，包括与Spring的集成。
- spring-boot-starter-web: 支持全栈式开发，包括Tomcat和Spring-WebMVC。
- mybatis-spring-boot-starter: 整合spring-mybatis依赖。
前面我们强调的一点是Spring Boot能实现自动化配置，那么项目的依赖就决定了Spring Boot将如何自动配置项目，Spring Boot的启动器就决定了项目会以什么样的配置启动项目；如此，我们会明白这个报错是为什么了。
因为我们配置配置JDBC连接的数据库，所以报错，注释掉spring-boot-starter-jdbc和mybatis-spring-boot-starter依赖，再次启动SpringBootApplication:

![springboot](/images/springboot/springboot6.png)

启动成功。

#### 测试

在src/main/java/com/loonycoder/springboot/下创建controller文件夹并创建LoginController.java类：

```bash
@RestController
public class LoginController {

    @RequestMapping("/login")
    public String login(@RequestParam("username") String username, @RequestParam("password") String password) {
        System.out.println("username:" + username + ", password:" + password);
        return null;
    }
}
```
如上就完成了在SSM阶段一个最基本的SpringMVC Controller映射方法的书写，那么测试一下：
在浏览器上访问：
> localhost:8080/login?username=loonycoder&password=1234

后端即可接收到username和password参数。
![springboot](/images/springboot/springboot7.png)

这时你会发现，SpringBoot内置的Web容器默认访问地址就是8080端口，如果想改变这个默认端口，修改src/main/resources/application.properties：
```bash
server.port=8088
```
重启SpringbootApplication，访问：localhost:8088/login?username=loonycoder&password=1234

#### 读取配置文件信息

在src/main/resources/application.properties中添加配置：

```bash
url=http://111.229.232.226
```
在LoginController.java中添加映射方法：
```bash
@RestController
public class LoginController {
    @Autowired
    private Environment environment;

    @RequestMapping("/blog")
    public String login(){
        return environment.getProperty("url");
    }
}
```

Spring提供的Environment类用户读取配置文件中参数，访问：localhost:8088/blog即可得到。

