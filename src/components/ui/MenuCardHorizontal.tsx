import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DietaryIcon } from './DietaryIcon';
import { useCartStore } from '../../stores/cart-store';
import { useI18n } from '../../i18n';
import { useTheme } from '../../stores/theme-store';
import { DishDto } from '../../services/api-client';
import { isPlaceholderDescription } from '../../shared';

export interface MenuCardHorizontalProps {
  dish: DishDto;
  onPress: () => void;
  onOptionsPress?: () => void;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export const MenuCardHorizontal: React.FC<MenuCardHorizontalProps> = ({
  dish,
  onPress,
  onOptionsPress,
  isFavorited = false,
  onToggleFavorite,
}) => {
  const { colors, isDark } = useTheme();
  const { t, formatCurrency } = useI18n();

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // Derive quantity of this dish in cart
  const matchingCartItems = cartItems.filter((i) => i.dishId === dish.id);
  const currentQuantity = matchingCartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const hasOptions =
    (dish.variants && dish.variants.length > 0) ||
    (dish.addOns && dish.addOns.length > 0);

  const handleAdd = (e?: GestureResponderEvent) => {
    e?.stopPropagation?.();
    addItem({
      dishId: dish.id,
      name: dish.name,
      slug: dish.slug || 'dish',
      basePrice: dish.price,
      quantity: 1,
      variantPriceDelta: 0,
      addOns: [],
      image: dish.image || null,
    });
  };

  const handleIncrement = (e?: GestureResponderEvent) => {
    e?.stopPropagation?.();
    const defaultItem = matchingCartItems[0];
    if (defaultItem) {
      updateQuantity(defaultItem.cartItemId, defaultItem.quantity + 1);
    } else {
      handleAdd(e);
    }
  };

  const handleDecrement = (e?: GestureResponderEvent) => {
    e?.stopPropagation?.();
    const defaultItem = matchingCartItems[matchingCartItems.length - 1];
    if (defaultItem) {
      if (defaultItem.quantity > 1) {
        updateQuantity(defaultItem.cartItemId, defaultItem.quantity - 1);
      } else {
        removeItem(defaultItem.cartItemId);
      }
    }
  };

  const isAvailable = dish.isAvailable !== false;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceBorder,
        },
        !isAvailable && styles.cardDisabled,
      ]}
    >
      {/* Left 96x96px Thumbnail */}
      <TouchableOpacity
        style={styles.thumbnailContainer}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`View ${dish.name} details`}
      >
        {dish.image ? (
          <Image source={{ uri: dish.image }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceBorder }]}>
            <Ionicons name="restaurant-outline" size={28} color={colors.textMuted} />
          </View>
        )}

        {onToggleFavorite ? (
          <TouchableOpacity
            style={styles.favBadge}
            onPress={(e) => {
              e?.stopPropagation?.();
              onToggleFavorite();
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={13}
              color={isFavorited ? '#EF4444' : '#FFFFFF'}
            />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {/* Right Column: Title, Dietary Icon, Sensory Description, Price, Stepper */}
      <View style={styles.rightContent}>
        <TouchableOpacity
          style={styles.textTouchArea}
          onPress={onPress}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`${dish.name}, ${formatCurrency(dish.price)}`}
        >
          <View style={styles.titleRow}>
            <DietaryIcon isVeg={dish.isVeg} size={14} style={{ marginRight: 6, marginTop: 2 }} />
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {dish.name}
            </Text>
          </View>

          {dish.description && !isPlaceholderDescription(dish.description) ? (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {dish.description}
            </Text>
          ) : null}
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: colors.goldText }]}>
              {formatCurrency(dish.price)}
            </Text>
            {hasOptions ? (
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  if (onOptionsPress) onOptionsPress();
                  else onPress();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={[styles.optionsLink, { color: colors.purple }]}>
                  {t.menu.optionsAvailable}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {isAvailable ? (
            currentQuantity > 0 ? (
              <View
                style={[
                  styles.stepperContainer,
                  {
                    backgroundColor: isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(126, 34, 206, 0.1)',
                    borderColor: colors.purple,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={handleDecrement}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons name="remove" size={14} color={colors.purple} />
                </TouchableOpacity>

                <Text style={[styles.stepperQty, { color: colors.text }]}>
                  {currentQuantity}
                </Text>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={handleIncrement}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={14} color={colors.purple} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: colors.purple,
                  },
                ]}
                onPress={handleAdd}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${t.home.add} ${dish.name}`}
              >
                <Text style={styles.addBtnText}>{t.home.add}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>{t.menu.soldOut}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  cardDisabled: {
    opacity: 0.55,
  },
  thumbnailContainer: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  thumbnail: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContent: {
    flex: 1,
    minHeight: 96,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  textTouchArea: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  priceContainer: {
    justifyContent: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  optionsLink: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    textDecorationLine: 'underline',
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
});
