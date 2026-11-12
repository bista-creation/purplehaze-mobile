import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../stores/cart-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { ColorTheme, spacing, borderRadius } from '../theme';
import { isPlaceholderDescription } from '../shared';
import { DietaryIcon } from '../components/ui';
import type { DishDto } from '../services/api-client';

export function DishDetailModal({ route, navigation }: any) {
  const { t, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const dish: DishDto | undefined = route?.params?.dish;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const rawVariants = dish?.variants || [];
  const variants = rawVariants.map((v: any) => ({
    id: v.id,
    name: v.name,
    priceDelta: v.priceDelta ?? (v.price && dish ? Math.max(0, v.price - dish.price) : 0),
    isDefault: v.isDefault ?? false,
  }));

  const rawAddOns = dish?.addOns || [];
  const addOns = rawAddOns.map((item: any) => item.addOn || item);

  const [selectedVariant, setSelectedVariant] = useState<any | null>(
    variants.find((v) => v.isDefault) || variants[0] || null
  );
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<'Mild' | 'Medium' | 'Spicy' | 'Extra Hot'>('Medium');
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);

  if (!dish) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="restaurant-outline" size={54} color={colors.gold} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 16 }}>
          Dish Not Found
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 20 }}>
          The requested dish could not be loaded. Please choose from our fresh menu.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.purple, paddingHorizontal: 24, paddingVertical: 12, borderRadius: borderRadius.full }}
          onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Menu' })}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{t.menu.browseFullMenu}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleAddOn = (addOn: any) => {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.id === addOn.id)
        ? prev.filter((a) => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  const unitPrice =
    dish.price +
    (selectedVariant?.priceDelta || 0) +
    selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);

  const handleAddToCart = () => {
    const combinedNotes = [
      dish.isSpicy || spiceLevel !== 'Medium' ? `Spice: ${spiceLevel}` : '',
      instructions.trim(),
    ].filter(Boolean).join(' • ');

    addItem({
      dishId: dish.id,
      name: dish.name,
      slug: dish.slug,
      image: dish.image,
      basePrice: dish.price,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      variantPriceDelta: selectedVariant?.priceDelta || 0,
      addOns: selectedAddOns.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
      instructions: combinedNotes || undefined,
      quantity,
    });

    handleClose();
  };

  const handleClose = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Menu' });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dish Image */}
        {dish.image ? (
          <Image source={{ uri: dish.image }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.placeholderImage]}>
            <Ionicons name="restaurant" size={48} color={colors.gold} />
          </View>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Dietary & Spice Tags */}
          <View style={styles.tagRow}>
            <View style={[styles.dietBadge, dish.isVeg ? styles.vegBadge : styles.nonVegBadge]}>
              <DietaryIcon isVeg={dish.isVeg} size={15} style={{ marginRight: 6 }} />
              <Text style={[styles.dietText, dish.isVeg ? styles.vegText : styles.nonVegText]}>
                {dish.isVeg ? t.menu.veg : t.menu.nonVeg}
              </Text>
            </View>
            {dish.isSpicy && (
              <View style={styles.spicyTag}>
                <Ionicons name="flame" size={13} color={colors.nonVeg} />
                <Text style={styles.spicyTagText}>{t.menu.chefSpecialSpice}</Text>
              </View>
            )}
          </View>

          {/* Title and tags */}
          <Text style={styles.title}>{dish.name}</Text>
          {dish.description && !isPlaceholderDescription(dish.description) ? (
            <Text style={styles.description}>{dish.description}</Text>
          ) : null}

          {/* Spice Level Customization */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.menu.spicePreference}</Text>
            <View style={styles.spiceRow}>
              {(['Mild', 'Medium', 'Spicy', 'Extra Hot'] as const).map((level) => {
                const isSelected = spiceLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[styles.spicePill, isSelected && styles.spicePillActive]}
                    onPress={() => setSpiceLevel(level)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="flame"
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textMuted}
                    />
                    <Text style={[styles.spicePillText, isSelected && styles.spicePillTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Variants section */}
          {variants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.menu.chooseVariant}</Text>
              <View style={styles.optionsList}>
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                      onPress={() => setSelectedVariant(v)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioOuter}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.optionLabel}>{v.name}</Text>
                      {v.priceDelta > 0 && (
                        <Text style={styles.optionPriceDelta}>
                          +{formatCurrency(v.priceDelta)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Add-ons section */}
          {addOns.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.menu.optionalAddOns}</Text>
              <View style={styles.optionsList}>
                {addOns.map((addOn: any) => {
                  const isSelected = selectedAddOns.some((a) => a.id === addOn.id);
                  return (
                    <TouchableOpacity
                      key={addOn.id}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                      onPress={() => toggleAddOn(addOn)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkboxOuter,
                          isSelected && styles.checkboxActive,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.optionLabel}>{addOn.name}</Text>
                      <Text style={styles.optionPriceDelta}>
                        +{formatCurrency(addOn.price)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Special instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.menu.cookingInstructions}</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Less spicy, extra sauce, well done..."
              placeholderTextColor={colors.textDisabled}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar: Quantity & Add Button */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityPicker}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.min(20, q + 1))}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Text style={styles.addCartText}>
            {t.menu.addToCart} · {formatCurrency(unitPrice * quantity)}
          </Text>
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
  scrollContent: {
    paddingBottom: 110,
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  placeholderImage: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    padding: spacing.lg,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  vegBadge: {
    borderColor: colors.veg,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  nonVegBadge: {
    borderColor: colors.nonVeg,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  dietDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegDot: {
    backgroundColor: colors.veg,
  },
  nonVegDot: {
    backgroundColor: colors.nonVeg,
  },
  dietText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vegText: {
    color: colors.veg,
  },
  nonVegText: {
    color: colors.nonVeg,
  },
  spicyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  spicyTagText: {
    color: colors.nonVeg,
    fontSize: 11,
    fontWeight: '700',
  },
  spiceRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  spicePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  spicePillActive: {
    backgroundColor: colors.purple,
    borderColor: colors.gold,
  },
  spicePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  spicePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.goldText,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  optionRowSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.purpleLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  optionLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  optionPriceDelta: {
    color: colors.goldText,
    fontSize: 13,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    minHeight: 70,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.screenTop,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    gap: spacing.md,
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    paddingHorizontal: spacing.sm,
  },
  addCartButton: {
    flex: 1,
    backgroundColor: colors.purple,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  addCartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
