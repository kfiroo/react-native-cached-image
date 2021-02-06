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

const ImageCacheManager = (
  defaultOptions = {},
  urlCache = MemoryCache,
  fs = fsUtils,
  path = pathUtils
) => {
  // apply default options
  defaults(defaultOptions, defaultDefaultOptions)

  const isCacheable = (url: string) => {
    return (
      isString(url) &&
      (startsWith(url.toLowerCase(), 'http://') ||
        startsWith(url.toLowerCase(), 'https://'))
    )
  }

  const cacheUrl = (
    url: string,
    options?: TOptions,
    getCachedFile?: (arg: string) => void
  ) => {
    if (!isCacheable(url)) {
      return Promise.reject(new Error('Url is not cacheable'))
    }
    // allow CachedImage to provide custom options
    defaults(options, defaultOptions)
    // cacheableUrl contains only the needed query params
    const cacheableUrl = path.getCacheableUrl(
      url,
      options?.useQueryParamsInCacheKey
    )
    // note: urlCache may remove the entry if it expired so we need to remove the leftover file manually
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

          return fs.exists(cachedFilePath).then((exists) => {
            if (exists) {
              return cachedFilePath
            }
            throw new Error("file under URL stored in url cache doesn't exsts")
          })
        })
        // url is not found in the cache or is expired
        .catch(() => {
          const fileRelativePath = path.getImageRelativeFilePath(cacheableUrl)
          const filePath = `${options?.cacheLocation}/${fileRelativePath}`

          // remove expired file if exists
          return (
            fs
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

  return {
    /**
     * download an image and cache the result according to the given options
     * @param url
     * @param options
     * @returns {Promise}
     */
    downloadAndCacheUrl: (url: string, options?: TOptions, callbacks?: any) => {
      return cacheUrl(url, options || {}, (filePath: string) =>
        fs.downloadFile(url, filePath, options?.headers, callbacks)
      )
    },

    /**
     * seed the cache for a specific url with a local file
     * @param url
     * @param seedPath
     * @param options
     * @returns {Promise}
     */
    seedAndCacheUrl: (url: string, seedPath: string, options?: TOptions) =>
      cacheUrl(url, options || {}, (filePath: string) =>
        fs.copyFile(seedPath, filePath)
      ),

    /**
     * delete the cache entry and file for a given url
     * @param url
     * @param options
     * @returns {Promise}
     */
    deleteUrl: (url: string, options?: TOptions) => {
      if (!isCacheable(url)) {
        return Promise.reject(new Error('Url is not cacheable'))
      }
      defaults(options, defaultOptions)
      const cacheableUrl = path.getCacheableUrl(
        url,
        options?.useQueryParamsInCacheKey
      )
      const filePath = path.getImageFilePath(
        cacheableUrl,
        options?.cacheLocation
      )
      // remove file from cache
      return (
        urlCache
          .remove(cacheableUrl)
          // remove file from disc
          .then(() => fs.deleteFile(filePath))
      )
    },

    /**
     * delete all cached file from the filesystem and cache
     * @param options
     * @returns {Promise}
     */
    clearCache: (options?: TOptions) => {
      defaults(options, defaultOptions)
      return urlCache.flush().then(() => fs.cleanDir(options?.cacheLocation))
    },

    /**
     * return info about the cache, list of files and the total size of the cache
     * @param options
     * @returns {Promise.<{file: Array, size: Number}>}
     */
    getCacheInfo: (options?: TOptions) => {
      defaults(options || {}, defaultOptions)
      return fs.getDirInfo(options?.cacheLocation)
    }
  }
}

export default ImageCacheManager
export type TImageCacheManager = ReturnType<typeof ImageCacheManager>

export type TOptions = {
  headers?: ObjectLiteral
  ttl?: number
  useQueryParamsInCacheKey?: boolean | string[]
  cacheLocation?: string
  allowSelfSignedSSL?: boolean
}
