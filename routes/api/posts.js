const express = require('express')
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');

app.use(bodyParser.urlencoded({ extended: false}));

router.get('/', async (req, res, next) => {

     var searchObj = req.query;

     if(searchObj.isReply !== undefined) {
          var isReply = searchObj.isReply == "true";
          searchObj.replyTo = { $exists: isReply };
          delete searchObj.isReply;
     }

     if(searchObj.followingOnly !== undefined) {
          var followingOnly = searchObj.followingOnly == "true";

          if(followingOnly) {
               var objectIds = [];

               if(!req.session.user.following) {
                    req.session.user.following = [];
               }

               req.session.user.following.forEach(user => {
                    objectIds.push(user);
               })
               
               objectIds.push(req.session.user._id);
     
               searchObj.postedBy = { $in: objectIds };
          }

          delete searchObj.followingOnly;

     }

     var results  = await getPosts(searchObj);
     res.status(200).send(results);
})

router.get('/:id', async (req, res, next) => {

     var postId = req.params.id;

     var postData  = await getPosts({_id: postId});
     postData = postData[0];

     var results ={
          postData: postData
     }


     if(postData.replyTo !== undefined){
          results.replyTo = postData.replyTo;
     }

     results.replies = await getPosts({ replyTo: postId });
     //console.log(results);
     res.status(200).send(results);
})

router.post('/', async (req, res, next) => {

    if(!req.body.content){
         console.log("Content param not sent with request");
         return res.sendStatus(400);
    }

    var postData = {
         content: req.body.content,
         score: req.body.score,
         artist: req.body.artist,
         album: req.body.album,
         postedBy: req.session.user
    }

    if(req.body.replyTo){
         postData.replyTo = req.body.replyTo;
    }

    Post.create(postData)
     .then(async newPost => {
        newPost = await User.populate(newPost, { path: "postedBy"})
         res.status(201).send(newPost);
     })
     .catch(error => {
         console.log(error);
         res.sendStatus(400);
     })
})

router.put('/:id/upvotes', async (req, res, next) => {

     var postId = req.params.id;
     var userId = req.session.user._id;

     var isUpvoted = req.session.user.upvotes && req.session.user.upvotes.includes(postId);

     var option = isUpvoted ? "$pull" : "$addToSet";

     //Insert user upvote
     req.session.user = await User.findByIdAndUpdate(userId, { [option]: { upvotes: postId } }, { new: true})
     .catch(error => {
          console.log(error);
          res.sendStatus(400);
     })
     //Insert post upvote
     var post  = await Post.findByIdAndUpdate(postId, { [option]: { upvotes: userId } }, { new: true})
     .catch(error => {
          console.log(error);
          res.sendStatus(400);
     })

     //console.log("posts" + post);
     res.status(200).send(post);
})

router.put('/:id/downvotes', async (req, res, next) => {

     var postId = req.params.id;
     var userId = req.session.user._id;

     var isDownvoted = req.session.user.downvotes && req.session.user.downvotes.includes(postId);

     var option = isDownvoted ? "$pull" : "$addToSet";

     //Insert user downvote
     req.session.user = await User.findByIdAndUpdate(userId, { [option]: { downvotes: postId } }, { new: true})
     .catch(error => {
          console.log(error);
          res.sendStatus(400);
     })
     //Insert post downvote
     var post  = await Post.findByIdAndUpdate(postId, { [option]: { downvotes: userId } }, { new: true})
     .catch(error => {
          console.log(error);
          res.sendStatus(400);
     })

     //console.log("posts" + post);
     res.status(200).send(post);
})

async function getPosts(filter) {
     var results = await Post.find(filter)
     .populate("postedBy")
     .populate("replyTo")
     .catch(error => {
          console.log(error);
          res.sendStatus(400);
     })
     
     //results = await User.populate(results, { path: "replyTo.postedBy"})
     return await User.populate(results, { path: "replyTo.postedBy"})

}

module.exports = router;