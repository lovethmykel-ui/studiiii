export type TransitionType =
  | 'forensic-zoom'
  | 'redaction-glitch'
  | 'whip-pan'
  | 'evidence-flash'
  | 'cross-dissolve';

export type SubtitleStylePreset =
  | 'rook-kinetic'
  | 'forensic-typewriter'
  | 'editorial-minimal';

export type CameraMotionType =
  | 'push-in'
  | 'pull-back'
  | 'pan-right'
  | 'parallax-drift'
  | 'dolly-zoom'
  | 'fpv-drone'
  | 'orbit-360'
  | 'earth-zoom'
  | 'point-cloud'
  | 'wireframe-xray';

export type LensPresetType =
  | '24mm-anamorphic'
  | '35mm-prime'
  | '50mm-macro'
  | '85mm-portrait';

export type FinancialChartType = 'line' | 'bar' | 'area';

export interface FinancialDataPoint {
  label: string;
  value: number;
  formattedValue?: string;
}

export interface SubtitleWord {
  word: string;
  cleanWord: string;
  startSec: number;
  endSec: number;
  isHighlighted: boolean;
  highlightTone: 'cyan' | 'amber' | 'crimson' | 'none';
}

export interface VideoScene {
  id: string;
  sceneNumber: number;
  chapterTitle: string;
  evidenceCode: string;
  narration: string;
  visualPrompt: string;
  imageUrl: string;
  durationSec: number;
  transitionIn: TransitionType;
  transitionDurationSec: number;
  cameraMotion: CameraMotionType;
  lensPreset?: LensPresetType;
  motionIntensity?: number; // 0.2 to 1.0
  showFinancialOverlay?: boolean;
  financialChartType?: FinancialChartType;
  financialDataPoints?: FinancialDataPoint[];
  lowerThirdTitle: string;
  lowerThirdSubtitle: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  highlightKeywords: string[];
  narrativeStage?: 'hook' | 'mechanism' | 'trail' | 'aftermath';
  audioDataUrl?: string;
  videoDataUrl?: string;
}

export interface ResearchSource {
  title: string;
  url: string;
}

export interface NarrativeBeat {
  id: string;
  beatNumber: number;
  chapterTitle: string;
  thematicFocus: string;
  emotionalTone: string;
  pacingCue: string;
  visualMotif?: string;
}

export interface ResearchDossier {
  summary: string;
  keyFacts: string[];
  timelineEvents: Array<{ timestamp: string; event: string }>;
  sources: ResearchSource[];
  narrativeBeats?: NarrativeBeat[];
}

export interface BrandProfile {
  channelName: string;
  channelHandle: string;
  channelUrl: string;
  niche: string;
  lutName: string;
  primaryAccentHex: string;
  secondaryAccentHex: string;
  alertAccentHex: string;
  canvasBgHex: string;
  filmGrainIntensity: number;
  vignetteIntensity: number;
  contrastBoost: number;
  subtitlePreset: SubtitleStylePreset;
  subtitleFontScale: number;
  subtitleYPosition: number; // 0.72 to 0.88
  autoHighlightNumbers: boolean;
  autoHighlightExploitTerms: boolean;
  watermarkEnabled: boolean;
  minimalistCanvasHud: boolean;
  filmLook?: FilmLookType;
  targetWpmRange: [number, number];
  defaultVoice: 'Charon' | 'Fenrir' | 'Kore' | 'Puck' | 'Zephyr';
}

export type FilmLookType =
  | 'noir-slate'
  | 'evidence-wall'
  | 'blueprint'
  | 'charcoal-studio';

export type SoundEffectCueType =
  | 'stamp-slam'
  | 'highlighter-swipe'
  | 'whoosh-pan'
  | 'redaction-glitch'
  | 'evidence-flash'
  | 'counter-tick'
  | 'sub-boom';

export interface AudioCueEvent {
  id: string;
  timeSec: number;
  type: SoundEffectCueType;
  label: string;
  intensity: number; // 0..1
  sceneId: string;
  triggerWord?: string;
}

export interface ParsedMetricNumber {
  prefix: string;
  targetNumber: number;
  decimals: number;
  suffix: string;
}

export interface EpisodeProject {
  id: string;
  title: string;
  hookLine: string;
  format: '16:9' | '9:16';
  status: 'Ready to Render' | 'Researching' | 'Producing' | 'Exported';
  createdAt: string;
  targetChannel: string;
  researchDossier?: ResearchDossier;
  scenes: VideoScene[];
}

export interface SceneTimelineSlot {
  scene: VideoScene;
  index: number;
  startSec: number;
  endSec: number;
  words: SubtitleWord[];
}

export interface TimelinePlaybackState {
  totalDurationSec: number;
  clampedTimeSec: number;
  activeSlot: SceneTimelineSlot;
  previousSlot: SceneTimelineSlot | null;
  sceneLocalTimeSec: number;
  sceneProgress: number; // 0..1
  inTransition: boolean;
  transitionProgress: number; // 0..1
  activeWord: SubtitleWord | null;
  activePhrase: SubtitleWord[];
}

export interface BrandComplianceResult {
  score: number;
  isCompliant: boolean;
  wpm: number;
  highlightedCount: number;
  notes: string[];
}

export const ROOK_DEFAULT_BRAND: BrandProfile = {
  channelName: 'Rook',
  channelHandle: '@byrook_tv',
  channelUrl: 'https://youtube.com/@byrook_tv',
  niche: 'Investigative Cyber Heists, Zero-Day Exploits & Unseen Financial Trails',
  lutName: 'Noir Forensic Slate (Rec.709 Dark)',
  primaryAccentHex: '#38BDF8',
  secondaryAccentHex: '#F59E0B',
  alertAccentHex: '#EF4444',
  canvasBgHex: '#090D16',
  filmGrainIntensity: 0.18,
  vignetteIntensity: 0.44,
  contrastBoost: 1.14,
  subtitlePreset: 'rook-kinetic',
  subtitleFontScale: 1.0,
  subtitleYPosition: 0.82,
  autoHighlightNumbers: true,
  autoHighlightExploitTerms: true,
  watermarkEnabled: false,
  minimalistCanvasHud: true,
  filmLook: 'noir-slate',
  targetWpmRange: [120, 175],
  defaultVoice: 'Charon',
};

export const TRANSITION_CATALOG: Record<
  TransitionType,
  {
    label: string;
    description: string;
    damping: number;
    response: number;
    recommendedFor: string;
  }
> = {
  'forensic-zoom': {
    label: 'Forensic Zoom-Through',
    description:
      'Critically damped optical punch-in with chromatic edge separation and ledger crosshair alignment.',
    damping: 0.85,
    response: 0.35,
    recommendedFor: 'Deep-diving into wallet addresses, code payloads, or transaction hops',
  },
  'redaction-glitch': {
    label: 'Classified Redaction Cut',
    description:
      'Horizontal scanline displacement paired with classified document black-bar reveal.',
    damping: 0.9,
    response: 0.28,
    recommendedFor: 'Revealing threat actor identities, exploit triggers, or zero-day breaches',
  },
  'whip-pan': {
    label: 'Kinetic Whip Pan',
    description:
      'High-velocity lateral camera throw with directional motion stretch and seamless velocity handoff.',
    damping: 0.8,
    response: 0.32,
    recommendedFor: 'Fast chronological jumps across continents or laundering hops',
  },
  'evidence-flash': {
    label: 'Microfiche Evidence Flash',
    description:
      'Halation exposure burst with archival timestamp lock and high-contrast shadow settle.',
    damping: 1.0,
    response: 0.38,
    recommendedFor: 'Introducing court filings, on-chain snapshots, or key financial figures',
  },
  'cross-dissolve': {
    label: 'Noir Cross-Dissolve',
    description:
      'Smooth luminance-preserving dissolve tuned for dark investigative cinematography.',
    damping: 1.0,
    response: 0.45,
    recommendedFor: 'Atmospheric pacing between narrative chapters and concluding analysis',
  },
};

export const CAMERA_RIG_CATALOG: Record<
  CameraMotionType,
  {
    label: string;
    category: 'Pushes & Pulls' | 'Pans & Orbits' | 'Cinema FX';
    code: string;
    description: string;
    badge?: string;
  }
> = {
  'push-in': {
    label: 'Dolly Push-In',
    category: 'Pushes & Pulls',
    code: 'DOLLY IN',
    description: 'Linear optical track toward the primary evidence focal point.',
  },
  'pull-back': {
    label: 'Aerial Pull-Back',
    category: 'Pushes & Pulls',
    code: 'PULL OUT',
    description: 'Reveals broader network infrastructure from a macro close-up.',
  },
  'dolly-zoom': {
    label: 'Vertigo Dolly Zoom',
    category: 'Pushes & Pulls',
    code: 'Z-DOLLY',
    description: 'Counter-zooms focal length while pushing camera for psychological tension.',
    badge: 'Top',
  },
  'earth-zoom': {
    label: 'Earth Macro Zoom',
    category: 'Pushes & Pulls',
    code: 'EARTH ZOOM',
    description: 'High-velocity orbital punch-in from global node to hardware chip.',
    badge: 'Viral',
  },
  'pan-right': {
    label: 'Lateral Track Right',
    category: 'Pans & Orbits',
    code: 'TRACK R',
    description: 'Smooth motorized slider tracking across ledger timelines.',
  },
  'parallax-drift': {
    label: 'Handheld Float',
    category: 'Pans & Orbits',
    code: 'HANDHELD',
    description: 'Organic 3-axis Steadicam drift with subtle documentary breathing.',
  },
  'orbit-360': {
    label: 'Hero Orbit Arc',
    category: 'Pans & Orbits',
    code: 'ORBIT 360',
    description: 'Curved turntable trajectory around the subject with rotational parallax.',
    badge: 'New',
  },
  'fpv-drone': {
    label: 'FPV Banking Dive',
    category: 'Pans & Orbits',
    code: 'FPV RIG',
    description: 'Dynamic roll-angle sweep through server corridors and vault topology.',
  },
  'point-cloud': {
    label: 'Point Cloud Lidar',
    category: 'Cinema FX',
    code: 'LIDAR 3D',
    description: 'Overlays volumetric forensic depth-scan matrix across the scene.',
    badge: 'FX',
  },
  'wireframe-xray': {
    label: 'Wireframe X-Ray',
    category: 'Cinema FX',
    code: 'X-RAY',
    description: 'Exposes structural vector telemetry and high-contrast edge contours.',
    badge: 'FX',
  },
};

export const LENS_PRESET_CATALOG: Record<
  LensPresetType,
  {
    label: string;
    focalLength: string;
    aperture: string;
    aspectHint: string;
    description: string;
  }
> = {
  '24mm-anamorphic': {
    label: '24mm Anamorphic',
    focalLength: '24mm',
    aperture: 'T1.9',
    aspectHint: '2.39:1 Scope Bars + Streak Flare',
    description: 'Wide cinema scope with subtle horizontal streak flare and widescreen matte.',
  },
  '35mm-prime': {
    label: '35mm Documentary Prime',
    focalLength: '35mm',
    aperture: 'T1.4',
    aspectHint: 'Natural Editorial Field',
    description: 'Clean, distortion-free investigative journalism standard.',
  },
  '50mm-macro': {
    label: '50mm Probe Macro',
    focalLength: '50mm',
    aperture: 'T2.0',
    aspectHint: 'Shallow Edge Vignette',
    description: 'Intimate optical focus for hardware keys, code payloads, and ledger lines.',
  },
  '85mm-portrait': {
    label: '85mm Telephoto Compression',
    focalLength: '85mm',
    aperture: 'T1.2',
    aspectHint: 'Deep Background Compression',
    description: 'Tightly compressed framing isolating critical subjects.',
  },
};

export const FINANCIAL_CHART_CATALOG: Record<
  FinancialChartType,
  {
    label: string;
    code: string;
    description: string;
  }
> = {
  line: {
    label: 'Line Chart',
    code: 'LINE TELEMETRY',
    description: 'Real-time forensic trajectory tracking velocity and liquidity movement across blocks.',
  },
  bar: {
    label: 'Bar Chart',
    code: 'BAR DISTRIBUTION',
    description: 'Discrete comparative bars highlighting node dispersion, hop volume, and allowance splits.',
  },
  area: {
    label: 'Area Curve',
    code: 'CUMULATIVE AREA',
    description: 'Filled cumulative exposure curve emphasizing total capital siphoned over time.',
  },
};

/**
 * Resolves a deterministic 6-point financial telemetry series for a given scene
 * so the canvas overlay can plot accurate line, bar, or area charts.
 */
export function resolveSceneFinancialSeries(
  scene: VideoScene
): Array<{ label: string; value: number; formattedValue: string }> {
  if (scene.financialDataPoints && scene.financialDataPoints.length >= 3) {
    return scene.financialDataPoints.map((pt) => ({
      label: pt.label,
      value: pt.value,
      formattedValue: pt.formattedValue || String(pt.value),
    }));
  }

  // Parse numeric magnitude from keyMetricValue if present (e.g. "$4.2M", "48 NODES", "20.0%", "1.4s")
  const numericMatch = scene.keyMetricValue.match(/(\d+(?:\.\d+)?)/);
  const rawPeak = numericMatch ? parseFloat(numericMatch[1]) : 100;
  const peak = rawPeak > 0 ? rawPeak : 100;

  if (scene.narrativeStage === 'hook' || scene.sceneNumber === 1) {
    return [
      { label: 'T+0.0s', value: 12, formattedValue: '$0.0M' },
      { label: 'T+0.3s', value: 18, formattedValue: '$0.2M' },
      { label: 'T+0.6s', value: 34, formattedValue: '$0.9M' },
      { label: 'T+0.9s', value: 62, formattedValue: '$2.1M' },
      { label: 'T+1.2s', value: 88, formattedValue: '$3.6M' },
      { label: 'T+1.4s', value: 100, formattedValue: scene.keyMetricValue || '$4.2M' },
    ];
  }

  if (scene.narrativeStage === 'mechanism' || scene.sceneNumber === 2) {
    return [
      { label: 'INIT', value: 15, formattedValue: '10%' },
      { label: 'SIGN', value: 28, formattedValue: '25%' },
      { label: 'PERMIT', value: 54, formattedValue: '50%' },
      { label: 'RELAY', value: 78, formattedValue: '80%' },
      { label: 'SWEEP', value: 94, formattedValue: '95%' },
      { label: 'MAX', value: 100, formattedValue: scene.keyMetricValue || '100%' },
    ];
  }

  if (scene.narrativeStage === 'trail' || scene.sceneNumber === 3) {
    return [
      { label: 'HOP 1', value: 24, formattedValue: `${Math.max(1, Math.round(peak * 0.15))}` },
      { label: 'HOP 2', value: 42, formattedValue: `${Math.max(2, Math.round(peak * 0.32))}` },
      { label: 'HOP 3', value: 58, formattedValue: `${Math.max(4, Math.round(peak * 0.54))}` },
      { label: 'HOP 4', value: 76, formattedValue: `${Math.max(6, Math.round(peak * 0.75))}` },
      { label: 'HOP 5', value: 91, formattedValue: `${Math.max(8, Math.round(peak * 0.9))}` },
      { label: 'BRIDGE', value: 100, formattedValue: scene.keyMetricValue || `${peak}` },
    ];
  }

  return [
    { label: 'Q1', value: 30, formattedValue: '5.0%' },
    { label: 'Q2', value: 46, formattedValue: '8.5%' },
    { label: 'Q3', value: 64, formattedValue: '12.0%' },
    { label: 'Q4', value: 79, formattedValue: '15.5%' },
    { label: 'Q5', value: 90, formattedValue: '18.0%' },
    { label: 'CUT', value: 100, formattedValue: scene.keyMetricValue || '20.0%' },
  ];
}

/**
 * Synthesizes a cinematic B-roll image generation prompt directly from the scene's narration,
 * optical lens preset, and narrative stage in the @byrook_tv / Fern / MagnatesMedia aesthetic.
 */
export function buildSceneBrollPrompt(scene: VideoScene): string {
  const lensSpec =
    LENS_PRESET_CATALOG[scene.lensPreset || '35mm-prime'] ||
    LENS_PRESET_CATALOG['35mm-prime'];
  const rigSpec =
    CAMERA_RIG_CATALOG[scene.cameraMotion] || CAMERA_RIG_CATALOG['push-in'];

  const cleanNarration = scene.narration.trim().replace(/\s+/g, ' ');
  const stageAtmosphere: Record<
    NonNullable<VideoScene['narrativeStage']>,
    string
  > = {
    hook: 'high-tension macro noir lighting, shallow depth of field, cold cyan and amber reflections',
    mechanism:
      'forensic war-room chiaroscuro, dark glass cryptographic monitors, volumetric depth scan',
    trail:
      'wide architectural network visualization, glowing fiber-optic money trail threads in obsidian space',
    aftermath:
      'monolithic server corridor at night, cool slate mist, cinematic anamorphic rim lighting',
  };

  const atmosphere =
    (scene.narrativeStage && stageAtmosphere[scene.narrativeStage]) ||
    stageAtmosphere.hook;

  return `Cinematic investigative documentary B-roll illustrating: "${cleanNarration}". Shot on ${lensSpec.label} (${lensSpec.aperture}) with ${rigSpec.label} framing, ${atmosphere}, photorealistic 8K editorial frame, zero text overlays.`;
}

/**
 * Generates thematic narrative chapters with specific emotional tone cues
 * for an episode's Investigative Research Dossier.
 */
export function buildFallbackNarrativeBeats(
  scenes: VideoScene[],
  episodeTitle = 'Investigative Documentary'
): NarrativeBeat[] {
  const tonePalette = [
    {
      emotionalTone: 'Cold Forensic Dread',
      pacingCue: 'Measured 145 WPM hook · Let the initial breach figure linger',
      defaultFocus:
        'Establishes the illusion of security before revealing the instantaneous catastrophic loss.',
    },
    {
      emotionalTone: 'Clinical Technical Intrigue',
      pacingCue: 'Accelerating 165 WPM · Tight cut on signature payload execution',
      defaultFocus:
        'Deconstructs the unseen mechanism that bypassed standard cryptographic safeguards.',
    },
    {
      emotionalTone: 'Breathless Pursuit',
      pacingCue: 'Rapid 172 WPM kinetic flow · Synchronize whip-pan with hop count',
      defaultFocus:
        'Tracks the high-velocity dispersion of siphoned liquidity across intermediary nodes.',
    },
    {
      emotionalTone: 'Chilling Systemic Reckoning',
      pacingCue: 'Deliberate 150 WPM resolve · Hold on final attribution metric',
      defaultFocus:
        'Exposes the commercial syndicate infrastructure profiting behind the exploit.',
    },
  ];

  return scenes.map((sc, idx) => {
    const preset = tonePalette[idx % tonePalette.length];
    return {
      id: `beat-${sc.id}-${idx + 1}`,
      beatNumber: idx + 1,
      chapterTitle: sc.chapterTitle,
      thematicFocus: `${preset.defaultFocus} Anchored around ${sc.keyMetricLabel}: ${sc.keyMetricValue} in "${episodeTitle}".`,
      emotionalTone: preset.emotionalTone,
      pacingCue: preset.pacingCue,
      visualMotif: sc.lowerThirdTitle || sc.visualPrompt,
    };
  });
}

const EXPLOIT_ALERT_TERMS = new Set([
  'drained',
  'exploit',
  'breach',
  'heist',
  'stolen',
  'compromised',
  'malicious',
  'phishing',
  'backdoor',
  'zero-day',
  'hack',
  'hacked',
  'attacker',
  'attackers',
  'lazarus',
  'vanished',
  'siphoned',
]);

const FORENSIC_TECH_TERMS = new Set([
  'wallet',
  'key',
  'keys',
  'signature',
  'validator',
  'validators',
  'bridge',
  'contract',
  'ledger',
  'mixer',
  'tornado',
  'payload',
  'transaction',
  'on-chain',
  'rpc',
  'approval',
  'one',
  'click',
  'seed',
  'multisig',
]);

/**
 * Apple-design momentum projection function (WWDC 2018 Designing Fluid Interfaces).
 * Projects resting offset from release velocity in px/s.
 */
export function projectMomentum(
  initialVelocityPxPerSec: number,
  decelerationRate = 0.998
): number {
  if (!Number.isFinite(initialVelocityPxPerSec) || decelerationRate >= 1 || decelerationRate <= 0) {
    return 0;
  }
  return (
    ((initialVelocityPxPerSec / 1000) * decelerationRate) /
    (1 - decelerationRate)
  );
}

/**
 * Apple-design progressive resistance rubber-banding at timeline boundaries.
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55
): number {
  if (dimension <= 0 || overshoot === 0) return 0;
  const absOvershoot = Math.abs(overshoot);
  const sign = overshoot < 0 ? -1 : 1;
  return (
    sign *
    ((absOvershoot * dimension * constant) /
      (dimension + constant * absOvershoot))
  );
}

/**
 * Computes spring-settled progress (0..1) for transitions using Apple's damping/response parameterization.
 */
export function computeTransitionProgress(
  linearT: number,
  transitionType: TransitionType
): number {
  const clamped = Math.max(0, Math.min(1, linearT));
  const spec = TRANSITION_CATALOG[transitionType] || TRANSITION_CATALOG['cross-dissolve'];

  if (spec.damping >= 1.0) {
    // Critically damped smooth cubic-bezier settle
    return 1 - Math.pow(1 - clamped, 3);
  }
  // Slightly under-damped momentum curve with controlled settle
  const omega = (2 * Math.PI) / Math.max(0.15, spec.response);
  const zeta = spec.damping;
  const decay = Math.exp(-zeta * omega * clamped * 0.35);
  const oscillation = Math.cos(omega * Math.sqrt(1 - zeta * zeta) * clamped * 0.35);
  const raw = 1 - decay * oscillation;
  return Math.max(0, Math.min(1.04, raw));
}

/**
 * Tokenizes scene narration into frame-accurate word timings and classifies words
 * for @byrook_tv kinetic subtitle highlighting.
 */
export function generateWordTimings(
  narration: string,
  sceneStartSec: number,
  sceneDurationSec: number,
  customHighlights: string[] = [],
  brand: Pick<BrandProfile, 'autoHighlightNumbers' | 'autoHighlightExploitTerms'> = {
    autoHighlightNumbers: true,
    autoHighlightExploitTerms: true,
  }
): SubtitleWord[] {
  const rawTokens = narration
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (rawTokens.length === 0) return [];

  const customSet = new Set(
    customHighlights.map((k) => k.toLowerCase().replace(/[^a-z0-9$%]/g, ''))
  );

  // Weight each token slightly by character length + punctuation pause so speech cadence feels natural
  const weights = rawTokens.map((token) => {
    const base = Math.max(2, token.length);
    const pauseBonus = /[.,!?;:—]$/.test(token) ? 2.5 : 0;
    return base + pauseBonus;
  });

  const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
  const effectiveDuration = Math.max(0.5, sceneDurationSec - 0.15);

  let cursor = sceneStartSec + 0.05;

  return rawTokens.map((word, idx) => {
    const slice = (weights[idx] / totalWeight) * effectiveDuration;
    const startSec = Number(cursor.toFixed(3));
    const endSec = Number((cursor + slice).toFixed(3));
    cursor += slice;

    const cleanWord = word.replace(/^[^a-zA-Z0-9$%]+|[^a-zA-Z0-9$%]+$/g, '');
    const lower = cleanWord.toLowerCase();

    let highlightTone: SubtitleWord['highlightTone'] = 'none';

    const isCurrencyOrNumber =
      brand.autoHighlightNumbers &&
      (/^\$?\d+([.,]\d+)?[MBKmbk%]?$/.test(cleanWord) ||
        /^(one|zero|million|billion|seconds|minutes)$/i.test(cleanWord));

    if (customSet.has(lower)) {
      highlightTone = EXPLOIT_ALERT_TERMS.has(lower) ? 'crimson' : 'amber';
    } else if (isCurrencyOrNumber) {
      highlightTone = 'amber';
    } else if (brand.autoHighlightExploitTerms && EXPLOIT_ALERT_TERMS.has(lower)) {
      highlightTone = 'crimson';
    } else if (brand.autoHighlightExploitTerms && FORENSIC_TECH_TERMS.has(lower)) {
      highlightTone = 'cyan';
    } else if (cleanWord.length > 2 && cleanWord === cleanWord.toUpperCase() && /[A-Z]/.test(cleanWord)) {
      highlightTone = 'amber';
    }

    return {
      word,
      cleanWord,
      startSec,
      endSec,
      isHighlighted: highlightTone !== 'none',
      highlightTone,
    };
  });
}

/**
 * Formats seconds into SubRip (.srt) timestamp format: HH:MM:SS,mmm
 */
export function formatSrtTimestamp(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const totalMs = Math.round(safe * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)},${pad3(ms)}`;
}

/**
 * Formats seconds into compact studio timecode MM:SS.d
 */
export function formatStudioTimecode(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  const tenths = Math.floor((safe % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

/**
 * Generates a complete SubRip (.srt) subtitle file from a sequence of VideoScenes,
 * grouping words into punchy 5-word documentary subtitle phrases.
 */
export function exportToSrt(
  scenes: VideoScene[],
  wordsPerCue = 5
): string {
  const slots = buildTimelineSlots(scenes);
  const cues: string[] = [];
  let cueIndex = 1;

  for (const slot of slots) {
    const words = slot.words;
    for (let i = 0; i < words.length; i += wordsPerCue) {
      const chunk = words.slice(i, i + wordsPerCue);
      if (chunk.length === 0) continue;
      const start = formatSrtTimestamp(chunk[0].startSec);
      const end = formatSrtTimestamp(chunk[chunk.length - 1].endSec);
      const text = chunk
        .map((w) => (w.isHighlighted ? w.word.toUpperCase() : w.word))
        .join(' ');
      cues.push(`${cueIndex}\n${start} --> ${end}\n${text}`);
      cueIndex++;
    }
  }

  return cues.join('\n\n') + (cues.length > 0 ? '\n' : '');
}

/**
 * Builds cumulative timeline slots with word timings for each scene.
 */
export function buildTimelineSlots(
  scenes: VideoScene[],
  brand: Pick<BrandProfile, 'autoHighlightNumbers' | 'autoHighlightExploitTerms'> = ROOK_DEFAULT_BRAND
): SceneTimelineSlot[] {
  let cursor = 0;
  return scenes.map((scene, index) => {
    const startSec = Number(cursor.toFixed(3));
    const duration = Math.max(1, scene.durationSec);
    const endSec = Number((startSec + duration).toFixed(3));
    cursor = endSec;
    const words = generateWordTimings(
      scene.narration,
      startSec,
      duration,
      scene.highlightKeywords,
      brand
    );
    return {
      scene,
      index,
      startSec,
      endSec,
      words,
    };
  });
}

/**
 * Resolves the exact playback state at any playhead timestamp `timeSec`.
 */
export function calculateTimelineMetrics(
  scenes: VideoScene[],
  timeSec: number,
  brand: Pick<BrandProfile, 'autoHighlightNumbers' | 'autoHighlightExploitTerms'> = ROOK_DEFAULT_BRAND
): TimelinePlaybackState {
  const slots = buildTimelineSlots(scenes, brand);
  const totalDurationSec =
    slots.length > 0 ? slots[slots.length - 1].endSec : 0;
  const clampedTimeSec = Math.max(0, Math.min(totalDurationSec, timeSec));

  const activeSlot =
    slots.find(
      (s, idx) =>
        (clampedTimeSec >= s.startSec && clampedTimeSec < s.endSec) ||
        (idx === slots.length - 1 && clampedTimeSec <= s.endSec)
    ) || slots[0];

  const previousSlot =
    activeSlot && activeSlot.index > 0 ? slots[activeSlot.index - 1] : null;

  const sceneLocalTimeSec = activeSlot
    ? Math.max(0, clampedTimeSec - activeSlot.startSec)
    : 0;
  const sceneDuration = activeSlot ? Math.max(0.1, activeSlot.scene.durationSec) : 1;
  const sceneProgress = Math.max(0, Math.min(1, sceneLocalTimeSec / sceneDuration));

  const transDur = activeSlot
    ? Math.min(activeSlot.scene.transitionDurationSec || 0.65, sceneDuration * 0.45)
    : 0.5;

  const inTransition = Boolean(
    activeSlot && activeSlot.index > 0 && sceneLocalTimeSec <= transDur
  );
  const linearTrans = inTransition ? sceneLocalTimeSec / Math.max(0.05, transDur) : 1;
  const transitionProgress = activeSlot
    ? computeTransitionProgress(linearTrans, activeSlot.scene.transitionIn)
    : 1;

  // Find active word and surrounding 5-word kinetic phrase
  const words = activeSlot ? activeSlot.words : [];
  let activeWordIdx = words.findIndex(
    (w) => clampedTimeSec >= w.startSec && clampedTimeSec <= w.endSec
  );
  if (activeWordIdx === -1 && words.length > 0) {
    // Pick closest preceding word in this scene
    for (let i = words.length - 1; i >= 0; i--) {
      if (clampedTimeSec >= words[i].startSec) {
        activeWordIdx = i;
        break;
      }
    }
    if (activeWordIdx === -1) activeWordIdx = 0;
  }

  const activeWord = activeWordIdx >= 0 ? words[activeWordIdx] : null;
  const phraseBucketStart =
    activeWordIdx >= 0 ? Math.floor(activeWordIdx / 5) * 5 : 0;
  const activePhrase = words.slice(phraseBucketStart, phraseBucketStart + 5);

  return {
    totalDurationSec,
    clampedTimeSec,
    activeSlot,
    previousSlot,
    sceneLocalTimeSec,
    sceneProgress,
    inTransition,
    transitionProgress,
    activeWord,
    activePhrase,
  };
}

/**
 * Evaluates a scene against the @byrook_tv Brand DNA aesthetic rules.
 */
export function auditBrandConsistency(
  scene: VideoScene,
  brand: BrandProfile = ROOK_DEFAULT_BRAND
): BrandComplianceResult {
  const words = generateWordTimings(
    scene.narration,
    0,
    scene.durationSec,
    scene.highlightKeywords,
    brand
  );
  const wpm = Math.round((words.length / Math.max(1, scene.durationSec)) * 60);
  const highlightedCount = words.filter((w) => w.isHighlighted).length;
  const notes: string[] = [];
  let score = 100;

  const [minWpm, maxWpm] = brand.targetWpmRange;
  if (wpm < minWpm) {
    score -= 12;
    notes.push(`Narration cadence (${wpm} WPM) is slower than @byrook_tv investigative target (${minWpm}–${maxWpm} WPM).`);
  } else if (wpm > maxWpm) {
    score -= 12;
    notes.push(`Narration cadence (${wpm} WPM) exceeds @byrook_tv clarity threshold (${maxWpm} WPM).`);
  } else {
    notes.push(`Cadence locked at ${wpm} WPM (matches @byrook_tv documentary pacing).`);
  }

  if (highlightedCount === 0) {
    score -= 15;
    notes.push('Add at least 1 forensic keyword or financial figure for kinetic subtitle emphasis.');
  } else {
    notes.push(`${highlightedCount} investigative keywords tagged for kinetic subtitle emphasis.`);
  }

  if (!scene.evidenceCode || !scene.lowerThirdTitle) {
    score -= 10;
    notes.push('Missing forensic lower-third stamp or exhibit reference code.');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    isCompliant: score >= 80,
    wpm,
    highlightedCount,
    notes,
  };
}

export interface OptimizeSceneStackResult {
  scenes: VideoScene[];
  removedDuplicates: number;
  reorderedCount: number;
}

/**
 * Classifies a scene into one of the 4 classic investigative documentary stages
 * (used by Fern, Vox, MagnatesMedia, and @byrook_tv):
 * 0 = Hook / Initial Anomaly
 * 1 = Exploit Mechanism / Technical Anatomy
 * 2 = Following the Money Trail / Laundering Web
 * 3 = Attribution / Syndicate Infrastructure / Fallout
 */
export function classifyNarrativeStage(scene: VideoScene): {
  stageRank: number;
  stageKey: 'hook' | 'mechanism' | 'trail' | 'aftermath';
} {
  if (scene.narrativeStage) {
    const map: Record<'hook' | 'mechanism' | 'trail' | 'aftermath', number> = {
      hook: 0,
      mechanism: 1,
      trail: 2,
      aftermath: 3,
    };
    return { stageRank: map[scene.narrativeStage], stageKey: scene.narrativeStage };
  }

  const text = `${scene.chapterTitle} ${scene.narration} ${scene.lowerThirdTitle}`.toLowerCase();

  // Stage 3: Attribution, infrastructure, syndicate, frozen, aftermath, conclusion
  if (
    /\b(infrastructure|syndicate|attribution|fingerprint|frozen|aftermath|arrest|server|relay|cut|final|concluding|mistake)\b/.test(
      text
    )
  ) {
    return { stageRank: 3, stageKey: 'aftermath' };
  }

  // Stage 2: Following the money trail, mixers, hops, intermediary wallets, dispersion
  if (
    /\b(trail|peeling|laundering|mixer|mixers|intermediary|dispersion|dispersed|cluster|clusters|routing|hops|shadow wallets)\b/.test(
      text
    )
  ) {
    return { stageRank: 2, stageKey: 'trail' };
  }

  // Stage 1: Anatomy, mechanism, approval, verifier, bypass, calldata, forged, withdrawals
  if (
    /\b(anatomy|approval|disguise|verifier|bypass|bypassing|calldata|forging|forged|sweeps|withdrawals|undiscovered|undetected)\b/.test(
      text
    )
  ) {
    return { stageRank: 1, stageKey: 'mechanism' };
  }

  // Stage 0: Hook / initial anomaly / trap
  return { stageRank: 0, stageKey: 'hook' };
}

/**
 * Removes duplicate scenes (by normalized narration or chapter title),
 * orders scenes into a coherent investigative narrative flow (Hook -> Mechanism -> Money Trail -> Aftermath),
 * strips cluttered prefixes ("Episode", "EXHIBIT", duplicate numbers), and re-indexes scenes cleanly.
 */
export function optimizeSceneStack(
  scenes: VideoScene[]
): OptimizeSceneStackResult {
  const seenNarrations = new Set<string>();
  const seenTitles = new Set<string>();
  const uniqueScenes: Array<{
    scene: VideoScene;
    originalIndex: number;
    stageRank: number;
    stageKey: 'hook' | 'mechanism' | 'trail' | 'aftermath';
  }> = [];

  let removedDuplicates = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const normNarration = sc.narration
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    const strippedTitle = sc.chapterTitle
      .replace(/^(episode\s*\d*[:.-]*\s*)?(\d+\s*[.:-]\s*)?/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    if (
      (normNarration.length > 10 && seenNarrations.has(normNarration)) ||
      (strippedTitle.length > 4 && seenTitles.has(strippedTitle))
    ) {
      removedDuplicates++;
      continue;
    }

    if (normNarration.length > 10) seenNarrations.add(normNarration);
    if (strippedTitle.length > 4) seenTitles.add(strippedTitle);

    const { stageRank, stageKey } = classifyNarrativeStage(sc);
    uniqueScenes.push({
      scene: sc,
      originalIndex: i,
      stageRank,
      stageKey,
    });
  }

  // Sort by narrative stage rank, preserving relative order within the same stage
  const sorted = [...uniqueScenes].sort((a, b) => {
    if (a.stageRank !== b.stageRank) return a.stageRank - b.stageRank;
    return a.originalIndex - b.originalIndex;
  });

  let reorderedCount = 0;
  sorted.forEach((item, newIdx) => {
    if (item.originalIndex !== newIdx) {
      reorderedCount++;
    }
  });

  const optimalTransitions: TransitionType[] = [
    'forensic-zoom',
    'redaction-glitch',
    'whip-pan',
    'evidence-flash',
    'cross-dissolve',
  ];

  const cleanedScenes: VideoScene[] = sorted.map((item, idx) => {
    const rawTitle = item.scene.chapterTitle
      .replace(/^(episode\s*\d*[:.-]*\s*)/i, '')
      .replace(/^(\d+\s*[.:-]\s*)+/i, '')
      .trim();
    const numPrefix = String(idx + 1).padStart(2, '0');

    return {
      ...item.scene,
      sceneNumber: idx + 1,
      chapterTitle: `${numPrefix}. ${rawTitle || 'Investigative Chapter'}`,
      narrativeStage: item.stageKey,
      transitionIn: optimalTransitions[idx % optimalTransitions.length],
    };
  });

  return {
    scenes: cleanedScenes,
    removedDuplicates,
    reorderedCount,
  };
}

export const INITIAL_ROOK_EPISODES: EpisodeProject[] = [
  {
    id: 'ep-wallet-one-click',
    title: 'Your Crypto Wallet Can Be Drained With ONE Click',
    hookLine:
      'How a silent EIP-712 permit signature bypasses hardware cold storage without exposing your seed phrase.',
    format: '16:9',
    status: 'Ready to Render',
    createdAt: '2026-11-16',
    targetChannel: 'youtube.com/@byrook_tv',
    researchDossier: {
      summary:
        'Off-chain EIP-712 and Permit2 signature phishing accounted for over $314M in drained digital assets across 260,000+ victim wallets by bypassing traditional on-chain transaction warnings.',
      keyFacts: [
        'EIP-712 typed-data signatures execute off-chain without costing gas, tricking users into thinking they are only logging in.',
        'Drainer-as-a-Service syndicates take a 20% affiliate cut while supplying automated peeling-chain laundering scripts.',
        'Once the permit signature is broadcast by the attacker relayer, the victim vault is swept in a single block (1.4s–12s).',
      ],
      timelineEvents: [
        { timestamp: '00:00.0', event: 'Victim signs off-chain Permit2 payload' },
        { timestamp: '00:01.4', event: 'Relayer broadcasts transferFrom sweep ($4.2M)' },
        { timestamp: '00:03.0', event: 'Peeling chain splits liquidity across 48 nodes' },
      ],
      sources: [
        {
          title: 'EIP-712 Typed Structured Data Hashing & Signing Specification',
          url: 'https://eips.ethereum.org/EIPS/eip-712',
        },
        {
          title: 'On-Chain Forensic Analysis of Permit2 Drainer Syndicates',
          url: 'https://youtube.com/@byrook_tv',
        },
      ],
    },
    scenes: [
      {
        id: 'sc-1',
        sceneNumber: 1,
        chapterTitle: '01. The Silent Signature Trap',
        evidenceCode: 'ACT I · THE HOOK',
        narration:
          'You never typed your seed phrase. Your hardware wallet never left your desk. Yet in 1.4 seconds, $4.2M vanished with ONE click.',
        visualPrompt:
          'Close-up documentary shot of a metallic hardware cryptocurrency wallet resting beside a dark matte laptop keyboard in a dimly lit studio.',
        imageUrl: '/assets/images/rook_scene_wallet_drain.jpg',
        durationSec: 8,
        transitionIn: 'forensic-zoom',
        transitionDurationSec: 0.7,
        cameraMotion: 'dolly-zoom',
        lensPreset: '50mm-macro',
        motionIntensity: 0.75,
        showFinancialOverlay: false,
        financialChartType: 'line',
        lowerThirdTitle: 'Silent Signature Trap',
        lowerThirdSubtitle: 'Off-Chain Permit2 Payload',
        keyMetricLabel: 'TIME TO DRAIN',
        keyMetricValue: '1.4s',
        highlightKeywords: ['seed', '1.4', '$4.2M', 'vanished', 'ONE', 'click'],
        narrativeStage: 'hook',
      },
      {
        id: 'sc-2',
        sceneNumber: 2,
        chapterTitle: '02. Anatomy of the Malicious Approval',
        evidenceCode: 'ACT II · THE MECHANISM',
        narration:
          'Attackers disguise an unlimited token approval inside a routine security verification popup. Once signed, their drainer contract sweeps every vault automatically.',
        visualPrompt:
          'High-contrast forensic cybersecurity war room with dark glass monitors displaying a cryptographic vault breach and blockchain transaction graph.',
        imageUrl: '/assets/images/rook_scene_heist_vault.jpg',
        durationSec: 8,
        transitionIn: 'redaction-glitch',
        transitionDurationSec: 0.65,
        cameraMotion: 'point-cloud',
        lensPreset: '24mm-anamorphic',
        motionIntensity: 0.85,
        showFinancialOverlay: false,
        financialChartType: 'area',
        lowerThirdTitle: 'Calldata Spoofing',
        lowerThirdSubtitle: 'Unlimited Spender Allowance',
        keyMetricLabel: 'EXPOSED ALLOWANCE',
        keyMetricValue: 'UNLIMITED',
        highlightKeywords: ['Attackers', 'unlimited', 'approval', 'drainer', 'vault'],
        narrativeStage: 'mechanism',
      },
      {
        id: 'sc-3',
        sceneNumber: 3,
        chapterTitle: '03. Following the Unseen Money Trail',
        evidenceCode: 'ACT III · THE MONEY TRAIL',
        narration:
          'Within 180 seconds, automated peeling chains split the stolen liquidity across 48 intermediary wallets before routing through cross-chain liquidity bridges.',
        visualPrompt:
          'Investigative desk at night with an ultrawide monitor showing complex financial network node graphs, fiber optic cables, and forensic ledger printouts.',
        imageUrl: '/assets/images/rook_scene_money_trail.jpg',
        durationSec: 8,
        transitionIn: 'whip-pan',
        transitionDurationSec: 0.6,
        cameraMotion: 'orbit-360',
        lensPreset: '35mm-prime',
        motionIntensity: 0.7,
        showFinancialOverlay: false,
        financialChartType: 'bar',
        lowerThirdTitle: 'Automated Peeling Chain',
        lowerThirdSubtitle: '48 Intermediary Nodes',
        keyMetricLabel: 'LAUNDERING HOPS',
        keyMetricValue: '48 NODES',
        highlightKeywords: ['180', 'stolen', '48', 'wallets', 'bridges'],
        narrativeStage: 'trail',
      },
      {
        id: 'sc-4',
        sceneNumber: 4,
        chapterTitle: '04. The Infrastructure Behind Drainer-as-a-Service',
        evidenceCode: 'ACT IV · ATTRIBUTION',
        narration:
          'Behind the phishing domain sits a commercial syndicate taking a 20% cut of every heist, operating high-availability relay servers around the clock.',
        visualPrompt:
          'Cinematic wide-angle architectural view of a sleek dark data center corridor with subtle cool slate illumination and glass server racks.',
        imageUrl: '/assets/images/rook_scene_server_exploit.jpg',
        durationSec: 8,
        transitionIn: 'evidence-flash',
        transitionDurationSec: 0.7,
        cameraMotion: 'earth-zoom',
        lensPreset: '24mm-anamorphic',
        motionIntensity: 0.8,
        showFinancialOverlay: false,
        financialChartType: 'bar',
        lowerThirdTitle: 'Syndicate Economics',
        lowerThirdSubtitle: '20% Affiliate Revenue Split',
        keyMetricLabel: 'SYNDICATE CUT',
        keyMetricValue: '20.0%',
        highlightKeywords: ['phishing', '20%', 'heist', 'servers'],
        narrativeStage: 'aftermath',
      },
    ],
  },
  {
    id: 'ep-ronin-validator',
    title: 'The $625M Validator Heist: How 5 Keys Unlocked an Empire',
    hookLine:
      'Inside the social engineering spear-phishing document that compromised five of nine bridge validators.',
    format: '16:9',
    status: 'Ready to Render',
    createdAt: '2026-11-14',
    targetChannel: 'youtube.com/@byrook_tv',
    scenes: [
      {
        id: 'ronin-1',
        sceneNumber: 1,
        chapterTitle: '01. The Fake Job Offer PDF',
        evidenceCode: 'ACT I · THE HOOK',
        narration:
          'It began with a fabricated recruitment offer sent to a senior engineer. Inside that single PDF lurked a zero-day payload targeting validator keys.',
        visualPrompt:
          'Close-up documentary shot of a metallic hardware cryptocurrency wallet resting beside a dark matte laptop keyboard.',
        imageUrl: '/assets/images/rook_scene_wallet_drain.jpg',
        durationSec: 8,
        transitionIn: 'forensic-zoom',
        transitionDurationSec: 0.65,
        cameraMotion: 'push-in',
        lowerThirdTitle: 'Spear-Phishing Vector',
        lowerThirdSubtitle: 'Trojanized Recruitment PDF',
        keyMetricLabel: 'COMPROMISED KEYS',
        keyMetricValue: '5 OF 9',
        highlightKeywords: ['zero-day', 'payload', 'validator', 'keys'],
        narrativeStage: 'hook',
      },
      {
        id: 'ronin-2',
        sceneNumber: 2,
        chapterTitle: '02. Six Days Before Anyone Noticed',
        evidenceCode: 'ACT II · THE MECHANISM',
        narration:
          'Two massive withdrawals drained 173,600 Ethereum from the bridge vault. For six entire days, the breach remained completely undetected.',
        visualPrompt:
          'Forensic cybersecurity war room with dark glass monitors displaying a cryptographic vault breach.',
        imageUrl: '/assets/images/rook_scene_heist_vault.jpg',
        durationSec: 8,
        transitionIn: 'redaction-glitch',
        transitionDurationSec: 0.7,
        cameraMotion: 'pan-right',
        lowerThirdTitle: 'Unseen Dwell Time',
        lowerThirdSubtitle: '173,600 ETH Siphoned Silently',
        keyMetricLabel: 'TOTAL DRAINED',
        keyMetricValue: '$625M',
        highlightKeywords: ['drained', '173,600', 'vault', 'breach'],
        narrativeStage: 'mechanism',
      },
      {
        id: 'ronin-3',
        sceneNumber: 3,
        chapterTitle: '03. Tracing the Lazarus Laundering Web',
        evidenceCode: 'ACT III · THE MONEY TRAIL',
        narration:
          'Forensic analysts followed the stolen funds through decentralized exchanges and privacy mixers, uncovering a state-sponsored financial trail.',
        visualPrompt:
          'Investigative desk at night with an ultrawide monitor showing complex financial network node graphs.',
        imageUrl: '/assets/images/rook_scene_money_trail.jpg',
        durationSec: 8,
        transitionIn: 'whip-pan',
        transitionDurationSec: 0.6,
        cameraMotion: 'pull-back',
        lowerThirdTitle: 'On-Chain Attribution',
        lowerThirdSubtitle: 'Cross-Exchange Cluster Graph',
        keyMetricLabel: 'TRACED CLUSTERS',
        keyMetricValue: '1,240+',
        highlightKeywords: ['stolen', 'mixers', 'trail'],
        narrativeStage: 'trail',
      },
    ],
  },
];

export interface BatchExportEntry {
  episodeId: string;
  title: string;
  format: '16:9' | '9:16';
  sceneCount: number;
  durationSec: number;
  baseSlug: string;
  srtFilename: string;
  srtContent: string;
  videoFilename: string;
}

/**
 * Normalizes an episode title into a filesystem-safe slug for ZIP export.
 */
export function slugifyEpisodeFilename(
  title: string,
  fallback = 'byrook-episode'
): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return cleaned || fallback;
}

/**
 * Builds deterministic, collision-free file pairs (.SRT + master video) for batch ZIP export.
 */
export function buildBatchExportManifest(
  episodes: EpisodeProject[],
  videoExt = 'webm'
): BatchExportEntry[] {
  const usedSlugs = new Set<string>();

  return episodes.map((ep, idx) => {
    const prefix = String(idx + 1).padStart(2, '0');
    const rawSlug = slugifyEpisodeFilename(ep.title, `episode-${idx + 1}`);
    let candidate = `${prefix}-${rawSlug}`;
    let counter = 2;
    while (usedSlugs.has(candidate)) {
      candidate = `${prefix}-${rawSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(candidate);

    const totalDurationSec = ep.scenes.reduce(
      (sum, sc) => sum + Math.max(1, sc.durationSec),
      0
    );

    return {
      episodeId: ep.id,
      title: ep.title,
      format: ep.format,
      sceneCount: ep.scenes.length,
      durationSec: totalDurationSec,
      baseSlug: candidate,
      srtFilename: `${candidate}.srt`,
      srtContent: exportToSrt(ep.scenes, 5),
      videoFilename: `${candidate}-master.${videoExt}`,
    };
  });
}

export const FILM_LOOK_CATALOG: Record<
  FilmLookType,
  {
    label: string;
    description: string;
    boardHex: string;
    threadHex: string;
    stampHex: string;
  }
> = {
  'noir-slate': {
    label: 'Noir Forensic Slate',
    description:
      'Signature @byrook_tv obsidian grade with cool slate vignette and tactical gridlines.',
    boardHex: '#090D16',
    threadHex: 'rgba(56, 189, 248, 0.25)',
    stampHex: '#EF4444',
  },
  'evidence-wall': {
    label: 'Evidence Wall & Red Thread',
    description:
      'Tactile investigative archive board with pinned corner marks, red yarn threads, and warm shadows.',
    boardHex: '#12100E',
    threadHex: 'rgba(239, 68, 68, 0.55)',
    stampHex: '#EF4444',
  },
  blueprint: {
    label: 'Forensic Blueprint Schematic',
    description:
      'Precision cyan vector schematic grid with engineering coordinate callouts.',
    boardHex: '#061224',
    threadHex: 'rgba(56, 189, 248, 0.4)',
    stampHex: '#38BDF8',
  },
  'charcoal-studio': {
    label: 'Charcoal Editorial Studio',
    description:
      'Ultra-clean dark studio backdrop with subtle warm amber rim lighting.',
    boardHex: '#0D0E12',
    threadHex: 'rgba(245, 158, 11, 0.3)',
    stampHex: '#D4FF00',
  },
};

export const SFX_PALETTE_CATALOG: Record<
  SoundEffectCueType,
  {
    label: string;
    shortCode: string;
    character: string;
    description: string;
  }
> = {
  'stamp-slam': {
    label: 'Forensic Stamp Slam',
    shortCode: 'STAMP',
    character: 'Heavy sub-thud + crisp document impact',
    description:
      'Fires on the exact millisecond of crimson exploit verbs (drained, vanished, breached).',
  },
  'highlighter-swipe': {
    label: 'Marker Highlighter Swipe',
    shortCode: 'SWIPE',
    character: 'Filtered resonant noise brush sweep',
    description:
      'Audible dry-marker swipe timed to financial figures and forensic telemetry callouts.',
  },
  'whoosh-pan': {
    label: 'Cinematic Whip Whoosh',
    shortCode: 'WHOOSH',
    character: 'Stereo bandpass air sweep',
    description:
      'Synchronizes physical camera whip-pans and zoom-through transitions across scenes.',
  },
  'redaction-glitch': {
    label: 'Classified Redaction Cut',
    shortCode: 'GLITCH',
    character: 'Short metallic relay snap + digital jitter',
    description:
      'Punctuates black-bar redaction transitions and classified dossier reveals.',
  },
  'evidence-flash': {
    label: 'Microfiche Shutter Flash',
    shortCode: 'SHUTTER',
    character: 'Crisp mechanical shutter transient',
    description:
      'Pairs with exposure flash transitions and verified court filing stamps.',
  },
  'counter-tick': {
    label: 'Telemetry Counter Tick',
    shortCode: 'TICK',
    character: 'Minimalist wooden/digital ledger click',
    description:
      'Rapid micro-clicks synchronized to rolling financial numbers counting up on screen.',
  },
  'sub-boom': {
    label: 'Investigative Sub Drop',
    shortCode: 'BOOM',
    character: 'Deep 55Hz cinematic tension swell',
    description:
      'Opens Act I hooks and anchors major investigative revelations without clutter.',
  },
};

/**
 * Parses a key financial metric string (e.g. "$4.2M", "1.4s", "48 NODES", "20.0%")
 * so the canvas can animate a word-synced rolling counter (Moh4696/cinematic-skill pattern).
 */
export function parseNumericMetric(value: string): ParsedMetricNumber | null {
  const match = value.trim().match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const targetNumber = parseFloat(numStr);
  if (!Number.isFinite(targetNumber)) return null;
  const dotIdx = numStr.indexOf('.');
  const decimals = dotIdx >= 0 ? numStr.length - dotIdx - 1 : 0;
  return { prefix, targetNumber, decimals, suffix };
}

/**
 * Automatically extracts a chronological cue sheet of procedural sound effects
 * from scene transitions, spoken keyword hits (word-level synchronization), and rolling metrics.
 */
export function extractSceneAudioCues(
  scenes: VideoScene[],
  brand: Pick<BrandProfile, 'autoHighlightNumbers' | 'autoHighlightExploitTerms'> = ROOK_DEFAULT_BRAND
): AudioCueEvent[] {
  const slots = buildTimelineSlots(scenes, brand);
  const cues: AudioCueEvent[] = [];

  slots.forEach((slot, idx) => {
    const sc = slot.scene;

    // 1. Scene opening / transition SFX
    if (idx === 0) {
      cues.push({
        id: `cue-open-${sc.id}`,
        timeSec: Number((slot.startSec + 0.05).toFixed(3)),
        type: 'sub-boom',
        label: 'Cold Open Sub Drop',
        intensity: 0.85,
        sceneId: sc.id,
      });
    } else {
      const transMap: Record<TransitionType, SoundEffectCueType> = {
        'forensic-zoom': 'whoosh-pan',
        'whip-pan': 'whoosh-pan',
        'redaction-glitch': 'redaction-glitch',
        'evidence-flash': 'evidence-flash',
        'cross-dissolve': 'highlighter-swipe',
      };
      cues.push({
        id: `cue-trans-${sc.id}`,
        timeSec: Number(slot.startSec.toFixed(3)),
        type: transMap[sc.transitionIn] || 'whoosh-pan',
        label: TRANSITION_CATALOG[sc.transitionIn]?.label || 'Transition Cut',
        intensity: 0.8,
        sceneId: sc.id,
      });
    }

    // 2. Rolling metric counter ticks near start of shot when keyMetricValue is numeric
    if (parseNumericMetric(sc.keyMetricValue)) {
      const tickOffsets = [0.35, 0.55, 0.75];
      tickOffsets.forEach((off, tIdx) => {
        if (off < sc.durationSec) {
          cues.push({
            id: `cue-tick-${sc.id}-${tIdx}`,
            timeSec: Number((slot.startSec + off).toFixed(3)),
            type: 'counter-tick',
            label: `${sc.keyMetricLabel}: ${sc.keyMetricValue}`,
            intensity: 0.55,
            sceneId: sc.id,
          });
        }
      });
    }

    // 3. Word-level hit SFX ("Hits land on the spoken word")
    let stampCountInScene = 0;
    let swipeCountInScene = 0;

    for (const w of slot.words) {
      if (!w.isHighlighted) continue;

      if (w.highlightTone === 'crimson' && stampCountInScene < 2) {
        cues.push({
          id: `cue-word-stamp-${sc.id}-${w.startSec}`,
          timeSec: w.startSec,
          type: 'stamp-slam',
          label: `Stamp Hit: "${w.cleanWord.toUpperCase()}"`,
          intensity: 0.9,
          sceneId: sc.id,
          triggerWord: w.cleanWord,
        });
        stampCountInScene++;
      } else if (
        (w.highlightTone === 'amber' || w.highlightTone === 'cyan') &&
        swipeCountInScene < 2
      ) {
        cues.push({
          id: `cue-word-swipe-${sc.id}-${w.startSec}`,
          timeSec: w.startSec,
          type: 'highlighter-swipe',
          label: `Highlight Swipe: "${w.cleanWord}"`,
          intensity: 0.7,
          sceneId: sc.id,
          triggerWord: w.cleanWord,
        });
        swipeCountInScene++;
      }
    }
  });

  return cues.sort((a, b) => a.timeSec - b.timeSec);
}



