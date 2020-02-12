---
title: Mybatis的多表查询
categories:
    - Mybatis
    
date: 2020-01-07
tags:
	- Java
	- Java框架
    - 数据库

---

### 场景(一对多)

用户和账户
一个用户可以有多个账户
一个账户只能属于一个用户（多个账户也可以属于同一个用户）

需要实现：
查询账户时，可以查询到归属的用户信息。


#### 准备工作

##### 建表
建立用户表和账户表：让用户表和账户表之间具备一对多的关系（需要在账户表中添加外键）
建表语句
```bash
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int(11) NOT NULL auto_increment,
  `username` varchar(32) NOT NULL COMMENT '用户名称',
  `birthday` datetime default NULL COMMENT '生日',
  `sex` char(1) default NULL COMMENT '性别',
  `address` varchar(256) default NULL COMMENT '地址',
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



insert  into `user`(`id`,`username`,`birthday`,`sex`,`address`) values (1,'张三','2018-02-27 17:47:08','男','北京'),(2,'李四','2018-03-02 15:09:37','女','深圳'),(3,'王五','2018-03-04 11:34:34','女','上海'),(4,'赵六','2018-03-04 12:04:06','男','成都'),(4,'刘七','2018-03-07 17:37:26','男','西安'),(48,'孙八','2018-03-08 11:44:00','女','杭州');





DROP TABLE IF EXISTS `account`;

CREATE TABLE `account` (
  `ID` int(11) NOT NULL COMMENT '编号',
  `UID` int(11) default NULL COMMENT '用户编号',
  `MONEY` double default NULL COMMENT '金额',
  PRIMARY KEY  (`ID`),
  KEY `FK_Reference_8` (`UID`),
  CONSTRAINT `FK_Reference_8` FOREIGN KEY (`UID`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



insert  into `account`(`ID`,`UID`,`MONEY`) values (1,1,1000),(2,3,1000),(3,5,2000);
```

##### 建实体类
用户实体类和账户实体类：让用户和账户的实体类能体现出一对多的关系
由于我们之前新建过用户的实体类，所以我们在这里只新建一个账户实体类即可，和用户实体类一样放在com.loonycoder.domain包下
此处在从表实体类中引用主表的对象。
```bash
package com.loonycoder.domain;

import java.io.Serializable;

public class Account implements Serializable {
    private Integer id;
    private Integer uid;
    private Double money;

    //从表实体应该包含一个主表实体的对象引用
    private User user;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUid() {
        return uid;
    }

    public void setUid(Integer uid) {
        this.uid = uid;
    }

    public Double getMoney() {
        return money;
    }

    public void setMoney(Double money) {
        this.money = money;
    }

    @Override
    public String toString() {
        return "Account{" +
                "id=" + id +
                ", uid=" + uid +
                ", money=" + money +
                '}';
    }
}

```



接下来我们新建一个Account的Mapper接口类，并提供查询所有账户的方法。
```bash
package com.loonycoder.dao;

import com.loonycoder.domain.Account;
import com.loonycoder.domain.AccountUser;

import java.util.List;

public interface IAccountMapper {


    /**
     * 查询所有账户
     * @return
     */
    List<Account> selectAll();

    /**
     * 查询所有账户，并且包含账户对应的用户下的姓名和地址信息
     * @return
     */
    List<AccountUser> selectAccountUser();
}


```

##### 配置文件
用户的配置文件和账户的配置文件
用户的配置文件用之前的就可以了，我们在此只新建账户的配置文件。
```bash
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.loonycoder.dao.IAccountMapper">

    <!--定义封装account和user的resultMap-->
    <resultMap id="accountUserMap" type="account">
        <id property="id" column="aid"></id>
        <result property="uid" column="uid"></result>
        <result property="money" column="money"></result>
        <!--一对一的关系映射，配置封装user的内容-->
        <association property="user" column="uid" javaType="user">
            <id property="id" column="id"></id>
            <result property="userName" column="username"></result>
            <result property="address" column="address"></result>
            <result property="sex" column="sex"></result>
            <result property="birthday" column="birthday"></result>
        </association>
    </resultMap>


    <select id="selectAll" resultMap="accountUserMap">
        select u.*,a.id as aid,a.uid,a.money from account a,user u where u.id = a.uid;
    </select>
</mapper>
```

当然我们还需要修改一下SqlMapConfig.xml中的别名和mapper映射配置
```bash
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<!--mybatis的主配置文件-->
<configuration>
    <!--引用外部配置文件配置数据源信息，下面的取值部分需要用${}方式取值-->
    <properties resource="jdbcConfig.properties">
    </properties>
    <!--配置别名 type属性指定实体类，alias指定别名-->
    <typeAliases >
        <!--package标签可以指定具体到某个包下所有类都使用别名，默认别名是类的名字，不区分大小写-->
        <package name="com.loonycoder.domain"></package>
        <!--<typeAlias type="com.loonycoder.domain.User" alias="user"></typeAlias>-->
    </typeAliases>
    <!--配置环境-->
    <environments default="mysql">
        <environment id="mysql">
            <!--配置事务-->
            <transactionManager type="JDBC"></transactionManager>
            <!--配置数据源（连接池）-->
            <dataSource type="POOLED">
                <property name="driver" value="${jdbc.driver}" />
                <property name="url" value="${jdbc.url}" />
                <property name="username" value="${jdbc.username}" />
                <property name="password" value="${jdbc.password}" />
            </dataSource>
        </environment>
    </environments>

    <!--配置映射文件（mapper类的映射文件）-->
    <mappers>
        <mapper resource="com/loonycoder/dao/IUserMapper.xml" />
        <mapper resource="com/loonycoder/dao/IAccountMapper.xml" />
        <!--<mapper class="com.loonycoder.dao.IUserMapper" />-->
    </mappers>
</configuration>
```

##### 新建测试类执行
```bash
    @Test
    public void selectAllAccount(){
        List<Account> accts = accountMapper.selectAll();
        for (Account acct : accts) {
            System.out.println("每个账户下的用户信息");
            System.out.println(acct);
            System.out.println(acct.getUser());
        }
    }
```

##### 执行结果
![result](/images/mybatis1.png)

---

### 场景(多对一)

需要实现：
- 查询用户时，可以同时查询出用户下的所有账户信息

##### 修改实体类
我们修改User实体类，让主表包含从表的集合引用
```bash
package com.loonycoder.domain;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

public class User implements Serializable {
    private Integer id;
    private String userName;
    private Date birthday;
    private String sex;
    private String address;

    private List<Account> accounts;

    public List<Account> getAccounts() {
        return accounts;
    }

    public void setAccounts(List<Account> accounts) {
        this.accounts = accounts;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Date getBirthday() {
        return birthday;
    }

    public void setBirthday(Date birthday) {
        this.birthday = birthday;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
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
                ", userName='" + userName + '\'' +
                ", birthday=" + birthday +
                ", sex='" + sex + '\'' +
                ", address='" + address + '\'' +
                '}';
    }
}

```

##### 修改配置文件

User接口类我们不做修改，直接用原来的查询所有用户的方法即可，我们只需要改动映射配置文件。
修改IUserMapper.xml内容如下：
```bash
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!--namespace里面要配置mapper接口的全限定类名-->
<mapper namespace="com.loonycoder.dao.IUserMapper">
    <!--配置列名和实体类属性对应关系 type属性不区分大小写-->
    <resultMap id="userMap" type="com.loonycoder.domain.User">
        <!--id标签配置主键，property标签配置实体类属性，column标签配置表的列名-->
        <id property="id" column="id"></id>
        <result property="userName" column="username"></result>
        <result property="birthday" column="birthday"></result>
        <result property="address" column="address"></result>
        <result property="sex" column="sex"></result>
    </resultMap>
    <!--定义User的resultMap-->
    <resultMap id="userAccountMap" type="user">
        <id property="id" column="id"></id>
        <result property="userName" column="username"></result>
        <result property="sex" column="sex"></result>
        <result property="address" column="address"></result>
        <result property="birthday" column="birthday"></result>
        <!--配置user对象中accounts集合的映射-->
        <!--ofType指的是集合的泛型-->
        <collection property="accounts" ofType="account">
            <id property="id" column="aid"></id>
            <result property="uid" column="uid"></result>
            <result property="money" column="money"></result>
        </collection>
    </resultMap>
    <!--id要保持和方法名一致-->
    <!--resultType指定返回值类型，如果是List类型 配置List的泛型即可-->
    <!--此处使用左外连接查询-->
    <select id="selectAll" resultMap="userAccountMap">
        select * from user u left outer join account a on u.id = a.uid;
    </select>

    <insert id="saveUser" parameterType="com.loonycoder.domain.User">
        insert into user (username,sex,birthday,address) values (#{userName},#{sex},#{birthday},#{address});
    </insert>

    <delete id="deleteUser" parameterType="java.lang.Integer">
        delete from user where id = #{uid};
    </delete>

    <update id="updateUser" parameterType="com.loonycoder.domain.User">
        update user set username = #{userName},sex = #{sex},birthday = #{birthday},address = #{address} where id = #{id};
    </update>
    
    <select id="selectUserByCondition" resultMap="userMap" parameterType="user">
          select * from user
          <where>
            <if test="sex != null and sex != '' ">
                and sex = #{sex}
            </if>
          </where>

    </select>
</mapper>
```

##### 新建测试类执行
```bash
    @Test
    public void selectTest() throws Exception{

        //5.使用代理对象执行方法
        List<User> users= userDao.selectAll();
        for (User user: users) {
            System.out.println("每个用户下账户的信息：");
            System.out.println(user);
            System.out.println(user.getAccounts());
        }

    }
```

##### 执行结果
![result](/images/mybatis2.png)

---

### 场景(多对多)
用户和角色
一个用户有多个角色
一个角色有多个用户
需要实现：
- 当我们查询用户时，可以同时得到用户的角色信息
- 当我们查询角色时，可以同时得到角色所属的用户信息

##### 新建角色表和中间表
建表语句：
```bash
DROP TABLE IF EXISTS `role`;

CREATE TABLE `role` (
  `ID` int(11) NOT NULL COMMENT '编号',
  `ROLE_NAME` varchar(30) default NULL COMMENT '角色名称',
  `ROLE_DESC` varchar(60) default NULL COMMENT '角色描述',
  PRIMARY KEY  (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



insert  into `role`(`ID`,`ROLE_NAME`,`ROLE_DESC`) values (1,'董事长','管理整个公司'),(2,'总裁','管理整个公司'),(3,'部门经理','管理某个部门');





DROP TABLE IF EXISTS `user_role`;

CREATE TABLE `user_role` (
  `UID` int(11) NOT NULL COMMENT '用户编号',
  `RID` int(11) NOT NULL COMMENT '角色编号',
  PRIMARY KEY  (`UID`,`RID`),
  KEY `FK_Reference_10` (`RID`),
  CONSTRAINT `FK_Reference_10` FOREIGN KEY (`RID`) REFERENCES `role` (`ID`),
  CONSTRAINT `FK_Reference_9` FOREIGN KEY (`UID`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert  into `user_role`(`UID`,`RID`) values (1,1),(3,1),(3,2);

```

##### 新建角色实体类
此处注意也要让用户和角色体现出多对多关系：需要各自包含对方的一个集合引用。

新建角色实体类：
```bash
package com.loonycoder.domain;

import java.io.Serializable;

public class Role implements Serializable {
    private Integer roleId;
    private String roleName;
    private String roleDesc;

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getRoleDesc() {
        return roleDesc;
    }

    public void setRoleDesc(String roleDesc) {
        this.roleDesc = roleDesc;
    }

    @Override
    public String toString() {
        return "Role{" +
                "roleId=" + roleId +
                ", roleName='" + roleName + '\'' +
                ", roleDesc='" + roleDesc + '\'' +
                '}';
    }
}

```

##### 新建实体类接口
新建RoleMapper接口类：
```bash
package com.loonycoder.dao;

import com.loonycoder.domain.Role;

import java.util.List;

public interface IRoleMapper {


    /**
     * 查询所有角色信息
     * @return
     */
    public List<Role> selectAll();
}

```

##### 新建角色实体配置文件
一、新建IRoleMapper.xml
```bash
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.loonycoder.dao.IRoleMapper">
    <!--定义role表的resultMap-->
    <resultMap id="roleMap" type="role">
        <id property="roleId" column="rid"></id>
        <result property="roleName" column="role_name"></result>
        <result property="roleDesc" column="role_desc"></result>
        <collection property="users" ofType="user">
            <id property="id" column="id"></id>
            <result property="userName" column="username"></result>
            <result property="address" column="address"></result>
            <result property="sex" column="sex"></result>
            <result property="birthday" column="birthday"></result>
        </collection>
    </resultMap>

    <!--查询所有角色信息-->
    <!--使用两次左外连接查询-->
    <select id="selectAll" resultMap="roleMap">
        select u.*,r.id as rid,r.role_name,r.role_desc from role r
        left outer join user_role ur on r.id = ur.rid
        left outer join user u on u.id = ur.uid
    </select>
</mapper>

```

二、在SqlMapConfig.xml中添加映射配置
```bash
<!--配置映射文件（mapper类的映射文件）-->
    <mappers>
        <mapper resource="com/loonycoder/dao/IUserMapper.xml" />
        <mapper resource="com/loonycoder/dao/IAccountMapper.xml" />
        <mapper resource="com/loonycoder/dao/IRoleMapper.xml" />
        <!--<mapper class="com.loonycoder.dao.IUserMapper" />-->
    </mappers>
```

##### 新建测试类执行

```bash
    @Test
    public void selectRoleAll(){
        List<Role> roles = roleMapper.selectAll();
        for (Role role:roles) {
            System.out.println("每个角色的用户信息：");
            System.out.println(role);
            System.out.println(role.getUsers());
        }
    }
```

##### 执行结果
![result](/images/mybatis3.png)

---

##### 根据用户查询角色

同理，我们修改用户实体类，添加多对多的关系映射：一个用户具备多个角色
```bash
package com.loonycoder.domain;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

public class User implements Serializable {
    private Integer id;
    private String userName;
    private Date birthday;
    private String sex;
    private String address;


//    多对多关系映射：一个用户具备多个角色
    private List<Role> roles;

    public List<Role> getRoles() {
        return roles;
    }

    public void setRoles(List<Role> roles) {
        this.roles = roles;
    }

    private List<Account> accounts;

    public List<Account> getAccounts() {
        return accounts;
    }

    public void setAccounts(List<Account> accounts) {
        this.accounts = accounts;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Date getBirthday() {
        return birthday;
    }

    public void setBirthday(Date birthday) {
        this.birthday = birthday;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
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
                ", userName='" + userName + '\'' +
                ", birthday=" + birthday +
                ", sex='" + sex + '\'' +
                ", address='" + address + '\'' +
                '}';
    }
}

```

其次，修改用户实体映射配置文件。
```bash
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!--namespace里面要配置mapper接口的全限定类名-->
<mapper namespace="com.loonycoder.dao.IUserMapper">
    <!--配置列名和实体类属性对应关系 type属性不区分大小写-->
    <resultMap id="userMap" type="com.loonycoder.domain.User">
        <!--id标签配置主键，property标签配置实体类属性，column标签配置表的列名-->
        <id property="id" column="id"></id>
        <result property="userName" column="username"></result>
        <result property="birthday" column="birthday"></result>
        <result property="address" column="address"></result>
        <result property="sex" column="sex"></result>
    </resultMap>
    <!--定义User的resultMap-->
    <resultMap id="userAccountMap" type="user">
        <id property="id" column="id"></id>
        <result property="userName" column="username"></result>
        <result property="sex" column="sex"></result>
        <result property="address" column="address"></result>
        <result property="birthday" column="birthday"></result>
        <!--配置user对象中accounts集合的映射-->
        <!--ofType指的是集合的泛型-->
        <collection property="accounts" ofType="account">
            <id property="id" column="aid"></id>
            <result property="uid" column="uid"></result>
            <result property="money" column="money"></result>
        </collection>
    </resultMap>
    
    <!--配置user的userRoleMap-->
    <resultMap id="userRoleMap" type="user">
        <id property="id" column="id"></id>
        <result property="userName" column="username"></result>
        <result property="sex" column="sex"></result>
        <result property="address" column="address"></result>
        <result property="birthday" column="birthday"></result>
        <collection property="roles" ofType="role">
            <id property="roleId" column="rid"></id>
            <result property="roleName" column="role_name"></result>
            <result property="roleDesc" column="role_desc"></result>
        </collection>
    </resultMap>
    <!--id要保持和方法名一致-->
    <!--resultType指定返回值类型，如果是List类型 配置List的泛型即可-->
    <!--此处使用左外连接查询-->
    <select id="selectAll" resultMap="userAccountMap">
        select * from user u left outer join account a on u.id = a.uid;
    </select>

    <select id="selectUserRoleAll" resultMap="userRoleMap">
        select u.*,r.id as rid,r.role_name,r.role_desc from user u
        left outer join user_role ur on u.id = ur.uid
        left outer join role r on r.id = ur.rid
    </select>

    <insert id="saveUser" parameterType="com.loonycoder.domain.User">
        insert into user (username,sex,birthday,address) values (#{userName},#{sex},#{birthday},#{address});
    </insert>

    <delete id="deleteUser" parameterType="java.lang.Integer">
        delete from user where id = #{uid};
    </delete>

    <update id="updateUser" parameterType="com.loonycoder.domain.User">
        update user set username = #{userName},sex = #{sex},birthday = #{birthday},address = #{address} where id = #{id};
    </update>
    
    <select id="selectUserByCondition" resultMap="userMap" parameterType="user">
          select * from user
          <where>
            <if test="sex != null and sex != '' ">
                and sex = #{sex}
            </if>
          </where>

    </select>
</mapper>
```

在UserMapper接口中添加查询方法：
```bash
/**
     * 查询用户及用户下所有的角色信息
     * @return
     */
    public List<User> selectUserRoleAll();
```

新建测试方法：
```bash
    @Test
    public void selectUserRoleAll(){
        List<User> users = userDao.selectUserRoleAll();
        for (User user:users) {
            System.out.println("每个用户的角色信息：");
            System.out.println(user);
            System.out.println(user.getRoles());
        }
    }
```

执行结果：
![result](/images/mybatis4.png)
