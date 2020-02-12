---
title: Java基础（一）
categories:
    - Java
date: 2019-11-14
tags:
	- Java
	- Java基础

---

记录一些Java基础的知识点，为了自己查阅资料的时候方便一些。

---
### Java基础

#### JDK和JRE的区别？

1、jre即Java Runtime Environment，Java运行环境。包括Java虚拟机和Java类库
2、jdk是Java开发工具包，例如：tools.jar

---

#### == 和 equals的区别

1、==是一个比较运算符，对于基本类型，比较的是具体的数值(int、double..)；对于引用类型，比较的是对象的内存地址
2、equals是超类Object就具有的方法，因此所有的引用类型都具有这个方法，只用用来比较引用数据类型。equals方法默认比较的对象内存地址，如果重写该方法，一般比较的是对象的属性值。
Object类equals方法源码：
```bash
public boolean equals(Object obj) {
    return (this == obj);
}
```
new对象是在堆内存中开辟一份空间，所以其引用变量就是指向了堆内存的地址，举个栗子：
```bash
public class EqualsTest {

    public static void main(String[] args) {
        User a = new User();
        User b = new User();
        System.out.println(a == b); //false
        System.out.println(a.equals(b)); //true
    }
}

class User {
    private int age;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User user = (User) o;
        return age == user.age;
    }

    @Override
    public int hashCode() {
        return Objects.hash(age);
    }
}
```
---

#### 两个对象的hashCode()相同，则equals()一定为true？
**如果两个对象相等(equals()为true)，那么他们的hashCode()一定相同**
**如果两个对象的hashCode()相同，他们的equals()方法不一定相同**

JVM虚拟机通过hashCode()方法为Object对象分配一个int类型数值，以此来提高Java中集合对象(Map、HashMap…)中对象存储的效率。当集合中需要添加新元素，首先通过hashCode()获取该对象对应的地址位置，如果该位置上没有值就直接储存到该位置，如果有值就再调用equals()与新元素的值比较，相同就不再储存否则就散列到其他位置，大大减少了调用equals()方法比较的次数。

```bash
public class EqualsTest {

    public static void main(String[] args) {
        User a = new User();
        User b = new User();
        System.out.println(a == b); //false
        System.out.println(a.equals(b)); //false
        System.out.println(a.hashCode() == b.hashCode()); //false
    }
}

class User {
    private int age;
}
```
---

#### final的作用
可修饰类、类属性、类方法。
1、被final修饰的类不能被继承
2、final修饰的类属性可以是基本类型也可以是引用类型，如果是基本类型就不能再被赋值；如果是引用类型，就不能再指向其他引用地址，但对象本身是可以改变的。
```bash
public class FinalTest {

    private static final User USER = new User();

    public static void main(String[] args) {
        User u2 = new User();
//        user = u2; // ERROR
        USER.age = 23;
    }
}

class User {
    int age = 12;
}
```
3、类中所有private方法都是隐式的定义为final，为private方法添加final就毫无意义。

---

#### String属于基本数据类型吗？

**不，String属于特殊的引用类型**

Java中基本数据类型有：int、short、long、char、boolean、float、double、byte

1、String是特殊的引用类型并且是final的，JVM使用字符串常量池储存字符串数据。创建新的字符串，JVM首先会去字符串常量池中寻找有没有该字符串，如果没有就添加到该常量池，如果有就返回该字符串在常量池中的引用。
2、String s = "a"; s += "b";，这段代码执行前后，字符串常量池中将出现a和ab两个字符串常量，而原本s变量的引用指向了常量池中ab。
3、String s = new String("ab")，这段代码一共创建了几个对象？一个或两个。如果字符串常量池中有了ab这个字符串(比如在此之前已经使用了String str = "ab")，那么新的s对象引用其实仅仅是指向了字符串常量中的ab，并没有创建新的字符串对象。但是，每次调用new都会在堆内存开辟空间，创建一个String对象，这是肯定的。

栗子：
```bash
public class StringTest {

    public static void main(String[] args) {
        String a = "abc";
        String b = "abc";
        String c = new String("abc");
        System.out.println(a == b); //true
        System.out.println(a.equals(b)); //true
        System.out.println(a.equals(c)); //true
    }
}
```

**String和StringBuffer和StringBuilder的区别**
1、String是不可变字符串，StringBuffer和StringBuilder是可变字符串。如果经常改变字符串的原始数据，最好使用StringBuffer代替。
2、String默认重写了equals方法和hashCode()方法；而StringBuffer没有重写equals方法，使用new StringBuffer("")会直接在堆内存中开辟空间储存对象。因此将StringBuffer对象储存仅Java集合中可能会出现问题。
3、StringBuffer是线程安全的，效率低；StringBuilder是线程不安全的，效率高。

---

#### static关键字？是否可覆盖？

static关键字表明一个成员变量或者是成员方法可以在没有所属的类实例变量的情况下被访问。被static标记的方法不能被覆盖，因为方法的覆盖是基于运行时动态绑定的，而static方法在编译时就已经和该类绑定了，也就是static标记的变量、方法都是随着类的加载而加载的，所以可以通过不创建对象实例就能访问该变量、方法；而不创建对象实例就访问非static变量、方法是不行的，因为此变量、方法还没有被创建。

static标记的方法只能访问static变量或方法
非static标记的方法可以访问static或非static标记的变量或方法

---

#### 自动拆、装箱

因为Java自身面向对象OOP的特性，而一切基本数据类型都不具有面向对象的特性，所以Java为基本的数据类型提供了对应的引用类型。
具体表现在程序在编译期间自动将基本数据类型转换为引用类型(装箱)、将引用数据类型转换为基本数据类型(拆箱)

基本数据类型|引用数据类型
:--:|:--:
int|Integer
byte|Byte
short|Short
long|Long
float|Float
double|Double
char|Char
boolean|Boolean

栗子：
```bash
public static void main(String[] args) {
    Integer i1 = 100;
    Integer i2 = 100;
    Integer i3 = 200;
    Integer i4 = 200;
    System.out.println(i1 == i2);
    System.out.println(i3 == i4);
}
```

结果：
```bash
true
false
```

Java中实现基本数据类型和引用类型之间的拆装箱一般都是用过valueOf()方法实现的。例如我们看下Integer类的valueOf()方法源码：
```bash
public static Integer valueOf(int i) {
    if (i >= IntegerCache.low && i <= IntegerCache.high)
        return IntegerCache.cache[i + (-IntegerCache.low)];
    return new Integer(i);
}
```

可以看到：当声明一个新的整数型变量，编译时通过Integer类的valueOf()进行拆装箱计算，这个方法会首先比较这个整数值是否在IntegerCache的范围内，如果在就返回IntegerCache类中的数值；如果不在就直接new Integer。那么我们看下IntegerCache类源码：

```bash
private static class IntegerCache {
    static final int low = -128;
    static final int high;
    static final Integer cache[];

    static {
        // high value may be configured by property
        int h = 127;
        String integerCacheHighPropValue =
            sun.misc.VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
        if (integerCacheHighPropValue != null) {
            try {
                int i = parseInt(integerCacheHighPropValue);
                i = Math.max(i, 127);
                // Maximum array size is Integer.MAX_VALUE
                h = Math.min(i, Integer.MAX_VALUE - (-low) -1);
            } catch( NumberFormatException nfe) {
                // If the property cannot be parsed into an int, ignore it.
            }
        }
        high = h;

        cache = new Integer[(high - low) + 1];
        int j = low;
        for(int k = 0; k < cache.length; k++)
            cache[k] = new Integer(j++);

        // range [-128, 127] must be interned (JLS7 5.1.7)
        assert IntegerCache.high >= 127;
    }

    private IntegerCache() {}
}
```
所以，当声明一个新的整型变量时（int、Integer），如果这个变量值的大小在[-128, 127]之间，就直接返回IntegerCache中储存的常量值，否则就直接new一个新的Integer来保存这个常量值。所以上面才会出现false的结果。
同理：其他的数据类型例如：long、short等都具有对应的LongCache、ShortCache等类。

---

#### Overriding和Overloaded
方法的重写Overriding和方法的重载Overloaded都是Java多态性的一种表现。
Overriding: 子类中定义了和父类中名称、参数列表相同的方法
Overloaded: 方法名相同，参数列表不同

---

#### Java支持多继承吗？
不支持。Java中每个类都只能继承一个类，可以实现多个接口。但是可以通过多层继承实现。
类定义属性和方法，描述某一类事物的抽象。而接口定义了行为，并不限于任何具体意向。
从逻辑上说，单继承更加明确指出一个子类就应该是其父类代表的事物中某个更具体的类别。而接口则不同，接口定义了一些公共行为。因此类对接口的implements称为实现而不能称为继承。

---

#### 接口和抽象类的区别？

+ 接口中所有的方法隐含都是抽象的。而抽象类则可以同时包含抽象和非抽象的方法。
+ 接口中定义的方法必须是不包含具体实现的（即隐式的抽象方法）；但抽象类中既可以定义抽象方法（不包含具体实现）又可以定义非抽象方法 ( 包含具体实现 )
+ 类实现接口就必须实现接口中定义的所有方法；但继承一个抽象类，可以不实现抽象类中的抽象方法 ( 但前提是这个类也是抽象的 )
+ 抽象类可以是不提供接口方法实现的情况下实现接口
+ 接口中声明的变量默认都是final的；但抽象类可以包含非final的变量
+ 接口中的成员方法默认都是public的；但抽象类中的成员函数可以是private、protected、public
+ 接口是绝对抽象的，不可以被实例化；

---

#### 引用传递和值传递

**Java中采用值传递的方式**
栗子：
```bash
public class TransferTest {


    public static void main(String[] args) {
        int a = 1;
        Integer b = 2;
        swap(a, b);
        System.out.println(a);
        System.out.println(b);

        int[] arr = {1, 2};
        swap(arr);
        System.out.println(Arrays.toString(arr));
    }

    private static void swap(int[] arr) {
        arr[0] = 10;
    }

    private static void swap(int a, Integer b) {
        a = 10;
        b = 20;
    }
}
```

方法传递时传递的参数其实仅值原参数的一个拷贝，对于基本类型传递的就是具体的值的拷贝，对于引用类型传递的是对象地址。
所以上面的例子中，基本数据类型a,b经过swap方法并没有改变原始值，而引用类型arr数组经过swap方法就改变了原始值（因为直接对对象堆内存地址数据操作）。

---

#### IO流

![IO流](http://cdn.tycoding.cn/20180127210359151.png)

**1、Java中有几种类型的流？**
字符流和字节流。字节流继承InputStream和OutputStream；字符流继承自InputStreamReader和OutputStreamWriter。

**2、谈谈Java IO中的方法阻塞**
Java中的阻塞式方法是指在程序调用该方法时，必须等待输入数据可用或检测到输入结果时结束或抛出异常，否则程序会一直停留在该语句上，不会执行下面的语句。比如read()和readLine()方法。

**3、字符流和字节流的区别？**
数据的输入和输出在计算机中最终都是通过字节的形式传递的，对应通过InputStream和OutputStream实现，他们都是针对字节操作的。
而有时候通常需要读取一些完全是字符的文本数据，通常使用基于字节流的包装类字符流完成操作，他们通过InputStreamReader和OutputStreamWriter实现。
字符流是字节流的包装，即使有时候读取的是字符流，但也可能需要转换为字节写入。

**4、NIO**
传统的IO是阻塞式的，会一直监听一个ServerSocket，在调用read()等方法时，会一直等到数据到来或缓冲区已满时才返回；调用accept()时也会一直阻塞到有客户端连接时才继续执行；每个客户端连接成功后，服务端都会踢动一个县城去处理该客户端的请求；在多线程处理多个连接时，每个线程都拥有自己的栈空间并且占用了一些CPU时间，每个线程遇到外部未准备好时，都会发生阻塞。阻塞的结果就是会打来大量的进程上下文切换。
而对于NIO，它是非阻塞式，核心类：
+ Buffer： 为所有的原始类型提供Buffer缓冲支持
+ Charset： 字符集编码解码解决方案
+ Channel： 一个新的原始IO抽象，用于读取Buffer类型，通道可以认为是一种链接，可以是到特定设备、程序或是网络链接。

---

#### 说说List、Set、Map三者的区别

+ List: List接口储存一组不唯一 (可以有多个元素引用引用相同的对象)，有序的对象，可插入多条null元素
+ Set: 不允许重复的集合，不允许有多个元素引用相同的对象，只允许有一个null元素
+ Map: 使用键值对储存，Map会维护与Key有关联的值，两个Key可以引用相同的对象，但Key不能重复。

---

#### Array和ArrayList有什么区别？

+ Array可以包含基本类型和对象类型；ArrayList只能包含对象类型
+ Array大小是固定的；ArrayList大小是动态变化的
+ ArrayList提供了诸如addAll()、removeAll()、iterator()方法等
+ 对于基本数据类型，集合使用自动装箱来减少代码量；但当处理固定大小的基本类型数据时，这种方式相对较慢。

---

#### ArrayList和LinkedList的区别？

1、**是否保证线程安全**： ArrayList和LinkedList都是不同步的，也就是不保证线程安全
2、**底层数据结构**： ArrayList底层使用的是Object数组；LinkedList底层使用的是 双向链表 结构
3、**插入和删除是否受元素位置影响？** ArrayList采用数组储存，所以插入和删除元素都受元素位置的影响；LinkedList 采用链表储存，所以插入、删除元素都不受元素位置影响。
4、**是否支持快速随机访问？** LinkedList因为使用链表储存，无法通过元素索引快速访问；而ArrayList因为底层采用Object数组储存，可以通过索引快速随机访问。
5、**内存空间占用**： ArrayList的空间浪费主要体现在在List列表的结尾都会预留一定的空间容量，而LinkedList的空间花费体现在他的每一个元素都需要消耗比ArrayList更多的空间（因为要储存直接后继和直接前驱以及数据）。

---

**什么是迭代器**
*Iterator*接口中提供了很多对集合元素迭代的方法。每个集合中都有可以返回迭代器对象的方法*iterator()*。迭代器在迭代的过程中可以删除底层集合的元素。

**Iterator和ListIterator的区别？**
+ Iterator可以用来遍历Set和List集合，但是ListIterator只能遍历List
+ Iterator对集合只能向前遍历（next()）；而*ListIterator可以向前遍历（next()），也可以向后遍历（previous()）
+ ListIterator实现了Iterator接口

**RandomAccess接口**
```bash
//ArrayList
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
{}

//RandomAccess
public interface RandomAccess {
}

//LinkedList
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
{}
```

源码中ArrayList类实现了RandomAccess接口，LinkedList类中却没有实现这个接口，但是RandomAccess接口中却什么也没有定义。可以看RandomAccess接口上的注释：
```bash
/**
 * Marker interface used by <tt>List</tt> implementations to indicate that
 * they support fast (generally constant time) random access.  The primary
 * purpose of this interface is to allow generic algorithms to alter their
 * behavior to provide good performance when applied to either random or
 * sequential access lists.
 */
```
大概就是说这个接口仅是一个标识Marker，实现了这个接口的List将支持快速随机访问（random access）。接下来，我们查看Collections类中的binarySearch方法：
```bash
public static <T>
int binarySearch(List<? extends Comparable<? super T>> list, T key) {
    if (list instanceof RandomAccess || list.size()<BINARYSEARCH_THRESHOLD)
        return Collections.indexedBinarySearch(list, key);
    else
        return Collections.iteratorBinarySearch(list, key);
}

private static <T>
int indexedBinarySearch(List<? extends Comparable<? super T>> list, T key) {
    int low = 0;
    int high = list.size()-1;

    while (low <= high) {
        int mid = (low + high) >>> 1;
        Comparable<? super T> midVal = list.get(mid);
        int cmp = midVal.compareTo(key);

        if (cmp < 0)
            low = mid + 1;
        else if (cmp > 0)
            high = mid - 1;
        else
            return mid; // key found
    }
    return -(low + 1);  // key not found
}

private static <T>
int iteratorBinarySearch(List<? extends Comparable<? super T>> list, T key)
{
    int low = 0;
    int high = list.size()-1;
    ListIterator<? extends Comparable<? super T>> i = list.listIterator();

    while (low <= high) {
        int mid = (low + high) >>> 1;
        Comparable<? super T> midVal = get(i, mid);
        int cmp = midVal.compareTo(key);

        if (cmp < 0)
            low = mid + 1;
        else if (cmp > 0)
            high = mid - 1;
        else
            return mid; // key found
    }
    return -(low + 1);  // key not found
}
```

binarySearch()方法是从List中查找指定元素，其中首先判断传入的List时候实现了RandomAccess接口，如果实现了就调用indexedBinarySearch()方法，否则就调用iteratorBinarySearch()方法。再看这两个方法的源码：
如果传入的List实现了RandomAccess接口，采用普通for循环遍历
若传入的List未实现RandomAccess接口，采用iterator遍历

**链表**

**链表（Linked List）**由一串节点组成，每个节点包含任意的实例数据和一或两个用来指向上一个/下一个节点位置的指针
>单向链表
单向链表包含每个节点Node包含两个部分：第一部分data储存当前节点数据、第二部分next存储下一节点的地址。
+ 单向链表只可向一个方向遍历，查找一个节点需要从第一个节点开始向下依次寻找
![单向链表](http://cdn.tycoding.cn/1120165-20171207161602113-1451349858.png)

+ 单向链表插入节点从链表头部插入，将新插入节点的next指向原头部节点位置即可
![单向链表](http://cdn.tycoding.cn/1120165-20171207162758425-142549066.png)

+ 删除节点，只需要将该节点上一个节点的next指向该节点下一个节点即可
![单向链表](http://cdn.tycoding.cn/1120165-20171207162815925-341262498.png)

>双向链表
**双向链表** 包含两个指针，prev指向前一个节点，next指向后一个节点。
![双向链表](http://cdn.tycoding.cn/双向链表.png)

>双向循环链表
**双向循环链表** 最后一个节点的*next*指向*head*，而*head*的*prev*指向最后一个节点，形成一个环。
![双向循环链表](http://cdn.tycoding.cn/双向循环链表.png)

---

#### ArrayList和Vector和LinkedList的区别？
+ **ArrayList**: 底层数据结构是数组，查询快，增删慢。线程不安全，效率高
+ **Vector**: 底层数据结构是数组，查询快，增删慢。线程安全，效率低
+ **LinkedList**: 底层数据结构是链表，查询慢，增删快。线程不安全，效率高

---

#### 谈谈ArrayList的扩容机制
Java中基本数组都是定长的，一旦被实例化后就不能改变其长度，意味着创建数组时必须确定数组的容量大小。而很多情况下，数组的长度不是确定的，需要动态增减，ArrayList的出现就解决了这一问题。
ArrayList的扩容机制表现在add()方法上，先看add()方法的源码：
```bash
public boolean add(E e) {
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    elementData[size++] = e;
    return true;
}

private void ensureCapacityInternal(int minCapacity) {
    ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
}

//获取最小容量
private static int calculateCapacity(Object[] elementData, int minCapacity) {
    if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        return Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    return minCapacity;
}

//判断是否需要扩容
private void ensureExplicitCapacity(int minCapacity) {
    modCount++;

    // overflow-conscious code
    if (minCapacity - elementData.length > 0)
        grow(minCapacity);
}
```

当向ArrayList对象中添加新元素时，首先会调用ensureCapacityInternal(size)方法，size为最小扩容量；ensureCapacityInternal()方法会首先调用calculateCapacity来确定需要的最小容量；最后调用ensureExplicitCapacity()方法判断时候需要扩容。最后判断所需最小容量如果大于当前数组的空间大小，则需要扩容，调用grow()方法扩容：
```bash
private void grow(int minCapacity) {
    // 获取ArrayList中elementDaata数组的长度
    int oldCapacity = elementData.length;
    // 扩容至原来的1.5倍
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    // 判断新的数组容量够不够
    // 够了就直接使用这个长度创建新数组
    if (newCapacity - minCapacity < 0)
        // 不够就将数组的长度设置为需要的长度
        newCapacity = minCapacity;
    // 检查此时的最大值是否溢出
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    // 调用Arrays.copyOf()将elementData数组数据拷贝到新数组
    // 并将elementData指向新数组newCapacity的内存地址
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

**总结**： ArrayList扩容的本质就是计算所需扩容size得到新的数组，将原数组中的数据复制到新数组中，最后将原数组指向新数组在堆内存的引用地址即可。

---

#### HashMap和HashTable的区别？
1、HashMap和HashTable都实现了Map接口，主要区别在线程安全性、同步、速度
2、线程是否安全： HashMap非同步线程不安全，HashTable同步线程安全。HashTable内部的方法都经过synchronized修饰。
3、效率: HashMap线程不安全效率高，HashTable线程安全效率低。
3、对null key和null value的支持： HashMap中，null可以作为key，这样的key只有一个，但可以有多个key对应的值为null；在HashTable中的key不能为null
5、底层数据结构： JDK1.8后的HashMap在解决哈希冲突时有了较大的变化，当链表长度大于阀值时（默认是8），将链表转换为红黑树，以减少搜索时间。HashTable没有这样的机制。

---

#### HashMap和HashSet区别?
**HashSet底层采用HashMap实现**
HashMap|HashSet
:--|:--
实现了Map接口|实现了Set接口
储存键值堆|仅储存对象
调用put()向Map中添加元素|调用add()向Set中添加元素
HashMap使用Key计算HashCode|HashSet使用成员对象来计算hashCode值，对于两个对象来说，hashCode可能相同，所以用equals判断对象的相等性

---

#### HashSet如何检查重复？
在前面讲hashCode和equals时就提到了，HashSet集合同样适用。向HashSet中存入一个元素，HashSet首先会根据对象的hashCode值判断当期集合中此hashCode对应的位置有没有值，如果没有就直接添加，如果有就再调用equals方法比较两个对象是否相同，相同就不再储存（保证了Set集合不重复的特性），否则就散列到其他位置储存。

---

#### HashMap底层实现？
Map在Java中的实现由很多，HashMap便是其中之一，随着JDK版本的更新，HashMap的实现也在不断更新：
+ <=JDK1.7: Table数组 + Entry链表
+ >=JDK1.8: Table数组 + Entry链表/红黑树

#### Hash

**Hash（哈希、散列）**，就是把任意长度的输入通过散列算法变换成固定长度的输出，该输出就是散列值。
Hash函数的一种实现：
直接取余法： f(x) = x mod max
位运算法： f(x) = x & max
HashMap采用 位运算法，相比直接取余，位运算直接对内存中的二进制数据操作，不需要再转阿欢为十进制，因此处理速度很快：
```bash
7 & 33 = 1
    
    000111
  & 100001
  --------
    000001 = 1

```

---

#### Hash冲突
假设将100个数据通过Hash散列后存储到10个不同的容器中，必定会出现多个元素分布到同一个容器中。具体到HashMap集合中，若将多个K-V数据存入put，HashMap根据元素key计算到对应的hashCode值，如果计算得到多个不同的key对应的hashCode值相同（即要储存到同一位置），此时这种现象就称为 Hash冲突。
HashMap默认采用了 链地址法 解决Hash冲突问题，即通过类似单链表的方式将 冲突的元素 串起来，搜索时遍历这个链表即可。注意： 如果冲突的Hash越来越多，这个链就会越来越长。

---

#### 实现原理
![hash冲突与实现原理](http://cdn.tycoding.cn/8db4a3bdfb238da1a1c4431d2b6e075c_hd.png)
这里我们需要了解两个名词：
Table: 哈希桶数组（哈希表），存放Node元素，底层是一个Node[] table
Node: 节点元素，Node是HashMap的一个内部类，实现了Map.Entry接口，本质是一个映射（K-V）
HashMap内部的一些关键属性需要了解：
DEFAULT_INITIAL_CAPACITY: Tabale数组的初始化长度，默认是1 << 4，2^4 = 16
MAXIMUM_CAPACITY: Table数组最高长度，默认为1 << 30，2^30 = 1073741824
DEFAULT_LOAD_FACTOR: 负载因子，当总元素数 > 数组长度 * 负载因子时，Table数组将扩容，默认是0.75
TREEIFY_THRESHOLD: 树化阀值，当单个Table内Node数量超过该值，则将链表转换为红黑树，默认是8
UNTREEIFY_THRESHOLD: 链化阀值，当扩容期间单个Table的Entry数量小于该值，则将红黑数转换为链表，默认为6
MIN_TREEIFY_CAPACITY: 最小树化阀值，当Table中所有元素超过该值，才会进行树化
size: 当前HashMap实际存在的键值对数量
threshold: HashMap所能容纳的最大数据量的Node（键值对）个数。Node[] table初始化长度length是16，loadFactor负载因子默认是0.75，threshold = length * loadFactor
loadFactor: 负载因子，默认是0.17
modCount: 记录HashMap内部结构发生变化的次数
HashMap内部存在一个NodeTable数组，这个数组的初始化长度是DEFAULT_INITIAL_CAPACITY，他是一个单向链表：
```bash
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash; //key的Hash值
    final K key; //key
    V value; //value
    Node<K,V> next; //下一个节点
}
```

参考单链表的结构，Table中每个Node节点包含两个部分，Node元素作为节点的header，next指向下一个节点。**这种链式结构的存在正是为了解决Hash冲突**

栗子：
```bash
map.put("loonycoder", "18");
```
HashMap将根据"loonycoder"这个Key得到其hashCode值，然后经过Hash算法定位到其在HashMap储存的位置，如果两个不同的key定位到了同一个位置，此时就发生了Hash冲突。
在JDK1.7之前，解决Hash冲突的方式是将冲突的Node节点放在一个链表中。在JDK1.8中，当Table中链长超过TREEIFY_THRESHOLD阀值后，会将链表转换为红黑树的实现TreeNode:
```bash
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
    TreeNode<K,V> parent;  // red-black tree links
    TreeNode<K,V> left;
    TreeNode<K,V> right;
    TreeNode<K,V> prev;    // needed to unlink next upon deletion
    boolean red;
}
```
当发生**Hash冲突**时，根据HashMap默认采用的 **链地址法**，即将冲突的Hash串成一个链式结构储存到HashMap对应的位置。但是 随着Hash冲突越来越多，这个**链将越来越长**，这就将导致遍历碰撞key时的消耗不断增加，也就直接导致了性能的不足。在JDK1.8后，HashMap对单个Table中的Node超出某个阀值后，将开始树化操作（链表转换为红黑树），这对搜索的性能将会有很大的提升。
![地址链法](http://cdn.tycoding.cn/JDK1.8之后的HashMap底层数据结构.jpg)

**总结**
到此，我们总结一下HashMap的实现原理：
+ HashMap根据key的hashCode值存储元素。put新元素会遍历链表，根据新元素的key计算hashCode得到散列位置，如果该位置有值再调用equals判断value是否相同，相同就散列到其他位置储存。
+ HashMap在put新元素时如果遇到key对应的hashCode相同，可能会产生Hash冲突问题。HashMap的做法是采用链式结构（链表）储存存在Hash冲突的元素，查询时再遍历这个链接结构元素集合即可。
+ 如果发生Hash冲突的元素很多，这个 **链** 将很长，影响到遍历key消耗性能的增加，于是判断当Table中Node节点大于默认值8时，将链表转换为红黑树（TreeNode）存储元素。

---

#### Collection和Collections的区别？
+ Collection是集合类的上级接口，继承他的接口主要有Set和List
+ Collections仅是针对集合类封装的一个工具类，在java.util包下

---

#### Comparable和Comparator的区别？

+ Comparable接口来自java.lang包，提供compareTo(Object obj) 方法排序
+ Comparator接口来自java.util包，提供compare(Object obj1, Object obj2)方法排序
当需要对一个集合采用一种方式排序，使用Comparable接口；如果需要对一个集合采用两种排序方式就使用Comparator接口。

#### Java集合框架总结

##### Collection
![Collection](http://cdn.tycoding.cn/QQ20190623-181246.png)

**List**

ArrayList: Object数组，线程不安全，查询快，增删慢，效率高
Vector: Object数组，线程安全，查询快，增删慢，效率低
LinkedList: 双向链表，线程不安全，查询慢，增删快，效率高

**Set**

HashSet: 无序、唯一，基于HashMap实现，底层采用HashMap存储元素
LinkedHashSet: LinkedHashSet继承自HashSet，并且其内部通过LinkedHashMap实现
TreeSet 有序、唯一，红黑树

##### Map
![Map](http://cdn.tycoding.cn/QQ20190623-181259.png)

+ HashMap: JDK1.8之前HashMap由数组和链表组成，数组时HashMap的主体，链表是为了解决Hash冲突问题。JDK1.8之后当Table中Node数量大于8时，就将链表转换为红黑树，以减少搜索时间提高效率。
+ LinkedHashMap: LinkedHashMap继承自HashMap，所有他的底层仍然由数组和链表/红黑树实现。另外，LinkedHashMap在上面的结构基础上，增加了一条双向链表，使得上面的结构可以保持键值对的插入顺序。
+ HashTable: 数组+链表组成。数组时HashTable的主体，链表是为了解决Hash冲突问题
TreeMap: 红黑树

---

### Java并发

#### 线程和进程的区别？
+ 进程是程序的一次执行过程，是系统运行程序的基本单位
+ 线程与进程类似，但线程是一个比进程更小的执行单位。一个进程执行过程中可以产生多个线程，
在Java中，启用一个main方法就是启动了一个JVM进程，而main函数所在的线程就是这个进程中的一个线程，也称为主线程。

---

#### 从JVM角度分析进程和线程的关系？
根据JVM的内存划分，对于线程而言：多个线程共享进程的堆、方法区资源，但每个线程又有自己的程序计数器、虚拟机栈、本地方法栈。

也就是说，在一个JVM进程中，可以存在多个线程，每个线程都共享了这个JVM进程的方法区、堆；并且每个线程又都具有自己的虚拟机栈、本地方法栈、程序计数器等。

##### 为什么方法区和堆是线程共享区？
+ **方法区（Method Area）** 存储已被虚拟机加载的类信息、常量、静态变量等数据。方法区中又包含 运行时常量池 ，这部分区域储存Class文件信息和编译期生成的各种字面量和符号引用。
+ **堆（Heap）** 堆内存储存了对象实例（比如new关键字创建的实例对象），它是JVM中内存区最大的一块区域。
所以，一个进程的启动可能包含了多个线程，而这个进程中的静态变量等都是随着类加载而加载的，他应该不属于某个线程独有，所以将其存储于方法区中。对象实例都储存在Java堆内存中，作为Java最大的一块内存区域，肯定不能是某个线程独占的。

##### 为什么虚拟机栈和本地方法栈是线程独占区？
+ **虚拟机栈**： 每个Java方法执行的同时都会创建一个栈帧储存局部变量表、操作数栈、方法出口等。从方法的执行到结束，对应将栈帧压入Java虚拟机栈和从虚拟机栈中弹出的过程。
+ **本地方法栈**： 本地方法栈类似Java虚拟机栈，只不过Java虚拟机栈为虚拟机执行Java方法服务，而本地方法栈则为虚拟机使用到的native方法服务。

##### 程序计数器是什么？

**程序计数器（Program Counter Register）**：当前线程执行的字节码的行号指示器。每个线程都有独立的程序计数器。此内存区域是Java虚拟机中唯一一个没有任何OutOfMemoryError情况的区域。

---

#### 说说并行和并发的区别？
+ **并行**： 同一时间段，多个任务都在执行（单位时间内不一定同时执行）
+ **并发**： 单位时间内，多个任务同时执行。

---

#### 使用多线程可能带来什么问题？
并发编程的目的就是提高程序的执行效率，但并发编程可能造成：内存泄漏、上下文切换、死锁等问题

---

#### 说说线程的生命周期和状态？
状态名称|状态说明
:--|:--
new|初始状态，线程被创建，但还没有调用start()方法
runnable|运行状态，Java线程将操作系统中就绪和运行两种状态统称为“运行中”
blocked|阻塞状态，表示线程阻塞于锁
waiting|等待状态，线程需要等待当前线程或其他线程执行完成
time_waiting|超时等待状态，他可以实现在指定时间后自动返回
terminated|终止状态，表示当前线程已经执行完毕

对应，程序会因为不同代码的执行产生不同的状态，如下图：
![线程图](http://cdn.tycoding.cn/Java+线程状态变迁.png)
如上，线程创建后将进入NEW（初始）状态，调用start()开始运行，当线程执行wait()方法后，线程将进入WAITING（等待）状态，可以通过wait(long)或join(long)等方法终止等待状态；当线程调用同步方法时，在没有获取到锁的情况下，线程将会进入到BLOCKED（阻塞）状态。

---

#### 什么是上下文切换？
简单来说，并发编程中实际线程的数量都可能大于CPU核心的个数，而COU一个核心在任意时刻只能被一个线程使用，CPU为了保证并发的线程都有被执行，采用**随机分配时间片并轮转**的方式；而一个线程的时间片用户将保存并进入就绪状态直到下次分配时间片再执行，这个 **任务从保存到再加载的过程就是一次上下文切换**。

---

#### 什么是死锁？如何避免?
举例：线程A持有资源2，线程B持有资源1，在线程A、B都没有释放自己所持有资源的情况下（锁未释放），他们都想同时获取对方的资源，因为资源1、2都被锁定，两个线程都会进入相互等待的情况，这种情况称为死锁。
![死锁](http://cdn.tycoding.cn/2019-4死锁1.png)
栗子：
```bash
public class DeadLockDemo {
    private static Object resource1 = new Object();//资源 1
    private static Object resource2 = new Object();//资源 2

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "线程 1").start();

        new Thread(() -> {
            synchronized (resource2) {
                System.out.println(Thread.currentThread() + "get resource2");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource1");
                synchronized (resource1) {
                    System.out.println(Thread.currentThread() + "get resource1");
                }
            }
        }, "线程 2").start();
    }
}
```

Output：

```bash
Thread[线程 1,5,main]get resource1
Thread[线程 2,5,main]get resource2
Thread[线程 1,5,main]waiting get resource2
Thread[线程 2,5,main]waiting get resource1
```
线程1以resource1作为同步监视器，即可以轻松获取resource1同时也锁定了resource1，此时调用sleep让线程1等待1秒钟；此时线程2开始执行，他以resource2作为同步监视器同时也锁定了resource2，此时调用sleep让线程2等待1秒钟；而此时线程1等待1秒已经结束了，当他想要获取resource2时发现resource2已经被线程2锁定了，同理线程2结束等待后想要获取resource1时发现resource1已经被线程1锁定了。那么两者都无法同时获取对方的线程，便进入死锁状态。
因此产生死锁需要具备以下四个条件：

1、互斥条件：该资源任意一个时刻只能由一个线程占用
2、请求和保持条件：一个线程因请求资源而阻塞时，对已获取的资源保持不放
3、不剥夺条件：线程已获取的资源在未使用完之前不能被其他线程强行剥夺，只有自己使用完毕后才使用资源
4、循环等待条件：若干进程之前形成一种头尾相接的循环等待资源关系。

避免死锁就要破坏这四个条件中任意一个：
1、破坏互斥条件：这个条件我们无法破坏，因为我们用锁的目的就是想让他们互斥
2、破坏请求与保持条件：一次性申请所有资源
3、破坏循环等待条件：按照一定顺序申请资源，避免资源的循环使用

解决方案: 修改线程2
```bash
new Thread(() -> {
    synchronized (resource1) {
        System.out.println(Thread.currentThread() + "get resource1");
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println(Thread.currentThread() + "waiting get resource2");
        synchronized (resource2) {
            System.out.println(Thread.currentThread() + "get resource2");
        }
    }
}, "线程 2").start();
```

Output：
```bash
Thread[线程 1,5,main]get resource1
Thread[线程 1,5,main]waiting get resource2
Thread[线程 1,5,main]get resource2
Thread[线程 2,5,main]get resource1
Thread[线程 2,5,main]waiting get resource2
Thread[线程 2,5,main]get resource2

Process finished with exit code 0
```

---

#### 说说sleep()方法和wait()方法的区别？
两者最主要的区别在于：**sleep 方法没有释放锁，而 wait 方法释放了锁**
+ 两者都可以暂停线程的执行
+ wait()通常用于线程间交互/通信，sleep()通常用户暂停执行
+ wait()方法被调用后，线程不会自动苏醒，需要别的线程调用同一对象上的notify()或者notifyAll()方法。sleep()方法执行完成后，线程会自动苏醒。

---

#### 调用start()方法会执行run()方法，为什么不能直接调用run()方法？
new一个Thread，线程进入了新建状态；调用start()方法，会启用一个线程并使线程进入就绪状态，当分配到时间片后就可以开始执行。start()会执行线程的相应准备工作，然后自动执行run()方法的内容，这才是真正的多线程工作。而直接执行run()方法，会吧run()方法当做一个main线程下的一个普通方法去执行，并不会在某个线程中执行他。
**总结：调用start方法可以启动线程并使线程进入就绪状态，而run()方法只是Thread的一个普通方法调用，还是在main主线程里执行，并不会在一个新线程中执行**

---

#### synchronized关键字
synchronized关键字解决多个线程之间访问资源的同步性，synchronized关键字可以保证它修饰的方法或代码块在任意时刻只能有一个线程执行。
synchronized关键字最主要的三种使用方式：
+ **修饰实例方法**： 给当前对象加锁，进入同步代码块前要获取当前对象实例的锁
```bash
// 此处的`synchronized`就相当于`synchronized(this)`，锁定的是当前对象
public synchronized void add() {}
```
+ **修饰静态方法**： 给当前类加锁（因为静态方法没有this），会作用于当前类的所有对象实例，因为静态成员不属于任何一个实例对象，是一个类成员。
```bash
// 此处的`synchronized`就相当于`synzhronized(T.class)`，(T的当前类)
public synchronized static void add() {}
```

+ **修饰代码块**：指定加锁对象，对给定对象加锁，进入同步代码块之前要获取给定对象的锁

---
