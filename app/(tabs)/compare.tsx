import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import CompareCard from '@/components/CompareCard';
import { Plus } from 'lucide-react-native';
import Constants from 'expo-constants';

// Mock data for demo purposes
const MOCK_COMPARISONS = [
  {
    id: '1',
    product1: {
      name: 'Ultra Strength Omega-3 Fish Oil Supplement',
      brand: 'NaturePlus',
      imageUrl: 'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg',
      score: 85,
    },
    product2: {
      name: 'Pure Omega-3 Wild Caught Fish Oil',
      brand: 'OceanHealth',
      imageUrl: 'https://images.pexels.com/photos/6692103/pexels-photo-6692103.jpeg',
      score: 92,
    },
  },
  {
    id: '2',
    product1: {
      name: 'Complete Multivitamin Daily Formula',
      brand: 'VitaCore',
      imageUrl: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg',
      score: 73,
    },
    product2: {
      name: 'Premium Multivitamin & Mineral Complex',
      brand: 'OptimumHealth',
      imageUrl: 'https://images.pexels.com/photos/5699514/pexels-photo-5699514.jpeg',
      score: 67,
    },
  },
];

export default function CompareScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="h2" weight="bold" style={styles.title}>
            Compare
          </Typography>
          <Typography 
            variant="body" 
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Compare supplements side by side
          </Typography>
        </View>
        
        <Button
          title="Create New Comparison"
          variant="secondary"
          icon={<Plus size={18} color={colors.primary} />}
          fullWidth
          onPress={() => router.push('/new-comparison')}
          style={styles.newButton}
        />
        
        <View style={styles.comparisonsContainer}>
          <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
            Your Comparisons
          </Typography>
          
          {MOCK_COMPARISONS.map(comparison => (
            <CompareCard
              key={comparison.id}
              product1={comparison.product1}
              product2={comparison.product2}
              onViewDetails={() => router.push(`/comparison/${comparison.id}`)}
            />
          ))}
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
  newButton: {
    marginBottom: 24,
  },
  comparisonsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
});