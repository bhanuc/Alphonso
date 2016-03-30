'use strict';
/*jshint -W079 */
let config = require('./config');
let util = require('./util');
let fs = require('mz/fs');
let Bluebird = require('bluebird');
let path = require('path');
let mkdirp = require('mkdirp');


function writePackage(filename, content) {
  return new Bluebird(function(fulfill, reject) {
    let dir = path.dirname(filename);
    mkdirp(dir, function(err) {
      if (err) {
        reject(err);
      } else {
        let wstream = fs.createWriteStream(filename);
        content.pipe(wstream);
         wstream.on('finish', function () { fulfill()});
        
      }
    });
  });
}

function writeContent(filename, content) {
  return new Bluebird(function(fulfill, reject) {
    let dir = path.dirname(filename);
    mkdirp(dir, function(err) {
      if (err) {
        reject(err);
      } else {
        fulfill(fs.writeFile(filename, content));
      }
    });
  });
}

function stream(key) {
  return fs.exists(path.join(config.directory, key)).then(function(exists) {
    if (exists) {
      return fs.createReadStream(path.join(config.directory, key));
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
module.exports.writeContent = writeContent;