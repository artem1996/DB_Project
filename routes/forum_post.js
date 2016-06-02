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
            req.body.id = rows.insertId;
            res.end(JSON.stringify({code: 0, response: req.body}));
        })
};
