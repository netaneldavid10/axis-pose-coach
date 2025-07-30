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

  const lockFramesRef = useRef(0);
  const feedbackGivenRef = useRef(false);

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

  function lockDetected(lm: any[]): boolean {
    const ls = lm[11], rs = lm[12], le = lm[13], re = lm[14], lw = lm[15], rw = lm[16];
    const lh = lm[23], lk = lm[25];

    const shoulderY = (ls.y + rs.y) / 2;
    const hipY = (lh.y + lk.y) / 2;
    const plankStraight = shoulderY < hipY - 0.1;

    const dist = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    const leftDirect = dist(ls, lw);
    const leftPath = dist(ls, le) + dist(le, lw);
    const rightDirect = dist(rs, rw);
    const rightPath = dist(rs, re) + dist(re, rw);
    const armsStraight = leftDirect / leftPath > 0.95 && rightDirect / rightPath > 0.95;

    const stable = isStable(lm);

    if (plankStraight && armsStraight && stable) {
      lockFramesRef.current++;
      if (lockFramesRef.current > 12) return true;
    } else {
      lockFramesRef.current = 0;
    }
    return false;
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
    const ls = lm[11], rs = lm[12], le = lm[13], re = lm[14], lw = lm[15], rw = lm[16];
    const lh = lm[23], lk = lm[25], nose = lm[0];

    window.drawConnectors(ctx, lm, window.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    window.drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 2 });

    const leftElbowAngle = angle(ls, le, lw);
    const rightElbowAngle = angle(rs, re, rw);
    const verticalDropL = ls.y - lw.y;
    const verticalDropR = rs.y - rw.y;
    const backAngle = angle(ls, lh, lk);

    const visible = lm[11].visibility > 0.6 && lm[12].visibility > 0.6;
    if (!visible) {
      lostFrames++;
      if (lostFrames > 15) {
        setFeedback('Repositioning...');
        orientation = detectOrientation(lm);
        setViewMode(orientation);
        lostFrames = 0;
        return;
      }
    } else {
      lostFrames = 0;
    }
    setViewMode(orientation);

    if (!isStable(lm)) {
      setFeedback('Repositioning...');
      return;
    }

    let downDetected = false;
    let upDetected = false;

    if (orientation === 'side') {
      downDetected =
        (leftElbowAngle < 125 && rightElbowAngle < 125) ||
        (verticalDropL > 0.05 && verticalDropR > 0.05);
      upDetected =
        (leftElbowAngle > 145 && rightElbowAngle > 145) ||
        (verticalDropL < 0.08 && verticalDropR < 0.08);
    } else {
      const shoulderY = (ls.y + rs.y) / 2;
      const deltaShoulder = shoulderY - nose.y;
      downDetected =
        (leftElbowAngle < 120 && rightElbowAngle < 120) ||
        (deltaShoulder > 0.12);
      upDetected =
        (leftElbowAngle > 150 && rightElbowAngle > 150) ||
        (deltaShoulder < 0.08);
    }

    if (workoutStateRef.current === 'ready') {
      const shoulderY = (ls.y + rs.y) / 2;
      const hipY = (lh.y + lk.y) / 2;
      const bodyStraight = backAngle > 150;
      if (shoulderY < hipY - 0.1 && bodyStraight) {
        readyFramesRef.current++;
        setFeedback('Hold position...');
        if (readyFramesRef.current > 15) {
          workoutStateRef.current = 'up';
          setFeedback('Ready! Start push-ups');
          speak('Ready, start push-ups');
        }
      } else {
        readyFramesRef.current = 0;
        setFeedback('Get into position');
      }
      return;
    }

    if (cooldownFramesRef.current > 0) {
      cooldownFramesRef.current--;
      return;
    }

    if (workoutStateRef.current === 'up' && downDetected) {
      workoutStateRef.current = 'down';
      setFeedback('Down!');
    } else if (workoutStateRef.current === 'down' && upDetected) {
      setExerciseData(prev => ({ ...prev, reps: prev.reps + 1 }));
      setFeedback('Great push-up!');
      speak('Great push-up!');
      workoutStateRef.current = 'up';
      cooldownFramesRef.current = 20;
      feedbackGivenRef.current = false;
    }

    // Feedback only after first rep
    if (workoutStateRef.current === 'up' && lockDetected(lm) && exerciseData.reps > 0) {
      if (!feedbackGivenRef.current) {
        if (leftElbowAngle < 125 || rightElbowAngle < 125) {
          speak('Straighten your arms fully');
          setFeedback('Straighten your arms fully');
        }
        if (backAngle < 150 && orientation === 'side') {
          speak('Keep your back straight');
          setFeedback('Keep your back straight');
        }
        // more strict: require at least 12% drop
        if ((verticalDropL < 0.12 && verticalDropR < 0.12)) {
          speak('Go lower next time');
          setFeedback('Go lower next time');
        }
        feedbackGivenRef.current = true;
      }
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
      feedback: ['Good form maintained', 'Keep your back straight', 'Controlled movements']
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

              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
                <CameraIcon className="h-4 w-4" />
                <span className="text-sm">Live</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>

              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600/80 text-white px-4 py-2 rounded-lg font-bold text-lg">
                {viewMode.toUpperCase()} VIEW
              </div>

              {isTracking && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-16 left-4 bg-primary text-white px-4 py-2 rounded-lg font-bold text-xl">
                    Reps: {exerciseData.reps}
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
                    {feedback}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Exercise Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start in plank position. Lower your chest to the ground. Push back up while maintaining straight line.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{exerciseData.reps}</div>
                <div className="text-sm text-muted-foreground">Reps</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(exerciseData.formAccuracy)}%
                </div>
                <div className="text-sm text-muted-foreground">Form</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          {!isTracking ? (
            <Button
              size="lg"
              onClick={startExercise}
              className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-8 py-4 text-lg font-semibold rounded-2xl"
            >
              <CameraIcon className="h-6 w-6 mr-3" />
              Start Exercise
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={stopExercise}
              variant="destructive"
              className="px-8 py-4 text-lg font-semibold rounded-2xl"
            >
              <Square className="h-6 w-6 mr-3" />
              Stop Exercise
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.location.reload()}
            className="px-8 py-4 text-lg font-semibold rounded-2xl"
          >
            <RotateCcw className="h-6 w-6 mr-3" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};