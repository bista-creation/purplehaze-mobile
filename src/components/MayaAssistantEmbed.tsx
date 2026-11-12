import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/theme-store';

const ASSISTANT_URL = 'https://mani-ai-psi.vercel.app/embed/purple-haze';
const NATIVE_CLOSE_BRIDGE = `(function() {
  if (window.__purpleHazeMayaCloseBridge) return true;
  window.__purpleHazeMayaCloseBridge = true;
  var sendClose = function() {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mani-ai:close', action: 'close' }));
    }
  };
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (_) {}
    }
    if (data === 'mani-ai:close' || (data && (data.type === 'mani-ai:close' || data.action === 'close'))) {
      sendClose();
    }
  });
  document.addEventListener('click', function(event) {
    var target = event.target;
    var closeButton = target && target.closest && target.closest('button[aria-label="Close Assistant"], button[title="Close Assistant"], button[aria-label="Close"], button.close-btn');
    if (closeButton) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      sendClose();
    }
  }, true);
  return true;
})();`;

function isMayaCloseMessage(value: unknown): boolean {
  let data = value;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return (
        data === 'mani-ai:close' ||
        data === 'close' ||
        data === 'close-modal' ||
        data === 'hide'
      );
    }
  }
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return Boolean(
    d.type === 'mani-ai:close' ||
    d.action === 'close' ||
    d.type === 'close' ||
    d.event === 'close' ||
    d.message === 'close' ||
    d.action === 'dismiss' ||
    d.type === 'dismiss'
  );
}

interface MayaAssistantEmbedProps {
  onClose?: () => void;
  style?: any;
}

export const MayaAssistantEmbed: React.FC<MayaAssistantEmbedProps> = ({ onClose, style }) => {
  const mode = useThemeStore((s) => s.mode);
  const colors = useThemeStore((s) => s.colors);
  const iframeRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  const assistantSrc = `${ASSISTANT_URL}?theme=${mode === 'dark' ? 'dark' : 'light'}`;

  // Handle postMessage close events from mani-ai
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event: MessageEvent) => {
        if (isMayaCloseMessage(event.data)) onClose?.();
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [onClose]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: mode === 'dark' ? '#130B1D' : '#FAF8FF' }, style]}>
        {loading && (
          <View
            style={[
              styles.loaderOverlay,
              { backgroundColor: mode === 'dark' ? 'rgba(19, 11, 29, 0.94)' : 'rgba(250, 248, 255, 0.94)' },
            ]}
          >
            {onClose && (
              <TouchableOpacity
                style={styles.loaderCloseBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <ActivityIndicator size="large" color={colors.purple} />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
              Connecting to Maya AI...
            </Text>
          </View>
        )}
        <iframe
          ref={iframeRef}
          src={assistantSrc}
          title="Purple Haze Maya Assistant"
          allow="microphone"
          onLoad={() => setLoading(false)}
          style={{
            border: 'none',
            borderRadius: 16,
            width: '100%',
            height: '100%',
            backgroundColor: mode === 'dark' ? '#130B1D' : '#FAF8FF',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}
        />
      </View>
    );
  }

  // Native (Android / iOS)
  let WebViewComponent: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    WebViewComponent = require('react-native-webview').WebView;
  } catch {
    // fallback if webview not available
  }

  if (!WebViewComponent) {
    return (
      <View style={[styles.container, styles.fallbackContainer, { backgroundColor: colors.surface }]}>
        {onClose && (
          <TouchableOpacity
            style={styles.loaderCloseBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.fallbackTitle, { color: colors.text }]}>Maya AI Assistant</Text>
        <Text style={[styles.fallbackSub, { color: colors.textSecondary }]}>
          Please launch in browser or web mode to chat with Maya.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: mode === 'dark' ? '#130B1D' : '#FAF8FF' }, style]}>
      {loading && (
        <View
          style={[
            styles.loaderOverlay,
            { backgroundColor: mode === 'dark' ? 'rgba(19, 11, 29, 0.94)' : 'rgba(250, 248, 255, 0.94)' },
          ]}
        >
          {onClose && (
            <TouchableOpacity
              style={styles.loaderCloseBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
            Connecting to Maya AI...
          </Text>
        </View>
      )}
      <WebViewComponent
        source={{ uri: assistantSrc }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        injectedJavaScript={NATIVE_CLOSE_BRIDGE}
        onLoad={() => setLoading(false)}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event: any) => {
          if (isMayaCloseMessage(event.nativeEvent.data)) onClose?.();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  loaderCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 2,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  fallbackSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
