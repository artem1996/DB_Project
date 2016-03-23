
/**
 * Module dependencies.
 */

var express = require('express'),
    status = require('./routes/status'),
    clear = require('./routes/clear'),
    forum_post = require('./routes/forum_post'),
    forum_get = require('./routes/forum_get'),
    post_post = require('./routes/post_post'),
    post_get = require('./routes/post_get'),
    user_post = require('./routes/user_post'),
    user_get = require('./routes/user_get'),
    thread_post = require('./routes/thread_post'),
    thread_get = require('./routes/thread_get')


var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.post('/db/api/clear', clear.index);
app.get('/db/api/status', status.index);
app.post('/db/api/user/:name', user_post.index);
app.get('/db/api/user/:name', user_get.index);
app.post('/db/api/forum/:name', forum_post.index);
app.get('/db/api/forum/:name', forum_get.index);
app.post('/db/api/thread/:name', thread_post.index);
app.get('/db/api/thread/:name', thread_get.index);
app.post('/db/api/post/:name', post_post.index);
app.get('/db/api/post/:name', post_get.index);
//app.get('/', routes.index);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
