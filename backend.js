// Camada de dados do Luz no Campus.
// Com o Firebase configurado: login Google + Firestore (com cache offline).
// Sem configuração: modo demonstração, tudo guardado só neste aparelho.

import { firebaseConfig } from "./firebase-config.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const COLLECTION = "postes";

function configured() {
  return firebaseConfig && firebaseConfig.projectId && !/COLE_AQUI/.test(firebaseConfig.projectId);
}

export async function createBackend() {
  return configured() ? firebaseBackend() : demoBackend();
}

// ---------------------------------------------------------------- Firebase
async function firebaseBackend() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(FB + "firebase-app.js"),
    import(FB + "firebase-auth.js"),
    import(FB + "firebase-firestore.js"),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  auth.languageCode = "pt";
  let fs;
  try {
    fs = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
    });
  } catch (e) {
    fs = F.getFirestore(app); // navegador sem suporte a cache persistente
  }
  const col = F.collection(fs, COLLECTION);
  A.getRedirectResult(auth).catch(() => {});

  const toUser = (u) => u && { uid: u.uid, name: u.displayName || (u.email || "").split("@")[0], email: u.email || "", photo: u.photoURL || "" };

  return {
    mode: "firebase",
    onAuth(cb) { return A.onAuthStateChanged(auth, (u) => cb(toUser(u))); },
    async signIn() {
      const provider = new A.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try { await A.signInWithPopup(auth, provider); }
      catch (e) {
        if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) await A.signInWithRedirect(auth, provider);
        else if (e && e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") throw e;
      }
    },
    signOut() { return A.signOut(auth); },
    async isAdmin(uid) {
      try { return (await F.getDoc(F.doc(fs, "admins", uid))).exists(); } catch (e) { return false; }
    },
    subscribe(onChange, onError) {
      return F.onSnapshot(col, { includeMetadataChanges: true }, (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, data: d.data(), pending: d.metadata.hasPendingWrites }));
        onChange(docs, { pending: snap.metadata.hasPendingWrites, fromCache: snap.metadata.fromCache });
      }, onError);
    },
    set(id, data) { return F.setDoc(F.doc(fs, COLLECTION, id), data); },
    remove(id) { return F.deleteDoc(F.doc(fs, COLLECTION, id)); },

    // ----- pedidos de acesso -----
    watchMyAccess(uid, cb) {
      return F.onSnapshot(F.doc(fs, "usuarios", uid), (d) => cb(d.exists() ? d.data() : null), () => cb(null));
    },
    requestAccess(u, mensagem) {
      return F.setDoc(F.doc(fs, "usuarios", u.uid), {
        nome: u.name.slice(0, 80), email: u.email.slice(0, 120), mensagem: (mensagem || "").slice(0, 200),
        status: "pendente", pedidoEm: Date.now(),
      });
    },
    watchUsers(cb) {
      return F.onSnapshot(F.collection(fs, "usuarios"), (snap) => cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))), () => cb([]));
    },
    setUserStatus(uid, status, admin) {
      return F.updateDoc(F.doc(fs, "usuarios", uid), { status, decididoEm: Date.now(), decididoPor: admin.name.slice(0, 80) });
    },
  };
}

// ---------------------------------------------------------------- Demonstração
function demoBackend() {
  const KEY = "luz-demo-postes", UKEY = "luz-demo-user";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  let store = load();
  const subs = new Set(), authSubs = new Set(), usersSubs = new Set();
  const loadUsers = () => { try { return JSON.parse(localStorage.getItem("luz-demo-usuarios") || "[]"); } catch (e) { return []; } };
  let user = null;
  try { user = JSON.parse(localStorage.getItem(UKEY) || "null"); } catch (e) {}
  const emit = () => { const docs = Object.entries(store).map(([id, data]) => ({ id, data, pending: false })); subs.forEach((f) => f(docs, { pending: false, fromCache: false })); };
  const emitAuth = () => authSubs.forEach((f) => f(user));
  return {
    mode: "demo",
    onAuth(cb) { authSubs.add(cb); setTimeout(() => cb(user), 0); return () => authSubs.delete(cb); },
    async signIn() { user = { uid: "demo", name: "Você (demonstração)", email: "", photo: "" }; try { localStorage.setItem(UKEY, JSON.stringify(user)); } catch (e) {} emitAuth(); },
    async signOut() { user = null; try { localStorage.removeItem(UKEY); } catch (e) {} emitAuth(); },
    async isAdmin() { return true; },
    subscribe(onChange) { subs.add(onChange); setTimeout(emit, 0); return () => subs.delete(onChange); },
    async set(id, data) { store[id] = JSON.parse(JSON.stringify(data)); save(store); emit(); },
    async remove(id) { delete store[id]; save(store); emit(); },
    // no modo demonstração você é administrador e já está aprovado;
    // pedidos de exemplo podem ser criados em localStorage["luz-demo-usuarios"]
    watchMyAccess(uid, cb) { setTimeout(() => cb({ status: "aprovado", nome: "Você" }), 0); return () => {}; },
    async requestAccess() {},
    watchUsers(cb) { usersSubs.add(cb); setTimeout(() => cb(loadUsers()), 0); return () => usersSubs.delete(cb); },
    async setUserStatus(uid, status) { const u = loadUsers(); const x = u.find((q) => q.uid === uid); if (x) { x.status = status; x.decididoEm = Date.now(); } try { localStorage.setItem("luz-demo-usuarios", JSON.stringify(u)); } catch (e) {} usersSubs.forEach((f) => f(u)); },
  };
}
