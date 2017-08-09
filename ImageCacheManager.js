'use strict';

const _ = require('lodash');

const fsUtils = require('./utils/fsUtils');
const pathUtils = require('./utils/pathUtils');

const MemoryCache = require('react-native-clcasher/MemoryCache').default;

const defaultDefaultOptions = {
    headers: {},
    ttl: 60 * 60 * 24 * 14, // 2 weeks
    useQueryParamsInCacheKey: false,
    cacheLocation: fsUtils.getCacheDir(),
    allowSelfSignedSSL: false,
};

module.exports = (defaultOptions = defaultDefaultOptions, urlCache = MemoryCache) => {

    // apply default options
    _.defaults(defaultOptions, defaultDefaultOptions);

    function isCacheable(url) {
        return _.isString(url) && (_.startsWith(url, 'http://') || _.startsWith(url, 'https://'));
    }

    function cacheUrl(url, options, getCachedFile) {
        if (!isCacheable(url)) {
            return Promise.reject(new Error('Url is not cacheable'));
        }
        // allow CachedImage to provide custom options
        _.defaults(options, defaultOptions);
        // cacheableUrl contains only the needed query params
        const cacheableUrl = pathUtils.getCacheableUrl(url, options.useQueryParamsInCacheKey);
        // note: urlCache may remove the entry if it expired so we need to remove the leftover file manually
        return urlCache.get(cacheableUrl)
            .then(filePath => {
                if (!filePath) {
                    // console.log('ImageCacheManager: cache miss', cacheableUrl);
                    throw new Error('URL expired or not in cache');
                }
                // console.log('ImageCacheManager: cache hit', cacheableUrl);
                return filePath;
            })
            // url is not found in the cache or is expired
            .catch(() => {
                const filePath = pathUtils.getImageFilePath(cacheableUrl, options.cacheLocation);
                // remove expired file if exists
                return fsUtils.deleteFile(filePath)
                    // get the image to cache (download / copy / etc)
                    .then(() => getCachedFile(filePath))
                    // add to cache
                    .then(() => urlCache.set(cacheableUrl, filePath, options.ttl))
                    // return filePath
                    .then(() => filePath);
            });
    }

    return {

        /**
         * download an image and cache the result according to the given options
         * @param url
         * @param options
         * @returns {Promise}
         */
        downloadAndCacheUrl(url, options = {}) {
            return cacheUrl(
                url,
                options,
                filePath => fsUtils.downloadFile(url, filePath, options.headers)
            );
        },

        /**
         * seed the cache for a specific url with a local file
         * @param url
         * @param seedPath
         * @param options
         * @returns {Promise}
         */
        seedAndCacheUrl(url, seedPath, options = {}) {
            return cacheUrl(
                url,
                options,
                filePath => fsUtils.copyFile(seedPath, filePath)
            );
        },

        /**
         * delete the cache entry and file for a given url
         * @param url
         * @param options
         * @returns {Promise}
         */
        deleteUrl(url, options = {}) {
            if (!isCacheable(url)) {
                return Promise.reject(new Error('Url is not cacheable'));
            }
            _.defaults(options, defaultOptions);
            const cacheableUrl = pathUtils.getCacheableUrl(url, options.useQueryParamsInCacheKey);
            const filePath = pathUtils.getImageFilePath(cacheableUrl, options.cacheLocation);
            // remove file from cache
            return urlCache.remove(cacheableUrl)
                // remove file from disc
                .then(() => fsUtils.deleteFile(filePath));
        },

        /**
         * delete all cached file from the filesystem and cache
         * @param options
         * @returns {Promise}
         */
        clearCache(options = {}) {
            _.defaults(options, defaultOptions);
            return urlCache.flush()
                .then(() => fsUtils.cleanDir(options.cacheLocation));
        },

        /**
         * return info about the cache, list of files and the total size of the cache
         * @param options
         * @returns {Promise.<{file: Array, size: Number}>}
         */
        getCacheInfo(options = {}) {
            _.defaults(options, defaultOptions);
            return fsUtils.getDirInfo(options.cacheLocation);
        },

    };
};