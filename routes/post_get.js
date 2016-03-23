var serv = require('./servicies');

exports.index = function(req, res, next) {
    switch (req.params.name) {
        case 'list': list(req, res); break;
        case 'details': details(req, res); break;
        default: next();
    }
};

var list = function(req, res) {
    if (!req.query.forum && !req.query.thread) {
        res.end(serv.error_message(3));
        return;
    }
    var query = "SELECT * FROM posts WHERE " + (req.query.forum? "forum='" + req.query.forum: "thread='" + req.query.thread) + "' ";
    if (req.query.since) {
        query = query + "AND date >= '" + req.query.since + "' ";
    }
    if (req.query.order == "asc") {
        query = query + "ORDER BY date ";
    } else {
        query = query + "ORDER BY date DESC ";
    }
    if (req.query.limit) {
        query = query + "LIMIT " + req.query.limit;
    }
    query = query + ";";
    serv.db.query(query, function(err, row) {
        if(err) {
            console.log(err);
            res.end(serv.error_message(3));
            return;
        }
        for(var i = 0; i < row.length; i++) {
            row[i].isApproved = !!row[i].isApproved;
            row[i].isHighlighted = !!row[i].isHighlighted;
            row[i].isDeleted = !!row[i].isDeleted;
            row[i].isEdited = !!row[i].isEdited;
            date = JSON.stringify(row[i].date);
            row[i].date = date.substr(1,10) + " " + date.substr(12,8);
        }
        res.end(JSON.stringify({code: 0, response: row}));
    });
};

var details = function(req, res) {
    if(!req.query.post) {
        res.end(serv.error_message(2));
        return;
    }
    serv.db.query("SELECT * FROM posts WHERE id = ?;", req.query.post, function(err, rows) {
        if(err || !rows.length) {
            console.log(err);
            res.end(serv.error_message(1));
            return;
        }
        var answ = {code:0, response: serv.clone_obj(rows[0])};
        res.end(JSON.stringify(answ));
    });
};