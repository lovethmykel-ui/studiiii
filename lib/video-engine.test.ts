import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  generateWordTimings,
  formatSrtTimestamp,
  exportToSrt,
  calculateTimelineMetrics,
  projectMomentum,
  rubberband,
  auditBrandConsistency,
  optimizeSceneStack,
  CAMERA_RIG_CATALOG,
  LENS_PRESET_CATALOG,
  FINANCIAL_CHART_CATALOG,
  resolveSceneFinancialSeries,
  buildSceneBrollPrompt,
  buildFallbackNarrativeBeats,
  slugifyEpisodeFilename,
  buildBatchExportManifest,
  INITIAL_ROOK_EPISODES,
  ROOK_DEFAULT_BRAND,
  VideoScene,
} from './video-engine';

test('formatSrtTimestamp formats seconds into SubRip HH:MM:SS,mmm accurately', () => {
  assert.equal(formatSrtTimestamp(0), '00:00:00,000');
  assert.equal(formatSrtTimestamp(1.4), '00:00:01,400');
  assert.equal(formatSrtTimestamp(65.25), '00:01:05,250');
  assert.equal(formatSrtTimestamp(3661.005), '01:01:01,005');
});

test('generateWordTimings assigns monotonic timestamps and highlights @byrook_tv keywords', () => {
  const narration =
    'Yet in 1.4 seconds, $4.2M vanished with ONE click inside the wallet.';
  const words = generateWordTimings(narration, 10, 6, ['ONE']);

  assert.equal(words.length, 12);
  assert.ok(words[0].startSec >= 10);
  assert.ok(words[words.length - 1].endSec <= 16.01);

  for (let i = 1; i < words.length; i++) {
    assert.ok(
      words[i].startSec >= words[i - 1].startSec,
      'Word start times must be monotonic'
    );
  }

  const amountWord = words.find((w) => w.cleanWord === '$4.2M');
  assert.ok(amountWord?.isHighlighted, 'Dollar figure $4.2M should be highlighted');
  assert.equal(amountWord?.highlightTone, 'amber');

  const exploitWord = words.find((w) => w.cleanWord === 'vanished');
  assert.ok(exploitWord?.isHighlighted, 'Exploit verb vanished should be highlighted');
  assert.equal(exploitWord?.highlightTone, 'crimson');

  const techWord = words.find((w) => w.cleanWord === 'wallet');
  assert.ok(techWord?.isHighlighted, 'Forensic term wallet should be highlighted');
  assert.equal(techWord?.highlightTone, 'cyan');
});

test('exportToSrt outputs valid SubRip cues with uppercase highlighted words', () => {
  const scenes = INITIAL_ROOK_EPISODES[0].scenes.slice(0, 2);
  const srt = exportToSrt(scenes, 5);

  assert.ok(srt.includes('1\n00:00:00,050 -->'));
  assert.ok(srt.includes('$4.2M VANISHED'));
  assert.ok(srt.includes('ONE CLICK'));
});

test('calculateTimelineMetrics resolves active scene, transition state, and active phrase', () => {
  const scenes = INITIAL_ROOK_EPISODES[0].scenes;
  // At 8.2s we are 0.2s into Scene 2 (which starts at 8.0s with 0.65s transition)
  const stateAtTransition = calculateTimelineMetrics(scenes, 8.2);

  assert.equal(stateAtTransition.totalDurationSec, 32);
  assert.equal(stateAtTransition.activeSlot.scene.id, 'sc-2');
  assert.equal(stateAtTransition.previousSlot?.scene.id, 'sc-1');
  assert.equal(stateAtTransition.inTransition, true);
  assert.ok(
    stateAtTransition.transitionProgress > 0 &&
      stateAtTransition.transitionProgress <= 1.05
  );
  assert.ok(stateAtTransition.activePhrase.length > 0);
});

test('Apple fluid physics helpers projectMomentum and rubberband behave monotonically', () => {
  const posProjection = projectMomentum(1200, 0.998);
  const negProjection = projectMomentum(-1200, 0.998);
  assert.ok(posProjection > 500);
  assert.equal(posProjection, -negProjection);

  const smallStretch = rubberband(20, 400);
  const largeStretch = rubberband(100, 400);
  assert.ok(smallStretch > 0 && smallStretch < 20);
  assert.ok(largeStretch > smallStretch && largeStretch < 100);
});

test('auditBrandConsistency validates @byrook_tv pacing and keyword density', () => {
  const scene = INITIAL_ROOK_EPISODES[0].scenes[0];
  const result = auditBrandConsistency(scene, ROOK_DEFAULT_BRAND);

  assert.ok(result.score >= 85);
  assert.equal(result.isCompliant, true);
  assert.ok(result.highlightedCount >= 3);
});

test('optimizeSceneStack removes duplicate scenes, strips Episode prefixes, and re-orders narrative flow', () => {
  const baseScenes = INITIAL_ROOK_EPISODES[0].scenes;
  // Put Aftermath first, then Money Trail, then a duplicate of Hook, then Mechanism, then Hook with "Episode 1:" prefix
  const scrambledWithDuplicates: VideoScene[] = [
    { ...baseScenes[3], id: 's-aftermath', narrativeStage: undefined },
    { ...baseScenes[2], id: 's-trail', narrativeStage: undefined },
    {
      ...baseScenes[0],
      id: 's-hook-1',
      chapterTitle: 'Episode 1: 01. The Silent Signature Trap',
      narrativeStage: undefined,
    },
    { ...baseScenes[0], id: 's-hook-dup', narrativeStage: undefined },
    { ...baseScenes[1], id: 's-mech', narrativeStage: undefined },
  ];

  const optimized = optimizeSceneStack(scrambledWithDuplicates);

  assert.equal(optimized.removedDuplicates, 1);
  assert.equal(optimized.scenes.length, 4);
  assert.ok(optimized.reorderedCount > 0);

  // Verify Hook -> Mechanism -> Trail -> Aftermath order
  assert.equal(optimized.scenes[0].id, 's-hook-1');
  assert.equal(optimized.scenes[0].chapterTitle, '01. The Silent Signature Trap');
  assert.equal(optimized.scenes[1].id, 's-mech');
  assert.equal(optimized.scenes[2].id, 's-trail');
  assert.equal(optimized.scenes[3].id, 's-aftermath');
});

test('CAMERA_RIG_CATALOG and LENS_PRESET_CATALOG cover all Cinema Studio DoP presets', () => {
  assert.ok(Object.keys(CAMERA_RIG_CATALOG).length >= 10);
  assert.equal(CAMERA_RIG_CATALOG['dolly-zoom'].category, 'Pushes & Pulls');
  assert.equal(CAMERA_RIG_CATALOG['point-cloud'].category, 'Cinema FX');
  assert.equal(LENS_PRESET_CATALOG['24mm-anamorphic'].focalLength, '24mm');
});

test('FINANCIAL_CHART_CATALOG and resolveSceneFinancialSeries generate 6-point telemetry series', () => {
  assert.ok(FINANCIAL_CHART_CATALOG.line);
  assert.ok(FINANCIAL_CHART_CATALOG.bar);
  assert.ok(FINANCIAL_CHART_CATALOG.area);

  const hookSeries = resolveSceneFinancialSeries(INITIAL_ROOK_EPISODES[0].scenes[0]);
  assert.equal(hookSeries.length, 6);
  assert.equal(hookSeries[hookSeries.length - 1].formattedValue, '1.4s');

  const trailSeries = resolveSceneFinancialSeries(INITIAL_ROOK_EPISODES[0].scenes[2]);
  assert.equal(trailSeries.length, 6);
  assert.equal(trailSeries[trailSeries.length - 1].formattedValue, '48 NODES');
});

test('buildSceneBrollPrompt and buildFallbackNarrativeBeats synthesize narration prompts and emotional tone cues', () => {
  const scene0 = INITIAL_ROOK_EPISODES[0].scenes[0];
  const prompt = buildSceneBrollPrompt(scene0);
  assert.ok(prompt.includes(scene0.narration));
  assert.ok(prompt.includes('50mm Probe Macro'));

  const beats = buildFallbackNarrativeBeats(
    INITIAL_ROOK_EPISODES[0].scenes,
    INITIAL_ROOK_EPISODES[0].title
  );
  assert.equal(beats.length, 4);
  assert.equal(beats[0].emotionalTone, 'Cold Forensic Dread');
  assert.ok(beats[1].emotionalTone.length > 0);
  assert.ok(beats[0].thematicFocus.includes('TIME TO DRAIN'));
});

test('slugifyEpisodeFilename and buildBatchExportManifest create collision-free SRT and video pairs in a valid ZIP', async () => {
  assert.equal(
    slugifyEpisodeFilename('Your Crypto Wallet Can Be Drained With ONE Click!'),
    'your-crypto-wallet-can-be-drained-with-one-click'
  );

  const manifest = buildBatchExportManifest(INITIAL_ROOK_EPISODES, 'webm');
  assert.equal(manifest.length, INITIAL_ROOK_EPISODES.length);
  assert.ok(manifest[0].srtFilename.endsWith('.srt'));
  assert.ok(manifest[0].videoFilename.endsWith('-master.webm'));
  assert.notEqual(manifest[0].srtFilename, manifest[1].srtFilename);
  assert.ok(manifest[0].srtContent.includes('00:00:00,050 -->'));

  // Package into JSZip and verify round-trip extraction
  const zip = new JSZip();
  for (const entry of manifest) {
    zip.file(entry.srtFilename, entry.srtContent);
    zip.file(entry.videoFilename, new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]));
  }
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const reloaded = await JSZip.loadAsync(zipBuffer);

  for (const entry of manifest) {
    const srtText = await reloaded.file(entry.srtFilename)?.async('string');
    const videoBytes = await reloaded.file(entry.videoFilename)?.async('uint8array');
    assert.ok(srtText && srtText.includes('-->'), `Expected valid SRT for ${entry.title}`);
    assert.ok(videoBytes && videoBytes.length === 4, `Expected video bytes for ${entry.title}`);
  }
});




