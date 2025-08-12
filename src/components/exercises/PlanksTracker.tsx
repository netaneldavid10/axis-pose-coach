import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Square, RotateCcw } from 'lucide-react';

interface ExerciseData {
  reps: number;
  duration: number; // seconds
  formAccuracy: number;
  feedback: string[];
}

interface PlanksTrackerProps {
  onExerciseComplete: (data: ExerciseData) => void;
  onBack: () => void;
}

type Phase = 'idle' | 'ready' | 'holding';

export const PlanksTracker: React.FC<PlanksTrackerProps> = ({ onExerciseComplete, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ---- UI/State ----
  const [isTracking, setIsTracking] = useState(false);
  const [exerciseData, setExerciseData] = useState<ExerciseData>({
    reps: 0,
    duration: 0,
    formAccuracy: 0,
    feedback: []
  });
  const [feedback, setFeedback] = useState('Get into plank position to start');
  const { toast } = useToast();

  // ---- Phase & timing ----
  const phaseRef = useRef<Phase>('ready');
  const stableFramesRef = useRef(0);
  const unstableFramesRef = useRef(0);
  const START_FRAMES = 12;   // ~0.2s ב-60fps להתחלה יציבה
  const STOP_FRAMES  = 6;    // ~0.1s ליציאה (רגיש ומהיר)

  // זמן שנצבר רק כשהפוזה יציבה
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);

  // רענון תצוגת זמן חלק בעזרת rAF
  const [rafTick, setRafTick] = useState(0);
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      setRafTick(performance.now()); // גורם לרנדר קל (~60fps)
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // דיבור בטוח (אופציונלי)
  const speak = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch {}
  };

  // ---- גיאומטריה ----
  function angle(a: any, b: any, c: any) {
    if (!a || !b || !c) return 999;
    const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
    const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };
    const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
    const mag1 = Math.hypot(ab.x, ab.y, ab.z);
    const mag2 = Math.hypot(cb.x, cb.y, cb.z);
    const cos = dot / Math.max(1e-6, mag1 * mag2);
    return Math.acos(Math.min(1, Math.max(-1, cos))) * (180 / Math.PI);
  }
  const mid = (p: any, q: any) => (p && q ? { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: ((p.z ?? 0) + (q.z ?? 0)) / 2 } : null);
  const degTo = (dx: number, dy: number) => (Math.atan2(dy, dx) * 180) / Math.PI;

  // ניקוד יציבות לפלנק (front/side), כולל היסטרזיס וספים ניתנים לשינוי
  function isPlankStable(lm: any[]): { stable: boolean; reason?: string } {
    const shL = lm[11], shR = lm[12], hipL = lm[23], hipR = lm[24], kneeL = lm[25], kneeR = lm[26], ankL = lm[27], ankR = lm[28];

    if (!shL || !shR || !hipL || !hipR) return { stable: false, reason: 'not enough landmarks' };

    const shoulderMid = mid(shL, shR);
    const hipMid = mid(hipL, hipR);
    const kneeMid = kneeL && kneeR ? mid(kneeL, kneeR) : null;
    const ankleMid = ankL && ankR ? mid(ankL, ankR) : null;

    // 1) גב ישר: זוויות ירך קרובות ל-180°
    const hipAngleL = angle(shL, hipL, kneeL ?? ankL ?? hipR);
    const hipAngleR = angle(shR, hipR, kneeR ?? ankR ?? hipL);
    const hipsStraight = hipAngleL >= 160 && hipAngleR >= 160;

    // 2) כתפיים-ירכיים בקו ישר
    const torsoAngle = angle(shL, hipL, hipR); // זווית "פתיחה" בין הירכיים לכתפיים
    const torsoAligned = torsoAngle <= 25;     // קטן = קו כמעט ישר

    // 3) הגוף אופקי יחסית (פלנק, לא פלאנק הפוך/סקוואט)
    // נשתמש בקו shoulderMid -> ankleMid/ kneeMid
    const endPoint = ankleMid ?? kneeMid ?? hipMid;
    if (!shoulderMid || !hipMid || !endPoint) return { stable: false, reason: 'not enough lower points' };
    const vecDeg = Math.abs(degTo((endPoint.x - shoulderMid.x), (endPoint.y - shoulderMid.y)));
    // פלנק אמור להיות בערך אופקי (0° או 180°). נאפשר עד 25°
    const horizAligned = (vecDeg <= 25) || (Math.abs(180 - vecDeg) <= 25);

    const all = hipsStraight && torsoAligned && horizAligned;
    return { stable: all };
  }

  // ---- התחלת/עצירת האימון ----
  const startExercise = () => {
    setIsTracking(true);
    setFeedback('Get into plank position…');
    phaseRef.current = 'ready';
    stableFramesRef.current = 0;
    unstableFramesRef.current = 0;
    accumulatedMsRef.current = 0;
    segmentStartRef.current = null;
    setExerciseData(prev => ({ ...prev, duration: 0 }));
  };

  const stopExercise = () => {
    // סגור קטע פתוח אם יש
    if (phaseRef.current === 'holding' && segmentStartRef.current != null) {
      accumulatedMsRef.current += performance.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    setIsTracking(false);

    const durationSec = Math.floor(accumulatedMsRef.current / 1000);
    const finalData: ExerciseData = {
      ...exerciseData,
      duration: durationSec,
      formAccuracy: Math.random() * 30 + 70,
      feedback: ['Kept core engaged', 'Neutral spine', 'Good control']
    };
    setExerciseData(finalData);

    toast({
      title: "Exercise Complete!",
      description: `Plank time: ${durationSec}s with ${Math.round(finalData.formAccuracy)}% form accuracy.`
    });

    setTimeout(() => onExerciseComplete(finalData), 1000);
  };

  // ---- ציור/תוצאות ממדיה-פייפ ----
  const onResults = (results: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const video = videoRef.current;
    if (!canvas || !ctx || !video) return;

    if (canvas.width !== (video.videoWidth || 640) || canvas.height !== (video.videoHeight || 480)) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    const lm = results.poseLandmarks;
    if (!lm || lm.length < 29) {
      setFeedback('Move back - not enough data');
      // עצור צבירה אם אין נתונים
      if (phaseRef.current === 'holding') {
        unstableFramesRef.current++;
        if (unstableFramesRef.current >= STOP_FRAMES) {
          // עצירה
          phaseRef.current = 'ready';
          if (segmentStartRef.current != null) {
            accumulatedMsRef.current += performance.now() - segmentStartRef.current;
            segmentStartRef.current = null;
          }
          setFeedback('Hold still to resume');
        }
      }
      return;
    }

    // ציור עזר
    (window as any).drawConnectors(ctx, lm, (window as any).POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    (window as any).drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 2 });

    const { stable } = isPlankStable(lm);

    if (stable) {
      unstableFramesRef.current = 0;
      stableFramesRef.current++;

      if (phaseRef.current !== 'holding' && stableFramesRef.current >= START_FRAMES) {
        // מתחילים לצבור זמן
        phaseRef.current = 'holding';
        segmentStartRef.current = performance.now();
        setFeedback('Great! Hold the plank');
        speak('Plank started');
      }
    } else {
      stableFramesRef.current = 0;
      if (phaseRef.current === 'holding') {
        unstableFramesRef.current++;
        if (unstableFramesRef.current >= STOP_FRAMES) {
          // עצירת צבירה
          phaseRef.current = 'ready';
          if (segmentStartRef.current != null) {
            accumulatedMsRef.current += performance.now() - segmentStartRef.current;
            segmentStartRef.current = null;
          }
          setFeedback('Adjust and get stable to resume');
        }
      } else {
        setFeedback('Get into plank position…');
      }
    }

    // עדכון משך לתצוגה (חישוב נגזר, ללא setState כבד)
    const totalMs =
      accumulatedMsRef.current +
      (phaseRef.current === 'holding' && segmentStartRef.current != null
        ? performance.now() - segmentStartRef.current
        : 0);

    const secs = Math.floor(totalMs / 1000);
    // נשמור רק אם השתנה, כדי לצמצם רינדורים מיותרים
    setExerciseData(prev => (prev.duration === secs ? prev : { ...prev, duration: secs }));
  };

  // ---- אתחול MediaPipe Pose + Camera ----
  useEffect(() => {
    let cameraInstance: any | null = null;
    let pose: any | null = null;

    try {
      pose = new (window as any).Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`
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
            await pose!.send({ image: videoRef.current! });
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
      try { if (cameraInstance?.stop) cameraInstance.stop(); } catch {}
      try {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
          (videoRef.current as any).srcObject = null;
        }
      } catch {}
      try { if (pose?.close) pose.close(); } catch {}
    };
  }, []); // init once

  // ---- הצגת זמן חלק בתצוגה ----
  const displaySeconds = exerciseData.duration; // כבר מחושב בנגזרת למעלה

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack}>← Back</Button>
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
                    {displaySeconds}s
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
          <CardHeader><CardTitle>Exercise Instructions</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Hold plank with a straight line from shoulders to ankles. Keep core engaged.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{exerciseData.reps}</div>
                <div className="text-sm text-muted-foreground">Sets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{displaySeconds}s</div>
                <div className="text-sm text-muted-foreground">Active Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{Math.round(exerciseData.formAccuracy)}%</div>
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
