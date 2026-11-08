import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const port = 39647;
const base = `http://127.0.0.1:${port}`;

test('AI WORLD secure demo smoke test', async () => {
 const child=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url).pathname,env:{...process.env,PORT:String(port),SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:'',OPENAI_API_KEY:'',ADMIN_TOKEN:'',AUTO_RUN:'false'},stdio:'ignore'});
 try {
  let healthy=false;
  for(let i=0;i<40;i++) {
   try{const r=await fetch(base+'/api/health');if(r.ok){healthy=true;break;}}catch{}
   await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(healthy,'server started');
  let r=await fetch(base+'/api/health');const health=await r.json();
  assert.equal(health.demo,true);assert.equal(health.ai_configured,false);assert.equal(health.auto_run,false);
  r=await fetch(base+'/api/bootstrap');assert.equal(r.status,200);const world=await r.json();
  assert.equal(world.agents.length,10);assert.equal(world.posts.length,10);assert.equal(world.status.persistent,false);
  assert.ok(world.posts.every(p=>p.generation_source!=='ai'),'samples not mislabelled as AI');
  r=await fetch(base+'/api/admin/tick',{method:'POST'});assert.equal(r.status,401);
  r=await fetch(base+'/api/admin/status');assert.equal(r.status,401);
  r=await fetch(base+'/');assert.equal(r.status,200);assert.match(await r.text(),/AI WORLD/);
  r=await fetch(base+'/app.js');assert.equal(r.status,200);assert.match(await r.text(),/renderPosts/);
  r=await fetch(base+'/style.css');assert.equal(r.status,200);assert.match(await r.text(),/\.hero/);
  r=await fetch(base+'/missing.css');assert.equal(r.status,404);
  r=await fetch(base+'/api/bootstrap',{method:'POST'});assert.equal(r.status,405);
 } finally {child.kill('SIGTERM');}
});