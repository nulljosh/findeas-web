const express = require('express')
    , app = express()
    , bodyParser = require('body-parser')
    , mongoose = require('mongoose');

const User = require('./app/models/User')
    , Post = require('./app/models/Post');

const PORT = process.env.PORT || 3030;
const DATABASE = process.env.DATABASE || 'mongodb://127.0.0.1:27017/findeas';

mongoose.connect(DATABASE).then((ans) => {
    console.log(`conneting: ${DATABASE}`);
    console.log("ConnectedSuccessful")
}).catch((err) => {
    console.log("Error in the Connection")
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.post('/post', (req, res) => {
    if (!req.body.content) return res.send('no content provided');
    if (!req.body.author) return res.send('no author');

    const post = Post.create({
        content: req.body.content,
        author: req.body.author
    })
        .then((createdPost) => res.send(createdPost))
        .catch((err) => {throw err});
});

app.get('/posts', (req, res) => {
    Post.find()
        .then((posts) => {res.send(posts)})
        .catch((err) => {throw err});
})

app.get('/users.json', (req, res) => {
    User.find()
        .then((users) => {res.send(users)})
        .catch((err) => {throw err});
});

app.delete('/delete/users.json', (req, res) => {
    User.deleteMany()
        .then((response) => res.send(response))
        .catch((err) => {throw err});
});

app.post('/user', (req, res) => {
    if (!req.body.username || !req.body.password) return res.send('no credentials supplied');

    const user = User.create({
        username: req.body.username,
        password: req.body.password
    }).then(result => {
        console.log(`new user ${req.body.username}`);
        res.send(result);
    }).catch(err => {
        res.send(err);
    });
});

app.get('/:username', (req, res) => {
    if (!req.params['username']) return res.send('no username provided');
    User.find({username: req.params['username']})
        .then((user) => {
            user = user[0];
            res.send({username:user.username, _id: user._id})
        })
        .catch((err) => {throw err});
});

app.listen(PORT, () => {
    console.log(`watching http://localhost:${PORT}`);
});