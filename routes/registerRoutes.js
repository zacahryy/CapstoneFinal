const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const User = require('../schemas/UserSchema');

app.set('view engine', 'pug');
app.set('views', 'views')

app.use(bodyParser.urlencoded({ extended: false}));

router.get('/', (req, res, next) => {

    res.status(200).render("register");

})

router.post('/', async (req, res, next) => {

    var username = req.body.username.trim()
    var email = req.body.email.trim()
    var password = req.body.password.trim()

    var payload = req.body;
    if(username && email && password){
        var user = await User.findOne({
            $or: [
                { username: username},
                { email: email}
            ]
        })
        .catch((error) => {
            console.log(error);

            payload.errorMessage = "Very bad"
            res.status(200).render("register", payload);
        });

        if(user == null){
            //no user found
            var data = req.body;

            data.password = await bcrypt.hash(password, 10);
            User.create(data)
            .then((user) => {
                req.session.user = user;
                return res.redirect('/');
            })

        }else{
            //Matching user found
            if(email == user.email){
                payload.errorMessage = "Email already in use"
            }else{
                payload.errorMessage = "Username already in use"
            }
            res.status(200).render("register", payload);
        }



    }
    else{
        //console.log("boof");
        console.log(req.body);
        payload.errorMessage = "Enter valid values in each field"
        res.status(200).render("register", payload);
    }
    
})

module.exports = router;