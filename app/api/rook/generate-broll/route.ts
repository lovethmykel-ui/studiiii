import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildSceneBrollPrompt,
  CameraMotionType,
  LensPresetType,
  VideoScene,
} from '@/lib/video-engine';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a custom 1280x720 cinematic investigative B-roll plate (base64 SVG data URL)
 * derived from the scene's narration and stage when paid image model quota is unavailable.
 */
function buildCustomCinematicSvgPlate(
  scene: VideoScene,
  synthesizedPrompt: string
): string {
  const stage = scene.narrativeStage || 'hook';
  const seedHash = scene.narration
    .split('')
    .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);

  const palettes: Record<
    string,
    { bg1: string; bg2: string; glow1: string; glow2: string; accent: string }
  > = {
    hook: {
      bg1: '#050811',
      bg2: '#0F1B2E',
      glow1: '#D4FF00',
      glow2: '#38BDF8',
      accent: '#F59E0B',
    },
    mechanism: {
      bg1: '#070910',
      bg2: '#161124',
      glow1: '#EF4444',
      glow2: '#D4FF00',
      accent: '#38BDF8',
    },
    trail: {
      bg1: '#040B14',
      bg2: '#0B2135',
      glow1: '#38BDF8',
      glow2: '#D4FF00',
      accent: '#D4FF00',
    },
    aftermath: {
      bg1: '#06080D',
      bg2: '#131A26',
      glow1: '#F59E0B',
      glow2: '#38BDF8',
      accent: '#D4FF00',
    },
  };

  const pal = palettes[stage] || palettes.hook;

  // Build deterministic network nodes and perspective vectors from narration hash
  const nodes: Array<{ x: number; y: number; r: number }> = [];
  for (let i = 0; i < 14; i++) {
    const angle = ((seedHash + i * 47) % 360) * (Math.PI / 180);
    const dist = 110 + ((seedHash * (i + 3)) % 340);
    const nx = Math.round(640 + Math.cos(angle) * dist * 1.35);
    const ny = Math.round(340 + Math.sin(angle) * dist * 0.72);
    const nr = 3 + ((seedHash + i) % 5);
    nodes.push({
      x: Math.max(80, Math.min(1200, nx)),
      y: Math.max(70, Math.min(620, ny)),
      r: nr,
    });
  }

  const edgesSvg = nodes
    .map((n, idx) => {
      const target = nodes[(idx + 1) % nodes.length];
      const target2 = nodes[(idx + 3) % nodes.length];
      return `
        <line x1="${n.x}" y1="${n.y}" x2="${target.x}" y2="${target.y}" stroke="${pal.glow2}" stroke-opacity="0.28" stroke-width="1.5" />
        <line x1="${n.x}" y1="${n.y}" x2="${target2.x}" y2="${target2.y}" stroke="${pal.glow1}" stroke-opacity="0.16" stroke-width="1" stroke-dasharray="4 6" />
      `;
    })
    .join('');

  const nodesSvg = nodes
    .map(
      (n, idx) => `
      <circle cx="${n.x}" cy="${n.y}" r="${n.r * 2.8}" fill="${
        idx % 3 === 0 ? pal.glow1 : pal.glow2
      }" fill-opacity="0.14" />
      <circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${
        idx % 3 === 0 ? pal.glow1 : pal.glow2
      }" fill-opacity="0.85" />
    `
    )
    .join('');

  const promptSnippet = escapeXml(synthesizedPrompt.slice(0, 96));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <defs>
      <radialGradient id="bgGrad" cx="52%" cy="44%" r="75%">
        <stop offset="0%" stop-color="${pal.bg2}" />
        <stop offset="65%" stop-color="${pal.bg1}" />
        <stop offset="100%" stop-color="#030509" />
      </radialGradient>
      <radialGradient id="flare1" cx="62%" cy="38%" r="42%">
        <stop offset="0%" stop-color="${pal.glow1}" stop-opacity="0.24" />
        <stop offset="50%" stop-color="${pal.glow2}" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="horizonBeam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${pal.glow2}" stop-opacity="0" />
        <stop offset="50%" stop-color="${pal.glow1}" stop-opacity="0.45" />
        <stop offset="100%" stop-color="${pal.glow2}" stop-opacity="0" />
      </linearGradient>
    </defs>

    <rect width="1280" height="720" fill="url(#bgGrad)" />
    <rect width="1280" height="720" fill="url(#flare1)" />

    <!-- Perspective Forensic Architecture Grid -->
    <g stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1">
      <line x1="0" y1="180" x2="1280" y2="180" />
      <line x1="0" y1="280" x2="1280" y2="280" />
      <line x1="0" y1="380" x2="1280" y2="380" />
      <line x1="0" y1="480" x2="1280" y2="480" />
      <line x1="220" y1="0" x2="80" y2="720" />
      <line x1="440" y1="0" x2="360" y2="720" />
      <line x1="640" y1="0" x2="640" y2="720" />
      <line x1="840" y1="0" x2="920" y2="720" />
      <line x1="1060" y1="0" x2="1200" y2="720" />
    </g>

    <!-- Optical Target Rings -->
    <circle cx="640" cy="340" r="210" fill="none" stroke="${pal.glow2}" stroke-opacity="0.18" stroke-width="1.5" stroke-dasharray="8 12" />
    <circle cx="640" cy="340" r="135" fill="none" stroke="${pal.glow1}" stroke-opacity="0.26" stroke-width="1.5" />
    <circle cx="640" cy="340" r="64" fill="${pal.glow1}" fill-opacity="0.06" stroke="${pal.glow1}" stroke-opacity="0.4" stroke-width="1.5" />

    <!-- Anamorphic Optical Streak -->
    <rect x="120" y="338" width="1040" height="3" fill="url(#horizonBeam)" />

    <!-- Narration-Derived Constellation Nodes -->
    <g>${edgesSvg}</g>
    <g>${nodesSvg}</g>

    <!-- Subtle Bottom-Left Forensic Telemetry Stamp (leaves top-left 100% clean) -->
    <g transform="translate(64, 645)" opacity="0.42">
      <text x="0" y="0" fill="${pal.glow1}" font-family="monospace" font-size="11" letter-spacing="1.5">AI CINEMA B-ROLL PLATE · ${escapeXml(
        (scene.lensPreset || '35mm-prime').toUpperCase()
      )}</text>
      <text x="0" y="16" fill="#94A3B8" font-family="monospace" font-size="10">${promptSnippet}...</text>
    </g>
  </svg>`;

  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scenePartial: VideoScene = {
      id: String(body.id || 'sc-broll'),
      sceneNumber: Number(body.sceneNumber) || 1,
      chapterTitle: String(body.chapterTitle || '01. Investigative Shot'),
      evidenceCode: String(body.evidenceCode || 'ACT I'),
      narration: String(
        body.narration ||
          'Forensic analysis of the exploit payload and unseen financial trail.'
      ),
      visualPrompt: String(body.visualPrompt || ''),
      imageUrl: String(body.imageUrl || '/assets/images/rook_scene_wallet_drain.jpg'),
      durationSec: Number(body.durationSec) || 8,
      transitionIn: 'forensic-zoom',
      transitionDurationSec: 0.65,
      cameraMotion: (body.cameraMotion as CameraMotionType) || 'push-in',
      lensPreset: (body.lensPreset as LensPresetType) || '35mm-prime',
      lowerThirdTitle: String(body.lowerThirdTitle || ''),
      lowerThirdSubtitle: String(body.lowerThirdSubtitle || ''),
      keyMetricLabel: String(body.keyMetricLabel || 'KEY METRIC'),
      keyMetricValue: String(body.keyMetricValue || '$4.2M'),
      highlightKeywords: [],
      narrativeStage: body.narrativeStage || 'hook',
    };

    const aspectRatio: '16:9' | '9:16' =
      body.aspectRatio === '9:16' ? '9:16' : '16:9';

    // Build base prompt from the scene's narration
    let synthesizedPrompt =
      body.customPrompt && String(body.customPrompt).trim().length > 10
        ? String(body.customPrompt).trim()
        : buildSceneBrollPrompt(scenePartial);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return NextResponse.json({
        imageUrl: buildCustomCinematicSvgPlate(scenePartial, synthesizedPrompt),
        visualPrompt: synthesizedPrompt,
        source: 'procedural-cinema-plate',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Step 1: Optionally enrich the narration-based visual prompt using gemini-4-hydrogen
    try {
      const promptResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write a single concise 35-word cinematic B-roll image generation prompt based on this documentary narration: "${scenePartial.narration}". Style: dark investigative documentary (Fern, Vox, MagnatesMedia, @byrook_tv), high-contrast lighting, optical lens depth, zero text.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      if (promptResp.text && promptResp.text.trim().length > 15) {
        synthesizedPrompt = promptResp.text.trim();
      }
    } catch {
      // Keep deterministic synthesizedPrompt if text refinement is skipped
    }

    // Step 2: Generate cinematic B-roll image with gemini-3.1-flash-lite-image
    try {
      const imgResp = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: synthesizedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
          },
        },
      });

      for (const part of imgResp.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          return NextResponse.json({
            imageUrl,
            visualPrompt: synthesizedPrompt,
            source: 'gemini-3.1-flash-lite-image',
          });
        }
      }
    } catch {
      // Fall through to custom procedural cinema plate if image model quota is unavailable
    }

    return NextResponse.json({
      imageUrl: buildCustomCinematicSvgPlate(scenePartial, synthesizedPrompt),
      visualPrompt: synthesizedPrompt,
      source: 'procedural-cinema-plate',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate B-Roll visual',
      },
      { status: 500 }
    );
  }
}
