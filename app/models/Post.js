const mongoose = require('mongoose')
    , bcrypt = require('bcrypt');

const postSchema = mongoose.Schema({
    content: {type: String},
    author: {type: String}
});

module.exports = mongoose.model('Post', postSchema);