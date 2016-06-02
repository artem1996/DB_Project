var serv = require('./servicies');

exports.index = function(req, res, next) {
    switch (req.params.name) {
        case 'create': create(req, res); break;
        case 'remove': remove(req, res); break;
        case 'restore': restore(req, res); break;
        case 'close': close(req, res); break;
        case 'open': open(req, res); break;
        case 'update': update(req, res); break;
        case 'vote': vote(req, res); break;
        case 'subscribe': subscribe(req, res); break;
        case 'unsubscribe': unsubscribe(req, res); break;
        default: next();
    }
};

var create = function(req, res) {
    serv.db.query("INSERT INTO threads SET ?;", req.body, function(err, rows) {
        if(err) {
            res.end(serv.error_message(3));
           ;//console.log("thread_post" + err);
            return;
        }
        if(req.body.isDeleted) {} else {req.body.isDeleted = false;}
        req.body.id = rows.insertId;
        var answ = {code: 0, response: req.body};
        res.end(JSON.stringify(answ));
    });
};

var remove = function(req, res) {
    var query = "UPDATE threads SET isDeleted = true, posts = 0 WHERE id = " + req.body.thread + ";";
    serv.db.query(query, function(err, rows) {
        if(err || !rows.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        query = "UPDATE posts SET isDeleted = true WHERE thread = " + req.body.thread + ";";
        serv.db.query(query, function(err, rows) {
            res.end(JSON.stringify({code: 0, response: {thread: req.body.thread}}));
        });
    });
};

var restore = function(req, res) {
    var query = "UPDATE posts SET isDeleted = false WHERE thread = " + req.body.thread + ";";
    serv.db.query(query, function(err, rows) {
        query = "UPDATE threads SET isDeleted = false, posts = " + rows.affectedRows + " WHERE id = " + req.body.thread + ";";
        serv.db.query(query, function(err, rows) {
            if(err || !rows.affectedRows) {
                res.end(serv.error_message(1));
                return;
            }
            res.end(JSON.stringify({code: 0, response: {thread: req.body.thread}}));
        });
    });
};

var close = function(req, res) {
    var query = "UPDATE threads SET isClosed = true WHERE id = " + req.body.thread + ";";
    serv.db.query(query, function(err, rows) {
        if(err || !rows.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        res.end(JSON.stringify({code: 0, response: {thread: req.body.thread}}));
    });
};

var open = function(req, res) {
    var query = "UPDATE threads SET isClosed = false WHERE id = " + req.body.thread + ";";
    serv.db.query(query, function(err, rows) {
        if(err || !rows.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        res.end(JSON.stringify({code: 0, response: {thread: req.body.thread}}));
    });
};

var update = function(req, res) {
    if(!req.body.message || !req.body.slug || !req.body.thread) {
        res.end(serv.error_message(3));
        return;
    }
    var query = "UPDATE threads SET message = '" + req.body.message + "', slug = '" + req.body.slug + "' WHERE id = " + req.body.thread;
    serv.db.query(query, function(err, rows) {
        if(err || !rows.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        serv.db.query("SELECT * FROM threads WHERE id = ?;", req.body.thread, function(err, rows) {
            if(err) {
                res.end(serv.error_message(4));
               ;//console.log(err);
                return;
            }
            var answ = {code: 0, response: rows[0]};
            res.end(JSON.stringify(answ));
        });
    });
};

var vote = function(req, res) {
    if(!req.body.vote || !req.body.thread) {
        res.end(serv.error_message(3));
        return;
    }
    var like = req.body.vote == 1?"likes":"dislikes";
    var query = "UPDATE threads SET " + like + " = " + like + " + 1, points = points " +
        (req.body.vote == 1?"+":"-") +" 1 WHERE id = " + req.body.thread;
    serv.db.query(query, function(err, rows) {
        if(err || !rows.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        serv.db.query("SELECT * FROM threads WHERE id = ?;", req.body.thread, function(err, rows) {
            if(err) {
                res.end(serv.error_message(4));
               ;//console.log(err);
                return;
            }
            var answ = {code: 0, response: rows[0]};
            res.end(JSON.stringify(answ));
        });
    });
};

var subscribe = function(req, res) {
    var replace = {users_email:req.body.user, threads_id:req.body.thread};
    serv.db.query("INSERT INTO subscriptions SET ?", replace, function(err, rows) {
        if(err || !rows.affectedRows) {
            res.end(serv.error_message(3));
           ;//console.log(err);
            return;
        }
        res.end(JSON.stringify({code:0, response:req.body}));
    });
};

var unsubscribe = function(req, res) {
    var query = "DELETE FROM subscriptions WHERE users_email = '" + req.body.user + "' AND threads_id = " + req.body.thread + ";";
    serv.db.query(query, function(err, rows) {
        if(err || !rows.affectedRows) {
            res.end(serv.error_message(1));
           ;//console.log(err);
            return;
        }
        res.end(JSON.stringify({code:0, response:req.body}));
    });
};