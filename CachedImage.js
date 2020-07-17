'use strict';

const _ = require('lodash');
const React = require('react');
const ReactNative = require('react-native');
const ImageStylePropTypes = require('ImageStylePropTypes');
const ViewStylePropTypes = require('ViewStylePropTypes');

const PropTypes = require('prop-types');

const ImageCacheManagerOptionsPropTypes = require('./ImageCacheManagerOptionsPropTypes');

const flattenStyle = ReactNative.StyleSheet.flatten;

const ImageCacheManager = require('./ImageCacheManager');

const {
    View,
    ImageBackground,
    ActivityIndicator,
    NetInfo,
    Platform,
    StyleSheet,
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

const IMAGE_SPECIFIC_STYLE_PROPS = _.difference(Object.keys(ImageStylePropTypes), Object.keys(ViewStylePropTypes))

function getViewStyles(style) {
    return _.omit(flattenStyle(style), IMAGE_SPECIFIC_STYLE_PROPS)
}

const CACHED_IMAGE_REF = 'cachedImage';

class CachedImage extends React.Component {

    static propTypes = {
        renderImage: PropTypes.func.isRequired,
        activityIndicatorProps: PropTypes.object.isRequired,

        // ImageCacheManager options
        ...ImageCacheManagerOptionsPropTypes,
    };

    static defaultProps = {
            renderImage: props => (<ImageBackground imageStyle={props.imageStyle} ref={CACHED_IMAGE_REF} {...props} />),
            activityIndicatorProps: {},
    };

    static contextTypes = {
        getImageCacheManager: PropTypes.func,
    };

    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = {
            isCacheable: true,
            cachedImagePath: null,
            networkAvailable: true
        };

        this.getImageCacheManagerOptions = this.getImageCacheManagerOptions.bind(this);
        this.getImageCacheManager = this.getImageCacheManager.bind(this);
        this.safeSetState = this.safeSetState.bind(this);
        this.handleConnectivityChange = this.handleConnectivityChange.bind(this);
        this.processSource = this.processSource.bind(this);
        this.renderLoader = this.renderLoader.bind(this);
    }

    componentWillMount() {
        this._isMounted = true;
        NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
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
        this._isMounted = false;
        NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.source, nextProps.source)) {
            this.processSource(nextProps.source);
        }
    }

    setNativeProps(nativeProps) {
        try {
            this.refs[CACHED_IMAGE_REF].setNativeProps(nativeProps);
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
        return this.setState(newState);
    }

    handleConnectivityChange(isConnected) {
        this.safeSetState({
            networkAvailable: isConnected
        });
    }

    processSource(source) {
        const url = _.get(source, ['uri'], null);
        const options = this.getImageCacheManagerOptions();
        const imageCacheManager = this.getImageCacheManager();

        imageCacheManager.downloadAndCacheUrl(url, options)
            .then(cachedImagePath => {
                this.safeSetState({
                    cachedImagePath
                });
            })
            .catch(err => {
                // console.warn(err);
                this.safeSetState({
                    cachedImagePath: null,
                    isCacheable: false
                });
            });
    }

    render() {
        if (this.state.isCacheable && !this.state.cachedImagePath) {
            return this.renderLoader();
        }
        const props = getImageProps(this.props);
        const imageStyle = this.props.style || styles.image;
        const viewStyle = getViewStyles(imageStyle)

        const source = (this.state.isCacheable && this.state.cachedImagePath) ? {
            uri: 'file://' + this.state.cachedImagePath
        } : this.props.source;
        if (this.props.fallbackSource && !this.state.cachedImagePath) {
            return this.props.renderImage({
                ...props,
                key: `${props.key || source.uri}error`,
                style: viewStyle,
                imageStyle: imageStyle,
                source: this.props.fallbackSource
            });
        }
        return this.props.renderImage({
            ...props,
            key: props.key || source.uri,
            style: viewStyle,
            imageStyle: imageStyle,
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

        const viewStyle = getViewStyles(imageStyle)

        // if the imageStyle has borderRadius it will break the loading image view on android
        // so we only show the ActivityIndicator
        if (!source || (Platform.OS === 'android' && flattenStyle(imageStyle).borderRadius)) {
            if (LoadingIndicator) {
                return (
                    <View style={[viewStyle, activityIndicatorStyle]}>
                        <LoadingIndicator {...activityIndicatorProps} />
                    </View>
                );
            }
            return (
                <ActivityIndicator
                    {...activityIndicatorProps}
                    style={[viewStyle, activityIndicatorStyle]}/>
            );
        }
        // otherwise render an image with the defaultSource with the ActivityIndicator on top of it
        return this.props.renderImage({
            ...imageProps,
            key: source.uri,
            style: viewStyle,
            imageStyle: imageStyle,
            source,
            children: (
                LoadingIndicator
                    ? <View style={[viewStyle, activityIndicatorStyle]}>
                    <LoadingIndicator {...activityIndicatorProps} />
                </View>
                    : <ActivityIndicator
                    {...activityIndicatorProps}
                    style={activityIndicatorStyle}/>
            )
        });
    }

}

module.exports = CachedImage;
