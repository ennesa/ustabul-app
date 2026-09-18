import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect, useState } from "react";
import { Platform, StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { COLORS } from "./src/constants/colors";
import PhoneLoginScreen from "./src/screens/PhoneLoginScreen";
// --- CONTEXT IMPORTLARI ---
import { AuthProvider } from "./src/context/AuthContext";
import { JobProvider } from "./src/context/JobContext";
import { UIProvider } from "./src/context/UIContext";

import * as Notifications from "expo-notifications";
// Sayfalar
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import LegalScreen from "./src/screens/LegalScreen";
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
// Müşteri
import CustomerHomeScreen from "./src/screens/CustomerHomeScreen";
import CustomerProfileScreen from "./src/screens/CustomerProfileScreen";
import CustomerScreen from "./src/screens/CustomerScreen";
import CustomerWalletScreen from "./src/screens/CustomerWalletScreen";
import MyJobsScreen from "./src/screens/MyJobsScreen";

// Usta
import ProOffersScreen from "./src/screens/ProOffersScreen";
import ProProfileScreen from "./src/screens/ProProfileScreen";
import ProScreen from "./src/screens/ProScreen";
import ProSubscriptionScreen from "./src/screens/ProSubscriptionScreen";
import ProWalletScreen from "./src/screens/ProWalletScreen";

// Ortak
import ChatScreen from "./src/screens/ChatScreen";
import NotificationScreen from "./src/screens/NotificationScreen";
import ProDetailScreen from "./src/screens/ProDetailScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import StoreScreen from "./src/screens/StoreScreen";

// --- EKSİK OLAN SAYFA IMPORT EDİLDİ ---
import EditJobScreen from "./src/screens/EditJobScreen";
import JobDetailScreen from "./src/screens/JobDetailScreen";
import KVKKSettingsScreen from "./src/screens/KVKKSettingsScreen";
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- DİNAMİK TAB AYARLARI ---
const getTabOptions = (route) => ({
  headerShown: false,
  tabBarShowLabel: false,
  tabBarStyle: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#ffffff",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    borderTopWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBarIcon: ({ focused, color, size }) => {
    let iconName;

    if (route.name === "Ana Sayfa" || route.name === "İş Fırsatları") {
      iconName = "home";
    } else if (route.name === "İlanlarım") {
      iconName = "document-text";
    } else if (route.name === "Tekliflerim") {
      iconName = "briefcase";
    } else if (route.name === "Cüzdan") {
      iconName = "wallet";
    } else if (route.name === "Profil") {
      iconName = "person";
    }

    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          top: Platform.OS === "ios" ? 15 : 0,
        }}
      >
        <View
          style={{
            width: focused ? 50 : 40,
            height: focused ? 50 : 40,
            borderRadius: 25,
            backgroundColor: focused ? COLORS.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: focused ? 5 : 0,
            shadowColor: focused ? COLORS.primary : "transparent",
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: focused ? 5 : 0,
          }}
        >
          <Ionicons
            name={focused ? iconName : `${iconName}-outline`}
            size={24}
            color={focused ? "white" : "#94a3b8"}
          />
        </View>
      </View>
    );
  },
});

// --- MÜŞTERİ MENÜSÜ ---
function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => getTabOptions(route)}>
      <Tab.Screen name="Ana Sayfa" component={CustomerHomeScreen} />
      <Tab.Screen name="İlanlarım" component={MyJobsScreen} />
      <Tab.Screen name="Profil" component={CustomerProfileScreen} />
    </Tab.Navigator>
  );
}

// --- USTA MENÜSÜ ---
function ProTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => getTabOptions(route)}>
      <Tab.Screen name="İş Fırsatları" component={ProScreen} />
      <Tab.Screen name="Tekliflerim" component={ProOffersScreen} />
      <Tab.Screen name="Cüzdan" component={ProWalletScreen} />
      <Tab.Screen name="Profil" component={ProProfileScreen} />
    </Tab.Navigator>
  );
}

// --- ANA İÇERİK ---
function MainContent() {
  const [currentRoute, setCurrentRoute] = useState("Onboarding");

  useEffect(() => {
    async function enableFullScreen() {
      if (Platform.OS === "android") {
        await NavigationBar.setVisibilityAsync("hidden");
      }
    }
    enableFullScreen();
  }, []);

  return (
    <NavigationContainer
      onStateChange={(state) => {
        const getRouteName = (routeState) => {
          if (!routeState) return null;
          const route = routeState.routes[routeState.index];
          if (route.state) return getRouteName(route.state);
          return route.name;
        };
        const current = getRouteName(state);
        setCurrentRoute(current);
      }}
    >
      <StatusBar hidden={true} />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Onboarding"
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* TAB MENÜLERİ */}
        <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        <Stack.Screen name="ProTabs" component={ProTabs} />

        {/* DİĞER SAYFALAR */}
        <Stack.Screen
          name="Legal"
          component={LegalScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="MyJobsScreen" component={MyJobsScreen} />
        <Stack.Screen name="CreateJob" component={CustomerScreen} />
        <Stack.Screen name="ProDetail" component={ProDetailScreen} />
        <Stack.Screen
          name="NotificationScreen"
          component={NotificationScreen}
        />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="KVKKSettings"
          component={KVKKSettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProSubscriptionScreen"
          component={ProSubscriptionScreen}
        />
        <Stack.Screen name="Store" component={StoreScreen} />
        <Stack.Screen
          name="CustomerProfileScreen"
          component={CustomerProfileScreen}
        />
        <Stack.Screen name="ProProfileScreen" component={ProProfileScreen} />
        <Stack.Screen name="ProOffersScreen" component={ProOffersScreen} />

        {/* ✅ EKLENENLER: Hataları Çözen Satırlar */}
        <Stack.Screen name="JobDetail" component={JobDetailScreen} />
        <Stack.Screen name="EditJob" component={EditJobScreen} />
        <Stack.Screen name="CustomerWallet" component={CustomerWalletScreen} />

        {/* ProProfile ismini de stack'e ekliyoruz ki nav hatası vermesin */}
        <Stack.Screen name="ProProfile" component={ProProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export const navigationRef = createNavigationContainerRef();
export default function App() {
  // --- YENİ EKLENEN KISIM BAŞLANGIÇ ---
  useEffect(() => {
    // Bildirime tıklandığında (Response Received) çalışır
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        // Navigasyon hazır mı kontrol et
        if (navigationRef.isReady()) {
          // CHAT BİLDİRİMİ İSE
          if (data.type === "CHAT" && data.ustaName && data.targetUserId) {
            navigationRef.navigate("ChatScreen", {
              ustaName: data.ustaName,
              targetUserId: data.targetUserId,
              currentUserRole: data.currentUserRole, // Bunu gönderdiğinden emin ol
            });
          }

          // İŞ/TEKLİF BİLDİRİMİ İSE (Senin aradığın çözüm)
          else if (data.type === "JOB" && data.jobId) {
            navigationRef.navigate("JobDetail", {
              job: { id: data.jobId }, // JobDetail genelde bir obje bekliyor
            });
          }

          // SİSTEM BİLDİRİMİ İSE
          else if (data.type === "SYSTEM") {
            navigationRef.navigate("NotificationScreen", { role: "customer" });
          }
        }
      },
    );

    return () => subscription.remove();
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UIProvider>
          <JobProvider>
            <MainContent />
          </JobProvider>
        </UIProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
