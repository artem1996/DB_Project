var serv = require('./servicies');

exports.index = function(req, res, next) {
    switch (req.params.name) {
        case 'details': details(req, res); break;
        case 'listPosts': listPosts(req, res); break;
        case 'listThreads': listThreads(req, res); break;
        case 'listUsers': listUsers(req, res); break;
        default: next();
    }
};

var details = function (req, res) {
    if (!req.query.forum) {
        res.end(serv.error_message(3));
        return;
    }
    serv.db.query("SELECT * FROM forums WHERE short_name = ?;", req.query.forum, function(err, rows) {
        if (err) {
            ;//console.log(err);
            res.end(serv.error_message(5));
            return;
        }
        if (!rows[0]) {
            res.end(serv.error_message(1));
            return;
        }
        var response = serv.clone_obj(rows[0]);
        var answ = {code: 0};
        answ.response = response;
        if (req.query.related == "user") {
            serv.db.query("SELECT * FROM users WHERE email = ?;", rows[0].user, function(err, rows) {
                if (err || !rows[0]) {
                ;//console.log(err);
                res.end(serv.error_message(4));
                return;
                }
                response.user = serv.clone_obj(rows[0]);
                response.user.isAnonymous = !!response.user.isAnonymous;
                response.user.following = [];
                response.user.follower = [];
                response.user.subscriptions = [];
                var query = "SELECT users_email_following FROM followers WHERE users_email_follower = '" + response.user.email +
                    "';SELECT users_email_follower FROM followers WHERE users_email_following = '" + response.user.email +
                    "';SELECT threads_id FROM subscriptions WHERE users_email = '" + response.user.email + "';";
                serv.db.query(query, function(err, rows) {
                    if(err) {
                        ;//console.log(err);
                        res.end(serv.error_message(4));
                        return;
                    }
                    for(var i = 0; i < rows.length; i++) {
                        if(rows[i].users_email_following) response.user.following.push(rows[i].users_email_following);
                        if(rows[i].users_email_follower) response.user.following.push(rows[i].users_email_follower);
                        if(rows[i].threads_id) response.user.subscriptions.push(rows[i].threads_id);
                    }
                    res.end(JSON.stringify(answ));
                });
        })} else {
            res.end(JSON.stringify(answ));
        }
    })
};

var listPosts = function(req, res) {
    var query_s = "SELECT p.*";
    var query_f = "FROM posts p ";
    var query_w = "WHERE p.forum = '" + req.query.forum + "' ";
    if(req.query.since)
        query_w += "AND p.date >= '" + req.query.since + "'";
    query_w += " ORDER BY p.date ";
    if(req.query.order != "asc")
        query_w += "DESC ";
    if(req.query.limit)
        query_w += "LIMIT " + req.query.limit;
    query_w += ";";
    if(req.query.related) {
        if(req.query.related instanceof Array) {
            for(var i = 0; i < req.query.related.length; i++) {
                switch (req.query.related[i]) {
                    case 'forum': query_s += ", f.id AS f_id, f.name as f_name, f.short_name as f_short_name, f.user as f_user";
                        query_f += "JOIN forums f ON p.forum = f.short_name "; break;
                    case 'thread': query_s += ", t.date AS t_date, t.dislikes AS t_dislikes, t.forum AS t_forum, t.id AS t_id, " +
                        "t.isClosed AS t_isClosed, t.isDeleted AS t_isDeleted, t.likes AS t_likes, t.message AS t_message, " +
                        "t.points AS t_points, t.posts AS t_posts, t.slug AS t_slug, t.title AS t_title, t.user AS t_user ";
                        query_f += "JOIN threads t ON p.thread = t.id "; break;
                    case 'user': query_s += ", u.id AS u_id, u.username AS u_username, u.about AS u_about, u.name AS u_name, " +
                        "u.email AS u_email, u.isAnonymous AS u_isAnonymous "; query_f += "JOIN users u ON u.email = p.user "; break;
                }
            }
        } else {
            switch (req.query.related) {
                case 'forum': query_s += ", f.id AS f_id, f.name as f_name, f.short_name as f_short_name, f.user as f_user";
                    query_f += "JOIN forums f ON p.forum = f.short_name "; break;
                case 'thread': query_s += ", t.date AS t_date, t.dislikes AS t_dislikes, t.forum AS t_forum, t.id AS t_id, " +
                    "t.isClosed AS t_isClosed, t.isDeleted AS t_isDeleted, t.likes AS t_likes, t.message AS t_message, " +
                    "t.points AS t_points, t.posts AS t_posts, t.slug AS t_slug, t.title AS t_title, t.user AS t_user ";
                    query_f += "JOIN threads t ON p.thread = t.id "; break;
                case 'user': query_s += ", u.id AS u_id, u.username AS u_username, u.about AS u_about, u.name AS u_name, " +
                    "u.email AS u_email, u.isAnonymous AS u_isAnonymous "; query_f += "JOIN users u ON u.email = p.user "; break;
            }
            req.query.related = [req.query.related];
        }
    }
    query_s += " ";
    serv.db.query(query_s + query_f + query_w, function(err, rows) {
        if(err) ;//console.log(err);
        if(req.query.related) {
            for (var i = 0; i < req.query.related.length; i++) {
                var substr = "";
                var field = "";
                switch (req.query.related[i]) {
                    case 'forum':
                        substr = "f_";
                        field = "forum";
                        break;
                    case 'thread':
                        substr = "t_";
                        field = "thread";
                        break;
                    case 'user':
                        substr = "u_";
                        field = "user";
                        break;
                }
                for (var j = 0; j < rows.length; j++) {
                    rows[j][field] = {};
                    for (var key in rows[j]) {
                        if (key.substr(0, 2) == substr) {
                            rows[j][field][key.substring(2)] = rows[j][key];
                            delete rows[j][key];
                        }
                    }
                }
            }
        }
        res.end(JSON.stringify({code:0, response: rows}));
    });
};

var listThreads = function(req, res) {
    var query_s = "SELECT t.*";
    var query_f = "FROM threads t ";
    var query_w = "WHERE t.forum = '" + req.query.forum + "' ";
    if(req.query.since)
        query_w += "AND t.date >= '" + req.query.since + "'";
    query_w += " GROUP BY t.id ORDER BY t.date ";
    if(req.query.order != "asc")
        query_w += "DESC ";
    if(req.query.limit)
        query_w += "LIMIT " + req.query.limit;
    query_w += ";";
    var userfix = 0;
    if(req.query.related) {
        if(req.query.related instanceof Array) {
            for(var i = 0; i < req.query.related.length; i++) {
                switch (req.query.related[i]) {
                    case 'forum': query_s += ", f.id AS f_id, f.name as f_name, f.short_name as f_short_name, f.user as f_user";
                        query_f += "JOIN forums f ON t.forum = f.short_name "; break;
                    case 'user': query_s += ", u.id AS u_id, u.username AS u_username, u.about AS u_about, u.name AS u_name, " +
                        "u.email AS u_email, u.isAnonymous AS u_isAnonymous, GROUP_CONCAT(DISTINCT f2.users_email_follower) " +
                        "AS u_followers, GROUP_CONCAT(DISTINCT f3.users_email_following) AS u_following, " +
                        "GROUP_CONCAT(DISTINCT s.threads_id) AS u_subscriptions ";
                        query_f += "JOIN users u ON u.email = t.user " +
                            "LEFT JOIN followers f2 ON u.email = f2.users_email_following " +
                            "LEFT JOIN followers f3 ON u.email = f3.users_email_follower " +
                            "LEFT JOIN subscriptions s ON u.email = s.users_email "; userfix = 1; break;
                }
            }
        } else {
            switch (req.query.related) {
                case 'forum': query_s += ", f.id AS f_id, f.name as f_name, f.short_name as f_short_name, f.user as f_user";
                    query_f += "JOIN forums f ON t.forum = f.short_name "; break;
                case 'user': query_s += ", u.id AS u_id, u.username AS u_username, u.about AS u_about, u.name AS u_name, " +
                    "u.email AS u_email, u.isAnonymous AS u_isAnonymous, GROUP_CONCAT(DISTINCT f2.users_email_follower) " +
                    "AS u_followers, GROUP_CONCAT(DISTINCT f3.users_email_following) AS u_following, " +
                    "GROUP_CONCAT(DISTINCT s.threads_id) AS u_subscriptions ";
                    query_f += "JOIN users u ON u.email = t.user " +
                    "LEFT JOIN followers f2 ON u.email = f2.users_email_following " +
                    "LEFT JOIN followers f3 ON u.email = f3.users_email_follower " +
                    "LEFT JOIN subscriptions s ON u.email = s.users_email "; userfix = 1; break;
            }
            req.query.related = [req.query.related];
        }
    }
    query_s += " ";
    serv.db.query(query_s + query_f + query_w, function(err, rows) {
        if(err) ;//console.log(err);
        if(req.query.related) {
            for (var i = 0; i < req.query.related.length; i++) {
                var substr = "";
                var field = "";
                switch (req.query.related[i]) {
                    case 'forum':
                        substr = "f_";
                        field = "forum";
                        break;
                    case 'user':
                        substr = "u_";
                        field = "user";
                        break;
                }
                for (var j = 0; j < rows.length; j++) {
                    rows[j][field] = {};
                    for (var key in rows[j]) {
                        if (key.substr(0, 2) == substr) {
                            rows[j][field][key.substring(2)] = rows[j][key];
                            delete rows[j][key];
                        }
                    }
                }
            }
            if(userfix) {
                for (var i = 0; i < rows.length; i++) {
                    if (rows[i].user.followers) rows[i].user.followers = rows[i].user.followers.split(',');
                    else rows[i].user.followers = [];
                    if (rows[i].user.following) rows[i].user.following = rows[i].user.following.split(',');
                    else rows[i].user.following = [];
                    if (rows[i].user.subscriptions) rows[i].user.subscriptions = rows[i].user.subscriptions.split(',');
                    else rows[i].user.subscriptions = [];
                    for (var j = 0; j < rows[i].user.subscriptions.length; j++)
                        rows[i].user.subscriptions[j] = +rows[i].user.subscriptions[j];
                }
            }
        }
        res.end(JSON.stringify({code:0, response: rows}));
    });
};

var listUsers = function(req, res) {
    /*var query = "SELECT about, email, GROUP_CONCAT(DISTINCT f2.users_email_follower) AS followers, GROUP_CONCAT(DISTINCT f3.users_email_following) AS following, " +
        "u.id, isAnonymous, name, GROUP_CONCAT(DISTINCT s.threads_id) AS subscriptions, username " +
        "FROM posts p JOIN users u ON u.email = p.user " +
        "LEFT JOIN followers f2 ON u.email = f2.users_email_following " +
        "LEFT JOIN followers f3 ON u.email = f3.users_email_follower " +
        "LEFT JOIN subscriptions s ON u.email = s.users_email " +
        "WHERE p.forum = '" + req.query.forum + "' ";*/

    var query = "SELECT about, email, u.id, isAnonymous, name, u.username " +
        "FROM posts p JOIN users u ON u.email = p.user " +
        "WHERE p.forum = '" + req.query.forum + "' ";
    query += "GROUP BY p.userName ORDER BY p.userName ";
    if(req.query.order != "asc")
        query += "DESC ";
    if(req.query.limit)
        query += "LIMIT " + req.query.limit;
    query += ";";
    //console.log(query);
    serv.db.query(query, function(err, rows) {
        if(err) console.log(err);
        if(rows.length == 0) {
            res.end(JSON.stringify({code:0, response: {}}));
            return;
        }
        var userEmail = "'a'";
        var prevRows = {};
        for(var i = 0; i < rows.length; i++) {
            console.log(JSON.stringify(rows[i]));
            prevRows[rows[i].email] = rows[i];
            prevRows[rows[i].email].followers = [];
            prevRows[rows[i].email].following = [];
            prevRows[rows[i].email].subscriptions = [];
            userEmail += ", '" + rows[i].email + "'";
        }
        var query = "(SELECT 0+0 AS ind, GROUP_CONCAT(users_email_following) AS value, users_email_follower AS user FROM followers WHERE users_email_follower IN (" + userEmail + ") GROUP BY user) " +
            "UNION (SELECT 0+1 AS ind, GROUP_CONCAT(users_email_follower) AS value, users_email_following AS user FROM followers WHERE users_email_following IN (" + userEmail + ") GROUP BY user) " +
            "UNION (SELECT 0+2 AS ind, GROUP_CONCAT(DISTINCT s.threads_id) AS value, users_email AS user FROM subscriptions s WHERE users_email IN (" + userEmail + ") GROUP BY user);";
        //console.log(userEmail);
        query = serv.db.query(query, function(err, rows) {
            if(err) console.log(err);
            //console.log(query);
            for(var i = 0; i < rows.length; i++) {
                switch (rows[i].ind) {
                    case 0: prevRows[rows[i].user].following = rows[i].value.split(','); break;
                    case 1: prevRows[rows[i].user].followers = rows[i].value.split(','); break;
                    case 2: prevRows[rows[i].user].subscriptions = rows[i].value.split(','); for (var j = 0; j < prevRows[rows[i].user].subscriptions.length; j++)
                        prevRows[rows[i].user].subscriptions[j] = +prevRows[rows[i].user].subscriptions[j]; break;
                }
            }
            var answ = [];
            console.log(JSON.stringify(prevRows));
            for(i in prevRows) {
                answ.push(prevRows[i]);
            }
            res.end(JSON.stringify({code:0, response: answ}));
        });
    });
};