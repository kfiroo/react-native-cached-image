import defaults from 'lodash/defaults'
import fsUtils from './utils/fsUtils'
import pathUtils from './utils/pathUtils'
import { ObjectLiteral } from './typings'
import { isString, startsWith } from 'lodash'
import RNFetchBlob from 'rn-fetch-blob'
const { fs } = RNFetchBlob
import MemoryCache from 'react-native-clcasher/MemoryCache'

const defaultDefaultOptions = {
  headers: {},
  ttl: 60 * 60 * 24 * 14, // 2 weeks
  useQueryParamsInCacheKey: false,
  cacheLocation: fs.dirs.CacheDir,
  allowSelfSignedSSL: false
}

/**
 * Function to determine whether a certain url is cacheable or not
 * @param url string to examine
 * @returns boolean
 */
const _isCacheable = (url: string) =>
  isString(url) &&
  (startsWith(url.toLowerCase(), 'http://') ||
    startsWith(url.toLowerCase(), 'https://'))

function ImageCacheManager(defaultOptions = {}, urlCache = MemoryCache) {
  // apply default options
  defaults(defaultOptions, defaultDefaultOptions)

  const cacheUrl = (
    url: string,
    options?: TImageCacheManagerOptions,
    getCachedFile?: (arg: string) => void
  ) => {
    if (!_isCacheable(url)) {
      return Promise.reject(new Error('Url is not cacheable'))
    }

    /* allow `CachedImage` to provide custom options */
    defaults(options, defaultOptions)

    /* cacheableUrl contains only the needed query params */
    const cacheableUrl = pathUtils.getCacheableUrl(
      url,
      options?.useQueryParamsInCacheKey
    )
    // note: `urlCache` may remove the entry if it expired so we need to remove the leftover file manually
    return (
      urlCache
        .get(cacheableUrl)
        .then((fileRelativePath: string) => {
          if (!fileRelativePath) {
            // console.log('ImageCacheManager: url cache miss', cacheableUrl);
            throw new Error('URL expired or not in cache')
          }
          // console.log('ImageCacheManager: url cache hit', cacheableUrl);
          const cachedFilePath = `${options?.cacheLocation}/${fileRelativePath}`

          return fsUtils.exists(cachedFilePath).then((exists) => {
            if (exists) {
              return cachedFilePath
            }
            throw new Error("file under URL stored in url cache doesn't exsts")
          })
        })
        /* url is not found in the cache or is expired */
        .catch(() => {
          const fileRelativePath =
            pathUtils.getImageRelativeFilePath(cacheableUrl)
          const filePath = `${options?.cacheLocation}/${fileRelativePath}`

          /* remove expired file if exists */
          return (
            fsUtils
              .deleteFile(filePath)
              // get the image to cache (download / copy / etc)
              .then(() => getCachedFile?.(filePath))
              // add to cache
              .then(() =>
                urlCache.set(cacheableUrl, fileRelativePath, options?.ttl)
              )
              // return filePath
              .then(() => filePath)
          )
        })
    )
  }

  /**
   * download an image and cache the result according to the given options
   * @param url
   * @param options
   * @returns {Promise}
   */
  const downloadAndCacheUrl = (
    url: string,
    options?: TImageCacheManagerOptions,
    callbacks?: any
  ) => {
    return cacheUrl(url, options || {}, (filePath: string) =>
      fsUtils.downloadFile(url, filePath, options?.headers, callbacks)
    )
  }

  /**
   * seed the cache for a specific url with a local file
   * @param url
   * @param seedPath
   * @param options
   * @returns {Promise}
   */
  const seedAndCacheUrl = (
    url: string,
    seedPath: string,
    options?: TImageCacheManagerOptions
  ) =>
    cacheUrl(url, options || {}, (filePath: string) =>
      fsUtils.copyFile(seedPath, filePath)
    )

  /**
   * delete the cache entry and file for a given url
   * @param url
   * @param options
   * @returns {Promise}
   */
  const deleteUrl = (url: string, options?: TImageCacheManagerOptions) => {
    if (!_isCacheable(url)) {
      return Promise.reject(new Error('Url is not cacheable'))
    }
    defaults(options, defaultOptions)
    const cacheableUrl = pathUtils.getCacheableUrl(
      url,
      options?.useQueryParamsInCacheKey
    )
    const filePath = pathUtils.getImageFilePath(
      cacheableUrl,
      options?.cacheLocation
    )
    // remove file from cache
    return (
      urlCache
        .remove(cacheableUrl)
        // remove file from disc
        .then(() => fsUtils.deleteFile(filePath))
    )
  }

  /**
   * delete all cached file from the filesystem and cache
   * @param options
   * @returns {Promise}
   */
  const clearCache = (options?: TImageCacheManagerOptions) => {
    defaults(options, defaultOptions)
    return urlCache
      .flush()
      .then(() => fsUtils.cleanDir(options?.cacheLocation || ''))
  }

  /**
   * return info about the cache, list of files and the total size of the cache
   * @param options
   * @returns {Promise.<{file: Array, size: Number}>}
   */
  const getCacheInfo = (options?: TImageCacheManagerOptions) => {
    defaults(options || {}, defaultOptions)
    return fsUtils.getDirInfo(options?.cacheLocation || '')
  }

  return {
    clearCache,
    deleteUrl,
    downloadAndCacheUrl,
    getCacheInfo,
    seedAndCacheUrl
  }
}

export default ImageCacheManager
export type TImageCacheManager = ReturnType<typeof ImageCacheManager>

export type TImageCacheManagerOptions = {
  headers?: ObjectLiteral
  ttl?: number
  useQueryParamsInCacheKey?: boolean | string[]
  cacheLocation?: string
  allowSelfSignedSSL?: boolean
}
