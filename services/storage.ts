import AsyncStorage from '@react-native-async-storage/async-storage';
import { SwingRecord } from '../types';

const HISTORY_KEY = 'swing_history_v1';
const MAX_ENTRIES = 20;

export async function getSwingHistory(): Promise<SwingRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SwingRecord[]) : [];
  } catch {
    return [];
  }
}

export async function saveSwingRecord(record: SwingRecord): Promise<void> {
  const history = await getSwingHistory();
  const updated = [record, ...history].slice(0, MAX_ENTRIES);
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Storage quota exceeded — retry without thumbnails
    try {
      const trimmed = updated.map(({ thumbnail, ...rest }) => rest);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // History is a nice-to-have; never fail the analysis flow over it
    }
  }
}

export async function deleteSwingRecord(id: string): Promise<SwingRecord[]> {
  const history = await getSwingHistory();
  const updated = history.filter((r) => r.id !== id);
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export async function clearSwingHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

export function newRecordId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
