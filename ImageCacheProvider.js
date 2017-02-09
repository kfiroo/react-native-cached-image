'use strict';

const _ = require('lodash');
const RNFS = require('react-native-fs');

const {
    DocumentDirectoryPath
} = RNFS;

const SHA1 = require("crypto-js/sha1");
const URL = require('url-parse');

const defaultOptions = {
    useQueryParamsInCacheKey: false
};

const activeDownloads = {};

function serializeObjectKeys(obj) {
    return _(obj)
        .toPairs()
        .sortBy(a => a[0])
        .map(a => a[1])
        .value();
}

function getQueryForCacheKey(url, useQueryParamsInCacheKey) {
    if (_.isArray(useQueryParamsInCacheKey)) {
        return serializeObjectKeys(_.pick(url.query, useQueryParamsInCacheKey));
    }
    if (useQueryParamsInCacheKey) {
        return serializeObjectKeys(url.query);
    }
    return '';
}

function generateCacheKey(url, options) {
    const parsedUrl = new URL(url, null, true);
    const parts = parsedUrl.pathname.split('.');
    // TODO - try to figure out the file type or let the user provide it, for now use jpg as default
    const type = parts.length > 1 ? parts.pop() : 'jpg';
    const pathname = parts.join('.');
    const cacheable = pathname + getQueryForCacheKey(parsedUrl, options.useQueryParamsInCacheKey);
    return SHA1(cacheable) + '.' + type;
}

function getCachePath(url, options) {
    if (options.cacheGroup) {
        return options.cacheGroup;
    }
    const parsedUrl = new URL(url);
    return parsedUrl.host;
}

function getCachedImageFilePath(url, options) {
    const cacheKey = generateCacheKey(url, options);
    const cachePath = getCachePath(url, options);

    const dirPath = DocumentDirectoryPath + '/' + cachePath;
    return dirPath + '/' + cacheKey;
}

function deleteFile(filePath) {
    return RNFS.exists(filePath)
        .then(res => res && RNFS.unlink(filePath))
        .catch((err) => {
            // swallow error to always resolve
        });
}

function ensurePath(filePath) {
    const parts = filePath.split('/');
    const dirPath = _.initial(parts).join('/');
    return RNFS.mkdir(dirPath, {NSURLIsExcludedFromBackupKey: true});
}

/**
 * returns a promise that is resolved when the download of the requested file
 * is complete and the file is saved.
 * if the download fails, or was stopped the partial file is deleted, and the
 * promise is rejected
 * @param fromUrl
 * @param toFile
 * @returns {Promise}
 */
function downloadImage(fromUrl, toFile) {
    // use toFile as the key as is was created using the cacheKey
    if (!_.has(activeDownloads, toFile)) {
        // create an active download for this file
        activeDownloads[toFile] = new Promise((resolve, reject) => {
            const downloadOptions = {
                fromUrl,
                toFile
            };
            RNFS.downloadFile(downloadOptions).promise
                .then(res => {
                    if (Math.floor(res.statusCode / 100) == 2) {
                      resolve(toFile);
                    } else {
                      return Promise.reject('Failed to successfully download image')
                    }
                })
                .catch(err => {
                    return deleteFile(toFile)
                        .then(() => reject(err))
                })
                .finally(() => {
                    // cleanup
                    delete activeDownloads[toFile];
                });
        });
    }
    return activeDownloads[toFile];
}

function createPrefetcer(list) {
    const urls = _.clone(list);
    return {
        next() {
            return urls.shift();
        }
    };
}

function runPrefetchTask(prefetcher, options) {
    const url = prefetcher.next();
    if (!url) {
        return Promise.resolve();
    }
    // if url is cacheable - cache it
    if (isCacheable(url)) {
        // check cache
        return getCachedImagePath(url, options)
        // if not found download
            .catch(() => cacheImage(url, options))
            // then run next task
            .then(() => runPrefetchTask(prefetcher, options));
    }
    // else get next
    return runPrefetchTask(prefetcher, options);
}

// API

function isCacheable(url) {
    return _.isString(url) && (_.startsWith(url, 'http://') || _.startsWith(url, 'https://'));
}

function getCachedImagePath(url, options = defaultOptions) {
    const filePath = getCachedImageFilePath(url, options);
    return RNFS.stat(filePath)
        .then(res => {
            if (!res.isFile()) {
                // reject the promise if res is not a file
                throw new Error('Failed to get image from cache');
            }
            if (!res.size) {
                // something went wrong with the download, file size is 0, remove it
                return deleteFile(filePath)
                    .then(() => {
                        throw new Error('Failed to get image from cache');
                    });
            }
            return filePath;
        })
        .catch(err => {
            throw err;
        })
}

function cacheImage(url, options = defaultOptions) {
    const filePath = getCachedImageFilePath(url, options);
    return ensurePath(filePath)
        .then(() => downloadImage(url, filePath));
}

function deleteCachedImage(url, options = defaultOptions) {
    const filePath = getCachedImageFilePath(url, options);
    return deleteFile(filePath);
}

function cacheMultipleImages(urls, options = defaultOptions) {
    const prefetcher = createPrefetcer(urls);
    const numberOfWorkers = urls.length;
    const promises = _.times(numberOfWorkers, () =>
        runPrefetchTask(prefetcher, options)
    );
    return Promise.all(promises);
}

function deleteMultipleCachedImages(urls, options = defaultOptions) {
    return _.reduce(urls, (p, url) =>
            p.then(() => deleteCachedImage(url, options)),
        Promise.resolve()
    );
}

function clearCache() {

}

module.exports = {
    isCacheable,
    getCachedImagePath,
    cacheImage,
    deleteCachedImage,
    cacheMultipleImages,
    deleteMultipleCachedImages,
    clearCache
};
