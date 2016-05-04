var serv = require('./servicies');

exports.index = function(req, res, next) {
    switch (req.params.name) {
        case 'create': create(req, res); break;
        case 'updateProfile': update(req, res); break;
        case 'follow': follow(req, res); break;
        case 'unfollow': unfollow(req, res); break;
        default: next();
    }
};

var create = function(req, res) {
    serv.db.query("INSERT INTO users SET ?;", req.body, function(err, rows) {
        if(err) {
            res.end(serv.error_message(5));
           ;//console.log(err);
            return;
        }
        var id = rows.insertId;
        serv.db.query("SELECT * FROM users WHERE id = ?;", id, function(err, rows) {
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

var update = function(req, res) {
    if(!req.body.about || !req.body.user || !req.body.name) {
        res.end(serv.error_message(3));
        return;
    }
    var query = "UPDATE users SET about = '" + req.body.about + "', name = '" + req.body.name + "' WHERE email = '" + req.body.user + "';";
    serv.db.query(query, function(err, rows) {
        if(err || !rows.affectedRows) {
            res.end(serv.error_message(1));
            return;
        }
        serv.db.query("SELECT * FROM users WHERE email = ?;", req.body.user, function(err, rows) {
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

var follow = function(req, res) {
    if(!req.body.follower || !req.body.followee) {
        res.end(serv.error_message(3));
        return;
    }
    var query = "INSERT INTO followers VALUES('" + req.body.followee + "','" + req.body.follower +"');";
    serv.db.query(query, function(err, rows) {
        serv.db.query("SELECT * FROM users WHERE email = ?;", req.body.followee, function(err, rows) {
            if(err) {
               ;//console.log(err);
                res.end(serv.error_message(1));
                return;
            }
            var answ = {code:0, response: serv.clone_obj(rows[0])};
            answ.response.followers = [];
            answ.response.following = [];
            answ.response.subscriptions = [];
            var query = "(SELECT 0+0 AS ind, users_email_following AS value FROM followers WHERE users_email_follower = '" + req.body.followee +
                "') UNION (SELECT 0+1 AS ind, users_email_follower AS value FROM followers WHERE users_email_following = '" + req.body.followee +
                "') UNION (SELECT 0+2 AS ind, threads_id AS value FROM subscriptions WHERE users_email = '" + req.body.followee + "');";
            serv.db.query(query, function(err, rows) {
                if(err) {
                   ;//console.log(err);
                    res.end(serv.error_message(4));
                    return;
                }
                for(var i = 0; i < rows.length; i++) {
                    if(rows[i].ind == 0) answ.response.following.push(rows[i].value);
                    if(rows[i].ind == 1) answ.response.followers.push(rows[i].value);
                    if(rows[i].ind == 2) answ.response.subscriptions.push(+rows[i].value);
                }
                res.end(JSON.stringify(answ));
            });
        });
    });
};

var unfollow = function(req, res) {
    if(!req.body.follower || !req.body.followee) {
        res.end(serv.error_message(3));
        return;
    }
    var query = "DELETE FROM followers WHERE users_email_following = '" + req.body.followee + "' AND users_email_follower = '" + req.body.follower +"';";
   ;//console.log(query);
    serv.db.query(query, function(err, rows) {
        serv.db.query("SELECT * FROM users WHERE email = ?;", req.body.follower, function(err, rows) {
            if(err) {
               ;//console.log(err);
                res.end(serv.error_message(1));
                return;
            }
            var answ = {code:0, response: serv.clone_obj(rows[0])};
            answ.response.followers = [];
            answ.response.following = [];
            answ.response.subscriptions = [];
            var query = "(SELECT 0+0 AS ind, users_email_following AS value FROM followers WHERE users_email_follower = '" + req.body.followee +
                "') UNION (SELECT 0+1 AS ind, users_email_follower AS value FROM followers WHERE users_email_following = '" + req.body.followee +
                "') UNION (SELECT 0+2 AS ind, threads_id AS value FROM subscriptions WHERE users_email = '" + req.body.followee + "');";
            serv.db.query(query, function(err, rows) {
                if(err) {
                   ;//console.log(err);
                    res.end(serv.error_message(4));
                    return;
                }
                for(var i = 0; i < rows.length; i++) {
                    if(rows[i].ind == 0) answ.response.following.push(rows[i].value);
                    if(rows[i].ind == 1) answ.response.followers.push(rows[i].value);
                    if(rows[i].ind == 2) answ.response.subscriptions.push(+rows[i].value);
                }
                res.end(JSON.stringify(answ));
            });
        });
    });
};