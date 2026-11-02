import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../stores/cart-store';

// Screens
import { MenuScreen } from '../screens/MenuScreen';
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
  LoginModal: undefined;
  RegisterModal: undefined;
};

export type MainTabParamList = {
  Menu: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0b0716' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: '#0f0a1e',
          borderTopColor: 'rgba(168, 85, 247, 0.15)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          title: 'Menu',
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          tabBarLabel: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 'bold' },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'My Orders',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['purplehaze://', 'https://purplehaze-nine.vercel.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Menu: 'menu',
          Cart: 'cart',
          Orders: 'orders',
          Profile: 'profile',
        },
      },
      OrderTracking: {
        path: 'orders/:orderId',
      },
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
          headerStyle: { backgroundColor: '#0b0716' },
          headerTintColor: '#f8fafc',
          contentStyle: { backgroundColor: '#0b0716' },
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
