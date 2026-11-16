'use client';

import React, { useMemo, useState } from 'react';
import {
  BatchExportEntry,
  BrandProfile,
  EpisodeProject,
} from '@/lib/video-engine';
import {
  BatchExportProgress,
  exportEpisodesBatchZip,
} from '@/lib/batch-export';
import {
  Archive,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Video,
} from 'lucide-react';

interface EpisodeArchivePanelProps {
  episodes: EpisodeProject[];
  activeEpisodeId: string;
  brand: BrandProfile;
  onLoadEpisode: (episode: EpisodeProject) => void;
  onBatchExportComplete: (
    exportedIds: string[],
    zipFilename: string,
    entries: BatchExportEntry[]
  ) => void;
}

export default function EpisodeArchivePanel({
  episodes,
  activeEpisodeId,
  brand,
  onLoadEpisode,
  onBatchExportComplete,
}: EpisodeArchivePanelProps) {
  // Track deselected IDs so all episodes (including newly researched ones) default to selected cleanly
  const [deselectedIds, setDeselectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<BatchExportProgress | null>(null);
  const [selectionError, setSelectionError] = useState<string>('');
  const [lastBatchResult, setLastBatchResult] = useState<{
    zipUrl: string;
    zipFilename: string;
    entries: BatchExportEntry[];
    totalSizeKb: number;
  } | null>(null);

  const selectedIds = useMemo(
    () =>
      episodes
        .map((ep) => ep.id)
        .filter((id) => !deselectedIds.includes(id)),
    [episodes, deselectedIds]
  );

  const toggleEpisodeSelection = (episodeId: string) => {
    setSelectionError('');
    setDeselectedIds((prev) =>
      prev.includes(episodeId)
        ? prev.filter((id) => id !== episodeId)
        : [...prev, episodeId]
    );
  };

  const handleSelectAll = () => {
    setSelectionError('');
    setDeselectedIds([]);
  };

  const handleClearSelection = () => {
    setSelectionError('');
    setDeselectedIds(episodes.map((ep) => ep.id));
  };

  const handleBatchExport = async () => {
    const selectedEpisodes = episodes.filter((ep) =>
      selectedIds.includes(ep.id)
    );
    if (selectedEpisodes.length === 0) {
      setSelectionError(
        'Select at least one episode from the archive to export as a ZIP.'
      );
      return;
    }

    setSelectionError('');
    setIsExporting(true);
    setProgress({
      completedCount: 0,
      totalCount: selectedEpisodes.length,
      currentEpisodeTitle: selectedEpisodes[0].title,
      stage: 'rendering-video',
    });

    try {
      const result = await exportEpisodesBatchZip(
        selectedEpisodes,
        brand,
        (prog) => setProgress(prog)
      );

      if (lastBatchResult?.zipUrl) {
        URL.revokeObjectURL(lastBatchResult.zipUrl);
      }

      const zipUrl = URL.createObjectURL(result.zipBlob);
      const totalSizeKb = Math.max(1, Math.round(result.totalSizeBytes / 1024));

      setLastBatchResult({
        zipUrl,
        zipFilename: result.zipFilename,
        entries: result.entries,
        totalSizeKb,
      });

      // Trigger automatic ZIP download
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = result.zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      onBatchExportComplete(
        selectedEpisodes.map((e) => e.id),
        result.zipFilename,
        result.entries
      );
    } catch {
      setSelectionError(
        'Failed to compile batch ZIP archive. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const allSelected =
    episodes.length > 0 && selectedIds.length === episodes.length;

  return (
    <section
      aria-label="Episode Archive"
      className="bg-[#0D0F14] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col gap-4"
    >
      {/* Archive Header + Batch Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs text-[#D4FF00] font-medium">
            Multi-Shot Documentary Projects
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">
            @byrook_tv Episode Archive ({episodes.length} Episodes)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select multiple episodes to render their individual .SRT subtitles and master .WebM videos into a single ZIP archive.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isExporting || episodes.length === 0}
            onClick={allSelected ? handleClearSelection : handleSelectAll}
            className="press-scale px-3 py-2 rounded-lg bg-[#07080B] border border-white/15 text-xs font-medium text-zinc-200 hover:border-white/35 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {allSelected ? 'Clear Selection' : 'Select All'}
          </button>

          <button
            type="button"
            disabled={isExporting || episodes.length === 0}
            onClick={handleBatchExport}
            className="press-scale px-4 py-2 rounded-lg bg-[#D4FF00] text-black text-xs font-bold hover:bg-[#c8f000] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Packaging Batch ZIP...</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>
                  Batch Export ({selectedIds.length})
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {selectionError && (
        <div
          role="alert"
          className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-xs text-red-300"
        >
          {selectionError}
        </div>
      )}

      {/* Live Batch Export Progress Bar */}
      {isExporting && progress && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#07080B] border border-[#D4FF00]/40 flex flex-col gap-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-white font-semibold">
              {progress.stage === 'packaging-zip'
                ? 'Compressing .SRT & .WebM files into ZIP...'
                : `Rendering Episode ${Math.min(
                    progress.completedCount + 1,
                    progress.totalCount
                  )} of ${progress.totalCount}: ${progress.currentEpisodeTitle}`}
            </span>
            <span className="font-mono tabular-nums text-[#D4FF00]">
              {Math.round(
                (progress.completedCount / Math.max(1, progress.totalCount)) *
                  100
              )}
              %
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4FF00] transition-all duration-300"
              style={{
                width: `${Math.max(
                  12,
                  Math.round(
                    (progress.completedCount /
                      Math.max(1, progress.totalCount)) *
                      100
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Completed Batch ZIP Summary & Download Card */}
      {lastBatchResult && !isExporting && (
        <div
          role="status"
          className="p-4 rounded-xl bg-[#07080B] border border-[#D4FF00]/50 flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-200">
              <CheckCircle2 className="w-4 h-4 text-[#D4FF00] shrink-0" />
              <span>
                Packaged{' '}
                <strong className="text-white">
                  {lastBatchResult.entries.length} episodes
                </strong>{' '}
                ({lastBatchResult.entries.length * 2} media &amp; subtitle
                files · {lastBatchResult.totalSizeKb} KB)
              </span>
            </div>

            <a
              href={lastBatchResult.zipUrl}
              download={lastBatchResult.zipFilename}
              className="press-scale px-3.5 py-1.5 rounded-lg bg-[#D4FF00] text-black text-xs font-bold hover:bg-[#c8f000] flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {lastBatchResult.zipFilename}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
            {lastBatchResult.entries.map((entry) => (
              <div
                key={entry.episodeId}
                className="p-2.5 rounded-lg bg-[#0D0F14] border border-white/10 text-[11px] flex flex-col gap-1"
              >
                <span className="font-semibold text-white truncate">
                  {entry.title}
                </span>
                <div className="flex items-center gap-1.5 text-zinc-400 font-mono truncate">
                  <FileText className="w-3 h-3 text-[#D4FF00] shrink-0" />
                  <span className="truncate">{entry.srtFilename}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 font-mono truncate">
                  <Video className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">{entry.videoFilename}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Episode Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {episodes.map((ep) => {
          const isCurrent = ep.id === activeEpisodeId;
          const isSelectedForBatch = selectedIds.includes(ep.id);
          const checkboxId = `batch-select-${ep.id}`;

          return (
            <div
              key={ep.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                isSelectedForBatch
                  ? 'bg-[#131722] border-[#D4FF00]/70'
                  : 'bg-[#080A0E] border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                  <label
                    htmlFor={checkboxId}
                    className="inline-flex items-center gap-2 cursor-pointer text-zinc-200 font-medium select-none"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={isSelectedForBatch}
                      onChange={() => toggleEpisodeSelection(ep.id)}
                      aria-label={`Select "${ep.title}" for batch export`}
                      className="w-4 h-4 accent-[#D4FF00] rounded cursor-pointer"
                    />
                    <span>Include in Batch ZIP</span>
                  </label>

                  <span className="font-mono text-[#D4FF00] shrink-0">
                    {ep.scenes.length} Shots · {ep.format}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-2">
                  {ep.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{ep.hookLine}</p>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2.5 font-mono">
                  <span>{ep.createdAt}</span>
                  <span
                    className={
                      ep.status === 'Exported'
                        ? 'text-[#D4FF00]'
                        : 'text-zinc-400'
                    }
                  >
                    {ep.status}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onLoadEpisode(ep)}
                className={`press-scale py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-[#D4FF00] text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isCurrent
                  ? 'Loaded in Cinema Studio'
                  : 'Load Project in Studio'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
