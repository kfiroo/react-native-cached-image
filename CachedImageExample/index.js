'use strict';

const React = require('react');
const ReactNative = require('react-native');

const _ = require('lodash');

const {
    View,
    Button,
    Dimensions,
    StyleSheet,
    AppRegistry
} = ReactNative;

const CachedImage = require('react-native-cached-image');
const {
    ImageCacheProvider
} = CachedImage;

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

const localImage1 = require('./loading.jpg');

const image1 = 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Big_Bog_State_Recreation_Area.jpg';
const image2 = 'https://s-media-cache-ak0.pinimg.com/originals/62/a7/6f/62a76fde4009c4e3047b4b5e17899a8d.jpg';

function formatBytes(bytes,decimals) {
    if(bytes === 0) {
        return '0 B';
    }
    const k = 1000;
    const dm = decimals + 1 || 3;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const CachedImageExample = React.createClass({

    getInitialState() {
        return {
            showNextImage: false
        };
    },

    componentWillMount() {
        ImageCacheProvider.cacheMultipleImages([
            image1,
            image2
        ]);
    },

    loadMore() {
        this.setState({
            showNextImage: true
        });
    },

    clearCache() {
        ImageCacheProvider.clearCache();
    },

    getCacheInfo() {
        ImageCacheProvider.getCacheInfo()
            .then(({size}) => {
                ReactNative.Alert.alert('Cache Info', `size: ${formatBytes(size)}`);
            });
    },

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.buttons}>
                    <Button
                        onPress={this.loadMore}
                        title="Load Next Image"
                        color="#b348ff"
                    />
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
                <CachedImage
                    source={{
                        uri: image1
                    }}
                    defaultSource={localImage1}
                    style={styles.image}
                />
                {
                    this.state.showNextImage && (
                        <CachedImage
                            source={{
                                uri: image2
                            }}
                            style={styles.image}
                        />
                    )
                }
            </View>
        );
    }
});

AppRegistry.registerComponent('CachedImageExample', () => CachedImageExample);
