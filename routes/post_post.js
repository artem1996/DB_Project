var serv = require('./servicies');

exports.index = function(req, res, next) {
    switch (req.params.name) {
        case 'create': create(req, res); break;
        case 'remove': remove(req, res); break;
        case 'restore': restore(req, res); break;
        case 'update': update(req, res); break;
        case 'vote': vote(req, res); break;
        default: next();
    }
};

var create = function(req, res) {
    serv.db.query("INSERT INTO posts SET ?", req.body, function(err, row) {
        if (err) {
            console.log(err);
            res.end(serv.error_message(3));
            return;
        }
        var id = row.insertId;
        if(!req.body.parent) {
            var query = "UPDATE posts SET mpath = '" + id + "' WHERE id = " + id + ";";
            var lol = serv.db.query(query, function(err) {
                if(err)
                    console.log(err);
            });
        } else {
            var query = "UPDATE posts SET mpath = CONCAT(mpath, '\\\\', " + id + ") WHERE id = " + id + ";";
            var lol = serv.db.query(query, function(err) {
                if(err)
                    console.log(err);
            });
        }
        serv.db.query("SELECT * FROM posts WHERE id = ?;", id, function(err, row) {
            if(err) {
                console.log(err);
                res.end(serv.error_message(4));
                return;
            }
            var answ = {code: 0, response: row[0]};
            res.end(JSON.stringify(answ));
        });

    });
};

var remove = function(req, res) {
    if (!req.body.post) {
        res.end(serv.error_message(2));
        return;
    }
    serv.db.query("UPDATE posts SET isDeleted = 1 WHERE id = ?;", req.body.post, function(err, row) {
        if(err) {
            console.log(err);
            res.end(serv.error_message(5));
            return;
        }
        if(!row.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        var answ = {code:0, response: {post : req.body.post}};
        res.end(JSON.stringify(answ));
        serv.db.query("UPDATE threads SET posts = posts - 1 WHERE id = (SELECT thread FROM posts WHERE id = ?);", req.body.post, function(err){});
    });
};

var restore = function(req, res) {
    if (!req.body.post) {
        res.end(serv.error_message(2));
        return;
    }
    serv.db.query("UPDATE posts SET isDeleted = 0 WHERE id = ?;", req.body.post, function(err, row) {
        if(err) {
            console.log(err);
            res.end(serv.error_message(3));
            return;
        }
        if(!row.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        var answ = {code:0, response: {post : req.body.post}};
        res.end(JSON.stringify(answ));
        serv.db.query("UPDATE threads SET posts = posts + 1 WHERE id = (SELECT thread FROM posts WHERE id = ?);", req.body.post, function(err){});
    });
};

var update = function(req, res) {
    if (!req.body.post || !req.body.message) {
        res.end(serv.error_message(2));
        return;
    }
    var instead = [req.body.message, req.body.post];
    serv.db.query("UPDATE posts SET message = ? WHERE id = ?;", instead, function(err, row) {
        if(err) {
            console.log(err);
            res.end(serv.error_message(3));
            return;
        }
        if(!row.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        serv.db.query("SELECT * FROM posts WHERE id = ?;", req.body.post, function(err, row) {
            row[0].isApproved = !!row[0].isApproved;
            row[0].isHighlighted = !!row[0].isHighlighted;
            row[0].isDeleted = !!row[0].isDeleted;
            row[0].isEdited = !!row[0].isEdited;
            date = JSON.stringify(row[0].date);
            row[0].date = date.substr(1,10) + " " + date.substr(12,8);
            var answ = {code: 0, response: row[0]};
            res.end(JSON.stringify(answ));
        });
    });
};

var vote = function(req, res) {
    if (!req.body.post || !(req.body.vote == 1 || req.body.vote == -1)) {
        res.end(serv.error_message(2));
        return;
    }
    var like = req.body.vote == 1?"likes":"dislikes";
    var query = "UPDATE posts SET " + like + " = " + like + " + 1, points = points " + (req.body.vote == 1?"+":"-") +" 1 WHERE id = " + req.body.post;
    serv.db.query(query, function(err, row) {
        if(err) {
            console.log(err);
            res.end(serv.error_message(3));
            return;
        }
        if(!row.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        serv.db.query("SELECT * FROM posts WHERE id = ?;", req.body.post, function(err, row) {
            row[0].isApproved = !!row[0].isApproved;
            row[0].isHighlighted = !!row[0].isHighlighted;
            row[0].isDeleted = !!row[0].isDeleted;
            row[0].isEdited = !!row[0].isEdited;
            date = JSON.stringify(row[0].date);
            row[0].date = date.substr(1,10) + " " + date.substr(12,8);
            var answ = {code: 0, response: row[0]};
            res.end(JSON.stringify(answ));
        });
    });
};