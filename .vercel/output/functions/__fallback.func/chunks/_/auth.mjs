import { f as getCookie, h as setCookie, i as deleteCookie } from '../nitro/nitro.mjs';
import { g as getFirestore } from './firestore.mjs';

async function getCurrentUser(event) {
  const cookieVal = getCookie(event, "uid");
  const uid = cookieVal ? String(cookieVal) : null;
  if (!uid) return null;
  const db = getFirestore();
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) return null;
  return { id: uid, ...doc.data() };
}
function setUserSession(event, userId) {
  setCookie(event, "uid", String(userId), { httpOnly: true, sameSite: "lax", path: "/" });
  setCookie(event, "uid_js", String(userId), { httpOnly: false, sameSite: "lax", path: "/" });
}
function clearUserSession(event) {
  deleteCookie(event, "uid", { path: "/" });
  deleteCookie(event, "uid_js", { path: "/" });
}

export { clearUserSession as c, getCurrentUser as g, setUserSession as s };
//# sourceMappingURL=auth.mjs.map
