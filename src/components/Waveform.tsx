import { useEffect, useRef } from "react";

interface Props {
  buffer: AudioBuffer;
}

export function Waveform({ buffer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = buffer.getChannelData(0);
    const samplesPerPixel = Math.max(1, Math.floor(data.length / width));

    ctx.clearRect(0, 0, width, height);
    const mid = height / 2;
    ctx.fillStyle = "rgba(124, 92, 255, 0.85)";

    for (let x = 0; x < width; x++) {
      let min = 1;
      let max = -1;
      const start = x * samplesPerPixel;
      const end = Math.min(data.length, start + samplesPerPixel);
      for (let i = start; i < end; i++) {
        const v = data[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = mid + min * mid;
      const y2 = mid + max * mid;
      ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
  }, [buffer]);

  return <canvas ref={canvasRef} width={640} height={110} className="waveform" />;
}
