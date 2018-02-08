'use strict';

const _ = require('lodash');

const fsUtils = require('./utils/fsUtils');
const pathUtils = require('./utils/pathUtils');
const MemoryCache = require('react-native-clcasher/MemoryCache').default;

module.exports = (defaultOptions = {}, urlCache = MemoryCache, fs = fsUtils, path = pathUtils) => {

    const defaultDefaultOptions = {
        headers: {},
        ttl: 60 * 60 * 24 * 14, // 2 weeks
        useQueryParamsInCacheKey: false,
        cacheLocation: fs.getCacheDir(),
        allowSelfSignedSSL: false,
    };

    // apply default options
    _.defaults(defaultOptions, defaultDefaultOptions);

    function isCacheable(url) {
        return _.isString(url) && (_.startsWith(url.toLowerCase(), 'http://') || _.startsWith(url.toLowerCase(), 'https://'));
    }

    function getCachableUrl(url, options) {
        if (!isCacheable(url)) {
            return Promise.reject(new Error('Url is not cacheable'));
        }
        // allow CachedImage to provide custom options
        _.defaults(options, defaultOptions);
        // cacheableUrl contains only the needed query params
        return path.getCacheableUrl(url, options.useQueryParamsInCacheKey);
    }

    function getCachedFile(cacheableUrl, options) {
        // note: urlCache may remove the entry if it expired so we need to remove the leftover file manually
        return urlCache.get(cacheableUrl)
            .then(fileRelativePath => {
                if (!fileRelativePath) {
                    // console.log('ImageCacheManager: url cache miss', cacheableUrl);
                    throw new Error('URL expired or not in cache');
                }
                // console.log('ImageCacheManager: url cache hit', cacheableUrl);
                const cachedFilePath = `${options.cacheLocation}/${fileRelativePath}`;

                return fs.exists(cachedFilePath)
                    .then((exists) => {
                        if (exists) {
                            return cachedFilePath
                        } else {
                            throw new Error('file under URL stored in url cache doesn\'t exsts');
                        }
                    });
            })
    }

    function isCached(url, options) {
        const cacheableUrl = getCachableUrl(url, options);
        return getCachedFile(cacheableUrl, options)
            .then(filePath => !!filePath)
            .catch(() => false);
    }

    function cacheUrl(url, options, cacheMethod) {
        const cacheableUrl = getCachableUrl(url, options);
        return getCachedFile(cacheableUrl, options)
            // url is not found in the cache or is expired
            .catch(() => {
                const fileRelativePath = path.getImageRelativeFilePath(cacheableUrl);
                const filePath = `${options.cacheLocation}/${fileRelativePath}`

                // remove expired file if exists
                return fs.deleteFile(filePath)
                    // get the image to cache (download / copy / etc)
                    .then(() => cacheMethod(filePath))
                    // add to cache
                    .then(() => urlCache.set(cacheableUrl, fileRelativePath, options.ttl))
                    // return filePath
                    .then(() => filePath);
            });
    }

    return {

        /**
         * check whether a url is already cached or not
         * @param url
         * @param options
         * @returns {Promise}
         */
        isUrlCached(url, options = {}) {
            return isCached(url, options);
        },

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
                filePath => fs.downloadFile(url, filePath, options.headers)
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
                filePath => fs.copyFile(seedPath, filePath)
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
            const cacheableUrl = path.getCacheableUrl(url, options.useQueryParamsInCacheKey);
            const filePath = path.getImageFilePath(cacheableUrl, options.cacheLocation);
            // remove file from cache
            return urlCache.remove(cacheableUrl)
                // remove file from disc
                .then(() => fs.deleteFile(filePath));
        },

        /**
         * delete all cached file from the filesystem and cache
         * @param options
         * @returns {Promise}
         */
        clearCache(options = {}) {
            _.defaults(options, defaultOptions);
            return urlCache.flush()
                .then(() => fs.cleanDir(options.cacheLocation));
        },

        /**
         * return info about the cache, list of files and the total size of the cache
         * @param options
         * @returns {Promise.<{file: Array, size: Number}>}
         */
        getCacheInfo(options = {}) {
            _.defaults(options, defaultOptions);
            return fs.getDirInfo(options.cacheLocation);
        },

    };
};
