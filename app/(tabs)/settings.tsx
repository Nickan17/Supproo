import React from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import Typography from '@/components/ui/Typography';
import Constants from 'expo-constants';
import { 
  Moon, 
  Sun, 
  Bell, 
  Lock, 
  HelpCircle, 
  FileText, 
  Send, 
  LogOut,
  ChevronRight
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { isDark, theme, toggleTheme } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const renderSettingsItem = (
    icon: React.ReactNode,
    title: string,
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        {icon}
        <Typography variant="body" style={styles.settingsItemTitle}>
          {title}
        </Typography>
      </View>
      {rightElement || <ChevronRight size={20} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="h2" weight="bold" style={styles.title}>
            Settings
          </Typography>
          <Typography 
            variant="body" 
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Manage your preferences
          </Typography>
        </View>
        
        <View style={styles.settingsGroup}>
          <Typography 
            variant="bodySmall" 
            weight="medium" 
            style={[styles.settingsGroupTitle, { color: colors.textSecondary }]}
          >
            APPEARANCE
          </Typography>
          
          {renderSettingsItem(
            theme === 'dark' ? <Moon size={20} color={colors.textSecondary} /> : <Sun size={20} color={colors.textSecondary} />,
            theme === 'dark' ? 'Dark Mode' : theme === 'light' ? 'Light Mode' : 'System Default',
            <Switch
              value={theme !== 'light'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.backgroundTertiary, true: colors.primary }}
              thumbColor="#FFFFFF"
            />,
            toggleTheme
          )}
        </View>
        
        <View style={styles.settingsGroup}>
          <Typography 
            variant="bodySmall" 
            weight="medium" 
            style={[styles.settingsGroupTitle, { color: colors.textSecondary }]}
          >
            NOTIFICATIONS
          </Typography>
          
          {renderSettingsItem(
            <Bell size={20} color={colors.textSecondary} />,
            'Notification Preferences',
            undefined,
            () => {}
          )}
        </View>
        
        <View style={styles.settingsGroup}>
          <Typography 
            variant="bodySmall" 
            weight="medium" 
            style={[styles.settingsGroupTitle, { color: colors.textSecondary }]}
          >
            PRIVACY & TERMS
          </Typography>
          
          {renderSettingsItem(
            <Lock size={20} color={colors.textSecondary} />,
            'Privacy Policy',
            undefined,
            () => {}
          )}
          
          {renderSettingsItem(
            <FileText size={20} color={colors.textSecondary} />,
            'Terms of Service',
            undefined,
            () => {}
          )}
        </View>
        
        <View style={styles.settingsGroup}>
          <Typography 
            variant="bodySmall" 
            weight="medium" 
            style={[styles.settingsGroupTitle, { color: colors.textSecondary }]}
          >
            SUPPORT
          </Typography>
          
          {renderSettingsItem(
            <HelpCircle size={20} color={colors.textSecondary} />,
            'Help Center',
            undefined,
            () => {}
          )}
          
          {renderSettingsItem(
            <Send size={20} color={colors.textSecondary} />,
            'Contact Us',
            undefined,
            () => {}
          )}
        </View>
        
        <View style={styles.settingsGroup}>
          <Typography 
            variant="bodySmall" 
            weight="medium" 
            style={[styles.settingsGroupTitle, { color: colors.textSecondary }]}
          >
            ACCOUNT
          </Typography>
          
          {renderSettingsItem(
            <LogOut size={20} color={colors.badScore} />,
            'Sign Out',
            undefined,
            () => {}
          )}
        </View>
        
        <View style={styles.versionContainer}>
          <Typography 
            variant="caption" 
            style={[styles.versionText, { color: colors.textTertiary }]}
          >
            SuppScan v1.0.0
          </Typography>
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
  settingsGroup: {
    marginBottom: 24,
  },
  settingsGroupTitle: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemTitle: {
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  versionText: {},
});