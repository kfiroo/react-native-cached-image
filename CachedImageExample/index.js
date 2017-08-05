'use strict';

const React = require('react');
const ReactNative = require('react-native');

const _ = require('lodash');

const {
    View,
    Button,
    Dimensions,
    StyleSheet,
    AppRegistry,
    ListView
} = ReactNative;

const CachedImageBase = require('react-native-cached-image');
const {
    ImageCacheProvider
} = CachedImageBase;

const cachedImageOptions = {
    cacheLocation: ImageCacheProvider.LOCATION.BUNDLE
};

function CachedImage(props) {
    return (
        <CachedImageBase {...props} {...cachedImageOptions} />
    );
}

const {
    width
} = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 20
    },
    buttons: {
        flexDirection: 'row'
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: {
        width,
        height: 300
    }
});

const loading = require('./loading.jpg');

const images = [
    'https://wallpaperbrowse.com/media/images/bcf39e88-5731-43bb-9d4b-e5b3b2b1fdf2.jpg',
    'https://d22cb02g3nv58u.cloudfront.net/0.671.0/assets/images/icons/fun-types/full/wrong-image.jpg',
    'https://d22cb02g3nv58u.cloudfront.net/0.671.0/assets/images/icons/fun-types/full/bar-crawl-full.jpg',
    'https://d22cb02g3nv58u.cloudfront.net/0.671.0/assets/images/icons/fun-types/full/cheeseburger-full.jpg',
    'https://d22cb02g3nv58u.cloudfront.net/0.671.0/assets/images/icons/fun-types/full/friendsgiving-full.jpg',
    'https://d22cb02g3nv58u.cloudfront.net/0.671.0/assets/images/icons/fun-types/full/dogs-play-date-full.jpg'
];

function formatBytes(bytes, decimals) {
    if (bytes === 0) {
        return '0 B';
    }
    const k = 1000;
    const dm = decimals + 1 || 3;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

class CachedImageExample extends React.Component {
    constructor(props) {
        super(props);

        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            showNextImage: false,
            dataSource: ds.cloneWithRows(images)
        };
    }

    componentWillMount() {
        ImageCacheProvider.cacheMultipleImages(images, cachedImageOptions)
            .then(() => {
                console.log('cacheMultipleImages Done');
            })
            .catch(err => {
                console.log('cacheMultipleImages caught an error: ', err);
            });
    }

    clearCache() {
        ImageCacheProvider.clearCache(cachedImageOptions);
    }

    getCacheInfo() {
        ImageCacheProvider.getCacheInfo(cachedImageOptions)
            .then(({size, files}) => {
                // console.log(size, files);
                ReactNative.Alert.alert('Cache Info', `files: ${files.length}\nsize: ${formatBytes(size)}`);
            });
    }

    renderRow(uri) {
        return (
            <CachedImage
                source={{uri}}
                defaultSource={loading}
                style={styles.image}
            />
        );
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.buttons}>
                    <Button
                        onPress={this.clearCache}
                        title="Clear Cache"
                        color="#6f97e5"
                    />
                    <Button
                        onPress={this.getCacheInfo}
                        title="Cache Info"
                        color="#2ce7cc"
                    />
                </View>
                <ListView
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow}
                />
            </View>
        );
    }
}

AppRegistry.registerComponent('CachedImageExample', () => CachedImageExample);
