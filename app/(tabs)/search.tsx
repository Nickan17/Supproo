import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Typography from '@/components/ui/Typography';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import Constants from 'expo-constants';

// Mock data for demo purposes
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Ultra Strength Omega-3 Fish Oil Supplement',
    brand: 'NaturePlus',
    imageUrl: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg',
    score: 85,
  },
  {
    id: '2',
    name: 'Complete Multivitamin Daily Formula',
    brand: 'VitaCore',
    imageUrl: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg',
    score: 73,
  },
  {
    id: '3',
    name: 'Vitamin D3 5000 IU Immune Support',
    brand: 'PureNutrients',
    imageUrl: 'https://images.pexels.com/photos/6692132/pexels-photo-6692132.jpeg',
    score: 92,
  },
  {
    id: '4',
    name: 'Magnesium Glycinate Complex',
    brand: 'OptimumHealth',
    imageUrl: 'https://images.pexels.com/photos/5856020/pexels-photo-5856020.jpeg',
    score: 45,
  },
  {
    id: '5',
    name: 'Probiotic 50 Billion CFU Formula',
    brand: 'GutBalance',
    imageUrl: 'https://images.pexels.com/photos/5699514/pexels-photo-5699514.jpeg',
    score: 67,
  },
];

export default function SearchScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const params = useLocalSearchParams<{ q: string }>();
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [bookmarkedProducts, setBookmarkedProducts] = useState<string[]>([]);

  const filteredProducts = MOCK_PRODUCTS.filter(product => 
    searchQuery === '' || 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBookmark = (productId: string) => {
    if (bookmarkedProducts.includes(productId)) {
      setBookmarkedProducts(bookmarkedProducts.filter(id => id !== productId));
    } else {
      setBookmarkedProducts([...bookmarkedProducts, productId]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="h2" weight="bold" style={styles.title}>
            Search
          </Typography>
          <Typography 
            variant="body" 
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Find supplements by name or brand
          </Typography>
        </View>
        
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
        
        <View style={styles.resultsContainer}>
          {searchQuery.length > 0 && (
            <Typography 
              variant="bodySmall"
              style={[styles.resultsCount, { color: colors.textSecondary }]}
            >
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} found
            </Typography>
          )}
          
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              brand={product.brand}
              imageUrl={product.imageUrl}
              score={product.score}
              isBookmarked={bookmarkedProducts.includes(product.id)}
              onPress={() => router.push(`/product/${product.id}`)}
              onBookmark={() => toggleBookmark(product.id)}
            />
          ))}
          
          {filteredProducts.length === 0 && searchQuery.length > 0 && (
            <View style={styles.noResults}>
              <Typography variant="body" weight="medium">
                No supplements found matching "{searchQuery}"
              </Typography>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.noResultsHint}>
                Try searching for a different name or brand
              </Typography>
            </View>
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
  resultsContainer: {
    marginTop: 8,
  },
  resultsCount: {
    marginBottom: 16,
  },
  noResults: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsHint: {
    marginTop: 8,
  },
});