'use strict';

const _ = require('lodash');

const RNFetchBlob = require('react-native-fetch-blob').default;

const {
    fs
} = RNFetchBlob;

const baseCacheDir = fs.dirs.CacheDir + '/imagesCacheDir';

const SHA1 = require("crypto-js/sha1");
const URL = require('url-parse');

const defaultHeaders = {};
const defaultImageTypes = ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'tiff', 'tif'];
const defaultResolveHeaders = _.constant(defaultHeaders);

const defaultOptions = {
    useQueryParamsInCacheKey: false,
    // Right now this options is used just by cacheMultipleImages
    // 0 means no limit, a number different than that would be number of allowed concurrent tasks
    numberOfParallelTasks: 0,
};

const activeDownloads = {};

/**
 *  Limiter function helper, this function will allow `numResources` promises to run at once
 * @param numResources - the number of concurrent promises to run
 * @return {{available: *, max: *}}
 */
function resourceLimiter(numResources) {
    const resources = {
        available: numResources,
        max: numResources
    };

    const futures = []; //array of callbacks to trigger the promised resources

    /*
     * takes a resource.  returns a promises that resolves when the resource is available.
     * promises resolve FIFO.
     */
    resources.take = function () {
        if (resources.available > 0) {
            // no need to wait - take a slot and resolve immediately
            resources.available -= 1;
            return Promise.resolve();
        }
        // need to wait - return promise that resolves when wait is over
        return new Promise(function (resolve, reject) {
            futures.push(resolve);
        });

    };

    let emptyPromiseResolver;
    const emptyPromise = new Promise(function (resolve, reject) {
        emptyPromiseResolver = resolve;
    });

    /*
     * returns a resource to the pool
     */
    resources.give = function () {
        if (futures.length) {
            // we have a task waiting - execute it
            const future = futures.shift(); // FIFO
            future();
        } else {
            // no tasks waiting - increase the available count
            resources.available += 1;
            if (resources.available === resources.max) {
                emptyPromiseResolver('Queue is empty')
            }
        }
    };

    /*
     * Returns a promise that resolves when the queue is empty
     */
    resources.emptyPromise = function () {
        return emptyPromise;
    };

    return resources;
}

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

    return `${baseCacheDir}/${cachePath}/${cacheKey}`;
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
        .then(exists =>
            !exists && fs.mkdir(dirPath)
        )
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
        activeDownloads[toFile] = new Promise((resolve, reject) => {
            RNFetchBlob
                .config({path: tmpFile})
                .fetch('GET', fromUrl, headers)
                .then(res => {
                    if (Math.floor(res.respInfo.status / 100) !== 2) {
                        throw new Error('Failed to successfully download image');
                    }
                    //The download is complete and rename the temporary file
                    return fs.mv(tmpFile, toFile);
                })
                .then(() => resolve(toFile))
                .catch(err => {
                    return deleteFile(tmpFile)
                        .then(() => reject(err));
                })
                .finally(() => {
                    // cleanup
                    delete activeDownloads[toFile];
                });
        });
    }
    return activeDownloads[toFile];
}

function createPrefetcher(list) {
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
            // allow prefetch task to fail without terminating other prefetch tasks
            .catch(_.noop)
            // then run next task
            .then(() => runPrefetchTask(prefetcher, options));
    }
    // else get next
    return runPrefetchTask(prefetcher, options);
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
 * @param resolveHeaders
 * @returns {Promise.<String>}
 */
function cacheImage(url, options = defaultOptions, resolveHeaders = defaultResolveHeaders) {
    const filePath = getCachedImageFilePath(url, options);
    const dirPath = getDirPath(filePath);
    return ensurePath(dirPath)
        .then(() => resolveHeaders())
        .then(headers => downloadImage(url, filePath, headers));
}

/**
 * Delete the cached image corresponding to the given url and options.
 * @param url
 * @param options
 * @returns {Promise}
 */
function deleteCachedImage(url, options = defaultOptions) {
    const filePath = getCachedImageFilePath(url, options);
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
    const prefetcher = createPrefetcher(urls);
    const numberOfTasks = urls.length;
    if(options.numberOfParallelTasks === 0 ) {
        const promises = _.times(numberOfTasks, () =>
            runPrefetchTask(prefetcher, options)
        );
        return Promise.all(promises);
    }

    const limiter = resourceLimiter(options.numberOfParallelTasks);
    const tasks = new Array(numberOfTasks);

    // Factory that returns the next runPrefetchTask and release a slot when finishes
    const executeTask = () => () => runPrefetchTask(prefetcher, options)
        .then(() => limiter.give()) // release a resource when finish.
        .catch(() => limiter.give()); // release if there is an error too.

    for (let i = 0; i < numberOfTasks; i++) {
        tasks[i] = limiter.take().then(executeTask());
    }

    return Promise.all(tasks)
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
 * @returns {Promise}
 */
function clearCache() {
    return fs.unlink(baseCacheDir)
        .catch(() => {
            // swallow exceptions if path doesn't exist
        })
        .then(() => ensurePath(baseCacheDir));
}

/**
 * Return info about the cache, list of files and the total size of the cache.
 * @returns {Promise.<{size}>}
 */
function getCacheInfo() {
    return ensurePath(baseCacheDir)
        .then(() => collectFilesInfo(baseCacheDir))
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
    getCacheInfo
};
