const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  noteSchema  =  new Schema({
   name: String,
   content: String,
   created_by: String,
   folder: String,
   type: String,
   shared_by: String,
   roomid: String,
   collaborators:[String]
});

let  Notes  =  mongoose.model("Notes", noteSchema);
module.exports  = Notes;