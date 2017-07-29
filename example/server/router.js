const express = require("express");
const router = express.Router();
router.post("/test",function (req,res,next) {
res.json({"counter":850})
});
module.exports=router;