import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Card from './ui/Card';
import Typography from './ui/Typography';
import { Bookmark } from 'lucide-react-native';

interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  score: number;
  isBookmarked?: boolean;
  onPress: () => void;
  onBookmark?: () => void;
}

export default function ProductCard({
  id,
  name,
  brand,
  imageUrl,
  score,
  isBookmarked = false,
  onPress,
  onBookmark,
}: ProductCardProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const screenWidth = Dimensions.get('window').width;
  
  // For smaller screens, we use a more compact layout
  const isSmallScreen = screenWidth < 375;

  const getScoreColor = () => {
    if (score >= 80) return colors.goodScore;
    if (score >= 50) return colors.mediumScore;
    return colors.badScore;
  };

  const getScoreBackgroundColor = () => {
    if (score >= 80) return colors.goodScoreBg;
    if (score >= 50) return colors.mediumScoreBg;
    return colors.badScoreBg;
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.container}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          <View style={styles.content}>
            <View>
              <Typography variant="bodySmall" color={colors.textSecondary} style={styles.brand}>
                {brand}
              </Typography>
              <Typography 
                variant={isSmallScreen ? "bodySmall" : "body"} 
                weight="semibold" 
                numberOfLines={2}
                style={styles.name}
              >
                {name}
              </Typography>
            </View>
            <View style={styles.footer}>
              <View style={[styles.scoreContainer, { backgroundColor: getScoreBackgroundColor() }]}>
                <Typography weight="bold" color={getScoreColor()}>
                  {score}
                </Typography>
              </View>
              {onBookmark && (
                <TouchableOpacity style={styles.bookmarkButton} onPress={onBookmark}>
                  <Bookmark
                    size={20}
                    color={isBookmarked ? colors.primary : colors.textSecondary}
                    fill={isBookmarked ? colors.primary : 'transparent'}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 12,
  },
  container: {
    flexDirection: 'row',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brand: {
    marginBottom: 2,
  },
  name: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButton: {
    padding: 4,
  },
});