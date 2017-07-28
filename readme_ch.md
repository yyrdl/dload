# Dload

node.js 热加载模块.

# 安装

`npm install dload`

# require & reload

假设有三个文件,分别是m1.js ,m2.js,m3.js. 其中m2.js和m3.js都依赖m1.js,演示一下热加载.

`m1.js` 的内容：

```js
exports.name="abc";

```

`m2.js` 的内容：

```js
/**
  使模块具备热加载功能的初始步骤
*/
const dload = require("dload");
const mo = dload.new();

mo.m1 = require("./m1.js");//加载m1.js，这里只是普通的加载

//暴露一个简单的方法
exports.func=function(){
  return mo.m1.name;
}

```

`m3.js`的内容:

```js
/**
  使模块具备热加载功能的初始步骤
*/
const dload = require("dload");
const mo = dload.new();

mo.fs = require("fs");
mo.co = require("zco");//npm install zco
mo.path = require("path");//npm install path
mo.m2 = require("./m2.js");//加载m2.js
mo.m1 = require("./m1.js");

const m1_content='exports.name="abc";';

mo.co(function*(co_next){

    let data = mo.m2.func();

    console.log(data);//打出"abc"

    /**
      开始修改m1.js的内容，并重新加载m1.js
    */
    let new_content = m1_content.replace(/abc/,"hello world");

    yield mo.fs.writeFile("./m1.js",new_content,co_next);//重写m1.js文件

    dload.reload(mo.path.join(__dirname,"./m1.js"));//重新加载m1.js（即热加载）;

    data = mo.m2.func();

    console.log(data);//打出 "hello world"

    console.log(mo.m1.name);// 打出 "hello world"

})()

```

在m3.js中 ，热加载之前先打印了m2的执行结果，然后修改m1.js的内容，再热加载m1.js。接着直接运行mo.m2.func ，从打出的
结果来看 m1.js的修改已经更新到m2.js ，也更新到了m3.js。 也即热加载成功。

在项目的example文件夹下有更完整和复杂的例子。


# _release

一些模块在热加载之前需要手动释放资源，可以为这样的模块定义一个名为`_release`的方法。
热加载更新之前会先调用这个方法去释放资源。

example:

```js

const  handler = setInterval(function(){
   //... do something
},1000)

//exports.xxx= xxx;
//exports.xxx= xxx;
//exports.xxx= xxx;

//dload will run this method before reload
exports._release = function(){
   if(handler){
     clearInterval(handler);
   }
}
```

# dload 是怎样工作的

在例子代码中看到的mo 是由dload.new()返回，初始的时候是一个空对象，关键这个对象也被dload内部持有，之后加载的模块都附着在
mo上，当重新加载目标模块时，dload 会删除模块系统和mo上的老的模块的引用，再加载新的模块，并将其重新附在mo上。这样就完成了
全局的模块更新和老的模块的删除，因为在这个模式下老的模块的引用只存在于模块系统和mo上，都是可控的，也就避免了内存泄露的问题。



# Warning

不要做下面这样的操作:


```js
const m3 = mo.m3;
//******
```

这会使dload丧失对目标模块的控制。

若模块有需要手动释放的资源，还需要定义`_release`方法！！！
