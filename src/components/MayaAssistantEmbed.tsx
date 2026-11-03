import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { useThemeStore } from '../stores/theme-store';

const ASSISTANT_URL = 'https://mani-ai-psi.vercel.app/embed/purple-haze';

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
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && (data.type === 'mani-ai:close' || data.action === 'close')) {
            onClose?.();
          }
        } catch {
          if (event.data && (event.data.type === 'mani-ai:close' || event.data.action === 'close')) {
            onClose?.();
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [onClose]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={colors.gold || '#D4AF37'} />
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
            backgroundColor: 'transparent',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}
        />
      </View>
    );
  }

  // Native (Android / iOS)
  let WebViewComponent: any = null;
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch {
    // fallback if webview not available
  }

  if (!WebViewComponent) {
    return (
      <View style={[styles.container, styles.fallbackContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.fallbackTitle, { color: colors.textPrimary }]}>Maya AI Assistant</Text>
        <Text style={[styles.fallbackSub, { color: colors.textSecondary }]}>
          Please launch in browser or web mode to chat with Maya.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.gold || '#D4AF37'} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
            Connecting to Maya AI...
          </Text>
        </View>
      )}
      <WebViewComponent
        source={{ uri: assistantSrc }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        onLoad={() => setLoading(false)}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(event: any) => {
          try {
            const raw = event.nativeEvent.data;
            const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (data && (data.type === 'mani-ai:close' || data.action === 'close')) {
              onClose?.();
            }
          } catch {
            // ignore
          }
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
