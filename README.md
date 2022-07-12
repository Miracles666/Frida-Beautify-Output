
# Frida-Beautify-Output



基于Vue，快速进行Android Frida Hook并将结果美化打印到web端，方便逆向分析



## 使用方法

```
frida -o  输出json文件，文件名为index.json 保存到根目录下,打开启动server即可使用

server 推荐使用 live server  在vscode插件安装直接右键即可运行

或者 npm i server 命令行输入server也可运行

```



## FridaHook.js



#### GetJavaLog方法对应Java层日志

输出json格式为：

```
{
        "type": "Java",    // 类型名 用于辨别
        "action": ActionName,    //行动名 分别对应 call->主动调用  hook->hook
        "ClassName": ClassName,  //类名
        "FunName": FunName,//函数名称
        "data": {
            "args": [], //参数数组
            "retval": "", //返回值
        },
        "overload": "", //是否重载 有的话说明
        "StackTrace": "" //堆栈

    }
```



#### GetNativeLog方法对应Native层日志输出

输出json格式为：
```
{
        "type": "native", // 类型名 用于辨别
        "SoName": SoName,  //模块名
        "FunAddr": FunAddr,  //函数地址
        "data": {
            "args": {
                "onEnter": [], //进入
                "onLeave": [], //离开
            },
            "retval": ""  //返回值 
        },
        "StackTrace": "" //堆栈
    }
```

**里面留空的，默认值为null。**



#### CallJavaMethod方法为主动调用Java任意函数

```
ClassName, FuncName, args = null, cargs = null, state = false, NeedCreate = false

ClasName ：类名
FuncName ：函数名
args ：参数数组[] 默认为null
cargs ：构造函数参数数组[] 默认为null
state ：是否为动静态调用 默认为false 静态调用
NeedCreate： 是否需要创建实例 默认为false 不需要
```



#### JavaHook方法为Hook Java任意函数

```
className, FunName, overload

ClasName ：类名
FuncName ：函数名
overload ：重载数组[] 默认为null
```



#### NativeHook方法为Hook Native层任意函数

```
SoName, addr, args_num

SoName：SO名称
addr：函数地址
args_num：参数个数
```



## 效果

#### 使用看雪某DEMO进行演示

支持全局搜索、搜索代码高亮

![效果](/img/1.gif)