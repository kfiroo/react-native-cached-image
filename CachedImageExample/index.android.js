'use strict';

const React = require('react');
const ReactNative = require('react-native');

const {
    Button,
    StyleSheet,
    ScrollView,
    AppRegistry
} = ReactNative;

const CachedImage = require('react-native-cached-image');
const {
    ImageCacheProvider
} = CachedImage;

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    buttons: {
        flexDirection: 'row'
    },
    button: {
        flex: 1
    }
});

const image1 = 'http://shushi168.com/data/out/123/36699123-images.png';
const image2 = 'http://www.planwallpaper.com/static/images/images-7_kACPBns.jpg';

const CachedImageExample = React.createClass({

    getInitialState() {
        return {
            images: [
                image1
            ]
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
            loadMore: true
        })
    },

    clearCache() {
        ImageCacheProvider.deleteMultipleCachedImages([
            image1,
            image2
        ]);
    },

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.buttons}>
                    <Button
                        onPress={this.loadMore}
                        title="Load Next Image"
                        color="#841584"
                        style={styles.button}
                    />
                    <Button
                        onPress={this.clearCache}
                        title="Clear Cache"
                        color="#0C42FD"
                        style={styles.button}
                    />
                </View>
                <ScrollView style={styles.container}>
                    {this.state.images.map(uri => (
                        <CachedImage
                            source={{uri}}
                            style={styles.image}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    }
});

AppRegistry.registerComponent('CachedImageExample', () => CachedImageExample);
