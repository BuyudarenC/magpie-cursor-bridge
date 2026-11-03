import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {randomBytes, createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline';
import {atomic, applyProxy, restoreProxy} from './settings.js';
import {validate, refresh} from './config.js';
const pkg = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.PRIVATE_BRIDGE_ROOT || path.join(os.homedir(), '.config/magpie-cursor-private');
const settings = process.env.PRIVATE_BRIDGE_SETTINGS || path.join(os.homedir(), 'Library/Application Support/Cursor/User/settings.json');
const file = n => path.join(root,n);
const sleep = ms => new Promise(r => setTimeout(r,ms));
process.umask(0o077);
fs.mkdirSync(root,{recursive:true,mode:0o700});
const status = (state, extra={}) => atomic(file('status.json'),JSON.stringify({state,...extra,updated:new Date().toISOString()},null,2));
const journal = file('settings-journal.json');
let child, ready, ending=false, previous='', paused=false, nextRefresh=0;
async function stop() {
  try { restoreProxy(journal); }
  finally {
    if (child) {
      const old=child; child=null; ready=null;
      old.kill('SIGTERM');
      await Promise.race([new Promise(r=>old.once('exit',r)),sleep(5000)]);
      if(old.exitCode===null && old.signalCode===null) old.kill('SIGKILL');
    }
    fs.rmSync(file('effective.json'),{force:true});
  }
}
async function start(c) {
  const engine=path.join(pkg,'bin/cursor-private-engine');
  const expected=JSON.parse(fs.readFileSync(path.join(pkg,'integrity.json'))).sha256;
  if(createHash('sha256').update(fs.readFileSync(engine)).digest('hex')!==expected) throw Error('原生程序摘要校验失败');
  const password=randomBytes(32).toString('hex'), token=randomBytes(32).toString('hex');
  atomic(file('effective.json'),JSON.stringify(c));
  child=spawn(engine,[file('effective.json')],{
    env:{PATH:'/usr/bin:/bin:/usr/sbin:/sbin',HOME:os.homedir(),CURSOR_BYOK_DATA_DIR:file('data'),
      PRIVATE_BRIDGE_BACKEND_TOKEN:token,PRIVATE_BRIDGE_PROXY_AUTH:`Basic ${Buffer.from('bridge:'+password).toString('base64')}`},
    stdio:['pipe','pipe','ignore']
  });
  const running=child;
  ready=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('原生程序启动超时')),30000);
    const lines=createInterface({input:running.stdout});
    lines.on('line',line=>{try {const m=JSON.parse(line); if(m.event==='ready'){clearTimeout(timer);resolve(m);}}catch{}});
    running.once('error',()=>{clearTimeout(timer);reject(Error('原生程序无法启动'));});
    running.once('exit',()=>{clearTimeout(timer);reject(Error('原生程序退出'));});
  });
  const proxy=new URL(ready.proxy); proxy.username='bridge'; proxy.password=password;
  ready.authProxy=proxy.href.replace(/\/$/,'');
  applyProxy(settings,journal,ready.authProxy);
}
for(const sig of ['SIGTERM','SIGINT']) process.on(sig,()=>{ending=true;});
try {
  restoreProxy(journal);
  while(!ending) {
    try {
      const connection=file('connection.json');
      if(fs.existsSync(connection)) fs.chmodSync(connection,0o600);
      const raw=fs.existsSync(connection)?fs.readFileSync(connection,'utf8'):'{}';
      const c=validate(JSON.parse(raw));
      if(!c) {await stop();status('disconnected');previous='';paused=false;}
      else if(paused && previous===raw) status('paused',{reason:'代理设置被外部修改，请在 Magpie 中断开后重新连接'});
      else {
        if(raw!==previous || Date.now()>=nextRefresh || !child || child.exitCode!==null || child.signalCode!==null) {
          const effective=await refresh(c);
          nextRefresh=Date.now()+15000;
          if(!child || child.exitCode!==null || child.signalCode!==null) {await stop();await start(effective);}
          else atomic(file('effective.json'),JSON.stringify(effective));
          previous=raw;
        }
        try {applyProxy(settings,journal,ready.authProxy);}
        catch(e) {paused=true;previous=raw;throw e;}
        status('connected',{model:c.model,models:c.models.length,proxy:ready.proxy,backend:ready.backend,pid:child.pid});
      }
    } catch(e) {
      try {await stop();} catch {}
      // Do not log exceptions containing credentials, URLs, request bodies or model content.
      status(paused?'paused':'error',{reason:['原生程序启动超时','原生程序退出','原生程序无法启动','原生程序摘要校验失败'].includes(e.message)?e.message:'连接或代理检查失败；已尝试恢复代理'});
    }
    if(!ending) await sleep(2000);
  }
} finally {await stop();status('stopped');}
