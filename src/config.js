export function validate(c) {
  if (!c || c.enabled !== true) return null;
  const u = new URL(c.gateway);
  if (u.protocol !== 'http:' || u.hostname !== '127.0.0.1' || u.pathname !== '/v1' ||
      u.username || u.password || u.search || u.hash) throw Error('网关必须是 http://127.0.0.1:端口/v1');
  if (typeof c.key !== 'string' || c.key.length < 16 || /[\r\n]/.test(c.key)) throw Error('无效的网关凭证');
  if (!Array.isArray(c.models) || !c.models.length || c.models.length > 2000) throw Error('无效的模型目录');
  const ids = new Set();
  for (const m of c.models) {
    if (typeof m.id !== 'string' || !m.id.trim() || m.id.length > 512 || ids.has(m.id)) throw Error('无效或重复的模型');
    ids.add(m.id);
  }
  if (!ids.has(c.model)) throw Error('所选模型不在目录中');
  return c;
}
export async function refresh(c) {
  const response = await fetch(c.gateway + '/models', {
    headers:{Authorization:`Bearer ${c.key}`, 'User-Agent':'cursor-private-bridge/1.0.1'},
    redirect:'error', signal:AbortSignal.timeout(5000)
  });
  if (!response.ok) throw Error(`Magpie 网关状态 ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body.data)) throw Error('网关模型目录无效');
  const names = new Map(c.models.map(m => [m.id,m]));
  // Agent's supplied catalogue is the allowed set; a gateway refresh cannot widen it.
  const models = body.data.filter(m => names.has(m.id)).map(m => names.get(m.id));
  return validate({...c, models});
}
