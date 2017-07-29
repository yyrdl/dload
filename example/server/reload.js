/**
 * Created by jason on 2017/7/29.
 */
/**
 * 非业务代码
 * */
const dload =require("../../index");
const fs = require("fs");
const co = require("zco");
const path = require("path");


const content_of_router='const express = require("express");\n'+
'const router = express.Router();\n'+
    'router.post("/test",function (req,res,next) {\n'+
    'res.json({"counter":1})\n'+
'});\n'+
'module.exports=router;';

const start_reload=function () {

    co(function *(co_next) {
        for(let i=0;i<100000;i++){

            yield setTimeout(co_next,50);//每隔50毫秒重写一次router的返回

            let new_counter = content_of_router.replace(/1/,i+"");

            yield fs.writeFile(path.join(__dirname,"./router.js"),new_counter,co_next);

            dload.reload_one_file(path.join(__dirname,"./router.js"));//修改完之后热加载
        }
    })()
};

exports.start=start_reload;
