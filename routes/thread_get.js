var serv = require('./servicies');

exports.index = function(req, res, next) {
    switch (req.params.name) {
        case 'details': details(req, res); break;
        case 'list': list(req, res); break;
        case 'listPosts': listPosts(req, res); break;
        default: next();
    }
};

var details = function(req, res) {
    if(!req.query.thread) {
        res.end(serv.error_message(2));
        return;
    }
    serv.db.query("SELECT * FROM threads WHERE id = ?;", req.query.thread, function(err, rows) {
        if(err || !rows.length) {
           ;//console.log(err);
            res.end(serv.error_message(3));
            return;
        }
        var answ = {code:0, response: serv.clone_obj(rows[0])};
        if(req.query.related && req.query.related.length) {
            var add = {counter: 0};
            for (var i = 0; i < req.query.related.length; i++) {
                add[req.query.related[i]] = 1;
                add.counter++;
            }
            var query = "";
            if(add.user) {query = query + "SELECT * FROM users WHERE email = '" + answ.response.user + "'; "; add.counter--;}
            if(add.forum) {query = query + "SELECT * FROM forums WHERE short_name = '" + answ.response.forum + "';"; add.counter--;}
            if(add.counter) {
                res.end(serv.error_message(3));
                return;
            } else {
                res.end(JSON.stringify(answ));
                return;
            }
            serv.db.query(query, function(err, rows) {
                if(err) {
                   ;//console.log(err);
                    res.end(serv.error_message(3));
                    return;
                }
                if(add.user) {
                    answ.response.user = rows[0];
                    if(add.forum) answ.response.forum = rows[1];
                } else {
                    answ.response.forum = rows[0];
                }
                res.end(JSON.stringify(answ));
            });
        } else {
            res.end(JSON.stringify(answ));
        }

    });
};

var list = function(req, res) {
    if(!req.query.user && !req.query.forum) {
        res.end(serv.error_message(3));
        return;
    }
    var query = "SELECT * FROM threads WHERE ";
    if(req.query.user) {
        query += "user = '" + req.query.user + "'";
    } else {
        query += "forum = '" + req.query.forum + "'";
    }
    if(req.query.since) {
        query += " AND date > '" + req.query.since +"'";
    }
    query += " ORDER BY date";
    if(req.query.order != "asc") {
        query += " DESC";
    }
    if(req.query.limit) {
        query += " LIMIT " + req.query.limit;
    }
    query += ";";
    serv.db.query(query, function(err, rows) {
        if(err) {
            res.end(serv.error_message(3));
           ;//console.log(err);
            return;
        }
        res.end(JSON.stringify({code:0, response: rows}));
    });
};

var listPosts = function(req, res) {
    if(!req.query.thread) {
        res.end(serv.error_message(3));
        return;
    }
    var query = "";
    if(!req.query.sort || req.query.sort == "flat") {
        query = "SELECT * FROM posts WHERE thread = " + req.query.thread;
        if(req.query.since) {
            query += " AND date > '" + req.query.since +"'";
        }
        query += " ORDER BY date";
        if(req.query.order != "asc")
            query += " DESC";
        if(req.query.limit)
            query += " LIMIT " + req.query.limit;
    }
    if(req.query.sort && req.query.sort == "tree") {
        query = "SELECT mpath + 0 AS main, p.* FROM posts p WHERE thread = " + req.query.thread;
        if(req.query.since)
            query += " AND date > '" + req.query.since +"'";
        query += " ORDER BY 1";
        if(req.query.order != "asc")
            query += " DESC";
        query += ", mpath ";
        query +=", date";
        if(req.query.limit)
            query += " LIMIT " + req.query.limit;
    }
    if(query != "") {
        serv.db.query(query, function(err, rows) {
            if(err) {
                res.end(serv.error_message(3));
               ;//console.log(err);
                return;
            }
            for(var i = 0; i < rows.length; i++) {
                rows[i].isApproved = !!rows[i].isApproved;
                rows[i].isHighlighted = !!rows[i].isHighlighted;
                rows[i].isEdited = !!rows[i].isEdited;
                rows[i].isSpam = !!rows[i].isSpam;
                rows[i].isDeleted = !!rows[i].isDeleted;
            }
            res.end(JSON.stringify({code:0, response: rows}));
        });
    }
    if(req.query.sort && req.query.sort == "parent_tree") {
        query = "SELECT mpath + 0 AS main, p.* FROM posts p WHERE thread = " + req.query.thread;
        var subquery = "SELECT mpath + 0 AS main FROM posts WHERE thread = " + req.query.thread;
        if(req.query.since)
            subquery += " AND date > '" + req.query.since + "'";
        subquery += " GROUP BY 1 ORDER BY 1";
        if(req.query.order != "asc")
            subquery += " DESC";
        if(req.query.limit)
            subquery += " LIMIT " + req.query.limit;
        serv.db.query(subquery, function(err, rows) {
            if(err) {
               ;//console.log(err);
                return;
            }
            subquery = "-1";
            for(var i = 0; i < rows.length; i++)
                subquery += ", " + rows[i].main;
            query += " AND (mpath + 0) IN (" + subquery + ") ORDER BY 1, mpath, date;";
            serv.db.query(query, function(err, rows) {
                if(err) {
                    res.end(serv.error_message(3));
                   ;//console.log(err);
                    return;
                }
                res.end(JSON.stringify({code:0, response: rows}));
            });
        });
    }
};