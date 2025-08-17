import PageLayout from "@/layout/PageLayout";
import { SafeAreaView, Text } from "react-native";

export default function Message() {
  return (
    <PageLayout>
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold">Message Page</Text>
      </SafeAreaView>
    </PageLayout>
  );
}
