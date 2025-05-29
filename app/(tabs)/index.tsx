import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SearchBar from '@/components/SearchBar';
import ScanPlaceholder from '@/components/ScanPlaceholder';
import { Camera, Link2, FileText, ChevronRight, ScanLine, History } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BarCodeScanner } from 'expo-barcode-scanner';
import Constants from 'expo-constants';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // This would be populated from real data in a full implementation
  const hasRecentScans = false;
  
  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setShowScanner(true);
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setShowScanner(false);
    // In a real app, this would query the API for the product
    Alert.alert('Barcode detected', `Type: ${type}\nData: ${data}`);
    router.push('/product/123');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${searchQuery}`);
    }
  };

  const handlePasteUrl = () => {
    Alert.alert(
      'Paste Product URL',
      'Enter a URL to a supplement product page:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Analyze',
          onPress: () => router.push('/product/123'),
        },
      ]
    );
  };

  const handleUploadImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'You need to grant permission to access your photos');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    if (!result.canceled) {
      // Process the image (in a real app, this would send to an API)
      Alert.alert('Image selected', 'Processing your supplement label...');
      router.push('/product/123');
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
            SuppScan
          </Typography>
          <Typography 
            variant="body" 
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            The truth behind every pill
          </Typography>
        </View>
        
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search supplements by name or brand..."
        />
        
        {showScanner ? (
          <Card variant="elevated" style={styles.scannerCard}>
            <BarCodeScanner
              onBarCodeScanned={handleBarCodeScanned}
              style={styles.scanner}
            />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setShowScanner(false)}
              style={styles.cancelButton}
            />
          </Card>
        ) : (
          <Card variant="elevated" style={styles.scanCard}>
            <View style={styles.scanCardContent}>
              <ScanLine size={40} color={colors.primary} />
              <View style={styles.scanTextContainer}>
                <Typography variant="h3" weight="semibold">
                  Scan a Supplement
                </Typography>
                <Typography 
                  variant="body" 
                  style={{ color: colors.textSecondary }}
                >
                  Get instant analysis of any supplement
                </Typography>
              </View>
            </View>
            <Button
              title="Scan Barcode"
              variant="primary"
              icon={<Camera size={18} color="#FFFFFF" />}
              onPress={requestCameraPermission}
              fullWidth
            />
          </Card>
        )}
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[
              styles.optionButton, 
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
            ]}
            onPress={handlePasteUrl}
          >
            <Link2 size={24} color={colors.primary} />
            <Typography variant="body" weight="medium" style={styles.optionText}>
              Paste URL
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.optionButton, 
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }
            ]}
            onPress={handleUploadImage}
          >
            <FileText size={24} color={colors.primary} />
            <Typography variant="body" weight="medium" style={styles.optionText}>
              Upload Label
            </Typography>
          </TouchableOpacity>
        </View>
        
        <View style={styles.recentContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <History size={20} color={colors.textSecondary} />
              <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
                Recent Scans
              </Typography>
            </View>
            
            {hasRecentScans && (
              <TouchableOpacity onPress={() => router.push('/saved')}>
                <View style={styles.viewAllContainer}>
                  <Typography 
                    variant="bodySmall" 
                    weight="semibold" 
                    color={colors.primary}
                  >
                    View All
                  </Typography>
                  <ChevronRight size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          {hasRecentScans ? (
            <View>
              {/* Recent scans would be displayed here */}
              {/* This would be populated with actual data in a real app */}
            </View>
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
  scanCard: {
    marginBottom: 16,
  },
  scanCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  optionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: {
    marginLeft: 8,
  },
  recentContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginLeft: 8,
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scannerCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  scanner: {
    height: 300,
    width: '100%',
  },
  cancelButton: {
    margin: 16,
  },
});