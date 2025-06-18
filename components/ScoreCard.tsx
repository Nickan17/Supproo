import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Card from './ui/Card';
import Typography from './ui/Typography';

interface ScoreCardProps {
  score: number;
  title: string;
  description: string;
}

export default function ScoreCard({ score, title, description }: ScoreCardProps) {
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

  const getScoreText = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 50) return 'Average';
    return 'Poor';
  };

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.scoreContainer, { backgroundColor: getScoreBackgroundColor() }]}>
          <Typography variant="h2" weight="bold" color={getScoreColor()}>
            {score}
          </Typography>
        </View>
        <View style={styles.titleContainer}>
          <Typography variant="h3" weight="semibold">
            {title}
          </Typography>
          <Typography variant="bodySmall" color={getScoreColor()} weight="semibold">
            {getScoreText()}
          </Typography>
        </View>
      </View>
      <Typography variant="body" style={styles.description} color={colors.textSecondary}>
        {description}
      </Typography>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  description: {
    lineHeight: 22,
  },
});