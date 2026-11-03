import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api as typedApi, DishDto, CategoryDto } from '../services/api-client';
import { useCartStore } from '../stores/cart-store';
import { useFavoritesStore } from '../stores/favorites-store';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { Header, Badge } from '../components/ui';
import { colors as defaultColors, ColorTheme, spacing, borderRadius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeScreen({ navigation }: any) {
  const { t, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { items, addItem, getItemCount, getSubtotalNpr } = useCartStore();
  const { favoriteDishIds, toggleFavorite, isFavorite } = useFavoritesStore();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [dishes, setDishes] = useState<DishDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const cartItemCount = getItemCount();
  const cartSubtotal = getSubtotalNpr();

  const loadData = async () => {
    try {
      const [catData, dishData] = await Promise.all([
        typedApi.menu.getCategories().catch(() => []),
        typedApi.menu.getDishes().catch(() => []),
      ]);
      setCategories(catData || []);
      setDishes(dishData || []);
    } catch (e) {
      console.warn('[HomeScreen] Data loading error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter curated collections
  const chefSpecials = useMemo(() => {
    return dishes.slice(0, 6);
  }, [dishes]);

  const bestsellers = useMemo(() => {
    return dishes.slice(2, 8);
  }, [dishes]);

  const promotionalBanners = [
    {
      id: '1',
      title: 'Himalayan Garden Dining',
      subtitle: 'Experience golden evenings at Airport Road, Biratnagar',
      tag: 'GARDEN FRESH',
      tagColor: '#16A34A',
      image: require('../../assets/logo.png'),
      actionText: 'Reserve Table',
      route: 'Reservations',
    },
    {
      id: '2',
      title: 'Flavors of Nepal & Sekuwa',
      subtitle: 'Authentic charcoal smoked delights with house dips',
      tag: 'CHEF SPECIAL',
      tagColor: colors.purple,
      image: require('../../assets/logo.png'),
      actionText: 'Explore Menu',
      route: 'Menu',
    },
    {
      id: '3',
      title: 'Banquets & Celebrations',
      subtitle: 'Host birthdays, parties & meetings in leafy grandeur',
      tag: 'EVENTS & VENUES',
      tagColor: colors.gold,
      image: require('../../assets/logo.png'),
      actionText: 'View Venues',
      route: 'Venues',
    },
  ];

  return (
    <View style={styles.container}>
      <Header showTagline={false} showLocation />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadData();
            }}
            tintColor={colors.purple}
            colors={[colors.purple, colors.gold]}
          />
        }
      >
        {/* Customer Greeting & AI Pill */}
        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greetingGreeting}>
              {user?.name ? `Namaste, ${user.name.split(' ')[0]} 👋` : 'Namaste, Guest 👋'}
            </Text>
            <Text style={styles.greetingSubtitle}>Good food. Golden evenings. Garden memories.</Text>
          </View>

          <TouchableOpacity
            style={styles.mayaButton}
            onPress={() => navigation.navigate('MayaModal')}
            activeOpacity={0.8}
          >
            <Text style={styles.mayaIcon}>✨</Text>
            <Text style={styles.mayaText}>Ask Maya</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Search Bar Redirect to Menu */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Menu')}
          activeOpacity={0.9}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>
            Search dishes, Sekuwa, Pizza, Biryani...
          </Text>
          <View style={styles.searchFilterBadge}>
            <Ionicons name="options-outline" size={14} color={colors.purple} />
          </View>
        </TouchableOpacity>

        {/* Hero Promotional Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.heroScroll}
          contentContainerStyle={styles.heroContainer}
          onScroll={(e) => {
            const slide = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
            setActiveBannerIndex(slide);
          }}
          scrollEventThrottle={16}
        >
          {promotionalBanners.map((banner) => (
            <View key={banner.id} style={styles.heroBanner}>
              <View style={styles.heroBannerContent}>
                <View style={[styles.heroTag, { backgroundColor: banner.tagColor + '20' }]}>
                  <Text style={[styles.heroTagText, { color: banner.tagColor }]}>
                    {banner.tag}
                  </Text>
                </View>
                <Text style={styles.heroTitle}>{banner.title}</Text>
                <Text style={styles.heroSubtitle}>{banner.subtitle}</Text>
                <TouchableOpacity
                  style={styles.heroActionBtn}
                  onPress={() => navigation.navigate(banner.route)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroActionText}>{banner.actionText}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.heroLogoCircle}>
                <Image source={banner.image} style={styles.heroLogoImg} resizeMode="contain" />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Quick Service Hub Cards */}
        <View style={styles.hubSection}>
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.85}
          >
            <View style={[styles.hubIconBg, { backgroundColor: 'rgba(84, 38, 109, 0.1)' }]}>
              <Ionicons name="restaurant" size={20} color={colors.purple} />
            </View>
            <Text style={styles.hubTitle}>Food Menu</Text>
            <Text style={styles.hubDesc}>Delivery {'&'} Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate('Reservations')}
            activeOpacity={0.85}
          >
            <View style={[styles.hubIconBg, { backgroundColor: 'rgba(216, 173, 104, 0.15)' }]}>
              <Ionicons name="calendar" size={20} color={colors.goldDark} />
            </View>
            <Text style={styles.hubTitle}>Reserve Table</Text>
            <Text style={styles.hubDesc}>Garden {'&'} Hall</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate('Venues')}
            activeOpacity={0.85}
          >
            <View style={[styles.hubIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Ionicons name="sparkles" size={20} color="#10B981" />
            </View>
            <Text style={styles.hubTitle}>Banquets</Text>
            <Text style={styles.hubDesc}>Events {'&'} Parties</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.85}
          >
            <View style={[styles.hubIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <Ionicons name="receipt" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.hubTitle}>My Orders</Text>
            <Text style={styles.hubDesc}>Live Tracking</Text>
          </TouchableOpacity>
        </View>

        {/* Food Categories Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.sectionLink}>View All ({categories.length}) →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => navigation.navigate('Menu', { categoryId: cat.id })}
              activeOpacity={0.8}
            >
              <View style={styles.categoryCircle}>
                <Text style={styles.categoryEmoji}>🍽️</Text>
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chef Specials Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Chef's Recommendations 👨‍🍳</Text>
            <Text style={styles.sectionSubtitle}>Handcrafted specials with authentic garden spices</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.sectionLink}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.purple} style={{ marginVertical: 30 }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalDishScroll}
          >
            {chefSpecials.map((dish) => {
              const favorited = isFavorite(dish.id);
              return (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.dishCardH}
                  onPress={() => navigation.navigate('DishDetail', { dish })}
                  activeOpacity={0.9}
                >
                  <View style={styles.dishImageWrapper}>
                    {dish.image ? (
                      <Image source={{ uri: dish.image }} style={styles.dishImage} />
                    ) : (
                      <View style={[styles.dishImage, styles.dishImagePlaceholder]}>
                        <Ionicons name="restaurant-outline" size={32} color={colors.textMuted} />
                      </View>
                    )}

                    {/* Veg indicator badge */}
                    <View style={styles.vegIndicatorBadge}>
                      <View
                        style={[
                          styles.vegDot,
                          { backgroundColor: dish.isVeg ? colors.veg : colors.nonVeg },
                        ]}
                      />
                    </View>

                    {/* Favorite toggle */}
                    <TouchableOpacity
                      style={styles.favBtn}
                      onPress={() => toggleFavorite(dish.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={favorited ? 'heart' : 'heart-outline'}
                        size={16}
                        color={favorited ? '#EF4444' : '#FFFFFF'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dishInfo}>
                    <Text style={styles.dishName} numberOfLines={1}>
                      {dish.name}
                    </Text>
                    <Text style={styles.dishDesc} numberOfLines={2}>
                      {dish.description || 'Prepared fresh in the Purple Haze kitchen.'}
                    </Text>

                    <View style={styles.dishBottomRow}>
                      <Text style={styles.dishPrice}>{formatCurrency(dish.price)}</Text>
                      <TouchableOpacity
                        style={styles.addDishBtn}
                        onPress={() => {
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
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addDishBtnText}>+ ADD</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Bestseller Dishes Collection */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Popular Bestsellers 🔥</Text>
            <Text style={styles.sectionSubtitle}>Most loved dishes ordered by Biratnagar foodies</Text>
          </View>
        </View>

        <View style={styles.bestsellerGrid}>
          {bestsellers.map((dish) => {
            const favorited = isFavorite(dish.id);
            return (
              <TouchableOpacity
                key={dish.id}
                style={styles.bestsellerRow}
                onPress={() => navigation.navigate('DishDetail', { dish })}
                activeOpacity={0.9}
              >
                <View style={styles.bestsellerLeft}>
                  <View style={styles.vegIndicatorBadgeInline}>
                    <View
                      style={[
                        styles.vegDot,
                        { backgroundColor: dish.isVeg ? colors.veg : colors.nonVeg },
                      ]}
                    />
                    <Text style={styles.bestsellerBadgeText}>
                      {dish.isVeg ? 'VEG' : 'NON-VEG'}
                    </Text>
                  </View>

                  <Text style={styles.bestsellerTitle} numberOfLines={1}>
                    {dish.name}
                  </Text>
                  <Text style={styles.bestsellerPrice}>{formatCurrency(dish.price)}</Text>
                  <Text style={styles.bestsellerDesc} numberOfLines={2}>
                    {dish.description || 'Authentic Himalayan spices and ingredients.'}
                  </Text>
                </View>

                <View style={styles.bestsellerRight}>
                  {dish.image ? (
                    <Image source={{ uri: dish.image }} style={styles.bestsellerImg} />
                  ) : (
                    <View style={[styles.bestsellerImg, styles.dishImagePlaceholder]}>
                      <Ionicons name="restaurant-outline" size={24} color={colors.textMuted} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.bestsellerAddBtn}
                    onPress={() => {
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
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bestsellerAddBtnText}>ADD +</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Restaurant Heritage & Story Card */}
        <View style={styles.heritageCard}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.heritageLogo}
            resizeMode="contain"
          />
          <Text style={styles.heritageTitle}>Purple Haze Restro {'&'} Garden</Text>
          <Text style={styles.heritageText}>
            Established 2015 on Airport Road, Biratnagar. Offering a calm, leafy garden oasis, banquet hall facilities, and multi-cuisine culinary delights.
          </Text>
          <View style={styles.heritageBadges}>
            <Text style={styles.heritagePill}>🌿 Garden Seating</Text>
            <Text style={styles.heritagePill}>🎪 Banquet Hall</Text>
            <Text style={styles.heritagePill}>🛵 Swift Delivery</Text>
          </View>
        </View>

        {/* Bottom spacer for floating cart bar */}
        <View style={{ height: cartItemCount > 0 ? 100 : 40 }} />
      </ScrollView>

      {/* Floating Persistent Cart Summary Bar */}
      {cartItemCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.floatingCartInfo}>
            <View style={styles.cartCountCircle}>
              <Text style={styles.cartCountText}>{cartItemCount}</Text>
            </View>
            <View>
              <Text style={styles.floatingCartLabel}>
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} added
              </Text>
              <Text style={styles.floatingCartTotal}>{formatCurrency(cartSubtotal)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.floatingCartAction}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}
          >
            <Text style={styles.floatingCartActionText}>View Cart</Text>
            <Ionicons name="cart" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greetingGreeting: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  greetingSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  mayaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.purpleMuted,
    borderWidth: 1,
    borderColor: colors.purple,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  mayaIcon: {
    fontSize: 12,
  },
  mayaText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.purple,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    gap: 8,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },
  searchFilterBadge: {
    padding: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  heroScroll: {
    marginBottom: spacing.lg,
  },
  heroContainer: {
    gap: 12,
  },
  heroBanner: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heroBannerContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  heroTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },
  heroSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  heroActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoImg: {
    width: 54,
    height: 54,
  },
  hubSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: 8,
  },
  hubCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  hubIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  hubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  hubDesc: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.purple,
  },
  categoriesScroll: {
    gap: 12,
    paddingBottom: spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  categoryCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  horizontalDishScroll: {
    gap: 12,
    paddingBottom: spacing.lg,
  },
  dishCardH: {
    width: 170,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dishImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 110,
    backgroundColor: colors.backgroundSecondary,
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  dishImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIndicatorBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 3,
    padding: 2,
  },
  vegIndicatorBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bestsellerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  favBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  dishInfo: {
    padding: spacing.sm,
  },
  dishName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  dishDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 14,
    height: 28,
  },
  dishBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.purple,
  },
  addDishBtn: {
    backgroundColor: colors.purple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  addDishBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bestsellerGrid: {
    gap: 10,
    marginBottom: spacing.xl,
  },
  bestsellerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bestsellerLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  bestsellerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  bestsellerPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.purple,
    marginTop: 2,
    marginBottom: 4,
  },
  bestsellerDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  bestsellerRight: {
    position: 'relative',
    alignItems: 'center',
  },
  bestsellerImg: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  bestsellerAddBtn: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.purple,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bestsellerAddBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.purple,
  },
  heritageCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heritageLogo: {
    width: 60,
    height: 60,
    marginBottom: spacing.sm,
  },
  heritageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  heritageText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
  heritageBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.md,
  },
  heritagePill: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.purple,
    backgroundColor: colors.purpleLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    backgroundColor: colors.purple,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingCartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartCountCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
  },
  floatingCartLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  floatingCartTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  floatingCartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
  },
  floatingCartActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
