"use client";

import { useEffect, useRef } from "react";

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 750);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Responsive resize handler
    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Constellation / GIS Network Nodes
    const nodeCount = Math.min(Math.floor(width / 35), 45);
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulse: number;
    }

    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.5,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    // Globe parameters (placed towards the right/center-right)
    let globeAngle = 0;
    let satelliteAngle = 0;

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");
      const primaryRgb = isDark ? "37, 124, 238" : "30, 111, 217";
      const cyanRgb = isDark ? "20, 184, 196" : "14, 165, 175";

      // 1. Draw Topographic Elevation Contours (Organic curved lines)
      ctx.save();
      ctx.lineWidth = 1;
      const waveCount = 5;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const yOffset = height * 0.65 + w * 45;
        ctx.strokeStyle = `rgba(${cyanRgb}, ${isDark ? 0.05 + w * 0.015 : 0.04 + w * 0.01})`;
        for (let x = 0; x <= width; x += 30) {
          const waveHeight =
            Math.sin(x * 0.003 + time * 0.0003 + w * 1.5) * 25 +
            Math.cos(x * 0.006 + w) * 15;
          const y = yOffset + waveHeight;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 2. Draw Network / Circuit Lines connecting nodes
      ctx.save();
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        if (!prefersReducedMotion) {
          n1.x += n1.vx;
          n1.y += n1.vy;
          n1.pulse += delta * 2;

          if (n1.x < 0 || n1.x > width) n1.vx *= -1;
          if (n1.y < 0 || n1.y > height) n1.vy *= -1;
        }

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          const maxDist = 140;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (isDark ? 0.22 : 0.12);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${primaryRgb}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }

        // Draw node dot with glow
        const pulseFactor = Math.sin(n1.pulse) * 0.5 + 1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cyanRgb}, ${isDark ? 0.85 : 0.7})`;
        ctx.arc(n1.x, n1.y, n1.radius * pulseFactor, 0, Math.PI * 2);
        ctx.fill();

        // Node coordinate ring
        if (i % 4 === 0) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${cyanRgb}, ${isDark ? 0.2 : 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.arc(n1.x, n1.y, n1.radius * 3 * pulseFactor, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 3. Draw Rotating Wireframe Globe (Geospatial Grid)
      const globeX = width > 1024 ? width * 0.76 : width * 0.85;
      const globeY = height * 0.45;
      const globeR = Math.min(width * 0.22, 190);

      if (!prefersReducedMotion) {
        globeAngle += delta * 0.25;
        satelliteAngle += delta * 0.5;
      }

      ctx.save();
      ctx.translate(globeX, globeY);

      // Globe ambient glow
      const grad = ctx.createRadialGradient(0, 0, globeR * 0.3, 0, 0, globeR * 1.3);
      grad.addColorStop(0, `rgba(${cyanRgb}, ${isDark ? 0.12 : 0.08})`);
      grad.addColorStop(0.7, `rgba(${primaryRgb}, ${isDark ? 0.08 : 0.04})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, globeR * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Outer boundary circle
      ctx.strokeStyle = `rgba(${cyanRgb}, ${isDark ? 0.4 : 0.25})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, globeR, 0, Math.PI * 2);
      ctx.stroke();

      // Parallels (Latitudes)
      const latCount = 5;
      for (let i = 1; i <= latCount; i++) {
        const factor = i / (latCount + 1);
        const y = (factor * 2 - 1) * (globeR * 0.9);
        const rAtY = Math.sqrt(Math.max(0, globeR * globeR - y * y));

        ctx.strokeStyle = `rgba(${primaryRgb}, ${isDark ? 0.25 : 0.15})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, y, rAtY, rAtY * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Meridians (Longitudes) rotating
      const meridianCount = 8;
      for (let m = 0; m < meridianCount; m++) {
        const angle = globeAngle + (m * Math.PI) / meridianCount;
        const widthFactor = Math.cos(angle);
        const isFacing = Math.sin(angle) > 0;

        ctx.strokeStyle = `rgba(${cyanRgb}, ${
          isFacing ? (isDark ? 0.35 : 0.2) : (isDark ? 0.12 : 0.06)
        })`;
        ctx.lineWidth = isFacing ? 1 : 0.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.abs(globeR * widthFactor), globeR, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Orbiting Satellite and Orbit Ellipse
      const orbitA = globeR * 1.45;
      const orbitB = globeR * 0.6;
      const orbitTilt = -Math.PI / 6;

      ctx.save();
      ctx.rotate(orbitTilt);

      // Orbit trail
      ctx.strokeStyle = `rgba(${cyanRgb}, ${isDark ? 0.3 : 0.15})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbitA, orbitB, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Satellite position
      const satX = orbitA * Math.cos(satelliteAngle);
      const satY = orbitB * Math.sin(satelliteAngle);

      // Satellite body
      ctx.fillStyle = isDark ? "#ffffff" : "#0B1F4B";
      ctx.beginPath();
      ctx.arc(satX, satY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Satellite solar panels
      ctx.strokeStyle = "#14B8C4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(satX - 8, satY);
      ctx.lineTo(satX + 8, satY);
      ctx.stroke();

      // Signal beam pulse towards globe
      if (Math.sin(satelliteAngle * 2) > 0.3) {
        ctx.strokeStyle = `rgba(20, 184, 196, ${isDark ? 0.4 : 0.25})`;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(satX, satY);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore(); // restore orbit rotation
      ctx.restore(); // restore globe translation

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-90 dark:opacity-100"
      />
    </div>
  );
}
