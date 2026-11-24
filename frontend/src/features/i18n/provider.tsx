import React, { useState, useEffect } from 'react';
import { LanguageContext, type Language } from '@features/i18n/context';
export { useLanguage } from '@features/i18n/context';
export type { Language, LanguageContextType } from '@features/i18n/context';

const translations = {
  en: {
    'landing.title': 'Welcome to MathVenture!',
    'landing.subtitle': 'A jungle expedition for curious minds to learn colors, shapes, numbers, and sequencing.',
    'landing.student': 'I am a Student',
    'landing.teacher': 'I am a Teacher',
    'auth.signin': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.forgotPasswordTitle': 'Reset your password',
    'auth.forgotPasswordDescription': 'Enter your email and we will send a six-digit reset code if an account uses it.',
    'auth.sendResetCode': 'Send reset code',
    'auth.resetCodeSent': 'If an account uses that email, a reset code is on its way.',
    'auth.resetCodeResent': 'A new reset code may be on its way.',
    'auth.resetRequestFailed': 'We could not request a reset code right now.',
    'auth.continueToReset': 'Enter reset code',
    'auth.backToLogin': 'Back to Log In',
    'auth.resetPasswordTitle': 'Choose a new password',
    'auth.resetPasswordDescription': 'Enter the six-digit code from your email, then choose a new password.',
    'auth.verificationCode': '6-digit reset code',
    'auth.newPassword': 'New password',
    'auth.confirmPassword': 'Confirm new password',
    'auth.resetPassword': 'Reset password',
    'auth.resendCode': 'Resend code',
    'auth.name': 'Full Name',
    'auth.role': 'I am a...',
    'auth.firstName': 'First Name',
    'auth.teacherFirstName': 'Teacher First Name',
    'auth.classCode': 'Class Code',
    'auth.lastName': 'Last Name',
    'auth.studentLoginHelp': "Ask your teacher to create your account, then use your teacher's first name, your last name, and your first name.",
    'student.dashboard': 'Lessons',
    'student.classroom': 'Classroom',
    'student.backToLessons': 'Back to my lessons',
    'student.status.assigned': 'Assigned',
    'student.status.finished': 'Finished',
    'student.streak': 'Day Streak',
    'student.lessonsCompleted': 'Lessons Completed',
    'student.playNow': 'Play Now',
    'student.recent': 'Recent Adventures',
    'student.portal.allLessons': 'All Lessons',
    'student.portal.nextAssignment': 'Next Assignment',
    'student.portal.playThisNext': 'Play this next',
    'student.portal.noAssignmentsTitle': 'Pick any lesson to play.',
    'student.portal.noAssignmentsBody': 'Choose your next adventure.',
    'student.portal.tapAnyLesson': 'Tap any lesson',
    'student.portal.myClass': 'My Class',
    'student.portal.noClasses': 'You have not joined a class yet.',
    'student.portal.joinPrompt': 'Ask your teacher for a join code.',
    'student.portal.joinClass': 'Join a Class',
    'student.portal.myProgress': 'My Progress',
    'student.portal.days': 'Days',
    'student.portal.done': 'Done',
    'student.portal.recent': 'Recent',
    'student.portal.score': 'Best',
    'student.portal.dashboardUnavailableTitle': 'Your dashboard took a little detour.',
    'student.portal.dashboardUnavailableBody': 'We could not load all of your progress yet, but you can still tap any lesson and keep learning.',
    'student.portal.loadingTitle': 'Getting your jungle ready...',
    'student.portal.loadingBody': 'Loading your lessons and class updates.',
    'teacher.dashboard': 'Today',
    'teacher.today': 'Today',
    'teacher.classes': 'My Classes',
    'teacher.returnToClasses': 'Return to class list',
    'teacher.reports': 'Reports',
    'teacher.settings': 'Settings',
    'teacher.assignments': 'Assignments',
    'teacher.newClass': 'New Class',
    'teacher.joinCode': 'Join Code',
    'teacher.students': 'Students',
    'teacher.avgScore': 'Avg Score',
    'game.identify': 'Find the',
    'game.match': 'Match the pairs!',
    'game.sequence': 'Put them in order!',
    'game.excellent': 'Excellent!',
    'game.tryAgain': 'Try Again!',
    'game.next': 'Next Lesson',
    'game.back': 'Back to Basecamp',
    'common.logout': 'Log Out',
    'common.logoutConfirmTitle': 'Are you sure you want to log out?',
    'common.logoutConfirmDescription': 'You will need to sign in again to access your teacher account.',
    'common.join': 'Join',
    'common.tryAgain': 'Try Again',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'settings.language': 'Language / Wika',
  },
  tl: {
    'landing.title': 'Maligayang pagdating sa MathVenture!',
    'landing.subtitle': 'Isang ekspedisyon sa gubat para matuto ng mga kulay, hugis, numero, at pagkakasunod-sunod.',
    'landing.student': 'Ako ay Estudyante',
    'landing.teacher': 'Ako ay Guro',
    'auth.signin': 'Mag-login',
    'auth.signup': 'Mag-sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Nakalimutan ang password?',
    'auth.forgotPasswordTitle': 'I-reset ang iyong password',
    'auth.forgotPasswordDescription': 'Ilagay ang iyong email at magpapadala kami ng 6-digit na reset code kung may account ito.',
    'auth.sendResetCode': 'Magpadala ng reset code',
    'auth.resetCodeSent': 'Kung may account na gumagamit ng email na ito, ipinapadala na ang reset code.',
    'auth.resetCodeResent': 'Maaaring ipinapadala na ang bagong reset code.',
    'auth.resetRequestFailed': 'Hindi kami makapagpadala ng reset code ngayon.',
    'auth.continueToReset': 'Ilagay ang reset code',
    'auth.backToLogin': 'Bumalik sa Log In',
    'auth.resetPasswordTitle': 'Pumili ng bagong password',
    'auth.resetPasswordDescription': 'Ilagay ang 6-digit na code mula sa iyong email, pagkatapos pumili ng bagong password.',
    'auth.verificationCode': '6-digit na reset code',
    'auth.newPassword': 'Bagong password',
    'auth.confirmPassword': 'Kumpirmahin ang bagong password',
    'auth.resetPassword': 'I-reset ang password',
    'auth.resendCode': 'Magpadala muli ng code',
    'auth.name': 'Buong Pangalan',
    'auth.role': 'Ako ay isang...',
    'auth.firstName': 'Unang Pangalan',
    'auth.teacherFirstName': 'Unang Pangalan ng Guro',
    'auth.classCode': 'Class Code',
    'auth.lastName': 'Apelyido',
    'auth.studentLoginHelp': 'Hilingin sa iyong guro na gumawa ng account mo, pagkatapos gamitin ang unang pangalan ng iyong guro, ang iyong apelyido, at ang iyong unang pangalan.',
    'student.dashboard': 'Mga Aralin',
    'student.classroom': 'Klase',
    'student.backToLessons': 'Bumalik sa aking mga aralin',
    'student.status.assigned': 'Itinalaga',
    'student.status.finished': 'Tapos na',
    'student.streak': 'Araw ng Streak',
    'student.lessonsCompleted': 'Tapos na Mga Aralin',
    'student.playNow': 'Maglaro Ngayon',
    'student.recent': 'Mga Kamakailang Pakikipagsapalaran',
    'student.portal.allLessons': 'Lahat ng Aralin',
    'student.portal.nextAssignment': 'Susunod na Gawain',
    'student.portal.playThisNext': 'Ito ang sunod mong laruin',
    'student.portal.noAssignmentsTitle': 'Pumili ng kahit anong aralin.',
    'student.portal.noAssignmentsBody': 'Piliin ang susunod mong adventure.',
    'student.portal.tapAnyLesson': 'Pumili ng aralin',
    'student.portal.myClass': 'Aking Klase',
    'student.portal.noClasses': 'Wala ka pang nasalihang klase.',
    'student.portal.joinPrompt': 'Humingi ng join code sa iyong guro.',
    'student.portal.joinClass': 'Sumali sa Klase',
    'student.portal.myProgress': 'Aking Progress',
    'student.portal.days': 'Araw',
    'student.portal.done': 'Tapos',
    'student.portal.recent': 'Huli',
    'student.portal.score': 'Best',
    'student.portal.dashboardUnavailableTitle': 'Naligaw nang kaunti ang dashboard mo.',
    'student.portal.dashboardUnavailableBody': 'Hindi pa namin makuha ang buo mong progress, pero puwede ka pa ring pumili ng kahit anong aralin at magpatuloy.',
    'student.portal.loadingTitle': 'Inihahanda ang iyong jungle...',
    'student.portal.loadingBody': 'Ikinakarga ang iyong mga aralin at class updates.',
    'teacher.dashboard': 'Ngayon',
    'teacher.today': 'Ngayon',
    'teacher.classes': 'Aking Mga Klase',
    'teacher.returnToClasses': 'Bumalik sa listahan ng klase',
    'teacher.reports': 'Mga Report',
    'teacher.settings': 'Settings',
    'teacher.assignments': 'Mga Gawain',
    'teacher.newClass': 'Bagong Klase',
    'teacher.joinCode': 'Join Code',
    'teacher.students': 'Mga Estudyante',
    'teacher.avgScore': 'Katamtamang Iskor',
    'game.identify': 'Hanapin ang',
    'game.match': 'Pagtambalin ang mga pares!',
    'game.sequence': 'Ayusin ang pagkakasunod-sunod!',
    'game.excellent': 'Magaling!',
    'game.tryAgain': 'Subukan Muli!',
    'game.next': 'Susunod na Aralin',
    'game.back': 'Bumalik sa Basecamp',
    'common.logout': 'Mag-log Out',
    'common.logoutConfirmTitle': 'Sigurado ka bang gusto mong mag-log out?',
    'common.logoutConfirmDescription': 'Kailangan mong mag-sign in muli para ma-access ang iyong teacher account.',
    'common.join': 'Sumali',
    'common.tryAgain': 'Subukan Muli',
    'common.loading': 'Naglo-load...',
    'common.save': 'I-save',
    'common.cancel': 'Kanselahin',
    'settings.language': 'Wika / Language',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const storage = getLanguageStorage();
    const saved = storage?.getItem('mathventure-lang') as Language | null;
    if (saved === 'en' || saved === 'tl') {
      setLang(saved);
    }
  }, []);

  const handleSetLang = (l: Language) => {
    setLang(l);
    getLanguageStorage()?.setItem('mathventure-lang', l);
  };

  const t = (key: string) => {
    return translations[lang][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function getLanguageStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
