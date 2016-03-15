'use strict';
/*jshint -W079 */
let config = require('./config');
let util = require('./util');
let fs = require('mz/fs');
let Bluebird = require('bluebird');
let path = require('path');
let mkdirp = require('mkdirp');
let homeDir = path.join(__dirname, "..");

function writePackage(filename, content) {
  return new Bluebird(function(fulfill, reject) {
    let dir = path.dirname(filename);
    mkdirp(dir, function(err) {
      if (err) {
        reject(err);
      } else {
        let wstream = fs.createWriteStream(filename);
        fulfill(content.pipe(wstream));
      }
    });
  });
}

function stream(key) {
  return fs.exists(path.join(homeDir, key)).then(function(exists) {
    if (exists) {
      return fs.createReadStream(path.join(homeDir, key));
    } else {
      return;
    }
  }).catch(function(err) {
    throw new Error('Error downloading ' + key + '\n' + err);
  })
}

function download(key) {
  return stream(key)
    .then(function(res) {
      console.log(res);
      if (!res) {
        return;
      }
      return util.concat(res);
    });
}
module.exports = fs;
module.exports.stream = stream;
module.exports.download = download;
module.exports.writePackage = writePackage;
module.exports.homeDir = homeDir;