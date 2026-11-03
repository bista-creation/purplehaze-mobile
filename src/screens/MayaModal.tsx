import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api-client';
import { useTheme } from '../stores/theme-store';
import { colors as defaultColors, ColorTheme, spacing, borderRadius } from '../theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: string[];
}

const QUICK_SUGGESTIONS = [
  "What is the Chef's special tonight?",
  'Recommend the best spicy momo',
  'What are your vegetarian specialties?',
  'How do I book a rooftop table?',
];

export default function MayaModal({ navigation }: any) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Namaste! I am Maya, your Purple Haze dining assistant. How can I delight your palate today in Biratnagar?",
      suggestedActions: ['Menu Recommendations', 'Rooftop Booking', 'Spicy Sekuwa'],
    },
  ]);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleClose = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Home' });
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const res = await api.assistant.chat(text, history);

      const assistantMessage: Message = {
        id: `m_${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'Here is what I recommend from our Biratnagar kitchen!',
        suggestedActions: res.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.warn('[MayaModal] Error:', err);
      // Fallback response for offline or rate-limited sessions
      const fallbackMessage: Message = {
        id: `m_err_${Date.now()}`,
        role: 'assistant',
        content:
          "I recommend our signature Steamed Chicken Mo:Mo with timur chutney, and the smoking Purple Haze Chicken Sizzler on our Rooftop Terrace! You can also book a table directly in the Reservations tab.",
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Ionicons name="sparkles" size={18} color={colors.gold} />
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.headerTitle}>Maya</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI Food Guide</Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Purple Haze Biratnagar</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View
              style={[
                styles.messageRow,
                isUser ? styles.userMessageRow : styles.assistantMessageRow,
              ]}
            >
              {!isUser && (
                <View style={styles.msgAvatar}>
                  <Ionicons name="sparkles" size={12} color={colors.gold} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.assistantText,
                  ]}
                >
                  {item.content}
                </Text>

                {item.suggestedActions && item.suggestedActions.length > 0 && (
                  <View style={styles.actionPillsContainer}>
                    {item.suggestedActions.map((action: string, idx: number) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.actionPill}
                        onPress={() => sendMessage(action)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionPillText}>{action}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingRow}>
              <View style={styles.msgAvatar}>
                <Ionicons name="sparkles" size={12} color={colors.gold} />
              </View>
              <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={colors.gold} />
                <Text style={styles.thinkingText}>Maya is thinking...</Text>
              </View>
            </View>
          ) : undefined
        }
      />

      {/* Quick Suggestions Chips */}
      {messages.length <= 2 && (
        <View style={styles.quickChipsWrapper}>
          <Text style={styles.chipsPrompt}>Suggestions:</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={QUICK_SUGGESTIONS}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.chipsScroll}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chip}
                onPress={() => sendMessage(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask Maya about food, momo, seating..."
          placeholderTextColor={colors.textDisabled}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 52,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  aiBadge: {
    backgroundColor: colors.goldMuted,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.goldDark,
  },
  aiBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.purple,
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thinkingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
    fontWeight: '500',
  },
  assistantText: {
    color: colors.textSecondary,
  },
  actionPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  actionPill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.goldDark,
  },
  actionPillText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  quickChipsWrapper: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  chipsPrompt: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipsScroll: {
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 28,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: 16,
    height: 44,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
