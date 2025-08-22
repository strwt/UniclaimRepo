import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useEffect, useState, useRef } from "react";
import { Keyboard, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

// Screens
import HomeScreen from "../app/tabs/Home";
import Message from "../app/tabs/Message";
import ProfileScreen from "../app/tabs/Profile";
import CreateReportScreen from "../app/tabs/Report";
import MyTicket from "../app/tabs/Ticket";

type TabConfig = {
  key: string;
  iconOutline: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
  label: string;
  component: () => JSX.Element;
};

export default function CustomTabs() {
  const [currentTab, setCurrentTab] = useState("MyTickets");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 50;
  const previousTabRef = useRef(currentTab);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isBanned } = useAuth();

  // NEW: Redirect banned users to login
  useEffect(() => {
    if (isBanned) {
      // User is banned, but don't try to navigate since the parent components handle this
      console.log('User is banned in BottomTabs, redirecting via parent components');
    }
  }, [isBanned]);

  // NEW: Don't render tabs if user is banned
  if (isBanned) {
    return null; // This will trigger the parent navigation logic
  }

  const tabs: TabConfig[] = [
    {
      key: "MyTickets",
      iconOutline: "home-outline",
      iconFilled: "home",
      label: "Home",
      component: HomeScreen,
    },
    {
      key: "Ticket",
      iconOutline: "ticket-outline",
      iconFilled: "ticket",
      label: "My Ticket",
      component: MyTicket,
    },
    {
      key: "CreateReport",
      iconOutline: "add-circle",
      iconFilled: "add-circle",
      label: "Create a report",
      component: CreateReportScreen,
    },
    {
      key: "Messages",
      iconOutline: "chatbubble-outline",
      iconFilled: "chatbubble",
      label: "Messages",
      component: Message,
    },
    {
      key: "Profile",
      iconOutline: "person-outline",
      iconFilled: "person",
      label: "Profile",
      component: ProfileScreen,
    },
  ];

  // Load saved tab state on component mount
  useEffect(() => {
    const loadSavedTab = async () => {
      try {
        const savedTab = await AsyncStorage.getItem('lastActiveTab');
        if (savedTab && tabs.some(tab => tab.key === savedTab)) {
          setCurrentTab(savedTab);
        }
      } catch (error) {
        console.log('Error loading saved tab:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadSavedTab();
  }, []);

  useEffect(() => {
    const keyboardShow = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const keyboardHide = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []);

  // Handle tab change with smooth transition
  const handleTabChange = async (newTab: string) => {
    if (newTab !== currentTab) {
      previousTabRef.current = currentTab;
      setCurrentTab(newTab);
      
      // Save the new tab state to AsyncStorage
      try {
        await AsyncStorage.setItem('lastActiveTab', newTab);
      } catch (error) {
        console.log('Error saving tab state:', error);
      }
    }
  };

  // Don't render content until tab state is loaded
  if (!isInitialized) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      {/* Main Content - All tabs mounted but only current one visible */}
      <View className="flex-1">
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className="flex-1"
            style={{ 
              display: currentTab === tab.key ? "flex" : "none",
              // Add smooth opacity transition for better UX
              opacity: currentTab === tab.key ? 1 : 0,
            }}
          >
            <tab.component />
          </View>
        ))}
      </View>

      {/* Bottom Tabs — hidden when keyboard is visible */}
      {!isKeyboardVisible && (
        <View
          className="bg-white"
          style={{
            paddingTop: 15,
            paddingBottom: Math.max(insets.bottom, 3),
            shadowColor: "#00000",
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.32,
            shadowRadius: 6,
            elevation: 20,
          }}
        >
          <View
            style={{ height: TAB_BAR_HEIGHT }}
            className="flex-row items-center justify-around mx-4"
          >
            {tabs.map((tab) => {
              const isActive = currentTab === tab.key;
              const isAddTab = tab.key === "CreateReport";

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabChange(tab.key)}
                  className="items-center justify-center flex flex-col space-y-1"
                >
                  <Ionicons
                    name={isActive ? tab.iconFilled : tab.iconOutline}
                    size={isAddTab ? 28 : 22}
                    color={isActive ? "#0A193A" : "#000"}
                    style={
                      tab.key === "Ticket"
                        ? { transform: [{ rotate: "45deg" }] }
                        : undefined
                    }
                  />
                  <Text
                    className={`text-[9px] font-manrope ${
                      isAddTab ? "mt-1" : "mt-2"
                    } ${isActive ? "text-navyblue" : "text-black"}`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
