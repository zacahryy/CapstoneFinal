const mongoose = require('mongoose');
//mongoose.set('useNewUrlParser', true)

class Database {

    constructor(){
        this.connect();
    }

    connect(){
        mongoose.connect("mongodb+srv://zachfaulkner02:$Greinke21@cluster0.oxuvi.mongodb.net/")
        .then(() => {
            console.log("database connection succesful");
        })
        .catch(() => {
            console.log("database connection failed");
        })
    }
}

module.exports = new Database();