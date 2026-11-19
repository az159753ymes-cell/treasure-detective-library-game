import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js';

const config = window.TREASURE_FIREBASE_CONFIG || {};
const configured = config.apiKey && config.apiKey !== '請填入' && config.authDomain && config.authDomain !== '請填入' && config.projectId && config.projectId !== '請填入' && config.appId && config.appId !== '請填入';
const status = document.getElementById('backendStatus');
const setStatus = text => { if (status) status.textContent = text; };

if (!configured) {
  setStatus('資料服務尚未設定。閱讀回報欄位已就緒，完成 Firebase 設定後才能安全送出。');
} else {
  const app = initializeApp(config);
  if (config.recaptchaSiteKey && config.recaptchaSiteKey !== '請填入 App Check reCAPTCHA v3 site key') {
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(config.recaptchaSiteKey), isTokenAutoRefreshEnabled: true });
  }
  const auth = getAuth(app);
  const db = getFirestore(app);
  window.teacherRecords = [];
  window.lastExportedIds = [];

  onAuthStateChanged(auth, async user => {
    const loginPanel = document.getElementById('teacherLoginPanel');
    const dashboard = document.getElementById('teacherDashboard');
    if (user && !user.isAnonymous) {
      if (loginPanel) loginPanel.hidden = true;
      if (dashboard) dashboard.hidden = false;
      const identity = document.getElementById('teacherIdentity');
      if (identity) identity.textContent = `已登入：${user.email || '教師帳號'}`;
    } else if (loginPanel && dashboard) {
      loginPanel.hidden = false;
      dashboard.hidden = true;
    }
  });

  window.backendReady = (async () => {
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      setStatus('資料服務已連線。完成任務後，紀錄將傳送至教師管理的資料庫。');
      status?.classList.add('ok');
    } catch (err) {
      setStatus('無法連線資料服務，請確認網路與 Firebase 設定。');
    }
  })();

  window.submitReadingSubmission = async data => {
    await window.backendReady;
    if (!auth.currentUser || !auth.currentUser.isAnonymous) throw new Error('匿名學生連線未建立');
    await addDoc(collection(db, 'submissions'), {
      caseId: String(data.caseId).slice(0, 40), bookTitle: String(data.bookTitle).slice(0, 80), chapter: String(data.chapter).slice(0, 100),
      className: String(data.className).trim().slice(0, 20), seatNumber: Number(data.seatNumber), pageNumber: Number(data.pageNumber),
      evidence: String(data.evidence).trim().slice(0, 600), reflection: String(data.reflection).trim().slice(0, 400), submittedAt: serverTimestamp()
    });
  };
  window.teacherSignIn = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  window.teacherSignOut = async () => {
    await signOut(auth);
    await signInAnonymously(auth);
  };
  window.loadTeacherSubmissions = async () => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) throw new Error('請先以教師帳號登入');
    const snapshot = await getDocs(collection(db, 'submissions'));
    const records = snapshot.docs.map(d => {
      const x = d.data();
      const date = x.submittedAt?.toDate?.();
      return { id: d.id, ...x, timeLabel: date ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'short', timeStyle: 'short' }).format(date) : '處理中' };
    }).sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
    return records;
  };
  window.deleteTeacherSubmissions = async ids => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) throw new Error('請先以教師帳號登入');
    for (let i = 0; i < ids.length; i += 400) {
      await Promise.all(ids.slice(i, i + 400).map(id => deleteDoc(doc(db, 'submissions', id))));
    }
  };
  window.teacherSessionReady = () => {
    const user = auth.currentUser;
    if (user && !user.isAnonymous) {
      document.getElementById('teacherLoginPanel').hidden = true;
      document.getElementById('teacherDashboard').hidden = false;
      document.getElementById('teacherIdentity').textContent = `已登入：${user.email || '教師帳號'}`;
      window.refreshTeacherRecords();
    }
  };
}
