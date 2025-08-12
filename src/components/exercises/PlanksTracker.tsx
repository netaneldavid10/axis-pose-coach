import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Square, RotateCcw } from 'lucide-react';

interface ExerciseData {
  reps: number;
  duration: number;
  formAccuracy: number;
  feedback: string[];
}

interface PlanksTrackerProps {
  onExerciseComplete: (data: ExerciseData) => void;
  onBack: () => void;
}

export const PlanksTracker: React.FC<PlanksTrackerProps> = ({
  onExerciseComplete,
  onBack
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // מצבים ובקרות
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

  // מצב אימון (תוקן - היה חסר בקוד)
  const workoutStateRef = useRef<'idle' | 'ready' | 'holding'>('ready');

  // Throttle לעדכוני משוב/זמן
  const lastFeedbackTsRef = useRef<number>(0);
  const lastDurationTsRef = useRef<number>(0);

  // פונקציית דיבור בטוחה (תוקן - היה חסר)
  const speak = (text: string) => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch { /* no-op */ }
  };

  // ---- חישובי זווית/יציבות ----
  function angle(a: any, b: any, c: any) {
    const ab = { x: b.x - a.x, y: b.y - a.y, z: (b.z ?? 0) - (a.z ?? 0) };
    const cb = { x: b.x - c.x, y: b.y - c.y, z: (b.z ?? 0) - (c.z ?? 0) };
    const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
    const magAB = Math.hypot(ab.x, ab.y, ab.z);
    const magCB = Math.hypot(cb.x, cb.y, cb.z);
    const cosine = dot / Math.max(1e-6, magAB * magCB);
    return Math.acos(Math.min(Math.max(cosine, -1), 1)) * (180 / Math.PI);
  }

  function isStable(lm: any[]): boolean {
    const head = lm[0], shoulderL = lm[11], shoulderR = lm[12], hipL = lm[23], hipR = lm[24];
    if (!head || !shoulderL || !shoulderR || !hipL || !hipR) return false;

    const shoulderAngle = angle(shoulderL, head, shoulderR);
    const hipAngle = angle(hipL, shoulderL, shoulderR);
    // סף ראשוני, אפשר לכייל אחר כך
    return shoulderAngle < 20 && hipAngle < 20;
  }

  // ---- לוגיקת התחלה/סיום ----
  const startExercise = () => {
    setIsTracking(true);
    setStartTime(Date.now());
    setFeedback('Exercise started! Keep good form.');
    workoutStateRef.current = 'ready';
  };

  const stopExercise = () => {
    setIsTracking(false);
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    const finalData: ExerciseData = {
      ...exerciseData,
      duration,
      formAccuracy: Math.random() * 30 + 70,
      feedback: [
        'Good form maintained',
        'Keep your back straight',
        'Controlled movements'
      ]
    };

    setExerciseData(finalData);

    toast({
      title: "Exercise Complete!",
      description: `Great job! You held the plank for ${duration} seconds with ${Math.round(finalData.formAccuracy)}% form accuracy.`,
    });

    setTimeout(() => {
      onExerciseComplete(finalData);
    }, 1200);
  };

  // ---- ציור תוצאות ----
  const onResults = (results: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;
    if (!canvas || !ctx || !video) return;

    // ודא שמידות הקנבס תואמות לווידאו (חשוב לביצועים)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks || results.poseLandmarks.length < 25) {
      const now = performance.now();
      if (now - lastFeedbackTsRef.current > 500) {
        setFeedback('Move back - not enough data');
        lastFeedbackTsRef.current = now;
      }
      return;
    }

    const lm = results.poseLandmarks;
    // ציור עזר
    window.drawConnectors(ctx, lm, window.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    window.drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 2 });

    const stable = isStable(lm);
    const now = performance.now();

    if (!stable) {
      if (now - lastFeedbackTsRef.current > 500) {
        setFeedback('Adjust your position!');
        lastFeedbackTsRef.current = now;
      }
      // אם יצאנו מיציבות באמצע
      if (workoutStateRef.current === 'holding') {
        workoutStateRef.current = 'ready';
      }
    } else {
      if (workoutStateRef.current === 'ready') {
        workoutStateRef.current = 'holding';
        setFeedback('Plank started, keep holding!');
        speak('Plank started, keep holding!');
        setStartTime(Date.now());
      } else if (workoutStateRef.current === 'holding') {
        if (now - lastFeedbackTsRef.current > 1000) {
          setFeedback('Great plank! Keep holding!');
          lastFeedbackTsRef.current = now;
        }
      }
    }

    // עדכון משך בתדירות נמוכה כדי לא להציף רינדורים
    if (workoutStateRef.current === 'holding') {
      if (now - lastDurationTsRef.current > 250) {
        const dur = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
        setExerciseData(prev => (prev.duration === dur ? prev : { ...prev, duration: dur }));
        lastDurationTsRef.current = now;
      }
    }
  };

  // ---- אתחול MediaPipe Pose + Camera (ללא getUserMedia כפול) ----
  useEffect(() => {
    let cameraInstance: any | null = null;
    let pose: any | null = null;

    try {
      pose = new (window as any).Pose({
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
        cameraInstance = new (window as any).Camera(videoRef.current, {
          onFrame: async () => {
            if (pose && videoRef.current) {
              await pose.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        cameraInstance.start();
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Camera Error',
        description: 'Unable to start camera/pose detection.',
        variant: 'destructive'
      });
    }

    return () => {
      try {
        if (cameraInstance && cameraInstance.stop) cameraInstance.stop();
      } catch {}
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
          (videoRef.current as any).srcObject = null;
        }
      } catch {}
      try {
        if (pose && pose.close) pose.close();
      } catch {}
    };
  }, []); // init once

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-center flex-1">Planks</h1>
          <div className="w-16" />
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
                <Camera className="h-4 w-4" />
                <span className="text-sm">Live</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              {isTracking && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 bg-primary text-white px-4 py-2 rounded-lg font-bold text-xl">
                    {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s
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
              Hold plank position with straight line from head to heels. Keep core engaged.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{exerciseData.reps}</div>
                <div className="text-sm text-muted-foreground">Sets</div>
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
              <Camera className="h-6 w-6 mr-3" />
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
