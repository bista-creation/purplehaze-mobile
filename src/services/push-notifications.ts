import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let cachedPushToken: string | null = null;

export const pushNotifications = {
  /**
   * Returns the cached Expo push token if available.
   */
  getPushToken(): string | null {
    return cachedPushToken;
  },

  /**
   * Requests user permission, obtains the Expo push token, and registers it with the backend.
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return null;
      }

      // Android requires a notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Purple Haze Orders",
          importance: AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#7c3aed",
          sound: "default",
        });
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error("EAS project ID is missing from the app configuration.");
      }
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      cachedPushToken = token;

      // Register with the backend API
      await api.post("/notifications/push-token", {
        token,
        platform: Platform.OS,
      });

      return token;
    } catch (e) {
      console.warn("Could not register for push notifications:", e);
      return null;
    }
  },

  /**
   * Fires an immediate local sound + banner notification for new orders (for staff / admin).
   */
  async triggerLocalOrderNotification(order: {
    orderNumber: string;
    total: number;
    customerName?: string;
    type?: string;
  }) {
    try {
      const rupees = Math.round((order.total || 0) / 100).toLocaleString('en-IN');
      const orderType = order.type === 'DELIVERY' ? 'Home Delivery' : 'Dine-In/Takeaway';
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 New Order Received! #${order.orderNumber}`,
          body: `${order.customerName ? `${order.customerName} · ` : ''}Rs. ${rupees} (${orderType})`,
          sound: 'default',
          vibrate: [0, 500, 250, 500],
          data: {
            orderNumber: order.orderNumber,
            type: 'NEW_ORDER',
          },
        },
        trigger: null,
      });
    } catch (e) {
      console.warn("Could not trigger local notification:", e);
    }
  },

  /**
   * Sets up a listener for notification taps (when user opens a notification).
   */
  addNotificationResponseListener(
    onNavigate: (data: { orderId?: string; orderNumber?: string; type?: string }) => void,
  ) {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        orderId?: string;
        orderNumber?: string;
        type?: string;
      };
      if (data) {
        onNavigate(data);
      }
    });

    return () => subscription.remove();
  },
};
