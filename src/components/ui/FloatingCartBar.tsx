import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../stores/theme-store';
import { useCartStore } from '../../stores/cart-store';
import { useI18n } from '../../i18n';
import { ColorTheme, borderRadius, spacing } from '../../theme';

interface FloatingCartBarProps {
  onPress: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const { formatCurrency } = useI18n();
  const insets = useSafeAreaInsets();

  const cartItemCount = useCartStore((s) => s.getItemCount());
  const cartSubtotal = useCartStore((s) => s.getSubtotalNpr());

  const [reduceMotion, setReduceMotion] = useState(false);
  const fadeAnim = useRef(new Animated.Value(cartItemCount > 0 ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(cartItemCount > 0 ? 0 : 10)).current;
  const countScaleAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(cartItemCount);

  // Check user accessibility preference for reduced motion
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    const listener = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (isMounted) setReduceMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      listener?.remove?.();
    };
  }, []);

  // Micro-animation: gentle entry transition when cart becomes active
  useEffect(() => {
    if (cartItemCount > 0) {
      if (reduceMotion) {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(10);
    }
  }, [cartItemCount > 0, reduceMotion]);

  // Micro-animation: subtle spring on the badge count when items change
  useEffect(() => {
    if (prevCountRef.current !== cartItemCount && cartItemCount > 0) {
      prevCountRef.current = cartItemCount;
      if (!reduceMotion) {
        Animated.sequence([
          Animated.timing(countScaleAnim, {
            toValue: 1.15,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.spring(countScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [cartItemCount, reduceMotion]);

  // Never render when cart is empty
  if (cartItemCount <= 0) {
    return null;
  }

  // Render geometry:
  // The parent screen container in @react-navigation/bottom-tabs terminates exactly at
  // the top edge of the 62px bottom tab bar. Setting bottom: 8 positions the 50px pill
  // with an exact 8px clearance directly above the real bottom tab bar without floating high.
  const bottomPosition = 8;

  const styles = createStyles(colors);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Cart: ${cartItemCount} items, Total: ${formatCurrency(cartSubtotal)}. Tap to view cart.`}
    >
      <TouchableOpacity
        style={styles.pillCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/* Left: Basket Icon & Count Badge */}
        <View style={styles.leftSection}>
          <Animated.View
            style={[
              styles.basketBadge,
              { transform: [{ scale: countScaleAnim }] },
            ]}
          >
            <Ionicons name="bag-handle" size={15} color="#FFFFFF" />
            <View style={styles.countBubble}>
              <Text style={styles.countBubbleText}>{cartItemCount}</Text>
            </View>
          </Animated.View>

          <View style={styles.infoCol}>
            <Text style={styles.itemCountText}>
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.subtotalText}>{formatCurrency(cartSubtotal)}</Text>
          </View>
        </View>

        {/* Right: Obvious View Cart Pill Action */}
        <View style={styles.actionPill}>
          <Text style={styles.actionPillText}>View Cart</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.purpleDark} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      maxWidth: 640,
      alignSelf: 'center',
      zIndex: 100,
    },
    pillCard: {
      height: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.purple,
      borderRadius: borderRadius.full,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: 'rgba(216, 173, 104, 0.45)', // Restrained champagne-gold border
      ...Platform.select({
        web: {
          boxShadow: '0 6px 18px rgba(44, 13, 51, 0.28)',
          cursor: 'pointer',
        },
        default: {
          shadowColor: colors.purpleDark,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
      }),
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    basketBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    countBubble: {
      position: 'absolute',
      top: -3,
      right: -5,
      backgroundColor: colors.gold,
      borderRadius: 9,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countBubbleText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
    infoCol: {
      justifyContent: 'center',
    },
    itemCountText: {
      fontSize: 11,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.78)',
      letterSpacing: 0.2,
    },
    subtotalText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.2,
    },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.goldLight,
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderRadius: borderRadius.full,
    },
    actionPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.purpleDark,
      letterSpacing: 0.3,
    },
  });
