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
import { useMessage } from "../context/MessageContext";

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
  const { isBanned, userData } = useAuth();
  const { getUnreadConversationCount } = useMessage();

  // Calculate unread conversation count for badge
  const unreadCount = userData?.uid
    ? getUnreadConversationCount(userData.uid)
    : 0;

  // NEW: Redirect banned users to login
  useEffect(() => {
    if (isBanned) {
      // User is banned, but don't try to navigate since the parent components handle this
      console.log(
        "User is banned in BottomTabs, redirecting via parent components"
      );
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
        const savedTab = await AsyncStorage.getItem("lastActiveTab");
        if (savedTab && tabs.some((tab) => tab.key === savedTab)) {
          setCurrentTab(savedTab);
        }
      } catch (error) {
        console.log("Failed to load saved tab:", error);
      }
    };

    loadSavedTab();
    setIsInitialized(true);
  }, []);

  // Save tab state when it changes
  useEffect(() => {
    if (isInitialized && currentTab !== previousTabRef.current) {
      AsyncStorage.setItem("lastActiveTab", currentTab);
      previousTabRef.current = currentTab;
    }
  }, [currentTab, isInitialized]);

  // Handle tab press
  const handleTabPress = (tabKey: string) => {
    setCurrentTab(tabKey);
  };

  // Get current tab component
  const CurrentTabComponent =
    tabs.find((tab) => tab.key === currentTab)?.component || HomeScreen;

  // Render only the active tab component to prevent background processing
  const renderActiveTab = () => {
    switch (currentTab) {
      case "MyTickets":
        return <HomeScreen />;
      case "Ticket":
        return <MyTicket />;
      case "CreateReport":
        return <CreateReportScreen />;
      case "Messages":
        return <Message />;
      case "Profile":
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

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

  // Don't render content until tab state is loaded
  if (!isInitialized) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      {/* Main Content - All tabs mounted but only current one visible */}
      <View className="flex-1">{renderActiveTab()}</View>

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
            className="flex-row items-center justify-around mx-4 mb-5"
          >
            {tabs.map((tab) => {
              const isActive = currentTab === tab.key;
              const isAddTab = tab.key === "CreateReport";

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabPress(tab.key)}
                  className="items-center justify-center flex flex-col space-y-1"
                >
                  <View className="relative">
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
                    {/* Badge count for Messages tab */}
                    {tab.key === "Messages" && unreadCount > 0 && (
                      <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
                        <Text className="text-white text-xs font-bold">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
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
