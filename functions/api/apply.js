const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
export async function onRequestPost({request,env}) {
  const origin=request.headers.get("Origin");
  if(origin && new URL(origin).host!==new URL(request.url).host) return json({error:"不正なリクエストです。"},403);
  if(!request.headers.get("content-type")?.includes("application/json")) return json({error:"形式が不正です。"},415);
  let p;
  try { p=await request.json(); } catch { return json({error:"入力を確認してください。"},400); }
  if(p.website) return json({ok:true});
  const name=String(p.name||"").trim(),email=String(p.email||"").trim(),message=String(p.message||"").trim();
  if(!name||name.length>120||!/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email)||email.length>254||message.length>4000)
    return json({error:"入力内容を確認してください。"},400);
  if(!env.FORM_TOKEN) return json({error:"送信設定が完了していません。"},503);
  const safe=x=>String(x||"").replace(/[\r\n]/g," ").slice(0,200);
  const payload={
    token:env.FORM_TOKEN,name,email,message,
    type:safe(p.type),slot:safe(p.slot),
    estimate:Number.isFinite(Number(p.estimate))?Math.max(0,Math.min(10000000,Number(p.estimate))):"未設定"
  };
  try {
    const r=await fetch("https://script.google.com/macros/s/AKfycbwL4r3zok_xMChvfss6gSHx0znGEopARodNQRjpURXsloBDJELKJUui2N-vhuZ86c1s/exec",{
      method:"POST",headers:{"Content-Type":"text/plain; charset=utf-8"},
      body:JSON.stringify(payload),redirect:"follow"
    });
    if(!r.ok) {console.error("Apps Script HTTP error",r.status);return json({error:"送信処理に失敗しました。"},502);}
    let result;
    try {result=await r.json();} catch {console.error("Apps Script non-JSON response");return json({error:"送信設定を確認してください。"},502);}
    if(result?.ok!==true) {console.error("Apps Script rejected submission");return json({error:"送信に失敗しました。"},502);}
    return json({ok:true});
  } catch(err) {console.error("Apps Script request failed",String(err));return json({error:"通信エラーが発生しました。"},502);}
}