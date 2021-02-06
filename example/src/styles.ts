import {Dimensions, StyleSheet} from 'react-native';
const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width,
    height: 300,
  },
});
export default styles;
