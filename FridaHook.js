function HexDump(p) {
    try {
        return hexdump(p) + "\r\n";
    } catch (error) {
        return ptr(p) + "\r\n";
    }

}


function GetJavaStackTrace() {

    let StackTrace = Java.use("java.lang.Exception").$new("Exception").getStackTrace();
    let straces = ''
    if (undefined === StackTrace) return;
    for (let i = 0; i < StackTrace.length; i++) {
        let str = "   " + StackTrace[i].toString() + "\r\n";
        straces += str
    }
    return straces;
}


function GetJavaLog(ClassName, FunName, ActionName, args = null, retval = null, overload = null, Stacks = null) {
    let log = {
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
    if (args !== null) {
        log['data']["args"] = args
    }
    if (retval !== null) {
        log['data']['retval'] = retval
    }
    if (overload !== null) {
        log["overload"] = overload
    }
    if (Stacks !== null) {
        log['StackTrace'] = Stacks
    }

    return JSON.stringify(log);

}


function GetNativeLog(SoName, FunAddr, onEnter = null, onLeave = null, retval = null, Stacks = null) {
    let log = {
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
    if (onEnter !== null) {
        log['data']["args"]["onEnter"] = onEnter
    }
    if (onLeave !== null) {
        log['data']["args"]['onLeave'] = onLeave
    }
    if (Stacks !== null) {
        log['StackTrace'] = Stacks
    }
    return JSON.stringify(log);
}


function GetCallResult(obj, FuncName, args) {
    let result;
    if (args !== null) {
        result = obj[FuncName](...args)
    } else {
        result = obj[FuncName]()
    }
    return result
}


function CallJavaMethod(ClassName, FuncName, args = null, cargs = null, state = false, NeedCreate = false) {
    //主动调用任意函数
    Java.perform(function () {
        if (state) { //对象调用
            if (NeedCreate) {//主动创建实例
                let CallClassObj //获取实例
                if (cargs !== null) {
                    CallClassObj = Java.use(ClassName).$new(...cargs)

                } else {
                    CallClassObj = Java.use(ClassName).$new()
                }
                let result = GetCallResult(CallClassObj, FuncName, args)
                let msg = GetJavaLog(ClassName, FuncName, "Call", args, result)
                console.log(msg)
            } else {
                Java.choose(ClassName, {//从内存寻找实例
                        onMatch: function (obj) {
                            let result = GetCallResult(obj, FuncName, args)
                            let msg = GetJavaLog(ClassName, FuncName, "Call", args, result)
                            console.log(msg)
                        }, onComplete: function () {

                        }
                    }
                )
            }
        } else {//静态调用
            let CallClass = Java.use(ClassName)
            let result = GetCallResult(CallClass, FuncName, args)
            let msg = GetJavaLog(ClassName, FuncName, "Call", args, result)
            console.log(msg)
        }

    })


} //主动调用java任意函数


function JavaHook(className, FunName, overload = null) {
    //Hook任意函数
    Java.perform(function () {
        let HookClass = Java.use(className);
        if (overload == null) {
            HookClass[FunName].implementation = function (...args) {
                let result = this[FunName](...args)
                let Stacks = GetJavaStackTrace()
                let msg = GetJavaLog(className, FunName, "Hook", args, result, overload, Stacks)
                console.log(msg)
                return result
            }
        } else {
            HookClass[FunName].overload(...overload).implementation = function (...args) {
                let Stacks = GetJavaStackTrace()
                let result = this[FunName](...args)
                let msg = GetJavaLog(className, FunName, "Hook", args, result, overload, Stacks)
                console.log(msg)
                return result

            }
        }
    })


}


function NativeHook(SoName, addr, args_num) {
    //native hook任意函数
    let BaseAddr = Module.findBaseAddress(SoName)
    let RealAddr = BaseAddr.add(addr)
    let FunAddr = ptr(RealAddr).sub(BaseAddr)
    let onEnterLogs = []
    let onLeaveLogs = []
    Interceptor.attach(RealAddr, {
        onEnter: function (args) {
            this.params = []
            for (let i = 0; i < args_num; i++) {
                this.params.push(args[i])
                onEnterLogs.push(HexDump(args[i]) + "\r\n")
            }

        },
        onLeave: function (retval) {

            for (let i = 0; i < args_num; i++) {
                onLeaveLogs.push(HexDump(this.params[i]) + "\r\n")
            }
            let result = HexDump(retval) + "\r\n"
            let Stacks = Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n'
            let msg = GetNativeLog(SoName, FunAddr, onEnterLogs, onLeaveLogs, result, Stacks)
            console.log(msg)

        }


    })


}


function main() {

    JavaHook("com.example.hellojni.HelloJni","sign2",null)
    NativeHook("libhello-jni.so", 0x12D70, 3)
    
}


setImmediate(main)





