---
title: SpringBoot整合Mybatis实现CRUD
categories:
    - Spring Boot
    
date: 2019-03-16 23:55:28
tags:
  - Java框架
  - Spring Boot

---

### 写在前面

**源码地址：**[SpringBoot整合Mybatis](https://github.com/LoonyCoder/Springboot-Mybatis)
**欢迎star/fork，给作者一些鼓励！**

继上篇文章：[初识Spring Boot——工程搭建](https://loonycoder.github.io/2019/03/06/springboot-1/)。这次我们整合SpringBoot-Mybatis实现简单的CRUD业务。
**项目源码**请看我的Github仓库：[教你优雅的入门Spring Boot框架](https://github.com/LoonyCoder/ssm)
**如果觉得不错就点击右上角star鼓励一下笔者吧(#^.^#)**

---

![springboot](/images/springboot/springboot_logo.png)

---

需求：
- 详解SpringBoot工程的构建、与SSM项目在工程搭建上的不同。
- 实现SpringBoot-Mybatis整合征服数据库。
- 解决页面跳转，详解与SSM阶段的不同。
- 实现分页查询，使用PaheHelper插件和ElementUI分页控件。
- 实现文件上传。
- 使用Spring AOP切面编程实现简易的实现登录拦截工程。

**教你优雅的入门Spring Boot框架**

技术栈

- 后端： SpringBoot + Mybatis
- 前端： Vue.js + ElementUI

测试环境

- IDEA + SpringBoot-2.0.5

项目设计

```bash
.
├── db  -- sql文件
├── mvnw 
├── mvnw.cmd
├── pom.xml  -- 项目依赖
└── src
    ├── main
    │   ├── java
    │   │   └── com
    │   │       └── loonyCoder
    │   │           ├── SpringbootApplication.java  -- Spring Boot启动类
    │   │           ├── controller  -- MVC-WEB层
    │   │           ├── entity  -- 实体类
    │   │           ├── interceptor  -- 自定义拦截器
    │   │           ├── mapper  -- mybatis-Mapper层接口
    │   │           └── service  -- service业务层
    │   └── resources  -- Spring Boot资源文件 
    │       ├── application.yml  -- Spring Boot核心配置文件
    │       ├── mapper  -- Mybatis Mapper层配置文件
    │       ├── static  -- 前端静态文件
    │       └── templates  -- Thymeleaf模板引擎识别的HTML页面目录
    └── test  -- 测试文件
```

#### 准备

开始实战Spring Boot项目，首先，你需要将Spring Boot工程搭建出来。
Spring Boot工程搭建请看我的博客：[初识Spring Boot——工程搭建](https://loonycoder.github.io/2019/03/06/springboot-1/)

#### Spring Boot应用启动器

Spring Boot提供了很多应用启动器，分别用来支持不同的功能，说白了就是pom.xml中的依赖配置，因为Spring Boot的自动化配置特性，我们并不需再考虑项目依赖版本问题，使用Spring Boot的应用启动器，它能自动帮我们将相关的依赖全部导入到项目中。
我们这里介绍几个常见的应用启动器：
- spring-boot-starter: Spring Boot的核心启动器，包含了自动配置、日志和YAML
- spring-boot-starter-aop: 支持AOP面向切面编程的功能，包括spring-aop和AspecJ
- spring-boot-starter-cache: 支持Spring的Cache抽象
- spring-boot-starter-artermis: 通过Apache Artemis支持JMS（Java Message Service）的API
- spring-boot-starter-data-jpa: 支持JPA
- spring-boot-starter-data-solr: 支持Apache Solr搜索平台，包括spring-data-solr
- spring-boot-starter-freemarker: 支持FreeMarker模板引擎
- spring-boot-starter-jdbc: 支持JDBC数据库
- spring-boot-starter-Redis: 支持Redis键值储存数据库，包括spring-redis
- spring-boot-starter-security: 支持spring-security
- spring-boot-starter-thymeleaf: 支持Thymeleaf模板引擎，包括与Spring的集成
- spring-boot-starter-web: 支持全栈式web开发，包括tomcat和Spring-WebMVC
- spring-boot-starter-log4j: 支持Log4J日志框架
- spring-boot-starter-logging: 引入Spring Boot默认的日志框架Logback

#### Spring Boot项目结构设计

Spring Boot项目（即Maven项目），当然拥有最基础的Maven项目结构。除此之外：

1. Spring Boot项目中不包含webapp(webroot)目录。
2. Spring Boot默认提供的静态资源目录需要置于classpath下，且其下的目录名称要符合一定规定。
3. Spring Boot默认不提倡用XML配置文件，主张使用YML作为配置文件格式，YML有更简洁的语法。当然也可以使用.properties作为配置文件格式。
4. Spring Boot官方推荐使用Thymeleaf作为前端模板引擎，并且Thymeleaf默认将templates作为静态页面的存放目录（由配置文件指定）。
5. Spring Boot默认将resources作为静态资源的存放目录，存放前端静态文件、项目配置文件。
6. Spring Boot规定resources下的子级目录名要符合一定规则，一般我们设置resources/static为前端静态（JS,CSS）的存放目录；设置resources/templates作为HTML页面的存放目录。
7. Spring Boot指定的Thymeleaf模板引擎文件目录/resources/templates是受保护的目录，想当与之前的WEB-INF文件夹，里面的静态资源不能直接访问，一般我们通过Controller映射访问。
8. 建议将Mybatis-Mapper的XML映射文件放于resources/目录下，我这里设为resources/mapper目录，且src/main/java/Mapper下的Mapper层接口要使用@Mapper注解标识，不然mybatis找不到接口对应的XML映射文件。
9. SpringBootApplication.java为项目的启动器类，项目不需要部署到Tomcat上，由SpringBoot提供的服务器部署项目（运行启动器类即可）；且SpringBoot会自动扫描该启动器同级和子级下用注解标识的Bean。
10. Spring Boot不建议使用JSP页面，如果想使用，请自行百度解决办法。
11. 上面说了Spring Boot提供的存放HTML静态页面的目录resources/templates是受保护的目录，访问其中的HTML页面要通过Controller映射，这就间接规定了你需要配置Spring的视图解析器，且Controller类不能使用@RestController标识。

#### 起步

首先： 我想特殊强调的是：**SpringBoot不是对Spring功能上的增强，而是提供了一种快速使用Spring的方式。**一定要切记这一点。
学习SpringBoot框架，只是为了更简便的使用Spring框架，我们在SSM阶段学习的知识现在放在Spring Boot框架上开发是完全适用的，我们学习的大多数是SpringBoot的自动化配置方式。
因为Spring Boot框架的一大优势就是自动化配置，从pom.xml的配置中就能明显感受到。

#### 项目依赖

```bash
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.loonycoder</groupId>
    <artifactId>springboot</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>springboot</name>
    <description>Demo project for Spring Boot</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.0.5.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
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
            <version>1.3.2</version>
        </dependency>

        <!-- spring-aop支持 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <!--<optional>true</optional>-->
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- alibaba的druid数据库连接池 -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid-spring-boot-starter</artifactId>
            <version>1.1.9</version>
        </dependency>
        <!-- 分页插件 -->
        <dependency>
            <groupId>com.github.pagehelper</groupId>
            <artifactId>pagehelper-spring-boot-starter</artifactId>
            <version>1.2.5</version>
        </dependency>

        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
            <version>3.4</version>
        </dependency>

        <!-- fastjson -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-core</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.datatype</groupId>
            <artifactId>jackson-datatype-joda</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.module</groupId>
            <artifactId>jackson-module-parameter-names</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <fork>true</fork>
                </configuration>
            </plugin>
        </plugins>
    </build>


</project>
```

#### 初始化数据库

建表语句及准备数据
```bash
-- CREATE DATABASE springboot DEFAULT CHARACTER SET utf8;

DROP TABLE IF EXISTS tb_user;
DROP TABLE IF EXISTS tb_goods;

-- 用户表
CREATE TABLE tb_user(
  id BIGINT AUTO_INCREMENT COMMENT '编号',
  username VARCHAR(100) COMMENT '用户名',
  password VARCHAR(100) COMMENT '密码',
  CONSTRAINT pk_sys_user PRIMARY KEY(id)
) CHARSET=utf8 ENGINE=InnoDB;

INSERT INTO tb_user VALUES(1, 'loonycoder', '123');
INSERT INTO tb_user VALUES(2, '望月', '123');

-- 商品表
CREATE TABLE tb_goods(
  id BIGINT AUTO_INCREMENT COMMENT '编号',
  title VARCHAR(1000) COMMENT '商品标题',
  price VARCHAR(100) COMMENT '商品价格',
  image VARCHAR(1000) COMMENT '商品图片',
  brand VARCHAR(100) COMMENT '商品品牌',
  CONSTRAINT pk_sys_user PRIMARY KEY(id)
) CHARSET=utf8 ENGINE=InnoDB;

#####################################

INSERT INTO `tb_goods` VALUES (974401, '苹果(Apple) iPhone 5s (A1533) 16GB 银色 电信3G手机', 4099.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3160/284/298314156/78089/fd106c0c/57b00f93Nc77f215f.jpg', '苹果');
INSERT INTO `tb_goods` VALUES (975641, '苹果(Apple) iPhone 5s (A1533) 16GB 金色 电信3G手机', 4099.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3160/284/298314156/78089/fd106c0c/57b00f93Nc77f215f.jpg','苹果');
INSERT INTO `tb_goods` VALUES (976898, '苹果 iPhone 4S 8G 白色 联通3G手机', 1999.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3712/359/495301542/119558/da44ceda/580cb3adN14e04e47.jpg', '苹果');
INSERT INTO `tb_goods` VALUES (1057740, '苹果(Apple) iPhone 5s (A1530) 16GB 深空灰色 移动联通4G手机', 4129.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3160/284/298314156/78089/fd106c0c/57b00f93Nc77f215f.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1057741, '苹果(Apple) iPhone 5s (A1530) 16GB 银色 移动联通4G手机', 4119.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3160/284/298314156/78089/fd106c0c/57b00f93Nc77f215f.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1057746, '苹果(Apple) iPhone 5s (A1530) 16GB 金色 移动联通4G手机', 4119.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3160/284/298314156/78089/fd106c0c/57b00f93Nc77f215f.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217493, '苹果（Apple）iPhone 6 (A1589) 16GB 金色 移动4G手机', 5088.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217494, '苹果（Apple）iPhone 6 (A1589) 16GB 深空灰色 移动4G手机', 4999.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217499, '苹果（Apple）iPhone 6 (A1586) 16GB 金色 移动联通电信4G手机', 5288.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217500, '苹果（Apple）iPhone 6 (A1586) 16GB 深空灰色 移动联通电信4G手机', 5288.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217501, '苹果（Apple）iPhone 6 (A1586) 16GB 银色 移动联通电信4G手机', 5288.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217508, '苹果（Apple）iPhone 6 (A1586) 64GB 金色 移动联通电信4G手机', 5988.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217509, '苹果（Apple）iPhone 6 (A1586) 64GB 深空灰色 移动联通电信4G手机', 5988.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217510, '苹果（Apple）iPhone 6 (A1586) 64GB 银色 移动联通电信4G手机', 5988.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217516, '苹果（Apple）iPhone 6 (A1586) 128GB 金色 移动联通电信4G手机', 6488.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217517, '苹果（Apple）iPhone 6 (A1586) 128GB 深空灰色 移动联通电信4G手机', 6488.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217518, '苹果（Apple）iPhone 6 (A1586) 128GB 银色 移动联通电信4G手机', 6488.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217524, '苹果（Apple）iPhone 6 Plus (A1524) 16GB 金色 移动联通电信4G手机', 6088.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217525, '苹果（Apple）iPhone 6 Plus (A1524) 16GB 深空灰色 移动联通电信4G手机', 5888.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217526, '苹果（Apple）iPhone 6 Plus (A1524) 16GB 银色 移动联通电信4G手机', 5988.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217533, '苹果（Apple）iPhone 6 Plus (A1524) 64GB 深空灰色 移动联通电信4G手机', 6788.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217534, '苹果（Apple）iPhone 6 Plus (A1524) 64GB 银色 移动联通电信4G手机', 6788.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217539, '苹果（Apple）iPhone 6 Plus (A1524) 128GB 金色 移动联通电信4G手机', 7388.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (1217540, '苹果（Apple）iPhone 6 Plus (A1524) 128GB 深空灰色 移动联通电信4G手机', 7388.00, 'http://img11.360buyimg.com/n1/s450x450_jfs/t3286/138/5179502023/67325/93373553/585b52b7N8d296f80.jpg','苹果');
INSERT INTO `tb_goods` VALUES (691300, '三星 B9120 钛灰色 联通3G手机 双卡双待双通', 4399.00, 'http://img10.360buyimg.com/n1/s450x450_jfs/t3457/294/236823024/102048/c97f5825/58072422Ndd7e66c4.jpg','三星');
INSERT INTO `tb_goods` VALUES (738388, '三星 Note II (N7100) 云石白 联通3G手机', 1699.00, 'http://img10.360buyimg.com/n1/s450x450_jfs/t3457/294/236823024/102048/c97f5825/58072422Ndd7e66c4.jpg','三星');
INSERT INTO `tb_goods` VALUES (741524, '三星 Note II (N7100) 钛金灰 联通3G手机', 1699.00, 'http://img10.360buyimg.com/n1/s450x450_jfs/t3457/294/236823024/102048/c97f5825/58072422Ndd7e66c4.jpg', '三星');
INSERT INTO `tb_goods` VALUES (816448, '三星 Note II (N7100) 钻石粉 联通3G手机', 1699.00, 'http://img10.360buyimg.com/n1/s450x450_jfs/t3457/294/236823024/102048/c97f5825/58072422Ndd7e66c4.jpg', '三星');
INSERT INTO `tb_goods` VALUES (1124089, '华为 Ascend P7 (P7-L00) 黑色 联通4G手机 双卡双待双通', 2388.00, 'http://img12.360buyimg.com/n1/s450x450_jfs/t3034/299/2060854617/119711/577e85cb/57d11b6cN1fd1194d.jpg', '华为');
INSERT INTO `tb_goods` VALUES (1124090, '华为 Ascend P7 (P7-L00) 白色 联通4G手机 双卡双待双通', 2388.00, 'http://img12.360buyimg.com/n1/s450x450_jfs/t3034/299/2060854617/119711/577e85cb/57d11b6cN1fd1194d.jpg','华为');
INSERT INTO `tb_goods` VALUES (1124331, '华为 Ascend P7 (P7-L05/L07) 黑色 移动4G手机', 2388.00, 'http://img12.360buyimg.com/n1/s450x450_jfs/t3034/299/2060854617/119711/577e85cb/57d11b6cN1fd1194d.jpg','华为');
INSERT INTO `tb_goods` VALUES (1124332, '华为 Ascend P7 (P7-L05/L07) 白色 移动4G手机', 2388.00, 'http://img12.360buyimg.com/n1/s450x450_jfs/t3034/299/2060854617/119711/577e85cb/57d11b6cN1fd1194d.jpg','华为');
INSERT INTO `tb_goods` VALUES (1124365, '华为 Ascend P7 (P7-L09) 白 电信4G手机 双卡双待双通', 2388.00, 'http://img12.360buyimg.com/n1/s450x450_jfs/t3034/299/2060854617/119711/577e85cb/57d11b6cN1fd1194d.jpg','华为');
INSERT INTO `tb_goods` VALUES (1124369, '华为 Ascend P7 (P7-L09) 黑 电信4G手机 双卡双待双通', 2388.00, 'http://img12.360buyimg.com/n1/s450x450_jfs/t3034/299/2060854617/119711/577e85cb/57d11b6cN1fd1194d.jpg','华为');
```

#### SpringBoot整合Mybatis

之前已经说过：**SpringBoot框架不是对Spring功能上的增强，而是提供了一种快速使用Spring的方式**
所以说，SpringBoot整合Mybatis的思想和Spring整合Mybatis的思想基本相同，不同之处有两点：
- 1.Mapper接口的XML配置文件变化。之前我们使用Mybatis接口代理开发，规定Mapper映射文件要和接口在一个目录下；而这里Mapper映射文件置于resources/mapper/下，且置于src/main/java/下的Mapper接口需要用@Mapper注解标识，不然映射文件与接口无法匹配。
- 2.SpringBoot建议使用YAML作为配置文件，它有更简便的配置方式。所以整合Mybatis在配置文件上有一定的区别，但最终都是那几个参数的配置。
关于YAML的语法请自行百度，我这里也仅仅是满足基本的配置需求，不涉及那种不易理解的语法。

##### 整合配置文件

在Spring阶段用XML配置mybatis无非就是配置：1.连接池；2.数据库url连接；3.mysql驱动；4.其他初始化配置

```bash
server:
  port: 8080

spring:
  datasource:
    name: springboot
    type: com.alibaba.druid.pool.DruidDataSource
    #druid相关配置
    druid:
      #监控统计拦截的filters
      filter: stat
      #mysql驱动
      driver-class-name: com.mysql.jdbc.Driver
      #基本属性
      url: jdbc:mysql://127.0.0.1:3306/springboot?useUnicode=true&characterEncoding=UTF-8&allowMultiQueries=true
      username: root
      password: root
      #配置初始化大小/最小/最大
      initial-size: 1
      min-idle: 1
      max-active: 20
      #获取连接等待超时时间
      max-wait: 60000
      #间隔多久进行一次检测，检测需要关闭的空闲连接
      time-between-eviction-runs-millis: 60000

  thymeleaf:
    prefix: classpath:/templates/
    check-template-location: true
    suffix: .html
    encoding: UTF-8
    mode: LEGACYHTML5
    cache: false

  #文件上传相关设置
  servlet:
    multipart:
      max-file-size: 10Mb
      max-request-size: 100Mb

  #devtools插件
  devtools:
    livereload:
      enabled: true #是否支持livereload
      port: 35729
    restart:
      enabled: true #是否支持热部署

  #spring-aop配置
  aop:
    #启用@Aspectj注解驱动的切面，允许Spring创建基于类的代理
    auto: true
    proxy-target-class: true


#mybatis配置
mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.loonycoder.entity

#mybaatis分页插件pagehelper设置
pagehelper:
  pagehelperDialect: mysql
  reasonable: true
  support-methods-arguments: true
  #params: count=countSql
```

**解释**

1. 我们实现的是spring-mybatis的整合，包含mybatis的配置以及datasource数据源的配置当然属于spring配置中的一部分，所以需要在spring:下。
2. mapper-locations相当于XML中的<code>&lt;property name="mapperLocations"&gt;</code>用来扫描Mapper层的配置文件，由于我们的配置文件在resources下，所以需要指定classpath:。
3. type-aliases-package相当与XML中<code>&lt;property name="typeAliasesPackase"&gt;</code>别名配置，一般取其下实体类类名作为别名。
4. datasource数据源的配置，name表示当前数据源的名称，类似于之前的<code>&lt;bean id="dataSource"&gt;</code>id属性，这里可以任意指定，因为我们无需关注Spring是怎么注入这个Bean对象的。
5. druid代表本项目中使用了阿里的druid连接池，driver-class-name:相当于XML中的<code>&lt;property name="driverClassName"&gt;</code>；url代表XML中的<code>&lt;property name="url"&gt;</code>；username代表XML中的<code>&lt;property name="username"&gt;</code>；password代表XML中的<code>&lt;property name="password"&gt;</code>；其他druid的私有属性配置不再解释。这里注意druid连接池和c3p0连接池在XML的的name中就不同，在此处SpringBoot的配置中当然名称也不同。

如果Spring整合Mybtis的配置你已经很熟悉了，那么这个配置你肯定也很眼熟，从英文名称上就很容易区分出来。这里需要注意的就是YAML语法规定不同行空格代表了不同的层级结构。
既然完成了SpringBoot-Mybatis基本配置下面我们实战讲解如何实现基本的CRUD。


#### 实现查询

> 1. 在src/main/java/com/loonycoder/entity/下新建User.java实体类
```bash
public class User implements Serializable {
    private Long id; //编号
    private String username; //用户名
    private String password; //密码
    //getter/setter
}
```

> 2. 在src/main/java/com/loonycoder/service/下创建BaseService.java通用接口，目的是简化service层接口基本CRUD方法的编写。
```bash
public interface BaseService<T> {

    // 查询所有
    List<T> findAll();

    //根据ID查询
    List<T> findById(Long id);

    //添加
    void create(T t);

    //删除（批量）
    void delete(Long... ids);

    //修改
    void update(T t);
}
```

以上就是我对Service层基本CRUD接口的简易封装，使用了泛型类，其继承接口指定了什么泛型，T就代表什么类。

> 3. 在src/main/java/com/loonycoder/service/下创建UserService.java接口：
```bash
public interface UserService extends BaseService<User> {}
```

> 4. 在src/main/java/com/loonycoder/service/impl/下创建UserServiceImpl.java实现类：
```bash
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Override
    public List<User> findAll() {
        return userMapper.findAll();
    }
    
    @Override
    List<T> findById(Long id){
    	return userMapper.findById(id);
    }

    @Override
    void create(T t){
    	userMapper.create(t);
    }

    @Override
    void delete(Long... ids){
    	userMapper.delete(ds);
    }

    @Override
    void update(T t){
    	userMapper.update(t);
    }
    
}
```

> 5. 在src/main/java/com/loonycoder/mapper/下创建UserMapper.javaMapper接口类：
```bash
@Mapper
public interface UserMapper {
    List<User> findAll();
    List<T> findById(Long id);
    void create(T t);
    void delete(Long... ids);
    void update(T t);
}
```

如上，我们一定要使用@Mapper接口标识这个接口，不然Mybatis找不到其对应的XML映射文件。

> 6. 在src/main/resources/mapper/下创建UserMapper.xml映射文件：
```bash
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="com.loonycoder.mapper.UserMapper">

    <!-- 查询所有 -->
    <select id="findAll" resultType="com.loonycoder.entity.User">
        SELECT * FROM tb_user
    </select>
</mapper>
```

> 7. 在src/main/java/com/loonycoder/controller/admin/下创建UserController.java
```bash
@RestController
public class UserController {
    @Autowired
    private UserService userService;
    
    @RequestMapping("/findAll")
    public List<User> findAll() {
        return userService.findAll();
    }
}
```

> 8. src/main/java/com/loonycoder/Application.java的main方法，启动springboot

在浏览器上访问localhost:8080/findAll即可得到一串JSON数据。

##### 思考

看了上面一步步的讲解。你应该明白了，其实和SSM阶段的CRUD基本相同，这里我就不再举例其他方法。
下面我们讲解一下不同的地方：

#### 实现页面跳转

因为Thymeleaf指定的目录src/main/resources/templates/是受保护的目录，其下的资源不能直接通过浏览器访问，可以使用Controller映射的方式访问，怎么映射呢？

> 1. 在application.yml中添加配置
```bash
spring:
  thymeleaf:
    prefix: classpath:/templates/
    check-template-location: true
    suffix: .html
    encoding: UTF-8
    mode: LEGACYHTML5
    cache: false
```

指定Thymeleaf模板引擎扫描resources下的templates文件夹中已.html结尾的文件。这样就实现了MVC中关于视图解析器的配置：

```bash
<!-- 配置视图解析器 -->
<bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
    <property name="prefix" value="/"/>
    <property name="suffix" value=".jsp"/>
</bean>
```

是不是感觉方便很多呢？但这里需要注意的是：classpath:后的目录地址一定要先加/，比如目前的classpath:/templates/。

> 2. 在Controller添加映射方法
```bash
@GetMapping(value = {"/", "/index"})
public String index() {
    return "home/index";
}
```

这样，访问localhost:8080/index将直接跳转到resources/templates/home/index.html页面。

##### 实现分页查询

首先我们需要在application.yml中配置pageHelper插件
```bash
pagehelper:
  pagehelperDialect: mysql
  reasonable: true
  support-methods-arguments: true
```

我这里使用了Mybatis的PageHelper分页插件，前端使用了ElementUI自带的分页插件。

**核心配置：**

UserServiceImp.java
```bash
public PageBean findByPage(Goods goods, int pageCode, int pageSize) {
    //使用Mybatis分页插件
    PageHelper.startPage(pageCode, pageSize);

    //调用分页查询方法，其实就是查询所有数据，mybatis自动帮我们进行分页计算
    Page<Goods> page = goodsMapper.findByPage(goods);

    return new PageBean(page.getTotal(), page.getResult());
}
```

#### 实现文件上传

这里涉及的无非就是SpringMVC的文件上传，本项目中前端使用了ElementUI+Vue.JS技术。
除了代码的编写，这里还要在application.yml中进行配置：
```bash
spring:
  servlet:
    multipart:
      max-file-size: 10Mb
      max-request-size: 100Mb
```

这就相当于SpringMVC的XML配置：
```bash
<bean id="multipartResolver" class="org.springframework.web.multipart.commons.CommonsMultipartResolver">
        <property name="maxUploadSize" value="500000"/>
</bean>
```

#### 使用Spring AOP切面编程实现简单的登录拦截器

本项目，我们先不整合Shiro和Spring Security这些安全框架，使用Spring AOP切面编程思想实现简单的登录拦截：

```bash
@Component
@Aspect
public class MyInterceptor {

    @Pointcut("within (com.loonycoder.controller..*) && !within(com.loonycoder.admin.LoginController)")
    public void pointCut() {
    }
    @Around("pointCut()")
    public Object trackInfo(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes.getRequest();
        User user = (User) request.getSession().getAttribute("user");
        if (user == null) {
            attributes.getResponse().sendRedirect("/login"); //手动转发到/login映射路径
        }
        return joinPoint.proceed();
    }
}
```

**解释：**
1. 关于Spring AOP的切面编程请自行百度，或者你也可以看我的博客：Spring AOP思想。我们需要注意以下几点
一定要熟悉AspectJ的切点表达式，在这里：..*表示其目录下的所有方法和子目录方法。
2. 如果进行了登录拦截，即在session中没有获取到用户的登录信息，我们可能需要手动转发到login页面，这里访问的是login映射。
3. 基于2，一定要指定Object返回值，若AOP拦截的Controller return了一个视图地址，那么本来Controller应该跳转到这个视图地址的，但是被AOP拦截了，那么原来Controller仍会执行return，但是视图地址却找不到404了。
4. 切记一定要调用proceed()方法，proceed()：执行被通知的方法，如不调用将会阻止被通知的方法的调用，也就导致Controller中的return会404。

#### Preview

![springboot](/images/sbm/sbm1.png)

![springboot](/images/sbm/sbm2.png)

![springboot](/images/sbm/sbm3.png)