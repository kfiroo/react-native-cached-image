'use strict';

const _ = require('lodash');
const React = require('react');
const ReactNative = require('react-native');

const PropTypes = require('prop-types');

const ImageCacheManagerOptionsPropTypes = require('./ImageCacheManagerOptionsPropTypes');

const ImageCacheManager = require('./ImageCacheManager');
const ImageCachePreloader = require('./ImageCachePreloader');

class ImageCacheProvider extends React.Component {
    static propTypes = {
        // only a single child so we can render it without adding a View
        children: PropTypes.element,

        // ImageCacheManager options
        ...ImageCacheManagerOptionsPropTypes,

        // Preload urls
        urlsToPreload: PropTypes.arrayOf(PropTypes.string).isRequired,
        numberOfConcurrentPreloads: PropTypes.number.isRequired,

        onPreloadComplete: PropTypes.func.isRequired,
    };

    static defaultProps = {
        urlsToPreload: [],
        numberOfConcurrentPreloads: 0,
        onPreloadComplete: _.noop,
    };

    static childContextTypes = {
        getImageCacheManager: PropTypes.func,
    };

    constructor(props) {
        super(props);

        this.getImageCacheManagerOptions = this.getImageCacheManagerOptions.bind(this);
        this.getImageCacheManager = this.getImageCacheManager.bind(this);
        this.preloadImages = this.preloadImages.bind(this);

    }

    getChildContext() {
        const self = this;
        return {
            getImageCacheManager() {
                return self.getImageCacheManager();
            }
        };
    }

    componentWillMount() {
        this.preloadImages(this.props.urlsToPreload);
    }

    componentWillReceiveProps(nextProps) {
        // reset imageCacheManager in case any option changed
        this.imageCacheManager = null;
        // preload new images if needed
        if (this.props.urlsToPreload !== nextProps.urlsToPreload) {
            this.preloadImages(nextProps.urlsToPreload);
        }
    }

    getImageCacheManagerOptions() {
        return _.pick(this.props, _.keys(ImageCacheManagerOptionsPropTypes));
    }

    getImageCacheManager() {
        if (!this.imageCacheManager) {
            const options = this.getImageCacheManagerOptions();
            this.imageCacheManager = ImageCacheManager(options);
        }
        return this.imageCacheManager;
    }

    preloadImages(urlsToPreload) {
        const imageCacheManager = this.getImageCacheManager();
        ImageCachePreloader.preloadImages(urlsToPreload, imageCacheManager, this.props.numberOfConcurrentPreloads)
            .then(() => this.props.onPreloadComplete());
    }

    render() {
        return React.Children.only(this.props.children);
    }

}

module.exports = ImageCacheProvider;
