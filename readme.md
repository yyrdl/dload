
[中文文档](https://github.com/yyrdl/dload/blob/master/readme_ch.md)
# Dload

`dload` is a hot-reload tool for node.js. You can use it to reload your module gracefully ,and your server would not restart.


__Fist Of All__ : It's very difficult to implement a safety hot-reload tool.`dload` can't cover  everything for you ,it just provide

a nice way to mannage the reference of  modules,and update module globally without any extra code.You should be careful of the resource

created by the hot module.And the best way is that the hot module dosen't create anything,it just takes an input and returns an output.



# Useage

`npm install dload`

```js
const dload = require("dload");
const path = require("path");
const mo = dload.new();

mo.hot_module = require("./hot_module.js");

// ... do some change  to `hot_module.js` ,and save the file

dload.reload(path.join(__dirname,"./hot_module.js"));

//mo.hot_module is reloaded.

```

# Reload

`dload.reload(full_path_of_target_module)`

The method (`dload.reload`) will reload target module ,and replace old module with new module globally. The only argument of `dload.reload`
is the full path of target module. And it will reload  recursively,which means the child module will be reloaded at the same time.

You can use this method to reload a module when something is changed.

__Example__:

The example will show how to use `dload`.There will be three files in the same directory ,and  will rewrite one of them ,then reload it. You will
 see that all of the changes come into effect immediately.

File : `my_hot_module.js`

```js
  exports.content = "abc";
```

File : `a_user_of_hot_module.js`

```js

const dload = require("dload");
const mo = dload.new();

mo.my_hot_module = require("./my_hot_module.js");

exports.run=function(){
  return mo.my_hot_module.content;
}
```

File : `test.js`

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

    console.log(data);//output "abc"

    /**
       let's modify the content of my_hot_module.js  and reload it .
    */
    let new_content = my_hot_module_content.replace(/abc/,"hello world");//replace `abc` to `hello world`

    yield mo.fs.writeFile("./my_hot_module.js",new_content,co_next);//rewrite file `my_hot_module.js`

    dload.reload(mo.path.join(__dirname,"./my_hot_module.js"));//reload file `my_hot_module.js`

    data = mo.user_of_hot_module.run();

    console.log(data);//output  "hello world"

    console.log(mo.my_hot_module.content);// output "hello world"

})()

```

Just run `test.js` ,It will output:
```
abc
hello world
hello world
```

In `test.js` ,we rewrite file `my_hot_module.js`,replace  text "abc"  with "hello world", and then  reload `my_hot_module.js` by invoking `dload.reload`.
After that ,we invoke the method `run` of `a_user_of_hot_module.js` immediately ,which will return the `content` export by `my_hot_module.js`, and print
the result, as you can see ,it print `hello world` ，which means the changes of `my_hot_module.js`  come into affect.

What's graceful is that all you need to do is just call `dload.reload`, you do not need to require the target module manually again ,and the process would
not restart.

In the example,the `my_hot_module.js` is modified by the process itself,in most cases,we watch a list of files by `fs.watch`,when some of them are changed
we reload it.


# _release

Some modules need to release resource manually before they are reloaded. you can define a method named `_release` for this kone of  module to achieve this.



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

`dload.reload_one_file(full_path_of_target_module)`

`dload.reload` will delete the old module and reload recursively ,so the child modules (the module tree built by node.js's require system)
will be deleted at the same time.But in most cases ,only a few files are changed ,we just want to reload a single file. Now, you can use
`dload.reload_one_file` to achieve this.



# How does it work

The `mo` in the example code is returned by `dload.new()`, at first ,`mo` is an empty object.What's important is
'mo' is also hold by __dload__. When module is been reloaded ,__dload__ just assign the new module to `mo`, this operation will
update target module globally.Because the reference of old module only exist in module system and `mo`,and they are all
under control,so there is no problem with memory management.


# Warning

Don't do operation like this:

```js
const m3 = mo.m3;
//******
```
This operation will make target module out of dload's control.



