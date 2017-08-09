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

## Usage

TODO - add usage example

## API

This package exposes 3 modules:
```jsx
const {
    CachedImage,            // react-native component that is a drop-in replacement for your react-native `Image` components
    ImageCacheProvider,     // a top level component that provides accsess to the underlying `ImageCacheManager` and preloads images
    ImageCacheManager,      // the logic behind cache machanism - ttl, fs, url resolving etc. 
} = require('react-native-cached-image');
```

### CachedImage
TODO - CachedImage props

### ImageCacheProvider
TODO - ImageCacheProvider props

### ImageCacheManager
TODO - ImageCacheManager api

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.
