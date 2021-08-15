const  mongoose  = require("mongoose");
const  Schema  =  mongoose.Schema;
const  deckSchema  =  new Schema({
   name: String,
   cards: [String],
   created_by: String
   
});

let  Deck  =  mongoose.model("Deck", deckSchema);
module.exports  = Deck;