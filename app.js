
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon(path.join(__dirname, 'public/images/favicon.ico'))); 
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.directory(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/images.html', routes.dir);
app.get('/users', user.list);

server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  io = require('socket.io').listen(server);

  io.sockets.on('connection', function (socket) {
    cameraSettings = readCameraSettings(socket);
    socket.emit('cameraSettings', cameraSettings);
    socket.on('my other event', function (data) {
      console.log(data);
    });
    socket.on('snapRequest', function (data) {
      console.log(data);
      snap();
    });
    socket.on('cameraSettings', function (data) {
      console.log(data);
      writeCameraSettings(data);
    });
  });
});

function snap () {
  var sys = require('sys')
  var exec = require('child_process').exec;
  var dateformat = require('dateformat');
  var now = new Date();
  var filename_time_prefix = dateformat(now, "yyyy-mm-dd_HHMMss");
  function puts(error, stdout, stderr) { sys.puts(stdout) }
  var cameraSettings = readCameraSettings();
  // this os where to read the different camera settings and modify the command that follows.
  exec("raspistill -o ./public/images/fullsnaps/"+filename_time_prefix+"snap.jpg", puts);
}

function writeCameraSettings (cameraSettings) {
  var fd = fs.openSync("/var/www/cameraSettings.cfg", 'w', 0666);
  fs.writeSync(fd, JSON.stringify(cameraSettings));
  fs.closeSync(fd);
}

function readCameraSettings (socket) {
  if (!fs.existsSync("/var/www/cameraSettings.cfg")) createDefaultConfigFile();
  var cameraSettingsString = fs.readFileSync("/var/www/cameraSettings.cfg");
  var cameraSettings = JSON.parse(cameraSettingsString);
  return cameraSettings;
}

function createDefaultConfigFile() {
  var cameraSettings = '{"sensitivity":"100","sharpness":"natural","contrast":"natural","saturation":"natural","brightness":"natural","imageSize":"full"}';
  var fd = fs.openSync("/var/www/cameraSettings.cfg", 'w', 0666);
  fs.writeSync(fd, cameraSettings);
  fs.closeSync(fd);
}

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
