import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import styles from './styles'

type Props = {
  style?: any
  defaultSource?: any
  loadingIndicatorProps?: any
  LoadingIndicator?: any
}

const Loader = ({
  style,
  defaultSource,
  loadingIndicatorProps,
  LoadingIndicator
}: Props) => {
  const imageStyle = [style, styles.loaderPlaceholder]

  const activityIndicatorStyle = loadingIndicatorProps.style || styles.loader
  if (LoadingIndicator)
    return (
      <View style={[imageStyle, activityIndicatorStyle]}>
        <LoadingIndicator {...loadingIndicatorProps} />
      </View>
    )
  return (
    <ActivityIndicator
      {...loadingIndicatorProps}
      style={activityIndicatorStyle}
    />
  )
}

export default Loader
