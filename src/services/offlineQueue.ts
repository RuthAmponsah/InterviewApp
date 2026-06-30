import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabase';

const QUEUE_KEY = 'pendingInterviews';

interface PendingInterview {
  localId: string;
  user_id: string;
  job_role: string;
  mode: string;
  duration_minutes: number;
  date: string;
  transcript: string;
}

export const queueInterview = async (
  data: Omit<PendingInterview, 'localId'>
): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: PendingInterview[] = raw ? JSON.parse(raw) : [];
    queue.push({
      ...data,
      localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`📥 Interview queued offline (${queue.length} pending)`);
  } catch (e) {
    console.error('offlineQueue.queueInterview error:', e);
  }
};

export const getPendingCount = async (): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingInterview[]).length : 0;
  } catch {
    return 0;
  }
};

/**
 * Attempts to upload all queued interviews to Supabase.
 * Returns the number of records successfully synced.
 */
export const flushInterviewQueue = async (): Promise<number> => {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return 0;

    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    const queue: PendingInterview[] = JSON.parse(raw);
    if (queue.length === 0) return 0;

    let synced = 0;
    const remaining: PendingInterview[] = [];

    for (const { localId, ...record } of queue) {
      const { error } = await supabase.from('interview_history').insert(record);
      if (error) {
        remaining.push({ localId, ...record });
      } else {
        synced++;
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    if (synced > 0) console.log(`✅ Synced ${synced} queued interview(s)`);
    return synced;
  } catch (e) {
    console.error('offlineQueue.flushInterviewQueue error:', e);
    return 0;
  }
};
