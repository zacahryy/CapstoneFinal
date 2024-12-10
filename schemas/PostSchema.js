const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    content: { type: String, required: true, trim: true },
    score: { type: String, trim: true},
    artist: { type: String, trim: true},
    album: { type: String, trim: true},
    postedBy: { type: Schema.Types.ObjectId, ref: 'User'},
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    downvotes: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    replyTo: { type: Schema.Types.ObjectId, ref: 'Post'}

}, { timestamps: true });

var Post = mongoose.model('Post', PostSchema);
module.exports = Post;