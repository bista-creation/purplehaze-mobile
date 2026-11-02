import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Header, Card, Typography, Button, Badge, GoogleSignInButton } from '../components/ui';
import { useAuthStore } from '../stores/auth-store';
import { useI18n } from '../i18n';
import { colors, spacing, borderRadius } from '../theme';
import { api } from '../services/api-client';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t, language, setLanguage } = useI18n();

  const handleLogout = () => {
    Alert.alert(t.profile.signOut, 'Are you sure you want to sign out?', [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.profile.signOut,
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t.profile.deleteAccount, t.profile.confirmDelete, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.profile.deleteAccount,
        style: 'destructive',
        onPress: async () => {
          try {
            await api.profile.deleteAccount();
            await logout();
            Alert.alert('Account Deleted', 'Your account and personal data have been completely removed.');
          } catch (e: any) {
            Alert.alert(t.common.error, e.message || 'Could not delete account.');
          }
        },
      },
    ]);
  };

  const openPolicyPage = async (path: string) => {
    const url = `https://purplehaze-nine.vercel.app${path}`;
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.background,
        controlsColor: colors.gold,
      });
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  };

  const callRestaurant = () => {
    Linking.openURL('tel:+9779852022202').catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Ionicons
                name={isAuthenticated ? 'person' : 'person-outline'}
                size={28}
                color={colors.gold}
              />
            </View>
            <View style={styles.userInfo}>
              <Typography variant="h2" style={{ color: colors.text }}>
                {isAuthenticated && user?.name ? user.name : t.profile.guestUser}
              </Typography>
              <Typography variant="bodySmall" color={colors.textMuted}>
                {isAuthenticated && user?.email ? user.email : t.profile.signInPrompt}
              </Typography>
            </View>
          </View>

          {!isAuthenticated ? (
            <View style={{ marginTop: spacing.md }}>
              <View style={styles.authButtonsRow}>
                <Button
                  title={t.profile.signIn}
                  variant="gold"
                  size="md"
                  onPress={() => navigation.navigate('LoginModal')}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <Button
                  title={t.profile.register}
                  variant="outline"
                  size="md"
                  onPress={() => navigation.navigate('RegisterModal')}
                  style={{ flex: 1 }}
                />
              </View>
              <GoogleSignInButton style={{ marginTop: spacing.sm }} />
            </View>
          ) : null}
        </Card>

        {/* Quick Actions */}
        <Typography variant="title" style={styles.sectionHeader}>
          Dining & Orders
        </Typography>

        <Card variant="surface" style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrderTracking')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="search-outline" size={20} color={colors.gold} style={styles.menuIcon} />
              <Typography variant="body" bold>{t.orders.trackOrder}</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => navigation.navigate('Reservations')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="calendar-outline" size={20} color={colors.gold} style={styles.menuIcon} />
              <Typography variant="body" bold>{t.profile.myBookings}</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => navigation.navigate('Venues')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="sparkles-outline" size={20} color={colors.gold} style={styles.menuIcon} />
              <Typography variant="body" bold>{t.venues.title}</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Language & Preferences */}
        <Typography variant="title" style={styles.sectionHeader}>
          {t.profile.language}
        </Typography>
        <Card variant="surface" style={styles.menuGroup}>
          <View style={styles.languageRow}>
            <View style={styles.menuLeft}>
              <Ionicons name="globe-outline" size={20} color={colors.purpleLight} style={styles.menuIcon} />
              <Typography variant="body" bold>{t.profile.language}</Typography>
            </View>
            <View style={styles.langPills}>
              <TouchableOpacity
                style={[styles.langPill, language === 'en' ? styles.langPillActive : null]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langPillText, language === 'en' ? styles.langPillTextActive : null]}>
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langPill, language === 'ne' ? styles.langPillActive : null]}
                onPress={() => setLanguage('ne')}
              >
                <Text style={[styles.langPillText, language === 'ne' ? styles.langPillTextActive : null]}>
                  नेपाली
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Contact & Support */}
        <Typography variant="title" style={styles.sectionHeader}>
          {t.profile.contactUs}
        </Typography>
        <Card variant="surface" style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={callRestaurant}>
            <View style={styles.menuLeft}>
              <Ionicons name="call-outline" size={20} color={colors.gold} style={styles.menuIcon} />
              <Typography variant="body">Call Front Desk (+977 9852022202)</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => Linking.openURL('https://wa.me/9779852022202').catch(() => {})}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.menuIcon} />
              <Typography variant="body">WhatsApp Inquiries</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Policies (Loaded from live site) */}
        <Typography variant="title" style={styles.sectionHeader}>
          Legal & Policies
        </Typography>
        <Card variant="surface" style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={() => openPolicyPage('/privacy')}>
            <Typography variant="bodySmall">{t.profile.privacyPolicy}</Typography>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => openPolicyPage('/terms')}
          >
            <Typography variant="bodySmall">{t.profile.termsConditions}</Typography>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => openPolicyPage('/refund-and-cancellation')}
          >
            <Typography variant="bodySmall">{t.profile.refundPolicy}</Typography>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Authenticated Actions */}
        {isAuthenticated ? (
          <View style={styles.accountActionSection}>
            <Button
              title={t.profile.signOut}
              variant="outline"
              onPress={handleLogout}
              style={{ marginBottom: spacing.md }}
            />
            <Button
              title={t.profile.deleteAccount}
              variant="danger"
              size="sm"
              onPress={handleDeleteAccount}
            />
          </View>
        ) : null}

        <Text style={styles.versionInfo}>
          Purple Haze Mobile v1.0.0 (Biratnagar, Nepal)
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.huge,
  },
  userCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  authButtonsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  sectionHeader: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuGroup: {
    padding: 0,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  langPills: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  langPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  langPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.goldDark,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  langPillTextActive: {
    color: '#130B1D',
    fontWeight: '700',
  },
  accountActionSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  versionInfo: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textDisabled,
    marginTop: spacing.md,
  },
});
