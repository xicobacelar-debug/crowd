import Anthropic from '@anthropic-ai/sdk';
import { SwingAnalysis } from '../types';

const GOLF_ANALYSIS_PROMPT = `You are an expert PGA golf instructor and biomechanics specialist with 20+ years of experience coaching professional and amateur golfers.

Analyze these sequential video frames from a golf swing. Evaluate every visible swing phase:

1. **Address/Setup** — stance width, ball position, spine tilt, knee flex, weight distribution, grip
2. **Takeaway** — one-piece takeaway, club path, shoulder initiation
3. **Backswing** — shoulder turn (ideal: 90°), hip rotation (ideal: 45°), weight shift, wrist hinge, club plane
4. **Downswing** — hip clearing, lag retention, swing path, weight transfer
5. **Impact** — hand position, shaft lean, head behind ball, hip clearance, face angle
6. **Follow-through** — extension, balance, finish height, full rotation

Key biomechanical checkpoints:
- Spine angle consistency (should remain constant through impact)
- Head stability (minimal lateral or vertical movement)
- Hip-to-shoulder differential (X-factor)
- Weight transfer sequencing
- Arm structure and club plane consistency

Be specific and professional. Provide actionable, drill-based tips.

Respond ONLY with valid JSON matching this exact schema (no markdown, no extra text):
{
  "overallScore": <integer 0-100>,
  "swingType": "<e.g. 'Classic upright plane' or 'Modern rotational stack-and-tilt'>",
  "phases": [
    {
      "name": "<phase name>",
      "score": <integer 0-100>,
      "issues": ["<specific issue>"],
      "tips": ["<actionable drill or fix>"]
    }
  ],
  "bodyMetrics": {
    "spineAngle": <estimated degrees 20-60>,
    "hipRotation": <estimated degrees at top of swing>,
    "shoulderTurn": <estimated degrees at top of swing>,
    "headStability": "<excellent|good|fair|poor>",
    "kneeFlexScore": <integer 0-100>,
    "weightTransfer": "<excellent|good|fair|poor>"
  },
  "topIssues": ["<most critical issue 1>", "<issue 2>", "<issue 3>"],
  "keyTips": ["<highest impact tip 1>", "<tip 2>", "<tip 3>"],
  "strengths": ["<genuine strength 1>", "<strength 2>", "<strength 3>"]
}`;

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
      : 'Down-the-line view (camera positioned behind the golfer)';

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          ...imageBlocks,
          {
            type: 'text',
            text: `${GOLF_ANALYSIS_PROMPT}\n\nCamera angle: ${viewAngleText}.\nFrames provided: ${frames.length} sequential frames from the golf swing.`,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No response from AI. Please try again.');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI response. Please try again.');
  }

  return JSON.parse(jsonMatch[0]) as SwingAnalysis;
}
