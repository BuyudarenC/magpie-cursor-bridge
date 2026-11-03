import fs from 'node:fs';
import path from 'node:path';
const excluded=new Set(['.git','node_modules','.build','bin']);
const sensitiveName=/^(connection\.json|effective\.json|settings-journal\.json|status\.json|\.env(?:\..*)?)$|\.(?:key|pem|crt|p12|pfx|db|sqlite|log)$/i;
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{30,}/,/sk-[A-Za-z0-9_-]{30,}/,/\/Users\/(?!example(?:\/|$)|test(?:\/|$))[^\s/]+\//];
const failures=[];
function scan(dir) {
 for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
  if(excluded.has(item.name))continue;
  const file=path.join(dir,item.name);
  if(item.isSymbolicLink()){failures.push(file+' (symlink)');continue;}
  if(item.isDirectory()){if(item.name.startsWith('backup-'))failures.push(file);else scan(file);continue;}
  if(sensitiveName.test(item.name)){failures.push(file);continue;}
  if(item.name==='privacy-check.mjs')continue;
  const body=fs.readFileSync(file,'utf8');
  if(patterns.some(re=>re.test(body)))failures.push(file+' (sensitive content pattern)');
 }
}
scan('.');
if(failures.length){console.error('Privacy review required for:\n'+failures.join('\n'));process.exitCode=1;}
else console.log('Privacy scan passed. Review the staged file list and diff before publishing.');
