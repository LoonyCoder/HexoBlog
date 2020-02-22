---
title: Shiro会话管理
categories:
    - Java框架
date: 2018-09-23 09:11:16
tags:
	- 框架
	- 权限框架	
---

### Shiro在线会话管理

参考文章：
- [跟我学Shrio-在线会话](https://www.iteye.com/blog/jinnianshilongnian-2047643)
- [Spring Boot Shiro在线会话管理](https://mrbird.cc/Spring-Boot-Shiro%20session.html)

实现效果预览：
![实现效果预览](/images/shiro1.png)

Shiro提供一个对象org.apache.shiro.session.mgt.eis.SessionDAO，通过此对象可以获取到Shiro的Session中有效的Session对象，通过此对象，我们可以获取到用户登录的数据，比如：用户名、密码、ID、SessionID、登录时间、最后访问时间、IP地址等等。

![目录](/images/shiro2.png)

下面我们实现两个功能：
- 获取在线会话列表
- 实现强制下线功能

#### 准备

##### ShiroConfig
这里我使用的是Redis来储存Shiro的Session信息，修改SessionDAO配置：
```bash
@Bean
public RedisSessionDAO redisSessionDAO() {
    RedisSessionDAO redisSessionDAO = new RedisSessionDAO();
    redisSessionDAO.setRedisManager(redisManager());
    return redisSessionDAO;
}

@ConfigurationProperties(prefix = "redis.shiro")
public RedisManager redisManager() {
    return new RedisManager();
}
```

还需要将SessionDAO注入到SessionManager中：
```bash
@Bean
public SessionManager sessionManager() {
    DefaultWebSessionManager defaultWebSessionManager = new DefaultWebSessionManager();
    defaultWebSessionManager.setCacheManager(cacheManager());
    defaultWebSessionManager.setSessionDAO(sessionDAO());
    return sessionManager;
}
```

最后将SessionManager注入到SecurityManager中：
```bash
@Bean
public SecurityManager securityManager() {
    DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
    securityManager.setRealm(realm());

    //自定义sessionManager
    securityManager.setSessionManager(sessionManager());
    //自定义缓存实现
    securityManager.setCacheManager(cacheManager());

    return securityManager;
}
```

#### 获取在线会话列表

##### OnlineUser.java
```bash
@Data
public class OnlineUser implements Serializable {

    private String id; //sessionId

    private String uid; //用户ID

    private String username; //用户名

    private String host; //主机地址

    private String address; //地理位置

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date startTime; //用户开始访问时间

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date endTime; //用户最后访问时间

    private Long timeout; //超时时间

    private String status; //状态

    public void setHost(String host) {
        this.host = host.equals("0:0:0:0:0:0:0:1") ? "127.0.0.1" : host;
    }
}
```

##### Service
编写获取在线会话列表的service层实现：
```bash
@Override
public List<OnlineUser> list() {
    List<OnlineUser> list = new ArrayList<>();
    Collection<Session> sessions = sessionDAO.getActiveSessions(); //获取在线会话的集合
    for (Session session : sessions) {
        if (session != null) {
            OnlineUser onlineUser = new OnlineUser();
            SimplePrincipalCollection principalCollection;
            User user;
            //判断此session是否还在登录状态
            if (session.getAttribute(DefaultSubjectContext.PRINCIPALS_SESSION_KEY) == null) {
                continue;
            } else {
                //如果此session正在登录，将此session的数据放入principalCollection集合中，从而可获取登录用户对象数据
                principalCollection = (SimplePrincipalCollection) session.getAttribute(DefaultSubjectContext.PRINCIPALS_SESSION_KEY);
                user = (User) principalCollection.getPrimaryPrincipal();
                onlineUser.setUid(user.getId().toString());
                onlineUser.setUsername(user.getUsername());
            }
            onlineUser.setId(session.getId().toString());
            onlineUser.setHost(session.getHost());
            onlineUser.setAddress(AddressUtil.getAddress(session.getHost()));
            onlineUser.setStartTime(session.getStartTimestamp());
            onlineUser.setEndTime(session.getLastAccessTime());
            long timeout = session.getTimeout();
            onlineUser.setTimeout(timeout);
            onlineUser.setStatus(timeout == 0L ? "0" : "1"); //0在线 1下线
            list.add(onlineUser);
        }
    }
    return list;
}
```

getActiveSessions()将获取到所有有效的Session集合，通过DefaultSubjectContext.PRINCIPALS_SESSION_KEY可以判断当前系统Subject中的session key和sessions列表中的session是否匹配，不匹配则session无效。
session.getHost()顾名思义就是获取Host主机地址即IP地址。
AddressUtil.getAddress(session.getHost())是通过IP地址查询其详细的地理位置，使用了ip2region开源库。

##### 根据IP查询地址位置

开源地址：https://github.com/lionsoul2014/ip2region
引入ip2region的依赖：
```bash
<dependency>
    <groupId>org.lionsoul</groupId>
    <artifactId>ip2region</artifactId>
    <version>1.7.2</version>
</dependency>
```
拷贝ip2region.db文件（开源仓库中找）到项目的resources/config/下
参考官方实例代码写工具类AddressUtil.java
官方实例：https://github.com/lionsoul2014/ip2region/blob/master/binding/java/src/main/java/org/lionsoul/ip2region/test/TestSearcher.java

```bash
public class AddressUtil {

    public static String getAddress(String ip) {
        //db
        String dbPath = AddressUtil.class.getResource("/config/ip2region.db").getPath();

        File file = new File(dbPath);

        if (!file.exists()) {
            throw new GlobalException("缺少 ip2region.db库");
        }

        int algorithm = DbSearcher.BTREE_ALGORITHM; //B-tree

        try {
            DbConfig config = new DbConfig();
            DbSearcher searcher = new DbSearcher(config, file.getPath());
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

            //define the method
            Method method = null;
            switch (algorithm) {
                case DbSearcher.BTREE_ALGORITHM:
                    method = searcher.getClass().getMethod("btreeSearch", String.class);
                    break;
                case DbSearcher.BINARY_ALGORITHM:
                    method = searcher.getClass().getMethod("binarySearch", String.class);
                    break;
                case DbSearcher.MEMORY_ALGORITYM:
                    method = searcher.getClass().getMethod("memorySearch", String.class);
                    break;
            }

            DataBlock dataBlock = null;
            if (!Util.isIpAddress(ip)) {
                System.out.println("Error: Invalid ip address");
            }
            dataBlock = (DataBlock) method.invoke(searcher, ip);
            reader.close();
            searcher.close();
            return dataBlock.getRegion();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }
}
```

##### 结
当前端请求/online/list接口时，将List<OnlineUser>结合数据返回给前端渲染即可。

#### 实现强制下线功能

##### controller
```bash
@GetMapping("/forceLogout")
public ResponseCode forceLogout(String id) {
    try {
        sessionService.forceLogout(id);
        return ResponseCode.SUCCESS();
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseCode.ERROR();
    }
}
```

注意这个id是sessionID

##### service实现
```bash
@Override
public void forceLogout(String id) {
    Session session = sessionDAO.readSession(id);
    session.setTimeout(0L);
    session.stop();
    sessionDAO.delete(session);
}
```


