import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { api } from "./api";
import {
  REALTIME_CHANNELS,
  REALTIME_EVENTS,
  type MenuUpdatedPayload,
  type OrderStatusUpdatedPayload,
} from "../shared";

type RealtimeAuthResponse = {
  url: string;
  anonKey: string;
  token: string;
  channels: string[];
};

class MobileRealtimeService {
  private client: SupabaseClient | null = null;
  private channels = new Map<string, RealtimeChannel>();

  async getClient(): Promise<SupabaseClient | null> {
    if (this.client) return this.client;

    try {
      const authData = await api.post<RealtimeAuthResponse>("/realtime/auth", {});
      if (!authData?.url || !authData?.anonKey || !authData?.token) {
        return null;
      }

      this.client = createClient(authData.url, authData.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 5 } },
      });

      await this.client.realtime.setAuth(authData.token);
      return this.client;
    } catch (e) {
      console.warn("[Realtime] Could not initialize Supabase Realtime client", e);
      return null;
    }
  }

  /**
   * Subscribes to live status updates for a specific order.
   */
  async subscribeToOrder(
    orderId: string,
    onStatusUpdate: (payload: OrderStatusUpdatedPayload) => void,
  ): Promise<() => void> {
    const topic = REALTIME_CHANNELS.orderTracking(orderId);
    const client = await this.getClient();
    if (!client) return () => {};

    if (this.channels.has(topic)) {
      this.channels.get(topic)?.unsubscribe();
    }

    const channel = client
      .channel(topic)
      .on(
        "broadcast",
        { event: REALTIME_EVENTS.orderStatusUpdated },
        (response: { payload: OrderStatusUpdatedPayload }) => {
          onStatusUpdate(response.payload);
        },
      )
      .subscribe();

    this.channels.set(topic, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(topic);
    };
  }

  /**
   * Subscribes to public menu availability changes (dish sold out / restored).
   */
  async subscribeToMenu(
    onMenuUpdate: (payload: MenuUpdatedPayload) => void,
  ): Promise<() => void> {
    const topic = REALTIME_CHANNELS.publicMenu;
    const client = await this.getClient();
    if (!client) return () => {};

    if (this.channels.has(topic)) {
      this.channels.get(topic)?.unsubscribe();
    }

    const channel = client
      .channel(topic)
      .on(
        "broadcast",
        { event: REALTIME_EVENTS.menuUpdated },
        (response: { payload: MenuUpdatedPayload }) => {
          onMenuUpdate(response.payload);
        },
      )
      .subscribe();

    this.channels.set(topic, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(topic);
    };
  }

  disconnectAll() {
    this.channels.forEach((ch) => ch.unsubscribe());
    this.channels.clear();
    this.client = null;
  }
}

export const mobileRealtime = new MobileRealtimeService();
