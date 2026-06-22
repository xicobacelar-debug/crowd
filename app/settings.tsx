import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '../constants';

const API_KEY_STORE_KEY = 'anthropic_api_key';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSavedKey, setHasSavedKey] = useState(false);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const stored = await SecureStore.getItemAsync(API_KEY_STORE_KEY);
      if (stored) {
        setHasSavedKey(true);
        // Show masked version
        setMaskedKey(
          stored.substring(0, 8) + '•'.repeat(24) + stored.slice(-4)
        );
      }
    } catch {
      // SecureStore not available
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      Alert.alert(
        'Invalid Key',
        'Please enter a valid Anthropic API key. It should start with "sk-ant-".'
      );
      return;
    }

    setIsSaving(true);
    try {
      await SecureStore.setItemAsync(API_KEY_STORE_KEY, trimmed);
      setHasSavedKey(true);
      setMaskedKey(trimmed.substring(0, 8) + '•'.repeat(24) + trimmed.slice(-4));
      setApiKey('');
      Alert.alert('Saved', 'API key saved securely on your device.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save API key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeApiKey = async () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync(API_KEY_STORE_KEY);
              setHasSavedKey(false);
              setMaskedKey('');
            } catch {
              Alert.alert('Error', 'Could not remove API key.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.gradientMid, COLORS.background]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* API Key Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Claude API Key</Text>
            <Text style={styles.sectionDesc}>
              SwingIQ uses Claude claude-opus-4-8 to analyze your golf swing. Your API key is
              stored securely on your device and never sent to our servers.
            </Text>

            {hasSavedKey ? (
              <View style={styles.savedKeyCard}>
                <View style={styles.savedKeyRow}>
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color={COLORS.primary}
                  />
                  <View style={styles.savedKeyInfo}>
                    <Text style={styles.savedKeyLabel}>API Key Active</Text>
                    <Text style={styles.savedKeyValue}>{maskedKey}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeKeyBtn}
                  onPress={removeApiKey}
                >
                  <Text style={styles.removeKeyText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {hasSavedKey ? 'Update API Key' : 'Enter API Key'}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="sk-ant-..."
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={saveApiKey}
                />
                <TouchableOpacity
                  style={styles.showHideBtn}
                  onPress={() => setShowKey((v) => !v)}
                >
                  <Ionicons
                    name={showKey ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!apiKey.trim() || isSaving) && styles.saveBtnDisabled,
                ]}
                onPress={saveApiKey}
                disabled={!apiKey.trim() || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {hasSavedKey ? 'Update Key' : 'Save Key'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* How to get API key */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Get an API Key</Text>
            <View style={styles.stepsCard}>
              {[
                'Visit console.anthropic.com',
                'Create an account or sign in',
                'Go to API Keys section',
                'Create a new key and copy it',
                'Paste it above and save',
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Privacy note */}
          <View style={styles.privacyCard}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.privacyText}>
              Your API key is encrypted and stored locally on your device using
              iOS Keychain / Android Keystore. It is never uploaded to any server.
            </Text>
          </View>

          {/* App info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>SwingIQ v1.0.0</Text>
            <Text style={styles.appInfoText}>Powered by Claude claude-opus-4-8</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },

  scroll: { paddingBottom: 48 },

  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },

  savedKeyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,166,81,0.3)',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  savedKeyInfo: { flex: 1 },
  savedKeyLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  savedKeyValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  removeKeyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeKeyText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
  },

  inputSection: { gap: 10 },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  showHideBtn: {
    padding: 8,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },

  stepsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,166,81,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0,166,81,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,166,81,0.2)',
  },
  privacyText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  appInfoText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
