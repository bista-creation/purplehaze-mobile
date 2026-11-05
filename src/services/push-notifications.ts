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
