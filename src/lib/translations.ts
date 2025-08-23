export interface Translations {
  settings: {
    title: string;
    appearance: string;
    darkMode: string;
    darkModeDesc: string;
    languageRegion: string;
    language: string;
    languageDesc: string;
    audio: string;
    voiceVolume: string;
    voiceVolumeDesc: string;
    account: string;
    signOut: string;
  };
  auth: {
    welcome: string;
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    createAccount: string;
    adminAccess: string;
    verifyEmail: string;
    checkEmail: string;
    waitingVerification: string;
    resendCode: string;
    backToSignUp: string;
  };
  home: {
    welcome: string;
    welcomeBack: string;
    startWorkout: string;
    viewStats: string;
    profile: string;
    personalCoach: string;
    readyToCrush: string;
    daysLeft: string;
    toGo: string;
    workouts: string;
    calories: string;
    thisWeek: string;
    thisMonth: string;
    goalAchieved: string;
    almostThere: string;
    greatProgress: string;
    onRightTrack: string;
    letsGetStarted: string;
  };
  menu: {
    myProfile: string;
    statisticsDashboard: string;
    personalCoach: string;
    settings: string;
    signOut: string;
  };
  general: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    back: string;
  };
  statistics: {
    title: string;
    workouts: string;
    pushups: string;
    avgAccuracy: string;
    week: string;
    month: string;
    year: string;
    formAccuracy: string;
    pushupsCount: string;
  };
  exercises: {
    chooseExercise: string;
    back: string;
    all: string;
    legs: string;
    chest: string;
    core: string;
    fullBody: string;
    cardio: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    reps: string;
    noExercises: string;
    squatsDesc: string;
    pushupsDesc: string;
    planksDesc: string;
    lungesDesc: string;
    burpeesDesc: string;
    mountainClimbersDesc: string;
  };
  workoutModal: {
    title: string;
    description: string;
    singleExercise: string;
    singleExerciseDesc: string;
    workoutRoutine: string;
    workoutRoutineDesc: string;
    cancel: string;
  };
}

export const translations: Record<string, Translations> = {
  en: {
    settings: {
      title: "Settings",
      appearance: "Appearance",
      darkMode: "Dark Mode",
      darkModeDesc: "Toggle dark theme",
      languageRegion: "Language & Region",
      language: "Language",
      languageDesc: "Select your preferred language",
      audio: "Audio",
      voiceVolume: "Voice Feedback Volume",
      voiceVolumeDesc: "Adjust voice guidance volume",
      account: "Account",
      signOut: "Sign Out"
    },
    auth: {
      welcome: "Your AI-powered fitness companion",
      signIn: "Sign In",
      signUp: "Sign Up",
      email: "Email",
      password: "Password",
      firstName: "First Name",
      lastName: "Last Name",
      createAccount: "Create Account",
      adminAccess: "Admin Access",
      verifyEmail: "Verify Your Email",
      checkEmail: "Check Your Email",
      waitingVerification: "Waiting for email verification...",
      resendCode: "Resend Code",
      backToSignUp: "Back to Sign Up"
    },
    home: {
      welcome: "Welcome",
      welcomeBack: "Welcome back",
      startWorkout: "Start Workout",
      viewStats: "View Statistics",
      profile: "Profile",
      personalCoach: "Personal Coach",
      readyToCrush: "Ready to crush your fitness goals today?",
      daysLeft: "Days left",
      toGo: "to go",
      workouts: "workouts",
      calories: "calories",
      thisWeek: "this week",
      thisMonth: "this month",
      goalAchieved: "Goal achieved! 🎉",
      almostThere: "Almost there! Keep pushing!",
      greatProgress: "Great progress! Keep it up!",
      onRightTrack: "You're on the right track!",
      letsGetStarted: "Let's get started!"
    },
    menu: {
      myProfile: "My Profile",
      statisticsDashboard: "Statistics Dashboard",
      personalCoach: "Personal Coach",
      settings: "Settings",
      signOut: "Sign Out"
    },
    general: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      back: "Back"
    },
    statistics: {
      title: "Statistics Dashboard",
      workouts: "Workouts",
      pushups: "Pushups",
      avgAccuracy: "Avg Accuracy",
      week: "Week",
      month: "Month",
      year: "Year",
      formAccuracy: "Form Accuracy Over Time",
      pushupsCount: "Pushups Count"
    },
    workoutModal: {
      title: "Choose Workout Type",
      description: "How would you like to train today?",
      singleExercise: "Single Exercise",
      singleExerciseDesc: "Focus on one exercise with AI form tracking",
      workoutRoutine: "Workout Routine", 
      workoutRoutineDesc: "Complete a sequence of exercises",
      cancel: "Cancel"
    },
    exercises: {
      chooseExercise: "Choose Exercise",
      back: "Back",
      all: "All",
      legs: "Legs",
      chest: "Chest",
      core: "Core",
      fullBody: "Full Body",
      cardio: "Cardio",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      reps: "reps",
      noExercises: "No exercises found in this category.",
      squatsDesc: "Lower body compound movement targeting quads, glutes, and hamstrings",
      pushupsDesc: "Upper body exercise targeting chest, shoulders, and triceps",
      planksDesc: "Isometric core exercise for stability and strength",
      lungesDesc: "Single-leg movement for balance and leg strength",
      burpeesDesc: "High-intensity full-body exercise combining squat, plank, and jump",
      mountainClimbersDesc: "Dynamic cardio exercise targeting core and cardiovascular system"
    }
  },
  he: {
    settings: {
      title: "הגדרות",
      appearance: "מראה",
      darkMode: "מצב כהה",
      darkModeDesc: "החלף לערכת נושא כהה",
      languageRegion: "שפה ואזור",
      language: "שפה",
      languageDesc: "בחר את השפה המועדפת עליך",
      audio: "שמע",
      voiceVolume: "עוצמת משוב קולי",
      voiceVolumeDesc: "התאם את עוצמת ההדרכה הקולית",
      account: "חשבון",
      signOut: "התנתק"
    },
    auth: {
      welcome: "המלווה הכושר המופעל בינה מלאכותית שלך",
      signIn: "התחבר",
      signUp: "הירשם",
      email: "דואר אלקטרוני",
      password: "סיסמה",
      firstName: "שם פרטי",
      lastName: "שם משפחה",
      createAccount: "צור חשבון",
      adminAccess: "גישת מנהל",
      verifyEmail: "אמת את הדואר האלקטרוני שלך",
      checkEmail: "בדוק את הדואר האלקטרוני שלך",
      waitingVerification: "ממתין לאימות דואר אלקטרוני...",
      resendCode: "שלח קוד מחדש",
      backToSignUp: "חזור להרשמה"
    },
    home: {
      welcome: "ברוך הבא",
      welcomeBack: "ברוך שובך",
      startWorkout: "התחל אימון",
      viewStats: "הצג סטטיסטיקות",
      profile: "פרופיל",
      personalCoach: "מאמן אישי",
      readyToCrush: "מוכן לכבוש את יעדי הכושר שלך היום?",
      daysLeft: "ימים נותרו",
      toGo: "נותרים",
      workouts: "אימונים",
      calories: "קלוריות נותרו",
      thisWeek: "השבוע",
      thisMonth: "החודש",
      goalAchieved: "היעד הושג! 🎉",
      almostThere: "כמעט שם! המשך לדחוף!",
      greatProgress: "התקדמות נהדרת! תמשיך כך!",
      onRightTrack: "אתה בדרך הנכונה!",
      letsGetStarted: "בואו נתחיל!"
    },
    menu: {
      myProfile: "הפרופיל שלי",
      statisticsDashboard: "לוח סטטיסטיקות",
      personalCoach: "מאמן אישי",
      settings: "הגדרות",
      signOut: "התנתק"
    },
    general: {
      loading: "טוען...",
      error: "שגיאה",
      success: "הצלחה",
      cancel: "בטל",
      save: "שמור",
      back: "חזור"
    },
    statistics: {
      title: "לוח סטטיסטיקות",
      workouts: "אימונים",
      pushups: "שכיבות סמיכה",
      avgAccuracy: "דיוק ממוצע",
      week: "שבוע",
      month: "חודש",
      year: "שנה",
      formAccuracy: "דיוק תנוחה לאורך זמן",
      pushupsCount: "מספר שכיבות סמיכה"
    },
    workoutModal: {
      title: "בחר סוג אימון",
      description: "איך היית רוצה להתאמן היום?",
      singleExercise: "תרגיל בודד",
      singleExerciseDesc: "התמקד בתרגיל אחד עם מעקב AI אחר הטכניקה",
      workoutRoutine: "שגרת אימון",
      workoutRoutineDesc: "השלם רצף של תרגילים",
      cancel: "בטל"
    },
    exercises: {
      chooseExercise: "בחר תרגיל",
      back: "חזור",
      all: "הכל",
      legs: "רגליים",
      chest: "חזה",
      core: "ליבה",
      fullBody: "גוף מלא",
      cardio: "קרדיו",
      beginner: "מתחיל",
      intermediate: "בינוני",
      advanced: "מתקדם",
      reps: "חזרות",
      noExercises: "לא נמצאו תרגילים בקטגוריה זו.",
      squatsDesc: "תנועה מורכבת לגוף תחתון המכווינת לארבעת ראש, עכוז ושרירי הירך האחוריים",
      pushupsDesc: "תרגיל לגוף עליון המכוון לחזה, כתפיים ושלושת ראש",
      planksDesc: "תרגיל ליבה איזומטרי ליציבות וכוח",
      lungesDesc: "תנועה על רגל אחת לאיזון וכוח ברגליים",
      burpeesDesc: "תרגיל גוף מלא בעצימות גבוהה המשלב כפיפה, פלאנק וקפיצה",
      mountainClimbersDesc: "תרגיל קרדיו דינמי המכוון לליבה ולמערכת הלב וכלי הדם"
    }
  }
};

export const getTranslation = (language: string): Translations => {
  return translations[language] || translations.en;
};