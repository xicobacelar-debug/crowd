import Anthropic from '@anthropic-ai/sdk';
import { BodyMetrics, SwingAnalysis } from '../types';
import { ANALYSIS_MODEL } from '../constants';

const GOLF_ANALYSIS_PROMPT = `You are an expert PGA golf instructor and biomechanics specialist with 20+ years of experience coaching professional and amateur golfers.

The images are sequential frames sampled evenly across a video of a golf swing. Some frames may show the golfer before or after the swing (setup, waiting, walking) — identify the frames that show the actual swing and base your analysis on those.

Evaluate every visible swing phase:
1. Address/Setup — stance width, ball position, spine tilt, knee flex, weight distribution, grip
2. Takeaway — one-piece takeaway, club path, shoulder initiation
3. Backswing — shoulder turn (ideal ~90°), hip rotation (ideal ~45°), weight shift, wrist hinge, club plane
4. Downswing — hip clearing, lag retention, swing path, weight transfer
5. Impact — hand position, shaft lean, head behind ball, hip clearance
6. Follow-through — extension, balance, finish height, full rotation

Key biomechanical checkpoints:
- Spine angle consistency (should remain constant through impact)
- Head stability (minimal lateral or vertical movement)
- Hip-to-shoulder differential (X-factor)
- Weight transfer sequencing
- Arm structure and club plane consistency

Include all six phases in "phases". If a phase is not clearly visible in the frames, score it conservatively and note the limited view in its issues. Be specific and professional; make every tip an actionable drill or feel the golfer can practice.`;

const SWING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'overallScore',
    'swingType',
    'phases',
    'bodyMetrics',
    'topIssues',
    'keyTips',
    'strengths',
  ],
  properties: {
    overallScore: {
      type: 'integer',
      description: 'Overall swing quality, 0-100',
    },
    swingType: {
      type: 'string',
      description:
        "Short characterization, e.g. 'Classic upright plane' or 'Modern rotational'",
    },
    phases: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'score', 'issues', 'tips'],
        properties: {
          name: {
            type: 'string',
            enum: [
              'Address',
              'Takeaway',
              'Backswing',
              'Downswing',
              'Impact',
              'Follow-through',
            ],
          },
          score: { type: 'integer', description: '0-100' },
          issues: { type: 'array', items: { type: 'string' } },
          tips: {
            type: 'array',
            items: { type: 'string' },
            description: 'Actionable drills or fixes',
          },
        },
      },
    },
    bodyMetrics: {
      type: 'object',
      additionalProperties: false,
      required: [
        'spineAngle',
        'hipRotation',
        'shoulderTurn',
        'headStability',
        'kneeFlexScore',
        'weightTransfer',
      ],
      properties: {
        spineAngle: {
          type: 'integer',
          description: 'Estimated spine tilt at address, degrees from vertical',
        },
        hipRotation: {
          type: 'integer',
          description: 'Estimated hip rotation at top of backswing, degrees',
        },
        shoulderTurn: {
          type: 'integer',
          description: 'Estimated shoulder turn at top of backswing, degrees',
        },
        headStability: {
          type: 'string',
          enum: ['excellent', 'good', 'fair', 'poor'],
        },
        kneeFlexScore: { type: 'integer', description: '0-100' },
        weightTransfer: {
          type: 'string',
          enum: ['excellent', 'good', 'fair', 'poor'],
        },
      },
    },
    topIssues: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 3 most critical issues',
    },
    keyTips: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 3 highest-impact tips',
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 3 genuine strengths',
    },
  },
};

const QUALITY_VALUES = ['excellent', 'good', 'fair', 'poor'] as const;

function clampScore(value: unknown): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50;
}

function clampAngle(value: unknown, fallback: number): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(180, Math.max(0, n)) : fallback;
}

function toStringArray(value: unknown, max = 5): string[] {
  return Array.isArray(value)
    ? value
        .filter((s): s is string => typeof s === 'string' && s.length > 0)
        .slice(0, max)
    : [];
}

function toQuality(value: unknown): BodyMetrics['headStability'] {
  return QUALITY_VALUES.includes(value as (typeof QUALITY_VALUES)[number])
    ? (value as BodyMetrics['headStability'])
    : 'fair';
}

// Structured outputs guarantee the shape, but scores/arrays are still
// clamped so a surprising value can never break the results UI.
function normalizeAnalysis(raw: any): SwingAnalysis {
  return {
    overallScore: clampScore(raw?.overallScore),
    swingType: typeof raw?.swingType === 'string' ? raw.swingType : 'Golf swing',
    phases: Array.isArray(raw?.phases)
      ? raw.phases.slice(0, 6).map((p: any) => ({
          name: typeof p?.name === 'string' ? p.name : 'Phase',
          score: clampScore(p?.score),
          issues: toStringArray(p?.issues),
          tips: toStringArray(p?.tips),
        }))
      : [],
    bodyMetrics: {
      spineAngle: clampAngle(raw?.bodyMetrics?.spineAngle, 35),
      hipRotation: clampAngle(raw?.bodyMetrics?.hipRotation, 45),
      shoulderTurn: clampAngle(raw?.bodyMetrics?.shoulderTurn, 90),
      headStability: toQuality(raw?.bodyMetrics?.headStability),
      kneeFlexScore: clampScore(raw?.bodyMetrics?.kneeFlexScore),
      weightTransfer: toQuality(raw?.bodyMetrics?.weightTransfer),
    },
    topIssues: toStringArray(raw?.topIssues, 3),
    keyTips: toStringArray(raw?.keyTips, 3),
    strengths: toStringArray(raw?.strengths, 3),
  };
}

function friendlyError(error: unknown): Error {
  if (error instanceof Anthropic.AuthenticationError) {
    return new Error('Invalid API key — update it in Settings.');
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new Error('Too many requests — wait a minute and try again.');
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new Error(
      'Could not reach the AI service — check your internet connection.'
    );
  }
  if (error instanceof Anthropic.APIError) {
    if ((error.status ?? 0) >= 500) {
      return new Error(
        'The AI service is temporarily busy — try again in a moment.'
      );
    }
    return new Error(`Analysis request failed: ${error.message}`);
  }
  return error instanceof Error
    ? error
    : new Error('Analysis failed. Please try again.');
}

export async function analyzeGolfSwing(
  frames: string[],
  apiKey: string,
  viewAngle: 'face-on' | 'down-the-line' = 'face-on'
): Promise<SwingAnalysis> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const imageBlocks = frames.map((base64) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg' as const,
      data: base64,
    },
  }));

  const viewAngleText =
    viewAngle === 'face-on'
      ? 'Face-on view (golfer facing the camera)'
      : 'Down-the-line view (camera positioned behind the golfer, looking toward the target)';

  try {
    const response = await client.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: {
        format: { type: 'json_schema', schema: SWING_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text: `${GOLF_ANALYSIS_PROMPT}\n\nCamera angle: ${viewAngleText}.\nFrames provided: ${frames.length}, sampled evenly across the clip in chronological order.`,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('The AI returned no analysis. Please try again.');
    }

    return normalizeAnalysis(JSON.parse(textContent.text));
  } catch (error) {
    throw friendlyError(error);
  }
}
