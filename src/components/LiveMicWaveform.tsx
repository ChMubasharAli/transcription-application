import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

export default function LiveMicWaveform({ height = 84 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "on" | "off" | "denied">("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: "#d1d5db",
      progressColor: "#14b8a6",
      cursorColor: "#ef4444",
      interact: false,
      normalize: true,
      barWidth: 2,
      barGap: 2,
    });
    wsRef.current = ws;

    // Initialize with empty waveform
    ws.loadBlob(new Blob([new Float32Array(1024)], { type: 'audio/wav' }));

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      ws.destroy();
    };
  }, [height]);

  const start = async () => {
    setStatus("starting");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true 
        } 
      });
      
      setStream(mediaStream);
      setStatus("on");
      
      // Create audio context for real-time visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyser);
      
      // Animate waveform based on microphone input
      const animate = () => {
        if (status === "on" && wsRef.current) {
          analyser.getByteFrequencyData(dataArray);
          
          // Convert frequency data to waveform-like visualization
          const waveformData = new Float32Array(1024);
          for (let i = 0; i < waveformData.length; i++) {
            const index = Math.floor((i / waveformData.length) * bufferLength);
            waveformData[i] = (dataArray[index] / 255) * 2 - 1; // Normalize to -1 to 1
          }
          
          // Create a blob from the waveform data for visualization
          const audioBuffer = audioContext.createBuffer(1, waveformData.length, 44100);
          audioBuffer.copyToChannel(waveformData, 0);
          
          // Update wavesurfer visualization
          try {
            wsRef.current.loadBlob(new Blob([waveformData], { type: 'audio/wav' }));
          } catch (e) {
            // Handle any errors silently
          }
          
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animate();
      
    } catch (error) {
      console.error("Microphone access denied:", error);
      setStatus("denied");
    }
  };

  const stop = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setStatus("off");
    
    // Reset to empty waveform
    if (wsRef.current) {
      wsRef.current.loadBlob(new Blob([new Float32Array(1024)], { type: 'audio/wav' }));
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
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        {status !== "on" ? (
          <button 
            onClick={start}
            className="px-3 py-1.5 rounded-xl border shadow-sm"
          >
            Start Mic
          </button>
        ) : (
          <button 
            onClick={stop}
            className="px-3 py-1.5 rounded-xl border shadow-sm"
          >
            Stop Mic
          </button>
        )}
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {status === "idle" && "Idle"}
          {status === "starting" && "Starting… allow mic permission"}
          {status === "on" && "Live"}
          {status === "off" && "Stopped"}
          {status === "denied" && "Permission denied"}
        </span>
      </div>
    </div>
  );
}