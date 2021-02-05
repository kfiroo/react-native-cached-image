import _ from "lodash";
import React from "react";
import ReactNative from "react-native";
import PropTypes from "prop-types";
import { ImageCacheManagerOptions } from "./typings";
import ImageCacheManager from "./ImageCacheManager";

const flattenStyle = ReactNative.StyleSheet.flatten;

const {
  View,
  ImageBackground,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Animated,
} = ReactNative;
import NetInfo from "@react-native-community/netinfo";

const styles = StyleSheet.create({
  image: {
    backgroundColor: "transparent",
  },
  loader: {
    backgroundColor: "transparent",
  },
  loaderPlaceholder: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
});

function getImageProps(props) {
  return _.omit(props, [
    "source",
    "defaultSource",
    "fallbackSource",
    "LoadingIndicator",
    "loadingIndicatorProps",
    "style",
    "useQueryParamsInCacheKey",
    "renderImage",
    "resolveHeaders",
  ]);
}

class CachedImage extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {
      isCacheable: true,
      cachedImagePath: null,
      networkAvailable: true,
      processingSource: false,
      downloadProgress: new Animated.Value(0),
    };
    this.imageRefSetter = this.imageRefSetter.bind(this);
    this.getImageCacheManagerOptions = this.getImageCacheManagerOptions.bind(
      this
    );
    this.getImageCacheManager = this.getImageCacheManager.bind(this);
    this.safeSetState = this.safeSetState.bind(this);
    this.handleConnectivityChange = this.handleConnectivityChange.bind(this);
    this.processSource = this.processSource.bind(this);
    this.renderLoader = this.renderLoader.bind(this);
    this.progressListener = this.progressListener.bind(this);
    this.progressInterpolation = this.progressInterpolation.bind(this);
  }

  componentWillMount() {
    const { source, callbacks } = this.props;
    this._isMounted = true;
    this._netInfoSubscription = NetInfo.addEventListener(
      this.handleConnectivityChange
    );
    // initial
    NetInfo.fetch().then(({ isConnected }) => {
      this.safeSetState({
        networkAvailable: isConnected,
      });
    });

    this.processSource(
      source,
      Object.assign(callbacks, {
        progressTracker: this.progressListener,
      })
    );
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { source: oldSource, callbacks } = this.props;
    const { source: newSource } = nextProps;
    if (!_.isEqual(oldSource, newSource)) {
      this.processSource(
        newSource,
        Object.assign(callbacks, {
          progressTracker: this.progressListener,
        })
      );
    }
    return true;
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this._netInfoSubscription) this._netInfoSubscription();
  }

  setNativeProps(nativeProps) {
    try {
      this.cachedImage.setNativeProps(nativeProps);
    } catch (e) {
      console.error(e);
    }
  }

  getImageCacheManagerOptions() {
    return _.pick(this.props, _.keys(ImageCacheManagerOptionsPropTypes));
  }

  getImageCacheManager() {
    // try to get ImageCacheManager from context
    if (this.context && this.context.getImageCacheManager) {
      return this.context.getImageCacheManager();
    }
    // create a new one if context is not available
    const options = this.getImageCacheManagerOptions();
    return ImageCacheManager(options);
  }

  safeSetState(newState) {
    if (!this._isMounted) {
      return;
    }
    this.setState(newState);
  }

  handleConnectivityChange({ isConnected }) {
    this.safeSetState({
      networkAvailable: isConnected,
    });
  }

  imageRefSetter(node) {
    this.cachedImage = node;
  }

  progressListener(received, total) {
    const { downloadProgress } = this.state;
    const progress = received / total;
    const evaluatedProgress = progress > 0 ? progress : 1;
    Animated.timing(downloadProgress, {
      toValue: evaluatedProgress,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }

  progressInterpolation() {
    const { downloadProgress } = this.state;
    return downloadProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 0],
      extrapolate: "clamp",
    });
  }

  processSource(source, callbacks) {
    const { state, props } = this;
    const { downloadProgress } = state;
    const url = _.get(source, ["uri"], null);
    const options = this.getImageCacheManagerOptions();
    const imageCacheManager = this.getImageCacheManager();
    downloadProgress.setValue(0);
    this.safeSetState({ processingSource: true });

    imageCacheManager
      .downloadAndCacheUrl(url, options, callbacks)
      .then((cachedImagePath) => {
        this.safeSetState({
          cachedImagePath,
          processingSource: false,
        });
      })
      .catch((err) => {
        // console.warn(err);
        this.safeSetState({
          cachedImagePath: null,
          isCacheable: false,
          processingSource: false,
        });
      });
  }

  renderLoader() {
    const {
      style: propsStyle,
      loadingIndicatorProps: propsActivityIndicatorProps,
      loadingIndicator: propsLoadingIndicator,
      defaultSource: propsDefaultSource,
      renderImage,
    } = this.props;
    const { downloadProgress } = this.state;
    const imageProps = getImageProps(this.props);
    const imageStyle = [propsStyle, styles.loaderPlaceholder];
    const loadingIndicatorProps = _.omit(propsActivityIndicatorProps, [
      "style",
    ]);
    const activityIndicatorStyle =
      propsActivityIndicatorProps.style || styles.loader;
    const LoadingIndicator = propsLoadingIndicator;
    const source = propsDefaultSource;
    // if the imageStyle has borderRadius it will break the loading image view on android
    // so we only show the ActivityIndicator
    if (
      !source ||
      (Platform.OS === "android" && flattenStyle(imageStyle).borderRadius)
    ) {
      if (LoadingIndicator) {
        return (
          <View style={[imageStyle, activityIndicatorStyle]}>
            <LoadingIndicator
              {...loadingIndicatorProps}
              progress={downloadProgress}
              style={propsStyle}
            />
          </View>
        );
      }
      return (
        <ActivityIndicator
          {...loadingIndicatorProps}
          style={[imageStyle, activityIndicatorStyle]}
        />
      );
    }
    // otherwise render an image with the defaultSource with the ActivityIndicator on top of it
    return renderImage({
      ...imageProps,
      style: imageStyle,
      key: source.uri,
      source,
      children: LoadingIndicator ? (
        <View style={[imageStyle, activityIndicatorStyle]}>
          <LoadingIndicator {...loadingIndicatorProps} />
        </View>
      ) : (
        <ActivityIndicator
          {...loadingIndicatorProps}
          style={activityIndicatorStyle}
        />
      ),
    });
  }

  render() {
    const { isCacheable, cachedImagePath, processingSource } = this.state;
    const {
      style: propsStyle,
      source: propsSource,
      fallbackSource: propsFallbackSource,
      renderImage,
    } = this.props;
    if (processingSource || (isCacheable && !cachedImagePath)) {
      return this.renderLoader();
    }
    const props = getImageProps(this.props);
    const style = propsStyle || styles.image;
    const source =
      isCacheable && cachedImagePath
        ? {
            uri: `file://${cachedImagePath}`,
          }
        : propsSource;
    if (propsFallbackSource && !cachedImagePath) {
      return renderImage({
        ...props,
        key: `${props.key || source.uri}error`,
        style,
        source: propsFallbackSource,
      });
    }
    return renderImage({
      ...props,
      key: props.key || source.uri,
      style,
      source,
    });
  }
}

module.exports = CachedImage;

CachedImage.propTypes =
  ReactNative.ImagePropTypes &
  {
    renderImage: PropTypes.func,
    loadingIndicatorProps: PropTypes.shape({}),
    callbacks: PropTypes.exact({
      onStartDownloading: PropTypes.func,
      onFinishDownloading: PropTypes.func,
      progressTracker: PropTypes.func,
    }),
    style: PropTypes.oneOfType([PropTypes.shape({}), PropTypes.array]),
    // ImageCacheManager options
    ...ImageCacheManagerOptionsPropTypes,
  };

CachedImage.defaultProps = {
  renderImage: (props) => {
    const { style } = props;
    return (
      <ImageBackground
        imageStyle={style}
        ref={this.imageRefSetter}
        {...props}
      />
    );
  },
  style: {},
  loadingIndicatorProps: {},
  callbacks: {
    onStartDownloading: () => {},
    onFinishDownloading: () => {},
  },
};

CachedImage.contextTypes = {
  getImageCacheManager: PropTypes.func,
};
