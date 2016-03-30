'use strict';

let fs = require('./fs');
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
    let tarball = yield fs.exists(path.join(config.directory, key))
    if (!tarball) {
      console.error(`saving ${key} to fs`);
      tarball = yield npm.getTarball(name, filename + path.extname(sha));
      yield fs.writePackage(path.join(config.directory, key), tarball);
      tarball = fs.readFile(path.join(config.directory, key));
      console.log(sha, tarball);
      return tarball;
    }
    else {
      return fs.readFile(path.join(config.directory, key));
    }
    // tarball.size = tarball.headers['content-length'];

  }

  return {
    get: get,
  };
};