import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Card from './ui/Card';
import Typography from './ui/Typography';
import Button from './ui/Button';

interface CompareCardProps {
  product1: {
    name: string;
    brand: string;
    imageUrl: string;
    score: number;
  };
  product2: {
    name: string;
    brand: string;
    imageUrl: string;
    score: number;
  };
  onViewDetails: () => void;
}

export default function CompareCard({ product1, product2, onViewDetails }: CompareCardProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

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

  const renderProduct = (product: typeof product1, isWinner: boolean) => (
    <View style={styles.productContainer}>
      <View style={styles.productHeader}>
        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        <View style={[
          styles.scoreContainer, 
          { backgroundColor: getScoreBackgroundColor(product.score) }
        ]}>
          <Typography weight="bold" color={getScoreColor(product.score)}>
            {product.score}
          </Typography>
        </View>
      </View>
      <Typography variant="bodySmall" color={colors.textSecondary} style={styles.brand}>
        {product.brand}
      </Typography>
      <Typography variant="body" weight="semibold" numberOfLines={2} style={styles.name}>
        {product.name}
      </Typography>
      {isWinner && (
        <View style={[styles.winnerBadge, { backgroundColor: colors.goodScoreBg }]}>
          <Typography variant="bodySmall" weight="semibold" color={colors.goodScore}>
            Better Choice
          </Typography>
        </View>
      )}
    </View>
  );

  const isProduct1Winner = product1.score > product2.score;

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.container}>
        {renderProduct(product1, isProduct1Winner)}
        <View style={styles.vsContainer}>
          <Typography variant="h3" weight="bold" color={colors.textSecondary}>
            VS
          </Typography>
        </View>
        {renderProduct(product2, !isProduct1Winner)}
      </View>
      <Button 
        title="View Comparison Details" 
        variant="secondary"
        fullWidth
        onPress={onViewDetails}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productContainer: {
    flex: 1,
    padding: 8,
    position: 'relative',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  scoreContainer: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  brand: {
    marginBottom: 2,
  },
  name: {
    height: 44,
  },
  vsContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerBadge: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  button: {
    marginTop: 8,
  },
});