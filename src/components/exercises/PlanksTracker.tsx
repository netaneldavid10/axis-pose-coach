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

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

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
    const head = lm[0], shoulderL = lm[11], shoulderR = lm[12], hipL = lm[23], hipR = lm[24];
    const shoulderAngle = angle(shoulderL, head, shoulderR);
    const hipAngle = angle(hipL, shoulderL, shoulderR);

    return shoulderAngle < 20 && hipAngle < 20;
  }

  const startExercise = () => {
    setIsTracking(true);
    setStartTime(Date.now());
    setFeedback('Exercise started! Keep good form.');
    
    // Simulate exercise tracking
    simulateExerciseTracking();
  };

  const stopExercise = () => {
    setIsTracking(false);
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    
    const finalData: ExerciseData = {
      ...exerciseData,
      duration,
      formAccuracy: Math.random() * 30 + 70, // Simulate 70-100% accuracy
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
    }, 2000);
  };

  const simulateExerciseTracking = () => {
    const interval = setInterval(() => {
      if (!isTracking) {
        clearInterval(interval);
        return;
      }

      // Simulate feedback for plank hold
      const feedbackMessages = [
        'Hold steady!',
        'Keep core engaged!',
        'Great form!',
        'Stay strong!',
        'Perfect!',
      ];
      
      setFeedback(feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]);

      // Auto-stop after 60 seconds for demo
      if (startTime && (Date.now() - startTime) >= 60000) {
        clearInterval(interval);
        stopExercise();
      }
    }, 3000); // Update feedback every 3 seconds
  };

  const onResults = (results: any) => {
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
  };

  useEffect(() => {
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

    return () => {
      // Cleanup the camera when the component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
