import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Square, Mic, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExamRecording } from "@/hooks/useExamRecording";
import { useToast } from "@/hooks/use-toast";

interface AudioWaveformProps {
  audioUrl?: string;
  className?: string;
  height?: number;
  questionId?: string;
  onPlayPause?: () => void;
  onReady?: () => void;
  onEnded?: () => void;
  onRecordingStart?: () => void;
  onRecordingComplete?: (blob: Blob, url: string, duration: number) => void;
  autoPlay?: boolean;
  initialRecordedBlob?: Blob | null;
  initialRecordingTime?: number;
}

interface AudioWaveformRef {
  play: () => void;
  pause: () => void;
  playPause: () => void;
  isReady: () => boolean;
  setVolume: (volume: number) => void;
  stopRecording: () => void;
  isRecording: () => boolean;
  seekToStart: () => void;
  getRecordingTime: () => number;
  startRecording: () => void;
  playRecordedAudio: () => void;
  stopRecordedAudio: () => void;
  saveRecording: () => void;
}

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(
  (
    {
      audioUrl,
      className = "",
      height = 96,
      questionId = "default-question",
      onPlayPause,
      onReady,
      onEnded,
      onRecordingStart,
      onRecordingComplete,
      autoPlay = false,
      initialRecordedBlob = null,
      initialRecordingTime = 0,
    },
    ref
  ) => {
    const [isReady, setIsReady] = useState(false);
    const waveformRef = useRef<HTMLDivElement>(null);
    const recordingCanvasRef = useRef<HTMLCanvasElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState("0:00");
    const [duration, setDuration] = useState("0:00");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
      null
    );
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string>("");
    const [saved, setSaved] = useState(false);
    const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
    const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

    // Recording visualization
    const animationRef = useRef<number>();
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const { toast } = useToast();
    const { saveRecording: saveRecordingToDB } = useExamRecording();

    const formatTimeDisplay = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    // Live waveform animation with enhanced microphone visualization
    const animateLiveWaveform = useCallback(() => {
      if (!analyserRef.current || !recordingCanvasRef.current) {
        console.log("🎤 Animation stopped: missing refs", {
          analyser: !!analyserRef.current,
          canvas: !!recordingCanvasRef.current,
          isRecording,
        });
        return;
      }

      const canvas = recordingCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.log("🎤 No canvas context available");
        return;
      }

      console.log("🎤 Canvas dimensions:", canvas.width, "x", canvas.height);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average audio level to detect if user is speaking
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const avgLevel = sum / bufferLength;
      const SPEECH_THRESHOLD = 5; // Threshold to detect actual speech vs silence
      const isSpeaking = avgLevel > SPEECH_THRESHOLD;

      if (avgLevel > 0) {
        console.log(
          "🎤 Audio level detected:",
          avgLevel,
          "Speaking:",
          isSpeaking
        );
      }

      // Clear canvas
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid lines
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      ctx.setLineDash([]);

      const centerY = canvas.height / 2;
      const barWidth = Math.max(2, canvas.width / 100);
      const barSpacing = 1;

      if (isSpeaking) {
        // Draw frequency bars only when user is speaking
        for (let i = 0; i < 100; i++) {
          const dataIndex = Math.floor((i / 100) * bufferLength);
          const value = dataArray[dataIndex];

          // Only draw bars if value is above threshold
          if (value > SPEECH_THRESHOLD) {
            const normalizedHeight = value / 255;
            const barHeight = Math.max(2, normalizedHeight * centerY * 0.8);

            const intensity = normalizedHeight;
            let fillColor;

            if (intensity > 0.7) {
              fillColor = "#dc2626";
            } else if (intensity > 0.4) {
              fillColor = "#ef4444";
            } else if (intensity > 0.1) {
              fillColor = "#f87171";
            } else {
              fillColor = "#fca5a5";
            }

            ctx.fillStyle = fillColor;

            const x = i * (barWidth + barSpacing);

            // Draw upper bar
            ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);

            // Draw lower bar (mirror)
            ctx.fillRect(x, centerY, barWidth, barHeight);
          }
        }
      } else {
        // Draw flat line when silent
        ctx.strokeStyle = "#fca5a5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
      }

      // Add recording indicators
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(canvas.width - 40, 15, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#374151";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("LIVE", canvas.width - 30, 19);

      // Continue animation if recording
      if (isRecording) {
        animationRef.current = requestAnimationFrame(animateLiveWaveform);
      }
    }, [isRecording]);

    // Play recorded audio
    const playRecordedAudio = useCallback(() => {
      if (recordedUrl && recordedAudioRef.current) {
        recordedAudioRef.current
          .play()
          .then(() => {
            setIsPlayingRecorded(true);
            console.log("🎵 Started playing recorded audio");
          })
          .catch((error) => {
            console.error("Error playing recorded audio:", error);
            toast({
              title: "Playback Error",
              description: "Could not play the recorded audio.",
              variant: "destructive",
            });
          });
      }
    }, [recordedUrl, toast]);

    // Stop playing recorded audio
    const stopRecordedAudio = useCallback(() => {
      if (recordedAudioRef.current) {
        recordedAudioRef.current.pause();
        recordedAudioRef.current.currentTime = 0;
        setIsPlayingRecorded(false);
        console.log("🎵 Stopped playing recorded audio");
      }
    }, []);

    // Toggle play/pause for recorded audio
    const toggleRecordedAudio = useCallback(() => {
      if (!recordedAudioRef.current) return;

      if (isPlayingRecorded) {
        stopRecordedAudio();
      } else {
        playRecordedAudio();
      }
    }, [isPlayingRecorded, playRecordedAudio, stopRecordedAudio]);

    // Manual recording start with proper error handling
    const startRecording = useCallback(async () => {
      if (isRecording) return;

      try {
        console.log("🎤 Starting recording...");

        // Check if we're in a secure context (required for microphone)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Microphone not supported in this browser");
        }

        // Check if we have proper user gesture context
        if (document.visibilityState !== "visible") {
          throw new Error("Page must be visible to access microphone");
        }

        // Notify parent that recording is starting
        if (onRecordingStart) {
          onRecordingStart();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 1,
          },
        });

        console.log("🎤 Microphone access granted");
        setAudioStream(stream);

        // Setup MediaRecorder with proper MIME type fallback
        const options = {
          audioBitsPerSecond: 128000,
        };

        let recorder;
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          recorder = new MediaRecorder(stream, {
            ...options,
            mimeType: "audio/webm;codecs=opus",
          });
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          recorder = new MediaRecorder(stream, {
            ...options,
            mimeType: "audio/mp4",
          });
        } else {
          recorder = new MediaRecorder(stream, options);
        }

        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, {
            type: chunks[0]?.type || "audio/webm",
          });
          const url = URL.createObjectURL(blob);
          setRecordedBlob(blob);
          setRecordedUrl(url);

          // Create audio element for playback
          recordedAudioRef.current = new Audio(url);
          recordedAudioRef.current.onended = () => {
            setIsPlayingRecorded(false);
            console.log("🎵 Recorded audio ended naturally");
          };

          recordedAudioRef.current.onpause = () => {
            setIsPlayingRecorded(false);
            console.log("🎵 Recorded audio paused");
          };

          console.log("🎤 Recording stopped, blob created");

          // Notify parent component
          if (onRecordingComplete) {
            onRecordingComplete(blob, url, recordingTime);
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);

        // Setup audio visualization
        try {
          audioContextRef.current = new AudioContext();
          const source =
            audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
        } catch (audioError) {
          console.warn(
            "Audio visualization failed, but recording continues:",
            audioError
          );
        }

        // Start recording timer
        setRecordingTime(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

        // Start visualization after ensuring canvas is ready
        setTimeout(() => {
          if (recordingCanvasRef.current) {
            animateLiveWaveform();
          }
        }, 100);

        toast({
          title: "Recording Started 🎤",
          description: "Speak now - your response is being recorded.",
        });
      } catch (error) {
        console.error("🎤 Microphone access failed:", error);

        let errorMessage = "Could not access microphone. ";

        if (error.name === "NotAllowedError") {
          errorMessage +=
            "Please allow microphone permissions in your browser and refresh the page.";
        } else if (error.name === "NotFoundError") {
          errorMessage +=
            "No microphone found. Please check your audio devices.";
        } else if (error.name === "NotSupportedError") {
          errorMessage += "Your browser doesn't support audio recording.";
        } else {
          errorMessage += "Please check browser permissions and try again.";
        }

        toast({
          title: "Microphone Permission Required",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }, [
      isRecording,
      toast,
      onRecordingStart,
      onRecordingComplete,
      recordingTime,
      animateLiveWaveform,
    ]);

    // Draw recorded waveform (static display after recording)
    const drawRecordedWaveform = useCallback(() => {
      if (!recordingCanvasRef.current) return;

      const canvas = recordingCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      console.log("🎨 Drawing recorded waveform...");

      // Clear canvas with background
      ctx.fillStyle = "#fef2f2";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid lines
      ctx.strokeStyle = "#fecaca";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      ctx.setLineDash([]);

      // Draw recorded waveform representation
      const centerY = canvas.height / 2;
      const barWidth = 3;
      const barSpacing = 1;
      const numBars = Math.floor(canvas.width / (barWidth + barSpacing));

      // Generate a realistic waveform pattern based on recording duration
      for (let i = 0; i < numBars; i++) {
        const progress = i / numBars;

        // Create varied amplitude based on position (simulating speech patterns)
        let amplitude = 0.3; // Base amplitude

        // Add speech-like patterns
        if (progress < 0.1 || progress > 0.9) {
          // Quieter at start/end
          amplitude *= 0.4;
        } else if (progress > 0.2 && progress < 0.8) {
          // Louder in middle (main speech)
          amplitude *= 1.2;
        }

        // Add some realistic variation
        const wave1 = Math.sin(progress * Math.PI * 8) * 0.4;
        const wave2 = Math.sin(progress * Math.PI * 20) * 0.2;
        const wave3 = Math.sin(progress * Math.PI * 50) * 0.1;
        const randomNoise = (Math.random() - 0.5) * 0.3;

        const combinedAmplitude =
          amplitude + wave1 + wave2 + wave3 + randomNoise;
        const normalizedHeight = Math.max(
          0.05,
          Math.min(0.95, Math.abs(combinedAmplitude))
        );

        const barHeight = normalizedHeight * centerY * 0.8;

        // Use red color scheme for recorded waveform with intensity-based colors
        const intensity = normalizedHeight;
        let fillColor;

        if (intensity > 0.7) {
          fillColor = "#dc2626"; // Strong red
        } else if (intensity > 0.5) {
          fillColor = "#ef4444"; // Medium red
        } else if (intensity > 0.3) {
          fillColor = "#f87171"; // Light red
        } else {
          fillColor = "#fca5a5"; // Very light red
        }

        ctx.fillStyle = fillColor;

        const x = i * (barWidth + barSpacing);

        // Draw upper bar
        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);

        // Draw lower bar (mirror)
        ctx.fillRect(x, centerY, barWidth, barHeight);
      }

      // Add "RECORDED" indicator
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(canvas.width - 60, 15, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#374151";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("RECORDED", canvas.width - 50, 19);

      // Add duration
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px sans-serif";
      ctx.fillText(formatTimeDisplay(recordingTime), 10, canvas.height - 10);

      console.log("🎨 Recorded waveform drawn successfully");
    }, [recordingTime]);

    // Effect to handle initial recorded data (from navigation back to completed segment)
    useEffect(() => {
      if (initialRecordedBlob && initialRecordingTime > 0) {
        console.log("🎨 Restoring recorded data from navigation...", {
          hasBlob: !!initialRecordedBlob,
          recordingTime: initialRecordingTime,
          currentBlob: !!recordedBlob,
        });

        const url = URL.createObjectURL(initialRecordedBlob);
        setRecordedBlob(initialRecordedBlob);
        setRecordedUrl(url);
        setRecordingTime(initialRecordingTime);
        setSaved(true);

        // Create audio element for playback
        recordedAudioRef.current = new Audio(url);
        recordedAudioRef.current.onended = () => {
          setIsPlayingRecorded(false);
          console.log("🎵 Recorded audio ended naturally");
        };

        recordedAudioRef.current.onpause = () => {
          setIsPlayingRecorded(false);
          console.log("🎵 Recorded audio paused");
        };

        // Trigger waveform drawing after state is set
        setTimeout(() => {
          drawRecordedWaveform();
        }, 100);
      }
    }, [initialRecordedBlob, initialRecordingTime, drawRecordedWaveform]);

    // Effect to draw recorded waveform when we have recorded data
    useEffect(() => {
      if (recordedBlob && !isRecording && recordingCanvasRef.current) {
        console.log("🎨 Triggering recorded waveform draw...");
        // Small delay to ensure canvas is ready
        setTimeout(() => {
          drawRecordedWaveform();
        }, 200);
      }
    }, [recordedBlob, isRecording, drawRecordedWaveform]);

    // Stop recording without saving
    const stopRecording = useCallback(async () => {
      if (!isRecording) return;

      console.log("🎤 Stopping recording...");

      // Stop recording
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }

      // Stop audio stream
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }

      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsRecording(false);

      toast({
        title: "Recording Stopped",
        description: "Your recording is ready for playback.",
      });
    }, [isRecording, mediaRecorder, audioStream]);

    // Save recording to database
    const saveRecording = useCallback(async () => {
      if (!recordedBlob) {
        toast({
          title: "No Recording",
          description: "There is no recording to save.",
          variant: "destructive",
        });
        return;
      }

      try {
        await saveRecordingToDB(recordedBlob, questionId, recordingTime);
        setSaved(true);

        toast({
          title: "Response Saved!",
          description: "Your answer has been successfully saved.",
        });
      } catch (error) {
        console.error("💾 Failed to save recording:", error);
        toast({
          title: "Save Failed",
          description: "Could not save your response. Please try again.",
          variant: "destructive",
        });
      }
    }, [recordedBlob, recordingTime, questionId, saveRecordingToDB, toast]);

    // Effect to ensure canvas is ready when recording starts
    useEffect(() => {
      console.log("🎤 Recording state changed. isRecording:", isRecording);

      if (isRecording && recordingCanvasRef.current) {
        console.log("🎤 Recording started, ensuring canvas is ready...");
        const canvas = recordingCanvasRef.current;

        // Ensure canvas dimensions are set correctly
        canvas.width = 800;
        canvas.height = 80;

        console.log(
          "🎤 Canvas dimensions set:",
          canvas.width,
          "x",
          canvas.height
        );

        // Start animation loop with a longer delay to ensure canvas is rendered
        setTimeout(() => {
          if (
            isRecording &&
            analyserRef.current &&
            recordingCanvasRef.current
          ) {
            console.log(
              "🎤 Canvas available in useEffect, starting animation loop..."
            );
            animateLiveWaveform();
          } else {
            console.log("🎤 Canvas not ready in useEffect", {
              isRecording,
              hasAnalyser: !!analyserRef.current,
              hasCanvas: !!recordingCanvasRef.current,
            });
          }
        }, 500);
      }

      // Cleanup animation on stop
      if (!isRecording && animationRef.current) {
        console.log("🎤 Stopping animation...");
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    }, [isRecording, animateLiveWaveform]);

    useEffect(() => {
      console.log("🎵 AudioWaveform: Starting initialization...", {
        audioUrl,
        waveformRef: !!waveformRef.current,
      });

      if (!waveformRef.current) {
        console.error("🎵 AudioWaveform: No waveform container found");
        setError("Waveform container not found");
        return;
      }

      try {
        console.log("🎵 AudioWaveform: Creating WaveSurfer instance...");

        // Initialize WaveSurfer
        wavesurfer.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: "#9ca3af",
          progressColor: "#3b82f6",
          cursorColor: "#3b82f6",
          barWidth: 2,
          barRadius: 1,
          height: height - 40,
          normalize: true,
          mediaControls: false,
        });

        console.log(
          "🎵 AudioWaveform: WaveSurfer instance created successfully"
        );

        // Event listeners
        wavesurfer.current.on("ready", () => {
          console.log("🎵 AudioWaveform: Audio ready");
          const totalDuration = wavesurfer.current?.getDuration() || 0;
          setDuration(formatTimeDisplay(totalDuration));
          setIsLoading(false);
          setError(null);
          setIsReady(true);
          console.log(
            "🎵 AudioWaveform: Ready state set to true, calling onReady"
          );
          onReady?.();

          // Auto-play if requested
          if (autoPlay) {
            console.log("🎵 AudioWaveform: Auto-playing...");
            setTimeout(() => {
              wavesurfer.current?.play();
            }, 100);
          }
        });

        wavesurfer.current.on("loading", (progress) => {
          console.log("🎵 AudioWaveform: Loading progress:", progress);
        });

        wavesurfer.current.on("error", (err) => {
          console.error("🎵 AudioWaveform: Error:", err);
          setError(`Audio error: ${err}`);
          setIsLoading(false);
        });

        wavesurfer.current.on("audioprocess", () => {
          const current = wavesurfer.current?.getCurrentTime() || 0;
          const totalDuration = wavesurfer.current?.getDuration() || 0;
          setCurrentTime(formatTimeDisplay(current));

          // Auto-start recording when audio is about to end (last 0.5 seconds)
          if (
            totalDuration > 0 &&
            current >= totalDuration - 0.5 &&
            !isRecording &&
            isPlaying
          ) {
            console.log("🎵 Audio about to end, auto-starting recording...");
            wavesurfer.current?.pause();
            startRecording();
          }
        });

        wavesurfer.current.on("play", () => {
          console.log("🎵 AudioWaveform: Playing");
          setIsPlaying(true);
        });

        wavesurfer.current.on("pause", () => {
          console.log("🎵 AudioWaveform: Paused");
          setIsPlaying(false);
        });

        wavesurfer.current.on("finish", () => {
          console.log("🎵 AudioWaveform: Finished");
          setIsPlaying(false);

          // Notify parent component that audio has ended
          if (onEnded) {
            onEnded();
          }

          // Auto-start recording when audio finishes
          if (!isRecording) {
            console.log("🎵 Auto-starting recording after audio finished");
            startRecording();
          }
        });

        // Load audio if URL provided
        if (audioUrl) {
          console.log("🎵 AudioWaveform: Loading audio from URL:", audioUrl);
          wavesurfer.current.load(audioUrl);
        } else {
          console.log(
            "🎵 AudioWaveform: No audio URL provided, creating empty waveform"
          );
          setIsLoading(false);
          // Create a simple empty state waveform
          wavesurfer.current.empty();
        }
      } catch (err) {
        console.error("🎵 AudioWaveform: Initialization error:", err);
        setError(`Initialization error: ${err}`);
        setIsLoading(false);
      }

      // Cleanup function
      return () => {
        console.log("🎵 AudioWaveform: Cleaning up...");
        if (wavesurfer.current) {
          wavesurfer.current.destroy();
          wavesurfer.current = null;
        }

        // Cleanup recording resources
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (recordedAudioRef.current) {
          recordedAudioRef.current.pause();
          recordedAudioRef.current = null;
        }
        // Clean up recorded URL to prevent memory leaks
        if (recordedUrl) {
          URL.revokeObjectURL(recordedUrl);
        }
      };
    }, [audioUrl, height]);

    const togglePlayPause = () => {
      if (wavesurfer.current && !isRecording) {
        wavesurfer.current.playPause();
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          if (wavesurfer.current && isReady && !isRecording) {
            console.log("🎵 AudioWaveform: Playing via ref");
            wavesurfer.current.play();
          } else {
            console.log("🎵 AudioWaveform: Not ready for playback", {
              wavesurfer: !!wavesurfer.current,
              isReady,
              isRecording,
            });
          }
        },
        pause: () => {
          if (wavesurfer.current) {
            wavesurfer.current.pause();
          }
        },
        playPause: togglePlayPause,
        isReady: () => isReady,
        setVolume: (volume: number) => {
          if (wavesurfer.current) {
            console.log("🎵 AudioWaveform: Setting volume to", volume);
            wavesurfer.current.setVolume(volume);
          }
        },
        stopRecording: () => {
          console.log("🎵 AudioWaveform: stopRecording called via ref");
          stopRecording();
        },
        isRecording: () => isRecording,
        seekToStart: () => {
          if (wavesurfer.current && isReady) {
            console.log("🎵 AudioWaveform: Seeking to start and playing");
            wavesurfer.current.seekTo(0);
            wavesurfer.current.play();
          }
        },
        getRecordingTime: () => {
          return recordingTime;
        },
        startRecording: () => {
          console.log("🎵 AudioWaveform: Starting recording via ref");
          startRecording();
        },
        playRecordedAudio: () => {
          console.log("🎵 AudioWaveform: Playing recorded audio via ref");
          playRecordedAudio();
        },
        stopRecordedAudio: () => {
          console.log("🎵 AudioWaveform: Stopping recorded audio via ref");
          stopRecordedAudio();
        },
        saveRecording: () => {
          console.log("🎵 AudioWaveform: Saving recording via ref");
          saveRecording();
        },
      }),
      [
        isReady,
        isRecording,
        stopRecording,
        recordingTime,
        startRecording,
        playRecordedAudio,
        stopRecordedAudio,
        saveRecording,
      ]
    );

    if (error) {
      return (
        <div className={`space-y-4 ${className}`}>
          <div
            className="w-full bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm"
            style={{ minHeight: `${height}px` }}
          >
            Error: {error}
          </div>
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${className}`}>
        {/* Hidden audio element for recorded playback */}
        {recordedUrl && (
          <audio ref={recordedAudioRef} src={recordedUrl} preload="metadata" />
        )}

        {/* Main Audio Waveform */}
        <div className="space-y-2">
          <div
            ref={waveformRef}
            className="w-full bg-gray-50 border relative animate-fade-in"
            style={{ minHeight: `${height}px` }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-sm text-gray-500">Loading audio...</div>
              </div>
            )}

            {/* Red Ribbon Bookmark at the end of waveform */}
            <div
              className="absolute flex flex-col items-center z-10"
              style={{ top: "-2px", right: "-6px" }}
            >
              <div className="relative flex flex-col items-center">
                {/* Ribbon flag shape - clean rectangular with V-notch */}
                <div
                  className="w-3 h-4 shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, #ff9a9e 0%, #ff6b9d 100%)",
                    clipPath: "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
                  }}
                />
                {/* Vertical ribbon tail - thin smooth line */}
                <div
                  className="w-0.5"
                  style={{
                    height: `${height - 16}px`,
                    background:
                      "linear-gradient(180deg, #ff6b9d 0%, #ff9a9e 100%)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{currentTime}</span>
              <span>/</span>
              <span>{duration}</span>
            </div>
          </div>
        </div>

        {/* Recording Canvas - Show when recording OR when there's recorded data */}
        {(isRecording || recordedBlob) && (
          <div className="space-y-2 animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                {isRecording
                  ? "Recording Your Response"
                  : "Your Recorded Response"}
              </h4>
              <div className="flex items-center space-x-3">
                {isRecording ? (
                  <>
                    <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>REC</span>
                    </div>
                    <div className="text-red-600 font-mono text-sm">
                      {formatTimeDisplay(recordingTime)}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>READY</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <canvas
                ref={recordingCanvasRef}
                width={800}
                height={80}
                className="w-full bg-red-50 border-2 border-red-200 hover-scale"
                style={{ maxHeight: "80px", display: "block" }}
              />

              {/* Red Ribbon Bookmark at the end of recording canvas */}
              {(isRecording || recordedBlob) && (
                <div
                  className="absolute flex flex-col items-center z-10"
                  style={{ top: "-2px", right: "-6px" }}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Ribbon flag shape - clean rectangular with V-notch */}
                    <div
                      className="w-3 h-4 shadow-sm"
                      style={{
                        background:
                          "linear-gradient(135deg, #ff9a9e 0%, #ff6b9d 100%)",
                        clipPath:
                          "polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)",
                      }}
                    />
                    {/* Vertical ribbon tail - thin smooth line */}
                    <div
                      className="w-0.5"
                      style={{
                        height: "66px",
                        background:
                          "linear-gradient(180deg, #ff6b9d 0%, #ff9a9e 100%)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Play Recording Button - Show when recording is finished but not saved */}
        {recordedBlob && !isRecording && !saved && (
          <div className="text-center animate-fade-in">
            <Button
              onClick={toggleRecordedAudio}
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center space-x-2 mx-auto"
            >
              {isPlayingRecorded ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Stop Playback</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Play Recording</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Saved confirmation */}
        {saved && !isRecording && (
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center space-x-2 text-green-600 font-medium">
              <CheckCircle className="w-5 h-5" />
              <span>Response Saved Successfully</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);
