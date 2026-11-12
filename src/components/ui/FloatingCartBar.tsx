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
import { useTheme } from '../../stores/theme-store';
import { useCartStore } from '../../stores/cart-store';
import { useI18n } from '../../i18n';
import { ColorTheme, borderRadius } from '../../theme';

interface FloatingCartBarProps {
  onPress: () => void;
  bottom?: number;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({ onPress, bottom }) => {
  const { colors } = useTheme();
  const { t, formatCurrency } = useI18n();

  const cartItemCount = useCartStore((s) => s.getItemCount());
  const cartSubtotal = useCartStore((s) => s.getSubtotalPaisa());
  const hasCartItems = cartItemCount > 0;

  const [reduceMotion, setReduceMotion] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(hasCartItems ? 1 : 0));
  const [slideAnim] = useState(() => new Animated.Value(hasCartItems ? 0 : 10));
  const [countScaleAnim] = useState(() => new Animated.Value(1));
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
    if (hasCartItems) {
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
  }, [hasCartItems, reduceMotion, fadeAnim, slideAnim]);

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
  }, [cartItemCount, reduceMotion, countScaleAnim]);

  // Never render when cart is empty
  if (cartItemCount <= 0) {
    return null;
  }

  // Render geometry:
  // Positioned snugly at bottom: 10px just on top of the bottom navigation dock menu icons
  const bottomPosition = bottom ?? 10;

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
        {/* Left: Basket Icon & Running Subtotal */}
        <View style={styles.leftSection}>
          <Animated.View
            style={[
              styles.basketBadge,
              { transform: [{ scale: countScaleAnim }] },
            ]}
          >
            <Ionicons name="bag-handle" size={15} color="#FFFFFF" />
          </Animated.View>

          <View style={styles.infoCol}>
            <Text style={styles.subtotalText}>
              [ {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'} · {formatCurrency(cartSubtotal)} ]
            </Text>
          </View>
        </View>

        {/* Right: Clear Checkout Trigger */}
        <View style={styles.actionPill}>
          <Text style={styles.actionPillText}>{t.menu.viewTrayCheckout}</Text>
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
