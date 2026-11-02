import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "../stores/cart-store";
import type { DishAddOnDto, DishVariantDto, MenuDishDto } from "../shared";

export function DishDetailModal({ route, navigation }: any) {
  const { dish }: { dish: MenuDishDto } = route.params;

  const [selectedVariant, setSelectedVariant] = useState<DishVariantDto | null>(
    dish.variants?.find((v) => v.isDefault) || dish.variants?.[0] || null,
  );
  const [selectedAddOns, setSelectedAddOns] = useState<DishAddOnDto[]>([]);
  const [instructions, setInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);

  const toggleAddOn = (addOn: DishAddOnDto) => {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.id === addOn.id)
        ? prev.filter((a) => a.id !== addOn.id)
        : [...prev, addOn],
    );
  };

  const unitPrice =
    dish.price +
    (selectedVariant?.priceDelta || 0) +
    selectedAddOns.reduce((sum, a) => sum + a.price, 0);

  const totalPrice = (unitPrice * quantity) / 100;

  const handleAddToCart = () => {
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
      instructions: instructions.trim() || undefined,
      quantity,
    });

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dish Image */}
        {dish.image ? (
          <Image source={{ uri: dish.image }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.placeholderImage]}>
            <Ionicons name="restaurant" size={48} color="#7c3aed" />
          </View>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Title and tags */}
          <Text style={styles.title}>{dish.name}</Text>
          <Text style={styles.description}>{dish.description}</Text>

          {/* Variants section */}
          {dish.variants?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Variant</Text>
              <View style={styles.optionsList}>
                {dish.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                      onPress={() => setSelectedVariant(v)}
                    >
                      <View style={styles.radioOuter}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.optionLabel}>{v.name}</Text>
                      {v.priceDelta > 0 && (
                        <Text style={styles.optionPriceDelta}>
                          +Rs. {(v.priceDelta / 100).toFixed(0)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Add-ons section */}
          {dish.addOns?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Optional Add-ons</Text>
              <View style={styles.optionsList}>
                {dish.addOns.map(({ addOn }) => {
                  const isSelected = selectedAddOns.some((a) => a.id === addOn.id);
                  return (
                    <TouchableOpacity
                      key={addOn.id}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                      onPress={() => toggleAddOn(addOn)}
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
                        +Rs. {(addOn.price / 100).toFixed(0)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Special instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cooking Instructions</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Less spicy, extra achar on the side..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={instructions}
              onChangeText={setInstructions}
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
          >
            <Ionicons name="remove" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.min(20, q + 1))}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addCartButton} onPress={handleAddToCart}>
          <Text style={styles.addCartText}>Add to Cart · Rs. {totalPrice}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0716",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImage: {
    width: "100%",
    height: 240,
  },
  placeholderImage: {
    backgroundColor: "#181030",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#cbd5e1",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#160e2c",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
  },
  optionRowSelected: {
    borderColor: "#a855f7",
    backgroundColor: "rgba(124, 58, 237, 0.12)",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#a855f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#a855f7",
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#64748b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxActive: {
    borderColor: "#a855f7",
    backgroundColor: "#a855f7",
  },
  optionLabel: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  optionPriceDelta: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "bold",
  },
  textArea: {
    backgroundColor: "#160e2c",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    minHeight: 70,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#130d24",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 58, 237, 0.2)",
    gap: 14,
  },
  quantityPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e143b",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    paddingHorizontal: 10,
  },
  addCartButton: {
    flex: 1,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addCartText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
