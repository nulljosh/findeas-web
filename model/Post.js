const mongoose = require('mongoose')
    , bcrypt = require('bcrypt');

const SALT = 10;

const postSchema = mongoose.Schema({
    idea: {type: String},
    author: {type: String}
});

module.exports = mongoose.model('Post', postSchema);