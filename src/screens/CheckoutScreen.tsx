import React, { useState, useEffect, useMemo } from "react";
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
import type { SavedAddressDto } from "../services/api-client";
import { useCartStore } from "../stores/cart-store";
import { useAuthStore } from "../stores/auth-store";
import { useTheme } from "../stores/theme-store";
import { useI18n } from "../i18n";
import { colors as defaultColors, ColorTheme, spacing, borderRadius } from "../theme";
import type { OrderSummaryDto, PaymentMethod } from "../shared";

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  minOrder: number;
}

function readPaymentCallback(url?: string): { status: string | null; reason: string } {
  if (!url) return { status: null, reason: '' };
  try {
    const callback = new URL(url);
    return {
      status: callback.searchParams.get('status')?.toUpperCase() ?? null,
      reason: callback.searchParams.get('reason') ?? '',
    };
  } catch {
    return { status: null, reason: '' };
  }
}

const DEFAULT_ZONES: DeliveryZone[] = [
  { id: 'zone-airport', name: 'Airport Road & nearby', fee: 3000, minOrder: 25000 },
  { id: 'zone-central', name: 'Central Biratnagar', fee: 5000, minOrder: 30000 },
  { id: 'zone-outer', name: 'Outer Biratnagar', fee: 10000, minOrder: 50000 },
];

export function CheckoutScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t, formatCurrency, isNepali } = useI18n();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [zones, setZones] = useState<DeliveryZone[]>(DEFAULT_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(DEFAULT_ZONES[0].id);

  const [fullNameInput, setFullNameInput] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState<string | null>(null);
  const fullName = fullNameInput ?? user?.name ?? "";
  const email = emailInput ?? user?.email ?? "";
  const phone = phoneInput ?? user?.phone ?? "";
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

  // Fetch live delivery zones from backend
  useEffect(() => {
    api.get<DeliveryZone[]>('/delivery-zones')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setZones(data);
          setSelectedZoneId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Reuse the account's website-saved default address in mobile checkout.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    api.get<SavedAddressDto[]>('/profile/addresses')
      .then((addresses) => {
        if (!active) return;
        const address = addresses.find((item) => item.isDefault) ?? addresses[0];
        if (!address) return;
        setLine1((current) => current || [address.line1, address.line2].filter(Boolean).join(', '));
        setFullNameInput((current) => current ?? address.fullName);
        setPhoneInput((current) => current ?? address.phone);
      })
      .catch(() => {
        // Address lookup is optional; customers can still enter it manually.
      });
    return () => { active = false; };
  }, [user?.id]);

  // Recalculate totals with server on cart/coupon/zone changes
  useEffect(() => {
    let active = true;

    async function recalculate() {
      if (items.length === 0) return;
      setIsCalculating(true);

      try {
        const payload = {
          type: deliveryType,
          zoneId: deliveryType === 'DELIVERY' ? selectedZoneId : undefined,
          couponCode: appliedCoupon?.code,
          items: items.map((i) => ({
            dishId: i.dishId,
            variantId: i.variantId || undefined,
            addOnIds: i.addOns ? i.addOns.map((a) => a.id) : [],
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
  }, [items, deliveryType, appliedCoupon, selectedZoneId]);

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

      const discount = res?.discount ?? (res as any)?.discountPaisa;
      if (res?.valid || discount != null) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountPaisa: discount || 0,
        });
        Alert.alert("Coupon Applied!", `Saved Rs. ${((discount || 0) / 100).toFixed(0)}`);
      } else {
        Alert.alert("Invalid Coupon", res?.reason || "This coupon cannot be applied.");
      }
    } catch (e: any) {
      Alert.alert("Coupon Error", e.message || "Failed to validate coupon.");
    }
  };

  const handlePlaceOrder = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert("Name Required", "Please enter your full name so our kitchen knows who this order is for.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 7) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number (at least 7 digits).");
      return;
    }

    if (deliveryType === "DELIVERY" && (!line1.trim() || line1.trim().length < 4)) {
      Alert.alert("Delivery Address Required", "Please enter your street address or landmark so our rider can deliver your food.");
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = `mob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const orderPayload = {
        details: {
          customerName: trimmedName,
          customerPhone: cleanPhone,
          customerEmail: email.trim() || user?.email || "guest@purplehazebiratnagar.com",
          type: deliveryType,
          paymentMethod,
          line1: deliveryType === "DELIVERY" ? line1.trim() : "",
          city: "Biratnagar",
          zoneId: deliveryType === "DELIVERY" ? selectedZoneId : undefined,
          notes: instructions.trim() || undefined,
          couponCode: appliedCoupon?.code,
        },
        items: items.map((i) => ({
          dishId: i.dishId,
          variantId: i.variantId || undefined,
          addOnIds: i.addOns ? i.addOns.map((a) => a.id) : [],
          quantity: i.quantity,
          instructions: i.instructions || undefined,
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

      let paymentFeedback: { title: string; message: string } | null = null;

      // Digital payment: initiate eSewa / Khalti via in-app browser
      if (paymentMethod === "ESEWA" || paymentMethod === "KHALTI") {
        try {
          const initData = await api.post<any>("/payments/initiate", {
            orderId: result.orderId,
            provider: paymentMethod,
            appScheme: "purplehaze",
            token: result.publicToken,
          });

          if (initData.alreadyPaid && initData.status === 'PAID') {
            paymentFeedback = {
              title: 'Payment complete',
              message: 'This order is already paid and verified.',
            };
          } else if (initData.paymentUrl) {
            const browserResult = await WebBrowser.openAuthSessionAsync(
              initData.paymentUrl,
              "purplehaze://payment-result",
            );
            if (browserResult.type === 'success') {
              const callback = readPaymentCallback('url' in browserResult ? browserResult.url : undefined);
              paymentFeedback = callback.status === 'PAID'
                ? { title: 'Payment complete', message: 'Your transaction was verified by the server.' }
                : { title: 'Payment not confirmed', message: callback.reason || 'The order is placed, but payment is still pending. Check the order status before trying again.' };
            } else {
              paymentFeedback = {
                title: 'Payment pending',
                message: 'The order is placed, but the payment window was closed before confirmation.',
              };
            }
          } else if (initData.formUrl) {
            // eSewa form URL
            const queryParams = new URLSearchParams(initData.params).toString();
            const esewaPayUrl = `${initData.formUrl}?${queryParams}`;
            const browserResult = await WebBrowser.openAuthSessionAsync(
              esewaPayUrl,
              "purplehaze://payment-result",
            );
            if (browserResult.type === 'success') {
              const callback = readPaymentCallback('url' in browserResult ? browserResult.url : undefined);
              paymentFeedback = callback.status === 'PAID'
                ? { title: 'Payment complete', message: 'Your payment was verified by the server.' }
                : { title: 'Payment not confirmed', message: callback.reason || 'The order is placed, but payment is still pending. Check the order status before trying again.' };
            } else {
              paymentFeedback = {
                title: 'Payment pending',
                message: 'The order is placed, but the payment window was closed before confirmation.',
              };
            }
          } else {
            paymentFeedback = {
              title: 'Payment pending',
              message: 'The order is placed, but the payment provider did not return a payment page.',
            };
          }
        } catch (paymentError: any) {
          paymentFeedback = {
            title: 'Order placed · payment pending',
            message: paymentError?.message || 'The order was saved, but payment could not be started. Check its status before trying again.',
          };
        }
      }

      clearCart();
      const openOrderTracking = () => navigation.replace("OrderTracking", {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        phone: phone.trim(),
        token: result.publicToken,
      });

      if (paymentFeedback) {
        Alert.alert(paymentFeedback.title, paymentFeedback.message, [
          { text: t.orders.track, onPress: openOrderTracking },
        ], { cancelable: false });
      } else {
        openOrderTracking();
      }
    } catch (e: any) {
      Alert.alert("Order Failed", e.message || "Failed to place your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Cart');
    }
  };

  const totalNpr = calculation ? calculation.total / 100 : items.reduce((s, i) => s + i.lineTotal, 0) / 100;
  const deliveryFeeNpr = calculation ? calculation.deliveryFee / 100 : deliveryType === "DELIVERY" ? 100 : 0;
  const discountNpr = calculation ? calculation.discountAmount / 100 : 0;

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.cart.checkoutTitle}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Ionicons name="cart-outline" size={60} color={colors.gold} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm }}>
            {t.cart.emptyTitle}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg }}>
            {t.cart.emptySubtitle}
          </Text>
          <TouchableOpacity
            style={[styles.placeOrderBtn, { backgroundColor: colors.purple, paddingHorizontal: spacing.xl, marginTop: spacing.md }]}
            onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Menu' })}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t.cart.exploreMenu}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.cart.checkoutTitle}</Text>
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
              {isNepali ? 'डेलिभरी (विराटनगर)' : 'Delivery (Biratnagar)'}
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
              {isNepali ? 'टेकअवे पिकअप' : 'Takeaway Pickup'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Area / Zone Selection */}
        {deliveryType === "DELIVERY" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.cart.deliveryArea}</Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
              {zones.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                return (
                  <TouchableOpacity
                    key={zone.id}
                    style={[
                      styles.zoneItem,
                      isSelected && styles.zoneItemActive,
                      {
                        borderColor: isSelected ? colors.gold : colors.surfaceBorder,
                        backgroundColor: isSelected ? `${colors.gold}15` : colors.surface,
                      },
                    ]}
                    onPress={() => setSelectedZoneId(zone.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons
                        name={isSelected ? "radio-button-on" : "radio-button-off"}
                        size={18}
                        color={isSelected ? colors.gold : colors.textMuted}
                        style={{ marginRight: spacing.sm }}
                      />
                      <Text
                        style={[
                          styles.zoneName,
                          { color: isSelected ? colors.text : colors.textSecondary },
                        ]}
                      >
                      {isNepali ? ({ 'zone-airport': 'एयरपोर्ट रोड र वरपर', 'zone-central': 'मध्य विराटनगर', 'zone-outer': 'बाहिरी विराटनगर' }[zone.id] || zone.name) : zone.name}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.zoneFee,
                        { color: isSelected ? colors.gold : colors.textMuted },
                      ]}
                    >
                      {formatCurrency(zone.fee)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Customer Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.cart.contactDetails}</Text>
          <TextInput
            style={[styles.input, !fullName.trim() && styles.inputWarning]}
            placeholder={`${t.auth.fullName} *`}
            placeholderTextColor="#64748b"
            value={fullName}
            onChangeText={setFullNameInput}
          />
          {!fullName.trim() && (
            <Text style={styles.fieldHint}>💡 {t.cart.nameHint}</Text>
          )}
          <TextInput
            style={styles.input}
            placeholder={t.cart.emailReceipt}
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmailInput}
          />
          <TextInput
            style={styles.input}
            placeholder={t.cart.phoneRequired}
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhoneInput}
          />
        </View>

        {/* Delivery Address */}
        {deliveryType === "DELIVERY" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.cart.deliveryAddress}</Text>
            <TextInput
              style={[styles.input, !line1.trim() && styles.inputWarning]}
              placeholder={isNepali ? 'सडक, चोक वा चिनारी ठाउँ *' : 'Street name, Chowk, or Landmark *'}
              placeholderTextColor="#64748b"
              value={line1}
              onChangeText={setLine1}
            />
            {!line1.trim() && (
              <Text style={styles.fieldHint}>💡 {t.cart.addressHint}</Text>
            )}

            {/* Quick Landmark Chips */}
            <View style={styles.landmarksContainer}>
              <Text style={styles.landmarksLabel}>{t.cart.popularAreas}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.landmarksScroll}>
                {[
                  'Airport Road',
                  'Traffic Chowk',
                  'Roadcess Chowk',
                  'Bargachhi',
                  'Tintoliya',
                  'Hospital Chowk',
                  'Main Road',
                  'Kanchanbari',
                ].map((landmark) => (
                  <TouchableOpacity
                    key={landmark}
                    style={styles.landmarkChip}
                    onPress={() => setLine1(landmark)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.landmarkChipText}>+ {landmark}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TextInput
              style={[styles.input, styles.instructionsInput]}
              placeholder={t.cart.landmarkPlaceholder}
              placeholderTextColor="#64748b"
              value={instructions}
              onChangeText={setInstructions}
              multiline
            />
          </View>
        )}

        {/* Coupon Code */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.cart.promoCode}</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, styles.couponInput]}
              placeholder={t.cart.couponCode}
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity style={styles.applyCouponBtn} onPress={applyCoupon}>
              <Text style={styles.applyCouponText}>{t.cart.applyCoupon}</Text>
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
          <Text style={styles.cardTitle}>{t.cart.paymentMethod}</Text>

          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === "COD" && styles.paymentRowActive]}
            onPress={() => setPaymentMethod("COD")}
          >
            <Ionicons name="cash-outline" size={20} color="#22c55e" />
            <View style={styles.paymentTextCol}>
              <Text style={styles.paymentName}>{t.cart.cashOnDelivery}</Text>
              <Text style={styles.paymentSub}>{t.cart.payOnArrival}</Text>
            </View>
            <View style={[styles.radioCircle, paymentMethod === "COD" && styles.radioActive]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === "ESEWA" && styles.paymentRowActive]}
            onPress={() => setPaymentMethod("ESEWA")}
          >
            <Ionicons name="wallet-outline" size={20} color="#4ade80" />
            <View style={styles.paymentTextCol}>
              <Text style={styles.paymentName}>eSewa {isNepali ? 'मोबाइल वालेट' : 'Mobile Wallet'}</Text>
              <Text style={styles.paymentSub}>{t.cart.instantVerified}</Text>
            </View>
            <View style={[styles.radioCircle, paymentMethod === "ESEWA" && styles.radioActive]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentRow, paymentMethod === "KHALTI" && styles.paymentRowActive]}
            onPress={() => setPaymentMethod("KHALTI")}
          >
            <Ionicons name="phone-portrait-outline" size={20} color="#a855f7" />
            <View style={styles.paymentTextCol}>
              <Text style={styles.paymentName}>Khalti {isNepali ? 'डिजिटल वालेट' : 'Digital Wallet'}</Text>
              <Text style={styles.paymentSub}>{t.cart.payWithWallet.replace('{wallet}', 'Khalti')}</Text>
            </View>
            <View style={[styles.radioCircle, paymentMethod === "KHALTI" && styles.radioActive]} />
          </TouchableOpacity>

          {/* Fonepay - Phase 2 Merchant Approval Notice */}
          <View style={[styles.paymentRow, styles.paymentRowDisabled]}>
            <Ionicons name="qr-code-outline" size={20} color="#64748b" />
            <View style={styles.paymentTextCol}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.paymentName, { color: "#94a3b8" }]}>Fonepay Direct</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{t.cart.pendingApproval}</Text>
                </View>
              </View>
              <Text style={styles.paymentSub}>{t.cart.merchantOnboarding}</Text>
            </View>
            <View style={[styles.radioCircle, styles.radioCircleDisabled]} />
          </View>
        </View>

        {/* Final Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.cart.orderSummary}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.cart.subtotal}</Text>
            <Text style={styles.summaryVal}>
              {formatCurrency(calculation?.subtotal ?? 0)}
            </Text>
          </View>
          {deliveryType === "DELIVERY" && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t.cart.deliveryFee}</Text>
              <Text style={styles.summaryVal}>{formatCurrency(deliveryFeeNpr)}</Text>
            </View>
          )}
          {discountNpr > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: "#22c55e" }]}>{t.cart.discount}</Text>
              <Text style={[styles.summaryVal, { color: "#22c55e" }]}>
                -{formatCurrency(discountNpr)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t.cart.totalAmount}</Text>
            <Text style={styles.totalVal}>{formatCurrency(totalNpr)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Suggestion banner if name or address missing */}
      {(!fullName.trim() || (deliveryType === "DELIVERY" && !line1.trim())) && (
        <View style={styles.suggestionBanner}>
          <Ionicons name="sparkles" size={16} color={colors.gold} />
          <Text style={styles.suggestionText}>
            {!fullName.trim() && (deliveryType === "DELIVERY" && !line1.trim())
              ? "Please enter your full name and delivery address above to place order."
              : !fullName.trim()
                ? "Please enter your full name above to place order."
                : "Please enter your street or landmark delivery address above."}
          </Text>
        </View>
      )}

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

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.screenTop,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: colors.purple,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  typeTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.md,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.goldText,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  inputWarning: {
    borderColor: 'rgba(216, 173, 104, 0.4)',
  },
  landmarksContainer: {
    marginTop: 2,
    marginBottom: 10,
  },
  landmarksLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  landmarksScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  landmarkChip: {
    backgroundColor: 'rgba(216, 173, 104, 0.12)',
    borderColor: 'rgba(216, 173, 104, 0.35)',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  landmarkChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.goldText,
  },
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(216, 173, 104, 0.12)',
    borderColor: 'rgba(216, 173, 104, 0.35)',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    padding: spacing.md,
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    color: colors.goldText,
    lineHeight: 16,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  zoneItemActive: {
    borderWidth: 1.5,
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '600',
  },
  zoneFee: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    backgroundColor: colors.purple,
    borderRadius: borderRadius.md,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gold,
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
    color: colors.success,
    fontSize: 13,
    fontWeight: "600",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: borderRadius.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  paymentRowActive: {
    borderColor: colors.gold,
    backgroundColor: colors.purpleMuted,
  },
  paymentTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  paymentName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  paymentSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
  },
  radioActive: {
    borderColor: colors.purple,
    backgroundColor: colors.purple,
  },
  paymentRowDisabled: {
    opacity: 0.6,
  },
  radioCircleDisabled: {
    borderColor: colors.textDisabled,
    backgroundColor: "transparent",
  },
  pendingBadge: {
    backgroundColor: colors.warningMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  summaryVal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  totalVal: {
    color: colors.goldText,
    fontSize: 18,
    fontWeight: "bold",
  },
  footerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  placeOrderBtn: {
    backgroundColor: colors.purple,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gold,
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
