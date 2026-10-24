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
  if(!env.RESEND_API_KEY||!env.MAIL_FROM) return json({error:"送信設定が完了していません。"},503);
  const safe=x=>String(x||"").replace(/[\r\n]/g," ").slice(0,200);
  const body=[
    "【7日サイト】新しいお申し込み","",
    `お名前: ${name}`,`メール: ${email}`,
    `タイプ: ${safe(p.type)}`,`開始時期: ${safe(p.slot)}`,
    `見積もり（税込）: ${Number.isFinite(Number(p.estimate))?Math.max(0,Math.min(10000000,Number(p.estimate))):"未設定"}円`,
    "","ご相談内容:",message||"（未記入）"
  ].join("\n");
  try {
    const r=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"Authorization":`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({from:env.MAIL_FROM,to:["7daysite.works@gmail.com"],reply_to:email,subject:"【7日サイト】新しいお申し込み",text:body})
    });
    if(!r.ok){ console.error("Mail provider error",r.status); return json({error:"送信処理に失敗しました。時間をおいて再度お試しください。"},502); }
    return json({ok:true});
  } catch {return json({error:"通信エラーが発生しました。"},502);}
}