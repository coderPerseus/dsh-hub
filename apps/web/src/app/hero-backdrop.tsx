"use client";

import { useEffect, useRef } from "react";

type Point = {
  restX: number;
  restY: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.max(minimum, Math.min(maximum, value))
);

export function HeroBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const state = {
      width: 0,
      height: 0,
      pointerX: 0.76,
      pointerY: 0.34,
      smoothX: 0.76,
      smoothY: 0.34,
      points: [] as Point[],
    };
    let frame = 0;
    let previousPaint = 0;

    const rebuild = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      state.width = bounds.width;
      state.height = bounds.height;

      const spacing = 90;
      const columns = Math.ceil(bounds.width / spacing) + 1;
      const rows = Math.ceil(bounds.height / spacing) + 1;
      const offsetX = (bounds.width - (columns - 1) * spacing) / 2;
      const offsetY = (bounds.height - (rows - 1) * spacing) / 2;
      state.points = Array.from({ length: columns * rows }, (_, index) => {
        const x = offsetX + (index % columns) * spacing;
        const y = offsetY + Math.floor(index / columns) * spacing;
        return { restX: x, restY: y, x, y, vx: 0, vy: 0 };
      });
    };

    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      state.pointerX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
      state.pointerY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    };

    const paint = (time: number) => {
      frame = requestAnimationFrame(paint);
      if (time - previousPaint < 1000 / 30) return;
      previousPaint = time;
      const { width, height } = state;
      if (!width || !height) return;

      state.smoothX += (state.pointerX - state.smoothX) * 0.055;
      state.smoothY += (state.pointerY - state.smoothY) * 0.055;
      const pointerX = state.smoothX * width;
      const pointerY = state.smoothY * height;
      const tick = time * 0.00012;

      const base = context.createLinearGradient(0, 0, 0, height);
      base.addColorStop(0, "#183b67");
      base.addColorStop(0.42, "#122d50");
      base.addColorStop(0.78, "#07111e");
      base.addColorStop(1, "#030608");
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "screen";
      const blobs: Array<[number, number, number, string]> = [
        [0.15 + Math.sin(tick * 2.3) * 0.08, 0.23, 0.45, "rgba(55,110,171,.46)"],
        [0.54 + Math.cos(tick * 1.2) * 0.06, 0.38, 0.38, "rgba(21,67,121,.45)"],
        [0.88 + Math.sin(tick * 1.7) * 0.04, 0.16, 0.31, "rgba(234,220,180,.26)"],
        [state.smoothX, state.smoothY, 0.19, "rgba(178,202,224,.17)"],
        [0.2, 0.73, 0.24, "rgba(213,190,143,.18)"],
      ];
      blobs.forEach(([x, y, radius, color], index) => {
        const centerX = x * width;
        const centerY = (y + Math.sin(tick * (index + 1)) * 0.035) * height;
        const size = radius * Math.max(width, height);
        const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      });

      context.globalCompositeOperation = "source-over";
      context.lineWidth = 0.5;
      context.strokeStyle = "rgba(255,255,255,.08)";
      for (const point of state.points) {
        const deltaX = point.x - pointerX;
        const deltaY = point.y - pointerY;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance < 140 && distance > 0.1) {
          const force = (1 - distance / 140) * 3;
          point.vx += (deltaX / distance) * force;
          point.vy += (deltaY / distance) * force;
        }
        point.vx = (point.vx + (point.restX - point.x) * 0.05) * 0.85;
        point.vy = (point.vy + (point.restY - point.y) * 0.05) * 0.85;
        point.x += point.vx;
        point.y += point.vy;

        const proximity = Math.max(0, 1 - distance / 140);
        const pointSize = 1.8 + proximity * 2;
        context.fillStyle = `rgba(255,255,255,${0.16 + proximity * 0.4})`;
        context.fillRect(point.x - pointSize, point.y - pointSize, pointSize * 2, pointSize * 2);
      }

      const vignette = context.createRadialGradient(
        width * 0.52,
        height * 0.34,
        height * 0.08,
        width * 0.52,
        height * 0.4,
        width * 0.68,
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.72, "rgba(0,0,0,.12)");
      vignette.addColorStop(1, "rgba(0,0,0,.72)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
    };

    const observer = new ResizeObserver(rebuild);
    observer.observe(canvas);
    window.addEventListener("pointermove", move, { passive: true });
    rebuild();
    frame = requestAnimationFrame(paint);

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="hero-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="hero-orbit hero-orbit-one" />
      <div className="hero-orbit hero-orbit-two" />
      <svg className="hero-whale" viewBox="0 0 32 32">
        <path fill="currentColor" d="M27.9 8.5c-3.3-4.2-9.6-6.1-15.2-4.2C7.5 6 4.1 10.4 4 15.2c0 3.7 2 7 5.2 8.9l-2.4 4.1 6-2.3c1.1.2 2.2.3 3.3.2 6.4-.4 11.4-4.5 12.7-10.1-1.7 1.5-4.1 2.4-6.5 2.2-3.2-.2-5.8-2-7-4.6 2 1.3 4.7 1.6 7 .6 2.2-.9 4.1-3 5.6-5.7Z" />
        <circle cx="21.2" cy="11" r="1.25" fill="#102a4a" />
      </svg>
      <div className="hero-fade" />
    </div>
  );
}
