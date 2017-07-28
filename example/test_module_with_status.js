
/**
 * Created by jason on 2017/7/28.
 *
 * 在test_multi_rely 的基础上测试带状态的模块的更新。
 *
 * 当多个模块依赖一个带状态的模块时，这多个模块中的一个模块更新时(并不再依赖这一个带状态的模块)
 * 应当不影响这一个带状态的模块。
 *
 * 特别的是如果更新之后依然依赖这个带状态的模块，那么这个带状态的模块也会被重新加载。
 * 因为dload不确定这个模块是否有被修改。
 *
 * 一般来讲确实应该重新加载的，因为以往不使用热加载的时候，直接重启，所有的状态都丢失了。
 * 
 * dload 只是尽量保存原来的状态。
 *
 */



const dload = require("../index");
const mo = dload.new();

mo.co = require("zco");
mo.fs = require("fs");
mo.path = require("path");

const m2_init_content = 'const dload = require("../../index");\n' +
    'const mo = dload.new();\n' +
    'mo.m1= require("./module1");\n' +
    'exports.func=function () {\n' +
    'if(mo.m1){\n' +
    'return "m2||"+mo.m1.get_counter();\n' +
    '}else{\n' +
    'return "m2";\n' +
    '}\n' +
    '}';

/**
 * didn't require module1.js,dload will try to delete module1.js, but we also require module1 in this file
 *  to see if there is influence .
 * 修改之后的module2.js 不在加载module1，dload会试图去删除module1,但在这个文件中我们也加载module1，看是否对这个文件里面
 * 的使用造成影响
 * */
const m2__content = 'const dload = require("../../index");\n' +
    'const mo = dload.new();\n' +
    'exports.func=function () {\n' +
    'if(mo.m1){\n' +
    'return "m2||"+mo.m1.get_counter();\n' +
    '}else{\n' +
    'return "m2";\n' +
    '}\n' +
    '}';

mo.co(function  * (co_next) {

    yield mo.fs.writeFile("./module_with_status/module2.js", m2_init_content, co_next);
    /**
     * m2 起初依赖m1
     * */
    mo.m2 = require("./module_with_status/module2");
    /**
     * 在这个模块中也加载m1
     * */
    mo.m1 = require("./module_with_status/module1");
   

    console.log(mo.m2.func());
    /**
     * output "m2||1"
     * */

    /**
     * 重写 m2 ，不再依赖m1
     * */
    yield setTimeout(co_next,4000);

    yield mo.fs.writeFile("./module_with_status/module2.js", m2__content, co_next);

    dload.reload(mo.path.join(__dirname, "./module_with_status/module2.js"));

    console.log(mo.m2.func());
    /**
     * output "m2"
     * */

    console.log(mo.m1.get_counter());
    /**
     * output "3"
     * */
    yield setTimeout(co_next,2000);

    console.log(mo.m1.get_counter());
    /**
     * output "4" ，bigger than the result of last ,means that the status of module1 is not been destroyed.
     *
     * 结果比上次打出的结果大，表明module1自身的状态并没有被破坏
     *
     * */

    dload.reload(mo.path.join(__dirname, "./module_with_status/module1.js"));

    console.log(mo.m2.func());
    console.log(mo.m1.get_counter());
    /**
     * output "1"
     * 重新加载，打出了"1" 初始值，说明确实被重新加载了。
     * */

})()
