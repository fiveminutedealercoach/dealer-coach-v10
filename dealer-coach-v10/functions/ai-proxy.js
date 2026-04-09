export async function onRequestPost(context) {
  const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'}
  try {
    const { messages, system } = await context.request.json()
    const response = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':context.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-sonnet-4-5-20251022',max_tokens:1024,system:system||'You are a helpful automotive dealership coaching assistant.',messages})
    })
    const data = await response.json()
    return new Response(JSON.stringify(data),{headers:cors})
  } catch(err) {
    return new Response(JSON.stringify({error:err.message}),{status:500,headers:cors})
  }
}
export async function onRequestOptions() {
  return new Response(null,{status:200,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS'}})
}
