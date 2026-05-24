# Skate CIM 本地 B 端后台闭环

## 启动

```bash
npm run dev
```

- C 端：`http://127.0.0.1:8082/`
- B 端：`http://127.0.0.1:8082/b-side/`
- 默认管理员：`admin@skate-cim.local / admin123`

## 当前本地闭环

1. B 端必须先登录，未知邮箱无法进入。
2. B 端读取本地 SQLite 里的草稿配置。
3. B 端编辑鞋款、布料、发布状态后会保存到草稿配置。
4. 发布正式版本后，服务端生成公开配置快照。
5. C 端启动时读取 `/api/public/config`，使用已发布鞋款元信息。

## 本地数据

- SQLite：`.local-data/skate-cim.db`
- 发布快照：`.local-data/releases/published-config.json`
- 上传目录预留：`.local-data/uploads/`

## 后续上云替换点

- `.local-data/uploads/` 替换为 OSS。
- `/assets/` 静态路径替换为 CDN 域名。
- SQLite 可继续部署到轻量服务器，或迁移到云数据库。
- `server/local-server.mjs` 前面加 Nginx HTTPS 反代。
