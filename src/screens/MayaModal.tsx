import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../stores/theme-store';
import { MayaAssistantEmbed } from '../components/MayaAssistantEmbed';

export default function MayaModal({ navigation }: any) {
  const { mode } = useTheme();

  const handleClose = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Home' });
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: mode === 'dark' ? '#130B1D' : '#FAF8FF' },
      ]}
    >
      <MayaAssistantEmbed onClose={handleClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
