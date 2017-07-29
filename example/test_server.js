/**
 * Created by jason on 2017/7/29.
 */
const easyMonitor = require('easy-monitor');
easyMonitor('Mercury');

const dload = require("../index");
const mo = dload.new();



const run_reload = require("./server/reload");
const request = require("./server/request");
const co = require("zco");

const express = require('express');

const app = express();

mo.router = require("./server/router");

app.use("/",function (req,res,next) {
    mo.router(req,res,next);
});

/**
 * 这里不能用 app.use("/",mo.router),因为这相当于 ：
 * const router = mo.router;
 * app.use("/",router);
 *
 * 这使得dload丧失了对router的控制，热更新不会成功
 * */

app.listen(8080,function (err) {
    if(err){
        console.log(err);
    }else{
        co(function *(co_next) {
            yield setTimeout(co_next,1000);
            run_reload.start();
            yield setTimeout(co_next,2000);
            request.start();
        })()
    }
})