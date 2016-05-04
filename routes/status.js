var connection = require('./servicies');

exports.index = function(req, res) {
    connection.db.query("(SELECT count(*) as numb from users) UNION ALL (SELECT count(*) as numb from threads) UNION ALL " +
        "(SELECT count(*) as numb from forums) UNION ALL (SELECT count(*) as numb from posts);", function(err, rows, fields) {
        if (err) ;//console.log(err);
        res.end(JSON.stringify({code: 0, response: {user: rows[0].numb, thread: rows[1].numb, forum: rows[2].numb, post: rows[3].numb}}));
    });
};