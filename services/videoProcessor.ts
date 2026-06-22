import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { FRAME_TIMESTAMPS_MS } from '../constants';

export async function extractVideoFrames(
  videoUri: string,
  maxFrames: number = 6
): Promise<string[]> {
  const frames: string[] = [];
  const timestamps = [...FRAME_TIMESTAMPS_MS];

  for (const time of timestamps) {
    if (frames.length >= maxFrames) break;

    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time,
        quality: 0.75,
      });

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      frames.push(base64);

      // Clean up thumbnail file
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // Timestamp exceeds video length or other error — skip
    }
  }

  if (frames.length === 0) {
    throw new Error(
      'Could not extract frames from the video. Please try a longer video (at least 1 second).'
    );
  }

  return frames;
}
