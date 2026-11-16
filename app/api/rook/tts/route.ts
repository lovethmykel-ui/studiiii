import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generates a valid 24kHz 16-bit mono WAV audio buffer with subtle documentary
 * narration cadence pulses when offline or when no API key is configured.
 */
function synthesizeFallbackWavBase64(durationSec = 4): string {
  const sampleRate = 24000;
  const clampedDur = Math.max(1.5, Math.min(8, durationSec));
  const numSamples = Math.floor(sampleRate * clampedDur);
  const dataByteLength = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataByteLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format = 1
  buffer.writeUInt16LE(1, 22); // Mono = 1
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataByteLength, 40);

  // Subtle warm low-frequency documentary sub-bass ambience + syllable envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const syllableEnvelope =
      0.5 + 0.5 * Math.sin(2 * Math.PI * 3.2 * t) * Math.cos(2 * Math.PI * 0.7 * t);
    const fadeOut = Math.min(1, (clampedDur - t) * 4, t * 8);
    const fundamental =
      Math.sin(2 * Math.PI * 110 * t) * 0.6 +
      Math.sin(2 * Math.PI * 220 * t) * 0.3 +
      Math.sin(2 * Math.PI * 165 * t) * 0.1;
    const sample = Math.max(
      -1,
      Math.min(1, fundamental * syllableEnvelope * fadeOut * 0.22)
    );
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  return buffer.toString('base64');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string =
      body.text ||
      'You never typed your seed phrase. Yet in 1.4 seconds, $4.2M vanished with one click.';
    const voiceName: string = body.voiceName || 'Charon';
    const durationSec: number = Number(body.durationSec) || 6;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      const wavBase64 = synthesizeFallbackWavBase64(durationSec);
      return NextResponse.json({
        audioDataUrl: `data:audio/wav;base64,${wavBase64}`,
        mimeType: 'audio/wav',
        voiceName,
        source: 'studio-synth-fallback',
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style:
                  'Measured, authoritative investigative cyber-documentary narrator with crisp articulation',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      const wavBase64 = synthesizeFallbackWavBase64(durationSec);
      return NextResponse.json({
        audioDataUrl: `data:audio/wav;base64,${wavBase64}`,
        mimeType: 'audio/wav',
        voiceName,
        source: 'studio-synth-fallback',
      });
    }

    return NextResponse.json({
      audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
      mimeType: 'audio/wav',
      voiceName,
      source: 'gemini-3.8-flash-lite-tts',
    });
  } catch (error) {
    const wavBase64 = synthesizeFallbackWavBase64(5);
    return NextResponse.json({
      audioDataUrl: `data:audio/wav;base64,${wavBase64}`,
      mimeType: 'audio/wav',
      source: 'studio-synth-fallback',
      warning: error instanceof Error ? error.message : 'TTS fallback used',
    });
  }
}
