import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {validate,refresh} from '../src/config.js';
import {applyProxy,restoreProxy} from '../src/settings.js';
const config=()=>({enabled:true,gateway:'http://127.0.0.1:3425/v1',key:'x'.repeat(32),model:'p/a',models:[{id:'p/a'}]});
test('remote gateways, injected credentials, URL suffixes and duplicate models rejected',()=>{
  for(const gateway of ['https://127.0.0.1:3425/v1','http://localhost:3425/v1','http://evil.example/v1','http://127.0.0.1:3425/v1?q=x','http://user:pass@127.0.0.1:3425/v1']) assert.throws(()=>validate({...config(),gateway}));
  assert.throws(()=>validate({...config(),key:'x\r\n'+ 'x'.repeat(20)}));
  assert.throws(()=>validate({...config(),models:[{id:'p/a'},{id:'p/a'}]}));
});
test('catalogue refresh cannot add models or follow redirects', async()=>{
 const server=http.createServer((req,res)=>{
  if(req.url.includes('redirect')){res.writeHead(302,{Location:'http://127.0.0.1:9/stolen'});res.end();}
  else {res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:[{id:'p/a'},{id:'p/extra'}]}));}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {
  const c={...config(),gateway:`http://127.0.0.1:${server.address().port}/v1`};
  assert.deepEqual((await refresh(c)).models,[{id:'p/a'}]);
  await assert.rejects(refresh({...c,gateway:c.gateway+'/redirect'}));
 } finally {server.close();}
});
test('durable restore preserves comments and later unrelated edits; manual proxy changes pause ownership',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'private-bridge-test-'));
 try {
  const settings=path.join(dir,'settings.json'), journal=path.join(dir,'journal.json');
  const original='{\n // user comment\n "editor.fontSize": 14,\n}\n';fs.writeFileSync(settings,original);
  applyProxy(settings,journal,'http://bridge:secret@127.0.0.1:5678');
  assert.equal(fs.statSync(journal).mode&0o777,0o600);
  restoreProxy(journal);assert.equal(fs.readFileSync(settings,'utf8'),original);
  applyProxy(settings,journal,'http://bridge:secret@127.0.0.1:5678');
  fs.writeFileSync(settings,fs.readFileSync(settings,'utf8').replace('14','16'));
  restoreProxy(journal);assert.match(fs.readFileSync(settings,'utf8'),/16/);
  applyProxy(settings,journal,'http://bridge:secret@127.0.0.1:5678');
  fs.writeFileSync(settings,fs.readFileSync(settings,'utf8').replace('5678','6789'));
  assert.throws(()=>applyProxy(settings,journal,'http://bridge:secret@127.0.0.1:5678'));
  restoreProxy(journal);assert.match(fs.readFileSync(settings,'utf8'),/6789/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
