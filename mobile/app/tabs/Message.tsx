import React, { useState, useMemo } from 'react';
import { SafeAreaView, Text, FlatList, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from "@/layout/PageLayout";
import { useMessage } from "@/context/MessageContext";
import { useAuth } from "@/context/AuthContext";
import ProfilePicture from "@/components/ProfilePicture";
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

  // Get the other participant's profile picture (exclude current user)
  const getOtherParticipantProfilePicture = () => {
    if (!userData) return null;
    
    const otherParticipant = Object.entries(conversation.participants || {})
      .find(([uid]) => uid !== userData.uid);
    
    return otherParticipant ? otherParticipant[1].profilePicture : null;
  };

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white p-4 border-b border-gray-200"
    >
      <View className="flex-row items-start">
        {/* Profile Picture */}
        <View className="mr-3">
          <ProfilePicture 
            src={getOtherParticipantProfilePicture()} 
            size="md"
          />
        </View>
        
        {/* Conversation Details */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold text-gray-800 text-base" numberOfLines={1}>
                  {conversation.postTitle}
                </Text>
                {/* Post Type Badge */}
                <View className={`px-2 py-1 rounded-full ${conversation.postType === 'found' ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <Text className={`text-xs font-medium ${conversation.postType === 'found' ? 'text-green-800' : 'text-orange-800'}`}>
                    {conversation.postType === 'found' ? 'FOUND' : 'LOST'}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                {getOtherParticipantName()}
              </Text>
              <Text className={`text-sm mt-1 ${conversation.unreadCounts?.[userData?.uid || ''] > 0 ? 'font-bold text-gray-800' : 'text-gray-600'}`} numberOfLines={2}>
                {conversation.lastMessage?.text || 'No messages yet'}
              </Text>
            </View>
            <View className="ml-2">
              <Text className="text-gray-500 text-xs">
                {formatTime(conversation.lastMessage?.timestamp)}
              </Text>
              {/* Get the current user's unread count from this conversation */}
              {conversation.unreadCounts?.[userData?.uid || ''] > 0 && (
                <View className="bg-blue-500 rounded-full w-3 h-3 mt-1 self-end" />
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Message() {
  const navigation = useNavigation<MessageNavigationProp>();
  const { conversations, loading } = useMessage();
  const { isAdmin } = useAuth();

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      postTitle: conversation.postTitle,
      postOwnerId: conversation.postCreatorId, // Add this line
      postId: conversation.postId // Add this line too
    });
  };

  // Sort conversations by most recent message timestamp (newest first)
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      // Get timestamps from last messages
      const aTime = a.lastMessage?.timestamp;
      const bTime = b.lastMessage?.timestamp;

      // Handle conversations without messages
      if (!aTime && !bTime) return 0; // Both have no messages, maintain current order
      if (!aTime) return 1; // Conversation without messages goes to bottom
      if (!bTime) return -1; // Conversation without messages goes to bottom

      // Convert timestamps to comparable values
      const aTimestamp = aTime instanceof Date ? aTime.getTime() : aTime.toDate?.()?.getTime() || 0;
      const bTimestamp = bTime instanceof Date ? bTime.getTime() : bTime.toDate?.()?.getTime() || 0;

      // Sort newest first (descending order)
      return bTimestamp - aTimestamp;
    });
  }, [conversations]);

  if (loading) {
    return (
      <PageLayout>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading conversations...</Text>
        </SafeAreaView>
      </PageLayout>
    );
  }

  // Admin users see a different interface
  if (isAdmin) {
    return (
      <PageLayout>
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="bg-white border-b border-gray-200 p-4">
            <Text className="text-xl font-bold text-gray-800">Admin Panel</Text>
          </View>

          <View className="flex-1 items-center justify-center px-6">
            <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 w-full max-w-sm">
              <Text className="text-lg font-semibold text-gray-800 text-center mb-2">
                Admin Access
              </Text>
              <Text className="text-gray-600 text-center text-sm mb-4">
                You are logged in as an administrator.
              </Text>
              <Text className="text-gray-500 text-center text-xs leading-5">
                For full administrative features, please use the web interface at the admin dashboard.
              </Text>
            </View>
          </View>
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

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Loading conversations...</Text>
          </View>
        ) : sortedConversations.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-center">
              No conversations yet.{'\n'}Start a conversation by contacting someone about their post!
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedConversations}
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
