'use strict';

let fs = require('./fs');
let path = require('path');
let config = require('./config');

module.exports = function(metric, ctx) {
  let npm = require('./npm')(metric);

  function * get(name, filename, sha) {
    let key = `/tarballs/${name}/${filename}/${sha}`;
    let tarball = yield fs.exists(path.join(config.directory, key))
    if (!tarball) {
      console.error(`saving ${key} to fs`);
      tarball = yield npm.getTarball(name, filename + path.extname(sha));
      yield fs.writePackage(path.join(config.directory, key), tarball);
      tarball = fs.readFile(path.join(config.directory, key));
    } else {
      return fs.readFile(path.join(config.directory, key));
    }

    if (!tarball) {
      return;
    }
    // tarball.size = tarball.headers['content-length'];
    return tarball;
  }

  return {
    get: get,
  };
};