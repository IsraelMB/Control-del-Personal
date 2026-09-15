import {initializeApp,deleteApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,deleteUser,onAuthStateChanged,signOut,setPersistence,inMemoryPersistence,updatePassword,EmailAuthProvider,reauthenticateWithCredential} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {getFirestore,doc,collection,getDocsFromServer,getDocFromServer,setDoc,updateDoc,runTransaction,onSnapshot} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const config=await fetch('./firebase-config.json').then(r=>{if(!r.ok)throw Error('No se pudo cargar la configuración');return r.json()});
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
let uid=null,revision=0,baseline={workers:[],records:[]},stop,stopProfile,profile=null,session=0;
function ref(group,id){return doc(db,'personal','shared',group,id)}
function check(){if(!uid)throw Error('Inicia sesión para continuar');if(!navigator.onLine)throw Error('Sin conexión. No se ha guardado el cambio.');}
async function load(){
 check();
 for(let n=0;n<4;n++){
  const a=await getDocFromServer(ref('meta','state'));
  const [w,r]=await Promise.all(['workers','records'].map(k=>getDocsFromServer(collection(db,'personal',uid,k))));
  const z=await getDocFromServer(ref('meta','state'));
  if((a.data()?.revision||0)!==(z.data()?.revision||0))continue;
  revision=z.data()?.revision||0;baseline={workers:w.docs.map(d=>d.data()),records:r.docs.map(d=>d.data())};return structuredClone(baseline);
 }
 throw Error('Hay cambios simultáneos. Vuelve a actualizar.');
}
async function save(next){
 check();if(!['admin','editor'].includes(profile?.role))throw Error('Tu usuario tiene permiso de solo consulta.');const changes=[];
 for(const key of ['workers','records']){
  const id=x=>key==='workers'?x.cloudId:String(x.id);
  const before=new Map(baseline[key].map(x=>[id(x),x])),after=new Map(next[key].map(x=>[id(x),x]));
  for(const [k,v] of after)if(JSON.stringify(v)!==JSON.stringify(before.get(k)))changes.push({key,k,v});
  for(const k of before.keys())if(!after.has(k))changes.push({key,k,v:null});
 }
 if(!changes.length)return;
 if(changes.length>450)throw Error('Esta operación supera 450 cambios. Divide la importación o el borrado antes de continuar.');
 const expected=revision;
 await runTransaction(db,async tx=>{
  const current=await tx.get(ref('meta','state'));
  if((current.data()?.revision||0)!==expected)throw Error('Hay cambios desde otro dispositivo. Pulsa Actualizar y vuelve a intentarlo.');
  for(const c of changes){const target=ref(c.key,c.k);if(c.v===null)tx.delete(target);else tx.set(target,c.v);}
  tx.set(ref('meta','state'),{revision:expected+1});
 });
 revision=expected+1;baseline=structuredClone(next);
}
function username(value){const n=String(value).trim();if(!/^[a-zA-Z0-9._-]{3,40}$/.test(n))throw Error('Usa entre 3 y 40 letras sin acentos, números, puntos, guiones o guiones bajos.');return n;}
function email(value){return username(value).toLowerCase()+'@users.control-del-personal.invalid';}
function password(value){if(value.length<10)throw Error('La contraseña debe tener al menos 10 caracteres.');return value;}
function requireAdmin(){check();if(profile?.role!=='admin')throw Error('Solo un administrador puede gestionar usuarios.');}
async function createAccount(name,pass,role){
 requireAdmin();name=username(name);password(pass);if(!['admin','editor','viewer'].includes(role))throw Error('Permiso no válido.');
 const secondary=initializeApp(config,'new-user-'+crypto.randomUUID()),secondaryAuth=getAuth(secondary);let created;
 try{
  await setPersistence(secondaryAuth,inMemoryPersistence);
  created=(await createUserWithEmailAndPassword(secondaryAuth,email(name),pass)).user;
  await setDoc(doc(db,'appUsers',created.uid),{username:name,role,active:true,principal:false});
 }catch(e){if(created){try{await deleteUser(created)}catch{throw Error('No se completó el alta. Contacta con el administrador antes de repetir ese nombre.');}}throw e;}
 finally{await signOut(secondaryAuth).catch(()=>{});await deleteApp(secondary);}
}
window.personalCloud={load,save,
 login:(name,pass)=>signInWithEmailAndPassword(auth,email(name),pass),logout:()=>signOut(auth),
 canWrite:()=>['admin','editor'].includes(profile?.role),
 users:async()=>{requireAdmin();return (await getDocsFromServer(collection(db,'appUsers'))).docs.map(d=>({id:d.id,...d.data()}));},
 createAccount,
 updateAccount:async(id,role,active)=>{requireAdmin();if(id===uid)throw Error('No puedes cambiar tus propios permisos.');if(!['admin','editor','viewer'].includes(role))throw Error('Permiso no válido.');await updateDoc(doc(db,'appUsers',id),{role,active});},
 changePassword:async(old,next)=>{check();password(next);await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(auth.currentUser.email,old));await updatePassword(auth.currentUser,next);}
};
document.getElementById('login-submit').disabled=false;
document.getElementById('cloud-login-error').textContent='';
onAuthStateChanged(auth,async user=>{
 const current=++session;stop?.();stopProfile?.();uid=null;profile=null;window.cloudRole?.(null);
 if(!user){window.cloudSession?.(false);return;}
 stopProfile=onSnapshot(doc(db,'appUsers',user.uid),async snap=>{
  if(current!==session)return;
  const p=snap.data();if(!p?.active){uid=null;profile=null;stop?.();window.cloudRole?.(null);window.cloudSession?.(false,'Usuario sin acceso. Contacta con el administrador.');return;}
  const first=!uid;uid=user.uid;profile={...p,id:uid};window.cloudRole?.(profile);
  if(first){await window.cloudSession?.(true);if(current!==session||!uid)return;stop=onSnapshot(ref('meta','state'),s=>{if((s.data()?.revision||0)!==revision)window.cloudChanged?.();},()=>window.cloudChanged?.());}
 },()=>{uid=null;profile=null;stop?.();window.cloudRole?.(null);window.cloudSession?.(false,'No se pudo comprobar el acceso. Vuelve a entrar.');});
});
