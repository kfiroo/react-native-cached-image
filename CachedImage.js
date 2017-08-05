'use strict';

const _ = require('lodash');
const React = require('react');
const ReactNative = require('react-native');
const PropTypes= require('prop-types');
const flattenStyle = ReactNative.StyleSheet.flatten;
const ImageCacheProvider = require('./ImageCacheProvider');

const {
    View,
    Image,
    ActivityIndicator,
    NetInfo,
    Platform
} = ReactNative;


const {
    StyleSheet
} = ReactNative;

const styles = StyleSheet.create({
    image: {
        backgroundColor: 'transparent'
    },
    loader: {
        backgroundColor: 'transparent',
    },
    loaderPlaceholder: {
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center'
    }
});

function getImageProps(props) {
    return _.omit(props, ['source', 'defaultSource', 'fallbackSource', 'LoadingIndicator', 'activityIndicatorProps', 'style', 'useQueryParamsInCacheKey', 'renderImage', 'resolveHeaders']);
}

const CACHED_IMAGE_REF = 'cachedImage';
let _isMounted = false;

class CachedImage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isMounted: false,
            isCacheable: false,
            cachedImagePath: null,
            networkAvailable: true
        };
    }

    setNativeProps(nativeProps) {
        try {
            this.refs[CACHED_IMAGE_REF].setNativeProps(nativeProps);
        } catch (e) {
            console.error(e);
        }
    }

    safeSetState(newState) {
        if (!_isMounted) {
            return;
        }

        return this.setState(newState);
    }

    componentWillMount() {
        //this.setState({ isMounted: true });
        _isMounted = true;
        NetInfo.isConnected.addEventListener('change', this.handleConnectivityChange.bind(this));
        // initial
        NetInfo.isConnected.fetch()
            .then(isConnected => {
                this.safeSetState({
                    networkAvailable: isConnected
                });
            });

        this.processSource(this.props.source);
    }

    componentWillUnmount() {
        //this.setState({ isMounted: false });
        _isMounted = false;
        NetInfo.isConnected.removeEventListener('change', this.handleConnectivityChange.bind(this));
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.source, nextProps.source)) {
            this.processSource(nextProps.source);
        }
    }

    handleConnectivityChange(isConnected) {
        this.safeSetState({
            networkAvailable: isConnected
        });
    }

    processSource(source) {
        const url = _.get(source, ['uri'], null);
        if (ImageCacheProvider.isCacheable(url)) {
            const options = _.pick(this.props, ['useQueryParamsInCacheKey', 'cacheGroup', 'cacheLocation']);

            // try to get the image path from cache
            ImageCacheProvider.getCachedImagePath(url, options)
                // try to put the image in cache if
                .catch(() => ImageCacheProvider.cacheImage(url, options, this.props.resolveHeaders))
                .then(cachedImagePath => {
                    this.safeSetState({
                        cachedImagePath
                    });
                })
                .catch(err => {
                    this.safeSetState({
                        cachedImagePath: null,
                        isCacheable: false
                    });
                });
            this.safeSetState({
                isCacheable: true
            });
        } else {
            this.safeSetState({
                isCacheable: false
            });
        }
    }

    render() {
        if (this.state.isCacheable && !this.state.cachedImagePath) {
            return this.renderLoader();
        }
        const props = getImageProps(this.props);
        const style = this.props.style || styles.image;
        const source = (this.state.isCacheable && this.state.cachedImagePath) ? {
                uri: 'file://' + this.state.cachedImagePath
            } : this.props.source;
        if (this.props.fallbackSource && !this.state.cachedImagePath) {
          return this.props.renderImage({
              ...props,
              key: `${props.key || source.uri}error`,
              style,
              source: this.props.fallbackSource
          });
        }
        return this.props.renderImage({
            ...props,
            key: props.key || source.uri,
            style,
            source
        });
    }

    renderLoader() {
        const imageProps = getImageProps(this.props);
        const imageStyle = [this.props.style, styles.loaderPlaceholder];

        const activityIndicatorProps = _.omit(this.props.activityIndicatorProps, ['style']);
        const activityIndicatorStyle = this.props.activityIndicatorProps.style || styles.loader;

        const LoadingIndicator = this.props.loadingIndicator;

        const source = this.props.defaultSource;

        // if the imageStyle has borderRadius it will break the loading image view on android
        // so we only show the ActivityIndicator
        if (!source || (Platform.OS === 'android' && flattenStyle(imageStyle).borderRadius)) {
            if (LoadingIndicator) {
              return (
                <View style={[imageStyle, activityIndicatorStyle]}>
                  <LoadingIndicator {...activityIndicatorProps} />
                </View>
              );
            }
            return (
                <ActivityIndicator
                    {...activityIndicatorProps}
                    style={[imageStyle, activityIndicatorStyle]}/>
            );
        }
        // otherwise render an image with the defaultSource with the ActivityIndicator on top of it
        return this.props.renderImage({
            ...imageProps,
            style: imageStyle,
            key: source.uri,
            source,
            children: (
                LoadingIndicator
                  ? <View style={[imageStyle, activityIndicatorStyle]}>
                      <LoadingIndicator {...activityIndicatorProps} />
                    </View>
                  : <ActivityIndicator
                      {...activityIndicatorProps}
                      style={activityIndicatorStyle}/>
            )
        });
    }
}

CachedImage.propTypes = {
    renderImage: PropTypes.func.isRequired,
    activityIndicatorProps: PropTypes.object.isRequired,
    useQueryParamsInCacheKey: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.array
    ]).isRequired,
    resolveHeaders: PropTypes.func,
    cacheLocation: PropTypes.string
};

CachedImage.defaultProps = {
    renderImage: props => <Image ref={CACHED_IMAGE_REF} {...props} />,
    activityIndicatorProps: {},
    useQueryParamsInCacheKey: false,
    resolveHeaders: () => Promise.resolve({}),
    cacheLocation: ImageCacheProvider.LOCATION.CACHE
};

/**
 * Same as ReactNaive.Image.getSize only it will not download the image if it has a cached version
 * @param uri
 * @param success
 * @param failure
 * @param options
 */
CachedImage.getSize = function getSize(uri, success, failure, options) {
    if (ImageCacheProvider.isCacheable(uri)) {
        ImageCacheProvider.getCachedImagePath(uri, options)
            .then(imagePath => {
                if (Platform.OS === 'android') {
                    imagePath = 'file://' + imagePath;
                }
                Image.getSize(imagePath, success, failure);
            })
            .catch(err => {
                Image.getSize(uri, success, failure);
            });
    } else {
        Image.getSize(uri, success, failure);
    }
};

module.exports = CachedImage;
