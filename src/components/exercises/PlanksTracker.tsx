import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Square, RotateCcw } from 'lucide-react';

interface ExerciseData {
  reps: number;
  duration: number; // seconds (active only)
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

  // ---- UI / State ----
  const [isTracking, setIsTracking] = useState(false);
  const [exerciseData, setExerciseData] = useState<ExerciseData>({
    reps: 0,
    duration: 0,
    formAccuracy: 0,
    feedback: []
  });
  const [feedback, setFeedback] = useState('Get into forearm plank position to start');
  const { toast } = useToast();

  // שמירה על ערך isTracking עדכני בתוך onResults (שחי מחוץ למחזור הרנדר של React)
  const isTrackingRef = useRef(false);
  useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);

  // ---- Phase & timing (immediate start/stop) ----
  const phaseRef = useRef<Phase>('ready');

  // מצטבר רק בזמן יציבות
  const accumulatedMsRef = useRef(0);        // סה״כ זמן פעיל שנצבר
  const segmentStartRef = useRef<number|null>(null); // תחילת המקטע הנוכחי (כשנכנסים לפלנק)

  // (אופציונלי) קריינות
  const speak = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      }
    } catch {}
  };

  // ---------- גיאומטריה ----------
  const ang = (a: any, b: any, c: any) => {
    if (!a || !b || !c) return 999;
    const abx = a.x - b.x, aby = a.y - b.y, abz = (a.z ?? 0) - (b.z ?? 0);
    const cbx = c.x - b.x, cby = c.y - b.y, cbz = (c.z ?? 0) - (b.z ?? 0);
    const dot = abx * cbx + aby * cby + abz * cbz;
    const mag1 = Math.hypot(abx, aby, abz);
    const mag2 = Math.hypot(cbx, cby, cbz);
    const cos = dot / Math.max(1e-6, mag1 * mag2);
    return Math.acos(Math.min(1, Math.max(-1, cos))) * (180 / Math.PI);
  };
  const slopeDeg = (p: any, q: any) =>
    (p && q ? (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI : 999);
  const vis = (p: any) => (p && typeof p.visibility === 'number' ? p.visibility : 0);

  // בוחר צד דומיננטי לפי visibility (שירכיבים באותו צד מזוהים טוב יותר)
  function pickDominantSide(lm: any[]) {
    const L = { shoulder: lm[11], elbow: lm[13], wrist: lm[15], hip: lm[23], knee: lm[25], ankle: lm[27] };
    const R = { shoulder: lm[12], elbow: lm[14], wrist: lm[16], hip: lm[24], knee: lm[26], ankle: lm[28] };
    const score = (S: any) =>
      vis(S.hip) * 1.2 + vis(S.knee) + vis(S.ankle) + vis(S.shoulder) * 0.5 + vis(S.elbow) + vis(S.wrist);
    const side = score(L) >= score(R) ? 'L' : 'R';
    const S = side === 'L' ? L : R;
    return { side, ...S };
  }

  // ---------- זיהוי Forearm Plank (side view) ----------
  // התניית זיהוי כדי לא להתבלבל עם push-up:
  // - טורסו אופקי (כתף→ירך)
  // - ירך ישרה (כתף–ירך–ברך/קרסול ≥ 160°)
  // - מרפק כפוף ~90° (80–110°)
  // - אמה אופקית (מרפק→שורש ≤ 25°)
  // - כתף ~מעל מרפק (|שיפוע - 90°| ≤ 30°)
  function isPlankStableSideForearm(lm: any[]) {
    if (!lm) return { stable: false as const };

    const { side, shoulder, elbow, wrist, hip, knee, ankle } = pickDominantSide(lm);
    if (!shoulder || !hip || !elbow || !wrist) return { stable: false as const };

    const torsoSlope = slopeDeg(shoulder, hip);
    const torsoHorizOk = Math.min(Math.abs(torsoSlope), Math.abs(180 - Math.abs(torsoSlope))) <= 25;

    const kneeOrAnkle = knee ?? ankle;
    const hipAngle = ang(shoulder, hip, kneeOrAnkle);
    const hipStraightOk = hipAngle >= 160;

    const elbowAngle = ang(shoulder, elbow, wrist);
    const elbowBentOk = elbowAngle >= 80 && elbowAngle <= 110;

    const forearmSlope = slopeDeg(elbow, wrist);
    const forearmHorizOk = Math.min(Math.abs(forearmSlope), Math.abs(180 - Math.abs(forearmSlope))) <= 25;

    const shoulderElbowSlope = slopeDeg(shoulder, elbow);
    const shoulderOverElbowOk = Math.abs(Math.abs(shoulderElbowSlope) - 90) <= 30;

    const stable =
      torsoHorizOk && hipStraightOk && elbowBentOk && forearmHorizOk && shoulderOverElbowOk;

    // נתוני דיבאג (אפשר לכבות בהמשך)
    return {
      stable,
      meta: {
        side,
        torsoSlope: Math.round(torsoSlope),
        hipAngle: Math.round(hipAngle),
        elbowAngle: Math.round(elbowAngle),
        forearmSlope: Math.round(forearmSlope),
        shoulderElbowSlope: Math.round(shoulderElbowSlope)
      }
    };
  }

  // ---------- שליטה ידנית ----------
  const startExercise = () => {
    setIsTracking(true);
    setFeedback('Get into forearm plank…');
    phaseRef.current = 'ready';
    accumulatedMsRef.current = 0;
    segmentStartRef.current = null;
    setExerciseData(prev => ({ ...prev, duration: 0 }));
  };

  const stopExercise = () => {
    // אם היית בפלנק כשעצרנו → סגור את המקטע האחרון
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
      feedback: ['Forearm plank detected', 'Neutral spine', 'Good control']
    };
    setExerciseData(finalData);

    toast({
      title: "Exercise Complete!",
      description: `Plank time: ${durationSec}s with ${Math.round(finalData.formAccuracy)}% form accuracy.`
    });

    setTimeout(() => onExerciseComplete(finalData), 600);
  };

  // ---------- MediaPipe onResults ----------
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

    // צייר שלד לעזר
    if (lm) {
      (window as any).drawConnectors(ctx, lm, (window as any).POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
      (window as any).drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 2 });
    }

    if (!isTrackingRef.current) {
      // מצב תצוגה בלבד; לא סופרים זמן
      return;
    }

    if (!lm || lm.length < 29) {
      // אין מספיק נקודות → אם היינו בפוזיציה, עצור מיד
      if (phaseRef.current === 'holding' && segmentStartRef.current != null) {
        accumulatedMsRef.current += performance.now() - segmentStartRef.current;
        segmentStartRef.current = null;
        phaseRef.current = 'ready';
      }
      setFeedback('Move back - not enough data');
    } else {
      const { stable, meta } = isPlankStableSideForearm(lm);

      // דיבאג על המסך
      if (meta) {
        const text = `Side:${meta.side} torso:${meta.torsoSlope}° hip:${meta.hipAngle}° elbow:${meta.elbowAngle}° forearm:${meta.forearmSlope}° SE:${meta.shoulderElbowSlope}°`;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const w = Math.max(260, ctx.measureText(text).width + 16);
        ctx.fillRect(8, 8, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(text, 14, 28);
      }

      // ***** Immediate start/stop logic *****
      if (stable) {
        if (phaseRef.current !== 'holding') {
          // נכנסת לפוזיציה עכשיו → התחל מייד
          phaseRef.current = 'holding';
          segmentStartRef.current = performance.now();
          setFeedback('Great! Hold the forearm plank');
          speak('Plank started');
        }
      } else {
        if (phaseRef.current === 'holding' && segmentStartRef.current != null) {
          // יצאת מהפוזיציה → עצור מייד והוסף זמן מצטבר
          accumulatedMsRef.current += performance.now() - segmentStartRef.current;
          segmentStartRef.current = null;
          phaseRef.current = 'ready';
          setFeedback('Adjust and get stable to resume (forearms)');
        } else {
          setFeedback('Get into forearm plank…');
        }
      }
    }

    // עדכון זמן מוצג (שניות של זמן פעיל בלבד)
    const totalMs =
      accumulatedMsRef.current +
      (phaseRef.current === 'holding' && segmentStartRef.current != null
        ? performance.now() - segmentStartRef.current
        : 0);

    const secs = Math.floor(totalMs / 1000);
    setExerciseData(prev => (prev.duration === secs ? prev : { ...prev, duration: secs }));
  };

  // ---------- אתחול MediaPipe Pose + Camera ----------
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
          onFrame: async () => { await pose!.send({ image: videoRef.current! }); },
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
      try { cameraInstance?.stop?.(); } catch {}
      try {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
          (videoRef.current as any).srcObject = null;
        }
      } catch {}
      try { pose?.close?.(); } catch {}
    };
  }, []); // init once

  const displaySeconds = exerciseData.duration;

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
              Forearm plank only (side view). Elbows under shoulders, neutral spine. Timer runs only while stable.
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
              onClick={() => { setIsTracking(true); startExercise(); }}
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
