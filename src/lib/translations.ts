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
    startWorkout: string;
    viewStats: string;
    profile: string;
    personalCoach: string;
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
      startWorkout: "Start Workout",
      viewStats: "View Statistics",
      profile: "Profile",
      personalCoach: "Personal Coach"
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
      startWorkout: "התחל אימון",
      viewStats: "הצג סטטיסטיקות",
      profile: "פרופיל",
      personalCoach: "מאמן אישי"
    }
  }
};

export const getTranslation = (language: string): Translations => {
  return translations[language] || translations.en;
};