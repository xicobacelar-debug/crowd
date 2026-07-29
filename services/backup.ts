import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const TRACKER_KEY = 'golf-plan-12w';
const LAST_BACKUP_KEY = 'golf-backup-last-at';
const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // weekly

export interface BackupInfo {
  email: string | null;
  lastBackupAt: string | null;
}

export async function getBackupInfo(): Promise<BackupInfo> {
  const [{ data }, lastBackupAt] = await Promise.all([
    supabase.auth.getSession(),
    AsyncStorage.getItem(LAST_BACKUP_KEY),
  ]);
  return { email: data.session?.user.email ?? null, lastBackupAt };
}

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function backupNow(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) throw new Error('Not signed in');

  const raw = await AsyncStorage.getItem(TRACKER_KEY);
  if (!raw) throw new Error('Nothing to back up yet — open the tracker first.');

  const backedUpAt = new Date().toISOString();
  const { error } = await supabase.from('swingiq_backups').upsert({
    user_id: session.user.id,
    state: { version: 1, tracker: JSON.parse(raw) },
    device: Platform.OS,
    backed_up_at: backedUpAt,
  });
  if (error) throw new Error(error.message);

  await AsyncStorage.setItem(LAST_BACKUP_KEY, backedUpAt);
  return backedUpAt;
}

// Called on app launch: silently back up if signed in and the last backup is
// more than a week old. Never throws — backup must not disturb the app.
export async function maybeWeeklyBackup(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    const last = await AsyncStorage.getItem(LAST_BACKUP_KEY);
    if (last && Date.now() - new Date(last).getTime() < BACKUP_INTERVAL_MS) {
      return;
    }
    await backupNow();
  } catch {
    // Offline or transient failure — try again next launch
  }
}

// Overwrites local tracker state with the cloud copy. Returns the backup
// timestamp, or null if no backup exists for this account.
export async function restoreFromCloud(): Promise<string | null> {
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('swingiq_backups')
    .select('state, backed_up_at')
    .eq('user_id', auth.session.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.state?.tracker) return null;

  await AsyncStorage.setItem(TRACKER_KEY, JSON.stringify(data.state.tracker));
  return data.backed_up_at as string;
}
