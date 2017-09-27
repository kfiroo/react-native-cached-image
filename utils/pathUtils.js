'use strict';

const _ = require('lodash');
const URL = require('url-parse');
const SHA1 = require("crypto-js/sha1");

const defaultImageTypes = ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'tiff', 'tif'];

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

function generateCacheKey(url, useQueryParamsInCacheKey = true) {
    const parsedUrl = new URL(url, null, true);

    const pathParts = parsedUrl.pathname.split('/');

    // last path part is the file name
    const fileName = pathParts.pop();
    const filePath = pathParts.join('/');

    const parts = fileName.split('.');
    const fileType = parts.length > 1 ? _.toLower(parts.pop()) : '';
    const type = defaultImageTypes.includes(fileType) ? fileType : 'jpg';

    const cacheable = filePath + fileName + type + getQueryForCacheKey(parsedUrl, useQueryParamsInCacheKey);
    return SHA1(cacheable) + '.' + type;
}

function getCachePath(url) {
    const {
        host
    } = new URL(url);
    return host.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

/**
 * handle the resolution of URLs to local file paths
 */
module.exports = {

    /**
     * Given a URL and some options returns the file path in the file system corresponding to it's cached image location
     * @param url
     * @param cacheLocation
     * @returns {string}
     */
    getImageFilePath(url, cacheLocation) {
        const cachePath = getCachePath(url);
        const cacheKey = generateCacheKey(url);

        return `${cacheLocation}/${cachePath}/${cacheKey}`;
    },

    /**
     * returns the url after removing all unused query params
     * @param url
     * @param useQueryParamsInCacheKey
     * @returns {string}
     */
    getCacheableUrl(url, useQueryParamsInCacheKey) {
        const parsedUrl = new URL(url, null, true);
        if (_.isArray(useQueryParamsInCacheKey)) {
            parsedUrl.set('query', _.pick(parsedUrl.query, useQueryParamsInCacheKey));
        }
        if (!useQueryParamsInCacheKey) {
            parsedUrl.set('query', {});
        }
        return parsedUrl.toString();
    }

};
