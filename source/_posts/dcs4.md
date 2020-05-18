---
title: 分布式集群架构场景化解决方案——分布式调度问题
categories:
    - 分布式架构
    
date: 2019-11-07 18:29:26
tags:
  - Hash算法
  - 分布式


---

### 前言

调度 —> 定时任务，分布式调度 —> 在分布式集群环境下定时任务这件事。
Elastic-job（当当⽹开源的分布式调度框架）

#### 定时任务的场景

定时任务形式：每隔⼀定时间/特定某⼀时刻执⾏。

例如：
- 订单审核、出库
- 订单超时⾃动取消、⽀付退款
- 礼券同步、⽣成、发放作业
- 物流信息推送、抓取作业、退换货处理作业
- 数据积压监控、⽇志监控、服务可⽤性探测作业
- 定时备份数据
- ⾦融系统每天的定时结算
- 数据归档、清理作业
- 报表、离线数据分析作业

#### 什么是分布式调度

什么是分布式任务调度？有两层含义

- 运⾏在分布式集群环境下的调度任务（同⼀个定时任务程序部署多份，只应该有⼀个定时任务在执⾏）
- 分布式调度 —> 定时任务的分布式—>定时任务的拆分（即为把⼀个⼤的作业任务拆分为多个⼩的作业任务，同时执⾏）

![dcs](/images/dcs/dcs22.png)

#### 定时任务与消息队列的区别

- 共同点
	- 异步处理
	⽐如注册、下单事件
	- 应⽤解耦
	不管定时任务作业还是MQ都可以作为两个应⽤之间的⻮轮实现应⽤解耦，这个⻮轮可以中转数据，当然单体服务不需要考虑这些，服务拆分的时候往往都会考虑。
	- 流量削峰
	双⼗⼀的时候，任务作业和MQ都可以⽤来扛流量，后端系统根据服务能⼒定时处理订单或者从MQ抓取订单抓取到⼀个订单到来事件的话触发处理，对于前端⽤户来说看到的结果是已经下单成功了，下单是不受任何影响的。

- 本质不同
	- 定时任务作业是时间驱动，⽽MQ是事件驱动；
	- 时间驱动是不可代替的，⽐如⾦融系统每⽇的利息结算，不是说利息来⼀条（利息到来事件）就算⼀下，⽽往往是通过定时任务批量计算；所以，定时任务作业更倾向于批处理，MQ倾向于逐条处理；

#### 定时任务的实现⽅式

定时任务的实现⽅式有多种。早期没有定时任务框架的时候，我们会使⽤JDK中的Timer机制和多线程机制（Runnable+线程休眠）来实现定时或者间隔⼀段时间执⾏某⼀段程序；后来有了定时任务框架，⽐如⼤名鼎鼎的Quartz任务调度框架，使⽤时间表达式（包括：秒、分、时、⽇、周、年）配置某⼀个任务什么时间去执⾏：

- **任务调度框架Quartz回顾示意**

	- 引⼊jar
	```bash
	<!--任务调度框架quartz-->
	<!-- https://mvnrepository.com/artifact/org.quartz-scheduler/quartz -->
	<dependency> 
		<groupId>org.quartz-scheduler</groupId>
		<artifactId>quartz</artifactId>
		<version>2.3.2</version>
	</dependency>
	```
	- 定时任务作业主调度程序
	```bash
		package quartz;
		import org.quartz.*;
		import org.quartz.impl.StdSchedulerFactory;
		public class QuartzMain {
			// 创建作业任务调度器（类似于公交调度站）
			public static Scheduler createScheduler() throws SchedulerException {
			SchedulerFactory schedulerFactory = new StdSchedulerFactory();
			Scheduler scheduler = schedulerFactory.getScheduler();
			return scheduler;
		 }
		// 创建⼀个作业任务（类似于⼀辆公交⻋）
		public static JobDetail createJob() {
			JobBuilder jobBuilder = JobBuilder.newJob(DemoJob.class);
			jobBuilder.withIdentity("jobName","myJob");
			JobDetail jobDetail = jobBuilder.build();
			return jobDetail;
		 }
		/**
		* 创建作业任务时间触发器（类似于公交⻋出⻋时间表）
		* cron表达式由七个位置组成，空格分隔
		* 1、Seconds（秒） 0~59
		* 2、Minutes（分） 0~59
		* 3、Hours（⼩时） 0~23
		* 4、Day of Month（天）1~31,注意有的⽉份不⾜31天
		* 5、Month（⽉） 0~11,或者
		JAN,FEB,MAR,APR,MAY,JUN,JUL,AUG,SEP,OCT,NOV,DEC
		* 6、Day of Week(周) 1~7,1=SUN或者 SUN,MON,TUE,WEB,THU,FRI,SAT
		* 7、Year（年）1970~2099 可选项
		*示例：
		* 0 0 11 * * ? 每天的11点触发执⾏⼀次
		* 0 30 10 1 * ? 每⽉1号上午10点半触发执⾏⼀次
		*/
		public static Trigger createTrigger() {
			// 创建时间触发器，按⽇历调度
			CronTrigger trigger = TriggerBuilder.newTrigger().withIdentity("triggerName","myTrigger").startNow().withSchedule(CronScheduleBuilder.cronSchedule("0/2 * * * * ?")).build();
			// 创建触发器，按简单间隔调度
			/*SimpleTrigger trigger1 = TriggerBuilder.newTrigger()
			.withIdentity("triggerName","myTrigger")
			.startNow()
			.withSchedule(SimpleScheduleBuilder
			.simpleSchedule()
			.withIntervalInSeconds(3)
			.repeatForever())
			.build();*/
			return trigger;
		 }
		// 定时任务作业主调度程序
		public static void main(String[] args) throws SchedulerException {
			// 创建⼀个作业任务调度器（类似于公交调度站）
			Scheduler scheduler = QuartzMain.createScheduler();
			// 创建⼀个作业任务（类似于⼀辆公交⻋）
			JobDetail job = QuartzMain.createJob();
			// 创建⼀个作业任务时间触发器（类似于公交⻋出⻋时间表）
			Trigger trigger = QuartzMain.createTrigger();
			// 使⽤调度器按照时间触发器执⾏这个作业任务
			scheduler.scheduleJob(job,trigger);
			scheduler.start();
		}
	}
	```

	- 定义⼀个job，需实现Job接⼝

	```bash
	package quartz;
	import org.quartz.Job;
	import org.quartz.JobExecutionContext;
	import org.quartz.JobExecutionException;
	public class DemoJob implements Job {
		public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
			System.out.println("我是⼀个定时任务逻辑");
 		}
	}
	```

以上，是回顾⼀下任务调度框架Quartz的⼤致⽤法，那么在分布式架构环境中使⽤Quartz已经不能更好的满⾜我们需求，我们可以使⽤专业的分布式调度框架，这⾥我们推荐使⽤Elastic-job。

#### 分布式调度框架Elastic-Job

##### Elastic-Job介绍

Elastic-Job是当当⽹开源的⼀个分布式调度解决⽅案，基于Quartz⼆次开发的，由两个相互独⽴的⼦项⽬Elastic-Job-Lite和Elastic-Job-Cloud组成。我们要学习的是Elastic-Job-Lite，它定位为轻量级⽆中⼼化解决⽅案，使⽤Jar包的形式提供分布式任务的协调服务，⽽Elastic-Job-Cloud⼦项⽬需要结合Mesos以及Docker在云环境下使⽤。
Elastic-Job的github地址：<https://github.com/elasticjob>

**主要功能介绍**

- **分布式调度协调**:在分布式环境中，任务能够按指定的调度策略执⾏，并且能够避免同⼀任务多实例重复执⾏
- **丰富的调度策略**:基于成熟的定时任务作业框架Quartz cron表达式执⾏定时任务
- **弹性扩容缩容**:当集群中增加某⼀个实例，它应当也能够被选举并执⾏任务；当集群减少⼀个实例
时，它所执⾏的任务能被转移到别的实例来执⾏。
- **失效转移**:某实例在任务执⾏失败后，会被转移到其他实例执⾏
- **错过执⾏作业重触发**:若因某种原因导致作业错过执⾏，⾃动记录错过执⾏的作业，并在上次作业完成后⾃动触发。
- **⽀持并⾏调度**:⽀持任务分⽚，任务分⽚是指将⼀个任务分为多个⼩任务项在多个实例同时执⾏。
- **作业分⽚⼀致性**:当任务被分⽚后，保证同⼀分⽚在分布式环境中仅⼀个执⾏实例。

##### Elastic-Job-Lite应⽤

Elastic-Job依赖于Zookeeper进⾏分布式协调，所以需要安装Zookeeper软件（3.4.6版本以上），关于Zookeeper，此处我们不做详解，在阶段三会有深度学习，我们此处需要明⽩Zookeeper的本质功能：存储+通知。

- 安装Zookeeper（此处单例配置）

1. 我们使⽤3.4.10版本，在linux平台解压下载的zookeeper-3.4.10.tar.gz
2. 进⼊conf⽬录，cp zoo_sample.cfg zoo.cfg
3. 进⼊bin⽬录，启动zk服务
```bash
启动 ./zkServer.sh start
停⽌ ./zkServer.sh stop
查看状态 ./zkServer.sh status
```

![dcs](/images/dcs/dcs23.png)

- 引⼊Jar包

```bash
<!-- https://mvnrepository.com/artifact/com.dangdang/elastic-job-lite-core-->
<dependency> 
	<groupId>com.dangdang</groupId> 
	<artifactId>elastic-job-lite-core</artifactId> 
	<version>2.1.5</version>
</dependency>
```

- 定时任务实例
	- 需求：每隔两秒钟执⾏⼀次定时任务（resume表中未归档的数据归档到resume_bak表中，每次归档1条记录）
	1. resume_bak和resume表结构完全⼀样
	2. resume表中数据归档之后不删除，只将state置为"已归档"
	- 数据表结构
	```bash
	-- ----------------------------
	-- Table structure for resume
	-- ----------------------------
	DROP TABLE IF EXISTS `resume`;
	CREATE TABLE `resume` (
	 `id` bigint(20) NOT NULL AUTO_INCREMENT,
	 `name` varchar(255) DEFAULT NULL,
	 `sex` varchar(255) DEFAULT NULL,
	 `phone` varchar(255) DEFAULT NULL,
	 `address` varchar(255) DEFAULT NULL,
	 `education` varchar(255) DEFAULT NULL,
	 `state` varchar(255) DEFAULT NULL,
	 PRIMARY KEY (`id`)
	) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8;
	SET FOREIGN_KEY_CHECKS = 1;
	```
	- 程序开发
		- 定时任务类
		```bash
		package elasticjob;
		import com.dangdang.ddframe.job.api.ShardingContext;
		import com.dangdang.ddframe.job.api.simple.SimpleJob;
		import util.JdbcUtil;
		import java.sql.Connection;
		import java.sql.PreparedStatement;
		import java.sql.ResultSet;
		import java.util.List;
		import java.util.Map;
		public class BackupJob implements SimpleJob {
			// 定时任务每执⾏⼀次都会执⾏如下的逻辑
			@Override
			public void execute(ShardingContext shardingContext) {
				/*
				从resume数据表查找1条未归档的数据，将其归档到resume_bak
				表，并更新状态为已归档（不删除原数据）
				*/
				// 查询出⼀条数据
				String selectSql = "select * from resume where
				state='未归档' limit 1";
				List<Map<String, Object>> list =
				JdbcUtil.executeQuery(selectSql);
				if(list == null || list.size() == 0) {
					return;
					}
				Map<String, Object> stringObjectMap = list.get(0);
				long id = (long) stringObjectMap.get("id");
				String name = (String) stringObjectMap.get("name");
				String education = (String)
				stringObjectMap.get("education");
				// 打印出这条记录
				System.out.println("======>>>id：" + id + " name：" +
				name + " education：" + education);
				// 更改状态
				String updateSql = "update resume set state='已归档'
				where id=?";
				JdbcUtil.executeUpdate(updateSql,id);
				// 归档这条记录
				String insertSql = "insert into resume_bak select *
				from resume where id=?";
				JdbcUtil.executeUpdate(insertSql,id);
	 		}
		}
		```
		- 主类
		```bash
		package elasticjob;
		import com.dangdang.ddframe.job.config.JobCoreConfiguration;
		import com.dangdang.ddframe.job.config.simple.SimpleJobConfiguration;
		import com.dangdang.ddframe.job.lite.api.JobScheduler;
		import com.dangdang.ddframe.job.lite.config.LiteJobConfiguration;
		import com.dangdang.ddframe.job.reg.base.CoordinatorRegistryCenter;
		import com.dangdang.ddframe.job.reg.zookeeper.ZookeeperConfiguration;
		import com.dangdang.ddframe.job.reg.zookeeper.ZookeeperRegistryCenter;
		public class ElasticJobMain {
			public static void main(String[] args) {
				// 配置注册中⼼zookeeper，zookeeper协调调度，不能让任务重复执⾏，
				通过命名空间分类管理任务，对应到zookeeper的⽬录
				ZookeeperConfiguration zookeeperConfiguration = newZookeeperConfiguration("localhost:2181","data-archive-job");
				CoordinatorRegistryCenter coordinatorRegistryCenter = new ZookeeperRegistryCenter(zookeeperConfiguration);
				coordinatorRegistryCenter.init();
				// 配置任务
				JobCoreConfiguration jobCoreConfiguration = JobCoreConfiguration.newBuilder("archive-job","*/2 * * * * ?",1).build();
				SimpleJobConfiguration simpleJobConfiguration = new SimpleJobConfiguration(jobCoreConfiguration,BackupJob.class.getName());
				// 启动任务
				new JobScheduler(coordinatorRegistryCenter,LiteJobConfiguration.newBuilder(simpleJobConfiguration).build()).init();
			 }
		}
		```
		- JdbcUtil⼯具类
		```bash
package util;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
public class JdbcUtil {
			//url
			private static String url = "jdbc:mysql://localhost:3306/job?
			characterEncoding=utf8&useSSL=false";
			//user
			private static String user = "root";
			//password
			private static String password = "123456";
			//驱动程序类
			private static String driver = "com.mysql.jdbc.Driver";
			static {
				try {
					Class.forName(driver);
				} catch (ClassNotFoundException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				 }
			}
			public static Connection getConnection() {
				try {
				<rp></rp>eturn DriverManager.getConnection(url, user,password);
				} catch (SQLException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
 				}
				return null;
 			}
			public static void close(ResultSet rs, PreparedStatement ps,
				Connection con) {
				if (rs != null) {
					try {
						rs.close();
				 	} catch (SQLException e) {
					// TODO Auto-generated catch block
						e.printStackTrace();
				 	} finally {
						if (ps != null) {
							try {
								ps.close();
				 			} catch (SQLException e) {
							// TODO Auto-generated catch block
								e.printStackTrace();
				 			} finally {
								if (con != null) {
									try {
										con.close();
				 					} catch (SQLException e) {
									// TODO Auto-generated catch block
									e.printStackTrace();
 								}
 							}
 					}
 				}
 			}
 		}
 }
 public static void executeUpdate(String sql,Object...obj) {
	Connection con = getConnection();
	PreparedStatement ps = null;
	try {
		ps = con.prepareStatement(sql);
		for (int i = 0; i < obj.length; i++) {
			ps.setObject(i + 1, obj[i]);
		 }
		ps.executeUpdate();
	 } catch (SQLException e) {
		// TODO Auto-generated catch block
		e.printStackTrace();
	 } finally {
		close(null, ps, con);
	 }
}
	public static List<Map<String,Object>> executeQuery(String sql, Object...obj) {
		Connection con = getConnection();
		ResultSet rs = null;
		PreparedStatement ps = null;
		try {
			ps = con.prepareStatement(sql);
			for (int i = 0; i < obj.length; i++) {
				ps.setObject(i + 1, obj[i]);
			}
			rs = ps.executeQuery();
			List<Map<String, Object>> list = new ArrayList<>();
			int count = rs.getMetaData().getColumnCount();
			while (rs.next()) {
				Map<String, Object> map = new HashMap<String,Object>();
				for (int i = 0; i < count; i++) {
					Object ob = rs.getObject(i + 1);
					String key = rs.getMetaData().getColumnName(i + 1);
				map.put(key, ob);
				 }
				list.add(map);
		 	}
			return list;
		 } catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		 } finally {
			close(rs, ps, con);
		 }
			return null;
		 }
}
		```

		- 测试
		1）可先启动⼀个进程，然后再启动⼀个进程（两个进程模拟分布式环境下，通⼀个定时任务部署了两份在⼯作）
		2）两个进程逐个启动，观察现象
		3）关闭其中执⾏的进程，观察现象
		- Leader节点选举机制
		每个Elastic-Job的任务执⾏实例App作为Zookeeper的客户端来操作ZooKeeper的znode
		（1）多个实例同时创建/leader节点
		（2）/leader节点只能创建⼀个，后创建的会失败，创建成功的实例会被选为leader节点，执⾏任务

#####  Elastic-Job-Lite轻量级去中⼼化的特点

如何理解轻量级和去中⼼化？

![dcs](/images/dcs/dcs24.png)

##### 任务分⽚

⼀个⼤的⾮常耗时的作业Job，⽐如：⼀次要处理⼀亿的数据，那这⼀亿的数据存储在数据库中，如果⽤⼀个作业节点处理⼀亿数据要很久，在互联⽹领域是不太能接受的，互联⽹领域更希望机器的增加去横向扩展处理能⼒。所以，ElasticJob可以把作业分为多个的task（每⼀个task就是⼀个任务分⽚），每⼀个task交给具体的⼀个机器实例去处理（⼀个机器实例是可以处理多个task的），但是具体每个task执⾏什么逻辑由我们⾃⼰来指定。

![dcs](/images/dcs/dcs25.png)

Strategy策略定义这些分⽚项怎么去分配到各个机器上去，默认是平均去分，可以定制，⽐如某⼀个机器负载 ⽐较⾼或者预配置⽐较⾼，那么就可以写策略。分⽚和作业本身是通过⼀个注册中⼼协调的，因为在分布式环境下，状态数据肯定集中到⼀点，才可以在分布式中沟通。

**分⽚代码**

![dcs](/images/dcs/dcs26.png)
![dcs](/images/dcs/dcs27.png)

##### 弹性扩容

![dcs](/images/dcs/dcs28.png)

新增加⼀个运⾏实例app3，它会⾃动注册到注册中⼼，注册中⼼发现新的服务上线，注册中⼼会通知ElasticJob 进⾏重新分⽚，那么总得分⽚项有多少，那么就可以搞多少个实例机器，⽐如完全可以分1000⽚
最多就可以有多少app实例，机器能撑得住，完全可以分1000⽚
那么就可以搞1000台机器⼀起执⾏作业
注意：
1. 分⽚项也是⼀个JOB配置，修改配置，重新分⽚，在**下⼀次定时运⾏之前会重新调⽤分⽚算法**，那么
这个分⽚算法的结果就是：哪台机器运⾏哪⼀个⼀⽚，这个结果存储到zk中的，主节点会把分⽚给分好，放到注册中⼼去，然后执⾏节点从注册中⼼获取信息(执⾏节点在定时任务开启的时候获取相应的分⽚)。 
2. 如果所有的节点挂掉值剩下⼀个节点，所有分⽚都会指向剩下的⼀个节点，这也是ElasticJob的⾼可⽤。