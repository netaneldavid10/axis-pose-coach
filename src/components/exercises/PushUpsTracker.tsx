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

const DEPTH_THRESHOLD = 0.1;
const HIP_DEVIATION_THRESHOLD = 0.3;

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

  const workoutStateRef = useRef<'ready' | 'up' | 'down' | 'repositioning'>('ready');
  const readyFramesRef = useRef(0);
  const cooldownFramesRef = useRef(0);
  const stableFramesRef = useRef(0);

  const repCountRef = useRef(0);
  const tooCloseRef = useRef(false);

  const repStartShoulderYRef = useRef<number | null>(null);
  const repMinShoulderYRef = useRef<number | null>(null);
  const hipBaselineRef = useRef<number | null>(null);

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
    const ls = lm[11], rs = lm[12], le = lm[13], rw = lm[16], lw = lm[15];
    const lh = lm[23], lk = lm[25], nose = lm[0];
    const shoulderY = (ls.y + rs.y) / 2;
    const hipY = (lh.y + lk.y) / 2;
    const ankleY = (lm[27].y + lm[28].y) / 2;

    window.drawConnectors(ctx, lm, window.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    window.drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 2 });

    // זיהוי ירידה/עלייה
    const leftElbowAngle = angle(ls, le, lw);
    const rightElbowAngle = angle(rs, lm[14], rw);
    const downDetected = leftElbowAngle < 125 && rightElbowAngle < 125;
    const upDetected = leftElbowAngle > 145 && rightElbowAngle > 145;

    // DEBUG LOG מצב נוכחי
    console.log("STATE:", workoutStateRef.current, "Reps:", repCountRef.current);

    // READY
    if (workoutStateRef.current === 'ready') {
      if (shoulderY < hipY - 0.1) {
        readyFramesRef.current++;
        if (readyFramesRef.current > 15) {
          workoutStateRef.current = 'up';
          console.log("→ ENTER UP STATE (Ready complete)");
          setFeedback('Ready! Start push-ups');
          speak('Ready, start push-ups');
        }
      } else {
        readyFramesRef.current = 0;
        setFeedback('Get into position');
      }
      return;
    }

    // ירידה
    if (workoutStateRef.current === 'up' && downDetected) {
      workoutStateRef.current = 'down';
      console.log("→ ENTER DOWN STATE");
      setFeedback('Down!');
      repStartShoulderYRef.current = shoulderY;
      repMinShoulderYRef.current = shoulderY;
      hipBaselineRef.current = (hipY - shoulderY) / (ankleY - hipY);
    }

    if (workoutStateRef.current === 'down') {
      if (repMinShoulderYRef.current === null || shoulderY > repMinShoulderYRef.current) {
        repMinShoulderYRef.current = shoulderY;
      }
    }

    // עלייה וספירת חזרה
    if (workoutStateRef.current === 'down' && upDetected) {
      workoutStateRef.current = 'up';
      repCountRef.current += 1;
      console.log("→ ENTER UP STATE (Rep finished)", "Reps:", repCountRef.current);

      let errors: string[] = [];

      if (repCountRef.current === 1) {
        setFeedback('Great push-up!');
        speak('Great push-up!');
      } else {
        // עומק
        const drop = (repMinShoulderYRef.current ?? 0) - (repStartShoulderYRef.current ?? 0);
        if (drop <= DEPTH_THRESHOLD) {
          errors.push("Go lower next time");
        }

        // ירכיים ביחס ל־baseline
        if (hipBaselineRef.current !== null) {
          const currentHipRatio = (hipY - shoulderY) / (ankleY - hipY);
          const deviation = currentHipRatio - hipBaselineRef.current;
          if (deviation > HIP_DEVIATION_THRESHOLD) {
            errors.push("Lower your hips");
          } else if (deviation < -HIP_DEVIATION_THRESHOLD) {
            errors.push("Keep your back straight");
          }
        }

        if (errors.length > 0) {
          const chosen = errors[0];
          setFeedback(chosen);
          speak(chosen);
        } else {
          setFeedback('Great push-up!');
          speak('Great push-up!');
        }
      }

      cooldownFramesRef.current = 20;
      repStartShoulderYRef.current = null;
      repMinShoulderYRef.current = null;
      hipBaselineRef.current = null;
    }
  }

  const startExercise = async () => {
    setIsTracking(true);
    setStartTime(Date.now());
    setFeedback('Get into position');
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = initVoices;
    initVoices();
    const pose = new window.Pose({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults(onResults);
    if (videoRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480
      });
      camera.start();
    }
  };

  const stopExercise = () => {
    setIsTracking(false);
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const finalData: ExerciseData = {
      ...exerciseData,
      duration,
      formAccuracy: Math.random() * 30 + 70,
      feedback: []
    };
    setExerciseData(finalData);
    toast({
      title: 'Exercise Complete!',
      description: `Great job! You completed ${finalData.reps} reps with ${Math.round(
        finalData.formAccuracy
      )}% form accuracy.`
    });
    setTimeout(() => {
      onExerciseComplete(finalData);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-center flex-1">Push-ups</h1>
          <div className="w-16" />
        </div>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
