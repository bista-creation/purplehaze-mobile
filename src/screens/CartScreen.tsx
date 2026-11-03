import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../stores/cart-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { colors as defaultColors, ColorTheme, spacing, borderRadius } from '../theme';

export function CartScreen({ navigation }: any) {
  const { t, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotalPaisa = useCartStore((s) => s.getSubtotalPaisa());

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Menu' });
    }
  };

  const handleClear = () => {
    Alert.alert(t.cart.clearCart, 'Are you sure you want to remove all items?', [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.cart.clearCart, style: 'destructive', onPress: clearCart },
    ]);
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <TouchableOpacity
          style={styles.emptyTopBack}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.emptyTopBackText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart-outline" size={54} color={colors.gold} />
        </View>
        <Text style={styles.emptyTitle}>{t.cart.emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{t.cart.emptySubtitle}</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Menu' })}
          activeOpacity={0.8}
        >
          <Text style={styles.browseButtonText}>{t.cart.browseMenu}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Home' })}
          activeOpacity={0.8}
        >
          <Text style={[styles.homeButtonText, { color: colors.gold }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backBtn,
              {
                borderColor: colors.surfaceBorder,
                backgroundColor: colors.surfaceElevated,
              },
            ]}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t.cart.title}</Text>
            <Text style={styles.itemCountText}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
          <Text style={styles.clearText}>{t.cart.clearCart}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.cartItemId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartCard}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.variantName ? (
                  <Text style={styles.itemVariant}>{item.variantName}</Text>
                ) : null}
                {item.addOns.length > 0 ? (
                  <Text style={styles.itemAddOns}>
                    + {item.addOns.map((a) => a.name).join(', ')}
                  </Text>
                ) : null}
                {item.instructions ? (
                  <Text style={styles.itemNotes}>Note: {item.instructions}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => removeItem(item.cartItemId)}
                style={styles.trashBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.itemFooter}>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.lineTotal)}
              </Text>

              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.qtyNumber}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Bill summary & checkout bar */}
      <View style={styles.footer}>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>{t.cart.subtotal}</Text>
          <Text style={styles.billValue}>{formatCurrency(subtotalPaisa)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutBtnText}>{t.cart.checkout}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTopBack: {
    position: 'absolute',
    top: 54,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.xs,
  },
  emptyTopBackText: {
    fontSize: 15,
    fontWeight: '600',
  },
  homeButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemCountText: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '600',
    marginTop: 2,
  },
  clearText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 130,
  },
  cartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  itemVariant: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemAddOns: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 11,
    color: colors.textDisabled,
    fontStyle: 'italic',
  },
  trashBtn: {
    padding: spacing.xs,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gold,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  qtyBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  qtyNumber: {
    color: colors.text,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
    minWidth: 28,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  billLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  billValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gold,
  },
  checkoutBtn: {
    backgroundColor: colors.purple,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
