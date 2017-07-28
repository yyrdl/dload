const dload = require("../../index");
const mo = dload.new();
exports.func=function () {
if(mo.m1){
return "m2||"+mo.m1.get_counter();
}else{
return "m2";
}
}