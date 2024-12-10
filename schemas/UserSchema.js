const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    username: { type: String, required: true, trim: true, unique: true},
    email: { type: String, required: true, trim: true, unique: true},
    password: { type: String, required: true},
    profilePic: { type: String, default: '/images/default.jpg'},
    coverPhoto: { type: String },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'Post'}],
    downvotes: [{ type: Schema.Types.ObjectId, ref: 'Post'}],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

var User = mongoose.model('User', UserSchema);
module.exports = User;