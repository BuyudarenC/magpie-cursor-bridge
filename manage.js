#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {atomic,restoreProxy} from './settings.js';
const pkg=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(os.homedir(),'.config/magpie-cursor-private');
const plist=path.join(os.homedir(),'Library/LaunchAgents/local.magpie.cursor-private.plist');
const label='local.magpie.cursor-private', domain=`gui/${process.getuid()}`;
const command=process.argv[2]||'status';
const ctl=(...args)=>spawnSync('/bin/launchctl',args,{encoding:'utf8'});
process.umask(0o077);
if(command==='status') {
  console.log(fs.existsSync(path.join(root,'status.json'))?fs.readFileSync(path.join(root,'status.json'),'utf8'):'尚未启动');
} else if(command==='install') {
  fs.mkdirSync(root,{recursive:true,mode:0o700});fs.chmodSync(root,0o700);
  const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const args=[process.execPath,path.join(pkg,'service.js')].map(s=>`<string>${esc(s)}</string>`).join('');
  ctl('bootout',`${domain}/${label}`);
  atomic(plist,`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array>${args}</array><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>10</integer><key>ExitTimeOut</key><integer>15</integer><key>Umask</key><integer>63</integer><key>StandardOutPath</key><string>/dev/null</string><key>StandardErrorPath</key><string>/dev/null</string></dict></plist>`);
  const result=ctl('bootstrap',domain,plist);
  if(result.status!==0) throw Error('launchd 启动失败: '+result.stderr);
  console.log('后台服务已安装');
} else if(command==='uninstall') {
  // Disconnect in Magpie first, which restores its own per-agent state too.
  const result=spawnSync('magpie',['cursor-private','default'],{encoding:'utf8'});
  if(result.status!==0) throw Error('Magpie 断开失败，请先手动断开');
  ctl('bootout',`${domain}/${label}`);
  restoreProxy(path.join(root,'settings-journal.json'));
  fs.rmSync(plist,{force:true});
  console.log('后台已停用，代理已恢复。插件可用 magpie plugin rm 移除；源文件和本机证书保留。');
} else {throw Error('用法: node manage.js install|status|uninstall');}
