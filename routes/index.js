
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.dir = function(req, res){
  var fs = require('fs');
  var ls = fs.readdirSync('/var/www/public/images/fullsnaps');
  ls.sort();
  ls.reverse();
  ls = { ls: ls };
  res.render('dir', ls);
};
