import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Header, Card, Typography, Button, GoogleSignInButton } from '../components/ui';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { ColorTheme, spacing, borderRadius } from '../theme';
import { api, WEBSITE_BASE_URL } from '../services/api-client';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const { mode, preference, setMode, colors } = useTheme();
  const { t, language, setLanguage, isNepali } = useI18n();
  const [failedAvatarUri, setFailedAvatarUri] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const redirectToSignIn = () => {
      const auth = useAuthStore.getState();
      if (navigation.isFocused() && !auth.isLoading && !auth.isAuthenticated) {
        navigation.navigate('LoginModal', { returnTo: 'Profile' });
      }
    };

    const unsubscribe = navigation.addListener('focus', redirectToSignIn);
    redirectToSignIn();
    return unsubscribe;
  }, [navigation, isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <View style={[styles.container, styles.redirecting]}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert(t.profile.signOut, t.profile.signOutConfirm, [
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
            Alert.alert(t.profile.accountDeleted, t.profile.accountDeletedMessage);
          } catch (e: any) {
            Alert.alert(t.common.error, e.message || t.profile.deleteFailed);
          }
        },
      },
    ]);
  };

  const openPolicyPage = async (path: string) => {
    const url = `${WEBSITE_BASE_URL}${path}`;
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
              {user?.image && failedAvatarUri !== user.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => setFailedAvatarUri(user.image ?? null)}
                  accessibilityLabel={t.profile.profilePhoto}
                />
              ) : (
                <Ionicons
                  name={isAuthenticated ? 'person' : 'person-outline'}
                  size={28}
                  color={colors.gold}
                />
              )}
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
                  onPress={() => navigation.navigate('LoginModal', { returnTo: 'Profile' })}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <Button
                  title={t.profile.register}
                  variant="outline"
                  size="md"
                  onPress={() => navigation.navigate('RegisterModal', { returnTo: 'Profile' })}
                  style={{ flex: 1 }}
                />
              </View>
              <GoogleSignInButton style={{ marginTop: spacing.sm }} />
            </View>
          ) : null}
        </Card>

        {/* Quick Actions */}
        <Typography variant="title" style={styles.sectionHeader}>
          {t.profile.diningOrders}
        </Typography>

        <Card variant="surface" style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Orders')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="receipt-outline" size={20} color={colors.gold} style={styles.menuIcon} />
              <Typography variant="body" bold>{t.navigation.orders}</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => navigation.navigate('Favorites')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="heart-outline" size={20} color={colors.gold} style={styles.menuIcon} />
              <Typography variant="body" bold>{t.navigation.favorites}</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
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

        {/* App Appearance & Theme */}
        <Typography variant="title" style={styles.sectionHeader}>
          {t.profile.appearanceTheme}
        </Typography>
        <Card variant="surface" style={styles.menuGroup}>
          <View style={[styles.languageRow, styles.themePreferenceRow]}>
            <View style={styles.menuLeft}>
              <Ionicons
                name={preference === 'system' ? 'phone-portrait-outline' : mode === 'dark' ? 'moon' : 'sunny'}
                size={20}
                color={colors.gold}
                style={styles.menuIcon}
              />
              <Typography variant="body" bold>{t.profile.displayMode}</Typography>
            </View>
            <View style={styles.langPills} accessibilityLabel={t.profile.displayMode}>
              {([
                ['system', t.profile.system],
                ['light', t.profile.light],
                ['dark', t.profile.dark],
              ] as const).map(([value, label]) => {
                const selected = preference === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.langPill, styles.themePill, selected ? styles.langPillActive : null]}
                    onPress={() => { void setMode(value); }}
                    accessibilityRole="radio"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    hitSlop={4}
                  >
                    <Text style={[styles.langPillText, selected ? styles.langPillTextActive : null]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Language & Preferences */}
        <Typography variant="title" style={styles.sectionHeader}>
          {t.profile.language}
        </Typography>
        <Card variant="surface" style={styles.menuGroup}>
          <View style={styles.languageRow}>
            <View style={styles.menuLeft}>
              <Ionicons name="globe-outline" size={20} color={colors.purple} style={styles.menuIcon} />
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
              <Typography variant="body">{isNepali ? 'रिसेप्सनमा फोन गर्नुहोस्' : 'Call Front Desk'} (+977 9852022202)</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => Linking.openURL('https://wa.me/9779852022202').catch(() => {})}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.menuIcon} />
              <Typography variant="body">{t.profile.whatsappInquiries}</Typography>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Policies (Loaded from live site) */}
        <Typography variant="title" style={styles.sectionHeader}>
          {t.profile.legalPolicies}
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

        {/* Brand Insignia & Heritage Footer */}
        <View style={styles.brandFooter}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandFooterLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandFooterTitle}>
            Purple Haze Restaurant & Garden
          </Text>
          <Text style={styles.brandFooterSub}>
            Biratnagar, Nepal • Crafted with Passion
          </Text>
          <Text style={styles.versionInfo}>
            Mobile App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  redirecting: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.huge,
  },
  userCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  addressGroup: {
    padding: 0,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  addressMessage: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addressMessageText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  savedAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  savedAddressBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  savedAddressIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  savedAddressInfo: {
    flex: 1,
    gap: 3,
  },
  savedAddressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  defaultAddressBadge: {
    color: colors.goldText,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  themePreferenceRow: {
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  langPills: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  themePill: {
    minHeight: 44,
    justifyContent: 'center',
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
  brandFooter: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    gap: 4,
  },
  brandFooterLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 6,
  },
  brandFooterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.goldText,
    letterSpacing: 0.5,
  },
  brandFooterSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  versionInfo: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.textDisabled,
    marginTop: 4,
  },
});
