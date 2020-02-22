---
title: 算法学习之各种排序算法
categories:
    - 算法
    
date: 2018-08-16 19:44:20
tags:
	- 数据结构
    - 算法
---

### 算法学习

#### 时间复杂度
算法有时间和空间的**复杂度**，这是可以衡量的。**时间复杂度**–运行它花了多少时间；**空间复杂度**–运行它需要多少内存。
**常数时间**操作：一个操作如果和数据量没有关系，每次都是固定时间内完成的操作，叫做**常数操作**。常数时间的操作记为**O(1)**

##### 大O表示
比如我们称算法 B 有与n²成比例的时间需求，我们说B是 **O(n²)**的(读作big O(n²))
具体而言，在**常数操作**数量的表达式中，**只要高阶项，不要低阶项，也不要高阶项的系数，剩下的部分若记为f(N)**，那么在**最差情况下，算法流程的指标（时间复杂度**）为 O(f(N))。**
比如符合 aN² + bN + C 操作的事件复杂度就是 **O(n²)**

##### 示例
**遍历算法：**
比如有 1,2,3,4,5 这几个数，我们需要遍历得到这些数，那么每次遍历的时间复杂度称为**O(N)**的话，那么一共有M个数，就称遍历算法的事件复杂度是: O(M * N)。（区分 O(1) 表示常数操作，这里的 O(N) 表示时间复杂度）。
**二分查找算法**
比如有 1,2,3,4,5 二分查找算法，就是实现将已有数列分为Right Left 两列（不一定相等），然后依次从Right、Left中查找，如果找到了就不用找另一侧（比如在Right中查找，再将Right分为right left两列进行查找）。这种算法比遍历算法要简单。
那么因为每次查找都是先将数列分为两列，再进行查找，那么一个数列一共可以分 logN 次，所以二分查找算法的事件复杂度就是 log(M * logN)

#### 递归算法
当解决一个问题的时候，将它划分为更小的问题且用相同的方法进行解决。这种特殊的处理称为**递归**。递归的关键是：最终你能到达一个较小的问题，且这个小问题是很容易解决的。
故：**调用自己的方法称为递归方法**。调用是递归调用。
设计一个递归方案，应该考虑哪些问题？
方案的那个部分的工作能让你直接完成？
哪些较小问题已经有了解决方案。
该递归过程何时结束？
若递归方法没有设计**终止情形**，将**永远执行**，这种情形称为**无穷递归**。
总结来说：**递归函数**就是自己调用自己的函数。系统帮你压栈，将当前函数的所有信息储存到栈内存中，当调用**子过程**时，只储存每次子过程调用具体的变量值。若递归结束，调用栈顶的函数信息并还原函数的原始状态。

##### 跟踪递归方法
通常而言，跟中一个递归算法过程是比较复杂的，如果你按照一定的准则设计递归方法，一般是无需跟踪它们。这里我一个**倒计时**递归举例：
```bash
public class Code_Recursive {

    public static void countDown(int integer) {
        if (integer >= 1) {
            System.out.println(integer);
            countDown(integer - 1);
        }
    }

    public static void main(String[] args) {
        countDown(3);
    }
}
```
这将打印出来3、2、1 倒计时数字，使用的正是递归的方法。它符合了以下设计准则：
- 这个倒计时打印（显示）的工作是可以直接完成的。
- 该递归方法最终是化小为打印一个数字，这是可以直接 sys 解决的。
- 该递归方法执行到integer参数为1时就结束递归。

**实现过程**
![math](/images/math1.png)
可以看到，图中是countDown(3)的递归调用过程，其中出现了多个countDown方法的副本，但其实我们就写了一个递归方法。
也就是说对方法的每次调用（递归或非递归）Java都记录方法执行的当前状态，包含它的参数和局部变量的值，以及当前指令的位置。每个记录称为一个活动记录，它提供运行期间方法状态的快照。记录放入程序栈中。栈按照时间先后组织这些记录，所以当前正在执行的方法的记录位于栈顶。Java可以暂停递归方法的运行，并用新的变量值再次调用它。

##### 时间复杂度
**master公式**
![math](/images/math2.png)

#### 冒泡排序
时间复杂度：O(N² )
在一个一维数组中，冒泡排序就是实现数组中相邻两个索引位置值的大小比较，若条件符合就不动，如果条件不符合就将两个索引位置的值进行交换。且外层循环决定了外层一共需要循环多少次，且决定了外层循环一次内层需要循环多少次，外层一次循环才能排序好一个值（最大最小），下次循环就忽略掉这个极值从剩余的数据中得出极值，然后依次这样。
![math](/images/math3.png)
实现代码：
```bash
public class Code_00_BubbleSort {

    public static void bubbleSort(int[] arr) {
        if (arr.length < 2 || arr == null) {
            return;
        }

        for (int i = arr.length - 1; i > 0; i--) {
            for (int j = 0; j < i; j++) {
                if (arr[j] > arr[j + 1]) {
                    swap(arr, j, j + 1);
                }
            }
        }
    }

    public static void swap(int[] arr, int i, int j) {
        int tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    public static void main(String[] args) {
        int[] arr = {3, 2, 0, 7, 4};
        System.out.println(Arrays.toString(arr));
        bubbleSort(arr);
        System.out.println(Arrays.toString(arr));
    }
}
```
其中我们对数组arr[3,2,0,7,4]进行从大到小的排序，在bubbleSort方法中，外层循环arr.length-1次，内层每次循环arr.length-1次。

#### 选择排序
时间复杂度：O(N²)
选择排序，首先我们需要一个minIndex，记录最小值，然后将当前索引位置的值与后面索引位置的值依次比较,如果符合条件，就将此索引赋值给minIndex，再进行交换值（因为此时极限值minIndex改变了）。
可以看到这种方式比上面的冒泡排序简单很多。
![math](/images/math4.png)
实现代码：
```bash
public class Code_01_SelectionSort {

    public static void selectionSort(int[] arr) {
        if (arr.length < 2 || arr == null) {
            return;
        }
        for (int i = 0; i < arr.length - 1; i++) {
            int minIndex = i;
            for (int j = i + 1; j < arr.length; j++) {
                minIndex = arr[j] < arr[minIndex] ? j : minIndex;
            }
            swap(arr, i, minIndex);
        }
    }

    public static void swap(int[] arr, int i, int j) {
        int tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    public static void main(String[] args) {
        int[] arr = {3, 2, 0, 7, 4};
        System.out.println(Arrays.toString(arr));
        selectionSort(arr);
        System.out.println(Arrays.toString(arr));
    }
}
```

#### 递归选择排序
时间复杂度：O(N²)
根据前面讲到的递归算法的设计，我们首先要明白：

- 递归方案的哪些工作是可以直接完成的？
	- 1.动态替换minIndex的值；
	- 2.交换minIndex和当前索引；
- 递归化到最小问题是什么？
	- 得到一个索引比minIndex索引对应的值要小，替换minIndex，并进行swap操作。
- 递归何时结束？
	- 当循环到索引值和arr.length相等就停止递归。

带着上面的思考问题，我们可以进行如下设计
![math](/images/math5.png)
想要通过递归实现选择排序，要知道**递归**是重复调用自己的过程。那么：
- 首先你把sort函数理解为一个外层圈子，而其中的for()循环是内层的圈子，内层的圈子循环完毕一次（n~arr.length），就得到一个最小值。
- 需要规定**minIndex**记录最小值的索引位置，这个值和外层的圈子有关，如果排序好的最小值不用管，直接从外层圈子范围开始循环内层圈子，所以定义for(int i=n)。
- 如果满足内层圈子循环中arr[minIndex] > arr[i]说明此索引值比当前的minIndex还要小，那么就替换minIndex。
- 内层圈子每**完全循环完毕**（n~arr.length），就swap替换对应索引位置的值。
- 最后，因sort(arr, n + 1)，当n+1等于arr.length，就停止递归。

实现代码：
```bash
public class Code_01_Recursive_SelectionSort {

    public static void sort(int[] arr, int n) {
        int minIndex = n;
        if (arr.length < 2 || arr == null || n >= arr.length) {
            return;
        }
        for (int i = n; i < arr.length; i++) {
            if (arr[minIndex] > arr[i]) {
                minIndex = i;
            }
        }
        swap(arr, n, minIndex);
        sort(arr, n + 1);
    }

    public static void swap(int[] arr, int i, int j) {
        int tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    public static void main(String[] args) {
        int[] arr = {3, 2, 0, 7, 4};
        System.out.println(Arrays.toString(arr));
        sort(arr, 0);
        System.out.println(Arrays.toString(arr));
    }
}
```

#### 插入排序
时间复杂度：O(N²)
从无需集合的1位置开始，比较其01位置的值，如比较01、20、30、40……相当于整体是根据一个有序集合（索引），将无序集合（要排序的集合）往有序集合的区间中插入。
![math](/images/math6.png)

实现代码：
```bash
public class Code_02_InsertionSort {

    public static void insertionSort(int[] arr) {
        if (arr.length < 2 || arr == null) {
            return;
        }

        for (int i = 1; i < arr.length; i++) {
            for (int j = i - 1; j >= 0 && arr[j] > arr[j + 1]; j--) {
                System.out.println("arr[" + j + "], arr[" + (j + 1) + "]");
                swap(arr, j, j + 1);
            }
        }
    }

    public static void swap(int[] arr, int i, int j) {
        int tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    public static void main(String[] args) {
        int[] arr = {3, 2, 0, 7, 4};
        System.out.println(Arrays.toString(arr));
        insertionSort(arr);
        System.out.println(Arrays.toString(arr));
    }
}
```

#### 递归插入排序
实现代码：
```bash
public class Code_02_Recursive_InsertionSort {

    public static void sort(int[] arr, int n) {
        if (arr.length < 2 || arr == null || n >= arr.length) {
            return;
        }
        for (int i = n; i < arr.length; i++) {
            for (int j = i - 1; j >= 0 && arr[j] > arr[j + 1]; j--) {
                swap(arr, j, j + 1);
            }
        }
        sort(arr, n + 1);
    }

    public static void swap(int[] arr, int i, int j) {
        int tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    public static void main(String[] args) {
        int[] arr = {3, 2, 0, 7, 4};
        System.out.println(Arrays.toString(arr));
        sort(arr, 1);
        System.out.println(Arrays.toString(arr));
    }
}
```

