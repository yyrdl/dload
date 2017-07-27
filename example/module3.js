const dload = require("../index");
const mo = dload.new();
mo.m1 = require("./module1");
mo.m2 = require("./module2");
const buf = Buffer.alloc(100000);
const func = function () {
	var tag = "99";
	return tag + "||" + buf.length + "||" + mo.m1 + "||" + mo.m2.name;
}
exports.func = func;
