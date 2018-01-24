//IMPORT PARSING, AND ERROR HANDLER
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');

///CREATE AND EXPORT EXPRESS APP
const express = require('express');

const apiRouter = require('./api/api');
const app = express();


app.use(bodyParser.json());
app.use('/api', apiRouter);
app.use(errorhandler());

//CREATE PORT
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
});

module.exports = app;
