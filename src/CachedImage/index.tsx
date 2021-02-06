import _, { get } from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ImageProps,
  StyleSheet,
  View,
  ImageBackground,
  ActivityIndicator,
  Platform,
  Animated,
  ImageStyle
} from 'react-native'
import ImageCacheManager, { TOptions } from '../ImageCacheManager'
import { useNetInfo } from '@react-native-community/netinfo'
import { ObjectLiteral } from '../typings'
import styles from './styles'

const flattenStyle = StyleSheet.flatten

type Props = ImageProps & /*  ImageCacheManager options */ {
  cacheManagerOptions?: TOptions
  loadingIndicatorProps?: ObjectLiteral
  callbacks?: {
    onStartDownloading: () => any
    onFinishDownloading: () => any
    progressTracker?: () => any
  }
  LoadingIndicator?: (args: any) => JSX.Element
  style?: ImageStyle
  fallbackSource?: string
}

const CachedImage = ({
  LoadingIndicator,
  fallbackSource,
  loadingIndicatorProps = {},
  callbacks = {
    onStartDownloading: () => {},
    onFinishDownloading: () => {}
  },
  style,
  cacheManagerOptions,
  defaultSource,
  ...imageProps
}: Props) => {
  const { source } = imageProps
  const { current: cachedImageRef } = useRef(null)
  const { current: downloadProgress } = useRef(new Animated.Value(0))
  const [processingSource, setProcessingSource] = useState(false)
  const [networkAvailable, setNetworkAvailable] = useState(true)
  const [cachedImagePath, setCachedImagePath] = useState<string | null>(null)
  const [isCacheable, setIsCacheable] = useState(true)
  const { isInternetReachable } = useNetInfo()
  const { current: imageCacheManagerRef } = useRef(
    ImageCacheManager(cacheManagerOptions)
  )

  const processSource = useCallback((source, callbacks) => {
    const url = get(source, ['uri'], null)
    downloadProgress.setValue(0)
    setProcessingSource(true)

    imageCacheManagerRef
      .downloadAndCacheUrl(url, cacheManagerOptions, callbacks)
      .then((cachedImagePath: string) => {
        setCachedImagePath(cachedImagePath)
        setProcessingSource(false)
      })
      .catch((err: any) => {
        setCachedImagePath(null)
        setProcessingSource(false)
        setIsCacheable(false)
      })
  }, [])

  const progressTracker = (received: number, total: number) => {
    const progress = received / total
    const evaluatedProgress = progress > 0 ? progress : 1
    Animated.timing(downloadProgress, {
      toValue: evaluatedProgress,
      duration: 100,
      useNativeDriver: true
    }).start()
  }

  useEffect(() => {
    processSource(
      source,
      Object.assign(callbacks, {
        progressTracker
      })
    )
  }, [])

  const progressInterpolation = () => {
    return downloadProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 0],
      extrapolate: 'clamp'
    })
  }

  const renderLoader = () => {
    const imageStyle = [style, styles.loaderPlaceholder]

    const activityIndicatorStyle = loadingIndicatorProps.style || styles.loader
    const source = defaultSource

    // if the imageStyle has borderRadius it will break the loading image view on android
    // so we only show the ActivityIndicator
    if (
      !source ||
      (Platform.OS === 'android' &&
        (flattenStyle(imageStyle) as any)?.borderRadius)
    ) {
      if (LoadingIndicator) {
        return (
          <View style={[imageStyle, activityIndicatorStyle]}>
            <LoadingIndicator
              {...loadingIndicatorProps}
              progress={downloadProgress}
              style={style}
            />
          </View>
        )
      }
      return (
        <ActivityIndicator
          {...loadingIndicatorProps}
          style={[imageStyle, activityIndicatorStyle]}
        />
      )
    }
    // otherwise render an image with the defaultSource with the ActivityIndicator on top of it
    return (
      <ImageBackground
        {...imageProps}
        source={source}
        imageStyle={imageStyle}
        ref={cachedImageRef}
      >
        {LoadingIndicator ? (
          <View style={[imageStyle, activityIndicatorStyle]}>
            <LoadingIndicator {...loadingIndicatorProps} />
          </View>
        ) : (
          <ActivityIndicator
            {...loadingIndicatorProps}
            style={activityIndicatorStyle}
          />
        )}
      </ImageBackground>
    )
  }

  if (processingSource || (isCacheable && !cachedImagePath)) {
    return renderLoader()
  }
  const evaledSource =
    isCacheable && cachedImagePath
      ? {
          uri: `file://${cachedImagePath}`
        }
      : source
  if (fallbackSource && !cachedImagePath) {
    return (
      <ImageBackground
        ref={cachedImageRef}
        {...imageProps}
        source={fallbackSource as any}
        imageStyle={style || styles.image}
      />
    )
  }

  return (
    <ImageBackground
      ref={cachedImageRef}
      {...imageProps}
      source={evaledSource}
      imageStyle={style}
    />
  )
}

export default CachedImage
