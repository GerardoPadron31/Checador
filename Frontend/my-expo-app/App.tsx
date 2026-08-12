import './global.css';
import { View, Text, Button } from 'react-native';
import { StyleSheet } from 'react-native';

export default function App() {
 return (
  <View style={styles.Container}>
    <Text style={styles.Text}>Bienvenido(@)</Text>
  </View>
);
};


const styles = StyleSheet.create({
  Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },

  Text: {
    fontSize: 45,
  },

  Button: {
    borderRadius: 40,
    height: 50,
  }
});