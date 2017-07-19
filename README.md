[![npm version](https://badge.fury.io/js/react-native-cached-image.svg)](https://badge.fury.io/js/react-native-cached-image)

# react-native-cached-image
CachedImage component for react-native

This package is greatly inspired by [@jayesbe](https://github.com/jayesbe)'s amazing [react-native-cacheable-image](https://github.com/jayesbe/react-native-cacheable-image) but adds some functionality that we were missing when trying to handle caching images in our react-native app.

## Installation

    npm install react-native-cached-image --save

or

    yarn add react-native-cached-image

We use [`react-native-fetch-blob`](https://github.com/wkh237/react-native-fetch-blob#installation) to handle file system access in this package and it requires an extra step during the installation.  
_You should only have to do this once._

    react-native link react-native-fetch-blob

Or, if you want to add Android permissions to AndroidManifest.xml automatically, use this one:

    RNFB_ANDROID_PERMISSIONS=true react-native link react-native-fetch-blob

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
When providing `source={{uri: 'https://example.com/path/to/remote/image.jpg'}}` the image will be downloaded and cached on the device to subsequent requests to the same url will always result in an instant load from the local image.  
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
* `defaultSource` - prop to display a background image while the source image is downloaded. This will work even in android, but will not display background image if there you set borderRadius on this component style prop
* `resolveHeaders` - _function_ when provided, the returned object will be used as the headers object when sending the request to download the image. **(default: () => Promise.resolve({}))**
* `cacheLocation` - _string_ allows changing the root directory to use for caching. The default directory is sufficient for most use-cases. Images in this directory may be purged by Android automatically to free up space. Use `ImageCacheProvider.LOCATION.BUNDLE` if the cached images are critical (you will have to manage cleanup manually). **(default: ImageCacheProvider.LOCATION.CACHE)**
* `loadingIndicator` - _component_ prop to set custom `ActivityIndicator`.
* `fallbackSource` - prop to set placeholder image. when `source.uri` is null or cached failed, the `fallbackSource` will be display.


### ImageCacheProvider
`ImageCacheProvider` exposes interaction with the cache layer that is used by `CachedImage` so you can use it to prefetch some urls in the background while you app is starting,
or remove some outdated images from the cache to free some space up if needed.

```javascript
const CachedImage = require('react-native-cached-image');

// CachedImage exposes ImageCacheProvider
const ImageCacheProvider = CachedImage.ImageCacheProvider;

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
type CacheOptions = {
  useQueryParamsInCacheKey: string[]|bool; // same as the CachedImage props
  cacheGroup: string; // the directory to save cached images in, defaults to the url hostname
  cacheLocation: string; // the root directory to use for caching, corresponds to CachedImage prop of same name, defaults to system cache directory
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

#### `ImageCacheProvider.seedCache(local: string, url: string, options: CacheOptions): Promise`
Seed the cache for a given url with a local image.
Useful to avoid having to download an image when you have a local copy.

#### `ImageCacheProvider.deleteCachedImage(url: string, options: CacheOptions): Promise`
Deletes the underlying cached image for a given url.

#### `ImageCacheProvider.cacheMultipleImages(urls: string[], options: CacheOptions): Promise`
Cache a list of urls, if any of the urls is already cached will not try to download again.

#### `ImageCacheProvider.deleteMultipleCachedImages(urls: string[], options: CacheOptions): Promise`
Deletes all images from cache that were cached using the given urls, if file doesn't exist do nothing.

### `ImageCacheProvider.clearCache(): Promise`
Deletes all cached images.

#### Dependencies
- [lodash](https://github.com/lodash/lodash) for props handling
- [url-parse](https://github.com/unshiftio/url-parse) for url handling
- [crypto-js](https://github.com/brix/crypto-js) for hashing
- [react-native-fetch-blob](https://github.com/wkh237/react-native-fetch-blob) for downloading and saving images
