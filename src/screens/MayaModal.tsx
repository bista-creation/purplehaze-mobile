import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../stores/theme-store';
import { MayaAssistantEmbed } from '../components/MayaAssistantEmbed';
import { useMayaStore } from '../stores/maya-store';

export default function MayaModal({ navigation }: any) {
  const { mode } = useTheme();

  useEffect(() => {
    // When MayaModal is active, ensure the floating widget is closed and hidden
    useMayaStore.getState().setModalOpen(true);
    return () => {
      useMayaStore.getState().setModalOpen(false);
    };
  }, []);

  const handleClose = () => {
    useMayaStore.getState().setModalOpen(false);
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
