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
  duration: number;
  feedback: string[];
}

interface PlankTrackerProps {
  onExerciseComplete: (data: ExerciseData) => void;
  onBack: () => void;
}

export const PlankTracker: React.FC<PlankTrackerProps> = ({
  onExerciseComplete,
  onBack
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [exerciseData, setExerciseData] = useState<ExerciseData>({
    duration: 0,
    feedback: []
  });
  const [feedback, setFeedback] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const { toast } = useToast();

  const workoutStateRef = useRef<'ready' | 'holding'>('ready');
  const cooldownFramesRef = useRef(0);

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

  // פונקציה לחישוב זווית בין 3 נקודות
  function angle(a: any, b: any, c: any) {
    const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const cb = { x: b.x - c.x, y: b.y - c.y, z: b.z - c.z };
    const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
    const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2 + ab.z ** 2);
    const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2 + cb.z ** 2);
    const cosine = dot / (magAB * magCB);
    return Math.acos(Math.min(Math.max(cosine, -1), 1)) * (180 / Math.PI);
  }

  // פונקציה לזיהוי יציבות בתנוחת פלנק
  function isStable(lm: any[]): boolean {
    // מדוד את הזווית בין הראש לכתפיים ולירך
    const head = lm[0], shoulderL = lm[11], shoulderR = lm[12], hipL = lm[23], hipR = lm[24];
    const shoulderAngle = angle(shoulderL, head, shoulderR);
    const hipAngle = angle(hipL, shoulderL, shoulderR);

    // אם הזוויות גדולות מדי (מעידות על עיקול גב), החזק את הפלנק לא יציב
    return shoulderAngle < 20 && hipAngle < 20;
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
    window.drawConnectors(ctx, lm, window.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    window.drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 2 });

    const isStableNow = isStable(lm);

    if (!isStableNow) {
      setFeedback('Adjust your position!');
    } else {
      setFeedback('Great plank! Keep holding!');
    }

    // אם יש יציבות, תן משוב טוב וחשב את זמן הפלנק
    if (isStableNow && workoutStateRef.current === 'ready') {
      workoutStateRef.current = 'holding';
      setFeedback('Plank started, keep holding!');
      speak('Plank started, keep holding!');
      setStartTime(Date.now());
    }

    if (workoutStateRef.current === 'holding') {
      const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      setExerciseData(prev => ({ ...prev, duration }));
    }
  }

  const startExercise = async () => {
    setIsTracking(true);
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
      feedback: ['Good plank posture maintained']
    };
    setExerciseData(finalData);
    toast({
      title: 'Exercise Complete!',
      description: `Great job! You held the plank for ${finalData.duration} seconds.`
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
          <h1 className="text-2xl font-bold text-center flex-1">Plank</h1>
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
                  <div className="absolute top-16 left-4 bg-primary text-white px-4 py-2 rounded-lg font-bold text-xl">
                    Time: {exerciseData.duration}s
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
                    {feedback}
                  </div>
                </div>
              )}
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
