var express = require('express');
var wagner = require('wagner-core');

require('./models')(wagner);
require('./dependencies')(wagner);

var app = express();

//for heroku環境
var PORT = process.env.PORT || 3000;

wagner.invoke(require('./auth'), { app: app });

app.use('/api/v1', require('./api')(wagner));

//讓此目錄下的html都可以作為static file
app.use(express.static('../', { maxAge: 4 * 60 * 60 * 1000 }));

app.listen(PORT, function() {
    console.log('Listening on port:' + PORT + '!');
});
