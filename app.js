
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var fs = require('fs');
fileSuffix = "snap"; // This should get overwritten promptly, but just in case, we need some value

var app = express();

var helpers = require('express-helpers');
helpers(app);

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
//  io = require('socket.io').listen(server); // With heartbeat debug messages heading to console.
  io = require('socket.io').listen(server, { log: false }); // With heartbeat debug messages to console squelched.

  io.sockets.on('connection', function (socket) {
    cameraSettings = readCameraSettings(socket);
    socket.emit('cameraSettings', cameraSettings);
    generalSettings = readGeneralSettings(socket);
    socket.emit('generalSettings', generalSettings);
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
    socket.on('generalSettings', function (data) {
      console.log(data);
      writeGeneralSettings(data);
    });
    socket.on('disconnect', function() {
      console.log("Disconnect detected. Disabling preview if active.");
      shutOffPreview();
    });
    socket.on('turnOnPreviews', function() {
      turnOnPreview();
    });
    socket.on('turnOffPreviews', function() {
      shutOffPreview();
    });
  });
});

function shutOffPreview() {
  console.log("Shutting off preview image capture.");
  var sys = require('sys')
  var exec = require('child_process').exec;
  function puts(error, stdout, stderr) { sys.puts(stdout) }
  exec("./turnOffImagePreview", puts);
}

function turnOnPreview() {
  console.log("Turning on preview image capture.");
  var sys = require('sys')
  var exec = require('child_process').exec;
  function puts(error, stdout, stderr) { sys.puts(stdout) }
  exec("./turnOnImagePreview", puts);
}

function sensitivityString() {
  if (cameraSettings.sensitivity == "100") {return "--ISO 100 ";}
  else if (cameraSettings.sensitivity == "200") {return "--ISO 200 ";}
  else if (cameraSettings.sensitivity == "400") {return "--ISO 400 ";}
}

function sharpnessString() {
  if (cameraSettings.sharpness == "natural") {return "";}
  else if (cameraSettings.sharpness == "sharpened") {return "--sharpness 50 ";}
}

function contrastString() {
  if (cameraSettings.contrast == "natural") {return "";}
  else if (cameraSettings.contrast == "reduced") {return "--contrast 50 ";}
  else if (cameraSettings.contrast == "increased") {return "--contrast -50 ";}
}

function saturationString() {
  if (cameraSettings.saturation == "natural") {return "";}
  else if (cameraSettings.saturation == "mutedColors") {return "--saturation 50 ";}
  else if (cameraSettings.saturation == "vividColors") {return "--saturation -50 ";}
}

function brightnessString() {
  if (cameraSettings.brightness == "natural") {return "";}
  else if (cameraSettings.brightness == "dimmer") {return "--brightness 10 ";}
  else if (cameraSettings.brightness == "brighter") {return "--brightness 100 ";}
}

function imageSizeString() {
  if (cameraSettings.imageSize == "full") {return "";}
  else if (cameraSettings.imageSize == "reduced800") {return "--width 800 --height 600 ";}
  else if (cameraSettings.imageSize == "reduced1200") {return "--width 1200 --height 900 ";}
}

function snap () {
  var sys = require('sys')
  var exec = require('child_process').exec;
  var dateformat = require('dateformat');
  var now = new Date();
  var filename_time_prefix = dateformat(now, "yyyy-mm-dd_HHMMss");
  function puts(error, stdout, stderr) { sys.puts(stdout) }
  var cameraSettings = readCameraSettings();
  // this os where to read the different camera settings and modify the command that follows.
  var cameraCommand = "raspistill ";
  cameraCommand += sensitivityString();
  cameraCommand += sharpnessString();
  cameraCommand += contrastString();
  cameraCommand += saturationString();
  cameraCommand += brightnessString();
  cameraCommand += imageSizeString();
  cameraCommand += "-o ./public/images/fullsnaps/"+filename_time_prefix+"_"+fileSuffix+".jpg";
  //exec("raspistill -o ./public/images/fullsnaps/"+filename_time_prefix+"_"+fileSuffix+".jpg", puts);
  console.log(cameraCommand);
  exec(cameraCommand, puts);
}

function writeCameraSettings (newCameraSettings) {
  cameraSettings = newCameraSettings;
  var fd = fs.openSync("/var/www/cameraSettings.cfg", 'w', 0666);
  fs.writeSync(fd, JSON.stringify(cameraSettings));
  fs.closeSync(fd);
}

function writeGeneralSettings (newGeneralSettings) {
  generalSettings = newGeneralSettings;
  fileSuffix = generalSettings.fileSuffix;
  console.log("General Settings updated:");
  console.log(generalSettings);
  var fd = fs.openSync("/var/www/generalSettings.cfg", 'w', 0666);
  fs.writeSync(fd, JSON.stringify(generalSettings));
  fs.closeSync(fd);
}

function readCameraSettings (socket) {
  if (!fs.existsSync("/var/www/cameraSettings.cfg")) createDefaultCameraConfigFile();
  var cameraSettingsString = fs.readFileSync("/var/www/cameraSettings.cfg");
  cameraSettings = JSON.parse(cameraSettingsString);
  return cameraSettings;
}

function readGeneralSettings (socket) {
  if (!fs.existsSync("/var/www/generalSettings.cfg")) createDefaultGeneralConfigFile();
  var generalSettingsString = fs.readFileSync("/var/www/generalSettings.cfg");
  generalSettings = JSON.parse(generalSettingsString);
  fileSuffix = generalSettings.fileSuffix;
  return generalSettings;
}

function createDefaultCameraConfigFile() {
  var cameraSettings = '{"sensitivity":"100","sharpness":"natural","contrast":"natural","saturation":"natural","brightness":"natural","imageSize":"full"}';
  var fd = fs.openSync("/var/www/cameraSettings.cfg", 'w', 0666);
  fs.writeSync(fd, cameraSettings);
  fs.closeSync(fd);
}

function createDefaultGeneralConfigFile() {
  var generalSettings = '{"uploadSite":"dropbox","fileSuffix":"snap"}';
  var fd = fs.openSync("/var/www/generalSettings.cfg", 'w', 0666);
  fs.writeSync(fd, generalSettings);
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
