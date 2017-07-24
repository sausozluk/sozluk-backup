var fs = require('fs');
var aws = require('aws-sdk');
var backup = require('mongodb-backup');
var cronjob = require('cron').CronJob;
var dotenv = require('dotenv').config();
var env = process.env['SOZLUK_ENV'] || 'local';
var config = require(__dirname + '/confs/' + env);

aws.config.update({
  accessKeyId: config['accessKeyId'],
  secretAccessKey: config['secretAccessKey']
});

var doUpload = function (name, path) {
  var data = fs.readFileSync(path);
  var base64 = new Buffer(data, 'binary');

  var s3 = new aws.S3();
  s3.putObject({
    Bucket: 'sozluk',
    Key: name,
    Body: base64,
    ACL: 'private'
  }, function () {
    console.log('[AWS-UPLOAD] Done');
  })
};

var doClean = function () {
  var files = fs.readdirSync(__dirname + '/backups')
    .filter(function (file) {
      return file.indexOf('.tar') > 0;
    }).sort(function (a, b) {
      var x = a.substr(0, a.length - 4);
      var y = b.substr(0, b.length - 4);
      return parseInt(x) < parseInt(y);
    });

  for (var i = 2; i < files.length; i++) {
    var name = files[i];
    fs.unlinkSync(__dirname + '/backups/' + name);
    console.log('[SOZLUK-CLEAN] Cleaned', name);
  }
};

var doBackup = function () {
  var time = new Date();
  var fileName = time.getTime() + '.tar';
  var filePath = __dirname + '/backups/' + fileName;

  backup({
    uri: config['mongo_uri'],
    root: __dirname + '/backups',
    logger: __dirname + '/logs/log',
    tar: fileName,
    callback: function (err) {
      if (err) {
        console.error('[ERR]', err.message);
      } else {
        console.log('[SOZLUK-BACKUP] Done at', time);
        doUpload(fileName, filePath);
      }
    }
  });
};

var job = new cronjob('00 00 */2 * * *', function () {
  doClean();
  doBackup();
}, function () {
}, true, 'Europe/Istanbul');

console.log('[APP]', 'running with', env);
