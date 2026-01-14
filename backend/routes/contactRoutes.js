const r=require("express").Router();
const Contact=require("../models/Contact");
r.post("/",async(req,res)=>res.json(await Contact.create(req.body)));
r.get("/",async(req,res)=>res.json(await Contact.find()));
module.exports=r;