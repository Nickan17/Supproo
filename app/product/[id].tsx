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

        // Step 2: Fetch product info from OpenFoodFacts
        let offProduct: any = null;
        try {
          const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${id}.json`);
          const offData = await offResponse.json();

          if (offData.status !== 1 || !offData.product) {
            throw new Error('Product not found on OpenFoodFacts.');
          }
          offProduct = offData.product;
        } catch (offError: any) {
          console.error('OpenFoodFacts fetch error:', offError);
          setError(offError.message || 'Failed to fetch product from OpenFoodFacts.');
          setLoading(false);
          return;
        }

        const productName = offProduct.product_name || offProduct.product_name_en || 'Unknown Product';
        const productBrand = offProduct.brands || 'Unknown Brand';
        const productImageUrl = offProduct.image_front_url || offProduct.image_url || 'https://via.placeholder.com/150';

        // Step 3: Use OpenRouter AI to predict the most likely product webpage URL
        let productUrl: string | undefined;
        try {
          const openRouterApiKey = Constants.expoConfig?.extra?.OPENROUTER_API_KEY as string;
          if (!openRouterApiKey) {
            throw new Error('OPENROUTER_API_KEY is not set in app.config.ts');
          }

          const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'perplexity/llama-3-sonar-small-32k-online', // Using Perplexity's online model for URL prediction
              messages: [
                { role: 'user', content: `Find the official product website URL for "${productName} by ${productBrand}". Provide only the URL, no other text.` },
              ],
            }),
          });

          const openRouterData = await openRouterResponse.json();
          const predictedUrl = openRouterData.choices[0]?.message?.content?.trim();

          if (predictedUrl && predictedUrl.startsWith('http')) {
            productUrl = predictedUrl;
          } else {
            console.warn('Could not find a valid product URL from OpenRouter AI.');
          }
        } catch (aiUrlError: any) {
          console.error('OpenRouter URL prediction error:', aiUrlError);
          // Continue without a product URL if AI fails
        }

        let scrapedContent = '';
        // Step 4: Scrape the page using Firecrawl API
        if (productUrl) {
          try {
            const firecrawlApiKey = Constants.expoConfig?.extra?.FIRECRAWL_API_KEY as string;
            if (!firecrawlApiKey) {
              throw new Error('FIRECRAWL_API_KEY is not set in app.config.ts');
            }

            const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: productUrl }),
            });

            const firecrawlData = await firecrawlResponse.json();
            scrapedContent = firecrawlData.data?.content || '';
            if (!scrapedContent) {
              console.warn('No content scraped from the product URL.');
            }
          } catch (firecrawlError: any) {
            console.error('Firecrawl API scrape error:', firecrawlError);
            // Continue without scraped content if Firecrawl fails
          }
        }

        // Step 5: Send the scraped data to another OpenRouter AI (Meta LLaMA model) for scoring
        let overallScore = 0;
        let overallSummary = 'No summary available.';
        let highlights: string[] = [];

        try {
          const openRouterApiKey = Constants.expoConfig?.extra?.OPENROUTER_API_KEY as string; // Re-use key
          if (!openRouterApiKey) {
            throw new Error('OPENROUTER_API_KEY is not set in app.config.ts');
          }

          const scoringPrompt = `Given the following product information and scraped content, score the product from 0-100 based on its quality, transparency, and value. Also, provide 2-3 short bullet point highlights summarizing the key aspects of the product.

Product Name: ${productName}
Brand: ${productBrand}
Scraped Content:
${scrapedContent.substring(0, 4000)} // Limit content to avoid token limits

Output format:
SCORE: [0-100]
HIGHLIGHTS:
- Highlight 1
- Highlight 2
- Highlight 3 (optional)
`;

          const scoringResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3-8b-instruct', // Using Meta LLaMA model
              messages: [
                { role: 'user', content: scoringPrompt },
              ],
            }),
          });

          const scoringData = await scoringResponse.json();
          const scoringResult = scoringData.choices[0]?.message?.content?.trim();

          if (scoringResult) {
            const scoreMatch = scoringResult.match(/SCORE:\s*(\d+)/);
            if (scoreMatch) {
              overallScore = parseInt(scoreMatch[1], 10);
            }

            const highlightsMatch = scoringResult.match(/HIGHLIGHTS:\n((?:- .+\n?)+)/);
            if (highlightsMatch) {
              highlights = highlightsMatch[1].split('\n').filter(line => line.startsWith('- ')).map(line => line.substring(2).trim());
              overallSummary = highlights.join('\n');
            }
          }
        } catch (aiScoringError: any) {
          console.error('OpenRouter AI scoring error:', aiScoringError);
          // Use default fallback values if AI scoring fails
        }

        const newProductData: ProductData = {
          upc: id,
          name: productName,
          brand: productBrand,
          imageUrl: productImageUrl,
          overallScore: overallScore,
          overallSummary: overallSummary,
          categories: [], // No detailed categories from AI for now
          productUrl: productUrl,
          highlights: highlights, // Ensure highlights are passed
        };
        setProduct(newProductData);

        // Step 6: Store that result in Supabase
        try {
          const { error: insertError } = await supabase
            .from('products')
            .upsert({
              upc: newProductData.upc,
              name: newProductData.name,
              brand: newProductData.brand,
              image: newProductData.imageUrl,
              score: newProductData.overallScore,
              highlights: newProductData.highlights, // Store highlights as an array
              productUrl: newProductData.productUrl,
            }, { onConflict: 'upc' });

          if (insertError) {
            console.error('Supabase insert/upsert error:', insertError);
            Alert.alert('Error', 'Failed to save product data to Supabase.');
          }
        } catch (supabaseInsertError: any) {
          console.error('Supabase insert/upsert error (outer catch):', supabaseInsertError);
          Alert.alert('Error', 'Failed to save product data to Supabase.');
        }

      } catch (err: any) {
        console.error('Error fetching product data (main catch):', err);
        setError(err.message || 'An unknown error occurred during product data fetching.');
        Alert.alert('Error', err.message || 'An unknown error occurred during product data fetching.');
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
          onPress={() => router.push('/new-comparison?product=' + product.upc)}
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