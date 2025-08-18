import React, { useState } from 'react';
import { SafeAreaView, Text, FlatList, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from "@/layout/PageLayout";
import { useMessage } from "@/context/MessageContext";
import { useAuth } from "@/context/AuthContext";
import type { Conversation } from "@/types/type";
import type { RootStackParamList } from "@/types/type";

type MessageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Message'>;

const ConversationItem = ({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) => {
  const { userData } = useAuth();
  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get the other participant's name (exclude current user)
  const getOtherParticipantName = () => {
    if (!userData) return 'Unknown User';
    
    const otherParticipants = Object.entries(conversation.participants || {})
      .filter(([uid]) => uid !== userData.uid) // Exclude current user
      .map(([, participant]) => `${participant.firstName} ${participant.lastName}`.trim())
      .filter(name => name.length > 0);
    
    return otherParticipants.length > 0 ? otherParticipants.join(', ') : 'Unknown User';
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white p-4 border-b border-gray-200"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="font-semibold text-gray-800 text-base" numberOfLines={1}>
            {conversation.postTitle}
          </Text>
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
            {getOtherParticipantName()}
          </Text>
          <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
            {conversation.lastMessage?.text || 'No messages yet'}
          </Text>
        </View>
        <View className="ml-2">
          <Text className="text-gray-500 text-xs">
            {formatTime(conversation.lastMessage?.timestamp)}
          </Text>
          {conversation.unreadCount && conversation.unreadCount > 0 && (
            <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center mt-1 self-end">
              <Text className="text-white text-xs font-bold">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Message() {
  const navigation = useNavigation<MessageNavigationProp>();
  const { conversations, loading } = useMessage();

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      postTitle: conversation.postTitle
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading conversations...</Text>
        </SafeAreaView>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white border-b border-gray-200 p-4">
          <Text className="text-xl font-bold text-gray-800">Messages</Text>
        </View>
        
        {conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-center">
              No conversations yet.{'\n'}Start a conversation by contacting someone about their post!
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationItem
                conversation={item}
                onPress={() => handleConversationPress(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </PageLayout>
  );
}
