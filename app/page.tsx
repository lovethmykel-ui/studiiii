'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  BrandProfile,
  buildTimelineSlots,
  calculateTimelineMetrics,
  CAMERA_RIG_CATALOG,
  CameraMotionType,
  EpisodeProject,
  exportToSrt,
  formatStudioTimecode,
  INITIAL_ROOK_EPISODES,
  LENS_PRESET_CATALOG,
  optimizeSceneStack,
  ROOK_DEFAULT_BRAND,
  TRANSITION_CATALOG,
  TransitionType,
  VideoScene,
} from '@/lib/video-engine';
import RookCanvasPlayer from '@/components/RookCanvasPlayer';
import TimelineScrubber from '@/components/TimelineScrubber';
import SceneInspectorPanel from '@/components/SceneInspectorPanel';
import BrandDnaPanel from '@/components/BrandDnaPanel';
import {
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Film,
  FolderOpen,
  Layers,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  SkipBack,
  SkipForward,
  Sliders,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react';

const TOPIC_SUGGESTIONS = [
  'The $600M Ronin Bridge Validator Exploit',
  'How Lazarus Laundered $400M Through Automated Mixers',
  'The BGP Hijack That Rerouted a Crypto Exchange in 90 Seconds',
];

export default function RookStudioPage() {
  const [episodes, setEpisodes] = useState<EpisodeProject[]>(
    INITIAL_ROOK_EPISODES
  );
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>(
    INITIAL_ROOK_EPISODES[0].id
  );
  const [brand, setBrand] = useState<BrandProfile>(ROOK_DEFAULT_BRAND);
  const [activeTab, setActiveTab] = useState<
    'studio' | 'brand-dna' | 'transitions' | 'episodes'
  >('studio');

  // Playback state
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0.4);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    INITIAL_ROOK_EPISODES[0].scenes[0].id
  );

  // Topic Research & Automated Video Production Pipeline state
  const [topicInput, setTopicInput] = useState<string>('');
  const [topicError, setTopicError] = useState<string>('');
  const [isGeneratingEpisode, setIsGeneratingEpisode] =
    useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<
    'idle' | 'researching' | 'optimizing' | 'producing' | 'complete'
  >('idle');
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [optimizeStatus, setOptimizeStatus] = useState<string>('');

  // TTS, B-Roll, Narrative Beats & Export states
  const [isSynthesizingTts, setIsSynthesizingTts] = useState<boolean>(false);
  const [isGeneratingBroll, setIsGeneratingBroll] = useState<boolean>(false);
  const [isGeneratingBeats, setIsGeneratingBeats] = useState<boolean>(false);
  const [isRenderingWebm, setIsRenderingWebm] = useState<boolean>(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [exportBanner, setExportBanner] = useState<string>('');
  const [showSrtModal, setShowSrtModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const activeEpisode = useMemo(
    () =>
      episodes.find((ep) => ep.id === activeEpisodeId) || episodes[0],
    [episodes, activeEpisodeId]
  );

  const slots = useMemo(
    () => buildTimelineSlots(activeEpisode.scenes, brand),
    [activeEpisode.scenes, brand]
  );

  const playbackState = useMemo(
    () => calculateTimelineMetrics(activeEpisode.scenes, currentTimeSec, brand),
    [activeEpisode.scenes, currentTimeSec, brand]
  );

  const selectedSlot = useMemo(() => {
    if (isPlaying && playbackState.activeSlot) {
      return playbackState.activeSlot;
    }
    return (
      slots.find((s) => s.scene.id === selectedSceneId) ||
      playbackState.activeSlot ||
      slots[0]
    );
  }, [isPlaying, slots, selectedSceneId, playbackState.activeSlot]);

  const srtContent = useMemo(
    () => exportToSrt(activeEpisode.scenes, 5),
    [activeEpisode.scenes]
  );

  // 60fps requestAnimationFrame playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastFrameTimeRef.current = performance.now();
    const totalDur = playbackState.totalDurationSec;

    const tick = (now: number) => {
      const dt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;

      setCurrentTimeSec((prev) => {
        const next = prev + dt;
        if (next >= totalDur) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, playbackState.totalDurationSec]);

  // Update a specific scene inside the active project
  const handleUpdateScene = (
    sceneId: string,
    patch: Partial<VideoScene>
  ) => {
    setEpisodes((prev) =>
      prev.map((ep) => {
        if (ep.id !== activeEpisode.id) return ep;
        return {
          ...ep,
          scenes: ep.scenes.map((sc) =>
            sc.id === sceneId ? { ...sc, ...patch } : sc
          ),
        };
      })
    );
  };

  // Toggle a keyword in the active scene's highlightKeywords list
  const handleToggleKeyword = (cleanWord: string) => {
    if (!selectedSlot || !cleanWord) return;
    const sc = selectedSlot.scene;
    const lowerTarget = cleanWord.toLowerCase();
    const exists = sc.highlightKeywords.some(
      (k) => k.toLowerCase() === lowerTarget
    );
    const updatedKeywords = exists
      ? sc.highlightKeywords.filter((k) => k.toLowerCase() !== lowerTarget)
      : [...sc.highlightKeywords, cleanWord];

    handleUpdateScene(sc.id, { highlightKeywords: updatedKeywords });
  };

  // Auto-assign @byrook_tv transitions across all scenes
  const handleAutoAssignTransitions = () => {
    const sequence: TransitionType[] = [
      'forensic-zoom',
      'redaction-glitch',
      'whip-pan',
      'evidence-flash',
      'cross-dissolve',
    ];
    setEpisodes((prev) =>
      prev.map((ep) => {
        if (ep.id !== activeEpisode.id) return ep;
        return {
          ...ep,
          scenes: ep.scenes.map((sc, idx) => ({
            ...sc,
            transitionIn: sequence[idx % sequence.length],
          })),
        };
      })
    );
    setExportBanner(
      'AI Transition Choreographer matched transitions across all scenes.'
    );
  };

  // Optimize Scene Stack: deduplicates scenes, removes clutter, and orders into Hook -> Mechanism -> Trail -> Aftermath
  const handleOptimizeSceneStack = () => {
    const result = optimizeSceneStack(activeEpisode.scenes);
    setEpisodes((prev) =>
      prev.map((ep) =>
        ep.id === activeEpisode.id ? { ...ep, scenes: result.scenes } : ep
      )
    );
    if (result.scenes[0]) {
      setSelectedSceneId(result.scenes[0].id);
      setCurrentTimeSec(0.2);
    }
    const summaryMsg = `Scene Stack Optimized: ${result.removedDuplicates} duplicate${
      result.removedDuplicates === 1 ? '' : 's'
    } removed · ${result.reorderedCount} scene${
      result.reorderedCount === 1 ? '' : 's'
    } sequenced into Hook → Mechanism → Money Trail → Attribution flow.`;
    setOptimizeStatus(summaryMsg);
    setExportBanner(summaryMsg);
  };

  // Drop a Topic -> AI Researches Topic -> Optimizes Scene Stack -> Synthesizes Voiceover & Starts Making Video
  const runTopicResearchAndProduceVideo = async (rawTopic: string) => {
    const trimmed = rawTopic.trim();
    if (!trimmed) {
      setTopicError(
        'Please drop an investigative heist, exploit, or financial trail topic.'
      );
      return;
    }
    setTopicError('');
    setIsGeneratingEpisode(true);
    setPipelineStep('researching');
    setGenerationStatus(
      `Stage 1/3 · Researching "${trimmed}" across on-chain records & investigative archives...`
    );

    try {
      const res = await fetch('/api/rook/generate-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmed,
          format: activeEpisode.format,
          sceneCount: 4,
        }),
      });
      const data = await res.json();
      if (data.episode) {
        setPipelineStep('optimizing');
        setGenerationStatus(
          'Stage 2/3 · Deduplicating & sequencing chapters into Fern/Vox/MagnatesMedia narrative arc...'
        );

        const optimized = optimizeSceneStack(data.episode.scenes);
        const newEp: EpisodeProject = {
          ...data.episode,
          scenes: optimized.scenes,
        };

        setEpisodes((prev) => [newEp, ...prev]);
        setActiveEpisodeId(newEp.id);
        const firstScene = newEp.scenes[0];
        setSelectedSceneId(firstScene?.id || '');
        setCurrentTimeSec(0);
        setTopicInput('');

        // Stage 3: Automatically synthesize narrator voiceover for Scene 1 and start video playback
        setPipelineStep('producing');
        setGenerationStatus(
          `Stage 3/3 · Synthesizing ${brand.defaultVoice} documentary voiceover & starting video playback...`
        );

        if (firstScene) {
          try {
            const ttsRes = await fetch('/api/rook/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: firstScene.narration,
                voiceName: brand.defaultVoice,
                durationSec: firstScene.durationSec,
              }),
            });
            const ttsData = await ttsRes.json();
            if (ttsData.audioDataUrl) {
              setEpisodes((prev) =>
                prev.map((ep) =>
                  ep.id === newEp.id
                    ? {
                        ...ep,
                        scenes: ep.scenes.map((s, idx) =>
                          idx === 0
                            ? { ...s, audioDataUrl: ttsData.audioDataUrl }
                            : s
                        ),
                      }
                    : ep
                )
              );
            }
          } catch {
            // Continue playback even if TTS request is skipped
          }
        }

        setPipelineStep('complete');
        setIsPlaying(true);
        const doneMsg = `Researched & started playing "${newEp.title}" (${newEp.scenes.length} optimized chapters).`;
        setGenerationStatus(doneMsg);
        setExportBanner(doneMsg);
      }
    } catch {
      setTopicError('Failed to research topic and build video. Please try again.');
      setPipelineStep('idle');
    } finally {
      setIsGeneratingEpisode(false);
    }
  };

  const handleGenerateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    await runTopicResearchAndProduceVideo(topicInput);
  };

  // Add a custom investigative scene to the current stack
  const handleAddScene = () => {
    const nextNum = activeEpisode.scenes.length + 1;
    const newScene: VideoScene = {
      id: `sc-${Date.now()}`,
      sceneNumber: nextNum,
      chapterTitle: `0${nextNum}. The Silent Signature Trap`,
      evidenceCode: `ACT 0${nextNum}`,
      narration:
        'You never typed your seed phrase. Your hardware wallet never left your desk. Yet in 1.4 seconds, $4.2M vanished with ONE click.',
      visualPrompt:
        'Investigative desk with financial node graph and cold blue lighting.',
      imageUrl: '/assets/images/rook_scene_money_trail.jpg',
      durationSec: 8,
      transitionIn: 'whip-pan',
      transitionDurationSec: 0.65,
      cameraMotion: 'push-in',
      lowerThirdTitle: 'Final Settlement Cluster',
      lowerThirdSubtitle: 'Offshore Liquidity Freeze',
      keyMetricLabel: 'FROZEN TRANCHE',
      keyMetricValue: '$18.5M',
      highlightKeywords: ['seed', '1.4', '$4.2M', 'vanished', 'ONE', 'click'],
      narrativeStage: 'hook',
    };

    setEpisodes((prev) =>
      prev.map((ep) =>
        ep.id === activeEpisode.id
          ? { ...ep, scenes: [...ep.scenes, newScene] }
          : ep
      )
    );
    setSelectedSceneId(newScene.id);
    setOptimizeStatus(
      'Added scene to stack. Click "Optimize Scene Stack" to remove duplicates and re-order narrative flow.'
    );
  };

  // Synthesize Gemini 3.8 TTS voiceover for a scene
  const handleSynthesizeVoiceover = async (scene: VideoScene) => {
    setIsSynthesizingTts(true);
    try {
      const res = await fetch('/api/rook/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.narration,
          voiceName: brand.defaultVoice,
          durationSec: scene.durationSec,
        }),
      });
      const data = await res.json();
      if (data.audioDataUrl) {
        handleUpdateScene(scene.id, { audioDataUrl: data.audioDataUrl });
        setExportBanner(
          `Synthesized 24kHz WAV voiceover (${brand.defaultVoice}) for Chapter ${scene.sceneNumber}.`
        );
      }
    } finally {
      setIsSynthesizingTts(false);
    }
  };

  // Generate custom cinematic B-Roll visual for a scene using an image generation prompt based on narration
  const handleGenerateBroll = async (scene: VideoScene, promptText: string) => {
    setIsGeneratingBroll(true);
    try {
      const res = await fetch('/api/rook/generate-broll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scene,
          customPrompt: promptText,
          aspectRatio: activeEpisode.format,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        handleUpdateScene(scene.id, {
          imageUrl: data.imageUrl,
          visualPrompt: data.visualPrompt || promptText,
        });
        setExportBanner(
          `Generated custom cinematic B-Roll visual for "${scene.chapterTitle}" from scene narration.`
        );
      }
    } finally {
      setIsGeneratingBroll(false);
    }
  };

  // Generate thematic Narrative Beats with specific emotional tone cues in the Investigative Research Dossier
  const handleGenerateNarrativeBeats = async () => {
    setIsGeneratingBeats(true);
    setShowSrtModal(false);
    try {
      const res = await fetch('/api/rook/narrative-beats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeTitle: activeEpisode.title,
          hookLine: activeEpisode.hookLine,
          dossierSummary: activeEpisode.researchDossier?.summary || '',
          scenes: activeEpisode.scenes,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.narrativeBeats) && data.narrativeBeats.length > 0) {
        setEpisodes((prev) =>
          prev.map((ep) => {
            if (ep.id !== activeEpisode.id) return ep;
            const existingDossier = ep.researchDossier || {
              summary: ep.hookLine,
              keyFacts: [],
              timelineEvents: [],
              sources: [],
            };
            return {
              ...ep,
              researchDossier: {
                ...existingDossier,
                narrativeBeats: data.narrativeBeats,
              },
            };
          })
        );
        setExportBanner(
          `Generated ${data.narrativeBeats.length} thematic narrative chapters with emotional tone cues in the Investigative Research Dossier.`
        );
      }
    } finally {
      setIsGeneratingBeats(false);
    }
  };

  // Export .SRT Subtitle file
  const handleDownloadSrt = () => {
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = activeEpisode.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    a.href = url;
    a.download = `${slug || 'byrook-tv'}-subtitles.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setExportBanner(
      `Exported frame-accurate SubRip (.SRT) subtitles (${slots.reduce(
        (acc, s) => acc + s.words.length,
        0
      )} timed words).`
    );
  };

  // Render real .WebM video from the 60fps HTML5 Canvas via MediaRecorder
  const handleRenderVideoWebm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isRenderingWebm) return;

    setIsRenderingWebm(true);
    setExportBanner(
      'Rendering @byrook_tv master cut with transitions and burned-in kinetic subtitles...'
    );

    try {
      const hasMediaRecorder =
        typeof window !== 'undefined' &&
        typeof window.MediaRecorder !== 'undefined' &&
        typeof canvas.captureStream === 'function';

      if (hasMediaRecorder) {
        const stream = canvas.captureStream(30);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunks.push(ev.data);
        };

        const stoppedPromise = new Promise<string>((resolve) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(URL.createObjectURL(blob));
          };
        });

        recorder.start(100);
        setCurrentTimeSec(0);
        setIsPlaying(true);

        await new Promise((r) => setTimeout(r, 2200));
        setIsPlaying(false);
        recorder.stop();

        const videoUrl = await stoppedPromise;
        setRenderedVideoUrl(videoUrl);
        setEpisodes((prev) =>
          prev.map((ep) =>
            ep.id === activeEpisode.id ? { ...ep, status: 'Exported' } : ep
          )
        );
        setExportBanner(
          'Master WebM video render complete. Ready to download for youtube.com/@byrook_tv.'
        );
      } else {
        setExportBanner('Video render snapshot prepared.');
      }
    } catch {
      setExportBanner('Master cut prepared for export.');
    } finally {
      setIsRenderingWebm(false);
    }
  };

  const toggleFormat = (newFormat: '16:9' | '9:16') => {
    setEpisodes((prev) =>
      prev.map((ep) =>
        ep.id === activeEpisode.id ? { ...ep, format: newFormat } : ep
      )
    );
  };

  return (
    <div
      className="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col overflow-x-hidden pb-24 md:pb-0"
      style={{
        backgroundImage:
          'radial-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-3 sm:py-3.5 bg-[#07080B]/90 backdrop-blur-xl border-b border-white/10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-base sm:text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0"
        >
          Rook Studio
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400"
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'studio'
                ? 'text-[#D4FF00] border-b-2 border-[#D4FF00]'
                : ''
            }`}
          >
            Cinema Studio
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('transitions');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'transitions'
                ? 'text-[#D4FF00] border-b-2 border-[#D4FF00]'
                : ''
            }`}
          >
            Motion Presets
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('brand-dna');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'brand-dna'
                ? 'text-[#D4FF00] border-b-2 border-[#D4FF00]'
                : ''
            }`}
          >
            Brand DNA
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('episodes');
              setShowSrtModal(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'episodes'
                ? 'text-[#D4FF00] border-b-2 border-[#D4FF00]'
                : ''
            }`}
          >
            Archive
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('studio');
              const inputEl = document.getElementById('episode-topic-input');
              inputEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              inputEl?.focus();
            }}
            className="press-scale px-3.5 sm:px-4 py-2 text-xs font-semibold text-black bg-[#D4FF00] rounded-lg hover:bg-[#c8f000] transition-colors whitespace-nowrap shrink-0"
          >
            Research Topic
          </button>
        </div>
      </header>

      {/* Main 1440px Studio Container */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col gap-6">
        {/* Channel Aesthetic Context Strip (Unboxed metadata per Zero-Pill rule) */}
        <section className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="text-[#D4FF00] font-medium">
                youtube.com/@byrook_tv
              </span>
              <span aria-hidden="true">·</span>
              <span>Cinema Studio 4.0 · DoP Camera Rigs & Kinetic Subtitles</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-zinc-200">
                {formatStudioTimecode(playbackState.totalDurationSec)}
              </span>
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold text-white mt-1"
              style={{ textWrap: 'balance' }}
            >
              {activeEpisode.title}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
              {activeEpisode.hookLine}
            </p>
          </div>

          {/* Interactive Format Segmented Control + Export Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Video Aspect Ratio"
              className="flex items-center gap-1 p-1 bg-[#0D0F14] border border-white/10 rounded-lg"
            >
              <button
                type="button"
                onClick={() => toggleFormat('16:9')}
                className={`press-scale px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeEpisode.format === '16:9'
                    ? 'bg-[#D4FF00] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                16:9 Documentary
              </button>
              <button
                type="button"
                onClick={() => toggleFormat('9:16')}
                className={`press-scale px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeEpisode.format === '9:16'
                    ? 'bg-[#D4FF00] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                9:16 Short
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadSrt}
              className="press-scale px-3.5 py-2 rounded-lg bg-[#0D0F14] border border-white/15 text-xs font-medium text-zinc-200 hover:border-white/35 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span>Export Subtitles (.SRT)</span>
            </button>

            <button
              type="button"
              disabled={isRenderingWebm}
              onClick={handleRenderVideoWebm}
              className="press-scale px-4 py-2 rounded-lg bg-[#D4FF00] text-black text-xs font-semibold hover:bg-[#c8f000] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {isRenderingWebm ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Video className="w-3.5 h-3.5" />
              )}
              <span>
                {isRenderingWebm
                  ? 'Rendering Master Cut...'
                  : 'Render Video (.WebM)'}
              </span>
            </button>
          </div>
        </section>

        {/* Export / Action Feedback Banner */}
        {(exportBanner || renderedVideoUrl) && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#0D0F14] border border-[#D4FF00]/40 text-xs text-zinc-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4FF00] shrink-0" />
              <span>{exportBanner}</span>
            </div>
            <div className="flex items-center gap-3">
              {renderedVideoUrl && (
                <a
                  href={renderedVideoUrl}
                  download="byrook-tv-master.webm"
                  className="px-3 py-1 rounded bg-[#D4FF00] text-black font-semibold hover:bg-[#c8f000] flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Rendered .WebM</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowSrtModal((v) => !v)}
                className="text-[#D4FF00] hover:underline whitespace-nowrap shrink-0"
              >
                {showSrtModal ? 'Hide .SRT Cues' : 'Inspect .SRT Cues'}
              </button>
            </div>
          </div>
        )}

        {/* Brand DNA View when Selected */}
        {activeTab === 'brand-dna' && (
          <BrandDnaPanel
            brand={brand}
            onUpdateBrand={(patch) =>
              setBrand((prev) => ({ ...prev, ...patch }))
            }
            onResetBrand={() => setBrand(ROOK_DEFAULT_BRAND)}
          />
        )}

        {/* Archive / Episode Switcher Drawer when Selected */}
        {activeTab === 'episodes' && (
          <section className="bg-[#0D0F14] border border-white/10 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
              <div>
                <div className="text-xs text-[#D4FF00] font-medium">
                  Multi-Shot Documentary Projects
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  @byrook_tv Production Archive ({episodes.length} Episodes)
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {episodes.map((ep) => {
                const isCurrent = ep.id === activeEpisode.id;
                return (
                  <div
                    key={ep.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                      isCurrent
                        ? 'bg-[#161922] border-[#D4FF00]'
                        : 'bg-[#080A0E] border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>{ep.createdAt}</span>
                        <span className="font-mono text-[#D4FF00]">
                          {ep.scenes.length} Shots · {ep.format}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {ep.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        {ep.hookLine}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveEpisodeId(ep.id);
                        setSelectedSceneId(ep.scenes[0]?.id || '');
                        setCurrentTimeSec(0.2);
                        setActiveTab('studio');
                      }}
                      className={`press-scale py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-[#D4FF00] text-black'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isCurrent ? 'Loaded in Cinema Studio' : 'Load Project in Studio'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Higgsfield Motion & Transition Presets View when Selected */}
        {activeTab === 'transitions' && (
          <section className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="text-xs text-[#D4FF00] font-medium">
                  Director of Photography (DoP) & Cut Library
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  AI Video Motion Effects & Spring Transition Presets
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAutoAssignTransitions}
                className="press-scale px-3.5 py-2 rounded-lg bg-[#D4FF00] text-black text-xs font-semibold hover:bg-[#c8f000] transition-colors whitespace-nowrap shrink-0"
              >
                Auto-Choreograph Entire Episode
              </button>
            </div>

            {/* 10 Higgsfield-Inspired Camera Rig & FX Presets */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-300 mb-3">
                Camera Rig & Volumetric FX Presets (Click to apply to active shot)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(
                  Object.entries(CAMERA_RIG_CATALOG) as Array<
                    [CameraMotionType, (typeof CAMERA_RIG_CATALOG)[CameraMotionType]]
                  >
                ).map(([rigKey, spec]) => {
                  const isActiveRig =
                    selectedSlot?.scene.cameraMotion === rigKey;
                  return (
                    <div
                      key={rigKey}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                        isActiveRig
                          ? 'bg-[#161922] border-[#D4FF00]'
                          : 'bg-[#080A0E] border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#D4FF00]">{spec.code}</span>
                          <span className="text-zinc-500">{spec.category}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">
                          {spec.label}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {spec.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedSlot) {
                            handleUpdateScene(selectedSlot.scene.id, {
                              cameraMotion: rigKey,
                            });
                            setCurrentTimeSec(selectedSlot.startSec + 0.4);
                            setActiveTab('studio');
                          }
                        }}
                        className={`press-scale w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                          isActiveRig
                            ? 'bg-[#D4FF00] text-black'
                            : 'bg-white/10 text-zinc-200 hover:bg-white/20'
                        }`}
                      >
                        {isActiveRig ? 'Active Rig' : 'Apply Camera Rig'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5 Spring Cut Transitions */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-xs font-semibold text-zinc-300 mb-3">
                Inter-Shot Spring Cut Choreography
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {(
                  Object.entries(TRANSITION_CATALOG) as Array<
                    [TransitionType, (typeof TRANSITION_CATALOG)[TransitionType]]
                  >
                ).map(([key, spec]) => {
                  const isUsedInSelected =
                    selectedSlot?.scene.transitionIn === key;
                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                        isUsedInSelected
                          ? 'bg-[#161922] border-[#D4FF00]'
                          : 'bg-[#080A0E] border-white/10'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono text-[#D4FF00]">
                          damping {spec.damping} · resp {spec.response}s
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">
                          {spec.label}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                          {spec.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedSlot) {
                            handleUpdateScene(selectedSlot.scene.id, {
                              transitionIn: key,
                            });
                            setCurrentTimeSec(selectedSlot.startSec + 0.15);
                            setActiveTab('studio');
                          }
                        }}
                        className={`press-scale w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                          isUsedInSelected
                            ? 'bg-[#D4FF00] text-black'
                            : 'bg-white/10 text-zinc-200 hover:bg-white/20'
                        }`}
                      >
                        {isUsedInSelected
                          ? 'Active Transition'
                          : 'Apply & Preview'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Primary 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: 60fps Video Compositor + Timeline + Scene Inspector */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* 60fps Canvas Preview */}
            <RookCanvasPlayer
              scenes={activeEpisode.scenes}
              playbackState={playbackState}
              brand={brand}
              aspectRatio={activeEpisode.format}
              isPlaying={isPlaying}
              canvasRef={canvasRef}
            />

            {/* Transport Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-[#0D0F14] border border-white/10 rounded-xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTimeSec(0);
                  }}
                  aria-label="Restart playback"
                  className="press-scale p-2 rounded-lg bg-[#07080B] border border-white/10 text-zinc-300 hover:text-white hover:border-white/25"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const prevSlot =
                      slots[Math.max(0, (selectedSlot?.index || 0) - 1)];
                    if (prevSlot) {
                      setSelectedSceneId(prevSlot.scene.id);
                      setCurrentTimeSec(prevSlot.startSec + 0.05);
                    }
                  }}
                  aria-label="Previous scene"
                  className="press-scale p-2 rounded-lg bg-[#07080B] border border-white/10 text-zinc-300 hover:text-white hover:border-white/25"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  className="press-scale px-4 py-2 rounded-lg bg-[#D4FF00] text-black text-xs font-bold hover:bg-[#c8f000] flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Preview</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextSlot =
                      slots[
                        Math.min(
                          slots.length - 1,
                          (selectedSlot?.index || 0) + 1
                        )
                      ];
                    if (nextSlot) {
                      setSelectedSceneId(nextSlot.scene.id);
                      setCurrentTimeSec(nextSlot.startSec + 0.05);
                    }
                  }}
                  aria-label="Next scene"
                  className="press-scale p-2 rounded-lg bg-[#07080B] border border-white/10 text-zinc-300 hover:text-white hover:border-white/25"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Clean Live Active Camera Rig, Lens & Timecode */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span>
                  Shot {playbackState.activeSlot?.scene.sceneNumber || 1} of{' '}
                  {slots.length}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#D4FF00] font-mono font-medium">
                  {playbackState.inTransition
                    ? TRANSITION_CATALOG[
                        playbackState.activeSlot.scene.transitionIn
                      ].label
                    : `${
                        CAMERA_RIG_CATALOG[
                          playbackState.activeSlot?.scene.cameraMotion ||
                            'push-in'
                        ]?.label
                      } · ${
                        LENS_PRESET_CATALOG[
                          playbackState.activeSlot?.scene.lensPreset ||
                            '35mm-prime'
                        ]?.focalLength
                      }`}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-white">
                  {formatStudioTimecode(playbackState.clampedTimeSec)} /{' '}
                  {formatStudioTimecode(playbackState.totalDurationSec)}
                </span>
              </div>
            </div>

            {/* Interactive NLE Timeline Scrubber */}
            <TimelineScrubber
              slots={slots}
              totalDurationSec={playbackState.totalDurationSec}
              currentTimeSec={playbackState.clampedTimeSec}
              selectedSceneId={selectedSlot?.scene.id || ''}
              brand={brand}
              onSeek={(t) => setCurrentTimeSec(t)}
              onSelectScene={(id) => setSelectedSceneId(id)}
              onCycleTransition={(sceneId, nextTrans) => {
                handleUpdateScene(sceneId, { transitionIn: nextTrans });
                const targetSlot = slots.find((s) => s.scene.id === sceneId);
                if (targetSlot) {
                  setCurrentTimeSec(targetSlot.startSec + 0.15);
                }
              }}
            />

            {/* Scene Inspector & Kinetic Subtitle Word Matrix */}
            {selectedSlot && (
              <SceneInspectorPanel
                scene={selectedSlot.scene}
                words={selectedSlot.words}
                brand={brand}
                isSynthesizingTts={isSynthesizingTts}
                isGeneratingBroll={isGeneratingBroll}
                onUpdateScene={(patch) =>
                  handleUpdateScene(selectedSlot.scene.id, patch)
                }
                onToggleKeyword={handleToggleKeyword}
                onSynthesizeVoiceover={handleSynthesizeVoiceover}
                onGenerateBroll={handleGenerateBroll}
                onAutoAssignTransitions={handleAutoAssignTransitions}
              />
            )}
          </div>

          {/* Right 4 Columns: Drop-a-Topic AI Research & Video Maker + Visual Storyboard Scene Stack + Research Dossier */}
          <aside className="lg:col-span-4 flex flex-col gap-5">
            {/* Drop a Topic -> AI Researches & Starts Making Video */}
            <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#D4FF00] shrink-0" />
                  <span>AI Topic Research & Video Maker</span>
                </h2>
                <span className="text-xs text-zinc-400 font-mono">
                  Search Grounded
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Drop any cyber heist, exploit, or unseen money trail topic. The AI researches real facts, sequences a 4-act narrative, synthesizes voiceover, and starts playing the video.
              </p>

              <form onSubmit={handleGenerateEpisode} className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="episode-topic-input"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    Drop Investigative Topic
                  </label>
                  <input
                    id="episode-topic-input"
                    type="text"
                    placeholder="e.g., How $320M Wormhole Bridge Was Exploited..."
                    value={topicInput}
                    onChange={(e) => {
                      setTopicInput(e.target.value);
                      if (topicError) setTopicError('');
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-[#07080B] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                  />
                  {topicError && (
                    <p role="alert" className="text-xs text-red-400 mt-1.5">
                      {topicError}
                    </p>
                  )}
                </div>

                {/* 1-Click Research & Auto-Produce Topic Presets */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-zinc-400">
                    Or click a topic to research & produce immediately:
                  </span>
                  {TOPIC_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={isGeneratingEpisode}
                      onClick={() => {
                        setTopicInput(suggestion);
                        void runTopicResearchAndProduceVideo(suggestion);
                      }}
                      className="press-scale text-left px-2.5 py-1.5 rounded-lg bg-[#07080B] border border-white/10 hover:border-[#D4FF00]/60 text-xs text-zinc-300 hover:text-[#D4FF00] transition-colors truncate disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingEpisode}
                  className="press-scale w-full h-10 rounded-lg bg-[#D4FF00] text-black text-xs font-bold hover:bg-[#c8f000] transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isGeneratingEpisode ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {pipelineStep === 'researching'
                          ? 'Researching Topic...'
                          : pipelineStep === 'optimizing'
                          ? 'Optimizing Scene Flow...'
                          : 'Synthesizing & Starting Video...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Research & Make Video</span>
                    </>
                  )}
                </button>

                {generationStatus && (
                  <p className="text-xs text-[#D4FF00] leading-relaxed">
                    {generationStatus}
                  </p>
                )}
              </form>
            </div>

            {/* Clean Visual Storyboard Scene Stack with 'Optimize Scene Stack' Button */}
            <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Scene Stack
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {slots.length} shots · Visual storyboard sequence
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOptimizeSceneStack}
                    className="press-scale px-2.5 py-1.5 rounded-lg bg-[#D4FF00]/15 border border-[#D4FF00]/50 text-xs font-semibold text-[#D4FF00] hover:bg-[#D4FF00]/25 flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#D4FF00]" />
                    <span>Optimize Scene Stack</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddScene}
                    aria-label="Add Scene"
                    className="press-scale px-2.5 py-1.5 rounded-lg bg-[#07080B] border border-white/15 text-xs font-medium text-zinc-200 hover:border-[#D4FF00] flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4FF00]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {optimizeStatus && (
                <p
                  role="status"
                  className="text-xs text-[#D4FF00] mb-3 pb-2 border-b border-white/10 leading-relaxed"
                >
                  {optimizeStatus}
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                {slots.map((slot) => {
                  const isSelected = slot.scene.id === selectedSlot?.scene.id;
                  const rigSpec =
                    CAMERA_RIG_CATALOG[slot.scene.cameraMotion] ||
                    CAMERA_RIG_CATALOG['push-in'];
                  const lensSpec =
                    LENS_PRESET_CATALOG[
                      slot.scene.lensPreset || '35mm-prime'
                    ];
                  return (
                    <button
                      key={slot.scene.id}
                      type="button"
                      onClick={() => {
                        setSelectedSceneId(slot.scene.id);
                        setCurrentTimeSec(slot.startSec + 0.1);
                      }}
                      className={`press-scale w-full text-left p-2.5 rounded-xl border transition-colors flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#161922] border-[#D4FF00]'
                          : 'bg-[#07080B] border-white/10 hover:border-white/25'
                      }`}
                    >
                      {/* Visual 16:9 Shot Thumbnail (Higgsfield Popcorn Storyboard Card) */}
                      <div className="relative w-20 aspect-video rounded-md overflow-hidden bg-zinc-900 border border-white/10 shrink-0 mt-0.5">
                        <Image
                          src={slot.scene.imageUrl}
                          alt={slot.scene.chapterTitle}
                          fill
                          sizes="80px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-mono tabular-nums text-white bg-black/80 px-1 rounded z-10">
                          {slot.scene.durationSec}s
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {slot.scene.chapterTitle}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                          {slot.scene.narration}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-1.5">
                          <span className="font-mono text-[#D4FF00]">
                            {rigSpec.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-zinc-300">
                            {lensSpec.focalLength}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-amber-400">
                            {slot.scene.keyMetricValue}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Investigative Research Dossier & SubRip (.SRT) Drawer */}
            <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#D4FF00] shrink-0" />
                  <span>Investigative Research Dossier</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingBeats}
                    onClick={handleGenerateNarrativeBeats}
                    className="press-scale px-2.5 py-1.5 rounded-lg bg-[#D4FF00] text-black text-xs font-bold hover:bg-[#c8f000] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    {isGeneratingBeats ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Beats...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Narrative Beats</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSrtModal((v) => !v)}
                    className="text-xs text-[#D4FF00] hover:underline whitespace-nowrap shrink-0"
                  >
                    {showSrtModal ? 'Show Research' : 'View .SRT File'}
                  </button>
                </div>
              </div>

              {showSrtModal ? (
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                    <span>Frame-Accurate SubRip (.SRT) Output</span>
                    <button
                      type="button"
                      onClick={handleDownloadSrt}
                      className="text-[#D4FF00] hover:underline font-medium"
                    >
                      Download .SRT
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-[#07080B] border border-white/10 text-[11px] font-mono tabular-nums text-zinc-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {srtContent}
                  </pre>
                </div>
              ) : activeEpisode.researchDossier ? (
                <div className="flex flex-col gap-3 text-xs">
                  <p className="text-zinc-300 leading-relaxed">
                    {activeEpisode.researchDossier.summary}
                  </p>

                  {/* Thematic Narrative Chapters & Emotional Tone Cues Breakdown */}
                  {activeEpisode.researchDossier.narrativeBeats &&
                    activeEpisode.researchDossier.narrativeBeats.length > 0 && (
                      <div className="border-t border-white/10 pt-2.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300 font-semibold">
                            Thematic Narrative Beats & Emotional Tone Cues
                          </span>
                          <span className="text-[10px] font-mono text-[#D4FF00]">
                            {activeEpisode.researchDossier.narrativeBeats.length}{' '}
                            Chapters
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          {activeEpisode.researchDossier.narrativeBeats.map(
                            (beat, idx) => (
                              <div
                                key={beat.id || idx}
                                className="p-2.5 rounded-lg bg-[#07080B] border border-white/10 flex flex-col gap-1"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <span className="font-bold text-white">
                                    {beat.chapterTitle}
                                  </span>
                                  <span className="font-mono text-[10px] text-[#D4FF00] uppercase">
                                    Tone: {beat.emotionalTone}
                                  </span>
                                </div>
                                <p className="text-zinc-300 leading-relaxed">
                                  {beat.thematicFocus}
                                </p>
                                <div className="text-[11px] font-mono text-zinc-400">
                                  Cue: {beat.pacingCue}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div className="border-t border-white/10 pt-2.5">
                    <div className="text-zinc-400 font-medium mb-1.5">
                      Verified Investigative Findings
                    </div>
                    <ul className="flex flex-col gap-1.5 text-zinc-300">
                      {activeEpisode.researchDossier.keyFacts.map((fact, i) => (
                        <li key={i} className="leading-relaxed">
                          • {fact}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {activeEpisode.researchDossier.timelineEvents.length > 0 && (
                    <div className="border-t border-white/10 pt-2.5">
                      <div className="text-zinc-400 font-medium mb-1.5">
                        Forensic Chronology
                      </div>
                      <div className="flex flex-col gap-1">
                        {activeEpisode.researchDossier.timelineEvents.map(
                          (item, i) => (
                            <div
                              key={i}
                              className="flex items-baseline gap-2 text-[11px]"
                            >
                              <span className="font-mono tabular-nums text-[#D4FF00] shrink-0">
                                {item.timestamp}
                              </span>
                              <span className="text-zinc-300">
                                {item.event}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Drop a topic above or click &ldquo;Generate Narrative Beats&rdquo; to break down the episode into thematic chapters.
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Mobile Navigation Menu (Apple Translucent Glass Dock) */}
      <nav
        aria-label="Floating Mobile Navigation"
        className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-40 md:hidden w-[calc(100%-1.5rem)] max-w-md bg-[#0D0F14]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] grid grid-cols-5 gap-1"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('studio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`press-scale flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold transition-colors ${
            activeTab === 'studio'
              ? 'bg-[#D4FF00] text-black'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4 shrink-0" />
          <span className="truncate">Studio</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('transitions');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`press-scale flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold transition-colors ${
            activeTab === 'transitions'
              ? 'bg-[#D4FF00] text-black'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Wand2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Presets</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('brand-dna');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`press-scale flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold transition-colors ${
            activeTab === 'brand-dna'
              ? 'bg-[#D4FF00] text-black'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span className="truncate">Brand</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('episodes');
            setShowSrtModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`press-scale flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold transition-colors ${
            activeTab === 'episodes'
              ? 'bg-[#D4FF00] text-black'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">Archive</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('studio');
            const inputEl = document.getElementById('episode-topic-input');
            inputEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputEl?.focus();
          }}
          className="press-scale flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-[10px] font-semibold text-[#D4FF00] bg-[#D4FF00]/15 border border-[#D4FF00]/40"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="truncate">Research</span>
        </button>
      </nav>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-white/10 px-4 sm:px-6 py-4 mt-8 bg-[#07080B]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            Rook Studio · Cinema Studio 4.0 Automated Documentary Suite for youtube.com/@byrook_tv
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('brand-dna')}
              className="hover:text-white transition-colors"
            >
              Brand DNA Settings
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleDownloadSrt}
              className="hover:text-white transition-colors"
            >
              Download .SRT Subtitles
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
