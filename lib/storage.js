'use strict';
/*jshint -W079 */
let config = require('./config');
let storage = require("alphonso-fs")(config); // Store NPM Modules locally
// let storage = require("alphonso-s3")(config); You can also use s3, just update the config and update the storage variable here



module.exports = storage;
