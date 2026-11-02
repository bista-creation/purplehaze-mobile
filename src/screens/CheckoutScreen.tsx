import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../services/api";
import { useCartStore } from "../stores/cart-store";
import { useAuthStore } from "../stores/auth-store";
import type { OrderSummaryDto, PaymentMethod } from "../shared";

export function CheckoutScreen({ navigation }: any) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);

  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [line1, setLine1] = useState("");
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaisa: number;
  } | null>(null);

  const [calculation, setCalculation] = useState<OrderSummaryDto | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate totals with server on cart/coupon changes
  useEffect(() => {
    let active = true;

    async function recalculate() {
      if (items.length === 0) return;
      setIsCalculating(true);

      try {
        const payload = {
          type: deliveryType,
          couponCode: appliedCoupon?.code,
          items: items.map((i) => ({
            dishId: i.dishId,
            variantId: i.variantId,
            addOnIds: i.addOns.map((a) => a.id),
            quantity: i.quantity,
          })),
        };

        const result = await api.post<OrderSummaryDto>(
          "/checkout/calculate",
          payload,
        );

        if (active) {
          setCalculation(result);
        }
      } catch (e) {
        console.warn("Server calculation failed", e);
      } finally {
        if (active) setIsCalculating(false);
      }
    }

    recalculate();
    return () => {
      active = false;
    };
  }, [items, deliveryType, appliedCoupon]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const subtotalPaisa = items.reduce((sum, i) => sum + i.lineTotal, 0);
      const res = await api.post<{ valid: boolean; discount: number; reason?: string }>(
        "/coupons/validate",
        {
          code: couponCode.trim(),
          subtotal: subtotalPaisa,
        },
      );

      if (res.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountPaisa: res.discount,
        });
        Alert.alert("Coupon Applied!", `Saved Rs. ${(res.discount / 100).toFixed(0)}`);
      } else {
        Alert.alert("Invalid Coupon", res.reason || "This coupon cannot be applied.");
      }
    } catch (e: any) {
      Alert.alert("Coupon Error", e.message || "Failed to validate coupon.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert("Missing Details", "Please provide your name and contact phone.");
      return;
    }

    if (deliveryType === "DELIVERY" && !line1.trim()) {
      Alert.alert("Missing Address", "Please enter your delivery street / landmark.");
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = `mob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const orderPayload = {
        details: {
          customerName: fullName.trim(),
          customerPhone: phone.trim(),
          customerEmail: user?.email || "guest@purplehazebiratnagar.com",
          type: deliveryType,
          paymentMethod,
          deliveryAddress: deliveryType === "DELIVERY" ? line1.trim() : undefined,
          notes: instructions.trim() || undefined,
          couponCode: appliedCoupon?.code,
        },
        items: items.map((i) => ({
          dishId: i.dishId,
          variantId: i.variantId,
          addOnIds: i.addOns.map((a) => a.id),
          quantity: i.quantity,
          instructions: i.instructions,
        })),
        idempotencyKey,
      };

      const result = await api.post<{
        orderId: string;
        orderNumber: string;
        publicToken: string;
        total: number;
      }>("/orders", orderPayload, {
        "idempotency-key": idempotencyKey,
      });

      // Digital payment: initiate eSewa / Khalti via in-app browser
      if (paymentMethod === "ESEWA" || paymentMethod === "KHALTI") {
        const initData = await api.post<any>("/payments/initiate", {
          orderId: result.orderId,
          provider: paymentMethod,
          appScheme: "purplehaze",
        });

        if (initData.paymentUrl) {
          // Khalti flow
          const browserResult = await WebBrowser.openAuthSessionAsync(
            initData.paymentUrl,
            "purplehaze://payment-result",
          );

          if (browserResult.type === "success") {
            // Server-side verification is executed on callback
            Alert.alert("Payment Complete", "Your transaction has been verified!");
          }
        } else if (initData.formUrl) {
          // eSewa form URL
          const queryParams = new URLSearchParams(initData.params).toString();
          const esewaPayUrl = `${initData.formUrl}?${queryParams}`;

          const browserResult = await WebBrowser.openAuthSessionAsync(
            esewaPayUrl,
            "purplehaze://payment-result",
          );

          if (browserResult.type === "success") {
            Alert.alert("Payment Complete", "Your payment has been verified!");
          }
        }
      }

      clearCart();

      navigation.replace("OrderTracking", {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        token: result.publicToken,
      });
    } catch (e: any) {
      Alert.alert("Order Failed", e.message || "Failed to place your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalNpr = calculation ? calculation.total / 100 : items.reduce((s, i) => s + i.lineTotal, 0) / 100;
  const deliveryFeeNpr = calculation ? calculation.deliveryFee / 100 : deliveryType === "DELIVERY" ? 100 : 0;
  const discountNpr = calculation ? calculation.discountAmount / 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeBtn, deliveryType === "DELIVERY" && styles.typeBtnActive]}
            onPress={() => setDeliveryType("DELIVERY")}
          >
            <Ionicons
              name="bicycle"
              size={18}
              color={deliveryType === "DELIVERY" ? "#fff" : "#94a3b8"}
            />
            <Text
              style={[styles.typeText, deliveryType === "DELIVERY" && styles.typeTextActive]}
            >
              Delivery (Biratnagar)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, deliveryType === "PICKUP" && styles.typeBtnActive]}
            onPress={() => setDeliveryType("PICKUP")}
          >
            <Ionicons
              name="restaurant-outline"
              size={18}
              color={deliveryType === "PICKUP" ? "#fff" : "#94a3b8"}
            />
            <Text
              style={[styles.typeText, deliveryType === "PICKUP" && styles.typeTextActive]}
            >
              Takeaway Pickup
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#64748b"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g. 9800000000)"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Delivery Address */}
        {deliveryType === "DELIVERY" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Street name, Chowk, or Landmark"
              placeholderTextColor="#64748b"
              value={line1}
              onChangeText={setLine1}
            />
            <TextInput
              style={[styles.input, styles.instructionsInput]}
              placeholder="Landmark instructions (e.g. Near Airport Road, green gate)"
              placeholderTextColor="#64748b"
              value={instructions}
              onChangeText={setInstructions}
              multiline
            />
          </View>
        )}

        {/* Coupon Code */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Promo Code</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, styles.couponInput]}
              placeholder="Enter coupon code"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity style={styles.applyCouponBtn} onPress={applyCoupon}>
              <Text style={styles.applyCouponText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {appliedCoupon && (
            <View style={styles.appliedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.appliedText}>
                Coupon {appliedCoupon.code} applied (-Rs.{" "}
                {(appliedCoupon.discountPaisa / 100).toFixed(0)})
              </Text>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === "COD" && styles.paymentRowActive]}
            onPress={() => setPaymentMethod("COD")}
          >
            <Ionicons name="cash-outline" size={20} color="#22c55e" />
            <View style={styles.paymentTextCol}>
              <Text style={styles.paymentName}>Cash on Delivery</Text>
              <Text style={styles.paymentSub}>Pay when your order arrives</Text>
            </View>
            <View style={[styles.radioCircle, paymentMethod === "COD" && styles.radioActive]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === "ESEWA" && styles.paymentRowActive]}
            onPress={() => setPaymentMethod("ESEWA")}
          >
            <Ionicons name="wallet-outline" size={20} color="#4ade80" />
            <View style={styles.paymentTextCol}>
              <Text style={styles.paymentName}>eSewa Mobile Wallet</Text>
              <Text style={styles.paymentSub}>Instant & verified digital payment</Text>
            </View>
            <View style={[styles.radioCircle, paymentMethod === "ESEWA" && styles.radioActive]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === "KHALTI" && styles.paymentRowActive]}
            onPress={() => setPaymentMethod("KHALTI")}
          >
            <Ionicons name="phone-portrait-outline" size={20} color="#a855f7" />
            <View style={styles.paymentTextCol}>
              <Text style={styles.paymentName}>Khalti Digital Wallet</Text>
              <Text style={styles.paymentSub}>Pay with Khalti app or eBanking</Text>
            </View>
            <View style={[styles.radioCircle, paymentMethod === "KHALTI" && styles.radioActive]} />
          </TouchableOpacity>
        </View>

        {/* Final Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>
              Rs. {((calculation?.subtotal ?? 0) / 100).toFixed(0)}
            </Text>
          </View>
          {deliveryType === "DELIVERY" && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryVal}>Rs. {deliveryFeeNpr.toFixed(0)}</Text>
            </View>
          )}
          {discountNpr > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: "#22c55e" }]}>Discount</Text>
              <Text style={[styles.summaryVal, { color: "#22c55e" }]}>
                -Rs. {discountNpr.toFixed(0)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>Rs. {totalNpr.toFixed(0)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Bar */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, isSubmitting && styles.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>
                Place Order · Rs. {totalNpr.toFixed(0)}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: "#130d24",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124, 58, 237, 0.2)",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 14,
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#160e2c",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: "#7c3aed",
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
  },
  typeTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#140e29",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#cbd5e1",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1c1436",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
  },
  instructionsInput: {
    height: 60,
    textAlignVertical: "top",
  },
  couponRow: {
    flexDirection: "row",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    marginBottom: 0,
  },
  applyCouponBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  applyCouponText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  appliedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  appliedText: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "600",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1233",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
  },
  paymentRowActive: {
    borderColor: "#a855f7",
    backgroundColor: "rgba(124, 58, 237, 0.15)",
  },
  paymentTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  paymentName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  paymentSub: {
    color: "#94a3b8",
    fontSize: 12,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#64748b",
  },
  radioActive: {
    borderColor: "#a855f7",
    backgroundColor: "#a855f7",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: 14,
  },
  summaryVal: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalVal: {
    color: "#a855f7",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#130d24",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 58, 237, 0.2)",
  },
  placeOrderBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
