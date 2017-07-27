/**
 * Created by jason on 2017/7/27.
 */

const dload = require("../index");

const mo = dload.new();

mo.m3 = require("./module3");
mo.co = require("zco");
mo.fs = require("fs");
mo.path = require("path");

const start_mem_use = process.memoryUsage().heapUsed;

const print_mem_user = function () {
	let mem_log = "********** rss log *********\nmemory use:" +
		(process.memoryUsage().heapUsed - start_mem_use) + " bytes\n***********************\n";
	console.log(mem_log);
}
/**
 * the content of module3.js
 * */
const m3_content = 'const dload=require("../index");\n' +

	'const mo=dload.new();\n' +
	'mo.m1=require("./module1");\n' +
	'mo.m2=require("./module2");\n' +

	'const buf=Buffer.alloc(100000);\n' +
	'const func=function () {\n' +
	'var tag="abc";\n' +
	'return tag+"||"+buf.length+"||"+mo.m1+"||"+mo.m2.name;\n' +
	'}\n' +

	'exports.func=func;';

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
			yield mo.fs.writeFile("./module3.js", new_m3, co_next);
			/**
			 * reload module3.js
			 * */
			dload.reload(mo.path.join(__dirname, "./module3.js"));
			/**
			 * print the memory
			 * */
			print_mem_user()
		}
		console.log("wait 10s to print final memory!")
		yield setTimeout(co_next, 10 * 1000);
		print_mem_user();
	})()
}

run();
