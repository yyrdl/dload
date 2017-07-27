# Dload

hot-reload plugin for node.js

# Useage

`npm install dload`

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

```

Full example is in the directory `example`.
完整示例在example文件夹下

# Warning

不要做下面这样的操作:
Don't do operation like this:

```js
const m3 = mo.m3;
//******
```
This operation will make target module out of dload's control.
这会使dload丧失对目标模块的控制。
