import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

type Props = { url: string; height?: number };

export default function PlaybackWaveform({ url, height = 84 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: "#d1d5db",     // grey bars
      progressColor: "#14b8a6", // teal progress
      cursorColor: "#60a5fa",   // blue cursor
      normalize: true,
      barWidth: 2,
      barGap: 2,
      dragToSeek: true,
    });
    wsRef.current = ws;

    ws.on("ready", () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));
    ws.on("timeupdate", (time) => setCurrentTime(time));

    ws.load(url);

    return () => ws.destroy();
  }, [url, height]);

  // Add visual markers at 70% position (red line for chime)
  useEffect(() => {
    if (isReady && containerRef.current) {
      const container = containerRef.current;
      
      // Remove existing marker
      const existingMarker = container.querySelector('.red-line-marker');
      if (existingMarker) existingMarker.remove();

      // Create red line marker at 70%
      const marker = document.createElement('div');
      marker.className = 'red-line-marker';
      marker.style.cssText = `
        position: absolute;
        top: 0;
        bottom: 0;
        left: 70%;
        width: 2px;
        background-color: #ef4444;
        z-index: 10;
        pointer-events: none;
      `;
      
      const waveformContainer = container.querySelector('div');
      if (waveformContainer) {
        waveformContainer.style.position = 'relative';
        waveformContainer.appendChild(marker);
      }
    }
  }, [isReady]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const setBlueMarker = () => {
    if (!wsRef.current || !containerRef.current) return;
    
    const currentPos = wsRef.current.getCurrentTime();
    const duration = wsRef.current.getDuration();
    const percentage = (currentPos / duration) * 100;
    
    // Remove existing blue marker
    const existingBlue = containerRef.current.querySelector('.blue-marker');
    if (existingBlue) existingBlue.remove();
    
    // Add blue marker
    const marker = document.createElement('div');
    marker.className = 'blue-marker';
    marker.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      left: ${percentage}%;
      width: 2px;
      background-color: #3b82f6;
      z-index: 10;
      pointer-events: none;
    `;
    
    const waveformContainer = containerRef.current.querySelector('div');
    if (waveformContainer) {
      waveformContainer.appendChild(marker);
    }
  };

  const setRedMarker = () => {
    if (!wsRef.current || !containerRef.current) return;
    
    const currentPos = wsRef.current.getCurrentTime();
    const duration = wsRef.current.getDuration();
    const percentage = (currentPos / duration) * 100;
    
    // Remove existing red marker (not the line)
    const existingRed = containerRef.current.querySelector('.red-marker');
    if (existingRed) existingRed.remove();
    
    // Add red marker
    const marker = document.createElement('div');
    marker.className = 'red-marker';
    marker.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      left: ${percentage}%;
      width: 2px;
      background-color: #ef4444;
      z-index: 10;
      pointer-events: none;
    `;
    
    const waveformContainer = containerRef.current.querySelector('div');
    if (waveformContainer) {
      waveformContainer.appendChild(marker);
    }
  };

  return (
    <div className="w-full">
      <div 
        ref={containerRef} 
        style={{ 
          width: "100%", 
          borderRadius: 12, 
          overflow: "hidden", 
          border: "1px solid #e5e7eb" 
        }} 
      />
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button 
          onClick={() => wsRef.current?.playPause()} 
          disabled={!isReady}
          className="px-3 py-1.5 rounded-xl border shadow-sm disabled:opacity-60"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button 
          onClick={() => wsRef.current?.stop()} 
          disabled={!isReady}
          className="px-3 py-1.5 rounded-xl border shadow-sm disabled:opacity-60"
        >
          Stop
        </button>
        <button
          onClick={setBlueMarker}
          disabled={!isReady}
          className="px-3 py-1.5 rounded-xl border shadow-sm disabled:opacity-60"
        >
          Set Start (Blue)
        </button>
        <button
          onClick={setRedMarker}
          disabled={!isReady}
          className="px-3 py-1.5 rounded-xl border shadow-sm disabled:opacity-60"
        >
          Set End (Red)
        </button>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{isReady ? "Ready" : "Loading…"}</span>
      </div>
    </div>
  );
}