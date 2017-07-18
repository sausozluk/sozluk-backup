var fs = require('fs');
var backup = require('mongodb-backup');
var cronjob = require('cron').CronJob;
var dotenv = require('dotenv').config();
var env = process.env['SOZLUK_ENV'] || 'local';
var config = require(__dirname + '/confs/' + env);

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
  backup({
    uri: config['mongo_uri'],
    root: __dirname + '/backups',
    logger: __dirname + '/logs/log',
    tar: time.getTime() + '.tar',
    callback: function (err) {
      if (err) {
        console.error('[ERR]', err.message);
      } else {
        console.log('[SOZLUK-BACKUP] Done at', new Date());
      }
    }
  });
};

var job = new cronjob('00 00 7-23/2 * * *', function () {
  doClean();
  doBackup();
}, function () {
}, true, 'Europe/Istanbul');

console.log('[APP]', 'running with', env);
