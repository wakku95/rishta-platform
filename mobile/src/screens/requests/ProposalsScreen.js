import React, { useState, useEffect, useCallback } from 'react';
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
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { requestsApi } from '../../api/requests';
import { Ionicons } from '@expo/vector-icons';

export default function ProposalsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeTab, setTypeTab] = useState('received'); // 'received' or 'sent'

  const fetchRequests = async () => {
    try {
      const res = await requestsApi.getRequests();
      setRequests(res.data || res || []);
    } catch (err) {
      console.warn('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    const title = action === 'accept' ? 'Accept Proposal' : 'Decline Proposal';
    const message = action === 'accept'
      ? 'Are you sure you want to accept this proposal? You can proceed to verify contacts next.'
      : 'Are you sure you want to decline this proposal?';

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'accept' ? 'Accept' : 'Decline',
        style: action === 'accept' ? 'default' : 'destructive',
        onPress: async () => {
          try {
            await requestsApi.respondToRequest(requestId, action);
            fetchRequests();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to update request.');
          }
        },
      },
    ]);
  };

  // Filter based on received / sent
  const filteredRequests = requests.filter((r) => {
    if (typeTab === 'received') {
      return r.direction === 'received' || r.type === 'received';
    }
    return r.direction === 'sent' || r.type === 'sent';
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      <View style={styles.header}>
        <Text style={styles.title}>Rishta Proposals</Text>
        <Text style={styles.subtitle}>Mutual inquiries and proposal lifecycle</Text>

        {/* Tab Switcher */}
        <View style={styles.tabPillContainer}>
          <TouchableOpacity
            style={[styles.tabPill, typeTab === 'received' && styles.tabPillActive]}
            onPress={() => setTypeTab('received')}
          >
            <Text style={[styles.tabPillText, typeTab === 'received' && styles.tabPillTextActive]}>
              Received Proposals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, typeTab === 'sent' && styles.tabPillActive]}
            onPress={() => setTypeTab('sent')}
          >
            <Text style={[styles.tabPillText, typeTab === 'sent' && styles.tabPillTextActive]}>
              Sent Proposals
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.magenta[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.magenta[400]}
            />
          }
          renderItem={({ item }) => {
            const isReceived = typeTab === 'received';
            const candidate = isReceived ? item.sender : item.receiver;

            return (
              <Card style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.codeCol}>
                    <Text style={styles.candidateCode}>
                      Proposal #{item.request_code || item.id}
                    </Text>
                    <Text style={styles.metaText}>
                      Candidate: #{candidate?.profile_code || 'Unknown'}
                    </Text>
                  </View>

                  <Badge
                    label={item.status ? item.status.toUpperCase() : 'PENDING'}
                    variant={
                      item.status === 'accepted'
                        ? 'success'
                        : item.status === 'declined'
                        ? 'danger'
                        : 'gold'
                    }
                  />
                </View>

                {item.message ? (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText}>"{item.message}"</Text>
                  </View>
                ) : null}

                {/* Received Actions */}
                {isReceived && item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <Button
                      title="Decline"
                      variant="secondary"
                      size="sm"
                      onPress={() => handleAction(item.id, 'decline')}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Accept Proposal"
                      variant="primary"
                      size="sm"
                      onPress={() => handleAction(item.id, 'accept')}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}

                {/* If accepted, prompt to verify contacts */}
                {item.status === 'accepted' && (
                  <View style={styles.unlockedBox}>
                    <Ionicons name="call" size={16} color={Colors.emerald[400]} />
                    <Text style={styles.unlockedText}>
                      Proposal Accepted! Complete OTP verification to view phone contacts.
                    </Text>
                  </View>
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-open-outline" size={44} color={Colors.slate[500]} />
              <Text style={styles.emptyTitle}>No Proposals in this Tab</Text>
              <Text style={styles.emptySubtitle}>
                {typeTab === 'received'
                  ? 'When other candidate families send you a proposal, it will appear here.'
                  : 'Proposals you send to other candidates will appear here with live tracking.'}
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
    marginBottom: 10,
  },
  tabPillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.navy[950],
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabPillActive: {
    backgroundColor: Colors.navy[800],
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate[400],
  },
  tabPillTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  requestCard: {
    marginBottom: 14,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  codeCol: {
    flex: 1,
  },
  candidateCode: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  metaText: {
    fontSize: 12,
    color: Colors.slate[400],
    marginTop: 2,
  },
  messageBox: {
    backgroundColor: Colors.navy[950],
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.magenta[500],
  },
  messageText: {
    fontSize: 12,
    color: Colors.slate[300],
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  unlockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  unlockedText: {
    fontSize: 11,
    color: Colors.emerald[300],
    flex: 1,
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
