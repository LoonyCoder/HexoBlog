---
title: Mybatis的增删改查操作
categories:
    - Mybatis
    
date: 2020-01-06
tags:
	- Java
	- Java框架
    - 数据库

---

### 准备工作

基于我们之前创建的Mybatis项目即可，我在此采用的依旧是基于xml的开发方式。

---

### Mybatis的查询操作

#### 在mapper接口中新增查询方法
```bash
package com.loonycoder.dao;

import com.loonycoder.domain.User;

import java.util.List;

public interface IUserMapper {

    /**
     * 查询用户
     * @return
     */
    public List<User> selectAll();
    
    
}

```

#### 在IUserMapper.xml中添加查询sql语句

```bash
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!--namespace里面要配置mapper接口的全限定类名-->
<mapper namespace="com.loonycoder.dao.IUserMapper">
    <!--id要保持和方法名一致-->
    <!--resultType指定返回值类型，如果是List类型 配置List的泛型即可-->
    <select id="selectAll" resultType="com.loonycoder.domain.User">
        select * from user;
    </select>
</mapper>
```

#### 新建测试类执行

由于读取配置文件、创建SqlSessionFactory工厂等步骤复用性较高，我们在这里进行了抽取。
```bash
package com.loonycoder;


import com.loonycoder.dao.IUserMapper;
import com.loonycoder.domain.User;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;


import java.io.InputStream;
import java.util.Date;
import java.util.List;

public class MybatisTest {

    private InputStream inputStream;
    private SqlSessionFactory sqlSessionFactory;
    private SqlSession session;
    private IUserMapper userDao;

    //before注解代表在测试方法执行前执行
    @Before
    public void init() throws Exception{
        //1.读取配置文件
        inputStream = Resources.getResourceAsStream("SqlMapConfig.xml");
        //2.创建SqlSessionFactory工厂
        SqlSessionFactoryBuilder sqlSessionFactoryBuilder = new SqlSessionFactoryBuilder();
        sqlSessionFactory = sqlSessionFactoryBuilder.build(inputStream);
        //3.使用工厂创建SqlSession对象
        session = sqlSessionFactory.openSession();
        //4.使用SqlSession创建dao接口的代理对象
        userDao = session.getMapper(IUserMapper.class);
    }


    //after注解代表在测试方法执行后执行
    @After
    public void destroy() throws Exception{
        //6.释放资源
        session.close();
        inputStream.close();
    }


    @Test
    public void selectTest() throws Exception{

        //5.使用代理对象执行方法
        List<User> users= userDao.selectAll();
        for (User user: users) {
            System.out.println(user);
        }

    }

}

```

#### 执行结果
![执行结果](/images/execResult1.png)

---

### Mybatis的保存操作

#### 在mapper接口中新增保存方法
```bash
    /**
     * 保存用户
     * @param user
     */
    public void saveUser(User user);
```

#### 在IUserMapper.xml中添加保存sql语句
```bash
<insert id="saveUser" parameterType="com.loonycoder.domain.User">
        insert into user (username,sex,birthday,address) values (#{userName},#{sex},#{birthday},#{address});
    </insert>
```

**注意：
#{}为mybatis的固定用法，用于取值。如果User实体类中的属性是自动生成的get/set，则直接写属性名称即可。
其次，参数一定要一一对应上**

#### 新建测试类执行
```bash
    @Test
    public void insertTest(){
        User user = new User();
        user.setUserName("Lisa");
        user.setBirthday(new Date());
        user.setAddress("广东");
        user.setSex("女");
        userDao.saveUser(user);
        session.commit();//记得手动提交事务
    }
```

**注意：一定要手动提交事务，否则虽然不会报错，但是不会入表！！！**

#### 执行结果
![执行结果](/images/execResult2.png)

---

### Mybatis的删除操作

#### 在mapper接口中新增删除方法
```bash
 /**
     * 删除用户
     * @param userId
     */
    public void deleteUser(Integer userId);
```

#### 在IUserMapper.xml中添加删除sql语句
```bash
<delete id="deleteUser" parameterType="java.lang.Integer">
        delete from user where id = #{uid};
    </delete>
```

**注意：因为该方法只有一个参数，所以我们在sql中标注的uid部分其实是可以随便写的，因为mybatis只会找到这一个参数**

#### 新建测试类执行
```bash
 @Test
    public void deleteTest(){
        userDao.deleteUser(53);
        session.commit();//记得手动提交事务
    }
```

#### 执行结果
删除前：
![执行结果](/images/execBefore.png)
删除后：
![执行结果](/images/execAfter.png)

---

### Mybatis的修改操作

#### 在mapper接口中新增修改方法
```bash
    /**
     * 修改用户
     * @param user
     */
    public void updateUser(User user);
```

#### 在IUserMapper.xml中添加修改sql语句
```bash
    <update id="updateUser" parameterType="com.loonycoder.domain.User">
        update user set username = #{username},sex = #{sex},birthday = #{birthday},address = #{address} where id = #{id};
    </update>
```

#### 新建测试类执行
```bash
    @Test
    public void updateTest(){
        User user = new User();
        user.setId(41);
        user.setUserName("张三丰");
        session.commit();//记得手动提交事务
    }
```

#### 执行结果
修改前：
![执行结果](/images/execAfter.png)
修改后：
![执行结果](/images/execAfter1.png)



