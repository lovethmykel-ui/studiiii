'use client';

import React, { useEffect, useRef } from 'react';
import {
  BrandProfile,
  FILM_LOOK_CATALOG,
  FINANCIAL_CHART_CATALOG,
  parseNumericMetric,
  resolveSceneFinancialSeries,
  TimelinePlaybackState,
  TransitionType,
  VideoScene,
} from '@/lib/video-engine';

interface RookCanvasPlayerProps {
  scenes: VideoScene[];
  playbackState: TimelinePlaybackState;
  brand: BrandProfile;
  aspectRatio: '16:9' | '9:16';
  isPlaying: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * Draws a single scene frame onto an offscreen or target 2D context with
 * Higgsfield Cinema Studio 4.0 camera rig physics and optical lens presets.
 */
function renderSceneLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: VideoScene,
  progress: number,
  imgElement: HTMLImageElement | undefined,
  brand: BrandProfile
) {
  ctx.save();

  const intensity = scene.motionIntensity ?? 0.75;

  // Compute physical camera rig transform (Higgsfield DoP Suite)
  let scale = 1.06;
  let offsetX = 0;
  let offsetY = 0;
  let rotationRad = 0;

  if (scene.cameraMotion === 'push-in') {
    scale = 1.0 + progress * 0.14 * intensity;
  } else if (scene.cameraMotion === 'pull-back') {
    scale = 1.16 - progress * 0.14 * intensity;
  } else if (scene.cameraMotion === 'dolly-zoom') {
    // Vertigo effect: aggressive optical counter-zoom with subtle vertical shift
    const curve = Math.sin(progress * Math.PI * 0.5);
    scale = 1.02 + curve * 0.22 * intensity;
    offsetY = (0.5 - curve) * height * 0.025;
  } else if (scene.cameraMotion === 'earth-zoom') {
    // Exponential orbital punch-in
    const expCurve = Math.pow(progress, 1.6);
    scale = 1.0 + expCurve * 0.34 * intensity;
  } else if (scene.cameraMotion === 'pan-right') {
    scale = 1.12;
    offsetX = (progress - 0.5) * width * 0.08 * intensity;
  } else if (scene.cameraMotion === 'parallax-drift') {
    scale = 1.08;
    offsetX = Math.sin(progress * Math.PI) * width * 0.035 * intensity;
    offsetY = Math.cos(progress * Math.PI) * height * 0.022 * intensity;
  } else if (scene.cameraMotion === 'orbit-360') {
    scale = 1.14;
    offsetX = Math.sin(progress * Math.PI * 2) * width * 0.045 * intensity;
    offsetY = Math.cos(progress * Math.PI * 2) * height * 0.018 * intensity;
    rotationRad = Math.sin(progress * Math.PI * 2) * 0.018 * intensity;
  } else if (scene.cameraMotion === 'fpv-drone') {
    scale = 1.06 + progress * 0.18 * intensity;
    offsetX = Math.sin(progress * Math.PI) * width * 0.04 * intensity;
    rotationRad = Math.sin(progress * Math.PI * 2) * 0.038 * intensity;
  } else if (scene.cameraMotion === 'point-cloud' || scene.cameraMotion === 'wireframe-xray') {
    scale = 1.05 + progress * 0.1 * intensity;
    offsetX = (progress - 0.5) * width * 0.03;
  }

  ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
  if (rotationRad !== 0) {
    ctx.rotate(rotationRad);
  }
  ctx.scale(scale, scale);
  ctx.translate(-width / 2, -height / 2);

  if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
    const imgRatio = imgElement.naturalWidth / imgElement.naturalHeight;
    const canvasRatio = width / height;
    let drawW = width;
    let drawH = height;
    let drawX = 0;
    let drawY = 0;

    if (imgRatio > canvasRatio) {
      drawH = height;
      drawW = height * imgRatio;
      drawX = (width - drawW) / 2;
    } else {
      drawW = width;
      drawH = width / imgRatio;
      drawY = (height - drawH) / 2;
    }

    ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
  } else {
    // Resilient procedural investigative documentary fallback backdrop
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.4,
      width * 0.05,
      width * 0.5,
      height * 0.5,
      width * 0.75
    );
    grad.addColorStop(0, '#132038');
    grad.addColorStop(0.6, '#0B111E');
    grad.addColorStop(1, brand.canvasBgHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Higgsfield Cinema FX overlays when Point Cloud Lidar or Wireframe X-Ray is active
  if (scene.cameraMotion === 'point-cloud') {
    ctx.fillStyle = 'rgba(212, 255, 0, 0.24)';
    const cols = 28;
    const rows = 16;
    const stepX = width / cols;
    const stepY = height / rows;
    for (let r = 2; r < rows - 2; r++) {
      for (let c = 2; c < cols - 2; c++) {
        const wave = Math.sin((c * 0.45) + (r * 0.35) + progress * Math.PI * 4);
        if (wave > 0.15) {
          const radius = wave * 2.2;
          ctx.beginPath();
          ctx.arc(c * stepX, r * stepY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (scene.cameraMotion === 'wireframe-xray') {
    ctx.strokeStyle = 'rgba(212, 255, 0, 0.16)';
    ctx.lineWidth = 1;
    const step = Math.round(width / 18);
    for (let x = step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Scanning telemetry beam
    const scanY = ((progress * 1.4) % 1) * height;
    const scanGrad = ctx.createLinearGradient(0, scanY - 24, 0, scanY + 6);
    scanGrad.addColorStop(0, 'rgba(212, 255, 0, 0)');
    scanGrad.addColorStop(1, 'rgba(212, 255, 0, 0.22)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 24, width, 30);
  } else {
    // Subtle forensic coordinate grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const gridStep = Math.round(width / 16);
    for (let x = gridStep; x < width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridStep; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  ctx.restore();

  // Apply 24mm Anamorphic Cinema Scope matte bars & subtle horizontal streak flare if selected
  if (scene.lensPreset === '24mm-anamorphic') {
    const barH = Math.round(height * 0.065);
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, width, barH);
    ctx.fillRect(0, height - barH, width, barH);

    // Subtle anamorphic horizontal lens flare
    const flareY = Math.round(height * 0.42);
    const flareGrad = ctx.createLinearGradient(width * 0.15, flareY, width * 0.85, flareY);
    flareGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    flareGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.14)');
    flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(width * 0.15, flareY - 1.5, width * 0.7, 3);
  }
}

/**
 * Renders a complete composite documentary frame (camera rig, transitions, FX,
 * financial telemetry overlay, kinetic subtitles, and scrims) to a 2D canvas context.
 */
export function renderCompositeFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  playbackState: TimelinePlaybackState,
  brand: BrandProfile,
  aspectRatio: '16:9' | '9:16',
  imageCache: Map<string, HTMLImageElement>
) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = brand.canvasBgHex;
  ctx.fillRect(0, 0, width, height);

  const {
    activeSlot,
    previousSlot,
    sceneProgress,
    inTransition,
    transitionProgress,
    activeWord,
    activePhrase,
    clampedTimeSec,
  } = playbackState;

  if (!activeSlot) return;

  const activeScene = activeSlot.scene;
  const activeImg = imageCache.get(activeScene.imageUrl);
  const prevScene = previousSlot?.scene;
  const prevImg = prevScene ? imageCache.get(prevScene.imageUrl) : undefined;

    // 1. Render Scene + Transition Choreography
    if (inTransition && prevScene) {
      const t = Math.max(0, Math.min(1, transitionProgress));
      const transType: TransitionType = activeScene.transitionIn;

      if (transType === 'forensic-zoom') {
        // Outgoing zooms in deeply and fades; incoming zooms from 0.84 -> 1.0
        ctx.save();
        const outScale = 1 + t * 0.85;
        ctx.translate(width / 2, height / 2);
        ctx.scale(outScale, outScale);
        ctx.translate(-width / 2, -height / 2);
        ctx.globalAlpha = 1 - t;
        renderSceneLayer(ctx, width, height, prevScene, 1, prevImg, brand);
        ctx.restore();

        ctx.save();
        const inScale = 0.86 + t * 0.14;
        ctx.translate(width / 2, height / 2);
        ctx.scale(inScale, inScale);
        ctx.translate(-width / 2, -height / 2);
        ctx.globalAlpha = t;
        renderSceneLayer(
          ctx,
          width,
          height,
          activeScene,
          sceneProgress,
          activeImg,
          brand
        );
        ctx.restore();

        // Forensic optical targeting reticle during transition
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - Math.abs(t - 0.5) * 2) * 0.55})`;
        ctx.lineWidth = 1.5;
        const radius = Math.min(width, height) * (0.28 - t * 0.08);
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, Math.max(10, radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (transType === 'whip-pan') {
        const slideOffset = (1 - t) * width;
        ctx.save();
        ctx.translate(-t * width, 0);
        renderSceneLayer(ctx, width, height, prevScene, 1, prevImg, brand);
        ctx.restore();

        ctx.save();
        ctx.translate(slideOffset, 0);
        renderSceneLayer(
          ctx,
          width,
          height,
          activeScene,
          sceneProgress,
          activeImg,
          brand
        );
        ctx.restore();

        // Horizontal kinetic streak lines
        const streakAlpha = (1 - Math.abs(t - 0.5) * 2) * 0.35;
        ctx.fillStyle = `rgba(56, 189, 248, ${streakAlpha})`;
        ctx.fillRect(0, height * 0.35, width, 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${streakAlpha})`;
        ctx.fillRect(0, height * 0.62, width, 2);
      } else if (transType === 'redaction-glitch') {
        renderSceneLayer(
          ctx,
          width,
          height,
          t < 0.48 ? prevScene : activeScene,
          sceneProgress,
          t < 0.48 ? prevImg : activeImg,
          brand
        );
        // Classified black redaction bars & scanline sweep
        const barIntensity = 1 - Math.abs(t - 0.5) * 2;
        const barCount = 5;
        for (let b = 0; b < barCount; b++) {
          const barY = (height / barCount) * b + height * 0.04;
          const barH = height * 0.08 * barIntensity;
          const barW = width * (0.4 + ((b * 37) % 50) / 100) * barIntensity;
          const barX = ((b * 97) % 30) * (width / 100);
          ctx.fillStyle = '#05080F';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.strokeStyle = brand.alertAccentHex;
          ctx.lineWidth = 1;
          ctx.strokeRect(barX, barY, barW, barH);
        }
      } else if (transType === 'evidence-flash') {
        renderSceneLayer(
          ctx,
          width,
          height,
          activeScene,
          sceneProgress,
          activeImg,
          brand
        );
        const flashAlpha = Math.pow(1 - t, 2) * 0.78;
        ctx.fillStyle = `rgba(248, 250, 252, ${flashAlpha})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        // cross-dissolve
        ctx.save();
        ctx.globalAlpha = 1 - t;
        renderSceneLayer(ctx, width, height, prevScene, 1, prevImg, brand);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = t;
        renderSceneLayer(
          ctx,
          width,
          height,
          activeScene,
          sceneProgress,
          activeImg,
          brand
        );
        ctx.restore();
      }
    } else {
      renderSceneLayer(
        ctx,
        width,
        height,
        activeScene,
        sceneProgress,
        activeImg,
        brand
      );
    }

    // 2. Apply @byrook_tv Film Look Grade & Measured Contrast Scrim
    const activeLook =
      FILM_LOOK_CATALOG[brand.filmLook || 'noir-slate'] ||
      FILM_LOOK_CATALOG['noir-slate'];

    if (brand.filmLook === 'evidence-wall') {
      // Tactile investigative cork/board red forensic connection threads & corner pins
      ctx.save();
      ctx.strokeStyle = activeLook.threadHex;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width * 0.08, height * 0.22);
      ctx.lineTo(width * 0.42, height * 0.14);
      ctx.lineTo(width * 0.86, height * 0.28);
      ctx.stroke();

      // Pinned corner registration nodes
      [
        [width * 0.08, height * 0.22],
        [width * 0.42, height * 0.14],
        [width * 0.86, height * 0.28],
      ].forEach(([px, py]) => {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    } else if (brand.filmLook === 'blueprint') {
      // Precision engineering blueprint border ticks & schematic axes
      ctx.save();
      ctx.strokeStyle = activeLook.threadHex;
      ctx.lineWidth = 1;
      const m = 22;
      ctx.strokeRect(m, m, width - m * 2, height - m * 2);
      ctx.restore();
    }

    const vignette = ctx.createRadialGradient(
      width / 2,
      height * 0.45,
      width * 0.22,
      width / 2,
      height / 2,
      width * 0.78
    );
    vignette.addColorStop(
      0,
      brand.filmLook === 'evidence-wall'
        ? 'rgba(22, 16, 12, 0.08)'
        : 'rgba(9, 13, 22, 0.08)'
    );
    vignette.addColorStop(
      1,
      `rgba(5, 8, 15, ${Math.min(0.92, brand.vignetteIntensity + 0.32)})`
    );
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Bottom scrim for guaranteed >= 4.5:1 subtitle legibility
    const bottomScrim = ctx.createLinearGradient(0, height * 0.52, 0, height);
    bottomScrim.addColorStop(0, 'rgba(9, 13, 22, 0)');
    bottomScrim.addColorStop(0.55, 'rgba(9, 13, 22, 0.68)');
    bottomScrim.addColorStop(1, 'rgba(5, 8, 15, 0.94)');
    ctx.fillStyle = bottomScrim;
    ctx.fillRect(0, height * 0.52, width, height * 0.48);

    // Word-Synced Forensic Stamp Slam (Moh4696/cinematic-skill: hits land on the spoken word)
    if (
      activeWord &&
      activeWord.isHighlighted &&
      activeWord.highlightTone === 'crimson'
    ) {
      const wordSpan = Math.max(0.15, activeWord.endSec - activeWord.startSec);
      const localWordT = Math.max(
        0,
        Math.min(1, (clampedTimeSec - activeWord.startSec) / wordSpan)
      );
      const slamScale = 1.0 + Math.pow(1 - localWordT, 3) * 0.34;
      const stampText = activeWord.cleanWord.toUpperCase();

      ctx.save();
      const stampX = aspectRatio === '9:16' ? width * 0.5 : width * 0.8;
      const stampY = activeScene.showFinancialOverlay
        ? height * 0.62
        : height * 0.19;
      ctx.translate(stampX, stampY);
      ctx.rotate(-0.07);
      ctx.scale(slamScale, slamScale);

      const stampFontSize = Math.max(20, Math.round(height * 0.042));
      ctx.font = `800 ${stampFontSize}px "JetBrains Mono", monospace`;
      const tw = ctx.measureText(stampText).width;
      const boxW = tw + 28;
      const boxH = stampFontSize + 18;

      ctx.fillStyle = 'rgba(127, 29, 29, 0.28)';
      ctx.strokeStyle = activeLook.stampHex;
      ctx.lineWidth = 2.5;
      ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
      ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

      ctx.fillStyle = activeLook.stampHex;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stampText, 0, 1);
      ctx.restore();
    }

    // 3. Optional watermark only if explicitly enabled in Brand DNA settings (off by default)
    if (brand.watermarkEnabled) {
      const padX = Math.round(width * 0.05);
      const padY = Math.round(height * 0.065);
      ctx.save();
      const wmText = brand.channelHandle.toUpperCase();
      ctx.font = `600 ${Math.max(11, Math.round(height * 0.019))}px "JetBrains Mono", monospace`;
      const wmWidth = ctx.measureText(wmText).width;
      ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
      ctx.fillText(wmText, width - padX - wmWidth, padY);
      ctx.restore();
    }

    // 4. Financial Data Overlay (Line Chart, Bar Chart, or Cumulative Area Curve) when enabled on the scene
    if (activeScene.showFinancialOverlay) {
      const series = resolveSceneFinancialSeries(activeScene);
      const chartType = activeScene.financialChartType || 'line';
      const chartSpec = FINANCIAL_CHART_CATALOG[chartType] || FINANCIAL_CHART_CATALOG.line;

      ctx.save();

      const cardW = Math.round(aspectRatio === '9:16' ? width * 0.84 : width * 0.36);
      const cardH = Math.round(aspectRatio === '9:16' ? height * 0.28 : height * 0.42);
      const cardX = Math.round(
        aspectRatio === '9:16' ? (width - cardW) / 2 : width - cardW - width * 0.045
      );
      const cardY = Math.round(height * 0.13);

      // Smoked obsidian glass backdrop
      ctx.fillStyle = 'rgba(7, 8, 11, 0.86)';
      ctx.strokeStyle = 'rgba(212, 255, 0, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.strokeRect(cardX, cardY, cardW, cardH);

      // Accent top-left corner marker
      ctx.fillStyle = '#D4FF00';
      ctx.fillRect(cardX, cardY, 4, Math.round(cardH * 0.22));

      const innerPadX = Math.round(cardW * 0.06);
      const headerY = cardY + Math.round(cardH * 0.12);

      // Metric Label & Chart Code
      const labelFontSize = Math.max(10, Math.round(cardH * 0.048));
      ctx.font = `600 ${labelFontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#94A3B8';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        (activeScene.keyMetricLabel || 'FORENSIC METRIC').toUpperCase(),
        cardX + innerPadX,
        headerY
      );

      const codeText = chartSpec.code;
      const codeW = ctx.measureText(codeText).width;
      ctx.fillStyle = '#D4FF00';
      ctx.fillText(codeText, cardX + cardW - innerPadX - codeW, headerY);

      // Key Figure Value (Rolling Numeric Counter + Highlighter Swipe)
      const parsedMetric = parseNumericMetric(activeScene.keyMetricValue || '$4.2M');
      const rollProgress = Math.min(1, Math.max(0.25, sceneProgress * 2.2));
      const renderedMetricValue = parsedMetric
        ? `${parsedMetric.prefix}${(parsedMetric.targetNumber * rollProgress).toFixed(
            parsedMetric.decimals
          )}${parsedMetric.suffix}`
        : activeScene.keyMetricValue || '$4.2M';

      const valueFontSize = Math.max(16, Math.round(cardH * 0.11));
      ctx.font = `700 ${valueFontSize}px "JetBrains Mono", monospace`;
      const valW = ctx.measureText(renderedMetricValue).width;

      // Animated Highlighter Swipe behind key figure
      const swipeW = Math.min(valW + 8, (valW + 8) * rollProgress);
      ctx.fillStyle = 'rgba(212, 255, 0, 0.16)';
      ctx.fillRect(
        cardX + innerPadX - 2,
        headerY + Math.round(cardH * 0.11) - valueFontSize * 0.5,
        swipeW,
        valueFontSize + 2
      );

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(
        renderedMetricValue,
        cardX + innerPadX,
        headerY + Math.round(cardH * 0.11)
      );

      // Plot Area
      const plotX = cardX + innerPadX;
      const plotY = cardY + Math.round(cardH * 0.34);
      const plotW = cardW - innerPadX * 2;
      const plotH = Math.round(cardH * 0.48);

      // Subtle horizontal reference grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let g = 0; g <= 3; g++) {
        const gy = plotY + (plotH / 3) * g;
        ctx.beginPath();
        ctx.moveTo(plotX, gy);
        ctx.lineTo(plotX + plotW, gy);
        ctx.stroke();
      }

      const maxVal = Math.max(...series.map((s) => s.value), 100);
      // Animate reveal based on sceneProgress (minimum 0.35 so static preview frames show clear data)
      const revealFactor = Math.min(1, Math.max(0.45, sceneProgress * 1.25));

      const points = series.map((pt, idx) => {
        const px =
          plotX +
          (series.length > 1 ? (idx / (series.length - 1)) * plotW : plotW / 2);
        const normVal = Math.max(0.05, Math.min(1, (pt.value / maxVal) * revealFactor));
        const py = plotY + plotH - normVal * plotH;
        return { x: px, y: py, pt, normVal };
      });

      if (chartType === 'bar') {
        const slotW = plotW / series.length;
        const barW = Math.max(8, slotW * 0.58);

        points.forEach((p, idx) => {
          const isLast = idx === points.length - 1;
          const bx = plotX + idx * slotW + (slotW - barW) / 2;
          const bh = Math.max(4, p.normVal * plotH);
          const by = plotY + plotH - bh;

          ctx.fillStyle = isLast ? '#D4FF00' : 'rgba(56, 189, 248, 0.82)';
          ctx.fillRect(bx, by, barW, bh);

          // X-axis label
          ctx.font = `500 ${Math.max(9, Math.round(cardH * 0.042))}px "JetBrains Mono", monospace`;
          ctx.fillStyle = isLast ? '#D4FF00' : '#94A3B8';
          const lblW = ctx.measureText(p.pt.label).width;
          ctx.fillText(
            p.pt.label,
            bx + barW / 2 - lblW / 2,
            plotY + plotH + Math.round(cardH * 0.08)
          );
        });
      } else {
        // 'line' or 'area'
        if (chartType === 'area' && points.length > 1) {
          const areaGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
          areaGrad.addColorStop(0, 'rgba(212, 255, 0, 0.38)');
          areaGrad.addColorStop(1, 'rgba(56, 189, 248, 0.03)');
          ctx.fillStyle = areaGrad;
          ctx.beginPath();
          ctx.moveTo(points[0].x, plotY + plotH);
          points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.lineTo(points[points.length - 1].x, plotY + plotH);
          ctx.closePath();
          ctx.fill();
        }

        // Line stroke
        ctx.strokeStyle = '#D4FF00';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Nodes + X-axis labels
        points.forEach((p, idx) => {
          const isLast = idx === points.length - 1;
          ctx.fillStyle = isLast ? '#D4FF00' : '#38BDF8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, isLast ? 4.5 : 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = `500 ${Math.max(9, Math.round(cardH * 0.042))}px "JetBrains Mono", monospace`;
          ctx.fillStyle = isLast ? '#D4FF00' : '#94A3B8';
          const lblW = ctx.measureText(p.pt.label).width;
          ctx.fillText(
            p.pt.label,
            p.x - lblW / 2,
            plotY + plotH + Math.round(cardH * 0.08)
          );
        });
      }

      ctx.restore();
    }

    // 5. Kinetic Automated Subtitles (Matched to @byrook_tv Brand Preset)
    if (activePhrase.length > 0) {
      ctx.save();
      const baseFontSize = Math.max(
        18,
        Math.round(height * (aspectRatio === '9:16' ? 0.042 : 0.05) * brand.subtitleFontScale)
      );
      const fontFamily =
        brand.subtitlePreset === 'forensic-typewriter'
          ? '"JetBrains Mono", monospace'
          : '"Outfit", sans-serif';

      ctx.font = `700 ${baseFontSize}px ${fontFamily}`;
      ctx.textBaseline = 'middle';

      const wordSpacing = Math.round(baseFontSize * 0.34);
      const displayStrings = activePhrase.map((w) =>
        brand.subtitlePreset === 'rook-kinetic' ? w.word.toUpperCase() : w.word
      );
      const wordWidths = displayStrings.map((s) => ctx.measureText(s).width);
      const totalLineW =
        wordWidths.reduce((a, b) => a + b, 0) +
        wordSpacing * Math.max(0, displayStrings.length - 1);

      const subtitleCenterY = Math.round(height * brand.subtitleYPosition);
      let cursorX = (width - totalLineW) / 2;

      // Subtle dark backdrop plate behind active subtitle phrase
      const platePadX = 20;
      const platePadY = 12;
      ctx.fillStyle = 'rgba(5, 8, 15, 0.78)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 1;
      ctx.fillRect(
        cursorX - platePadX,
        subtitleCenterY - baseFontSize / 2 - platePadY,
        totalLineW + platePadX * 2,
        baseFontSize + platePadY * 2
      );
      ctx.strokeRect(
        cursorX - platePadX,
        subtitleCenterY - baseFontSize / 2 - platePadY,
        totalLineW + platePadX * 2,
        baseFontSize + platePadY * 2
      );

      activePhrase.forEach((wordObj, idx) => {
        const textStr = displayStrings[idx];
        const wWidth = wordWidths[idx];
        const isCurrentSpoken =
          activeWord &&
          wordObj.startSec === activeWord.startSec &&
          wordObj.word === activeWord.word;

        // Color coding per @byrook_tv Brand DNA
        let fill = '#F8FAFC';
        if (wordObj.isHighlighted) {
          if (wordObj.highlightTone === 'amber') fill = brand.secondaryAccentHex;
          else if (wordObj.highlightTone === 'crimson') fill = brand.alertAccentHex;
          else if (wordObj.highlightTone === 'cyan') fill = brand.primaryAccentHex;
        } else if (!isCurrentSpoken && clampedTimeSec > wordObj.endSec) {
          fill = 'rgba(226, 232, 240, 0.72)';
        }

        ctx.save();
        if (isCurrentSpoken) {
          // Active word subtle underline bar + optical emphasis
          ctx.fillStyle =
            wordObj.highlightTone === 'crimson'
              ? brand.alertAccentHex
              : wordObj.highlightTone === 'amber'
              ? brand.secondaryAccentHex
              : brand.primaryAccentHex;
          ctx.fillRect(
            cursorX,
            subtitleCenterY + baseFontSize * 0.52,
            wWidth,
            3
          );
        }

        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = fill;
        ctx.fillText(textStr, cursorX, subtitleCenterY);
        ctx.restore();

        cursorX += wWidth + wordSpacing;
      });

      ctx.restore();
    }

  // 6. Bottom progress bar hairline
  const totalProgress =
    playbackState.totalDurationSec > 0
      ? playbackState.clampedTimeSec / playbackState.totalDurationSec
      : 0;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
  ctx.fillRect(0, height - 3, width, 3);
  ctx.fillStyle = brand.primaryAccentHex;
  ctx.fillRect(0, height - 3, width * totalProgress, 3);
}

export default function RookCanvasPlayer({
  scenes,
  playbackState,
  brand,
  aspectRatio,
  canvasRef,
}: RookCanvasPlayerProps) {
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imageLoadTick, setImageLoadTick] = React.useState(0);

  // Preload scene images into cache and trigger redraw on load
  useEffect(() => {
    scenes.forEach((scene) => {
      if (!scene.imageUrl) return;
      if (imageCacheRef.current.has(scene.imageUrl)) return;
      const img = new window.Image();
      if (!scene.imageUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        setImageLoadTick((v) => v + 1);
      };
      img.src = scene.imageUrl;
      imageCacheRef.current.set(scene.imageUrl, img);
    });
  }, [scenes]);

  // Render composite frame whenever playbackState, brand, aspectRatio, or loaded images update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCompositeFrame(
      ctx,
      canvas.width,
      canvas.height,
      playbackState,
      brand,
      aspectRatio,
      imageCacheRef.current
    );
  }, [playbackState, brand, aspectRatio, scenes, canvasRef, imageLoadTick]);

  return (
    <div className="relative w-full flex items-center justify-center bg-[#060911] border border-slate-800/90 rounded-lg overflow-hidden p-3">
      <div
        className={`relative w-full ${
          aspectRatio === '16:9'
            ? 'aspect-video max-h-[440px]'
            : 'aspect-[9/16] max-h-[440px] max-w-[248px]'
        } mx-auto rounded overflow-hidden border border-slate-800/80 bg-[#090D16]`}
      >
        <canvas
          ref={canvasRef}
          data-testid="rook-video-canvas"
          width={aspectRatio === '16:9' ? 1280 : 720}
          height={aspectRatio === '16:9' ? 720 : 1280}
          className="w-full h-full object-contain block"
        />
      </div>
    </div>
  );
}
