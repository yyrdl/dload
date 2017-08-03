# Dload

node.js 热加载模块.该模块允许在不重启程序的情况下重新加载指定模块。

__需要注意__: 为node.js实现一个安全的热加载工具是非常困难的。`dload` 提供了一个优雅的方式来进行热更新，但并不能解决热加载的所有
问题。开发者需要格外注意那些热更新的模块创建的资源，一定要小心释放他们。最好的方式是需要热更新的模块不持有资源,只是接受一个输入
然后给出相应的返回。

# 用法

`npm install dload`


```js
const dload = require("dload");
const path = require("path");
const mo = dload.new();

mo.hot_module = require("./hot_module.js");

// ...对'hot_module.js'做些修改，并保存

dload.reload(path.join(__dirname,"./hot_module.js"));//调用`dload.reload`重新加载

//mo.hot_module 已经被更新了

```

# Reload


`dload.reload(full_path_of_target_module)`

`dload.reload` 方法用来热加载指定模块，并更新到全局，其唯一参数是对应模块的完整路径。`dload.reload`是递归地进行热加载，
也就是说对应模块的子模块也会被重新加载.

当某一文件改变，常见的情况是文件系统监测到某一文件被修改（`fs.watch`），这时使用`dload.reload`重新加载对应文件。


__例子__:

下面的例子演示如何使用`dload`。将会有三个文件，其中一个将在运行时被修改，修改后调用`dload.reload`再重新加载，可以观测到所有的
改动将立即生效.


文件 : `my_hot_module.js`

```js
  exports.content = "abc";
```

文件 : `a_user_of_hot_module.js`

```js

const dload = require("dload");
const mo = dload.new();

mo.my_hot_module = require("./my_hot_module.js");

exports.run=function(){
  return mo.my_hot_module.content;
}
```

文件 : `test.js`

```js
const dload = require("dload");
const mo = dload.new();

mo.fs = require("fs");
mo.co = require("zco");//npm install zco
mo.path = require("path");//npm install path

mo.user_of_hot_module = require("./a_user_of_hot_module.js");
mo.my_hot_module = require("./my_hot_module.js");

const my_hot_module_content='exports.content="abc";';

mo.co(function*(co_next){

    let data = mo.user_of_hot_module.run();

    console.log(data);//输出 "abc"

    /**
       下面的代码会修改"my_hot_module.js" 导出的值，并重新加载
    */
    let new_content = my_hot_module_content.replace(/abc/,"hello world");//将`abc`替换成`hello world`

    yield mo.fs.writeFile("./my_hot_module.js",new_content,co_next);//将新内容写入 `my_hot_module.js`

    dload.reload(mo.path.join(__dirname,"./my_hot_module.js"));//重新加载 `my_hot_module.js`


    data = mo.user_of_hot_module.run();

    console.log(data);//输出  "hello world" ,不再是`abc`

    console.log(mo.my_hot_module.content);// 输出  "hello world" ,不再是`abc`

})()

```

运行 `test.js` 将会打出:
```
abc
hello world
hello world
```

在`test.js` 里面我们重写了`my_hot_module.js`,将原来的`abc`替换成`hello world` ，然后使用`dload.reload`重新加载了`my_hot_module.js`.

之后立即运行了`mo.user_of_hot_module.run()`，并打出运行的结果，`a_user_of_hot_module.js`的`run`方法返回的是`my_hot_module.js`导出的
`content`。正如大家所见，打出的是`hello world`。也即是说对`my_hot_module.js`的修改在`dload.reload`之后立即生效了。

`dload`最好的地方是热加载所需要做的事只是调用`reload`方法，不必再去`require`一遍相应的模块，并且程序不必重启。


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
# Reload_one_file

`dload.reload` 这个API是递归操作，目标模块的子模块也会被重新加载，(这里的子模块是在node.js 的require系统建立的模块依赖树下讨论的),
很多时候只有单个文件被修改，此时可以用`dload.reload_one_file`这个api来重新加载单个文件。

API ：`dload.reload_one_file(full_path_of_target_module)`

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
