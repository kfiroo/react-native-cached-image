import _, { get } from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ImageProps, ImageBackground, Animated, ImageStyle } from 'react-native'
import ImageCacheManager, { TOptions } from '../ImageCacheManager'
import { useNetInfo } from '@react-native-community/netinfo'
import { ObjectLiteral } from '../typings'
import styles from './styles'
import Loader from './Loader'

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
  const { current: imageCacheManagerRef } = useRef(
    ImageCacheManager(cacheManagerOptions)
  )
  const [processingSource, setProcessingSource] = useState(false)
  const [cachedImagePath, setCachedImagePath] = useState<string | null>(null)
  const [isCacheable, setIsCacheable] = useState(true)
  // const { isInternetReachable } = useNetInfo()

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
      .catch((_: any) => {
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

  if (processingSource || (isCacheable && !cachedImagePath))
    return (
      <Loader
        style={style}
        defaultSource={defaultSource}
        loadingIndicatorProps={loadingIndicatorProps}
        LoadingIndicator={LoadingIndicator}
      />
    )

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
