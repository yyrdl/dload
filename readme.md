
[中文文档](https://github.com/yyrdl/dload/blob/master/readme_ch.md)

# Dload

Hot reload plugin for node.js

# Useage

`npm install dload`

# require & reload

API: `dload.reload(full_path_of_target_module)`

 There  are three files (m1.js,m2.js,m3.js), and  both of `m2.js` and `m3.js` depend on `m1.js`,the code below
will show how to do hot-reload:

The content of `m1.js`:

```js
exports.name="abc";

```

`m2.js`:

```js

const dload = require("dload");
const mo = dload.new();


mo.m1 = require("./m1.js");//just require m1.js


exports.func=function(){
  return mo.m1.name;
}

```

`m3.js`:

```js
const dload = require("dload");
const mo = dload.new();

mo.fs = require("fs");
mo.co = require("zco");//npm install zco
mo.path = require("path");//npm install path
mo.m2 = require("./m2.js");// require m2.js
mo.m1 = require("./m1.js"); // require m1.js

const m1_content='exports.name="abc";';

mo.co(function*(co_next){

    let data = mo.m2.func();

    console.log(data);//output "abc"

    /**
       let's modify the content of m1.js  and reload it .
    */
    let new_content = m1_content.replace(/abc/,"hello world");//replace `abc` to `hello world`

    yield mo.fs.writeFile("./m1.js",new_content,co_next);//rewrite file `m1.js`

    dload.reload(mo.path.join(__dirname,"./m1.js"));//reload file `m1.js`

    data = mo.m2.func();

    console.log(data);//output  "hello world"

    console.log(mo.m1.name);// output "hello world"

})()

```

Just run `m3.js`.

Output:

```
abc
hello world
hello world
```

From the outputs ,we will see that the module `m1` is be updated globally, and all we
need to do is just run `dload.reload(target_module)`.


# _release

Some modules need to release resource manually when reload. you can define a method named `_release` for the module to achieve this.



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

`dload.reload` will delete the old module recursively ,so the child modules (the module tree built by node.js's require system) will be deleted at
the same time.But in most cases ,only a few files are changed ,we just want to reload a single file. Now, you can use
`dload.reload_one_file` to achieve this.

API: `dload.reload_one_file(full_path_of_target_module)`


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

