'use client';

import React, { useRef, useState } from 'react';
import {
  BrandProfile,
  CAMERA_RIG_CATALOG,
  formatStudioTimecode,
  projectMomentum,
  rubberband,
  SceneTimelineSlot,
  TRANSITION_CATALOG,
  TransitionType,
  VideoScene,
} from '@/lib/video-engine';
import { ArrowRightLeft, Film, Volume2 } from 'lucide-react';

interface TimelineScrubberProps {
  slots: SceneTimelineSlot[];
  totalDurationSec: number;
  currentTimeSec: number;
  selectedSceneId: string;
  brand: BrandProfile;
  onSeek: (newTimeSec: number) => void;
  onSelectScene: (sceneId: string) => void;
  onCycleTransition: (sceneId: string, nextTransition: TransitionType) => void;
}

const TRANSITION_ORDER: TransitionType[] = [
  'forensic-zoom',
  'redaction-glitch',
  'whip-pan',
  'evidence-flash',
  'cross-dissolve',
];

export default function TimelineScrubber({
  slots,
  totalDurationSec,
  currentTimeSec,
  selectedSceneId,
  onSeek,
  onSelectScene,
  onCycleTransition,
}: TimelineScrubberProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pointerHistoryRef = useRef<Array<{ x: number; t: number }>>([]);

  const resolveTimeFromClientX = (clientX: number): number => {
    const el = trackRef.current;
    if (!el || totalDurationSec <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const rawOffset = clientX - rect.left;

    // Apply Apple rubber-banding at timeline boundaries
    let effectivePx = rawOffset;
    if (rawOffset < 0) {
      effectivePx = rubberband(rawOffset, rect.width, 0.35);
    } else if (rawOffset > rect.width) {
      effectivePx =
        rect.width + rubberband(rawOffset - rect.width, rect.width, 0.35);
    }

    const ratio = Math.max(0, Math.min(1, effectivePx / Math.max(1, rect.width)));
    return Number((ratio * totalDurationSec).toFixed(3));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    pointerHistoryRef.current = [{ x: e.clientX, t: performance.now() }];
    onSeek(resolveTimeFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const now = performance.now();
    pointerHistoryRef.current.push({ x: e.clientX, t: now });
    if (pointerHistoryRef.current.length > 5) {
      pointerHistoryRef.current.shift();
    }
    onSeek(resolveTimeFromClientX(e.clientX));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    const history = pointerHistoryRef.current;
    if (history.length >= 2 && trackRef.current) {
      const first = history[0];
      const last = history[history.length - 1];
      const dtMs = Math.max(8, last.t - first.t);
      const velocityPxPerSec = ((last.x - first.x) / dtMs) * 1000;

      // Only project momentum on a deliberate flick (> 180px/s)
      if (Math.abs(velocityPxPerSec) > 180) {
        const projectedDeltaPx = projectMomentum(velocityPxPerSec, 0.992);
        const targetTime = resolveTimeFromClientX(
          e.clientX + projectedDeltaPx * 0.25
        );
        onSeek(targetTime);
      }
    }
  };

  const playheadPercent =
    totalDurationSec > 0
      ? Math.max(0, Math.min(100, (currentTimeSec / totalDurationSec) * 100))
      : 0;

  const handleTransitionClick = (
    e: React.MouseEvent,
    scene: VideoScene
  ) => {
    e.stopPropagation();
    const idx = TRANSITION_ORDER.indexOf(scene.transitionIn);
    const next = TRANSITION_ORDER[(idx + 1) % TRANSITION_ORDER.length];
    onCycleTransition(scene.id, next);
  };

  return (
    <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-4 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="font-semibold text-white">
            Cinema Studio Multi-Shot Timeline
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-[#D4FF00] font-semibold">
            {formatStudioTimecode(currentTimeSec)}
          </span>
          <span aria-hidden="true">/</span>
          <span className="font-mono tabular-nums text-zinc-400">
            {formatStudioTimecode(totalDurationSec)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{slots.length} Shots</span>
        </div>

        <div className="text-xs text-zinc-400">
          Drag playhead for 1:1 frame scrub · Click transition junctions to cycle choreography
        </div>
      </div>

      {/* Interactive Ruler & Scrub Surface */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Episode timeline playhead scrubber"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalDurationSec)}
        aria-valuenow={Math.round(currentTimeSec)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            onSeek(Math.min(totalDurationSec, currentTimeSec + 0.5));
          } else if (e.key === 'ArrowLeft') {
            onSeek(Math.max(0, currentTimeSec - 0.5));
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-8 sm:h-7 bg-[#07080B] border border-white/10 rounded-t-lg cursor-ew-resize flex items-center px-2 overflow-hidden touch-none"
      >
        {Array.from({ length: Math.max(4, Math.ceil(totalDurationSec / 2)) }).map(
          (_, idx) => {
            const sec = idx * 2;
            const leftPct =
              totalDurationSec > 0 ? (sec / totalDurationSec) * 100 : 0;
            if (leftPct > 98) return null;
            return (
              <div
                key={sec}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 bottom-0 flex flex-col justify-between py-1 pointer-events-none"
              >
                <span className="text-[10px] font-mono tabular-nums text-zinc-500 pl-1 border-l border-white/10">
                  {sec}s
                </span>
              </div>
            );
          }
        )}

        {/* Playhead Scrub Line */}
        <div
          style={{ left: `${playheadPercent}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-[#D4FF00] pointer-events-none z-20"
        />
      </div>

      {/* Track 1: Scene Visual & AI Transition Track */}
      <div className="relative flex items-stretch gap-1.5 sm:gap-2 mt-1.5 min-h-[76px] sm:min-h-[82px]">
        {slots.map((slot, idx) => {
          const widthPct =
            totalDurationSec > 0
              ? ((slot.endSec - slot.startSec) / totalDurationSec) * 100
              : 100 / Math.max(1, slots.length);
          const isSelected = slot.scene.id === selectedSceneId;
          const isPlayheadInside =
            currentTimeSec >= slot.startSec && currentTimeSec < slot.endSec;
          const transMeta = TRANSITION_CATALOG[slot.scene.transitionIn];
          const rigCode =
            CAMERA_RIG_CATALOG[slot.scene.cameraMotion]?.code || 'DOLLY';

          return (
            <div
              key={slot.scene.id}
              style={{ width: `${widthPct}%` }}
              className="relative flex items-stretch group min-w-0"
            >
              {/* Compact Transition Junction Icon Button between scenes */}
              {idx > 0 && (
                <button
                  type="button"
                  onClick={(e) => handleTransitionClick(e, slot.scene)}
                  title={`Transition: ${transMeta.label} (Click to cycle)`}
                  aria-label={`Change transition for scene ${slot.scene.sceneNumber}, currently ${transMeta.label}`}
                  className="press-scale absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#11131A] border border-[#D4FF00]/70 text-[#D4FF00] hover:bg-[#D4FF00] hover:text-black transition-colors flex items-center justify-center shrink-0 shadow-sm"
                >
                  <ArrowRightLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onSelectScene(slot.scene.id);
                  onSeek(slot.startSec + 0.1);
                }}
                aria-label={`Select scene ${slot.scene.sceneNumber}: ${slot.scene.chapterTitle}`}
                className={`press-scale w-full text-left px-2 py-2 sm:px-3 sm:py-2.5 rounded-lg border transition-colors flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'bg-[#161922] border-[#D4FF00] text-white'
                    : isPlayheadInside
                    ? 'bg-[#12151E] border-white/25 text-zinc-100'
                    : 'bg-[#080A0E] border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 sm:gap-2 w-full">
                  <span className="text-[11px] sm:text-xs font-semibold truncate text-white">
                    {slot.scene.chapterTitle}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono tabular-nums text-zinc-400 shrink-0">
                    {slot.scene.durationSec}s
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 mt-1 sm:mt-1.5 truncate">
                  <Film className="w-3 h-3 text-[#D4FF00] shrink-0 hidden sm:inline" />
                  <span className="font-mono text-[#D4FF00] shrink-0 truncate">
                    {rigCode}
                  </span>
                  <span aria-hidden="true" className="hidden sm:inline">
                    ·
                  </span>
                  <span className="truncate hidden sm:inline">
                    {transMeta.label}
                  </span>
                </div>
              </button>
            </div>
          );
        })}

        {/* Vertical Playhead Line spanning scene track */}
        <div
          style={{ left: `${playheadPercent}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-[#D4FF00]/85 pointer-events-none z-10"
        />
      </div>

      {/* Track 2: Kinetic Subtitle & Voiceover Sync Track */}
      <div className="relative mt-2 h-8 bg-[#07080B] border border-white/10 rounded-b-lg flex items-center px-2.5 sm:px-3 overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-zinc-400 z-10 pointer-events-none mr-2.5 sm:mr-4 shrink-0">
          <Volume2 className="w-3.5 h-3.5 text-[#D4FF00]" />
          <span className="whitespace-nowrap sm:hidden">Subtitles</span>
          <span className="whitespace-nowrap hidden sm:inline">
            Kinetic Subtitles & Voiceover
          </span>
        </div>

        <div className="relative flex-1 h-full flex items-center">
          {slots.flatMap((slot) =>
            slot.words.map((w, wIdx) => {
              const leftPct =
                totalDurationSec > 0 ? (w.startSec / totalDurationSec) * 100 : 0;
              const widthPct =
                totalDurationSec > 0
                  ? Math.max(0.4, ((w.endSec - w.startSec) / totalDurationSec) * 100)
                  : 1;
              return (
                <div
                  key={`${slot.scene.id}-w-${wIdx}`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={`absolute h-2.5 rounded-xs ${
                    w.highlightTone === 'crimson'
                      ? 'bg-red-500/80'
                      : w.highlightTone === 'amber'
                      ? 'bg-[#D4FF00]/90'
                      : w.highlightTone === 'cyan'
                      ? 'bg-sky-400/80'
                      : 'bg-zinc-700/60'
                  }`}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
