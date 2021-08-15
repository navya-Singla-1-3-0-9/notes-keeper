const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  cardSchema  =  new Schema({
   parent: String,
   title: String,
   content: String,
   created_by: String
   
});

let  Card  =  mongoose.model("Card", cardSchema);
module.exports  = Card;