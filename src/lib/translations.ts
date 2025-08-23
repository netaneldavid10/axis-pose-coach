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
      calories: "קלוריות",
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
    }
  }
};

export const getTranslation = (language: string): Translations => {
  return translations[language] || translations.en;
};