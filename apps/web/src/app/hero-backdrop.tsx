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

type WhalePoint = {
  phase: number;
  x: number;
  y: number;
  z: number;
};

type Trail = {
  life: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.max(minimum, Math.min(maximum, value))
);

function useCanvasSize(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onResize: (width: number, height: number) => void,
) {
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const context = canvas.getContext("2d");
      if (!context) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      onResizeRef.current(bounds.width, bounds.height);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);
}

function FluidBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    height: 0,
    lastX: 0.76,
    lastY: 0.35,
    mouseX: 0.76,
    mouseY: 0.35,
    targetX: 0.76,
    targetY: 0.35,
    trails: [] as Trail[],
    width: 0,
  });

  useCanvasSize(canvasRef, (width, height) => {
    Object.assign(state.current, { width, height });
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let previous = 0;
    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const current = state.current;
      const x = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
      const y = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
      const vx = x - current.lastX;
      const vy = y - current.lastY;
      if (Math.hypot(vx, vy) > 0.002) {
        current.trails.push({ x, y, vx, vy, life: 1 });
        if (current.trails.length > 18) current.trails.shift();
      }
      current.targetX = x;
      current.targetY = y;
      current.lastX = x;
      current.lastY = y;
    };

    const paint = (now: number) => {
      frame = requestAnimationFrame(paint);
      if (now - previous < 1000 / 30) return;
      previous = now;

      const current = state.current;
      if (!current.width || !current.height) return;

      current.mouseX += (current.targetX - current.mouseX) * 0.055;
      current.mouseY += (current.targetY - current.mouseY) * 0.055;
      const tick = now * 0.00012;
      context.clearRect(0, 0, current.width, current.height);

      const base = context.createLinearGradient(0, 0, 0, current.height);
      base.addColorStop(0, "#183b67");
      base.addColorStop(0.42, "#122d50");
      base.addColorStop(0.78, "#07111e");
      base.addColorStop(1, "#030608");
      context.fillStyle = base;
      context.fillRect(0, 0, current.width, current.height);

      const blobs: Array<[number, number, number, string]> = [
        [0.15 + Math.sin(tick * 2.3) * 0.08, 0.23, 0.45, "rgba(55,110,171,.46)"],
        [0.54 + Math.cos(tick * 1.2) * 0.06, 0.38, 0.38, "rgba(21,67,121,.45)"],
        [0.88 + Math.sin(tick * 1.7) * 0.04, 0.16, 0.31, "rgba(234,220,180,.26)"],
        [current.mouseX, current.mouseY, 0.19, "rgba(178,202,224,.17)"],
        [0.2, 0.73, 0.24, "rgba(213,190,143,.18)"],
      ];
      context.globalCompositeOperation = "screen";
      blobs.forEach(([x, y, radius, color], index) => {
        const centerX = x * current.width;
        const centerY = (y + Math.sin(tick * (index + 1)) * 0.035) * current.height;
        const size = radius * Math.max(current.width, current.height);
        const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, current.width, current.height);
      });

      for (const trail of current.trails) {
        trail.life *= 0.925;
        const px = trail.x * current.width;
        const py = trail.y * current.height;
        const radius = Math.min(current.width, current.height) * 0.09 * (0.75 + trail.life * 0.35);
        const speed = Math.min(1, Math.hypot(trail.vx, trail.vy) * 35);
        const glow = context.createRadialGradient(px, py, 0, px, py, radius);
        glow.addColorStop(0, `rgba(238,231,199,${0.14 * trail.life + speed * 0.08})`);
        glow.addColorStop(0.38, `rgba(83,141,202,${0.1 * trail.life})`);
        glow.addColorStop(1, "rgba(45,68,139,0)");
        context.fillStyle = glow;
        context.fillRect(px - radius, py - radius, radius * 2, radius * 2);

        context.save();
        context.translate(px, py);
        context.rotate(Math.atan2(trail.vy, trail.vx) + Math.PI / 2);
        context.strokeStyle = `rgba(225,232,223,${0.1 * trail.life})`;
        context.lineWidth = 1.2;
        context.beginPath();
        context.ellipse(0, 0, radius * 0.72, radius * 0.3, 0, -1.15, 1.15);
        context.stroke();
        context.restore();
      }
      current.trails = current.trails.filter(trail => trail.life > 0.035);

      context.globalAlpha = 0.12;
      context.filter = "blur(24px)";
      context.strokeStyle = "#f3e6c8";
      context.lineWidth = 18;
      context.beginPath();
      context.moveTo(-60, current.height * 0.41);
      context.bezierCurveTo(
        current.width * 0.08,
        current.height * 0.39,
        current.width * 0.17,
        current.height * 0.23,
        current.width * 0.24,
        current.height * 0.23,
      );
      context.stroke();
      context.filter = "none";
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";

      const vignette = context.createRadialGradient(
        current.width * 0.52,
        current.height * 0.34,
        current.height * 0.08,
        current.width * 0.52,
        current.height * 0.4,
        current.width * 0.68,
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.72, "rgba(0,0,0,.12)");
      vignette.addColorStop(1, "rgba(0,0,0,.72)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, current.width, current.height);
    };

    window.addEventListener("pointermove", move, { passive: true });
    frame = requestAnimationFrame(paint);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas hero-canvas-fluid" aria-hidden="true" />;
}

function ParticleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const data = useRef({
    cols: 0,
    height: 0,
    points: [] as Point[],
    pointer: { x: Number.NaN, y: Number.NaN },
    rows: 0,
    width: 0,
  });

  useCanvasSize(canvasRef, (width, height) => {
    const spacing = 90;
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const offsetX = (width - (cols - 1) * spacing) / 2;
    const offsetY = (height - (rows - 1) * spacing) / 2;
    const points: Point[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = offsetX + col * spacing;
        const y = offsetY + row * spacing;
        points.push({ restX: x, restY: y, x, y, vx: 0, vy: 0 });
      }
    }
    Object.assign(data.current, { width, height, points, cols, rows });
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let previous = 0;
    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      data.current.pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const leave = () => {
      data.current.pointer = { x: Number.NaN, y: Number.NaN };
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - previous < 1000 / 30) return;
      previous = now;

      const { width, height, points, cols, rows, pointer } = data.current;
      context.clearRect(0, 0, width, height);
      for (const point of points) {
        const dx = point.x - pointer.x;
        const dy = point.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 140 && distance > 0.1) {
          const force = (1 - distance / 140) * 3;
          point.vx += (dx / distance) * force;
          point.vy += (dy / distance) * force;
        }
        point.vx += (point.restX - point.x) * 0.05;
        point.vy += (point.restY - point.y) * 0.05;
        point.vx *= 0.85;
        point.vy *= 0.85;
        point.x += point.vx;
        point.y += point.vy;
      }

      context.strokeStyle = "rgba(255,255,255,.08)";
      context.lineWidth = 0.5;
      const connect = (start: Point, end: Point) => {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 20) return;
        const ux = dx / distance;
        const uy = dy / distance;
        context.beginPath();
        context.moveTo(start.x + ux * 10, start.y + uy * 10);
        context.lineTo(end.x - ux * 10, end.y - uy * 10);
        context.stroke();
      };
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols - 1; col += 1) {
          connect(points[row * cols + col], points[row * cols + col + 1]);
        }
      }
      for (let col = 0; col < cols; col += 1) {
        for (let row = 0; row < rows - 1; row += 1) {
          connect(points[row * cols + col], points[(row + 1) * cols + col]);
        }
      }
      for (const point of points) {
        const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
        const proximity = Number.isFinite(distance) ? Math.max(0, 1 - distance / 140) : 0;
        const size = 1.8 + proximity * 2;
        context.fillStyle = `rgba(255,255,255,${0.16 + proximity * 0.4})`;
        context.fillRect(point.x - size, point.y - size, size * 2, size * 2);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas hero-canvas-grid" aria-hidden="true" />;
}

function WhaleParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<WhalePoint[]>([]);
  const dims = useRef({
    active: false,
    height: 0,
    pointerX: 0.58,
    pointerY: 0.45,
    smoothX: 0.58,
    smoothY: 0.45,
    width: 0,
  });

  useCanvasSize(canvasRef, (width, height) => {
    Object.assign(dims.current, { width, height });
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const inside = (
        event.clientX >= bounds.left
        && event.clientX <= bounds.right
        && event.clientY >= bounds.top
        && event.clientY <= bounds.bottom
      );
      dims.current.active = inside;
      dims.current.pointerX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
      dims.current.pointerY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    };
    const leave = () => {
      dims.current.active = false;
    };

    const image = new Image();
    image.src = "/hero-whale.svg";
    image.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = 620;
      offscreen.height = 420;
      const offscreenContext = offscreen.getContext("2d");
      if (!offscreenContext) return;
      offscreenContext.drawImage(image, 0, 0, offscreen.width, offscreen.height);
      const pixels = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height).data;
      const sampled: WhalePoint[] = [];
      let seed = 1949;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      for (let y = 0; y < offscreen.height; y += 6) {
        for (let x = 0; x < offscreen.width; x += 6) {
          if (pixels[(y * offscreen.width + x) * 4 + 3] > 30) {
            sampled.push({
              x: x + (random() - 0.5) * 1.8,
              y: y + (random() - 0.5) * 1.8,
              z: random(),
              phase: random() * Math.PI * 2,
            });
          }
        }
      }
      points.current = sampled;
    };

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const current = dims.current;
      const { width, height } = current;
      context.clearRect(0, 0, width, height);
      current.smoothX += ((current.active ? current.pointerX : 0.58) - current.smoothX) * 0.075;
      current.smoothY += ((current.active ? current.pointerY : 0.45) - current.smoothY) * 0.075;
      const scale = Math.min(0.94, width / 700);
      const originX = (width - 620 * scale) / 2 + 20;
      const originY = (height - 420 * scale) / 2 + 8;
      const lightX = current.smoothX * width;
      const lightY = current.smoothY * height;
      const parallaxX = (current.smoothX - 0.5) * 16;
      const parallaxY = (current.smoothY - 0.5) * 7;
      for (const point of points.current) {
        const breathe = Math.sin(now * 0.0008 + point.phase) * (0.5 + point.z * 0.8);
        let x = originX + point.x * scale + parallaxX * (point.z - 0.25);
        let y = originY + point.y * scale + parallaxY * (point.z - 0.25) + breathe;
        const dx = x - lightX;
        const dy = y - lightY;
        const distance = Math.hypot(dx, dy);
        const influence = current.active ? Math.max(0, 1 - distance / 145) : 0;
        if (influence > 0 && distance > 0.1) {
          const displacement = influence * influence * 10;
          x += (dx / distance) * displacement;
          y += (dy / distance) * displacement;
        }
        const directionalShade = 0.22 + 0.32 * (1 - point.x / 620) + point.z * 0.16;
        const alpha = Math.min(0.82, directionalShade + influence * 0.48)
          * (0.74 + Math.sin(now * 0.0012 + point.phase) * 0.16);
        const size = 1.15 + point.z * 1.1 + influence * 1.5;
        context.fillStyle = influence > 0.05
          ? `rgba(${Math.round(132 + 95 * influence)},${Math.round(177 + 64 * influence)},${Math.round(222 + 30 * influence)},${alpha})`
          : `rgba(110,159,211,${alpha})`;
        context.fillRect(x - size / 2, y - size / 2, size, size);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-whale" aria-hidden="true" />;
}

export function HeroBackdrop() {
  return (
    <div className="hero-backdrop" aria-hidden="true">
      <FluidBackdrop />
      <WhaleParticles />
      <ParticleGrid />
      <div className="hero-fade" />
    </div>
  );
}
