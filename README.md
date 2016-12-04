# react-native-cached-image
CachedImage component for react-native

This package is greatly inspired by [jayesbe](https://github.com/jayesbe)'s amazing [react-native-cacheable-image](https://github.com/jayesbe/react-native-cacheable-image) but adds some functionality that we were missing when trying to handle caching images in our react-native app.

## Installation

    npm install react-native-cached-image --save

or

    yarn add react-native-cached-image

#### react-native-fs
We use `react-native-fs` to handle file system access in this package and it requires an extra step during the installation.  
_You should only have to do this once._

    react-native link react-native-fs


### Network Status - Android only
Add the following line to your android/app/src/AndroidManifest.xml

    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

## API
This package exposes 2 modules:

1. `CachedImage` - `default` react-native component that is a drop-in replacement for your react-native `Image` components
2. `ImageCacheProvider` - the cache API that you can use if you need to interact with the cache outside the scope of the component, for prefetching images for example.

### CachedImage
`CachedImage` is just like the native `Image` component, you can provide it with `defaultSource`, `style`, etc.  
When providing `source={require('/path/to/local/image')}` or `source={{uri: '/path/to/local/image'}}` to it the image will be loaded from local source and will not be cached.  
When providing `source={{uri: 'https://example.com/path/to/remote/image.jpg'}}` the image will be downloaded and cached on the device to subsequent reuests to the same url will always result in an instant load from the local image.  
```jsx
<CachedImage
    source={{
        uri: 'https://example.com/path/to/your/image.jpg'
    }}
    style={styles.image}
/>
```
##### Props
* `activityIndicatorProps` - props for the `ActivityIndicator` that is shown while the image is downloaded. 
* `useQueryParamsInCacheKey` - _array|bool_ an array of keys to use from the `source.uri` query string or a bool value stating whether to use the entire query string or not. **(default: false)** 

### ImageCacheProvider
`ImageCacheProvider` exposes interaction with the cache layer that is used by `CachedImage` so you can use it to prefetch some urls in the background while you app is starting,
or remove some outdated images from the cache to free some space up if needed.

```javascript
// CachedImage exposes ImageCacheProvider
const ImageCacheProvider = CachedImage;

// will add the urls to the cache so when CachedImage will try to load them 
// the result will be and instant load from cache
ImageCacheProvider.cacheMultipleImages([
    'https://example.com/path/to/remote/image.jpg',
    'https://example.com/path/to/remote/other-image.png'    
]);

// clear old urls from the cache, useful when updating your app version and 
// old version of the images are no longer relevant, for example
ImageCacheProvider.deleteMultipleCachedImages([
    'https://example.com/path/to/remote/image.jpg',
    'https://example.com/path/to/remote/other-image.png'
]);
```

#### `type: CacheOptions`
```
type ReadDirItem = {
  useQueryParamsInCacheKey: string[]|bool; // same as the CachedImage props
  cacheGroup: string; // the directory to save cached images in, defaults to the url hostname
};
```

#### `ImageCacheProvider.isCacheable(url: string): bool`
Returns a true if the url is cacheable, false if it isn't. Currently check if it is a remote url.

#### `ImageCacheProvider.getCachedImagePath(url: string, options: CacheOptions): Promise<imagePath: string>`
Returns a Promise that is resolved with the path to the underlying cached image file path if it exists.  
Promise is rejected if the file doesn't exist.

#### `ImageCacheProvider.cacheImage(url: string, options: CacheOptions): Promise<imagePath: string>`
Will download the file from the given url and save it to the device.  
Returns a Promise that is resolved with the path to the underlying cached image file path if download was successful.  
Promise is rejected if the download or file write failed.

#### `ImageCacheProvider.deleteCachedImage(url: string, options: CacheOptions): Promise`
Deletes the underlying cached image for a given url.

#### `ImageCacheProvider.cacheMultipleImages(urls: string[], options: CacheOptions): Promise`
Cache a list of urls, if any of the urls is already cached will not try to download again.

#### `ImageCacheProvider.deleteMultipleCachedImages(urls: string[], options: CacheOptions): Promise`
Deletes all images from cache that were cached using the given urls, if file doesn't exist do nothing

#### Dependencies
- [url-parse](https://github.com/unshiftio/url-parse) for url handling
- [crypto-js](https://github.com/brix/crypto-js) for hashing
- [react-native-fs](https://github.com/johanneslumpe/react-native-fs) for file system access
