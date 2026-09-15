const byId=id=>document.getElementById(id);
const roleNames={admin:'Administrador',editor:'Registro',viewer:'Solo consulta'};
let accountProfile=null;
function accountError(e){const c=e.code||'';if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c))return 'Usuario o contraseña incorrectos.';if(c.includes('email-already-in-use'))return 'Ese nombre de usuario ya existe.';if(c.includes('too-many-requests'))return 'Demasiados intentos. Espera unos minutos.';if(c.includes('network'))return 'No hay conexión. Vuelve a intentarlo.';if(c.includes('permission-denied'))return 'No tienes permiso para esta operación.';return e.message||'No se pudo completar la operación.';}
window.cloudRole=p=>{
 accountProfile=p;document.body.classList.toggle('role-viewer',p?.role==='viewer');
 byId('cloud-user').textContent=p?`${p.username} · ${roleNames[p.role]||''}`:'';
 byId('accounts-open').hidden=p?.role!=='admin';
 if(p?.role!=='admin')byId('accounts-dialog').close();
};
byId('login-form').addEventListener('submit',async e=>{e.preventDefault();const button=byId('login-submit');button.disabled=true;byId('cloud-login-error').textContent='Conectando…';try{await personalCloud.login(byId('login-user').value,byId('login-pass').value);byId('login-pass').value='';}catch(err){byId('cloud-login-error').textContent=accountError(err);}finally{button.disabled=false;}});
window.openAccounts=async()=>{byId('accounts-dialog').showModal();await renderAccounts();};
async function renderAccounts(){
 const list=byId('accounts-list');list.replaceChildren();byId('accounts-error').textContent='Cargando usuarios…';
 try{const users=await personalCloud.users();for(const u of users.sort((a,b)=>Number(b.principal)-Number(a.principal)||a.username.localeCompare(b.username))){
  const row=document.createElement('div');row.className='account-row';const name=document.createElement('strong');name.textContent=u.username;row.append(name);
  if(u.principal||u.id===accountProfile?.id){const label=document.createElement('span');label.textContent=u.principal?'Administrador principal':roleNames[u.role]+' · Tú';row.append(label);}
  else{const roles=document.createElement('select');roles.setAttribute('aria-label','Permisos de '+u.username);for(const [value,text] of Object.entries(roleNames)){const o=document.createElement('option');o.value=value;o.textContent=text;roles.append(o);}roles.value=u.role;
   const change=document.createElement('button');change.type='button';change.className='compact secondary';change.textContent='Guardar permisos';change.onclick=()=>update(u,roles.value,u.active,change);
   const active=document.createElement('button');active.type='button';active.className='compact secondary';active.textContent=u.active?'Desactivar':'Activar';active.onclick=async()=>{if(await confirmarAccion(`${u.active?'Desactivar':'Activar'} el acceso de ${u.username}?`))await update(u,u.role,!u.active,active);};row.append(roles,change,active);
  }const state=document.createElement('span');state.textContent=u.active?'Activo':'Sin acceso';row.append(state);list.append(row);
 }byId('accounts-error').textContent='';}catch(e){byId('accounts-error').textContent=accountError(e);}
}
async function update(u,role,active,button){button.disabled=true;try{await personalCloud.updateAccount(u.id,role,active);await renderAccounts();}catch(e){byId('accounts-error').textContent=accountError(e);}finally{button.disabled=false;}}
byId('account-create').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;byId('accounts-error').textContent='Creando usuario…';try{await personalCloud.createAccount(byId('account-name').value,byId('account-pass').value,byId('account-role').value);e.target.reset();await renderAccounts();byId('accounts-error').textContent='Usuario creado.';}catch(err){byId('accounts-error').textContent=accountError(err);}finally{button.disabled=false;}});
byId('password-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{await personalCloud.changePassword(byId('password-old').value,byId('password-new').value);e.target.reset();byId('password-error').textContent='Contraseña cambiada.';}catch(err){byId('password-error').textContent=accountError(err);}finally{button.disabled=false;}});
byId('password-dialog').addEventListener('close',()=>{byId('password-form').reset();byId('password-error').textContent='';});
