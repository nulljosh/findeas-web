const express = require('express')
    , app = express()
    , bodyParser = require('body-parser');

const PORT = process.env.PORT || 3030;

app.get('/', (req, res) => {
    res.send('/');
});

app.listen(PORT, () => {
    console.log(`watching http://localhost:${PORT}`);
});