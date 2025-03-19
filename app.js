const express = require('express')
    , app = express()
    , bodyParser = require('body-parser')
    , mongoose = require('mongoose');

const PORT = process.env.PORT || 3030;
app.use(express.static(__dirname + '/public'));

const schema = new mongoose.Schema({ name: String, password: String});

app.get('/', (req, res) => {
    res.send('💡');
});

app.post('/user', (req, res) => {
    // new user
    const User = mongoose.model('User', schema);

});

app.listen(PORT, () => {
    console.log(`watching http://localhost:${PORT}`);
});