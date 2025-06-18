import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Card from './ui/Card';
import Typography from './ui/Typography';

interface CategoryScoreCardProps {
  category: string;
  score: number;
  insights: string[];
}

export default function CategoryScoreCard({ category, score, insights }: CategoryScoreCardProps) {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

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
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <Typography variant="h4" weight="semibold">
          {category}
        </Typography>
        <View style={[styles.scoreContainer, { backgroundColor: getScoreBackgroundColor() }]}>
          <Typography weight="bold" color={getScoreColor()}>
            {score}
          </Typography>
        </View>
      </View>
      
      <View style={styles.insightsContainer}>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <View style={styles.bulletPoint} />
            <Typography variant="bodySmall" style={styles.insightText}>
              {insight}
            </Typography>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsContainer: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A1A1AA',
    marginTop: 7,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
  },
});