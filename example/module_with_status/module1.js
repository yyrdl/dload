/**
 * Created by jason on 2017/7/28.
 */

let counter=1;

const handler= setInterval(function () {
    counter++;
},2000);


exports.get_counter=function () {
    return counter;
}

exports._release=function () {
    clearInterval(handler);
}

