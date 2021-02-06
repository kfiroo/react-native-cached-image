const _ = require('lodash')
const URL = require('url-parse')
const SHA1 = require('crypto-js/sha1')

const defaultImageTypes = ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'tiff', 'tif']

function serializeObjectKeys(obj: any) {
  return _(obj)
    .toPairs()
    .sortBy((a: any[]) => a[0])
    .map((a: any[]) => a[1])
    .value()
}

function getQueryForCacheKey(url: any, useQueryParamsInCacheKey: boolean) {
  if (_.isArray(useQueryParamsInCacheKey)) {
    return serializeObjectKeys(_.pick(url.query, useQueryParamsInCacheKey))
  }
  if (useQueryParamsInCacheKey) {
    return serializeObjectKeys(url.query)
  }
  return ''
}

function generateCacheKey(url: any, useQueryParamsInCacheKey = true) {
  const parsedUrl = new URL(url, null, true)

  const pathParts = parsedUrl.pathname.split('/')

  // last path part is the file name
  const fileName = pathParts.pop()
  const filePath = pathParts.join('/')

  const parts = fileName.split('.')
  const fileType = parts.length > 1 ? _.toLower(parts.pop()) : ''
  const type = defaultImageTypes.includes(fileType) ? fileType : 'jpg'

  const cacheable =
    filePath +
    fileName +
    type +
    getQueryForCacheKey(parsedUrl, useQueryParamsInCacheKey)
  return `${SHA1(cacheable)}.${type}`
}

function getHostCachePathComponent(url: any) {
  const { host } = new URL(url)

  return `${host
    .replace(/\.:/gi, '_')
    .replace(/[^a-z0-9_]/gi, '_')
    .toLowerCase()}_${SHA1(host)}`
}

const pathUtils = {
  /**
   * Given a URL and some options returns the file path in the file system corresponding to it's cached image location
   * @param url
   * @param cacheLocation
   * @returns {string}
   */
  getImageFilePath(url: any, cacheLocation: string | undefined) {
    const hostCachePath = getHostCachePathComponent(url)
    const cacheKey = generateCacheKey(url)

    return `${cacheLocation}/${hostCachePath}/${cacheKey}`
  },

  /**
   * Given a URL returns the relative file path combined from host and url hash
   * @param url
   * @returns {string}
   */

  getImageRelativeFilePath(url: any) {
    const hostCachePath = getHostCachePathComponent(url)
    const cacheKey = generateCacheKey(url)

    return `${hostCachePath}/${cacheKey}`
  },

  /**
   * returns the url after removing all unused query params
   * @param url
   * @param useQueryParamsInCacheKey
   * @returns {string}
   */
  getCacheableUrl(
    url: string,
    useQueryParamsInCacheKey: boolean | string[] | undefined
  ) {
    const parsedUrl = new URL(url, null, true)
    if (_.isArray(useQueryParamsInCacheKey)) {
      parsedUrl.set('query', _.pick(parsedUrl.query, useQueryParamsInCacheKey))
    }
    if (!useQueryParamsInCacheKey) {
      parsedUrl.set('query', {})
    }
    return parsedUrl.toString()
  }
}

export default pathUtils
