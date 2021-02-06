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
