# Magpie Cursor Bridge

在 macOS 上通过本机代理，把 Cursor 的 Agent 请求桥接到 Magpie 中配置的模型和路由组。

这个项目包含自己的 Magpie Agent 入口、后台管理与安全修改；Cursor 协议核心基于 MIT 开源 [cursor-byok](https://github.com/leookun/cursor-byok)，兼容性实现参考 [magpie-agent-cursor-bridge](https://github.com/nodlles/magpie-agent-cursor-bridge)。它不是从零重写的 Cursor 协议，也不承诺绝对安全。

## 工作方式

```text
Cursor
  → 需要随机凭证的本机代理
  → 带独立随机令牌的本机协议接口
  → Magpie 本机网关
  → 在 Magpie 中选择的模型
```

- 所有监听器仅绑定 `127.0.0.1`。
- 仅解密 `api2.cursor.sh`、`api3.cursor.sh`；其他域名走普通代理通道。
- 不读取 Cursor 登录数据库，不复制模型供应商密钥。接收的是 Magpie 提供的 Agent 网关密钥。
- Cursor 原有登录和 Tab 等功能仍可能访问 Cursor 官方服务。
- 会话和调用正文保存在内存 SQLite 中，后台退出后清除。Cursor、Magpie 和模型供应商自身的存储行为不受本项目控制。
- 断开或网关异常时尝试恢复 Cursor 设置；恢复保留无关修改，检测到手动代理修改会暂停接管。

## 安装

当前支持 **Apple Silicon macOS**。需要已安装 Cursor、Magpie、Node.js 22+、npm、Git、Rust stable 和 Xcode Command Line Tools。Cursor 需有可用登录，Magpie 需已配置可用模型。

```sh
git clone https://github.com/BuyudarenC/magpie-cursor-bridge.git
cd magpie-cursor-bridge
bash setup.sh
```

安装会先运行测试，从固定上游提交和 `Cargo.lock` 在本机编译协议核心，再生成本机 CA，并在必要时请求 macOS 信任。私钥不会上传。本项目不提供预编译二进制；请检查源码和证书提示后安装。

**必须把仓库保留在稳定位置**，后台会使用该目录。安装不会修改 Cursor 应用程序或系统代理。若此前运行其他 Cursor 桥接或 BYOK 接管，请先在原工具中断开并停用其后台，避免代理配置冲突。

在 Magpie 的 Agents 中选择 **Cursor · 私人桥接**，选择模型后连接，然后重启 Cursor。在 Cursor 模型菜单选择 Magpie 模型；已有聊天保存的 Auto 选择可能需要手动更改。

## 管理

```sh
node manage.js status
magpie cursor-private default   # 断开并恢复代理
node manage.js uninstall        # 断开并停用登录后台
magpie plugin rm "$PWD"         # 在仓库目录中移除插件注册
```

配置和状态位于 `~/.config/magpie-cursor-private/`，登录后台标签为 `local.magpie.cursor-private`。这些目录包含网关凭证和 CA 私钥，**不要分享或提交到仓库**。卸载保留本地配置和证书；不会自动删除用户历史数据或系统中的证书信任。

## 安全边界

- 移除了参考兼容补丁中的原始 Bidi 请求临时文件写入，原生网页缓存也被禁用。
- 代理需要随机 Basic 凭证，协议接口需要另一随机令牌；拒绝带 Origin 的请求。
- 网关仅允许数字回环地址 `/v1`，禁止重定向，模型目录刷新不会扩大 Agent 下发的允许集合。
- 原生 HTTP 客户端不继承系统代理，并禁止重定向；服务不记录会话正文。
- 配置目录使用 0700，包含凭证的配置和恢复日志使用 0600。启动前验证本机构建的程序摘要。
- **同一用户权限下的恶意程序仍可能读取配置、代理凭证或私钥。** 摘要校验不能抵御同时修改程序和摘要的攻击者。CA 信任本身具有安全影响。
- 会话保存在内存中，后台重启后旧对话续接不保证完整，必要时开新对话。

Cursor 的私有协议可能变化。目前验证过 3.27 系列的模型目录和 Bidi/RunSSE 文本链路；图片、多轮编辑及所有供应商的工具行为没有完整兼容性保证。详见 [SECURITY.md](SECURITY.md)。

## 开发

```sh
npm ci --ignore-scripts
npm test
npm run privacy
bash build.sh
```

```text
agent.js           # Magpie Agent 配置入口
service.js         # 后台生命周期和代理管理
settings.js        # JSONC 修改与恢复日志
config.js          # 网关和模型集合校验
manage.js          # launchd 安装、状态与停用
native.patch       # 固定上游上的全部核心修改，可直接审查
build.sh           # 固定提交校验和本机构建
setup.sh           # 显式安装和证书初始化
security.test.js   # 网关边界及设置恢复测试
privacy-check.mjs  # 发布前检查敏感文件和常见凭证模式
```

上游固定提交：`2068ab20513288e6a0289d33febe872a30608610`。第三方许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
