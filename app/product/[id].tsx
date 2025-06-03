import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, ActivityIndicator, Alert, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import ScoreCard from '@/components/ScoreCard';
import CategoryScoreCard from '@/components/CategoryScoreCard';
import { ArrowLeft, Bookmark, Share2, ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

interface CategoryScore {
  name: string;
  score: number;
  insights: string[];
}

interface ProductData {
  upc: string;
  name: string;
  brand: string;
  imageUrl: string;
  overallScore: number;
  overallSummary: string;
  categories: CategoryScore[];
  productUrl?: string;
  highlights: string[]; // Add highlights to the interface
}

export default function ProductScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) {
        setError('Product ID (UPC) is missing.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Step 1: Check Supabase for existing results
        const { data: existingProduct, error: supabaseError } = await supabase
          .from('products')
          .select('*')
          .eq('upc', id)
          .single();

        if (existingProduct) {
          setProduct({
            upc: existingProduct.upc,
            name: existingProduct.name,
            brand: existingProduct.brand || 'N/A',
            imageUrl: existingProduct.image || 'https://via.placeholder.com/150',
            overallScore: existingProduct.score,
            overallSummary: existingProduct.highlights.join('\n'),
            categories: [], // Supabase doesn't store categories in this schema
            productUrl: existingProduct.productUrl,
            highlights: existingProduct.highlights, // Ensure highlights are passed
          });
          setIsBookmarked(true); // Assume bookmarked if in Supabase
          setLoading(false);
          return;
        }

        if (supabaseError && supabaseError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Supabase fetch error:', supabaseError);
          // Continue without blocking if Supabase has an error
        }

        // Step 2: Call Supabase Edge Function to process product data
        const supabaseEdgeFunctionUrl = `${Constants.expoConfig?.extra?.supabaseUrl}/functions/v1/process-product`;

        try {
          const edgeFunctionResponse = await fetch(supabaseEdgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productIdentifier: id,
              productUrl: "https://www.transparentlabs.com/products/creatine-hcl",
            }),
          });

          if (!edgeFunctionResponse.ok) {
            const errorData = await edgeFunctionResponse.json();
            throw new Error(`Edge Function error: ${edgeFunctionResponse.status} - ${errorData.error || 'Unknown error'}`);
          }

          const processedProductData = await edgeFunctionResponse.json();

          setProduct({
            upc: processedProductData.upc,
            name: processedProductData.name,
            brand: processedProductData.brand,
            imageUrl: processedProductData.imageUrl,
            overallScore: processedProductData.overallScore,
            overallSummary: processedProductData.overallSummary,
            categories: processedProductData.categories || [],
            productUrl: processedProductData.productUrl,
            highlights: processedProductData.highlights || [],
          });


        } catch (edgeFunctionError: any) {
          console.error('Edge Function call error:', edgeFunctionError);
          setError(edgeFunctionError.message || 'Failed to process product data via Edge Function.');
        }

      } catch (err: any) {
        console.error('Error fetching product data (main catch):', err);
        setError(err.message || 'An unknown error occurred during product data fetching.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement actual bookmarking logic with Supabase
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typography variant="body" style={{ marginTop: 16 }} color={colors.text}>
          Loading product details...
        </Typography>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Typography variant="h3" color={colors.red[500]}>Error</Typography>
        <Typography variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
          {error}
        </Typography>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Typography variant="h3" color={colors.text}>Product Not Found</Typography>
        <Typography variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
          No data available for this product.
        </Typography>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => {}}
            >
              <Share2 size={20} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={toggleBookmark}
            >
              <Bookmark
                size={20}
                color={isBookmarked ? colors.primary : colors.text}
                fill={isBookmarked ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.productHeader}>
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          
          <View style={styles.productInfo}>
            <Typography variant="bodySmall" color={colors.textSecondary} style={styles.brand}>
              {product.brand}
            </Typography>
            
            <Typography variant="h3" weight="semibold" style={styles.productName}>
              {product.name}
            </Typography>
          </View>
        </View>
        
        <ScoreCard
          score={product.overallScore}
          title="Overall Assessment"
          description={product.overallSummary}
        />
        
        <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
          Detailed Analysis
        </Typography>
        
        {product.categories.map((category, index) => (
          <CategoryScoreCard
            key={index}
            category={category.name}
            score={category.score}
            insights={category.insights}
          />
        ))}
        
        <Button
          title="View on Manufacturer Website"
          variant="outline"
          fullWidth
          icon={<ExternalLink size={18} color={colors.primary} />}
          style={styles.websiteButton}
          onPress={() => product.productUrl && Linking.openURL(product.productUrl)}
          disabled={!product.productUrl}
        />
        
        <Button
          title="Compare With Similar Products"
          variant="secondary"
          fullWidth
          style={styles.compareButton}
          onPress={() => router.push({ pathname: '/new-comparison', params: { product: product.upc } })}
        />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  brand: {
    marginBottom: 4,
  },
  productName: {
    lineHeight: 28,
  },
  sectionTitle: {
    marginBottom: 16,
    marginTop: 8,
  },
  websiteButton: {
    marginTop: 24,
    marginBottom: 12,
  },
  compareButton: {
    marginBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});