import { useEffect, useRef, useState } from 'react';

const NEON = 'rgba(51, 240, 255, 0.95)';
const NEON_SOFT = 'rgba(51, 240, 255, 0.22)';

function mapAudioError(error) {
  if (!error || !error.name) return 'Microphone unavailable';
  if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
    return 'Microphone permission denied';
  }
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'No microphone detected';
  }
  if (error.name === 'NotReadableError') {
    return 'Microphone is busy';
  }
  return 'Microphone unavailable';
}

export default function Waveform() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let audioContext;
    let analyser;
    let source;
    let stream;
    let stopped = false;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (dataArray) => {
      if (stopped) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.35;
      const bins = dataArray.length;

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      // Inner constant ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(51, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < bins; i += 2) {
        const value = dataArray[i] / 255;
        const angle = (i / bins) * Math.PI * 2;

        // Dynamic bar length
        const inner = radius + 4;
        const outer = inner + (value * 35) + (Math.sin(Date.now() / 1000 + i) * 2);

        const x1 = cx + Math.cos(angle) * inner;
        const y1 = cy + Math.sin(angle) * inner;
        const x2 = cx + Math.cos(angle) * outer;
        const y2 = cy + Math.sin(angle) * outer;

        // Draw bar
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = value > 0.6 ? `rgba(51, 240, 255, ${value})` : NEON_SOFT;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(51, 240, 255, 0.5)';
        ctx.shadowBlur = value * 15;
        ctx.stroke();

        // Draw particle dot at the tip
        if (value > 0.4) {
          ctx.beginPath();
          ctx.arc(x2, y2, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = NEON;
          ctx.fill();
        }
      }

      frameRef.current = window.requestAnimationFrame(() => draw(dataArray));
    };

    const init = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErrorMessage('Microphone API unavailable');
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMic = devices.some((device) => device.kind === 'audioinput');
        if (!hasMic) {
          setErrorMessage('No microphone detected');
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        resize();
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        draw(dataArray);
      } catch (error) {
        setErrorMessage(mapAudioError(error));
      }
    };

    init();
    window.addEventListener('resize', resize);

    return () => {
      stopped = true;
      window.removeEventListener('resize', resize);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (source) {
        source.disconnect();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  return (
    <div className="waveform-shell absolute -inset-8 sm:-inset-10">
      <canvas ref={canvasRef} className="waveform-canvas" />
      {errorMessage ? (
        <div className="waveform-error font-hud absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-jarvis-red">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
