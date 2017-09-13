'use strict';

const _ = require('lodash');

let fs = {};

/**
 * wrapper around common filesystem actions
 */
module.exports = {

    /**
     * returns the local cache dir
     * @returns {String}
     */
    getCacheDir() {
        return '/imagesCacheDir';
    },

    /**
     * returns a promise that is resolved when the download of the requested file
     * is complete and the file is saved.
     * if the download fails, or was stopped the partial file is deleted, and the
     * promise is rejected
     * @param fromUrl   String source url
     * @param toFile    String destination path
     * @param headers   Object with headers to use when downloading the file
     * @returns {Promise}
     */
    downloadFile(fromUrl, toFile, headers) {
        fs[toFile] = fromUrl;
        return Promise.resolve(toFile);
    },

    /**
     * remove the file in filePath if it exists.
     * this method always resolves
     * @param filePath
     * @returns {Promise}
     */
    deleteFile(filePath) {
        delete fs[filePath];
        return Promise.resolve();
    },

    /**
     * copy a file from fromFile to toFile
     * @param fromFile
     * @param toFile
     * @returns {Promise}
     */
    copyFile(fromFile, toFile) {
        fs[toFile] = fs[fromFile] || fromFile;
        return Promise.resolve();
    },

    /**
     * remove the contents of dirPath
     * @param dirPath
     * @returns {Promise}
     */
    cleanDir(dirPath) {
        fs = _.omitBy(fs, (v, k) => _.startsWith(k, dirPath));
        return Promise.resolve();
    },

    /**
     * get info about files in a folder
     * @param dirPath
     * @returns {Promise.<{file:Array, size:Number}>}
     */
    getDirInfo(dirPath) {
        const files = _(fs)
            .pickBy((v, k) => _.startsWith(k, dirPath))
            .map((v, k) => ({
                filename: k,
                source: v,
                size: 1
            }))
            .value();
        return Promise.resolve({
            files,
            size: files.length
        });
    },

};