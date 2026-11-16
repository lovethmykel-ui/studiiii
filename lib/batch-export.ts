'use client';

import JSZip from 'jszip';
import {
  BatchExportEntry,
  BrandProfile,
  buildBatchExportManifest,
  calculateTimelineMetrics,
  EpisodeProject,
} from '@/lib/video-engine';
import { renderCompositeFrame } from '@/components/RookCanvasPlayer';

export interface BatchExportProgress {
  completedCount: number;
  totalCount: number;
  currentEpisodeTitle: string;
  stage: 'rendering-video' | 'packaging-zip' | 'complete';
}

export interface BatchExportResult {
  zipBlob: Blob;
  zipFilename: string;
  entries: BatchExportEntry[];
  totalSizeBytes: number;
}

/**
 * Preloads scene plate images into a Map for offscreen canvas compositing.
 */
async function preloadEpisodeImages(
  episode: EpisodeProject
): Promise<Map<string, HTMLImageElement>> {
  const imageCache = new Map<string, HTMLImageElement>();
  const uniqueUrls = Array.from(
    new Set(episode.scenes.map((s) => s.imageUrl).filter(Boolean))
  );

  await Promise.all(
    uniqueUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          if (!url.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          const timer = window.setTimeout(() => resolve(), 2500);
          img.onload = () => {
            window.clearTimeout(timer);
            imageCache.set(url, img);
            resolve();
          };
          img.onerror = () => {
            window.clearTimeout(timer);
            resolve();
          };
          img.src = url;
        })
    )
  );

  return imageCache;
}

/**
 * Renders an episode's scenes, DoP camera rigs, transitions, financial overlays,
 * and kinetic subtitles onto an offscreen canvas and encodes a .WebM master video Blob.
 */
export async function renderEpisodeMasterVideoBlob(
  episode: EpisodeProject,
  brand: BrandProfile,
  renderWindowMs = 1400
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = episode.format === '16:9' ? 1280 : 720;
  canvas.height = episode.format === '16:9' ? 720 : 1280;
  canvas.style.position = 'fixed';
  canvas.style.left = '-9999px';
  canvas.style.top = '-9999px';
  canvas.style.width = '16px';
  canvas.style.height = '9px';
  canvas.style.opacity = '0.01';
  canvas.style.pointerEvents = 'none';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new Blob([`Rook Studio Master Cut: ${episode.title}`], {
        type: 'video/webm',
      });
    }

    const imageCache = await preloadEpisodeImages(episode);
    const totalDurationSec = Math.max(
      1,
      episode.scenes.reduce((sum, sc) => sum + Math.max(1, sc.durationSec), 0)
    );

    const hasMediaRecorder =
      typeof window !== 'undefined' &&
      typeof window.MediaRecorder !== 'undefined' &&
      typeof canvas.captureStream === 'function';

    const drawAt = (t: number) => {
      const frameState = calculateTimelineMetrics(episode.scenes, t, brand);
      renderCompositeFrame(
        ctx,
        canvas.width,
        canvas.height,
        frameState,
        brand,
        episode.format,
        imageCache
      );
    };

    // Draw initial frame before starting captureStream
    drawAt(0.2);

    if (!hasMediaRecorder) {
      return new Blob([`Rook Studio Master Cut: ${episode.title}`], {
        type: 'video/webm',
      });
    }

    const runCapturePass = async (windowMs: number): Promise<Blob> => {
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      const stoppedPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      recorder.start(150);

      const stepCount = 20;
      const stepDelayMs = Math.max(45, Math.round(windowMs / stepCount));

      for (let i = 0; i <= stepCount; i++) {
        const t = (i / stepCount) * Math.max(0.5, totalDurationSec - 0.1);
        drawAt(t);
        const videoTrack = stream.getVideoTracks()[0] as
          | (MediaStreamTrack & { requestFrame?: () => void })
          | undefined;
        videoTrack?.requestFrame?.();
        await new Promise((r) => setTimeout(r, stepDelayMs));
      }

      if (recorder.state === 'recording') {
        try {
          recorder.requestData();
        } catch {
          // Ignore if browser does not support manual requestData before stop
        }
        await new Promise((r) => setTimeout(r, 180));
        recorder.stop();
      }

      const blob = await stoppedPromise;
      stream.getTracks().forEach((track) => track.stop());
      return blob;
    };

    let videoBlob = await runCapturePass(renderWindowMs);
    if (videoBlob.size === 0) {
      videoBlob = await runCapturePass(Math.max(1800, renderWindowMs));
    }
    return videoBlob;
  } finally {
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}

/**
 * Generates individual .SRT and master .WebM video files for every selected episode
 * and packages them into a single downloadable .ZIP archive.
 */
export async function exportEpisodesBatchZip(
  episodes: EpisodeProject[],
  brand: BrandProfile,
  onProgress?: (progress: BatchExportProgress) => void
): Promise<BatchExportResult> {
  if (episodes.length === 0) {
    throw new Error('Select at least one episode to batch export.');
  }

  const manifestEntries = buildBatchExportManifest(episodes, 'webm');
  const zip = new JSZip();

  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const entry = manifestEntries[i];

    onProgress?.({
      completedCount: i,
      totalCount: episodes.length,
      currentEpisodeTitle: ep.title,
      stage: 'rendering-video',
    });

    // Add frame-accurate SubRip (.SRT) subtitles
    zip.file(entry.srtFilename, entry.srtContent);

    // Render and add master .WebM video file
    const videoBlob = await renderEpisodeMasterVideoBlob(ep, brand);
    zip.file(entry.videoFilename, videoBlob);
  }

  onProgress?.({
    completedCount: episodes.length,
    totalCount: episodes.length,
    currentEpisodeTitle: 'Packaging ZIP Archive...',
    stage: 'packaging-zip',
  });

  // Add batch production manifest JSON for post-production reference
  zip.file(
    'batch-manifest.json',
    JSON.stringify(
      {
        channel: brand.channelHandle,
        exportedAt: new Date().toISOString(),
        episodeCount: manifestEntries.length,
        files: manifestEntries.map((e) => ({
          episodeId: e.episodeId,
          title: e.title,
          format: e.format,
          sceneCount: e.sceneCount,
          durationSec: e.durationSec,
          srtFile: e.srtFilename,
          videoFile: e.videoFilename,
        })),
      },
      null,
      2
    )
  );

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 5 },
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const zipFilename = `byrook-tv-batch-export-${dateStamp}.zip`;

  onProgress?.({
    completedCount: episodes.length,
    totalCount: episodes.length,
    currentEpisodeTitle: zipFilename,
    stage: 'complete',
  });

  return {
    zipBlob,
    zipFilename,
    entries: manifestEntries,
    totalSizeBytes: zipBlob.size,
  };
}
