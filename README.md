# react-native-cached-image

CachedImage component for react-native

This package is greatly inspired by [@jayesbe](https://github.com/jayesbe)'s amazing [react-native-cacheable-image](https://github.com/jayesbe/react-native-cacheable-image) but adds some functionality that we were missing when trying to handle caching images in our react-native app.

## Installation

    npm install react-native-cached-image --save
    - or -
    yarn add react-native-cached-image

We use [`react-native-fetch-blob`](https://github.com/wkh237/react-native-fetch-blob#installation) to handle file system access in this package and it requires an extra step during the installation.  

_You should only have to do this once._

    react-native link react-native-fetch-blob

Or, if you want to add Android permissions to AndroidManifest.xml automatically, use this one:

    RNFB_ANDROID_PERMISSIONS=true react-native link react-native-fetch-blob

### Network Status - Android only
Add the following line to your android/app/src/AndroidManifest.xml

    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

## Usage

TODO - add usage example

```jsx
import React from 'react';
import {
    CachedImage,
    ImageCacheProvider
} from 'react-native-cached-image';

const images = [
    'https://example.com/images/1.jpg',
    'https://example.com/images/2.jpg',
    'https://example.com/images/3.jpg',
    // ...
];

export default class Example extends React.Component {
    render() {
        return (
            <ImageCacheProvider
                urlsToPreload={images}
                onPreloadComplete={() => console.log('hey there')}>

                <CachedImage source={{uri: images[0]}}/>

                <CachedImage source={{uri: images[1]}}/>

                <CachedImage source={{uri: images[2]}}/>

            </ImageCacheProvider>
        );
    }
}
```

## API

This package exposes 3 modules:
```jsx
const {
    CachedImage,            // react-native component that is a drop-in replacement for your react-native `Image` components
    ImageCacheProvider,     // a top level component that provides accsess to the underlying `ImageCacheManager` and preloads images
    ImageCacheManager,      // the logic behind cache machanism - ttl, fs, url resolving etc. 
} = require('react-native-cached-image');
```

### ImageCacheManager
This is where all the cache magic takes place.
The API usually takes a *URL* and a set of [`ImageCacheManagerOptions`](#imagecachemanageroptions).

#### `ImageCacheManager.downloadAndCacheUrl(url: String, options: ImageCacheManagerOptions): Promise<String>`
Check the cache for the the URL (after removing fixing the query string according to `ImageCacheManagerOptions.useQueryParamsInCacheKey`).
If the URL exists in cache and is not expired, resolve with the local cached file path.
Otherwise, download the file to the cache folder, add it to the cache and then return the cached file path.

#### `ImageCacheManager.seedAndCacheUrl(url: String, seedPath: String, options: ImageCacheManagerOptions): Promise<String>`
Check the cache for the the URL (after removing fixing the query string according to `ImageCacheManagerOptions.useQueryParamsInCacheKey`).
If the URL exists in cache and is not expired, resolve with the local cached file path.
Otherwise, copy the seed file into the cache folder, add it to the cache and then return the cached file path.

#### `ImageCacheManager.deleteUrl(url: String, options: ImageCacheManagerOptions): Promise`
Removes the cache entry for the URL and the local file corresponding to it, if it exists.

#### `ImageCacheManager.clearCache(options: ImageCacheManagerOptions): Promise`
Clear the URL cache and remove files in the cache folder (as stated in the `ImageCacheManagerOptions.cacheLocation`)

#### `ImageCacheManager.getCacheInfo(options: ImageCacheManagerOptions): Promise.<{file: Array, size: Number}>`
Returns info about the cache, list of files and the total size of the cache.


### CachedImage
`CachedImage` is a drop in replacement for the `Image` component that will attempt to cache remote URLs for better performance.  
It's main use is to hide the cache layer from the user and provide a simple way to cache images.  
`CachedImage` uses an instance of `ImageCacheManager` to interact with the cache, if there is an instance provided by `ImageCacheProvider` via the context it will be used, otherwise a new instance will be created with the options from the component's props. 

```jsx
<CachedImage
    source={{
        uri: 'https://example.com/path/to/your/image.jpg'
    }}
    style={styles.image}
/>
```

##### Props
* `renderImage` - a function that returns a component, used to override the underlying `Image` component.
* `activityIndicatorProps` - props for the `ActivityIndicator` that is shown while the image is downloaded.
* `defaultSource` - prop to display a background image while the source image is downloaded. This will work even in android, but will not display background image if there you set borderRadius on this component style prop
* `loadingIndicator` - _component_ prop to set custom `ActivityIndicator`.
* `fallbackSource` - prop to set placeholder image. when `source.uri` is null or cached failed, the `fallbackSource` will be display.
* any of the `ImageCacheManagerOptionsPropTypes` props - customize the `ImageCacheManager` for this specific `CachedImage` instance.

### ImageCacheProvider
This is a top-level component with 2 major functions:
1. Provide the customized `ImageCacheManager` to nested `CachedImage`.
2. Preload a set of URLs.

##### Props
* `urlsToPreload` - an array of URLs to preload when the component mounts. default []
* `numberOfConcurrentPreloads` - control the number of concurrent downloads, usually used when the `urlsToPreload` array is very big. default `urlsToPreload.length`
* `onPreloadComplete` - callback for when the preload is complete and all images are cached.

### ImageCacheManagerOptions
A set of options that are provided to the `ImageCacheManager` and provide ways to customize it to your needs.

```jsx
type ImageCacheManagerOptions = {
    headers: PropTypes.object,                      // an object to be used as the headers when sending the request for the url. default {}
    
    ttl: PropTypes.number,                          // the number of seconds each url will stay in the cache. default 2 weeks
    
    useQueryParamsInCacheKey: PropTypes.oneOfType([ // when handling a URL with query params, this indicates how it should be treated:
        PropTypes.bool,                             // if a bool value is given the whole query string will be used / ignored
        PropTypes.arrayOf(PropTypes.string)         // if an array of strings is given, only these keys will be taken from the query string.
    ]),                                             // default false
    
    cacheLocation: PropTypes.string,                // the path to the root of the cache folder. default the device cache dir 
    
    allowSelfSignedSSL: PropTypes.bool,             // true to allow self signed SSL URLs to be downloaded. default false
};

```


## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.
