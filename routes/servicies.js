var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'forums_db',
    multipleStatements: true,
    dateStrings: true,
    timezone: 0000
});

var error_message = function(code) {
    switch (code) {
        case 1: return(JSON.stringify({code:1, response:"запрашиваемый объект не найден"})); break;
        case 2: return(JSON.stringify({code:2, response:"невалидный запрос (например, не парсится json)"})); break;
        case 3: return(JSON.stringify({code:3, response:"некорректный запрос (семантически)"})); break;
        case 4: return(JSON.stringify({code:4, response:"неизвестная ошибка"})); break;
        case 5: return(JSON.stringify({code:5, response:"такой юзер уже существует"})); break;
    }
};

var obj_to_array = function(obj, arr) {
    if(obj.length) {
        for (var i = 0; i < obj.length; i++) {
            for (var key in obj[i]) {
                arr.push(obj[i][key]);
            }
        }
    }
};

function clone_obj (obj) {
    var copy = new Object();
    for (var attr in obj) {
        copy[attr] = obj[attr];
    }
    return copy;
}

exports.db = connection;
exports.error_message = error_message;
exports.obj_to_array = obj_to_array;
exports.clone_obj = clone_obj;