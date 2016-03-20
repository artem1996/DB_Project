exports.index = function(req, res) {
    res.end(JSON.stringify(req.body));
};