'use strict';

const _ = require('lodash');

const fsUtils = require('./utils/fsUtils');
const pathUtils = require('./utils/pathUtils');

const MemoryCache = require('react-native-clcasher/MemoryCache').default;

const defaultDefaultOptions = {
    headers: {},
    ttl: 60 * 60 * 24 * 14, // 2 weeks
    useQueryParamsInCacheKey: false,
    cacheLocation: fsUtils.getCacheDir()
};

module.exports = (urlCache = MemoryCache, defaultOptions = defaultDefaultOptions) => ({

    /**
     * seed the cache for a specific url with a local file
     * @param url
     * @param seedPath
     * @param options
     * @returns {Promise}
     */
    seedUrl(url, seedPath, options) {
        _.defaults(options, defaultOptions);
        url = pathUtils.getCacheableUrl(url, options.useQueryParamsInCacheKey);
        // note: urlCache may remove the entry if it expired so we need to remove the leftover file manually
        return urlCache.get(url)
            // url is not found in the cache or is expired
            .catch(() => {
                const filePath = pathUtils.getImageFilePath(url, options.cacheLocation);
                // remove expired file if exists
                return fsUtils.deleteFile(filePath)
                    // copy image to cache
                    .then(() => fsUtils.copyFile(seedPath, filePath));
            })
            // add to cache
            .then(filePath => urlCache.set(url, filePath, options.ttl));
    },

    /**
     * download an image and cache the result according to the given options
     * @param url
     * @param options
     * @returns {Promise}
     */
    cacheUrl(url, options) {
        _.defaults(options, defaultOptions);
        url = pathUtils.getCacheableUrl(url, options.useQueryParamsInCacheKey);
        // note: urlCache may remove the entry if it expired so we need to remove the leftover file manually
        return urlCache.get(url)
            // url is not found in the cache or is expired
            .catch(() => {
                const filePath = pathUtils.getImageFilePath(url, options.cacheLocation);
                // remove expired file if exists
                return fsUtils.deleteFile(filePath)
                    // download image to cache
                    .then(() => fsUtils.downloadFile(url, filePath, options.headers));
            })
            // add to cache
            .then(filePath => urlCache.set(url, filePath, options.ttl));
    },

    /**
     * delete the cache entry and file for a given url
     * @param url
     * @param options
     * @returns {Promise}
     */
    deleteUrl(url, options) {
        _.defaults(options, defaultOptions);
        url = pathUtils.getCacheableUrl(url, options.useQueryParamsInCacheKey);
        const filePath = pathUtils.getImageFilePath(url, options.cacheLocation);
        // remove file from cache
        return urlCache.remove(url)
            // remove file from disc
            .then(() => fsUtils.deleteFile(filePath));
    },

    /**
     * delete all cached file from the filesystem and cache
     * @param options
     * @returns {Promise}
     */
    clearCache(options) {
        _.defaults(options, defaultOptions);
        return urlCache.flush()
            .then(() => fsUtils.cleanDir(options.cacheLocation));
    },

    /**
     * return info about the cache, list of files and the total size of the cache
     * @param options
     * @returns {*|Promise.<{file: Array, size: Number}>}
     */
    getCacheInfo(options) {
        _.defaults(options, defaultOptions);
        return fsUtils.getDirInfo(options.cacheLocation);
    },

});