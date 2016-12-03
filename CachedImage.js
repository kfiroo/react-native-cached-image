'use strict';

const _ = require('lodash');
const React = require('react');
const ReactNative = require('react-native');

const ImageCacheProvider = require('./ImageCacheProvider');

const {
    Image,
    ActivityIndicator,
    NetInfo
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
        flex: 1
    }
});

const CacheableImage = React.createClass({
    propTypes: {
        renderImage: React.PropTypes.func.isRequired,
        activityIndicatorProps: React.PropTypes.object.isRequired,
        defaultSource: Image.propTypes.source,
        useQueryParamsInCacheKey: React.PropTypes.oneOfType([
            React.PropTypes.bool,
            React.PropTypes.array
        ]).isRequired
    },

    getDefaultProps() {
        return {
            renderImage: props => (<Image {...props}/>),
            activityIndicatorProps: {},
            useQueryParamsInCacheKey: false
        };
    },

    getInitialState() {
        this._isMounted = false;
        return {
            isRemote: false,
            cachedImagePath: null,
            jobId: null,
            networkAvailable: true
        };
    },

    safeSetState(newState) {
        if (!this._isMounted) {
            return;
        }
        return this.setState(newState);
    },

    componentWillMount() {
        this._isMounted = true;
        NetInfo.isConnected.addEventListener('change', this.handleConnectivityChange);
        // initial
        NetInfo.isConnected.fetch()
            .then(isConnected => {
                this.safeSetState({
                    networkAvailable: isConnected
                });
            });

        this.processSource(this.props.source);
    },

    componentWillUnmount() {
        this._isMounted = false;
        NetInfo.isConnected.removeEventListener('change', this.handleConnectivityChange);
    },

    componentWillReceiveProps(nextProps) {
        if (this.props.source !== nextProps.source) {
            this.processSource(nextProps.source);
        }
    },

    handleConnectivityChange(isConnected) {
        this.safeSetState({
            networkAvailable: isConnected
        });
    },

    processSource(source) {
        const url = _.get(source, ['uri'], null);
        if (ImageCacheProvider.isCacheable(url)) {
            const options = _.pick(this.props, ['useQueryParamsInCacheKey']);
            // try to get the image path from cache
            ImageCacheProvider.getCachedImagePath(url, options)
                // try to put the image in cache if
                .catch(() => ImageCacheProvider.cacheImage(url, options))
                .then(cachedImagePath => {
                    this.safeSetState({
                        cachedImagePath
                    });
                })
                .catch(err => {
                    console.log('>>> error ', err);
                    this.safeSetState({
                        cachedImagePath: null
                    });
                });
            this.safeSetState({
                isRemote: true
            });
        } else {
            this.safeSetState({
                isRemote: false
            });
        }
    },

    render() {
        if (!this.state.isRemote) {
            return this.renderLocal();
        }
        if (this.state.cachedImagePath) {
            return this.renderCache();
        }
        if (this.props.defaultSource) {
            return this.renderDefaultSource();
        }
        return this.renderLoader();
    },

    renderLocal() {
        const props = _.omit(this.props, ['defaultSource', 'activityIndicatorProps', 'style']);
        const style = this.props.style || styles.image;
        return this.props.renderImage({
            ...props,
            style
        });
    },

    renderCache() {
        const props = _.omit(this.props, ['defaultSource', 'activityIndicatorProps', 'style']);
        const style = this.props.style || styles.image;
        return this.props.renderImage({
            ...props,
            style,
            source: {
                uri: 'file://' + this.state.cachedImagePath
            }
        });
    },

    renderDefaultSource() {
        const {children, defaultSource, ...props} = this.props;
        return (
            <CacheableImage {...props} source={defaultSource}>
                {children}
            </CacheableImage>
        );
    },

    renderLoader() {
        const props = _.omit(this.props.activityIndicatorProps, ['style']);
        const style = [this.props.style, this.props.activityIndicatorProps.style || styles.loader];
        return (
            <ActivityIndicator
                {...props}
                style={style}
            />
        );
    }
});

module.exports = CacheableImage;
