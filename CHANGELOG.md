# Changelog

## 1.0.1 — 2026-11-07

- 保留内存数据库连接，关闭连接空闲回收和最长存活时间，修复后台长期运行后模型目录和对话请求返回 `no such table: model_configs` 的问题。
- 增加数据库可用性检查，使异常的协议核心能退出并由后台重新启动。
- 增加内存连接池生命周期及模型目录保留的回归测试。

2026-11-09 追加（1.0.1 当时尚未发布，故并入本版本）：

- 兼容 Cursor 3.29.9 的 BidiAppend `data_binary` 字段：Cursor 从 hex 字符串 `data`(tag 1) 改为原始 protobuf 字节 `data_binary`(tag 4)，旧版协议核心会在解析阶段返回 `invalid_argument`，表现为发消息后一直等待、Magpie 收不到任何调用。现在优先解码 `data_binary`，旧版 hex `data` 保留为回退。
- 冒烟测试默认构造新格式，`PRIVATE_BRIDGE_SMOKE_HEX=1` 可验证旧格式回退；已在 3.29.9 上完成两种格式的端到端验证。
- 更新 `native/bridge.patch`（14 个文件）。
