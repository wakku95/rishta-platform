import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Linking,
  Keyboard,
  BackHandler,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';
import { useAuth } from '../../contexts/AuthContext';

export default function LiveChatModal({ visible, onClose, onUnreadMessage }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chatStarted, setChatStarted] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [availableHeight, setAvailableHeight] = useState(null);
  const baseScreenHeightRef = useRef(Dimensions.get('window').height);

  // Lazy-start the WebView only after the user opens Live Chat at least once
  useEffect(() => {
    if (visible && !chatStarted) {
      setChatStarted(true);
    }
  }, [visible, chatStarted]);

  // Listen to keyboard show/hide and size container to exact space above the keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const kbHeight = e?.endCoordinates?.height || 0;
      const kbScreenY = e?.endCoordinates?.screenY || 0;
      const winHeight = Math.max(baseScreenHeightRef.current, Dimensions.get('window').height);

      setKeyboardVisible(true);
      if (kbScreenY > 200 && kbScreenY < winHeight) {
        setAvailableHeight(kbScreenY);
      } else if (kbHeight > 0) {
        setAvailableHeight(winHeight - kbHeight);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setAvailableHeight(null);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Dismiss keyboard when closing modal
  const handleCloseModal = () => {
    Keyboard.dismiss();
    onClose();
  };

  // Handle Android hardware back button when modal is visible
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCloseModal();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!chatStarted) {
    return null;
  }

  const modalTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 10 : 16
  );

  // Only pass visitor's Name (NO email passed to Tawk.to, per user instruction)
  const rawName = user?.name || '';
  const profileCode = user?.profile?.profile_code || user?.profile_code || '';
  const displayName = rawName
    ? profileCode
      ? `${rawName} (#${profileCode})`
      : rawName
    : '';
  const safeVisitorName = String(displayName).replace(/'/g, "\\'");

  // Injected JS:
  // 1. Sets visitor name only (no email)
  // 2. Hooks Tawk_API.onChatMessageAgent + DOM observer + title observer to notify React Native of incoming agent replies
  // 3. Keeps input field scrolled into view when keyboard opens
  const injectedJS = `
    (function() {
      if (window.__rnTawkHooked) return;
      window.__rnTawkHooked = true;

      var lastNotifyAt = 0;
      function notifyAgentReply() {
        var now = Date.now();
        if (now - lastNotifyAt < 1200) return;
        lastNotifyAt = now;
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AGENT_MESSAGE' }));
        }
      }

      try {
        window.Tawk_API = window.Tawk_API || {};
        ${
          safeVisitorName
            ? `
        window.Tawk_API.visitor = {
          name: '${safeVisitorName}'
        };
        if (typeof window.Tawk_API.setAttributes === 'function') {
          window.Tawk_API.setAttributes({ name: '${safeVisitorName}' }, function(){});
        }
        `
            : ''
        }
        var origOnAgent = window.Tawk_API.onChatMessageAgent;
        window.Tawk_API.onChatMessageAgent = function(message) {
          notifyAgentReply();
          if (typeof origOnAgent === 'function') origOnAgent(message);
        };
      } catch (e) {}

      // Fallback 1: Observe document.title changes when Tawk.to increments unread count e.g. "(1)"
      try {
        var lastTitle = document.title || '';
        setInterval(function() {
          if (document.title !== lastTitle) {
            var newTitle = document.title || '';
            if (/^\\(\\d+\\)/.test(newTitle) && newTitle !== lastTitle) {
              notifyAgentReply();
            }
            lastTitle = newTitle;
          }
        }, 1000);
      } catch (e) {}

      // Fallback 2: Intercept Audio.prototype.play when Tawk.to plays incoming agent message notification sound
      try {
        var origPlay = window.HTMLMediaElement && window.HTMLMediaElement.prototype.play;
        if (origPlay) {
          window.HTMLMediaElement.prototype.play = function() {
            notifyAgentReply();
            return origPlay.apply(this, arguments);
          };
        }
      } catch (e) {}

      // Keep active textarea/input visible when viewport resizes for keyboard
      try {
        window.addEventListener('resize', function() {
          window.scrollTo(0, 0);
          if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
            setTimeout(function() {
              try {
                document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
              } catch (e) {}
            }, 80);
          }
        });
      } catch (e) {}
    })();
    true;
  `;

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event?.nativeEvent?.data || '{}');
      if (data.type === 'AGENT_MESSAGE' && !visible && onUnreadMessage) {
        onUnreadMessage();
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  const handleOpenExternal = () => {
    Linking.openURL(Config.LIVE_CHAT_URL).catch(() => {});
  };

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      onLayout={(e) => {
        if (!keyboardVisible) {
          const h = e?.nativeEvent?.layout?.height;
          if (h && h > 400) {
            baseScreenHeightRef.current = h;
          }
        }
      }}
      style={
        visible
          ? [
              styles.fullScreenContainer,
              {
                paddingTop: modalTopPadding,
                paddingBottom: keyboardVisible ? 0 : Math.max(insets.bottom, 0),
              },
              keyboardVisible && availableHeight
                ? { height: availableHeight, bottom: undefined }
                : { bottom: 0 },
            ]
          : styles.hiddenOffscreenContainer
      }
    >
      {visible && (
        <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCloseModal}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerTitle}>Live Chat Support</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            RaabtaNow Matchmaker & Help Desk • براہِ راست رابطہ
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleOpenExternal}
          style={styles.externalBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Open chat in browser"
        >
          <Ionicons name="open-outline" size={18} color={Colors.slate[300]} />
        </TouchableOpacity>
      </View>

      {/* Persistent WebView Body */}
      <View style={styles.webViewWrap}>
        <WebView
          source={{ uri: Config.LIVE_CHAT_URL }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          injectedJavaScript={injectedJS}
          onMessage={handleWebViewMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />

        {loading && visible && (
          <View style={styles.loaderOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.magenta[500]} />
            <Text style={styles.loaderText}>
              Connecting to RaabtaNow Support...
            </Text>
            <Text style={styles.loaderUrduText}>
              براہِ راست چیٹ لوڈ ہو رہی ہے...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.navy[950],
    zIndex: 99999,
    elevation: 99999,
  },
  hiddenOffscreenContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    bottom: -100,
    right: -100,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.navy[950],
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.navy[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald[400],
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.magenta[400],
    fontWeight: '600',
    marginTop: 1,
  },
  externalBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.navy[850],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  webViewWrap: {
    flex: 1,
    backgroundColor: Colors.navy[900],
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.navy[900],
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.navy[900],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 6,
  },
  loaderUrduText: {
    fontSize: 12,
    color: Colors.slate[400],
  },
});
