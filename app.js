const fs = require('fs');
const aws = require('aws-sdk');
const backup = require('mongodb-backup');
const cronjob = require('cron').CronJob;
const dotenv = require('dotenv').config();
const env = process.env['SOZLUK_ENV'] || 'local';
const config = require(__dirname + '/confs/' + env);
const express = require('express');
const app = express();
const port = 5454;

aws.config.update({
  accessKeyId: config['accessKeyId'],
  secretAccessKey: config['secretAccessKey']
});

const doUpload = (name, path) => {
  const data = fs.readFileSync(path);
  const base64 = new Buffer(data, 'binary');

  var s3 = new aws.S3();
  s3.putObject({
    Bucket: 'sozluk',
    Key: name,
    Body: base64,
    ACL: 'private'
  }, (err, data) => {
    if (err) {
      console.log('[ERR] ' + err.message);
    } else {
      console.log('[AWS-UPLOAD] Done');
    }
  })
};

const doClean = () => {
  const files = fs.readdirSync(__dirname + '/backups')
    .filter((file) => {
      return file.indexOf('.tar') > 0;
    }).sort((a, b) => {
      var x = a.substr(0, a.length - 4);
      var y = b.substr(0, b.length - 4);
      return parseInt(x) < parseInt(y);
    });

  for (let i = 2; i < files.length; i++) {
    const name = files[i];
    fs.unlinkSync(__dirname + '/backups/' + name);
    console.log('[SOZLUK-CLEAN] Cleaned', name);
  }
};

const doBackup = () => {
  const time = new Date();
  const fileName = time.getTime() + '.tar';
  const filePath = __dirname + '/backups/' + fileName;

  backup({
    uri: config['mongo_uri'],
    root: __dirname + '/backups',
    logger: __dirname + '/logs/log',
    tar: fileName,
    callback: (err) => {
      if (err) {
        console.error('[ERR]', err.message);
      } else {
        console.log('[SOZLUK-BACKUP] Done at', time);
        doUpload(fileName, filePath);
      }
    }
  });
};

const trigger = () => {
  doClean();
  doBackup();
};

const job = new cronjob('00 00 */8 * * *', trigger, () => {
}, true, 'Europe/Istanbul');

app.get('/', (req, res) => {
  trigger();
  res.send('Done at ' + new Date())
});

app.listen(port, () => console.log('[APP]', 'running with', env));
