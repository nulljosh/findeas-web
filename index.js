const express = require('express')
    , app = express()
    , bodyParser = require('body-parser');

const PORT = process.env.PORT || 3030;

app.get('/', (req, res) => {
    res.send('/');
});

app.get('/login', (req, res) => {
    res.send('login');
});

app.get('/register', (req, res) => {
    res.send('register');
});

app.listen(PORT, () => {
    console.log(`watching http://localhost:${PORT}`);
});