import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../services/api";
import { mobileRealtime } from "../services/realtime";
import { useCartStore } from "../stores/cart-store";
import type { MenuCategoryDto, MenuDishDto } from "../shared";

export function MenuScreen({ navigation }: any) {
  const [categories, setCategories] = useState<MenuCategoryDto[]>([]);
  const [dishes, setDishes] = useState<MenuDishDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const cartItemCount = useCartStore((s) => s.getItemCount());

  const loadMenu = async () => {
    try {
      const [catData, dishData] = await Promise.all([
        api.get<MenuCategoryDto[]>("/menu/categories"),
        api.get<MenuDishDto[]>("/menu/dishes"),
      ]);
      setCategories(catData || []);
      setDishes(dishData || []);
    } catch (e) {
      console.warn("Failed to load menu", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMenu();

    // Subscribe to live menu availability changes
    let unsubscribe: (() => void) | undefined;
    mobileRealtime
      .subscribeToMenu((payload) => {
        if (payload.type === "dish_availability" && payload.dishId) {
          setDishes((prev) =>
            prev.map((d) =>
              d.id === payload.dishId
                ? { ...d, isAvailable: payload.isAvailable ?? d.isAvailable }
                : d,
            ),
          );
        }
      })
      .then((unsub) => {
        unsubscribe = unsub;
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedCategory && dish.categoryId !== selectedCategory) {
        return false;
      }
      if (vegOnly && !dish.isVeg) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          dish.name.toLowerCase().includes(q) ||
          dish.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dishes, selectedCategory, vegOnly, searchQuery]);

  const handleQuickAdd = (dish: MenuDishDto) => {
    if (!dish.isAvailable) return;
    if (dish.variants?.length > 0 || dish.addOns?.length > 0) {
      navigation.navigate("DishDetail", { dish });
      return;
    }

    addItem({
      dishId: dish.id,
      name: dish.name,
      slug: dish.slug,
      image: dish.image,
      basePrice: dish.price,
      variantPriceDelta: 0,
      addOns: [],
      quantity: 1,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Loading Purple Haze Menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Purple Haze</Text>
          <Text style={styles.headerSubtitle}>Restro & Garden · Biratnagar</Text>
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate("Cart")}
        >
          <Ionicons name="bag-handle-outline" size={24} color="#fff" />
          {cartItemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search & Veg toggle */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search momo, biryani, sekuwa..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.vegToggle, vegOnly && styles.vegToggleActive]}
          onPress={() => setVegOnly(!vegOnly)}
        >
          <Ionicons
            name="leaf-outline"
            size={16}
            color={vegOnly ? "#22c55e" : "#94a3b8"}
          />
          <Text
            style={[styles.vegToggleText, vegOnly && styles.vegToggleTextActive]}
          >
            Veg
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Horizontal Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === null && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === null && styles.categoryPillTextActive,
              ]}
            >
              All Items
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                selectedCategory === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === cat.id && styles.categoryPillTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dish List */}
      <FlatList
        data={filteredDishes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              loadMenu();
            }}
            tintColor="#a855f7"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.dishCard, !item.isAvailable && styles.dishDisabled]}
            onPress={() => navigation.navigate("DishDetail", { dish: item })}
            activeOpacity={0.8}
          >
            <View style={styles.dishInfo}>
              <View style={styles.dishBadgeRow}>
                <View
                  style={[
                    styles.dietBadge,
                    item.isVeg ? styles.vegBadge : styles.nonVegBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.dietDot,
                      item.isVeg ? styles.vegDot : styles.nonVegDot,
                    ]}
                  />
                </View>
                {item.isSpicy && (
                  <Ionicons name="flame" size={14} color="#ef4444" style={{ marginLeft: 4 }} />
                )}
                {item.isFeatured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>Popular</Text>
                  </View>
                )}
              </View>

              <Text style={styles.dishName}>{item.name}</Text>
              <Text style={styles.dishDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.dishPrice}>
                Rs. {(item.price / 100).toFixed(0)}
              </Text>
            </View>

            <View style={styles.dishImageWrapper}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.dishImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.dishImage, styles.placeholderImage]}>
                  <Ionicons name="restaurant-outline" size={28} color="#6b21a8" />
                </View>
              )}

              {item.isAvailable ? (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleQuickAdd(item)}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.soldOutBadge}>
                  <Text style={styles.soldOutText}>Sold Out</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={40} color="#64748b" />
            <Text style={styles.emptyText}>No dishes found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0716",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#0b0716",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#cbd5e1",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: "#130d24",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124, 58, 237, 0.2)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#a855f7",
    fontWeight: "500",
  },
  cartButton: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#a855f7",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1333",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.25)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#fff",
    fontSize: 14,
  },
  vegToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1333",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.25)",
    gap: 4,
  },
  vegToggleActive: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  vegToggleText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  vegToggleTextActive: {
    color: "#22c55e",
  },
  categoriesWrapper: {
    paddingVertical: 12,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "#1a1333",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  categoryPillActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#a855f7",
  },
  categoryPillText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
  },
  categoryPillTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  dishCard: {
    flexDirection: "row",
    backgroundColor: "#140e29",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
  },
  dishDisabled: {
    opacity: 0.6,
  },
  dishInfo: {
    flex: 1,
    paddingRight: 12,
    justifyContent: "space-between",
  },
  dishBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dietBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  vegBadge: {
    borderColor: "#22c55e",
  },
  nonVegBadge: {
    borderColor: "#ef4444",
  },
  dietDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegDot: {
    backgroundColor: "#22c55e",
  },
  nonVegDot: {
    backgroundColor: "#ef4444",
  },
  featuredBadge: {
    marginLeft: 6,
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  featuredBadgeText: {
    color: "#eab308",
    fontSize: 10,
    fontWeight: "bold",
  },
  dishName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  dishDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 16,
    marginBottom: 8,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#a855f7",
  },
  dishImageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  dishImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: "#1e143b",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    left: 4,
    backgroundColor: "#7c3aed",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 2,
  },
  soldOutBadge: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  soldOutText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
  },
});
