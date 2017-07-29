const express = require("express");
const router = express.Router();
router.post("/test",function (req,res,next) {
res.json({"counter":43378})
});
module.exports=router;