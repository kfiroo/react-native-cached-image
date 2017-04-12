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

const loading = require('./loading.jpg');

const images = [
    "https://pixabay.com/get/e834b30d2ff11c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/ec35b40e21f51c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/e830b50a28f5013ed95c4518b7494691ea71e5d604b0154894f9c97ca1eebd_640.jpg",
    "https://pixabay.com/get/e832b50f2ff71c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/ed36b60e35fd0723cd0b4005e1454091e06ae3d110b0184990f6c271_640.jpg",
    "https://pixabay.com/get/ec3db40f20f21c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/e034b50a20f11c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/e13cb9082df21c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/eb34b00e2de90825d0471400e64b4f90e474ffd41db810489df5c77aaf_640.jpg",
    "https://pixabay.com/get/eb34b3072af11c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/ea36b60a2bfd1c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/ea3cb70d20fd1c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/e835b30621f01c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/eb37b10a2ce90825d0471400e64b4f90e474ffd41db810489df5c77aaf_640.jpg",
    "https://pixabay.com/get/ed34b20e2ef61c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/ed30b10e2cfd1c2ad65a5854e34c419fe570e1c818b518409cf8c47fa4e5_640.jpg",
    "https://pixabay.com/get/eb34b80a29f4063ed95c4518b7494691ea71e5d604b0154894f9c97ca1eebd_640.jpg",
    "https://pixabay.com/get/e834b80b2bf0023ed95c4518b7494691ea71e5d604b0154894f9c97ca1eebd_640.jpg",
    "https://pixabay.com/get/e836b5092dfd013ed95c4518b7494691ea71e5d604b0154894f9c97ca1eebd_640.jpg",
    "https://pixabay.com/get/eb37b10c2bf5053ed95c4518b7494691ea71e5d604b0154894f9c97ca1eebd_640.jpg"
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

const CachedImageExample = React.createClass({

    getInitialState() {
        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        return {
            showNextImage: false,
            dataSource: ds.cloneWithRows(images)
        };
    },

    clearCache() {
        ImageCacheProvider.clearCache();
    },

    getCacheInfo() {
        ImageCacheProvider.getCacheInfo()
            .then(({size, files}) => {
                ReactNative.Alert.alert('Cache Info', `files: ${files.length}\nsize: ${formatBytes(size)}`);
            });
    },

    renderRow(uri) {
        return (
            <CachedImage
                source={{uri}}
                defaultSource={loading}
                style={styles.image}
            />
        );
    },

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
});

AppRegistry.registerComponent('CachedImageExample', () => CachedImageExample);
