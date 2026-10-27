import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import GenderAvatar from '../common/GenderAvatar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HiddenProfilesModal({
  visible,
  onClose,
  hiddenList = [],
  loading = false,
  onUnhide,
}) {
  const insets = useSafeAreaInsets();
  const modalTopPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 10 : 16);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { paddingTop: modalTopPadding }]}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />

        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Hidden Profiles / چھپائے گئے رشتے</Text>
            <Text style={styles.headerSubtitle}>
              Profiles you marked as Not Interested
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.magenta[500]} />
            <Text style={styles.loadingText}>Loading hidden candidates...</Text>
          </View>
        ) : hiddenList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="eye-outline" size={48} color={Colors.slate[500]} />
            <Text style={styles.emptyTitle}>No Hidden Profiles</Text>
            <Text style={styles.emptySubtitle}>
              When you ignore a profile you're not interested in, it will be kept here so you can restore it anytime.
            </Text>
          </View>
        ) : (
          <FlatList
            data={hiddenList}
            keyExtractor={(item, index) => item.code || String(index)}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 40, 48) }]}
            renderItem={({ item }) => {
              const isAssisted = item.type === 'assisted' || String(item.code).startsWith('AL');
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <GenderAvatar
                      gender={item.gender}
                      size={42}
                      photoUrl={item.photo_url}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.codeText}>#{item.code}</Text>
                        <View
                          style={[
                            styles.typeBadge,
                            isAssisted ? styles.typeBadgeAssisted : styles.typeBadgeRegular,
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              isAssisted ? styles.typeBadgeTextAssisted : styles.typeBadgeTextRegular,
                            ]}
                          >
                            {isAssisted ? 'Assisted' : 'Direct'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.demographicsText}>
                        {[
                          item.gender ? (item.gender === 'male' ? 'Male' : 'Female') : null,
                          item.age ? `${item.age} yrs` : null,
                          item.city || null,
                          item.profession || null,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </Text>
                    </View>

                    {/* Unhide / Show Back Button */}
                    <TouchableOpacity
                      style={styles.unhideBtn}
                      onPress={() => onUnhide(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="arrow-undo-outline" size={14} color={Colors.magenta[300]} />
                      <Text style={styles.unhideBtnText}>Show Back</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
    backgroundColor: Colors.navy[950],
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.navy[850] || '#172033',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.navy[750],
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeRegular: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  typeBadgeAssisted: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  typeBadgeTextRegular: {
    color: Colors.magenta[300],
  },
  typeBadgeTextAssisted: {
    color: Colors.gold[400],
  },
  demographicsText: {
    fontSize: 11,
    color: Colors.slate[300],
    marginTop: 3,
  },
  unhideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.magenta[500],
  },
  unhideBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.magenta[300],
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.slate[400],
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.slate[400],
    textAlign: 'center',
    lineHeight: 18,
  },
});
