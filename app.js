const express = require('express')
    , app = express()
    , bodyParser = require('body-parser')
    , mongoose = require('mongoose');

const User = require('./model/User');

const PORT = process.env.PORT || 3030;
const DATABASE = 'mongodb://127.0.0.1:27017/findeas';

mongoose.connect(DATABASE).then((ans) => {
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

app.post('/user', (req, res) => {
    if (!req.body.username) return res.send('no username supplied');
    if (!req.body.password) return res.send('no password supplied');

    const user = User.create({
        username: req.body.username,
        password: req.body.password
    }).then(result => {
        res.send(result);
    }).catch(err => {
        res.send(err);
    });
});

app.listen(PORT, () => {
    console.log(`watching http://localhost:${PORT}`);
});