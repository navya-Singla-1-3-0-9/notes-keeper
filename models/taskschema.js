const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  taskSchema  =  new Schema({
	username: String,
   	task_name: String,
   	status: String
   
});

let  Task  =  mongoose.model("Task", taskSchema);
module.exports  = Task;