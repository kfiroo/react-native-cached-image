'use strict';

const _ = require('lodash');
const React = require('react');
const ReactNative = require('react-native');

const PropTypes = require('prop-types');

const ImageCacheManagerOptionsPropTypes = require('./ImageCacheManagerOptionsPropTypes');

const ImageCacheManager = require('./ImageCacheManager');
const ImageCachePreloader = require('./ImageCachePreloader');

const ImageCacheProvider = React.createClass({
    propTypes: {
        // only a single child so we can render it
        children: PropTypes.element.isRequired,

        // ImageCacheManager options
        ...ImageCacheManagerOptionsPropTypes,

        // Preload urls
        urlsToPreload: PropTypes.arrayOf(PropTypes.string).isRequired,
        numberOfConcurrentPreloads: PropTypes.number.isRequired,

        onPreloadComplete: PropTypes.func.isRequired,
    },

    childContextTypes: {
        getImageCacheManager: PropTypes.func,
    },

    getImageCacheManagerOptions() {
        return _.pick(this.props, _.keys(ImageCacheManagerOptionsPropTypes));
    },

    getImageCacheManager() {
        if (!this.imageCacheManager) {
            const options = this.getImageCacheManagerOptions();
            this.imageCacheManager = ImageCacheManager(options);
        }
        return this.imageCacheManager;
    },

    getChildContext() {
        const self = this;
        return {
            getImageCacheManager() {
                return self.getImageCacheManager();
            }
        };
    },

    getDefaultProps() {
        return {
            urlsToPreload: [],
            numberOfConcurrentPreloads: 0,
            onPreloadComplete: _.noop,
        };
    },

    componentWillMount() {
        this.preloadImages();
    },

    componentWillReceiveProps(nextProps) {
        // reset imageCacheManager in case any option changed
        this.imageCacheManager = null;
        // preload new images if needed
        if (this.props.urlsToPreload !== nextProps.urlsToPreload) {
            this.preloadImages();
        }
    },

    preloadImages() {
        const imageCacheManager = this.getImageCacheManager();
        ImageCachePreloader.preloadImages(this.props.urlsToPreload, imageCacheManager, this.props.numberOfConcurrentPreloads)
            .then(() => this.props.onPreloadComplete());
    },

    render() {
        return React.Children.only(this.props.children);
    },
});

module.exports = ImageCacheProvider;
