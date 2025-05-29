import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Typography from '@/components/ui/Typography';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import ScanPlaceholder from '@/components/ScanPlaceholder';
import Constants from 'expo-constants';

// Mock data for demo purposes
const MOCK_SAVED_PRODUCTS = [
  {
    id: '1',
    name: 'Ultra Strength Omega-3 Fish Oil Supplement',
    brand: 'NaturePlus',
    imageUrl: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg',
    score: 85,
    date: '2 days ago',
  },
  {
    id: '3',
    name: 'Vitamin D3 5000 IU Immune Support',
    brand: 'PureNutrients',
    imageUrl: 'https://images.pexels.com/photos/6692132/pexels-photo-6692132.jpeg',
    score: 92,
    date: '1 week ago',
  },
];

export default function SavedScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [searchQuery, setSearchQuery] = useState('');
  const [savedProducts, setSavedProducts] = useState(MOCK_SAVED_PRODUCTS);

  const filteredProducts = savedProducts.filter(product => 
    searchQuery === '' || 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBookmark = (productId: string) => {
    setSavedProducts(savedProducts.filter(product => product.id !== productId));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="h2" weight="bold" style={styles.title}>
            Saved
          </Typography>
          <Typography 
            variant="body" 
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Your saved supplements
          </Typography>
        </View>
        
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search your saved supplements..."
        />
        
        <View style={styles.savedContainer}>
          {filteredProducts.length > 0 ? (
            <>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  imageUrl={product.imageUrl}
                  score={product.score}
                  isBookmarked={true}
                  onPress={() => router.push(`/product/${product.id}`)}
                  onBookmark={() => toggleBookmark(product.id)}
                />
              ))}
            </>
          ) : (
            <ScanPlaceholder />
          )}
        </View>
      </ScrollView>
      
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16 + Constants.statusBarHeight,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 8,
  },
  savedContainer: {
    marginTop: 8,
  },
});