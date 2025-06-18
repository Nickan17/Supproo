import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Typography from './ui/Typography';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';

export default function ScanPlaceholder() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.pexels.com/photos/4065891/pexels-photo-4065891.jpeg' }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Typography variant="h3" weight="semibold" style={styles.title}>
          No scans yet
        </Typography>
        <Typography 
          variant="body" 
          style={[styles.description, { color: colors.textSecondary }]}
        >
          Scan a supplement barcode or search for a product to see its health score and detailed analysis.
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 24,
    opacity: 0.9,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    maxWidth: 300,
  },
});