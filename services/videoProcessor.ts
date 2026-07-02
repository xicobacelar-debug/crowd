import * as VideoThumbnails from 'expo-video-thumbnails';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { createVideoPlayer } from 'expo-video';
import { File } from 'expo-file-system';
import { FALLBACK_TIMESTAMPS_MS, FRAME_COUNT } from '../constants';

// Frames are downscaled before upload: smaller payloads, faster analysis,
// and ~768px is plenty for pose evaluation.
const FRAME_WIDTH = 768;
const FRAME_QUALITY = 0.7;
const DURATION_PROBE_TIMEOUT_MS = 4000;

async function getVideoDurationMs(videoUri: string): Promise<number | null> {
  let player: ReturnType<typeof createVideoPlayer> | null = null;
  try {
    player = createVideoPlayer(videoUri);
    const p = player;

    const durationSec = await new Promise<number | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), DURATION_PROBE_TIMEOUT_MS);
      const finish = (value: number | null) => {
        clearTimeout(timeout);
        resolve(value);
      };

      if (p.status === 'readyToPlay' && p.duration > 0) {
        finish(p.duration);
        return;
      }

      const subscription = p.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay') {
          subscription.remove();
          finish(p.duration > 0 ? p.duration : null);
        } else if (status === 'error') {
          subscription.remove();
          finish(null);
        }
      });
    });

    return durationSec ? Math.round(durationSec * 1000) : null;
  } catch {
    return null;
  } finally {
    player?.release();
  }
}

// Spread timestamps across the whole clip (trimming the edges slightly) so the
// swing is captured wherever it happens in the recording — not just the first
// two seconds.
function buildTimestamps(
  durationMs: number | null,
  frameCount: number
): number[] {
  if (!durationMs || durationMs < 500) {
    return FALLBACK_TIMESTAMPS_MS.slice(0, frameCount);
  }
  const start = durationMs * 0.04;
  const end = durationMs * 0.96;
  const step = (end - start) / (frameCount - 1);
  return Array.from({ length: frameCount }, (_, i) =>
    Math.round(start + i * step)
  );
}

function deleteQuietly(uri: string) {
  try {
    new File(uri).delete();
  } catch {
    // best-effort cleanup of cache files
  }
}

export async function extractVideoFrames(
  videoUri: string,
  frameCount: number = FRAME_COUNT
): Promise<string[]> {
  const durationMs = await getVideoDurationMs(videoUri);
  const timestamps = buildTimestamps(durationMs, frameCount);
  const frames: string[] = [];

  for (const time of timestamps) {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time,
        quality: 1,
      });

      const context = ImageManipulator.manipulate(uri);
      context.resize({ width: FRAME_WIDTH });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        compress: FRAME_QUALITY,
        format: SaveFormat.JPEG,
        base64: true,
      });
      rendered.release();
      context.release();

      if (saved.base64) frames.push(saved.base64);

      deleteQuietly(uri);
      if (saved.uri) deleteQuietly(saved.uri);
    } catch {
      // Timestamp beyond video length or extraction failure — skip this frame
    }
  }

  if (frames.length === 0) {
    throw new Error(
      'Could not extract frames from the video. Please try a video of at least 1 second.'
    );
  }

  return frames;
}
