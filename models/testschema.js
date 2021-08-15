const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  testSchema  =  new Schema({
	username: String,
   test_name: String,
   subject: String,
   notes: [{
   	folder: String,
   	marked:[String]
   }],
   month: String,
   date: String
   
});

let  Test  =  mongoose.model("Test", testSchema);
module.exports  = Test;