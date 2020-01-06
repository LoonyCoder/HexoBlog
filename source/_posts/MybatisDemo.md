---
title: Mybatis入门及搭建
categories:
    - Java
    - 数据库
date: 2020-01-03
tags:
	- Java
	- Java框架

---

很早之前看过Mybatis视频，但是无奈工作中没有用到，当自己练习搭建的时候发现问题很多，所以这次准备重新研究一下，一点点搭建Mybatis框架。

---

### 一、准备工作

因为Mybatis是持久层框架，所以在此之前我们要做一些准备工作，首先我们要在Mysql中建好表并插入数据。
此处的sql我就不提供了，我都是用navicat手动插入的。

如图：
![建表](/images/table.png)

### 二、新建项目

我们这里要新建一个maven项目。
![创建Maven项目](/images/1.png)

![创建Maven项目](/images/2.png)

![创建Maven项目](/images/3.png)

创建完成之后，我们打开pom.xml文件引入依赖。

```bash
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.loonycoder</groupId>
    <artifactId>MybatisDemo</artifactId>
    <version>1.0-SNAPSHOT</version>

    <packaging>jar</packaging>
    <dependencies>
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis</artifactId>
            <version>3.4.4</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.6</version>
        </dependency>
        <dependency>
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
            <version>1.2.17</version>
        </dependency>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
        </dependency>
    </dependencies>

</project>
```

---

### 三、创建表对象的映射实体类

因为mybatis是一个ORM（Object Relational Mapping）框架，所以我们要准备一个和表字段一一对应的实体类。

**注意**：
**表中的字段名和实体类中的字段名字一定要一致！**
**实体类一定要实现Serializable接口**

```bash
package com.loonycoder.domain;

import java.io.Serializable;
import java.util.Date;

public class User implements Serializable {
    private Integer id;
    private String username;
    private Date birthday;
    private String address;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Date getBirthday() {
        return birthday;
    }

    public void setBirthday(Date birthday) {
        this.birthday = birthday;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", birthday=" + birthday +
                ", address='" + address + '\'' +
                '}';
    }
}

```

--- 

### 四、新建dao接口

这里直接上代码，我在此新建了一个查询所有的方法，此处记住方法名和返回值类型，后续会用到。

```bash
package com.loonycoder.dao;

import com.loonycoder.domain.User;

import java.util.List;

public interface IUserDao {
    List<User> findAll();
}

```

---

### 五、创建mybatis的主配置文件

该配置文件需要放在/*resources*目录下，配置文件的名称在具有规范性的前提下是随意起的，我这里采用了默认的规范(我发现很多人都这么起)

SqlMapConfig.xml
```bash
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<!--mybatis的主配置文件-->
<configuration>
    <!--配置环境-->
    <environments default="mysql">
        <!--配置mysql的环境-->
        <environment id="mysql">
            <!--配置事务类型-->
            <transactionManager type="JDBC"></transactionManager>
            <!--配置数据源(连接池)-->
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.jdbc.Driver" />
                <property name="url" value="jdbc:mysql://localhost:3306/MybatisDemo/" />
                <property name="username" value="root" />
                <property name="password" value="20141016" />
            </dataSource>
        </environment>
    </environments>

    <!--指定映射配置文件位置，映射配置文件指的是每个dao独立的配置文件-->
    <mappers>
        <mapper resource="com/loonycoder/dao/IUserDao.xml" />
    </mappers>
</configuration>
```

配置数据源的时候，把url、username、password 修改成你自己的数据库链接、用户名和密码即可。

注意：
**下方的mapper部分的配置我接下来会讲，后续按照你自己配置的路径配置即可。**

---

### 六、配置mapper文件

前面虽然配置了mybatis主配置文件，但是我们在实际操作中如果存在多个对象的dao接口，主配置文件需要怎么准确找到该接口呢？
我们就需要为每个dao配置一个独立的配置文件
我习惯上把文件命名成 ***xxxMapper.xml***，这里命名成xxxDao.xml是为了方便理解。
文件存放目录为/resources目录下，与实体对象dao接口的包同级。
![xml文件配置](/images/mapperxml.png)

代码如下：

```bash
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!--namespace需要配置dao的全限定类名-->
<mapper namespace="com.loonycoder.dao.IUserDao">
    <!--配置查询所有-->
    <!--id一定要是方法的名称-->
    <select id="findAll" resultType="com.loonycoder.domain.User">
        select * from user;
    </select>
</mapper>
```

---

### 七、引入log4j

这个是可选操作，为了后期记录日志，我们可以采用log4j去实现。此处只是了解。
将log4j.properties文件放在/resources目录下即可。

```bash
# Set root category priority to INFO and its only appender to CONSOLE.
#log4j.rootCategory=INFO,CONSOLE             debug  info  warn  error  fatal
log4j.rootCategory=debug, CONSOLE, LOGFILE

# Set the enterprise logger category to FATAL and its only appender to CONSOLE.
log4j.logger.org.apache.axis.enterprise=FATAL, CONSOLE

# CONSOLE is set to be a ConsoleAppender using a PatternLayout.
log4j.appender.CONSOLE=org.apache.log4j.ConsoleAppender
log4j.appender.CONSOLE.layout=org.apache.log4j.PatternLayout
log4j.appender.CONSOLE.layout.ConversionPattern=%d{ISO8601} %-6r [%15.15t] %-5p %30.30c %x - %m\n

# LOGFILE is set to be a File appender using a PatternLayout.
log.appender.LOGFILE=org.apache.log4j.FileAppender
log.appender.LOGFILE.FILE=/usr/gmx/LearnWorkspace
log.appender.LOGFILE.Append=true
log.appender.LOGFILE.layout=org.apache.log4j.PatternLayout
log.appender.LOGFILE.layout.ConversionPattern=%d{ISO8601} %-6r [%15.15t] %-5p %30.30c %x - %m\n
```

---

### 八、测试案例

如此，我们的mybatis就搭建完成了，我们接下来测试一下。
在/test/java目录下新建一个test类
如图：
![test类](/images/test.png)

代码如下：
```bash
package com.loonycoder;


import com.loonycoder.dao.IUserDao;
import com.loonycoder.domain.User;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;


import java.io.InputStream;
import java.util.List;

public class MybatisTest {

    public static void main(String[] args) throws Exception{
        //1.读取配置文件
        InputStream inputStream = Resources.getResourceAsStream("SqlMapConfig.xml");
        //2.创建SqlSessionFactory工厂
        SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
        SqlSessionFactory sqlSessionFactory = sqlSessionFactoryBuilder.build(inputStream);
        //3.使用工厂创建SqlSession对象
        SqlSession session = sqlSessionFactory.openSession();
        //4.使用SqlSession创建dao接口的代理对象
        IUserDao userDao = session.getMapper(IUserDao.class);
        //5.使用代理对象执行方法
        List<User> users= userDao.findAll();
        for (User user: users) {
            System.out.println(user);
        }
        //6.释放资源
        session.close();
        inputStream.close();
    }
}
```

---

我们的第一个Mybatis入门案例就创建完了，但是这种方式还是十分复杂的，因为有太多的配置文件，后续我们会用更简便的注解的方式去实现它。