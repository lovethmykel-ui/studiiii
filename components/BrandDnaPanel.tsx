'use client';

import React from 'react';
import {
  BrandProfile,
  ROOK_DEFAULT_BRAND,
  SubtitleStylePreset,
} from '@/lib/video-engine';
import { RotateCcw, ShieldCheck, Sliders } from 'lucide-react';

interface BrandDnaPanelProps {
  brand: BrandProfile;
  onUpdateBrand: (patch: Partial<BrandProfile>) => void;
  onResetBrand: () => void;
}

export default function BrandDnaPanel({
  brand,
  onUpdateBrand,
  onResetBrand,
}: BrandDnaPanelProps) {
  return (
    <div className="bg-[#0C121E] border border-slate-800/90 rounded-lg p-5 flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="text-xs text-sky-400 font-medium">
            Channel Aesthetic Lock · {brand.channelUrl}
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-0.5">
            {brand.channelName} ({brand.channelHandle}) Brand DNA Profile
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enforces consistent investigative documentary grading, subtitle typography, and kinetic transition physics across every upload.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetBrand}
          className="press-scale px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore @byrook_tv Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Subtitle Typography & Kinetic Rules */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Subtitle Style & Cadence</span>
          </div>

          <div>
            <label
              htmlFor="brand-subtitle-preset"
              className="block text-xs text-slate-400 mb-1"
            >
              Typography Preset
            </label>
            <select
              id="brand-subtitle-preset"
              value={brand.subtitlePreset}
              onChange={(e) =>
                onUpdateBrand({
                  subtitlePreset: e.target.value as SubtitleStylePreset,
                })
              }
              className="w-full h-9 px-3 rounded-md bg-[#080C14] border border-slate-800 text-xs text-slate-100"
            >
              <option value="rook-kinetic">
                Rook Kinetic Documentary (Bold All-Caps + Plate)
              </option>
              <option value="forensic-typewriter">
                Forensic Terminal (JetBrains Mono Tabular)
              </option>
              <option value="editorial-minimal">
                Editorial Clean (Mixed-Case Documentary)
              </option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <label htmlFor="brand-font-scale">Subtitle Scale</label>
              <span className="font-mono tabular-nums text-slate-200">
                {Math.round(brand.subtitleFontScale * 100)}%
              </span>
            </div>
            <input
              id="brand-font-scale"
              type="range"
              min={0.8}
              max={1.25}
              step={0.05}
              value={brand.subtitleFontScale}
              onChange={(e) =>
                onUpdateBrand({ subtitleFontScale: Number(e.target.value) })
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={brand.autoHighlightNumbers}
                onChange={(e) =>
                  onUpdateBrand({ autoHighlightNumbers: e.target.checked })
                }
                className="rounded border-slate-700 accent-amber-400"
              />
              <span>Auto-highlight dollar amounts & timestamps (Amber)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={brand.autoHighlightExploitTerms}
                onChange={(e) =>
                  onUpdateBrand({
                    autoHighlightExploitTerms: e.target.checked,
                  })
                }
                className="rounded border-slate-700 accent-sky-400"
              />
              <span>Auto-highlight cyber exploit & forensic terms</span>
            </label>
          </div>
        </div>

        {/* Column 2: Noir Forensic Color Grading & Optical Vignette */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Noir Forensic Color Grading</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <label htmlFor="brand-vignette">Optical Vignette Depth</label>
              <span className="font-mono tabular-nums text-slate-200">
                {Math.round(brand.vignetteIntensity * 100)}%
              </span>
            </div>
            <input
              id="brand-vignette"
              type="range"
              min={0.15}
              max={0.65}
              step={0.05}
              value={brand.vignetteIntensity}
              onChange={(e) =>
                onUpdateBrand({ vignetteIntensity: Number(e.target.value) })
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <label htmlFor="brand-subtitle-y">Subtitle Vertical Anchor</label>
              <span className="font-mono tabular-nums text-slate-200">
                {Math.round(brand.subtitleYPosition * 100)}%
              </span>
            </div>
            <input
              id="brand-subtitle-y"
              type="range"
              min={0.72}
              max={0.88}
              step={0.02}
              value={brand.subtitleYPosition}
              onChange={(e) =>
                onUpdateBrand({ subtitleYPosition: Number(e.target.value) })
              }
              className="w-full accent-sky-400"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={brand.watermarkEnabled}
              onChange={(e) =>
                onUpdateBrand({ watermarkEnabled: e.target.checked })
              }
              className="rounded border-slate-700 accent-sky-400"
            />
            <span>Burn in @BYROOK_TV archive header watermark</span>
          </label>
        </div>

        {/* Column 3: Narrator Voice Persona & Palette Swatches */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-200">
            Documentary Narrator & Accent Palette
          </div>

          <div>
            <label
              htmlFor="brand-voice-select"
              className="block text-xs text-slate-400 mb-1"
            >
              Default Gemini 3.8 TTS Narrator Voice
            </label>
            <select
              id="brand-voice-select"
              value={brand.defaultVoice}
              onChange={(e) =>
                onUpdateBrand({
                  defaultVoice: e.target.value as BrandProfile['defaultVoice'],
                })
              }
              className="w-full h-9 px-3 rounded-md bg-[#080C14] border border-slate-800 text-xs text-slate-100"
            >
              <option value="Charon">
                Charon (Deep Investigative Documentary Narrator)
              </option>
              <option value="Fenrir">
                Fenrir (Measured Cybersecurity Analyst)
              </option>
              <option value="Kore">
                Kore (Crisp Financial Journalism Anchor)
              </option>
              <option value="Puck">Puck (Fast-Paced YouTube Shorts Host)</option>
              <option value="Zephyr">Zephyr (Calm Archival Storyteller)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 rounded bg-[#080C14] border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-xs shrink-0"
                  style={{ backgroundColor: brand.primaryAccentHex }}
                />
                <span className="text-[11px] font-mono text-slate-300">
                  {brand.primaryAccentHex}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Forensic Cyan</div>
            </div>

            <div className="p-2 rounded bg-[#080C14] border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-xs shrink-0"
                  style={{ backgroundColor: brand.secondaryAccentHex }}
                />
                <span className="text-[11px] font-mono text-slate-300">
                  {brand.secondaryAccentHex}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Ledger Amber</div>
            </div>

            <div className="p-2 rounded bg-[#080C14] border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-xs shrink-0"
                  style={{ backgroundColor: brand.alertAccentHex }}
                />
                <span className="text-[11px] font-mono text-slate-300">
                  {brand.alertAccentHex}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Breach Alert</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export { ROOK_DEFAULT_BRAND };
