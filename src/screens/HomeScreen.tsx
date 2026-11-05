import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
  AppState,
  AppStateStatus,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api as typedApi, DishDto, CategoryDto } from '../services/api-client';
import { useCartStore } from '../stores/cart-store';
import { useFavoritesStore } from '../stores/favorites-store';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../stores/theme-store';
import { useMayaStore } from '../stores/maya-store';
import { useI18n } from '../i18n';
import { Header, Badge, FloatingCartBar } from '../components/ui';
import { isPlaceholderDescription } from '../shared';
import { colors as defaultColors, ColorTheme, spacing, borderRadius, displayFontFamily } from '../theme';

export function HomeScreen({ navigation }: any) {
  const { t, formatCurrency } = useI18n();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { items, addItem, getItemCount, getSubtotalNpr } = useCartStore();
  const { favoriteDishIds, toggleFavorite, isFavorite } = useFavoritesStore();
  const { width: windowWidth } = useWindowDimensions();

  const cardWidth = Math.min(windowWidth - 32, 640);
  const slideGap = 12;
  const snapInterval = cardWidth + slideGap;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [dishes, setDishes] = useState<DishDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const heroScrollRef = useRef<any>(null);
  const activeBannerIndexRef = useRef(0);
  const isInteractingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>((AppState.currentState as AppStateStatus) || 'active');

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
    let active = true;
    Promise.all([
      typedApi.menu.getCategories().catch(() => []),
      typedApi.menu.getDishes().catch(() => []),
    ])
      .then(([catData, dishData]) => {
        if (!active) return;
        setCategories(catData || []);
        setDishes(dishData || []);
      })
      .catch((e) => console.warn('[HomeScreen] Data loading error:', e))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Filter curated collections
  const chefSpecials = useMemo(() => {
    return dishes.slice(0, 6);
  }, [dishes]);

  const bestsellers = useMemo(() => {
    return dishes.slice(2, 8);
  }, [dishes]);

  const promotionalBanners = useMemo(
    () => [
      {
        id: '1',
        title: 'Lush Garden Dining',
        subtitle: 'Experience open-air candlelit evenings & tranquil greenery',
        tag: 'GARDEN & ROOFTOP',
        tagColor: colors.gold,
        imageSource: require('../../assets/banners/garden-dining.jpg'),
        actionText: 'Reserve Table',
        route: 'Reservations',
      },
      {
        id: '2',
        title: 'Flavors of Nepal & Sekuwa',
        subtitle: 'Authentic charcoal smoked delights, Mo:Mo & sizzling platters',
        tag: 'CHEF SPECIALS',
        tagColor: '#F59E0B',
        imageSource: require('../../assets/banners/restaurant.jpg'),
        actionText: 'Order Food',
        route: 'Menu',
      },
      {
        id: '3',
        title: 'Banquets & Celebrations',
        subtitle: 'Air-conditioned banquet halls for weddings & private gatherings',
        tag: 'VENUES & EVENTS',
        tagColor: '#10B981',
        imageSource: require('../../assets/banners/banquet.jpg'),
        actionText: 'Explore Venues',
        route: 'Venues',
      },
    ],
    [colors.gold]
  );

  // Auto-advance hero carousel every 5s; pause on touch interaction or background state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
    });

    const interval = setInterval(() => {
      if (isInteractingRef.current) return;
      if (appStateRef.current !== 'active') return;

      const nextIndex = (activeBannerIndexRef.current + 1) % promotionalBanners.length;
      activeBannerIndexRef.current = nextIndex;
      setActiveBannerIndex(nextIndex);

      heroScrollRef.current?.scrollTo({
        x: nextIndex * snapInterval,
        animated: true,
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [snapInterval, promotionalBanners.length]);

  const handleHeroScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const slide = Math.min(
        Math.max(0, Math.round(offsetX / snapInterval)),
        promotionalBanners.length - 1
      );
      if (slide !== activeBannerIndexRef.current) {
        activeBannerIndexRef.current = slide;
        setActiveBannerIndex(slide);
      }
    },
    [snapInterval, promotionalBanners.length]
  );

  const handleTouchStart = useCallback(() => {
    isInteractingRef.current = true;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 800);
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    isInteractingRef.current = true;
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 800);
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const slide = Math.min(
        Math.max(0, Math.round(offsetX / snapInterval)),
        promotionalBanners.length - 1
      );
      activeBannerIndexRef.current = slide;
      setActiveBannerIndex(slide);
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 400);
    },
    [snapInterval, promotionalBanners.length]
  );

  const handleDotPress = useCallback(
    (index: number) => {
      isInteractingRef.current = false;
      activeBannerIndexRef.current = index;
      setActiveBannerIndex(index);
      heroScrollRef.current?.scrollTo({
        x: index * snapInterval,
        animated: true,
      });
    },
    [snapInterval]
  );

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
          <View style={{ flex: 1, paddingRight: spacing.sm }}>
            <Text style={styles.greetingGreeting}>
              {user?.name ? `Namaste, ${user.name.split(' ')[0]} 👋` : 'Namaste, Guest 👋'}
            </Text>
            <Text style={styles.greetingSubtitle}>Good food. Golden evenings. Garden memories.</Text>
          </View>

          <TouchableOpacity
            style={styles.mayaButton}
            onPress={() => {
              useMayaStore.getState().openMaya();
              navigation.navigate('MayaModal');
            }}
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
            Search dishes, Sekuwa, Mo:Mo, Sizzler, Biryani...
          </Text>
          <View style={styles.searchFilterBadge}>
            <Ionicons name="options-outline" size={14} color={colors.purple} />
          </View>
        </TouchableOpacity>

        {/* Hero Promotional Carousel with Atmospheric Imagery */}
        <ScrollView
          ref={heroScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          snapToAlignment="start"
          style={styles.heroScroll}
          contentContainerStyle={styles.heroContainer}
          onScroll={handleHeroScroll}
          scrollEventThrottle={16}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {promotionalBanners.map((banner) => (
            <View key={banner.id} style={[styles.heroBanner, { width: cardWidth }]}>
              <ImageBackground
                source={banner.imageSource}
                style={styles.heroBannerBg}
                imageStyle={styles.heroBannerImageStyle}
              >
                <View style={styles.heroBannerOverlay}>
                  <View style={[styles.heroTag, { backgroundColor: banner.tagColor }]}>
                    <Text style={styles.heroTagText}>{banner.tag}</Text>
                  </View>
                  <Text style={styles.heroTitle}>{banner.title}</Text>
                  <Text style={styles.heroSubtitle} numberOfLines={2}>
                    {banner.subtitle}
                  </Text>
                  <TouchableOpacity
                    style={styles.heroActionBtn}
                    onPress={() => navigation.navigate(banner.route)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`${banner.actionText} - ${banner.title}`}
                  >
                    <Text style={styles.heroActionText}>{banner.actionText}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>
          ))}
        </ScrollView>

        {/* Synchronized Hero Pagination Dots Indicator */}
        <View style={styles.paginationDotsContainer}>
          {promotionalBanners.map((banner, idx) => {
            const isActive = activeBannerIndex === idx;
            return (
              <TouchableOpacity
                key={banner.id}
                onPress={() => handleDotPress(idx)}
                style={[
                  styles.paginationDot,
                  isActive ? styles.paginationDotActive : styles.paginationDotInactive,
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Go to slide ${idx + 1}: ${banner.title}`}
              />
            );
          })}
        </View>

        {/* Compact Prominent Promotion Section */}
        <TouchableOpacity
          style={styles.promotionCard}
          onPress={() => navigation.navigate('Menu')}
          activeOpacity={0.92}
          accessibilityRole="button"
          accessibilityLabel="Discover today's favourites, explore menu"
        >
          <View style={styles.promotionGlowLine} />
          <View style={styles.promotionRow}>
            <View style={styles.promotionLeft}>
              <View style={styles.promotionBadgeRow}>
                <View style={styles.promotionTag}>
                  <Ionicons name="sparkles" size={11} color={colors.gold} />
                  <Text style={styles.promotionTagText}>FEATURED TODAY</Text>
                </View>
                <Text style={styles.promotionAvailability}>Dine-in · Takeaway · Delivery</Text>
              </View>
              <Text style={styles.promotionTitle}>Discover Today&apos;s Favourites</Text>
              <Text style={styles.promotionSubtitle} numberOfLines={2}>
                Live charcoal Sekuwa, steaming dumplings &amp; chef&apos;s garden specials.
              </Text>
            </View>

            <View style={styles.promotionCta}>
              <View style={styles.promotionCtaBtn}>
                <Text style={styles.promotionCtaText}>Explore</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Primary Action Hub: Ordering & Booking Dominant Paths */}
        <View style={styles.primaryHubContainer}>
          <TouchableOpacity
            style={[styles.primaryActionCard, styles.orderCard]}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.88}
          >
            <View style={styles.primaryBadgeRow}>
              <View style={styles.primaryIconCirclePurple}>
                <Ionicons name="restaurant" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.primaryLivePill}>
                <Text style={styles.primaryLivePillText}>⚡ 30-45 MINS</Text>
              </View>
            </View>
            <Text style={styles.primaryCardTitle}>Order Food</Text>
            <Text style={styles.primaryCardSubtitle}>Delivery & Takeaway</Text>
            <View style={styles.primaryCardCta}>
              <Text style={styles.primaryCardCtaText}>View Menu</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.purple} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionCard, styles.reserveCard]}
            onPress={() => navigation.navigate('Reservations')}
            activeOpacity={0.88}
          >
            <View style={styles.primaryBadgeRow}>
              <View style={styles.primaryIconCircleGold}>
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.primaryGardenPill}>
                <Text style={styles.primaryGardenPillText}>🌿 GARDEN</Text>
              </View>
            </View>
            <Text style={styles.primaryCardTitle}>Book Table</Text>
            <Text style={styles.primaryCardSubtitle}>Dine-in & Rooftop</Text>
            <View style={styles.primaryCardCta}>
              <Text style={[styles.primaryCardCtaText, { color: colors.goldDark }]}>Reserve Now</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.goldDark} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Services Quick Strip */}
        <View style={styles.secondaryStrip}>
          <TouchableOpacity
            style={styles.secondaryItem}
            onPress={() => navigation.navigate('Venues')}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryIconWrap}>
              <Ionicons name="sparkles" size={16} color="#10B981" />
            </View>
            <View>
              <Text style={styles.secondaryTitle}>Banquets & Parties</Text>
              <Text style={styles.secondarySubtitle}>Weddings, Events, Halls</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <View style={styles.secondaryDivider} />

          <TouchableOpacity
            style={styles.secondaryItem}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryIconWrap}>
              <Ionicons name="receipt" size={16} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.secondaryTitle}>My Orders</Text>
              <Text style={styles.secondarySubtitle}>Live GPS status</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Food Categories Carousel with Non-truncated Two-Line Labels */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Explore Categories</Text>
            <Text style={styles.sectionSubtitle}>Handcrafted multi-cuisine selections</Text>
          </View>
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
                <Text style={styles.categoryEmoji}>
                  {/momo/i.test(cat.name)
                    ? '🥟'
                    : /nepali/i.test(cat.name)
                    ? '🥘'
                    : /indian|tandoor|curry/i.test(cat.name)
                    ? '🍛'
                    : /sizzler|continental/i.test(cat.name)
                    ? '🥩'
                    : /beverage|drink|bar/i.test(cat.name)
                    ? '🍹'
                    : '🍽️'}
                </Text>
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chef Specials Section */}
        <View style={styles.sectionHeader}>
          <View>
          <Text style={styles.sectionTitle}>Chef&apos;s Recommendations 👨‍🍳</Text>
            <Text style={styles.sectionSubtitle}>Signature culinary crafts by executive chefs</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.sectionLink}>Full Menu →</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.purple} />
            <Text style={styles.loadingText}>Crafting fresh recommendations...</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dishesScroll}
          >
            {chefSpecials.map((dish) => {
              const favorited = isFavorite(dish.id);
              return (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.dishCard}
                  onPress={() => navigation.navigate('DishDetail', { dish })}
                  activeOpacity={0.9}
                >
                  <View style={styles.dishImageWrap}>
                    {dish.image ? (
                      <Image source={{ uri: dish.image }} style={styles.dishImage} />
                    ) : (
                      <View style={[styles.dishImage, styles.dishImagePlaceholder]}>
                        <Ionicons name="restaurant-outline" size={32} color={colors.textMuted} />
                      </View>
                    )}

                    <View style={styles.vegIndicatorBadge}>
                      <View
                        style={[
                          styles.vegDot,
                          { backgroundColor: dish.isVeg ? colors.veg : colors.nonVeg },
                        ]}
                      />
                    </View>

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
                    {dish.description && !isPlaceholderDescription(dish.description) ? (
                      <Text style={styles.dishDesc} numberOfLines={2}>
                        {dish.description}
                      </Text>
                    ) : null}

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
        {bestsellers.length > 0 && (
          <>
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
                      {dish.description && !isPlaceholderDescription(dish.description) ? (
                        <Text style={styles.bestsellerDesc} numberOfLines={2}>
                          {dish.description}
                        </Text>
                      ) : null}
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
          </>
        )}

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

        {/* Bottom spacer ensuring fixed navigation bar never covers content */}
        <View style={{ height: cartItemCount > 0 ? 80 : 24 }} />
      </ScrollView>

      {/* Floating Persistent Cart Summary Bar (Safely above Bottom Tabs) */}
      <FloatingCartBar onPress={() => navigation.navigate('Cart')} />
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
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
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
    fontSize: 12,
    color: colors.textSecondary,
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
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  searchFilterBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.purpleMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScroll: {
    marginBottom: 10,
  },
  heroContainer: {
    gap: 12,
  },
  heroBanner: {
    height: 180,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBannerBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroBannerImageStyle: {
    borderRadius: borderRadius.xl,
  },
  heroBannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 11, 29, 0.62)',
    padding: spacing.md,
    justifyContent: 'flex-end',
    borderRadius: borderRadius.xl,
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
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontFamily: displayFontFamily,
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 4,
    marginBottom: 10,
    fontWeight: '500',
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.purple,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  heroActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Carousel Pagination Dots */
  paginationDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginBottom: spacing.md,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 22,
    backgroundColor: colors.gold,
  },
  paginationDotInactive: {
    width: 6,
    backgroundColor: colors.surfaceBorderLight,
  },

  /* Compact Prominent Promotion Section */
  promotionCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  promotionGlowLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.gold,
  },
  promotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  promotionLeft: {
    flex: 1,
    paddingRight: 6,
  },
  promotionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  promotionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  promotionTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 0.5,
  },
  promotionAvailability: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  promotionTitle: {
    fontFamily: displayFontFamily,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  promotionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  promotionCta: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotionCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.purple,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  promotionCtaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Primary Hub: Ordering & Booking */
  primaryHubContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  primaryActionCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderColor: colors.purpleLight,
  },
  reserveCard: {
    backgroundColor: colors.surface,
    borderColor: colors.goldLight,
  },
  primaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryIconCirclePurple: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryIconCircleGold: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.goldDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryLivePill: {
    backgroundColor: colors.purpleMuted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  primaryLivePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.purple,
    letterSpacing: 0.5,
  },
  primaryGardenPill: {
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  primaryGardenPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 0.5,
  },
  primaryCardTitle: {
    fontFamily: displayFontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  primaryCardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  primaryCardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  primaryCardCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.purple,
  },

  /* Secondary Hub Strip */
  secondaryStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  secondaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  secondarySubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  secondaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: 10,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: displayFontFamily,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.purple,
  },

  /* Categories */
  categoriesScroll: {
    gap: 10,
    paddingBottom: spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    width: 82,
    marginRight: 4,
  },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 2,
  },

  /* Dishes */
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dishesScroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  dishCard: {
    width: 175,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dishImageWrap: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: colors.surfaceElevated,
  },
  dishImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    flex: 1,
    justifyContent: 'space-between',
  },
  dishName: {
    fontFamily: displayFontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  dishDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 13,
    marginBottom: 8,
  },
  dishBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  addDishBtn: {
    backgroundColor: colors.purple,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
  },
  addDishBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Bestsellers */
  bestsellerGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  bestsellerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
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
  vegIndicatorBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bestsellerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  bestsellerTitle: {
    fontFamily: displayFontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.1,
  },
  bestsellerPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.purple,
    marginVertical: 2,
  },
  bestsellerDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  bestsellerRight: {
    alignItems: 'center',
    position: 'relative',
  },
  bestsellerImg: {
    width: 90,
    height: 80,
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
  },
  dishImagePlaceholder: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestsellerAddBtn: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.purple,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bestsellerAddBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.purple,
  },

  /* Heritage */
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
    marginBottom: 8,
  },
  heritageTitle: {
    fontFamily: displayFontFamily,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  heritageText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
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

  /* Floating Cart Bar (Above Bottom Tab Navigator) */
  floatingCartBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 76 : 70,
    left: 16,
    right: 16,
    maxWidth: 680,
    alignSelf: 'center',
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
