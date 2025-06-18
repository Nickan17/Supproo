import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function NewComparisonScreen() {
  const { product } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Comparison Screen</Text>
      {product && <Text>Product UPC: {product}</Text>}
      <Text>This is a placeholder for the new comparison feature.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});