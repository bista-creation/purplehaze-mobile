import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../services/api';
import type { AddressDto } from '../shared/types';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      setLoadingData(true);
      const [addrRes, favRes] = await Promise.all([
        api.get<AddressDto[]>('/addresses'),
        api.get<any[]>('/favorites'),
      ]);
      if (Array.isArray(addrRes)) setAddresses(addrRes);
      if (Array.isArray(favRes)) setFavoritesCount(favRes.length);
    } catch (err) {
      console.warn('Failed to load profile sub-data', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const openWebsite = () => {
    Linking.openURL('https://purplehaze-nine.vercel.app/').catch(() => {});
  };

  const callRestaurant = () => {
    Linking.openURL('tel:+9779800000000').catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Info */}
      {isAuthenticated && user ? (
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user.name || 'Purple Haze Guest'}</Text>
              {user.role && user.role !== 'CUSTOMER' && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{user.role}</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <Ionicons name="person-circle-outline" size={60} color="#a855f7" />
          <Text style={styles.guestHeading}>Welcome to Purple Haze</Text>
          <Text style={styles.guestText}>
            Sign in to track orders, save multiple delivery addresses, and save your favorite dishes.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('LoginModal')}
          >
            <Text style={styles.signInBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Account Details if logged in */}
      {isAuthenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{favoritesCount}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{addresses.length}</Text>
              <Text style={styles.statLabel}>Saved Addresses</Text>
            </View>
          </View>
        </View>
      )}

      {/* Saved Addresses Summary */}
      {isAuthenticated && addresses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          {addresses.map((addr) => (
            <View key={addr.id} style={styles.addressItem}>
              <Ionicons
                name={addr.label?.toLowerCase().includes('work') ? 'briefcase-outline' : 'home-outline'}
                size={20}
                color="#c084fc"
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.addressLabel}>{addr.label}</Text>
                <Text style={styles.addressStreet} numberOfLines={1}>
                  {addr.line1}, {addr.city}
                </Text>
              </View>
              {addr.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* About & Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Purple Haze Restro & Garden</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#a855f7" />
            <Text style={styles.infoText}>Biratnagar, Koshi Province, Nepal</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#a855f7" />
            <Text style={styles.infoText}>Open Daily: 10:00 AM – 10:30 PM</Text>
          </View>
          <TouchableOpacity style={styles.infoRow} onPress={callRestaurant}>
            <Ionicons name="call-outline" size={20} color="#a855f7" />
            <Text style={[styles.infoText, styles.linkText]}>+977 980-0000000</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoRow} onPress={openWebsite}>
            <Ionicons name="globe-outline" size={20} color="#a855f7" />
            <Text style={[styles.infoText, styles.linkText]}>purplehaze-nine.vercel.app</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      {isAuthenticated && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.versionText}>Purple Haze Mobile v1.0.0 (Unified REST & Realtime)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0716' },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#18122B',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  profileDetails: { marginLeft: 16, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
  roleBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: { color: '#c084fc', fontSize: 10, fontWeight: 'bold' },
  userEmail: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  userPhone: { color: '#cbd5e1', fontSize: 13, marginTop: 2 },
  guestCard: {
    backgroundColor: '#18122B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  guestHeading: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  guestText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  signInBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  signInBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#18122B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statNumber: { color: '#a855f7', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18122B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  addressLabel: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  addressStreet: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  defaultBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  infoCard: {
    backgroundColor: '#18122B',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { color: '#cbd5e1', fontSize: 13 },
  linkText: { color: '#c084fc', textDecorationLine: 'underline' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 15 },
  versionText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 11,
    marginTop: 8,
  },
});
