import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Typography from '@/components/ui/Typography';
import Card from '@/components/ui/Card';
import { ArrowLeft, Share2, Badge } from 'lucide-react-native';

// Mock comparison data for demo
const COMPARISON = {
  id: '1',
  product1: {
    name: 'Ultra Strength Omega-3 Fish Oil Supplement',
    brand: 'NaturePlus',
    imageUrl: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg',
    score: 85,
    price: '$29.99',
    servingSize: '1 softgel',
    servingsPerContainer: 90,
    dosage: {
      name: 'Total Omega-3 Fatty Acids',
      amount: '1200 mg',
      score: 95,
    },
    ingredients: {
      details: 'Wild-caught fish oil, gelatin, glycerin, natural lemon flavor',
      score: 90,
    },
    transparency: {
      details: 'Third-party tested, IFOS certified, sourcing disclosed',
      score: 85,
    },
    value: {
      details: '$0.33 per serving',
      score: 70,
    },
  },
  product2: {
    name: 'Pure Omega-3 Wild Caught Fish Oil',
    brand: 'OceanHealth',
    imageUrl: 'https://images.pexels.com/photos/6692103/pexels-photo-6692103.jpeg',
    score: 92,
    price: '$34.99',
    servingSize: '1 softgel',
    servingsPerContainer: 120,
    dosage: {
      name: 'Total Omega-3 Fatty Acids',
      amount: '1500 mg',
      score: 98,
    },
    ingredients: {
      details: 'Wild-caught Alaskan fish oil, bovine gelatin, glycerin, natural orange flavor',
      score: 95,
    },
    transparency: {
      details: 'Third-party tested, IFOS 5-star certified, sustainability certifications',
      score: 90,
    },
    value: {
      details: '$0.29 per serving',
      score: 85,
    },
  },
};

export default function ComparisonScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();

  const comparison = COMPARISON; // In a real app, we'd fetch the comparison by ID

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.goodScore;
    if (score >= 50) return colors.mediumScore;
    return colors.badScore;
  };

  const getScoreBackgroundColor = (score: number) => {
    if (score >= 80) return colors.goodScoreBg;
    if (score >= 50) return colors.mediumScoreBg;
    return colors.badScoreBg;
  };

  const renderComparisonSection = (
    title: string,
    property1: { details: string; score: number },
    property2: { details: string; score: number }
  ) => (
    <Card variant="outlined" style={styles.comparisonSection}>
      <Typography variant="h4" weight="semibold" style={styles.sectionTitle}>
        {title}
      </Typography>
      
      <View style={styles.comparisonRow}>
        <View style={[styles.comparisonItem, styles.leftItem]}>
          <Typography variant="bodySmall" style={styles.itemDetails}>
            {property1.details}
          </Typography>
          <View 
            style={[
              styles.scoreChip, 
              { backgroundColor: getScoreBackgroundColor(property1.score) }
            ]}
          >
            <Typography 
              variant="caption" 
              weight="bold" 
              color={getScoreColor(property1.score)}
            >
              {property1.score}
            </Typography>
          </View>
        </View>
        
        <View style={styles.vsContainer}>
          <Typography variant="bodySmall" weight="bold" color={colors.textSecondary}>
            VS
          </Typography>
        </View>
        
        <View style={[styles.comparisonItem, styles.rightItem]}>
          <Typography variant="bodySmall" style={styles.itemDetails}>
            {property2.details}
          </Typography>
          <View 
            style={[
              styles.scoreChip, 
              { backgroundColor: getScoreBackgroundColor(property2.score) }
            ]}
          >
            <Typography 
              variant="caption" 
              weight="bold" 
              color={getScoreColor(property2.score)}
            >
              {property2.score}
            </Typography>
          </View>
        </View>
      </View>
      
      <View style={styles.winnerContainer}>
        <View style={[
          styles.winnerBadge,
          { backgroundColor: colors.goodScoreBg }
        ]}>
          <Badge size={14} color={colors.goodScore} />
          <Typography 
            variant="bodySmall" 
            weight="semibold" 
            color={colors.goodScore}
          >
            {property1.score > property2.score ? comparison.product1.brand : comparison.product2.brand} wins for {title.toLowerCase()}
          </Typography>
        </View>
      </View>
    </Card>
  );

  const renderHeader = (product: typeof comparison.product1) => (
    <View style={styles.productHeader}>
      <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      
      <View style={styles.productHeaderContent}>
        <Typography variant="bodySmall" color={colors.textSecondary}>
          {product.brand}
        </Typography>
        
        <Typography variant="body" weight="semibold" numberOfLines={2}>
          {product.name}
        </Typography>
        
        <View style={[
          styles.scoreContainer, 
          { backgroundColor: getScoreBackgroundColor(product.score) }
        ]}>
          <Typography weight="bold" color={getScoreColor(product.score)}>
            {product.score}
          </Typography>
        </View>
      </View>
    </View>
  );

  const renderBasicInfo = (product: typeof comparison.product1) => (
    <View style={styles.basicInfo}>
      <View style={styles.infoRow}>
        <Typography 
          variant="bodySmall" 
          color={colors.textSecondary} 
          style={styles.infoLabel}
        >
          Price:
        </Typography>
        <Typography variant="bodySmall" weight="medium">
          {product.price}
        </Typography>
      </View>
      
      <View style={styles.infoRow}>
        <Typography 
          variant="bodySmall" 
          color={colors.textSecondary} 
          style={styles.infoLabel}
        >
          Serving Size:
        </Typography>
        <Typography variant="bodySmall" weight="medium">
          {product.servingSize}
        </Typography>
      </View>
      
      <View style={styles.infoRow}>
        <Typography 
          variant="bodySmall" 
          color={colors.textSecondary} 
          style={styles.infoLabel}
        >
          Servings:
        </Typography>
        <Typography variant="bodySmall" weight="medium">
          {product.servingsPerContainer}
        </Typography>
      </View>
    </View>
  );

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
          
          <Typography variant="h3" weight="semibold" style={styles.headerTitle}>
            Comparison
          </Typography>
          
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => {}}
          >
            <Share2 size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <Card variant="elevated" style={styles.productsCard}>
          <View style={styles.productsContainer}>
            <View style={styles.productContainer}>
              {renderHeader(comparison.product1)}
              {renderBasicInfo(comparison.product1)}
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.productContainer}>
              {renderHeader(comparison.product2)}
              {renderBasicInfo(comparison.product2)}
            </View>
          </View>
          
          <View style={styles.overallWinner}>
            <Typography variant="body" weight="semibold" style={styles.winnerTitle}>
              Overall Winner
            </Typography>
            <Typography variant="h3" weight="bold" color={colors.primary}>
              {comparison.product1.score > comparison.product2.score 
                ? comparison.product1.brand 
                : comparison.product2.brand}
            </Typography>
            <Typography 
              variant="bodySmall" 
              style={[styles.winnerExplanation, { color: colors.textSecondary }]}
            >
              {comparison.product1.score > comparison.product2.score 
                ? `${comparison.product1.brand} scores higher in overall quality and value.` 
                : `${comparison.product2.brand} offers better quality and potency for the price.`}
            </Typography>
          </View>
        </Card>
        
        <Typography variant="h3" weight="semibold" style={styles.categoryTitle}>
          Detailed Comparison
        </Typography>
        
        {renderComparisonSection(
          'Dosage', 
          comparison.product1.dosage, 
          comparison.product2.dosage
        )}
        
        {renderComparisonSection(
          'Ingredients', 
          comparison.product1.ingredients, 
          comparison.product2.ingredients
        )}
        
        {renderComparisonSection(
          'Transparency', 
          comparison.product1.transparency, 
          comparison.product2.transparency
        )}
        
        {renderComparisonSection(
          'Value', 
          comparison.product1.value, 
          comparison.product2.value
        )}
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productsCard: {
    marginBottom: 24,
  },
  productsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  productContainer: {
    flex: 1,
    padding: 8,
  },
  divider: {
    width: 1,
    backgroundColor: '#E4E4E7',
  },
  productHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  productHeaderContent: {
    alignItems: 'center',
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  basicInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    flex: 1,
  },
  overallWinner: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
  },
  winnerTitle: {
    marginBottom: 8,
  },
  winnerExplanation: {
    textAlign: 'center',
    marginTop: 4,
  },
  categoryTitle: {
    marginBottom: 16,
  },
  comparisonSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  comparisonItem: {
    flex: 1,
    padding: 8,
  },
  leftItem: {
    alignItems: 'flex-end',
  },
  rightItem: {
    alignItems: 'flex-start',
  },
  vsContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  itemDetails: {
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  winnerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
});