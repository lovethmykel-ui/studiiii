import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildFallbackNarrativeBeats,
  NarrativeBeat,
  VideoScene,
} from '@/lib/video-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const episodeTitle: string =
      body.episodeTitle || 'Investigative Documentary';
    const hookLine: string = body.hookLine || '';
    const dossierSummary: string = body.dossierSummary || '';
    const scenes: VideoScene[] = Array.isArray(body.scenes) ? body.scenes : [];

    const fallbackBeats = buildFallbackNarrativeBeats(scenes, episodeTitle);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return NextResponse.json({
        narrativeBeats: fallbackBeats,
        source: 'deterministic-beat-engine',
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

    const sceneBreakdownText = scenes
      .map(
        (sc, idx) =>
          `Scene ${idx + 1} (${sc.chapterTitle}): Narration: "${sc.narration}" | Key Metric: ${sc.keyMetricLabel}: ${sc.keyMetricValue}`
      )
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Break down the following investigative documentary episode for youtube.com/@byrook_tv into ${Math.max(
        3,
        scenes.length
      )} thematic narrative chapters with specific emotional tone cues and pacing guidance.

Episode Title: "${episodeTitle}"
Hook: "${hookLine}"
Research Summary: "${dossierSummary}"
Current Scene Sequence:
${sceneBreakdownText}`,
      config: {
        systemInstruction:
          'You are the lead story editor for Rook (@byrook_tv), crafting investigative documentary narrative arcs in the style of Fern, Vox, and MagnatesMedia. Output strictly valid JSON matching the schema.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              beatNumber: { type: Type.INTEGER },
              chapterTitle: { type: Type.STRING },
              thematicFocus: { type: Type.STRING },
              emotionalTone: { type: Type.STRING },
              pacingCue: { type: Type.STRING },
              visualMotif: { type: Type.STRING },
            },
            required: [
              'beatNumber',
              'chapterTitle',
              'thematicFocus',
              'emotionalTone',
              'pacingCue',
            ],
          },
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return NextResponse.json({
        narrativeBeats: fallbackBeats,
        source: 'deterministic-beat-engine',
      });
    }

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({
        narrativeBeats: fallbackBeats,
        source: 'deterministic-beat-engine',
      });
    }

    const beats: NarrativeBeat[] = parsed.map(
      (item: Record<string, unknown>, idx: number) => ({
        id: `beat-${Date.now()}-${idx + 1}`,
        beatNumber: Number(item.beatNumber) || idx + 1,
        chapterTitle:
          String(item.chapterTitle || '') ||
          fallbackBeats[idx]?.chapterTitle ||
          `0${idx + 1}. Narrative Chapter`,
        thematicFocus:
          String(item.thematicFocus || '') ||
          fallbackBeats[idx]?.thematicFocus ||
          'Investigative structural breakdown.',
        emotionalTone:
          String(item.emotionalTone || '') ||
          fallbackBeats[idx]?.emotionalTone ||
          'Cold Forensic Tension',
        pacingCue:
          String(item.pacingCue || '') ||
          fallbackBeats[idx]?.pacingCue ||
          '160 WPM measured documentary cadence',
        visualMotif: String(
          item.visualMotif || fallbackBeats[idx]?.visualMotif || ''
        ),
      })
    );

    return NextResponse.json({
      narrativeBeats: beats,
      source: 'gemini-4-hydrogen',
    });
  } catch {
    return NextResponse.json({
      narrativeBeats: buildFallbackNarrativeBeats([], 'Investigative Documentary'),
      source: 'deterministic-beat-fallback',
    });
  }
}
