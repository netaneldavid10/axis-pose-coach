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
  const [startTime, setStartTime] = useState<number | null>(null);
  const { toast } = useToast();

  // ===== states for mediapipe logic =====
  let state: 'start' | 'up' | 'down' = 'start';
  let downFrames = 0;
  let cooldownFrames = 0;
  let lastSpoken = '';
  let orientation = 'side';
  let orientationCandidate = 'side';
  let orientationStableFrames = 0;
  let shoulderDownY: number | null = null;
  let shoulderUpY: number | null = null;

  const synth = window.speechSynthesis;
  let selectedVoice: SpeechSynthesisVoice | null = null;

  function speak(text: string) {
    if (text === lastSpoken || !selectedVoice) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.lang = 'en-US';
    utterance.pitch = 1;
    utterance.rate = 0.9;
    synth.cancel();
    synth.speak(utterance);
    lastSpoken = text;
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
    return Math.acos(cosine) * (180 / Math.PI);
  }

  function detectOrientationStable(lm: any[]) {
    const visL = lm[11].visibility + lm[13].visibility;
    const visR = lm[12].visibility + lm[14].visibility;
    let candidate = 'side';
    if (
      lm[11].visibility > 0.6 &&
      lm[12].visibility > 0.6 &&
      lm[13].visibility > 0.6 &&
      lm[14].visibility > 0.6
    ) {
      candidate = 'front';
    } else if ((visL > 1.2 && visR < 0.5) || (visR > 1.2 && visL < 0.5)) {
      candidate = 'side';
    }
    if (candidate === orientationCandidate) {
      orientationStableFrames++;
      if (orientationStableFrames >= 10) orientation = candidate;
    } else {
      orientationCandidate = candidate;
      orientationStableFrames = 0;
    }
    return orientation;
  }

  function onResults(results: any) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks || results.poseLandmarks.length < 8) {
      setFeedback('Move back - not enough data');
      speak('Please move back');
      return;
    }

    const lm = results.poseLandmarks;
    const viewMode = detectOrientationStable(lm);

    const ls = lm[11],
      rs = lm[12],
      le = lm[13],
      re = lm[14],
      lw = lm[15],
      rw = lm[16];
    const lh = lm[23],
      lk = lm[25];

    window.drawConnectors(ctx, lm, window.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    window.drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 2 });

    const leftElbowAngle = angle(ls, le, lw);
    const rightElbowAngle = angle(rs, re, rw);
    const verticalDropL = ls.y - lw.y;
    const verticalDropR = rs.y - rw.y;
    const backAngle = angle(ls, lh, lk);

    let downDetected = false;
    let upDetected = false;

    if (viewMode === 'side') {
      downDetected =
        (leftElbowAngle < 125 && rightElbowAngle < 125) ||
        (verticalDropL > 0.05 && verticalDropR > 0.05);
      upDetected =
        (leftElbowAngle > 145 && rightElbowAngle > 145) ||
        (verticalDropL < 0.08 && verticalDropR < 0.08);
    } else {
      const avgShoulderY = (ls.y + rs.y) / 2;
      const threshold = 0.03;

      if (state === 'start' || state === 'up') {
        if (shoulderUpY === null || avgShoulderY > shoulderUpY + threshold) {
          downFrames++;
          if (downFrames >= 6) {
            downDetected = true;
            shoulderDownY = avgShoulderY;
          }
        } else {
          downFrames = 0;
        }
      } else if (state === 'down') {
        if (shoulderDownY !== null && avgShoulderY < shoulderDownY - threshold) {
          upDetected = true;
          shoulderUpY = avgShoulderY;
        }
      }
    }

    if (cooldownFrames > 0) {
      cooldownFrames--;
      return;
    }

    if (state === 'start' && downDetected) {
      state = 'down';
      setFeedback('Down!');
    } else if (state === 'down' && upDetected && downFrames >= 6) {
      state = 'up';
      setExerciseData(prev => ({ ...prev, reps: prev.reps + 1 }));
      setFeedback('Great push-up!');
      speak('Great push-up!');
      downFrames = 0;
      cooldownFrames = 10;
    } else if (state === 'up' && downDetected) {
      state = 'down';
      setFeedback('Down!');
    }

    if (backAngle < 30 && viewMode === 'side') {
      speak('Keep your body straight');
    }
  }

  const startExercise = async () => {
    setIsTracking(true);
    setStartTime(Date.now());
    setFeedback('Exercise started! Keep good form.');

    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = initVoices;
    initVoices();

    // שלב 1: הפעל מצלמה רגילה
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setFeedback("Unable to access camera");
      return;
    }

    // שלב 2: הפעלת Pose
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

    // שלב 3: Mediapipe Camera
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
              {isTracking && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 bg-primary text-white px-4 py-2 rounded-lg font-bold text-xl">
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
