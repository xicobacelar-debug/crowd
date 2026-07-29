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
import { COLORS, MODEL_DISPLAY_NAME } from '../constants';
import {
  backupNow,
  getBackupInfo,
  restoreFromCloud,
  signIn,
  signOut,
  signUp,
} from '../services/backup';

const API_KEY_STORE_KEY = 'anthropic_api_key';

function formatBackupTime(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSavedKey, setHasSavedKey] = useState(false);

  const [backupEmail, setBackupEmail] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);

  useEffect(() => {
    loadApiKey();
    getBackupInfo()
      .then((info) => {
        setBackupEmail(info.email);
        setLastBackupAt(info.lastBackupAt);
      })
      .catch(() => {});
  }, []);

  const handleSignIn = async (createAccount: boolean) => {
    const email = authEmail.trim();
    if (!email || !authPassword) return;
    setBackupBusy(true);
    try {
      if (createAccount) {
        await signUp(email, authPassword);
        Alert.alert(
          'Check Your Email',
          'We sent a confirmation link to ' +
            email +
            '. Tap it, then come back and press Sign In.'
        );
      } else {
        await signIn(email, authPassword);
        setBackupEmail(email);
        setAuthPassword('');
        // First backup right away so the account is never empty
        try {
          setLastBackupAt(await backupNow());
        } catch {
          // No tracker data yet — the weekly auto-backup will pick it up
        }
      }
    } catch (e) {
      Alert.alert(
        createAccount ? 'Sign Up Failed' : 'Sign In Failed',
        e instanceof Error ? e.message : 'Please try again.'
      );
    } finally {
      setBackupBusy(false);
    }
  };

  const handleBackupNow = async () => {
    setBackupBusy(true);
    try {
      setLastBackupAt(await backupNow());
      Alert.alert('Backed Up', 'Your training card is safe in the cloud.');
    } catch (e) {
      Alert.alert(
        'Backup Failed',
        e instanceof Error ? e.message : 'Please try again.'
      );
    } finally {
      setBackupBusy(false);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore from Cloud',
      'This replaces the tracker data on this phone with your latest cloud backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setBackupBusy(true);
            try {
              const at = await restoreFromCloud();
              Alert.alert(
                at ? 'Restored' : 'No Backup Found',
                at
                  ? `Tracker restored from the backup made ${formatBackupTime(at)}.`
                  : 'This account has no cloud backup yet.'
              );
            } catch (e) {
              Alert.alert(
                'Restore Failed',
                e instanceof Error ? e.message : 'Please try again.'
              );
            } finally {
              setBackupBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    setBackupEmail(null);
  };

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
              SwingIQ uses {MODEL_DISPLAY_NAME} to analyze your golf swing. Your
              API key is stored securely on your device and never sent to our
              servers.
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

          {/* Cloud Backup */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cloud Backup</Text>
            <Text style={styles.sectionDesc}>
              Your 12-week training card is backed up to the cloud automatically
              once a week while you're signed in, so it survives reinstalls and
              phone changes.
            </Text>

            {backupEmail ? (
              <View style={styles.backupCard}>
                <View style={styles.savedKeyRow}>
                  <Ionicons
                    name="cloud-done-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <View style={styles.savedKeyInfo}>
                    <Text style={styles.savedKeyLabel}>{backupEmail}</Text>
                    <Text style={styles.savedKeyValue}>
                      Last backup: {formatBackupTime(lastBackupAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.backupActions}>
                  <TouchableOpacity
                    style={[styles.backupBtn, backupBusy && styles.saveBtnDisabled]}
                    onPress={handleBackupNow}
                    disabled={backupBusy}
                  >
                    {backupBusy ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.backupBtnText}>Back Up Now</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.backupBtnSecondary,
                      backupBusy && styles.saveBtnDisabled,
                    ]}
                    onPress={handleRestore}
                    disabled={backupBusy}
                  >
                    <Text style={styles.backupBtnSecondaryText}>Restore</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                  <Text style={styles.removeKeyText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputSection}>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={authEmail}
                    onChangeText={setAuthEmail}
                    placeholder="you@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    placeholder="Password (min 6 characters)"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.backupActions}>
                  <TouchableOpacity
                    style={[
                      styles.backupBtn,
                      (!authEmail.trim() || authPassword.length < 6 || backupBusy) &&
                        styles.saveBtnDisabled,
                    ]}
                    onPress={() => handleSignIn(false)}
                    disabled={
                      !authEmail.trim() || authPassword.length < 6 || backupBusy
                    }
                  >
                    {backupBusy ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.backupBtnText}>Sign In</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.backupBtnSecondary,
                      (!authEmail.trim() || authPassword.length < 6 || backupBusy) &&
                        styles.saveBtnDisabled,
                    ]}
                    onPress={() => handleSignIn(true)}
                    disabled={
                      !authEmail.trim() || authPassword.length < 6 || backupBusy
                    }
                  >
                    <Text style={styles.backupBtnSecondaryText}>
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
            <Text style={styles.appInfoText}>SwingIQ v1.1.0</Text>
            <Text style={styles.appInfoText}>
              Powered by {MODEL_DISPLAY_NAME}
            </Text>
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

  backupCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,166,81,0.3)',
    gap: 12,
  },
  backupActions: {
    flexDirection: 'row',
    gap: 10,
  },
  backupBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  backupBtnSecondary: {
    flex: 1,
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
  },
  backupBtnSecondaryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  signOutBtn: {
    alignSelf: 'center',
    paddingVertical: 2,
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
