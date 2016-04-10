'use strict';

let co = require('co');
let storage = require('./storage');
let extend = require('util')._extend;
let url = require('url');
let path = require('path');
let crypto = require('crypto');
let config = require('./config');


const errors = {
  versionExists: new Error('version already exists')
};

module.exports = function(metric) {
  let npm = require('./npm')(metric);

  function * savePkg(pkg) {
    let data = new Buffer(JSON.stringify(pkg));
    yield storage.writeContent(`/packages/${pkg.name}`, data);
  }

  function refreshPkg(npmPkg) {
    co(function * () {
      let localPkg = yield storage.download(`/packages/${npmPkg.name}`);
      if (!localPkg) {
        yield savePkg(npmPkg);
        return;
      }
      localPkg = JSON.parse(localPkg);
      if (npmPkg._rev !== localPkg._rev) {
        yield savePkg(npmPkg);
      }
    }).catch(function(err) {
      metric.event('error', err.stack);
    });
  }

  function * get(name, etag) {
    let pkg = yield npm.get(name, etag);
    if (pkg === 304) {
      return 304;
    }
    if (pkg === 404) {
      pkg = yield storage.download(`/packages/${name}`);
      if (!pkg) {
        return 404;
      }
      return JSON.parse(pkg);
    }
    refreshPkg(pkg);
    return pkg;
  }

  function addShaToPath(p, sha) {
    let ext = path.extname(p);
    let filename = path.basename(p, ext);
    p = path.dirname(p);
    p = path.join(p, `${filename}/${sha}${ext}`);
    return p;
  }

  function rewriteTarballURLs(pkg, host) {
    for (let version of Object.keys(pkg.versions)) {
      let dist = pkg.versions[version].dist;
      let u = url.parse(dist.tarball);
      u.pathname = addShaToPath(u.pathname, dist.shasum);
      u.host = host;
      dist.tarball = url.format(u);
    }
  }

  function contains(arr, obj) {
    for (let x of arr) {
      if (x === obj) {
        return true;
      }
    }
    return false;
  }

  function * upload(pkg) {
    let existing = yield get(pkg.name);
    if (existing !== 404) {
      if (contains(Object.keys(existing.versions), pkg['dist-tags'].latest)) {
        throw errors.versionExists;
      }
      pkg.versions = extend(existing.versions, pkg.versions);
    }
    pkg.etag = Math.random().toString();
    let attachments = pkg._attachments;
    delete pkg._attachments;
    for (let filename of Object.keys(attachments)) {
      let attachment = attachments[filename];
      let data = new Buffer(JSON.stringify(attachment.data), 'base64');

      let hash = crypto.createHash('sha1');
      hash.update(data);
      let sha = hash.digest('hex');
      let ext = path.extname(filename);
      filename = path.basename(filename, ext);
      yield storage.writePackage( `/tarballs/${pkg.name}/${filename}/${sha}${ext}`, data,  {
        'Content-Type': attachment.content_type,
        'Content-Length': attachment.length
      }, "buffer");
    }
    yield savePkg(pkg);
  }

  return {
    get: get,
    rewriteTarballURLs,
    upload,
    errors,
  };
};