import { translate } from 'localizations'
import _ from 'lodash'
import RNFetchBlob from 'rn-fetch-blob'
const { fs } = RNFetchBlob

const activeDownloads: any = {}

const getDirPath = (path: string) => {
  // if path is a file (has ext) remove it
  if (
    path.charAt(path.length - 4) === '.' ||
    path.charAt(path.length - 5) === '.'
  ) {
    return _.initial(path.split('/')).join('/')
  }
  return path
}

const ensurePath = (path: string) => {
  const dirPath = getDirPath(path)
  return fs
    .isDir(dirPath)
    .then((isDir) => {
      if (!isDir) {
        return (
          fs
            .mkdir(dirPath)
            /* check if dir has indeed been created because
             * there's no exception on incorrect user-defined paths (?)... */
            .then(() => fs.isDir(dirPath))
            .then((isDir) => {
              if (!isDir) {
                throw new Error(translate('fs_utils.invalid_loc'))
              }
            })
        )
      }
    })
    .catch((err) => {
      // ignore folder already exists errors
      if (err.message.includes('folder already exists')) {
        return
      }
      throw err
    })
}

const collectFilesInfo = (basePath: string) => {
  fs.stat(basePath)
    .then((info: any) => {
      if (info.type === 'file') {
        return [info]
      }
      return fs.ls(basePath).then((files) => {
        const promises = _.map(files, (file) => {
          return collectFilesInfo(`${basePath}/${file}`)
        })
        return Promise.all(promises)
      })
    })
    .catch((err) => {
      return []
    })
}

const fsUtils = {
  /**
   * returns the local cache dir
   * @returns {String}
   */
  getCacheDir() {
    return `${fs.dirs.CacheDir}/imagesCacheDir`
  },

  /**
   * returns a promise that is resolved when the download of the requested file
   * is complete and the file is saved.
   * if the download fails, or was stopped the partial file is deleted, and the
   * promise is rejected
   * @param fromUrl   String source url
   * @param toFile    String destination path
   * @param headers   Object with headers to use when downloading the file
   * @returns {Promise}
   */
  downloadFile(fromUrl: string, toFile: string, headers: any, callbacks: any) {
    const { onStartDownloading, onFinishDownloading, progressTracker } =
      callbacks
    if (onStartDownloading) onStartDownloading()

    // use toFile as the key as is was created using the cacheKey
    if (!_.has(activeDownloads, toFile)) {
      // using a temporary file, if the download is accidentally interrupted, it will not produce a disabled file
      const tmpFile = `${toFile}.tmp`
      // create an active download for this file
      activeDownloads[toFile] = ensurePath(toFile).then(() =>
        RNFetchBlob.config({
          path: tmpFile
        })
          .fetch('GET', fromUrl, headers)
          .progress((received, total) => {
            if (progressTracker) progressTracker(received, total)
          })
          .then((res: any): any => {
            if (res.respInfo.status === 304) {
              return Promise.resolve(toFile)
            }
            const status = Math.floor(res.respInfo.status / 100)
            if (status !== 2) {
              // TODO - log / return error?
              return Promise.reject(
                new Error(translate('fs_utils.download_file.unreachable'))
              )
            }

            return RNFetchBlob.fs.stat(tmpFile).then((fileStats) => {
              // Verify if the content was fully downloaded!
              if (
                res.respInfo.headers['Content-Length'] &&
                res.respInfo.headers['Content-Length'] !== `${fileStats.size}`
              )
                return Promise.reject(
                  new Error(translate('fs_utils.download_file.incomplete'))
                )

              if (onFinishDownloading) onFinishDownloading()

              // the download is complete and rename the temporary file
              return fs.mv(tmpFile, toFile)
            })
          })
          .catch((error) => {
            // cleanup. will try re-download on next CachedImage mount.
            this.deleteFile(tmpFile)
            delete activeDownloads[toFile]
            return Promise.reject(
              new Error(translate('fs_utils.download_file.failure'))
            )
          })
          .then(() => {
            // cleanup
            this.deleteFile(tmpFile)
            delete activeDownloads[toFile]
            return toFile
          })
      )
    }
    return activeDownloads[toFile]
  },

  /**
   * remove the file in filePath if it exists.
   * this method always resolves
   * @param filePath
   * @returns {Promise}
   */
  deleteFile(filePath: string) {
    return fs
      .stat(filePath)
      .then((res) => res && res.type === 'file')
      .then((exists: any) => exists && fs.unlink(filePath))
      .catch((err) => {
        // swallow error to always resolve
      })
  },

  /**
   * copy a file from fromFile to toFile
   * @param fromFile
   * @param toFile
   * @returns {Promise}
   */
  copyFile(fromFile: string, toFile: string) {
    return ensurePath(toFile).then(() => fs.cp(fromFile, toFile))
  },

  /**
   * remove the contents of dirPath
   * @param dirPath
   * @returns {Promise}
   */
  cleanDir(dirPath: string) {
    return fs
      .isDir(dirPath)
      .then((isDir: any) => isDir && fs.unlink(dirPath))
      .catch(() => {})
      .then(() => ensurePath(dirPath))
  },

  /**
   * get info about files in a folder
   * @param dirPath
   * @returns {Promise.<{file:Array, size:Number}>}
   */
  getDirInfo(dirPath: string) {
    return fs
      .isDir(dirPath)
      .then((isDir) => {
        if (isDir) {
          return collectFilesInfo(dirPath)
        }
        throw new Error('Dir does not exists')
      })
      .then((filesInfo) => {
        const files = _.flattenDeep(filesInfo as any)
        const size = _.sumBy(files, 'size')
        return {
          files,
          size
        }
      })
  },

  exists(path: string) {
    return fs.exists(path)
  }
}

export default fsUtils
