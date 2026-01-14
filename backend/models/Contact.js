const mongoose=require("mongoose");
module.exports=mongoose.model("Contact",
 new mongoose.Schema({name:String,email:String,message:String},{timestamps:true})
);