/**
 * Created by jason on 2017/7/28.
 *
 * 这个文件想要检验若一个模块被多个模块依赖，那么因为其中一个模块重新加载，并且不再依赖这一模块的时候
 * 会不会对另一个模块的使用造成影响。
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
	'return "m2||"+mo.m1.name;\n' +
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
	'return "m2||"+mo.m1.name;\n' +
	'}else{\n' +
	'return "m2";\n' +
	'}\n' +
	'}';

mo.co(function  * (co_next) {

	yield mo.fs.writeFile("./multi_rely/module2.js", m2_init_content, co_next);
    /**
     * m2 起初依赖m1
     * */
	mo.m2 = require("./multi_rely/module2");
    /**
     * 在这个模块中也加载m1
     * */
	mo.m1 = require("./multi_rely/module1");


	console.log(mo.m2.func());
    /**
     * output "m2||m1"
     * */
    /**
     * 重写 m2 ，不再依赖m1
     * */
	yield mo.fs.writeFile("./multi_rely/module2.js", m2__content, co_next);
	dload.reload(mo.path.join(__dirname, "./multi_rely/module2.js"));

	console.log(mo.m2.func());
    /**
     * output "m2"
     * */
	console.log(mo.m1.name);
    /**
     * output "m1"
     *
     * module1 is still here
     * */
    dload.reload(mo.path.join(__dirname, "./multi_rely/module1.js"));

    console.log(mo.m2.func());
    /**
     * output "m2"
     *
     * no influence for module2
     * */

})()

