export const agent = {
  id: 'cursor-private',
  name: 'Cursor · 私人桥接',
  dir: '/Applications/Cursor.app',
  config: '~/.config/magpie-cursor-private/connection.json',
  format: 'json', model: 'model', ua: ['cursor-private-bridge'],
  notice: '仅在本机桥接 Magpie。连接后重启 Cursor；断开自动恢复代理。会话暂存在内存，后台重启会清除。'
};
export function connect({gateway, models}) {
  return {enabled: true, gateway: gateway.v1, key: gateway.key,
    models: models.map(m => ({id:m.id, name:m.name || m.id, context:m.context || null}))};
}
