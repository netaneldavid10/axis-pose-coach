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

              {/* Camera indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
                <CameraIcon className="h-4 w-4" />
                <span className="text-sm">Live</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>

              {/* View mode overlay */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600/80 text-white px-4 py-2 rounded-lg font-bold text-lg">
                {viewMode.toUpperCase()} VIEW
              </div>

              {/* Exercise overlay */}
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

    // --- PAUSE LOGIC ---
    const baseline = lockBaselineRef.current;
    if (baseline) {
      const currentShoulderY = (ls.y + rs.y) / 2;
      if (currentShoulderY < baseline.shoulderY - 0.02 && !pausedRef.current) {
        pausedRef.current = true;
        setFeedback("Hold steady...");
        speak("Hold steady...");
      }
    }
    if (pausedRef.current) {
      if (lockDetected(lm)) {
        pausedRef.current = false;
        lockBaselineRef.current = {
          shoulderY: (ls.y + rs.y) / 2,
          wristY: (lw.y + rw.y) / 2,
          backAngle: backAngle
        };
        setFeedback("Ready again! Continue push-ups");
        speak("Ready again! Continue push-ups");
      }
      return;
    }

    // Orientation detection
    const visible = lm[11].visibility > 0.6 && lm[12].visibility > 0.6;
    if (!visible) {
      lostFrames++;
      if (lostFrames > 15) {
        setFeedback('Repositioning...');
        orientation = detectOrientation(lm);
        setViewMode(orientation);
        lockBaselineRef.current = null;
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

    // Ready phase
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

          if (!lockBaselineRef.current) {
            lockBaselineRef.current = {
              shoulderY: (ls.y + rs.y) / 2,
              wristY: (lw.y + rw.y) / 2,
              backAngle: backAngle
            };
          }
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
    // FSM transitions
    if (workoutStateRef.current === 'up' && downDetected) {
      workoutStateRef.current = 'down';
      setFeedback('Down!');
    } else if (workoutStateRef.current === 'down' && upDetected) {
      let deductions = 0;
      let feedbackMsg = 'Great push-up!';

      if (baseline) {
        const currentShoulderY = (ls.y + rs.y) / 2;
        const dropRatio = (baseline.shoulderY - currentShoulderY) / (baseline.shoulderY - baseline.wristY);

        if (dropRatio < 0.45) {
          feedbackMsg = 'Go lower next time';
          deductions++;
        }

        const currentBackAngle = backAngle;
        const backDeviation = Math.abs(currentBackAngle - (baseline.backAngle || 180));
        if (backDeviation > 15) {
          feedbackMsg = 'Keep your back straight';
          deductions++;
        }
      }

      setExerciseData(prev => {
        const newReps = prev.reps + 1;
        const accuracy = Math.max(0, 100 - deductions * 2.3);
        return { ...prev, reps: newReps, formAccuracy: accuracy };
      });

      setFeedback(feedbackMsg);
      speak(feedbackMsg);

      workoutStateRef.current = 'up';
      cooldownFramesRef.current = 20;
      feedbackGivenRef.current = false;

      lockBaselineRef.current = {
        shoulderY: (ls.y + rs.y) / 2,
        wristY: (lw.y + rw.y) / 2,
        backAngle: backAngle
      };
    }

    if (workoutStateRef.current === 'up' && exerciseData.reps > 0) {
      if (!feedbackGivenRef.current) {
        if (leftElbowAngle < 125 || rightElbowAngle < 125) {
          speak('Straighten your arms fully');
          setFeedback('Straighten your arms fully');
        }
        if (backAngle < 150 && orientation === 'side') {
          speak('Keep your back straight');
          setFeedback('Keep your back straight');
        }
        feedbackGivenRef.current = true;

        lockBaselineRef.current = {
          shoulderY: (ls.y + rs.y) / 2,
          wristY: (lw.y + rw.y) / 2,
          backAngle: backAngle
        };
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
      formAccuracy: exerciseData.formAccuracy,
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

              {/* Camera indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
                <CameraIcon className="h-4 w-4" />
                <span className="text-sm">Live</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>

              {/* View mode overlay */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600/80 text-white px-4 py-2 rounded-lg font-bold text-lg">
                {viewMode.toUpperCase()} VIEW
              </div>

              {/* Exercise overlay */}
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
            <CardTitle
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
