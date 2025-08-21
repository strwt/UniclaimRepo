import React, { useState, useEffect, useRef } from 'react';
import { 
  SafeAreaView, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  View, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from "@expo/vector-icons";
import { useMessage } from "@/context/MessageContext";
import { useAuth } from "@/context/AuthContext";
import type { Message } from "@/types/type";
import type { RootStackParamList } from "@/types/type";

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

const MessageBubble = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View className={`mb-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
      <View 
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isOwnMessage 
            ? 'bg-blue-500 rounded-br-md' 
            : 'bg-gray-200 rounded-bl-md'
        }`}
      >
        <Text 
          className={`text-base ${
            isOwnMessage ? 'text-white' : 'text-gray-800'
          }`}
        >
          {message.text}
        </Text>
      </View>
      <Text className="text-xs text-gray-500 mt-1 mx-2">
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
};

export default function Chat() {
  const navigation = useNavigation<ChatNavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { conversationId: initialConversationId, postTitle, postId, postOwnerId, postOwnerUserData } = route.params;
  
  const { sendMessage, createConversation, getConversationMessages } = useMessage();
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId || '');
  const flatListRef = useRef<FlatList>(null);
  
  if (!user || !userData) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Please log in to send messages</Text>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    if (conversationId) {
      // Load messages for existing conversation
      const unsubscribe = getConversationMessages(conversationId, (loadedMessages) => {
        setMessages(loadedMessages);
        scrollToBottom();
      });
      return () => unsubscribe();
    }
  }, [conversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleCreateConversation = async () => {
    if (!postId || !postOwnerId) {
      Alert.alert('Error', 'Missing post information');
      return;
    }

    try {
      setLoading(true);
      const newConversationId = await createConversation(
        postId,
        postTitle,
        postOwnerId,
        user.uid,
        userData,
        postOwnerUserData // Pass the post owner's user data
      );
      setConversationId(newConversationId);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!conversationId) {
      await handleCreateConversation();
      if (!conversationId) return;
    }

    try {
      await sendMessage(
        conversationId,
        user.uid,
        `${userData.firstName} ${userData.lastName}`,
        newMessage.trim(),
        userData.profileImageUrl
      );
      setNewMessage('');
      scrollToBottom();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4 flex-row items-center">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-semibold text-lg text-gray-800" numberOfLines={1}>
            {postTitle}
          </Text>
          <Text className="text-sm text-gray-500">
            {postOwnerId && userData ? 
              (postOwnerId === userData.uid ? 'Your post' : 'Chat with post owner') : 
              'About this lost/found item'
            }
          </Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Creating conversation...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-4">
              Start the conversation about "{postTitle}"
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwnMessage={item.senderId === user.uid}
              />
            )}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          />
        )}

        {/* Message Input */}
        <View className="border-t border-gray-200 bg-white p-4">
          <View className="flex-row items-center space-x-3">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 text-base"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                newMessage.trim() && !loading 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300'
              }`}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={newMessage.trim() && !loading ? 'white' : '#9CA3AF'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
