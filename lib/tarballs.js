'use strict';

let storage = require('./storage');
let path = require('path');
let config = require('./config');
let crypto = require('crypto');

function sha1(data) {
  var generator = crypto.createHash('sha1');
  generator.update(data)
  return generator.digest('hex')
}

module.exports = function(metric, ctx) {
  let npm = require('./npm')(metric);

  function* get(name, filename, sha) {
    let key = `/tarballs/${name}/${filename}/${sha}`;
    let tarball = yield storage.fileExists(key);
    if (!tarball) {
      console.error(`saving ${key} to fs`);
      tarball = yield npm.getTarball(name, filename + path.extname(sha));
      yield storage.writePackage(key, tarball);
      tarball = storage.streamFile( key);
      return tarball;
    }
    else {
      return storage.readFile(key);
    }
    // tarball.size = tarball.headers['content-length'];

  }

  return {
    get: get,
  };
};