import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../stores/cart-store';
import { useI18n } from '../i18n';
import { colors } from '../theme';

// Screens
import { MenuScreen } from '../screens/MenuScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';
import { VenuesScreen } from '../screens/VenuesScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { DishDetailModal } from '../screens/DishDetailModal';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginModal from '../screens/LoginModal';
import RegisterModal from '../screens/RegisterModal';
import type { MenuDishDto } from '../shared/types';

export type RootStackParamList = {
  MainTabs: undefined;
  DishDetail: { dish: MenuDishDto };
  Checkout: undefined;
  OrderTracking: { orderId: string; orderNumber?: string; phone?: string; token?: string };
  Orders: undefined;
  LoginModal: undefined;
  RegisterModal: undefined;
};

export type MainTabParamList = {
  Menu: undefined;
  Reservations: undefined;
  Venues: undefined;
  Cart: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const itemCount = useCartStore((s) => s.getItemCount());
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          title: t.navigation.menu,
          tabBarLabel: t.navigation.menu,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Reservations"
        component={ReservationsScreen}
        options={{
          title: t.navigation.reservations,
          tabBarLabel: t.navigation.reservations,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Venues"
        component={VenuesScreen}
        options={{
          title: t.navigation.venues,
          tabBarLabel: t.navigation.venues,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t.navigation.cart,
          tabBarLabel: t.navigation.cart,
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.purple, color: '#fff', fontSize: 11, fontWeight: 'bold' },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t.navigation.profile,
          tabBarLabel: t.navigation.profile,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['purplehaze://', 'https://purple-haze-git-feature-api-v1-bistacreation-3818.vercel.app', 'https://purplehaze-nine.vercel.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Menu: 'menu',
          Reservations: 'reservations',
          Venues: 'venues',
          Cart: 'cart',
          Profile: 'profile',
        },
      },
      OrderTracking: {
        path: 'orders/:orderId',
      },
      Orders: 'orders',
      Checkout: 'checkout',
      LoginModal: 'login',
      RegisterModal: 'register',
    },
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DishDetail"
          component={DishDetailModal}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="OrderTracking"
          component={OrderTrackingScreen}
          options={{
            title: 'Track Order',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            title: 'My Orders',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="LoginModal"
          component={LoginModal}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="RegisterModal"
          component={RegisterModal}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
