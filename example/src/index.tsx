import React from 'react';
import {View, ScrollView, Button, ListView, Alert} from 'react-native';

import _ from 'lodash';

import {
  CachedImage,
  ImageCacheProvider,
  ImageCacheManager,
} from 'react-native-cached-image';
import styles from './styles';

const LOADING_IMG = require('./assets/loading.jpg');

const image1 =
  'https://wallpaperbrowse.com/media/images/bcf39e88-5731-43bb-9d4b-e5b3b2b1fdf2.jpg';
const image2 =
  'https://d22cb02g3nv58u.cloudfront.net/0.676.0/assets/images/icons/fun-types/full/baby-shower-full.jpg';

const images = [
  'https://d22cb02g3nv58u.cloudfront.net/0.676.0/assets/images/icons/fun-types/full/after-work-drinks-full.jpg',
  'https://i.ytimg.com/vi/b6m-XlOxjbk/hqdefault.jpg',
  'https://d22cb02g3nv58u.cloudfront.net/0.676.0/assets/images/icons/fun-types/full/wrong-image.jpg',
  'https://d22cb02g3nv58u.cloudfront.net/0.676.0/assets/images/icons/fun-types/full/bar-crawl-full.jpg',
  'https://d22cb02g3nv58u.cloudfront.net/0.676.0/assets/images/icons/fun-types/full/cheeseburger-full.jpg',
  'https://d22cb02g3nv58u.cloudfront.net/0.676.0/assets/images/icons/fun-types/full/friendsgiving-full.jpg',
  'https://d22cb02g3nv58u.cloudfront.net/0.676.0/assets/images/icons/fun-types/full/dogs-play-date-full.jpg',
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

const defaultImageCacheManager = ImageCacheManager();

class CachedImageExample extends React.Component {
  constructor(props) {
    super(props);

    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      showNextImage: false,
      dataSource: ds.cloneWithRows(images),
    };

    this.cacheImages = this.cacheImages.bind(this);
  }

  componentWillMount() {
    defaultImageCacheManager.downloadAndCacheUrl(image1);
  }

  clearCache() {
    defaultImageCacheManager.clearCache().then(() => {
      Alert.alert('Cache cleared');
    });
  }

  getCacheInfo() {
    defaultImageCacheManager.getCacheInfo().then(({size, files}) => {
      // console.log(size, files);
      Alert.alert(
        'Cache Info',
        `files: ${files.length}\nsize: ${formatBytes(size)}`,
      );
    });
  }

  cacheImages() {
    this.setState(
      {
        dataSource: this.state.dataSource.cloneWithRows([]),
      },
      () => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(images),
        });
      },
    );
  }

  renderRow(uri) {
    return (
      <CachedImage
        source={{uri}}
        defaultSource={LOADING_IMG}
        style={styles.image}
      />
    );
  }

  render() {
    return (
      <ScrollView style={styles.container}>
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
          <Button
            onPress={this.cacheImages}
            title="Cache Images"
            color="#826fe5"
          />
        </View>
        <View>
          <CachedImage source={{uri: image1}} style={styles.image} />
          <CachedImage source={{uri: image2}} style={styles.image} />
        </View>
        <ImageCacheProvider
          urlsToPreload={images}
          onPreloadComplete={() => Alert.alert('onPreloadComplete')}
          ttl={60}
          numberOfConcurrentPreloads={0}>
          <ListView
            dataSource={this.state.dataSource}
            renderRow={this.renderRow}
            enableEmptySections={true}
          />
        </ImageCacheProvider>
      </ScrollView>
    );
  }
}

export default CachedImageExample;
