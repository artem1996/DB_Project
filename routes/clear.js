var connection = require('./servicies');

exports.index = function(req, res) {
    var cnt = 0;
    for(var any in req.body) cnt++;
    if(cnt>0) {
        res.end(JSON.stringify({code: 3, message: "некорректный запрос (семантически)"}));
    } else {
        connection.db.query("DELETE FROM followers;", function(err, rows) {
            cnt++;
        });
        connection.db.query("DELETE FROM subscriptions;", function(err, rows) {
            cnt++;
        });
        connection.db.query("DELETE FROM posts;", function(err, rows) {
            cnt++;
        });
        connection.db.query("DELETE FROM threads;", function(err, rows) {
            cnt++;
        });
        connection.db.query("DELETE FROM forums;", function(err, rows) {
            cnt++;
        });
        connection.db.query("DELETE FROM users;", function(err, rows) {
            cnt++;
        });
        while (cnt != 6);
        res.end(JSON.stringify({code: 0, response: "OK"}));
    }
};