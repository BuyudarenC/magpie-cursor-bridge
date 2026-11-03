# Magpie Cursor Bridge

连接 Cursor 与 Magpie，在 Cursor 中使用 Magpie 配置的模型和路由组。

## 功能

- 在 Magpie 中连接、断开和切换模型。
- 将模型目录同步到 Cursor 的模型菜单。
- 通过带认证的本机接口转发 Agent 请求。
- 断开或连接异常时恢复 Cursor 代理设置。
- 使用内存存储会话，支持登录后自动启动后台。

## 环境要求

| 项目 | 要求 |
| --- | --- |
| 系统 | macOS，Apple Silicon |
| 应用 | Cursor、Magpie，安装在 `/Applications` |
| 运行环境 | Node.js 22+、npm |
| 构建工具 | Git、Rust stable、Xcode Command Line Tools |

安装前，请确认 Cursor 已登录，Magpie 已配置可用模型。若已启用其他 Cursor 代理或桥接工具，请先断开并停用，避免配置冲突。

## 安装

```sh
git clone https://github.com/BuyudarenC/magpie-cursor-bridge.git
cd magpie-cursor-bridge
npm run setup
```

安装脚本将安装依赖、运行测试、在本机编译协议核心，随后初始化证书并注册插件及后台服务。首次安装可能弹出 macOS 证书信任提示，请确认后继续。

请将仓库保存在固定位置，后台服务会使用该目录中的程序。

## 使用

1. 打开 Magpie，在 Agents 中选择 **Cursor · 私人桥接**。
2. 选择模型并连接。
3. 重启 Cursor，在模型菜单中选择对应的 Magpie 模型。
4. 开始对话；已有对话若仍使用 Auto，请手动切换模型。

查看连接状态：

```sh
npm run status
```

断开并恢复 Cursor 代理设置：

```sh
magpie cursor-private default
```

## 卸载

在仓库目录中执行：

```sh
node scripts/manage.js uninstall
magpie plugin rm "$PWD"
```

卸载会停用后台服务并恢复代理设置。本机配置、证书及其信任设置将保留。

## 配置与隐私

运行配置位于 `~/.config/magpie-cursor-private/`，由 Magpie 和后台服务管理。

| 路径 | 用途 |
| --- | --- |
| `connection.json` | Magpie 下发的连接信息 |
| `effective.json` | 协议核心使用的有效配置 |
| `status.json` | 当前连接状态 |
| `settings-journal.json` | Cursor 设置恢复记录 |
| `data/ca/` | 本机证书与私钥 |

配置中含有网关凭证和证书私钥，请勿分享或提交到 Git。会话保存在内存中，后台重启后可能需要新建对话。Cursor、Magpie 和模型服务各自的数据存储策略不受本插件控制。

安全机制与使用边界见 [SECURITY.md](SECURITY.md)。

## 开发

```sh
npm ci --ignore-scripts
npm test
npm run privacy
npm run build:native
```

```text
src/          插件入口、后台服务与配置处理
scripts/      安装、构建、管理与隐私检查
native/       协议核心补丁
tests/        自动化测试
licenses/     第三方许可证
```

构建产物输出到 `bin/`，校验信息写入 `integrity.json`，两者均不纳入版本管理。

## 常见问题

**连接后没有出现模型**

检查 Magpie 网关及后台状态，然后重启 Cursor 刷新模型菜单。

**状态显示 paused**

Cursor 代理设置可能被手动修改或由其他工具接管。排除冲突后，在 Magpie 中断开并重新连接。

**更新 Cursor 后无法使用**

Cursor 协议变更可能影响兼容性。目前已验证 3.27 系列的模型目录和文本请求链路，其他功能以实际使用结果为准。

## 许可证

[MIT](LICENSE)。第三方许可信息见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
