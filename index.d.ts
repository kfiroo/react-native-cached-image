import * as ReactNative from "react-native";
import * as React from 'react'

declare module "react-native-cached-image" {
  namespace CachedImage {
    interface Image extends ReactNative.Image {
      /**
       * props for the ActivityIndicator that is shown while the image is downloaded.
       */
      activityIndicatorProps: ReactNative.ActivityIndicatorProperties
      /** 
       * component prop to set custom ActivityIndicator 
       */
      loadingIndicator: ReactNative.ComponentInterface<any>
      /** 
       * function when provided, the returned object will be used as the headers object 
       * when sending the request to download the image. (default: () => Promise.resolve({})) 
       */
      resolveHeaders: Promise<{}>
      /**
       * array|bool an array of keys to use from the source.
       * uri query string or a bool value stating whether to use the entire query string or not. (default: false)
       */
      useQueryParamsInCacheKey: string[] | boolean
      /**
       * string allows changing the root directory to use for caching.
       * The default directory is sufficient for most use-cases.
       * Images in this directory may be purged by Android automatically to free up space.
       * Use ImageCacheProvider.LOCATION.BUNDLE if the cached images are critical
       * (you will have to manage cleanup manually).
       * (default: ImageCacheProvider.LOCATION.CACHE)
       */
      cacheLocation: string
      /**
       * prop to display a background image while the source image is downloaded.
       * This will work even in android, but will not display background image
       * if there you set borderRadius on this component style prop
       */
      defaultSource: string
      /**
       * prop to set placeholder image. when source.uri is null or cached failed, the fallbackSource will be display.
       */
      fallbackSource: string
    }

    interface CacheOptions  {
      /**
       * array|bool an array of keys to use from the source.
       * uri query string or a bool value stating whether to use the entire query string or not. (default: false)
       */
      useQueryParamsInCacheKey: string[] | boolean
      /**
       * the directory to save cached images in, defaults to the url hostname
       */
      cacheGroup: string;
      /**
       * the root directory to use for caching, corresponds to CachedImage prop of same name, 
       * defaults to system cache directory
       */
      cacheLocation: string; // 
    }

    interface CacheInfoFile {
      filename: string
      lastModified: number
      path: string
      size: number
      type: string
    }

    interface PromiseCacheInfo {
      files: CacheInfoFile[]
      size: number
    }

    interface ImageCacheProvider {
      /**
       *  Check whether a url is cacheable.
       * Takes an image source and if it's a valid url return `true`
       */
      isCacheable(url: string): boolean
      /** Get the local path corresponding to the given url and options. */
      getCachedImagePath(url: string, options?: CacheOptions): Promise<string>
      /** Download the image to the cache and return the local file path. */
      cacheImage(url: string, options?: CacheOptions): Promise<string>
      /** Delete the cached image corresponding to the given url and options. */
      deleteCachedImage(url: string, options?: CacheOptions): Promise<any>
      /**
       * Cache an array of urls.
       * Usually used to prefetch images.
       */
      cacheMultipleImages(urls: string[], options?: CacheOptions): Promise<any>
      /**
       * Delete an array of cached images by their urls.
       * Usually used to clear the prefetched images.
       */
      deleteMultipleCachedImages(urls: string[], options?: CacheOptions): Promise<any>
      /**
       * Clear the entire cache.
       */
      clearCache(): Promise<any>
      /**
       * Seed the cache of a specified url with a local image
       * Handy if you have a local copy of a remote image, e.g. you just uploaded local to url.
       */
      seedCache(local: string, url: string, options?: CacheOptions): Promise<any>
      /**
       * Return info about the cache, list of files and the total size of the cache.
       */
      getCacheInfo(options?: CacheOptions): Promise<PromiseCacheInfo>
      LOCATION : {
        CACHE: string
        BUNDLE: string
      }
    }
  }
  export default class  extends React.Component<CachedImage.Image, any> {}
  export const ImageCacheProvider: CachedImage.ImageCacheProvider
}
