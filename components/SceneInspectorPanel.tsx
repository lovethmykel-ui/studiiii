'use client';

import React, { useState } from 'react';
import {
  auditBrandConsistency,
  BrandProfile,
  buildSceneBrollPrompt,
  CAMERA_RIG_CATALOG,
  CameraMotionType,
  FINANCIAL_CHART_CATALOG,
  FinancialChartType,
  LENS_PRESET_CATALOG,
  LensPresetType,
  resolveSceneFinancialSeries,
  SubtitleWord,
  TRANSITION_CATALOG,
  TransitionType,
  VideoScene,
} from '@/lib/video-engine';
import {
  Activity,
  Aperture,
  AudioWaveform,
  BarChart3,
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Sparkles,
  Subtitles,
  TrendingUp,
  Wand2,
} from 'lucide-react';

interface SceneInspectorPanelProps {
  scene: VideoScene;
  words: SubtitleWord[];
  brand: BrandProfile;
  isSynthesizingTts: boolean;
  isGeneratingBroll?: boolean;
  onUpdateScene: (updated: Partial<VideoScene>) => void;
  onToggleKeyword: (cleanWord: string) => void;
  onSynthesizeVoiceover: (scene: VideoScene) => void;
  onGenerateBroll?: (scene: VideoScene, promptText: string) => void;
  onAutoAssignTransitions: () => void;
}

const SCENE_VISUAL_PRESETS = [
  {
    label: 'Hardware Wallet Exploit',
    url: '/assets/images/rook_scene_wallet_drain.jpg',
  },
  {
    label: 'Forensic War Room & Vault',
    url: '/assets/images/rook_scene_heist_vault.jpg',
  },
  {
    label: 'On-Chain Money Trail Graph',
    url: '/assets/images/rook_scene_money_trail.jpg',
  },
  {
    label: 'Syndicate Server Corridor',
    url: '/assets/images/rook_scene_server_exploit.jpg',
  },
];

const RIG_CATEGORIES: Array<'All' | 'Pushes & Pulls' | 'Pans & Orbits' | 'Cinema FX'> = [
  'All',
  'Pushes & Pulls',
  'Pans & Orbits',
  'Cinema FX',
];

export default function SceneInspectorPanel({
  scene,
  words,
  brand,
  isSynthesizingTts,
  isGeneratingBroll = false,
  onUpdateScene,
  onToggleKeyword,
  onSynthesizeVoiceover,
  onGenerateBroll,
  onAutoAssignTransitions,
}: SceneInspectorPanelProps) {
  const compliance = auditBrandConsistency(scene, brand);
  const [rigCategory, setRigCategory] = useState<
    'All' | 'Pushes & Pulls' | 'Pans & Orbits' | 'Cinema FX'
  >('All');

  const activeLens: LensPresetType = scene.lensPreset || '35mm-prime';
  const activeIntensity = Math.round((scene.motionIntensity ?? 0.75) * 100);

  const filteredRigs = (
    Object.entries(CAMERA_RIG_CATALOG) as Array<
      [CameraMotionType, (typeof CAMERA_RIG_CATALOG)[CameraMotionType]]
    >
  ).filter(([, spec]) =>
    rigCategory === 'All' ? true : spec.category === rigCategory
  );

  return (
    <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 flex flex-col gap-5">
      {/* Header & Brand Audit Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Shot {String(scene.sceneNumber).padStart(2, '0')}</span>
            <span aria-hidden="true">·</span>
            <span>
              {scene.narrativeStage
                ? `Act: ${scene.narrativeStage.toUpperCase()}`
                : 'Investigative Shot'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#D4FF00] font-mono">
              {CAMERA_RIG_CATALOG[scene.cameraMotion]?.code || 'DOLLY IN'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            {scene.chapterTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-400">Pacing & Style Match:</span>
          <span
            className={`font-mono font-semibold tabular-nums ${
              compliance.isCompliant ? 'text-[#D4FF00]' : 'text-amber-400'
            }`}
          >
            {compliance.score}% ({compliance.wpm} WPM)
          </span>
        </div>
      </div>

      {/* Higgsfield Cinema Studio 4.0 — Director of Photography (DoP) Camera Rig Matrix */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#D4FF00]" />
            <span className="text-xs font-semibold text-white">
              DoP Camera Rig & Motion Presets (Parameter-Over-Prompt)
            </span>
          </div>

          {/* Category Filter Tabs */}
          <div
            role="group"
            aria-label="Camera Rig Category Filter"
            className="flex items-center gap-1 p-1 bg-[#07080B] border border-white/10 rounded-lg"
          >
            {RIG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setRigCategory(cat)}
                className={`press-scale px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  rigCategory === cat
                    ? 'bg-[#D4FF00] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Clickable Camera Rig Grid (Higgsfield Motion Tiles) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {filteredRigs.map(([rigKey, spec]) => {
            const isSelected = scene.cameraMotion === rigKey;
            return (
              <button
                key={rigKey}
                type="button"
                onClick={() => onUpdateScene({ cameraMotion: rigKey })}
                className={`press-scale text-left p-2.5 rounded-lg border transition-colors flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-[#161922] border-[#D4FF00] text-white'
                    : 'bg-[#080A0E] border-white/10 text-zinc-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-[10px] font-mono text-zinc-400">
                    {spec.code}
                  </span>
                  {spec.badge && (
                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        isSelected ? 'text-[#D4FF00]' : 'text-zinc-400'
                      }`}
                    >
                      {spec.badge}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold truncate w-full">
                  {spec.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Physical Lens Rack + Motion Velocity Slider */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-8">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-1.5">
              <Aperture className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span>Cinema Optical Lens</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                Object.entries(LENS_PRESET_CATALOG) as Array<
                  [LensPresetType, (typeof LENS_PRESET_CATALOG)[LensPresetType]]
                >
              ).map(([lensKey, lensSpec]) => {
                const isActive = activeLens === lensKey;
                return (
                  <button
                    key={lensKey}
                    type="button"
                    onClick={() => onUpdateScene({ lensPreset: lensKey })}
                    className={`press-scale px-2.5 py-2 rounded-lg border text-left transition-colors ${
                      isActive
                        ? 'bg-[#161922] border-[#D4FF00] text-white'
                        : 'bg-[#080A0E] border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={isActive ? 'text-[#D4FF00] font-bold' : 'text-zinc-200'}>
                        {lensSpec.focalLength}
                      </span>
                      <span className="text-zinc-500">{lensSpec.aperture}</span>
                    </div>
                    <div className="text-[11px] truncate mt-0.5">
                      {lensSpec.label.replace(/^\d+mm\s*/, '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col justify-between bg-[#080A0E] border border-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="motion-intensity-slider" className="text-zinc-300 font-medium">
                Rig Motion Intensity
              </label>
              <span className="font-mono tabular-nums text-[#D4FF00]">
                {activeIntensity}%
              </span>
            </div>
            <input
              id="motion-intensity-slider"
              type="range"
              min={25}
              max={100}
              step={5}
              value={activeIntensity}
              onChange={(e) =>
                onUpdateScene({
                  motionIntensity: Number(e.target.value) / 100,
                })
              }
              className="w-full accent-[#D4FF00] cursor-pointer my-1"
            />
            <div className="text-[11px] text-zinc-500 truncate">
              {CAMERA_RIG_CATALOG[scene.cameraMotion]?.description}
            </div>
          </div>
        </div>
      </div>

      {/* Transition Choreography & Shot Duration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-white/10">
        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="scene-transition-select"
              className="text-xs font-medium text-zinc-300"
            >
              Cut & Transition Choreography
            </label>
            <button
              type="button"
              onClick={onAutoAssignTransitions}
              className="press-scale text-xs text-[#D4FF00] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Wand2 className="w-3 h-3" />
              <span>Auto-Match All Cuts</span>
            </button>
          </div>
          <select
            id="scene-transition-select"
            value={scene.transitionIn}
            onChange={(e) =>
              onUpdateScene({ transitionIn: e.target.value as TransitionType })
            }
            className="w-full h-10 px-3 rounded-lg bg-[#080A0E] border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4FF00]"
          >
            {(
              Object.entries(TRANSITION_CATALOG) as Array<
                [TransitionType, (typeof TRANSITION_CATALOG)[TransitionType]]
              >
            ).map(([key, spec]) => (
              <option key={key} value={key}>
                {spec.label} (damping {spec.damping}, resp {spec.response}s)
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="scene-duration-input"
            className="block text-xs font-medium text-zinc-300 mb-1.5"
          >
            Shot Duration (Seconds)
          </label>
          <input
            id="scene-duration-input"
            type="number"
            min={4}
            max={15}
            step={1}
            value={scene.durationSec}
            onChange={(e) =>
              onUpdateScene({
                durationSec: Math.min(
                  15,
                  Math.max(4, Number(e.target.value) || 8)
                ),
              })
            }
            className="w-full h-10 px-3 rounded-lg bg-[#080A0E] border border-white/10 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-[#D4FF00]"
          />
        </div>
      </div>

      {/* Narration Script + Voiceover Synthesis */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <label
            htmlFor="scene-narration-textarea"
            className="text-xs font-medium text-zinc-300"
          >
            Investigative Voiceover Script & Auto-Timed Subtitles
          </label>
          <button
            type="button"
            disabled={isSynthesizingTts}
            onClick={() => onSynthesizeVoiceover(scene)}
            className="press-scale px-3 py-1.5 rounded-lg bg-[#D4FF00]/15 border border-[#D4FF00]/40 text-xs font-medium text-[#D4FF00] hover:bg-[#D4FF00]/25 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {isSynthesizingTts ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : scene.audioDataUrl ? (
              <Check className="w-3.5 h-3.5 text-[#D4FF00]" />
            ) : (
              <AudioWaveform className="w-3.5 h-3.5" />
            )}
            <span>
              {isSynthesizingTts
                ? 'Synthesizing Voiceover...'
                : scene.audioDataUrl
                ? 'Voiceover Ready (Re-Synthesize)'
                : `Synthesize AI Voiceover (${brand.defaultVoice})`}
            </span>
          </button>
        </div>

        <textarea
          id="scene-narration-textarea"
          rows={3}
          value={scene.narration}
          onChange={(e) => onUpdateScene({ narration: e.target.value })}
          className="w-full p-3 rounded-lg bg-[#080A0E] border border-white/10 text-sm text-white leading-relaxed focus:outline-none focus:border-[#D4FF00]"
        />

        {scene.audioDataUrl && (
          <div className="mt-2 flex items-center gap-3 p-2.5 rounded-lg bg-[#080A0E] border border-white/10">
            <span className="text-xs text-[#D4FF00] font-medium whitespace-nowrap">
              24kHz WAV Narrator Track
            </span>
            <audio
              controls
              src={scene.audioDataUrl}
              className="h-8 w-full max-w-md"
            />
          </div>
        )}
      </div>

      {/* Interactive Kinetic Subtitle Word Token Matrix */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <Subtitles className="w-3.5 h-3.5 text-[#D4FF00]" />
            <span>
              Kinetic Subtitle Word Emphasis (Click any word to toggle @byrook_tv highlight)
            </span>
          </div>
          <div className="text-xs text-zinc-400">
            Amber: Figures · Crimson: Exploits · Cyan: Tech
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#080A0E] border border-white/10 flex flex-wrap gap-1.5">
          {words.map((w, idx) => {
            let toneStyle =
              'bg-[#12151E] border-white/10 text-zinc-300 hover:border-white/25';
            if (w.isHighlighted) {
              if (w.highlightTone === 'crimson') {
                toneStyle =
                  'bg-red-950/60 border-red-500/60 text-red-200 font-semibold';
              } else if (w.highlightTone === 'cyan') {
                toneStyle =
                  'bg-sky-950/60 border-sky-500/60 text-sky-200 font-semibold';
              } else {
                toneStyle =
                  'bg-amber-950/60 border-amber-500/60 text-amber-200 font-semibold';
              }
            }

            return (
              <button
                key={`${w.cleanWord}-${idx}`}
                type="button"
                onClick={() => onToggleKeyword(w.cleanWord)}
                title={`${w.startSec}s – ${w.endSec}s (Click to toggle highlight)`}
                className={`press-scale px-2 py-1 rounded border text-xs transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${toneStyle}`}
              >
                <span>{w.word}</span>
                <span className="text-[10px] font-mono tabular-nums opacity-65">
                  {w.startSec.toFixed(1)}s
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial Data Overlay Toggle & Chart Type Selector */}
      <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#D4FF00]" />
            <div>
              <span className="text-xs font-semibold text-white">
                Financial Data Overlay (Canvas Telemetry Chart)
              </span>
              <p className="text-[11px] text-zinc-400">
                Render key financial & forensic metrics visually on the video canvas for this shot.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(scene.showFinancialOverlay)}
            aria-label="Show Financial Data Overlay"
            onClick={() =>
              onUpdateScene({
                showFinancialOverlay: !scene.showFinancialOverlay,
                financialChartType: scene.financialChartType || 'line',
              })
            }
            className={`press-scale px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
              scene.showFinancialOverlay
                ? 'bg-[#D4FF00] text-black border-[#D4FF00]'
                : 'bg-[#080A0E] text-zinc-300 border-white/15 hover:border-white/30 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                scene.showFinancialOverlay ? 'bg-black' : 'bg-zinc-500'
              }`}
            />
            <span>Show Financial Data Overlay</span>
            <span className="font-mono text-[10px] uppercase opacity-80">
              {scene.showFinancialOverlay ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Chart Type Picker & Live Telemetry Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#080A0E] border border-white/10 rounded-lg p-3">
          <div className="md:col-span-7 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">
                Chart Visualization Type
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {
                  FINANCIAL_CHART_CATALOG[scene.financialChartType || 'line']
                    ?.code
                }
              </span>
            </div>

            <div
              role="group"
              aria-label="Financial Chart Type"
              className="grid grid-cols-3 gap-2"
            >
              {(
                Object.entries(FINANCIAL_CHART_CATALOG) as Array<
                  [
                    FinancialChartType,
                    (typeof FINANCIAL_CHART_CATALOG)[FinancialChartType],
                  ]
                >
              ).map(([chartKey, spec]) => {
                const currentChart = scene.financialChartType || 'line';
                const isSelected = currentChart === chartKey;
                const IconComponent =
                  chartKey === 'bar'
                    ? BarChart3
                    : chartKey === 'area'
                    ? Activity
                    : TrendingUp;

                return (
                  <button
                    key={chartKey}
                    type="button"
                    onClick={() =>
                      onUpdateScene({
                        financialChartType: chartKey,
                        showFinancialOverlay: true,
                      })
                    }
                    className={`press-scale px-3 py-2 rounded-lg border text-left transition-colors flex flex-col gap-1 ${
                      isSelected && scene.showFinancialOverlay
                        ? 'bg-[#161922] border-[#D4FF00] text-white'
                        : isSelected
                        ? 'bg-[#12151E] border-white/25 text-zinc-200'
                        : 'bg-[#0D0F14] border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <IconComponent
                        className={`w-3.5 h-3.5 ${
                          isSelected && scene.showFinancialOverlay
                            ? 'text-[#D4FF00]'
                            : 'text-zinc-400'
                        }`}
                      />
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        {chartKey}
                      </span>
                    </div>
                    <span className="text-xs font-semibold truncate">
                      {spec.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-zinc-500">
              {
                FINANCIAL_CHART_CATALOG[scene.financialChartType || 'line']
                  ?.description
              }
            </p>
          </div>

          <div className="md:col-span-5 flex flex-col justify-between bg-[#0D0F14] border border-white/10 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-zinc-400 uppercase truncate">
                {scene.keyMetricLabel || 'KEY METRIC'}
              </span>
              <span className="font-mono font-bold text-[#D4FF00] tabular-nums">
                {scene.keyMetricValue}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1 items-end h-12 pt-2">
              {resolveSceneFinancialSeries(scene).map((pt, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <div
                    key={pt.label}
                    className="flex flex-col items-center gap-1 h-full justify-end"
                  >
                    <div
                      style={{ height: `${Math.max(15, pt.value)}%` }}
                      className={`w-full rounded-t transition-all ${
                        isLast
                          ? 'bg-[#D4FF00]'
                          : scene.showFinancialOverlay
                          ? 'bg-sky-400/75'
                          : 'bg-zinc-700'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-zinc-500 truncate w-full text-center">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Chapter Title, Key Figure & Visual Artwork Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-white/10">
        <div>
          <label
            htmlFor="scene-chapter-title-input"
            className="block text-xs font-medium text-zinc-300 mb-1"
          >
            Shot / Chapter Label
          </label>
          <input
            id="scene-chapter-title-input"
            type="text"
            value={scene.chapterTitle}
            onChange={(e) =>
              onUpdateScene({ chapterTitle: e.target.value })
            }
            className="w-full h-9 px-3 rounded-lg bg-[#080A0E] border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
          />
        </div>

        <div>
          <label
            htmlFor="scene-metric-label"
            className="block text-xs font-medium text-zinc-300 mb-1"
          >
            Metric Label
          </label>
          <input
            id="scene-metric-label"
            type="text"
            value={scene.keyMetricLabel}
            onChange={(e) =>
              onUpdateScene({ keyMetricLabel: e.target.value })
            }
            className="w-full h-9 px-3 rounded-lg bg-[#080A0E] border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#D4FF00]"
          />
        </div>

        <div>
          <label
            htmlFor="scene-metric-value"
            className="block text-xs font-medium text-zinc-300 mb-1"
          >
            Key Figure ({scene.keyMetricLabel})
          </label>
          <input
            id="scene-metric-value"
            type="text"
            value={scene.keyMetricValue}
            onChange={(e) =>
              onUpdateScene({ keyMetricValue: e.target.value })
            }
            className="w-full h-9 px-3 rounded-lg bg-[#080A0E] border border-white/10 text-xs font-mono tabular-nums text-[#D4FF00] focus:outline-none focus:border-[#D4FF00]"
          />
        </div>

        <div>
          <label
            htmlFor="scene-broll-select"
            className="block text-xs font-medium text-zinc-300 mb-1"
          >
            Base Plate Artwork
          </label>
          <select
            id="scene-broll-select"
            value={scene.imageUrl}
            onChange={(e) => onUpdateScene({ imageUrl: e.target.value })}
            className="w-full h-9 px-3 rounded-lg bg-[#080A0E] border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
          >
            {!SCENE_VISUAL_PRESETS.some((p) => p.url === scene.imageUrl) && (
              <option value={scene.imageUrl}>
                Custom AI-Generated B-Roll Plate
              </option>
            )}
            {SCENE_VISUAL_PRESETS.map((preset) => (
              <option key={preset.url} value={preset.url}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Cinematic B-Roll Generator (Utilizes Image Generation Prompt Based on Scene Narration) */}
      <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-[#D4FF00]" />
            <div>
              <label
                htmlFor="scene-broll-prompt-input"
                className="text-xs font-semibold text-white cursor-pointer"
              >
                Cinematic B-Roll Prompt (Derived from Scene Narration)
              </label>
              <p className="text-[11px] text-zinc-400">
                Synthesizes custom documentary imagery from this shot&apos;s voiceover narration & optical lens settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateScene({
                  visualPrompt: buildSceneBrollPrompt(scene),
                })
              }
              className="press-scale px-2.5 py-1.5 rounded-lg bg-[#080A0E] border border-white/15 text-xs text-zinc-300 hover:text-white hover:border-white/30 transition-colors whitespace-nowrap shrink-0"
            >
              Sync Prompt from Narration
            </button>

            <button
              type="button"
              disabled={isGeneratingBroll}
              onClick={() => {
                const promptToUse =
                  scene.visualPrompt?.trim() || buildSceneBrollPrompt(scene);
                if (onGenerateBroll) {
                  onGenerateBroll(scene, promptToUse);
                }
              }}
              className="press-scale px-3.5 py-1.5 rounded-lg bg-[#D4FF00] text-black text-xs font-bold hover:bg-[#c8f000] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {isGeneratingBroll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating B-Roll...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate B-Roll</span>
                </>
              )}
            </button>
          </div>
        </div>

        <input
          id="scene-broll-prompt-input"
          type="text"
          value={scene.visualPrompt || buildSceneBrollPrompt(scene)}
          onChange={(e) => onUpdateScene({ visualPrompt: e.target.value })}
          placeholder="Cinematic documentary B-roll prompt derived from narration..."
          className="w-full h-9 px-3 rounded-lg bg-[#080A0E] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-[#D4FF00]"
        />
      </div>

      {/* Brand Compliance Notes */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 pt-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#D4FF00] shrink-0" />
          <span>{compliance.notes.join(' · ')}</span>
        </div>
      </div>
    </div>
  );
}
