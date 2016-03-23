var serv = require('./servicies');

exports.index = function(req, res, next) {
    switch (req.params.name) {
        case 'create': create(req, res); break;
        default: next();
    }
};

var create = function(req, res) {
    var instead = [req.body.name, req.body.short_name, req.body.user];
    serv.db.query("INSERT INTO forums VALUES(NULL, ?, ?, ?);", instead,
        function(err, rows) {
            if (err) {
                res.end(serv.error_message(5));
                return;
            }
            var id = rows.insertId;
            serv.db.query("SELECT * FROM forums WHERE id = ?;", id, function(err, rows) {
                if (err) console.log(err);
                res.end(JSON.stringify({code: 0, response: rows[0]}));
            })
        })
};
