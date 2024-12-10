const express = require('express')
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: "uploads/"});
const path = require('path');
const fs = require('fs');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');

app.use(bodyParser.urlencoded({ extended: false}));

router.put('/:userId/follow', async (req, res, next) => {
    var userId = req.params.userId;

    var user = await User.findById(userId);

    if(user == null) {
        return res.sendStatus(404);
    }

    var isFollowing = user.followers && user.followers.includes(req.session.user._id);
    var option = isFollowing ? "$pull" : "$addToSet";

    req.session.user = await User.findByIdAndUpdate(req.session.user._id, { [option]: { following: userId } }, { new: true})
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    User.findByIdAndUpdate(userId, { [option]: { followers: req.session.user._id } })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })

    res.status(200).send(req.session.user);
})

router.put('/:userId/following', async (req, res, next) => {
    console.log(req.params.userId)
    User.findById(req.params.userId)
    .populate("following")
    .then(results => {
        res.status(200).send(results);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})

router.put('/:userId/followers', async (req, res, next) => {
    console.log(req.params.userId)
    User.findById(req.params.userId)
    .populate("followers")
    .then(results => {
        res.status(200).send(results);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})

router.post("/profilePicture", upload.single("croppedImage"), async (req, res, next) => {
    if(!req.file) {
        console.log("no file uploaded with ajax request.")
        return res.sendStatus(400);
    }

    var filePath = `/uploads/images/${req.file.filename}.png`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname, `../../${filePath}`);

    fs.rename(tempPath, targetPath, async error => {
        if(error != null){
            console.log(error);
            return res.sendStatus(400);
        }

        req.session.user = await User.findByIdAndUpdate(req.session.user._id, { profilePic: filePath }, { new: true })
        res.sendStatus(204)
    });
})


module.exports = router;