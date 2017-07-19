'use strict';

const _ = require('lodash');
const MemoryCache = require('react-native-clcasher/MemoryCache').default;
const RNFetchBlob = require('react-native-fetch-blob').default;

const {
    fs
} = RNFetchBlob;

const LOCATION = {
    CACHE: fs.dirs.CacheDir + '/imagesCacheDir',
    BUNDLE: fs.dirs.MainBundleDir + '/imagesCacheDir'
};

const SHA1 = require("crypto-js/sha1");
const URL = require('url-parse');

const defaultImageTypes = ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'tiff', 'tif'];

const defaultOptions = {
    useQueryParamsInCacheKey: false,
    source: {},
    cacheLocation: LOCATION.CACHE
};

const activeDownloads = {};
const HEADERS_CACHE_CONTROL = 'Cache-Control';

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

    const pathParts = parsedUrl.pathname.split('/');

    // last path part is the file name
    const fileName = pathParts.pop();
    const filePath = pathParts.join('/');

    const parts = fileName.split('.');
    const fileType = parts.length > 1 ? _.toLower(parts.pop()) : '';
    const type = defaultImageTypes.includes(fileType) ? fileType : 'jpg';

    const cacheable = filePath + fileName + type + getQueryForCacheKey(parsedUrl, options.useQueryParamsInCacheKey);
    return SHA1(cacheable) + '.' + type;
}

function getBaseDir(cacheLocation) {
    return cacheLocation || LOCATION.CACHE;
}

function getCachePath(url, options) {
    if (options.cacheGroup) {
        return options.cacheGroup;
    }
    const {
        host
    } = new URL(url);
    return host.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function getCachedImageFilePath(url, options) {
    const cachePath = getCachePath(url, options);
    const cacheKey = generateCacheKey(url, options);

    return `${getBaseDir(options.cacheLocation)}/${cachePath}/${cacheKey}`;
}

function deleteFile(filePath) {
    return fs.stat(filePath)
        .then(res => res && res.type === 'file')
        .then(exists => exists && fs.unlink(filePath))
        .catch((err) => {
            // swallow error to always resolve
        });
}

function getDirPath(filePath) {
    return _.initial(filePath.split('/')).join('/');
}

function ensurePath(dirPath) {
    return fs.isDir(dirPath)
        .then(isDir => {
            if (!isDir) {
                return fs.mkdir(dirPath)
                    .then(() => fs.exists(dirPath).then(exists => {
                        // Check if dir has indeed been created because
                        // there's no exception on incorrect user-defined paths (?)...
                        if (!exists) throw new Error('Invalid cacheLocation');
                    }))
            }
        })
        .catch(err => {
            // swallow folder already exists errors
            if (err.message.includes('folder already exists')) {
                return;
            }
            throw err;
        });
}

/**
 * returns a promise that is resolved when the download of the requested file
 * is complete and the file is saved.
 * if the download fails, or was stopped the partial file is deleted, and the
 * promise is rejected
 * @param fromUrl   String source url
 * @param toFile    String destination path
 * @param headers   Object headers to use when downloading the file
 * @returns {Promise}
 */
function downloadImage(fromUrl, toFile, headers = {}) {
    // use toFile as the key as is was created using the cacheKey
    if (!_.has(activeDownloads, toFile)) {
        //Using a temporary file, if the download is accidentally interrupted, it will not produce a disabled file
        const tmpFile = toFile + '.tmp';
        // create an active download for this file
        activeDownloads[toFile] = RNFetchBlob
            .config({path: tmpFile})
            .fetch('GET', fromUrl, headers)
            .then(res => {
                if (res.respInfo.status === 304) {
                    return Promise.resolve(toFile);
                }
                let status = Math.floor(res.respInfo.status / 100);
                if (status !== 2) {
                    throw {message: res.respInfo.statusText || 'Failed to successfully download image', code: res.respInfo.status};
                }
                // The download is complete and rename the temporary file
                setFileInfo(toFile, headers);
                return fs.mv(tmpFile, toFile).catch(Promise.resolve);
            })
            .then(() => {
                // cleanup
                deleteFile(tmpFile);
                delete activeDownloads[toFile];
                return toFile
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
    // if url is not cacheable - get next
    if (!isCacheable(url)) {
        return runPrefetchTask(prefetcher, options);
    }
    // else check cache
    return getCachedImagePath(url, options)
        // check for expiration
        .then(isExpired)
        // if not found download
        .catch(() => cacheImage(url, options))
        // allow prefetch task to fail without terminating other prefetch tasks
        .catch(_.noop)
        // then run next task
        .then(() => runPrefetchTask(prefetcher, options));
}

function collectFilesInfo(basePath) {
    return fs.stat(basePath)
        .then((info) => {
            if (info.type === 'file') {
                return [info];
            }
            return fs.ls(basePath)
                .then(files => {
                    const promises = _.map(files, file => {
                        return collectFilesInfo(`${basePath}/${file}`);
                    });
                    return Promise.all(promises);
                });
        })
        .catch(err => {
            return [];
        });
}

// API

/**
 * Check whether a url is cacheable.
 * Takes an image source and if it's a valid url return `true`
 * @param url
 * @returns {boolean}
 */
function isCacheable(url) {
    return _.isString(url) && (_.startsWith(url, 'http://') || _.startsWith(url, 'https://'));
}

/**
 * Check whether a url is expired by expiration date within options
 * @param {string} filePath
 */
function isExpired(filePath) {
    return MemoryCache.isExpired(filePath)
        .then((isExpired) => {
            if (isExpired === true) {
                MemoryCache.remove(filePath);
                throw new Error('File is expired');
            }
            return filePath;
        })
}

/**
 * Store file information in AsyncStorage
 * @param url
 * @param headers
 */
function setFileInfo(url, headers) {
    let maxAge = /^max-age/.test(headers[HEADERS_CACHE_CONTROL]) ? +(headers[HEADERS_CACHE_CONTROL].split('=')[1]): null;
    maxAge ? MemoryCache.set(url, headers, maxAge) : MemoryCache.set(url, headers)
}

/**
 * Get the local path corresponding to the given url and options.
 * @param url
 * @param options
 * @returns {Promise.<String>}
 */
function getCachedImagePath(url, options = defaultOptions) {
    const filePath = getCachedImageFilePath(url, options);
    return fs.stat(filePath)
        .then(res => {
            if (res.type !== 'file') {
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

/**
 * Download the image to the cache and return the local file path.
 * @param url
 * @param options
 * @returns {Promise.<String>}
 */
function cacheImage(url, options = defaultOptions) {
    const filePath = getCachedImageFilePath(url, options);
    const dirPath = getDirPath(filePath);
    return ensurePath(dirPath)
        .then(() => downloadImage(url, filePath, options.source && options.source.headers));
}

/**
 * Delete the cached image corresponding to the given url and options.
 * @param url
 * @param options
 * @returns {Promise}
 */
function deleteCachedImage(url, options = defaultOptions) {
    const filePath = getCachedImageFilePath(url, options);
    MemoryCache.remove(filePath);
    return deleteFile(filePath);
}

/**
 * Cache an array of urls.
 * Usually used to prefetch images.
 * @param urls
 * @param options
 * @returns {Promise}
 */
function cacheMultipleImages(urls, options = defaultOptions) {
    const prefetcher = createPrefetcer(urls);
    const numberOfWorkers = urls.length;
    const promises = _.times(numberOfWorkers, () =>
        runPrefetchTask(prefetcher, options)
    );
    return Promise.all(promises);
}

/**
 * Delete an array of cached images by their urls.
 * Usually used to clear the prefetched images.
 * @param urls
 * @param options
 * @returns {Promise}
 */
function deleteMultipleCachedImages(urls, options = defaultOptions) {
    return _.reduce(urls, (p, url) =>
            p.then(() => deleteCachedImage(url, options)),
        Promise.resolve()
    );
}

/**
* Seed the cache of a specified url with a local image
* Handy if you have a local copy of a remote image, e.g. you just uploaded local to url.
* @param local
* @param url
* @param options
* @returns {Promise}
*/
function seedCache(local, url, options = defaultOptions) {
  const filePath = getCachedImageFilePath(url, options);
  const dirPath = getDirPath(filePath);
  return ensurePath(dirPath)
    .then(() => fs.cp(local, filePath))
}

/**
 * Clear the entire cache.
 * @param options
 * @returns {Promise}
 */
function clearCache(options = defaultOptions) {
    return fs.unlink(getBaseDir(options.cacheLocation))
        .catch(() => {
            // swallow exceptions if path doesn't exist
        })
        .then(() => ensurePath(getBaseDir(options.cacheLocation)));
}

/**
 * Return info about the cache, list of files and the total size of the cache.
 * @param options
 * @returns {Promise.<{size}>}
 */
function getCacheInfo(options = defaultOptions) {
    return ensurePath(getBaseDir(options.cacheLocation))
        .then(() => collectFilesInfo(getBaseDir(options.cacheLocation)))
        .then(cache => {
            const files = _.flattenDeep(cache);
            const size = _.sumBy(files, 'size');
            return {
                files,
                size
            };
        });
}

module.exports = {
    isCacheable,
    getCachedImageFilePath,
    getCachedImagePath,
    cacheImage,
    deleteCachedImage,
    cacheMultipleImages,
    deleteMultipleCachedImages,
    clearCache,
    seedCache,
    getCacheInfo,
    isExpired,
    LOCATION
};
