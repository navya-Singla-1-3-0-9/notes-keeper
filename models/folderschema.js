const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  folderSchema  =  new Schema({
   name: String,
   notes: [String],
   created_by: String,
   color: String,
   
});

let  Folder  =  mongoose.model("Folder", folderSchema);
module.exports  = Folder;