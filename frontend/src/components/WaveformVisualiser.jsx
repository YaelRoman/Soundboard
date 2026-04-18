import { useEffect, useRef } from "react";
import styles from "./WaveformVisualiser.module.css";

const BAR_COUNT = 32;

// roundRect polyfill for older browsers
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

export default function WaveformVisualiser({ analyser, isPlaying, static: isStatic }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const barW = W / BAR_COUNT - 2;

    if (isStatic || !analyser || !isPlaying) {
      // Draw static decorative bars
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < BAR_COUNT; i++) {
        const h = (Math.sin(i * 0.4) * 0.3 + 0.35) * H * 0.6;
        const x = i * (barW + 2);
        ctx.fillStyle = "rgba(0, 245, 212, 0.2)";
        ctx.beginPath();
        roundRect(ctx, x, (H - h) / 2, barW, h, 2);
        ctx.fill();
      }
      return;
    }

    const bufLen = analyser.frequencyBinCount;
    const data   = new Uint8Array(bufLen);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < BAR_COUNT; i++) {
        const idx = Math.floor((i / BAR_COUNT) * bufLen);
        const v   = data[idx] / 255;
        const h   = Math.max(3, v * H * 0.9);
        const x   = i * (barW + 2);
        const alpha = 0.3 + v * 0.7;
        ctx.fillStyle = `rgba(0, 245, 212, ${alpha})`;
        if (v > 0.6) {
          ctx.shadowColor = "rgba(0, 245, 212, 0.6)";
          ctx.shadowBlur  = 6;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        roundRect(ctx, x, (H - h) / 2, barW, h, 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, isPlaying, isStatic]);

  return <canvas ref={canvasRef} className={styles.canvas} width={256} height={48} />;
}
