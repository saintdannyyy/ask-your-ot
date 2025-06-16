import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { MessageCircle, Search, User, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    role: string;
  };
  lastMessage: {
    message: string;
    created_at: string;
    read: boolean;
  };
  unreadCount: number;
}

export default function MessagesScreen() {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadConversations();
    }
  }, [userProfile]);

  const loadConversations = async () => {
    if (!userProfile) return;

    try {
      // Get all messages involving the current user
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (*),
          receiver:receiver_id (*)
        `)
        .or(`sender_id.eq.${userProfile.id},receiver_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((message: any) => {
        const otherUserId = message.sender_id === userProfile.id ? message.receiver_id : message.sender_id;
        const otherUser = message.sender_id === userProfile.id ? message.receiver : message.sender;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            otherUser: {
              id: otherUser.id,
              name: otherUser.name,
              role: otherUser.role,
            },
            lastMessage: {
              message: message.message,
              created_at: message.created_at,
              read: message.read,
            },
            unreadCount: 0,
          });
        }

        // Count unread messages from this user
        if (message.receiver_id === userProfile.id && !message.read) {
          const conversation = conversationMap.get(otherUserId)!;
          conversation.unreadCount += 1;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    Alert.alert('Chat', 'Direct messaging will be implemented in the next update!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Chat with your therapists and clients</Text>
      </View>

      <ScrollView
        style={styles.conversationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#14B8A6']} />}
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDescription}>
              {userProfile?.role === 'therapist' 
                ? 'Messages from your clients will appear here.' 
                : 'Start a conversation with a therapist to get help and support.'}
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsContainer}>
            {conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationCard}
                onPress={() => handleOpenConversation(conversation.id)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {conversation.otherUser.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.userName}>{conversation.otherUser.name}</Text>
                    <Text style={styles.timestamp}>
                      {formatTime(conversation.lastMessage.created_at)}
                    </Text>
                  </View>

                  <View style={styles.conversationFooter}>
                    <Text 
                      style={[
                        styles.lastMessage,
                        conversation.unreadCount > 0 && styles.unreadMessage
                      ]}
                      numberOfLines={1}
                    >
                      {conversation.lastMessage.message}
                    </Text>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                          {conversation.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.userRole}>
                    {conversation.otherUser.role === 'therapist' ? 'Therapist' : 'Client'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.floatingActions}>
        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={() => Alert.alert('New Message', 'New message feature will be implemented in the next update!')}
        >
          <MessageCircle size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  conversationsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  conversationsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 2,
  },
  conversationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  unreadBadge: {
    backgroundColor: '#14B8A6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  floatingActions: {
    position: 'absolute',
    bottom: 100,
    right: 24,
  },
  newMessageButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});