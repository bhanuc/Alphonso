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
    let tarball = yield storage.exists(path.join(config.directory, key))
    if (!tarball) {
      console.error(`saving ${key} to fs`);
      tarball = yield npm.getTarball(name, filename + path.extname(sha));
      yield storage.writePackage(path.join(config.directory, key), tarball);
      tarball = storage.readFile(path.join(config.directory, key));
      return tarball;
    }
    else {
      return storage.readFile(path.join(config.directory, key));
    }
    // tarball.size = tarball.headers['content-length'];

  }

  return {
    get: get,
  };
};