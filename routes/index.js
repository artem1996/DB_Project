
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.end('index', { title: 'Express' });
  console.log("hi, bitch");
};