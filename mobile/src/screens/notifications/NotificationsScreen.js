import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { notificationsApi } from '../../api/notifications';
import { Ionicons } from '@expo/vector-icons';
import OnboardingBanner from '../../components/common/OnboardingBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsApi.getNotifications();
      return res.data || res || [];
    },
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleMarkAsRead = async (id) => {
    queryClient.setQueryData(['notifications'], (prev) =>
      (prev || []).map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await notificationsApi.markAsRead(id);
    } catch (e) {
      console.warn('Failed to mark notification as read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    queryClient.setQueryData(['notifications'], (prev) =>
      (prev || []).map((n) => ({ ...n, is_read: true }))
    );
    try {
      await notificationsApi.markAllAsRead();
    } catch (e) {
      console.warn('Failed to mark all notifications as read:', e);
      refetch();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.title}>Alerts & Notices</Text>
          <Text style={styles.subtitle}>Activity updates and platform announcements</Text>
        </View>

        {notifications.some((n) => !n.is_read) && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <OnboardingBanner />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.magenta[500]} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.magenta[400]}
            />
          }
          renderItem={({ item }) => {
            const isRead = item.is_read;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => !isRead && handleMarkAsRead(item.id)}
              >
                <Card style={[styles.notifCard, !isRead && styles.unreadCard]}>
                  <View style={styles.notifHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons
                        name={item.type === 'broadcast' ? 'megaphone' : 'notifications'}
                        size={18}
                        color={item.type === 'broadcast' ? Colors.gold[400] : Colors.magenta[400]}
                      />
                    </View>

                    <View style={styles.notifInfo}>
                      <Text style={[styles.notifTitle, !isRead && styles.unreadTitle]}>
                        {item.title}
                      </Text>
                      <Text style={styles.notifDate}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                      </Text>
                    </View>

                    {!isRead && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notifBody}>{item.message || item.body}</Text>
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={44} color={Colors.slate[500]} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You're all caught up! Updates about your proposals and account will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.navy[800],
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.magenta[400],
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  notifCard: {
    marginBottom: 12,
  },
  unreadCard: {
    borderColor: 'rgba(225, 29, 116, 0.4)',
    backgroundColor: Colors.navy[800],
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.navy[950],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notifInfo: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate[200],
  },
  unreadTitle: {
    color: Colors.white,
    fontWeight: '800',
  },
  notifDate: {
    fontSize: 10,
    color: Colors.slate[400],
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.magenta[500],
  },
  notifBody: {
    fontSize: 12,
    color: Colors.slate[300],
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.slate[400],
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
