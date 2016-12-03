'use strict';

const React = require('react');
const ReactNative = require('react-native');

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

const image1 = 'http://shushi168.com/data/out/123/36699123-images.png';
// const image1 = 'https://d22cb02g3nv58u.cloudfront.net/0.607.0/assets/images/icons/fun-types/full/band-night-full.jpg';
const image2 = 'https://d22cb02g3nv58u.cloudfront.net/0.607.0/assets/images/icons/fun-types/full/bar-crawl-full.jpg';

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
                <CachedImage
                    source={{
                        uri: image1
                    }}
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
