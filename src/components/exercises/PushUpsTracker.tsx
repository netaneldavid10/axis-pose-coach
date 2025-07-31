import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Camera as CameraIcon, Square, RotateCcw } from 'lucide-react';

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

interface ExerciseData {
  reps: number;
  duration: number;
  formAccuracy: number;
  feedback: string[];
}

interface PushUpsTrackerProps {
  onExerciseComplete: (data: ExerciseData) => void;
  onBack: () => void;
}

export const PushUpsTracker: React.FC<PushUpsTrackerProps> = ({
  onExerciseComplete,
  onBack
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [exerciseData, setExerciseData] = useState<ExerciseData>({
    reps: 0,
    duration: 0,
    formAccuracy: 0,
    feedback: []
  });
  const [feedback, setFeedback] = useState('');
  const [viewMode, setViewMode] = useState<'front' | 'side'>('front');
  const [startTime, setStartTime] = useState<number | null>(null);
  const { toast } = useToast();

  const workoutStateRef = useRef<'ready' | 'up' | 'down'>('ready');
  const readyFramesRef = useRef(0);
  const cooldownFramesRef = useRef(0);

  let orientation: 'front' | 'side' = 'side';
  let lostFrames = 0;

  const prevScaleRef = useRef<number | null>(null);
  const unstableFramesRef = useRef(0);

  const feedbackGivenRef = useRef(false);

  // baseline reference (מתעדכן בכל חזרה)
  const lockBaselineRef = useRef<{ shoulderY: number; wristY: number } | null>(null);
  const repCountRef = useRef(0);

  // קרוב מדי למצלמה
  const tooCloseRef = useRef(false);

  const synth = window.speechSynthesis;
  let selectedVoice: SpeechSynthesisVoice | null = null;
  const speechQueue: string[] = [];
  let speaking = false;

  function processSpeechQueue() {
    if (speaking || speechQueue.length === 0 || !selectedVoice) return;
    const text = speechQueue.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.lang = 'en-US';
    utterance.pitch = 1;
    utterance.rate = 1.15;
    speaking = true;
    utterance.onend = () => {
      speaking = false;
      processSpeechQueue();
    };
    synth.speak(utterance);
  }

  function speak(text: string) {
    if (!text) return;
    speechQueue.push(text);
    processSpeechQueue();
  }

  function clearSpeechQueue() {
    speechQueue.length = 0;
    speaking = false;
    synth.cancel();
  }

  function initVoices() {
    const voices = synth.getVoices();
    selectedVoice =
      voices.find(v => v.name.includes('Google US English')) ||
      voices.find(v => v.lang === 'en-US') ||
      null;
  }

  function angle(a: any, b: any, c: any) {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const cb = { x: b.x - c.x, y: b.y - c.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
    const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
    const cosine = dot / (magAB * magCB);
    return Math.acos(Math.min(Math.max(cosine, -1), 1)) * (180 / Math.PI);
  }

  function detectOrientation(lm: any[]) {
    const shoulderDist = Math.abs(lm[11].x - lm[12].x);
    const hipDist = Math.abs(lm[23].x - lm[24].x);
    const totalWidth = Math.max(shoulderDist, hipDist);
    const totalHeight = Math.abs(lm[0].y - lm[24].y);
    const ratio = totalWidth / totalHeight;
    return ratio > 0.65 ? 'front' : 'side';
  }

  function isStable(lm: any[]): boolean {
    const shoulderDist = Math.abs(lm[11].x - lm[12].x);
    const hipDist = Math.abs(lm[23].x - lm[24].x);
    const scale = Math.max(shoulderDist, hipDist);

    if (prevScaleRef.current) {
      const change = Math.abs(scale - prevScaleRef.current) / prevScaleRef.current;
      if (change > 0.25) {
        unstableFramesRef.current++;
        if (unstableFramesRef.current < 10) return false;
      } else {
        unstableFramesRef.current = 0;
      }
    }
    prevScaleRef.current = scale;
    return true;
  }

  function isTooClose(lm: any[]): boolean {
    const shoulderWidth = Math.abs(lm[11].x - lm[12].x);
    return shoulderWidth > 0.4;
  }

  function onResults(results: any) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks || results.poseLandmarks.length < 25) {
      setFeedback('Move back - not enough data');
      return;
    }

    const lm = results.poseLandmarks;
    const ls = lm[11], rs = lm[12], le =
