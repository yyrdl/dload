# Dload

hot-reload plugin for node.js

# Useage

`npm install dload`

# require & reload
```js
/**
  * prepare
  * 准备工作
  */

const dload = require("dload");
const mo = dload.new();

/**
  require the target module
  for example：
*/

mo.m3 = require("./module3.js")
mo.path = require("path");


//when need to reload 'module3.js',just run the code below:

dload.reload(mo.path.join(__dirname,"./module3.js"));

//mo.m3 will be updated automatically

```

Full example is in the directory `example`.
完整示例在example文件夹下


# _release

Some modules need to release resource manually when reload. you can define a method named `_release` for the module to achieve this.

一些模块在热加载之前需要手动释放资源，可以为这样的模块定义一个名为`_release`的方法。

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


# Warning

不要做下面这样的操作:
Don't do operation like this:

```js
const m3 = mo.m3;
//******
```
This operation will make target module out of dload's control.
这会使dload丧失对目标模块的控制。
