/**
 * Created by jason on 2017/7/27.
 *
 * this file is designed to check if the module will be updated automatically , and see if there is a memory problem.
 *
 */

const dload = require("../index");


const mo = dload.new();

mo.m3 = require("./update_and_memory/module3");
mo.co = require("zco");
mo.fs = require("fs");
mo.path = require("path");


const start_mem_use = process.memoryUsage().heapUsed;

const print_mem_use = function () {
	let mem_log = "********** rss log *********\nmemory use:" +
		(process.memoryUsage().heapUsed - start_mem_use) + " bytes\n***********************\n";
	console.log(mem_log);
}
/**
 * the content of module3.js
 * */
const m3_content = 'const dload=require("../../index");\n' +

	'const mo=dload.new();\n' +
	'mo.m1=require("./module1");\n' +
	'mo.m2=require("./module2");\n' +

	'const buf=Buffer.alloc(100000);\n' +
	'const func=function () {\n' +
	'var tag="abc";\n' +
	'return tag+"||"+buf.length+"||"+mo.m1+"||"+mo.m2.name+(mo.m4?"||"+mo.m4.counter++:"");\n' +
	'}\n' +

	'exports.func=func;';

/**
 * let's rewrite and reload module3.js 1000 times .
 *
 * 修改module3.js 1000次，每次只是修改一个变量的值，修改完之后立即重写加载，然后运行module3暴露出来的方法
 *
 * */
const run = function () {
	mo.co(function  * (co_next) {

		for (let i = 0; i < 1000; i++) {
			/**
			 * run the func function of module3.js
			 * */
			let data = mo.m3.func();
			console.log(data);
			/**
			 * wait 100 ms
			 * */
			yield setTimeout(co_next, 100);
			/**
			 * rewrite the content of module3.js
			 * */
			let new_m3 = m3_content.replace(/abc/, i + "");
			yield mo.fs.writeFile("./update_and_memory/module3.js", new_m3, co_next);
			/**
			 * reload module3.js
             * PS：we just reload the file ,and there is no code like `mo.m3=require("./module3.js")`
             *
             * 注意：这里是关键点，我们只是重新加载了这个文件，但没有`mo.m3 = require("./module3.js")`这样的代码，
             * dload 会帮你完成相应的更新。
             *
             * reload之后，循环到for循环的第一行就是运行的更新之后的module3.js了
			 * */
			dload.reload(mo.path.join(__dirname, "./update_and_memory/module3.js"));
			/**
			 * print the memory
			 * */
			print_mem_use()
		}

		console.log("wait 10s to print final memory!")
		yield setTimeout(co_next, 10 * 1000);
		print_mem_use();
	})()
}

run();