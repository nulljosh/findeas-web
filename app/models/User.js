const mongoose = require('mongoose')
    , bcrypt = require('bcrypt');

const SALT = 10;

const userSchema = mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    posts: {type: Array}
});

userSchema.pre('save', function(next) {
    var user = this;

    if (!user.isModified('password')) return next();
    bcrypt.genSalt(SALT, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            //override cleartext pw with hash
            user.password = hash;
            next();
        });
    });
});

module.exports = mongoose.model('User', userSchema);