---
title: 轻量级控制反转和面向切面的容器框架——Spring（二）
categories:
    - Java框架
    
date: 2019-07-16 20:11:34
tags:
  - Spring全家桶
  - IoC
  - AOP

---

![spring](/images/spring_logo.jpg)

### 写在前面

之前整理过一些关于Spring框架零散的知识点，一直没时间整理，恰好最近又拜读了**应癫**老师的课程，所以赶紧梳理一下关于Spring的相关知识。

---

### 手写实现IoC和AOP

#### 银行转账案例界面

![spring](/images/spring/s11.png)

#### 银行转账案例表结构

![spring](/images/spring/s12.png)

#### 银行转账案例代码调用关系

![spring](/images/spring/s13.png)

#### 银行转账案例关键代码

- TransferServlet

```bash
import com.loonycoder.service.impl.TransferServiceImpl;
import com.loonycoder.utils.JsonUtils;
import com.loonycoder.pojo.Result;
import com.loonycoder.service.TransferService;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name="transferServlet",urlPatterns = "/transferServlet")
public class TransferServlet extends HttpServlet {
	// 1. 实例化service层对象
	private TransferService transferService = new TransferServiceImpl();
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		doPost(req,resp);
	}
	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
	// 设置请求体的字符编码
		req.setCharacterEncoding("UTF-8");
		String fromCardNo = req.getParameter("fromCardNo");
		String toCardNo = req.getParameter("toCardNo");
		String moneyStr = req.getParameter("money");
		int money = Integer.parseInt(moneyStr);
		Result result = new Result();
		try {
			// 2. 调⽤service层⽅法
			transferService.transfer(fromCardNo,toCardNo,money);
			result.setStatus("200");
	 	} catch (Exception e) {
			e.printStackTrace();
			result.setStatus("201");
			result.setMessage(e.toString());
		 }
		// 响应
		resp.setContentType("application/json;charset=utf-8");
		resp.getWriter().print(JsonUtils.object2Json(result));
	}
}
```

- TransferService接⼝及实现类

```bash
public interface TransferService {
	void transfer(String fromCardNo,String toCardNo,int money) throws Exception; 
}
```
```bash
package com.loonycoder.service.impl;
import com.loonycoder.dao.AccountDao;
import com.loonycoder.dao.impl.JdbcAccountDaoImpl;
import com.loonycoder.pojo.Account;
import com.loonycoder.service.TransferService;
public class TransferServiceImpl implements TransferService {
private AccountDao accountDao = new JdbcAccountDaoImpl();
@Override
public void transfer(String fromCardNo, String toCardNo, int money)
throws Exception {
Account from = accountDao.queryAccountByCardNo(fromCardNo);
Account to = accountDao.queryAccountByCardNo(toCardNo);
from.setMoney(from.getMoney()-money);
to.setMoney(to.getMoney()+money);
accountDao.updateAccountByCardNo(from);
accountDao.updateAccountByCardNo(to);
 }
}
```

- AccountDao层接⼝及基于Jdbc的实现类

```bash
package com.loonycoder.dao;
import com.loonycoder.pojo.Account;

public interface AccountDao {
	Account queryAccountByCardNo(String cardNo) throws Exception;
	int updateAccountByCardNo(Account account) throws Exception;
}
```

- JdbcAccountDaoImpl（Jdbc技术实现Dao层接⼝）

```bash
package com.loonycoder.dao.impl;
import com.loonycoder.pojo.Account;
import com.loonycoder.dao.AccountDao;
import com.loonycoder.utils.DruidUtils;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class JdbcAccountDaoImpl implements AccountDao {
	@Override
	public Account queryAccountByCardNo(String cardNo) throws Exception {
		//从连接池获取连接
		Connection con = DruidUtils.getInstance().getConnection();
		String sql = "select * from account where cardNo=?";
		PreparedStatement preparedStatement = con.prepareStatement(sql);
		preparedStatement.setString(1,cardNo);
		ResultSet resultSet = preparedStatement.executeQuery();
		Account account = new Account();
		while(resultSet.next()) {
			account.setCardNo(resultSet.getString("cardNo"));
			account.setName(resultSet.getString("name"));
			account.setMoney(resultSet.getInt("money"));
		}
		resultSet.close();
		preparedStatement.close();
		con.close();
		return account;
 	}

 	@Override
	public int updateAccountByCardNo(Account account) throws Exception {
		//从连接池获取连接
		Connection con = DruidUtils.getInstance().getConnection();
		String sql = "update account set money=? where cardNo=?";
		PreparedStatement preparedStatement = con.prepareStatement(sql);
		preparedStatement.setInt(1,account.getMoney());
		preparedStatement.setString(2,account.getCardNo());
		int i = preparedStatement.executeUpdate();
		preparedStatement.close();
		con.close();
		return i;
	}
}
```

#### 银行转账案例代码问题分析

![spring](/images/spring/s14.png)

- 问题⼀：在上述案例实现中，service 层实现类在使⽤ dao 层对象时，直接在
TransferServiceImpl 中通过 <code>AccountDao accountDao = new JdbcAccountDaoImpl() </code>获得了dao层对象，然⽽⼀个 new 关键字却将 TransferServiceImpl 和 dao 层具体的⼀个实现类JdbcAccountDaoImpl 耦合在了⼀起，如果说技术架构发⽣⼀些变动，dao 层的实现要使⽤其它技术，⽐如 Mybatis，思考切换起来的成本？每⼀个 new 的地⽅都需要修改源代码，重新编译，⾯向接⼝开发的意义将⼤打折扣？

- 问题⼆：service 层代码没有竟然还没有进⾏事务控制？如果转账过程中出现异常，将可能导致数据库数据错乱，后果可能会很严重，尤其在⾦融业务。

#### 问题解决思路

- 针对问题⼀思考：
	- 实例化对象的⽅式除了 new 之外，还有什么技术？反射 (需要把类的全限定类名配置在xml中)
- 考虑使⽤设计模式中的⼯⼚模式解耦合，另外项⽬中往往有很多对象需要实例化，那就在⼯⼚中使⽤反射技术实例化对象，⼯⼚模式很合适。

![spring](/images/spring/s15.png)

- 更进⼀步，代码中能否只声明所需实例的接⼝类型，不出现 new 也不出现⼯⼚类的字眼，如下
图？ 能！声明⼀个变量并提供 set ⽅法，在反射的时候将所需要的对象注⼊进去。

![spring](/images/spring/s16.png)

- 针对问题⼆思考：
	- service 层没有添加事务控制，怎么办？没有事务就添加上事务控制，⼿动控制 JDBC 的Connection 事务，但要注意将Connection和当前线程绑定（即保证⼀个线程只有⼀个Connection，这样操作才针对的是同⼀个 Connection，进⽽控制的是同⼀个事务）

![spring](/images/spring/s17.png)

#### 案例代码改造

1. 针对问题⼀的代码改造

- beans.xml

```bash
<?xml version="1.0" encoding="UTF-8" ?>
<beans> <bean id="transferService" class="com.loonycoder.service.impl.TransferServiceImpl"> 
	<property name="AccountDao" ref="accountDao"></property>
</bean> 
<bean id="accountDao" class="com.loonycoder.dao.impl.JdbcAccountDaoImpl"></bean>
</beans>
```

- 增加 BeanFactory.java

```bash
package com.loonycoder.factory;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
public class BeanFactory {
	/**
	* ⼯⼚类的两个任务
	* 任务⼀：加载解析xml，读取xml中的bean信息，通过反射技术实例化bean对象，然后放⼊
	map待⽤
	* 任务⼆：提供接⼝⽅法根据id从map中获取bean（静态⽅法）
	*/
	private static Map<String,Object> map = new HashMap<>();
	static {
		InputStream resourceAsStream = BeanFactory.class.getClassLoader().getResourceAsStream("beans.xml");
		SAXReader saxReader = new SAXReader();
		try {
			Document document = saxReader.read(resourceAsStream);
			Element rootElement = document.getRootElement();
			List<Element> list = rootElement.selectNodes("//bean");
			// 实例化bean对象
			for (int i = 0; i < list.size(); i++) {
				Element element = list.get(i);
				String id = element.attributeValue("id");
				String clazz = element.attributeValue("class");
				Class<?> aClass = Class.forName(clazz);
				Object o = aClass.newInstance();
				map.put(id,o);
		 	}
			// 维护bean之间的依赖关系
			List<Element> propertyNodes =
			rootElement.selectNodes("//property");
			for (int i = 0; i < propertyNodes.size(); i++) {
				Element element = propertyNodes.get(i);
				// 处理property元素
				String name = element.attributeValue("name");
				String ref = element.attributeValue("ref");
				String parentId =
				element.getParent().attributeValue("id");
				Object parentObject = map.get(parentId);
				Method[] methods = parentObject.getClass().getMethods();
				for (int j = 0; j < methods.length; j++) {
					Method method = methods[j];
					if(("set" + name).equalsIgnoreCase(method.getName())){
						// bean之间的依赖关系（注⼊bean）
						Object propertyObject = map.get(ref);
						method.invoke(parentObject,propertyObject);
					}
 				}
				// 维护依赖关系后重新将bean放⼊map中
				map.put(parentId,parentObject);
 			}
 		} catch (DocumentException e) {
			e.printStackTrace();
 		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		} catch (IllegalAccessException e) {
			e.printStackTrace();
		} catch (InstantiationException e) {
			e.printStackTrace();
		} catch (InvocationTargetException e) {
			e.printStackTrace();
		}
	}
	public static Object getBean(String id) {
		return map.get(id);
	}
}
```

- 修改 TransferServlet

![spring](/images/spring/s18.png)

- 修改 TransferServiceImpl

![spring](/images/spring/s19.png)

2. 针对问题⼆的改造

- 增加 ConnectionUtils

```bash
package com.loonycoder.utils;
import java.sql.Connection;
import java.sql.SQLException;

public class ConnectionUtils {
	/*private ConnectionUtils() {}
	  private static ConnectionUtils connectionUtils = new ConnectionUtils();
	  public static ConnectionUtils getInstance() {
		return connectionUtils;
	  }*/
	private ThreadLocal<Connection> threadLocal = new ThreadLocal<>(); //存储当前线程的连接
	/**
	* 从当前线程获取连接
	*/
	public Connection getCurrentThreadConn() throws SQLException {
	/**
	* 判断当前线程中是否已经绑定连接，如果没有绑定，需要从连接池获取⼀个连接绑定到当前线程
	*/
		Connection connection = threadLocal.get();
		if(connection == null) {			
			// 从连接池拿连接并绑定到线程
			connection = DruidUtils.getInstance().getConnection();
			// 绑定到当前线程
			threadLocal.set(connection);
 		}
		return connection;
 	}
}
```

- 增加 TransactionManager 事务管理器类

```bash
package com.loonycoder.utils;
import java.sql.SQLException;

public class TransactionManager {
	private ConnectionUtils connectionUtils;
	public void setConnectionUtils(ConnectionUtils connectionUtils) {
		this.connectionUtils = connectionUtils;
	}
	// 开启事务
	public void beginTransaction() throws SQLException {
		connectionUtils.getCurrentThreadConn().setAutoCommit(false);
	}
	// 提交事务
	public void commit() throws SQLException {
		connectionUtils.getCurrentThreadConn().commit();
	}
	// 回滚事务
	public void rollback() throws SQLException {
		connectionUtils.getCurrentThreadConn().rollback();
	}
}
```

- 增加 ProxyFactory 代理⼯⼚类

```bash
package com.loonycoder.factory;
import com.loonycoder.utils.TransactionManager;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class ProxyFactory {
	private TransactionManager transactionManager;
	public void setTransactionManager(TransactionManager transactionManager) {
		this.transactionManager = transactionManager;
	}
	public Object getProxy(Object target) {
		return Proxy.newProxyInstance(this.getClass().getClassLoader(),target.getClass().getInterfaces(), new InvocationHandler() {
			@Override
			public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
				Object result = null;
				try{
					// 开启事务
					transactionManager.beginTransaction();
					// 调⽤原有业务逻辑
					result = method.invoke(target,args);
					// 提交事务
					transactionManager.commit();
				 }catch(Exception e) {
					e.printStackTrace();
					// 回滚事务
					transactionManager.rollback();
					// 异常向上抛出,便于servlet中捕获
					throw e.getCause();
				 }
				return result;
			 }
	 	});
 	}
}
```

- 修改 beans.xml

```bash
<?xml version="1.0" encoding="UTF-8" ?>
<!--跟标签beans，⾥⾯配置⼀个⼜⼀个的bean⼦标签，每⼀个bean⼦标签都代表⼀个类的配置-->
<beans>
	<!--id标识对象，class是类的全限定类名-->
	<bean id="accountDao" class="com.loonycoder.dao.impl.JdbcAccountDaoImpl"> 
		<property name="ConnectionUtils" ref="connectionUtils"/>
	</bean> 
	<bean id="transferService" class="com.loonycoder.service.impl.TransferServiceImpl">
		<!--set+ name 之后锁定到传值的set⽅法了，通过反射技术可以调⽤该⽅法传⼊对应的值-->
		<property name="AccountDao" ref="accountDao"></property>
	</bean>
	<!--配置新增的三个Bean-->
	<bean id="connectionUtils" class="com.loonycoder.utils.ConnectionUtils"></bean>
	<!--事务管理器-->
	<bean id="transactionManager" class="com.loonycoder.utils.TransactionManager"> 
		<property name="ConnectionUtils" ref="connectionUtils"/>
	</bean>
	<!--代理对象⼯⼚-->
	<bean id="proxyFactory" class="com.loonycoder.factory.ProxyFactory"> 
		<property name="TransactionManager" ref="transactionManager"/>
	</bean>
</beans>
```

- 修改 JdbcAccountDaoImpl

```bash
package com.loonycoder.dao.impl;
import com.loonycoder.pojo.Account;
import com.loonycoder.dao.AccountDao;
import com.loonycoder.utils.ConnectionUtils;
import com.loonycoder.utils.DruidUtils;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class JdbcAccountDaoImpl implements AccountDao {
	private ConnectionUtils connectionUtils;
	public void setConnectionUtils(ConnectionUtils connectionUtils) {
		this.connectionUtils = connectionUtils;
	}
	@Override
	public Account queryAccountByCardNo(String cardNo) throws Exception {
		//从连接池获取连接
		// Connection con = DruidUtils.getInstance().getConnection();
		Connection con = connectionUtils.getCurrentThreadConn();
		String sql = "select * from account where cardNo=?";
		PreparedStatement preparedStatement = con.prepareStatement(sql);
		preparedStatement.setString(1,cardNo);
		ResultSet resultSet = preparedStatement.executeQuery();
		Account account = new Account();
		while(resultSet.next()) {
			account.setCardNo(resultSet.getString("cardNo"));
			account.setName(resultSet.getString("name"));
			account.setMoney(resultSet.getInt("money"));
		}
		resultSet.close();
		preparedStatement.close();
		//con.close();
		return account;
	}

	@Override
	public int updateAccountByCardNo(Account account) throws Exception {
		// 从连接池获取连接
		// 改造为：从当前线程当中获取绑定的connection连接
		//Connection con = DruidUtils.getInstance().getConnection();
		Connection con = connectionUtils.getCurrentThreadConn();
		String sql = "update account set money=? where cardNo=?";
		PreparedStatement preparedStatement = con.prepareStatement(sql);
		preparedStatement.setInt(1,account.getMoney());
		preparedStatement.setString(2,account.getCardNo());
		int i = preparedStatement.executeUpdate();
		preparedStatement.close();
		//con.close();
		return i;
	 }
}
```

- 修改 TransferServlet

```bash
package com.loonycoder.servlet;
import com.loonycoder.factory.BeanFactory;
import com.loonycoder.factory.ProxyFactory;
import com.loonycoder.service.impl.TransferServiceImpl;
import com.loonycoder.utils.JsonUtils;
import com.loonycoder.pojo.Result;
import com.loonycoder.service.TransferService;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(name="transferServlet",urlPatterns = "/transferServlet")
public class TransferServlet extends HttpServlet {
	// 1. 实例化service层对象
	//private TransferService transferService = new TransferServiceImpl();
	//private TransferService transferService = (TransferService)
	BeanFactory.getBean("transferService");
	// 从⼯⼚获取委托对象（委托对象是增强了事务控制的功能）
	// ⾸先从BeanFactory获取到proxyFactory代理⼯⼚的实例化对象
	private ProxyFactory proxyFactory = (ProxyFactory)BeanFactory.getBean("proxyFactory");
	private TransferService transferService = (TransferService)proxyFactory.getJdkProxy(BeanFactory.getBean("transferService")) ;
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		doPost(req,resp);
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		// 设置请求体的字符编码
		req.setCharacterEncoding("UTF-8");
		String fromCardNo = req.getParameter("fromCardNo");
		String toCardNo = req.getParameter("toCardNo");
		String moneyStr = req.getParameter("money");
		int money = Integer.parseInt(moneyStr);
		Result result = new Result();
		try {
			// 2. 调⽤service层⽅法
			transferService.transfer(fromCardNo,toCardNo,money);
			result.setStatus("200");
		} catch (Exception e) {
			e.printStackTrace();
			result.setStatus("201");
			result.setMessage(e.toString());
		}
		// 响应
		resp.setContentType("application/json;charset=utf-8");
		resp.getWriter().print(JsonUtils.object2Json(result));
	 }
}
```
