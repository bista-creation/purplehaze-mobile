import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, LinkingOptions, DefaultTheme, DarkTheme, getStateFromPath } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';
import { VenuesScreen } from '../screens/VenuesScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { DishDetailModal } from '../screens/DishDetailModal';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginModal from '../screens/LoginModal';
import RegisterModal from '../screens/RegisterModal';
import type { MenuDishDto } from '../shared/types';
import type { DishDto } from '../services/api-client';

export type RootStackParamList = {
  MainTabs: undefined;
  DishDetail: { dish: DishDto | MenuDishDto };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string; orderNumber?: string; phone?: string; token?: string };
  Orders: undefined;
  Reservations: undefined;
  Venues: undefined;
  Favorites: undefined;
  Bookings: undefined;
  LoginModal: { returnTo?: 'Profile' } | undefined;
  RegisterModal: { returnTo?: 'Profile' } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Menu: { categoryId?: string } | undefined;
  Orders: undefined;
  Bookings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 5,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t.navigation.home,
          tabBarLabel: t.navigation.home,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
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
        name="Orders"
        component={OrdersScreen}
        options={{
          title: t.navigation.orders,
          tabBarLabel: t.navigation.orders,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: t.navigation.bookings,
          tabBarLabel: t.navigation.bookings,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
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
  prefixes: [
    'purplehaze://',
    'https://purplehaze-mobile.vercel.app',
    'https://purplehaze-nine.vercel.app',
    'http://localhost:8089',
    'http://localhost:8081',
    'http://localhost:3000',
    '/',
  ],
  config: {
    screens: {
      MainTabs: {
        path: '',
        screens: {
          Home: '',
          Menu: 'menu',
          Orders: 'orders',
          Bookings: 'bookings',
          Profile: 'profile',
        },
      },
      Cart: 'cart',
      Reservations: 'reservations',
      Venues: 'venues',
      Favorites: 'favorites',
      OrderTracking: {
        path: 'track-order/:orderId',
      },
      Checkout: 'checkout',
      LoginModal: 'login',
      RegisterModal: 'register',
    },
  },
  getStateFromPath: (path, options) => {
    // Normalize aliases so direct links work seamlessly:
    // /home -> /
    // /orders-tab -> /orders
    let cleanPath = path.replace(/^\/+/, '');
    if (cleanPath === 'home' || cleanPath === '') {
      cleanPath = '';
    } else if (cleanPath === 'orders-tab') {
      cleanPath = 'orders';
    }
    return getStateFromPath(cleanPath, options);
  },
};

export function RootNavigator() {
  const { colors, isDark } = useTheme();

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: colors.purple,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.surfaceBorder,
      notification: colors.gold,
    },
  };

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
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
          name="Cart"
          component={CartScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Reservations"
          component={ReservationsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Venues"
          component={VenuesScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="DishDetail"
          component={DishDetailModal}
          options={{
            presentation: 'modal',
            headerShown: false,
          gestureEnabled: false,
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
          name="Favorites"
          component={FavoritesScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="LoginModal"
          component={LoginModal}
          options={{
            presentation: 'modal',
            headerShown: false,
          gestureEnabled: false,
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
