import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "../stores/cart-store";

export function CartScreen({ navigation }: any) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotalNpr = useCartStore((s) => s.getSubtotalNpr());

  const handleClear = () => {
    Alert.alert("Clear Cart", "Are you sure you want to remove all items?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearCart },
    ]);
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart-outline" size={54} color="#a855f7" />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Craving authentic Biratnagar Mo:Mo or spicy Sekuwa?
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate("Menu")}
        >
          <Text style={styles.browseButtonText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Order</Text>
        <TouchableOpacity onPress={handleClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.cartItemId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartCard}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.variantName && (
                  <Text style={styles.itemVariant}>{item.variantName}</Text>
                )}
                {item.addOns.length > 0 && (
                  <Text style={styles.itemAddOns}>
                    + {item.addOns.map((a) => a.name).join(", ")}
                  </Text>
                )}
                {item.instructions && (
                  <Text style={styles.itemNotes}>Note: {item.instructions}</Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => removeItem(item.cartItemId)}
                style={styles.trashBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.itemFooter}>
              <Text style={styles.itemPrice}>
                Rs. {(item.lineTotal / 100).toFixed(0)}
              </Text>

              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.qtyNumber}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Bill summary & checkout bar */}
      <View style={styles.footer}>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Subtotal</Text>
          <Text style={styles.billValue}>Rs. {subtotalNpr.toFixed(0)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate("Checkout")}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: "#130d24",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124, 58, 237, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  clearText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 120,
  },
  cartCard: {
    backgroundColor: "#140e29",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  itemVariant: {
    fontSize: 12,
    color: "#a855f7",
    fontWeight: "600",
    marginBottom: 2,
  },
  itemAddOns: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 11,
    color: "#64748b",
    fontStyle: "italic",
  },
  trashBtn: {
    padding: 4,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#a855f7",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e143b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyNumber: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    paddingHorizontal: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#130d24",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 58, 237, 0.2)",
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  billLabel: {
    color: "#94a3b8",
    fontSize: 14,
  },
  billValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkoutBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  checkoutBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#0b0716",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1a1233",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
