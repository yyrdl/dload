/**
 * Created by jason on 2017/7/29.
 */

const request = require("request");
const co = require("zco");

const start_request=function () {
    let option ={
        "url":"http://127.0.0.1:8080/test",
        "method":"POST",
        "form":{
            "test":"test_data"
        }
    };
    co(function *(co_next) {
        for(let i=0;i<100000;i++){
            yield setTimeout(co_next,10);
            let [err,res,body] = yield request(option,co_next);
            if(err){
                console.log(err);
            }else{
                console.log(body)
            }
        }
    })()
}

exports.start=start_request;