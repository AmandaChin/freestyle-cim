# Skate CIM

轮滑鞋 C 端定制预览和 B 端配置管理演示。根目录是 C 端页面，`b-side/` 是本地演示用的配置管理页，其配置数据位于 `b-side/data/cim-config.js`。ESA Pages 生产包只发布 C 端页面和运行资源；B 端管理页依赖本地 Node 后端，不属于当前 ESA 部署能力。

## 当前版本

- 当前版本：`0.1.3`
- 版本入口：`version.js`
- C 端缓存版本：`index.html` 中的 `styles.css?v=20260526-confirmation-email-v1`、`version.js?v=20260526-confirmation-email-v1` 和 `app.js?v=20260526-confirmation-email-v1`

升级版本时，需要同步更新：

1. `version.js` 里的 `window.SKATE_CIM_VERSION` 和 `window.SKATE_CIM_RELEASE`
2. `index.html` 里根目录 C 端 CSS / JS 的查询参数
3. 本 README 的版本迭代记录

## 本地预览

```bash
python3 -m http.server 8081
```

打开 `http://127.0.0.1:8081/` 预览 C 端定制页。

## 确认单邮件

本地默认使用 `EMAIL_TRANSPORT=outbox`，只会把确认单邮件写入 `.local-data/outbox`，不会真实发信。

接入 Resend 后本地服务可切到真实发送：

```bash
EMAIL_TRANSPORT=resend
CONFIRMATION_EMAIL_TO=orders@example.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM="Skate CIM <orders@your-domain.com>"
```

`CONFIRMATION_EMAIL_TO` 是项目级收件邮箱，线上必须按实际订单接收邮箱配置；客户在确认单里填写的邮箱如果格式合法，会和项目邮箱一起收到确认单，如果格式不合法则只发项目邮箱，不阻断提交。`RESEND_FROM` 必须使用已在 Resend 完成验证的域名邮箱。`RESEND_API_KEY` 只能放在本地环境变量或云端函数密钥，不要提交到仓库。

## 阿里云 ESA Pages 部署

仓库根目录的 `esa.jsonc` 是 ESA Pages 的构建配置。绑定 GitHub 仓库后，将生产分支设为 `main`；ESA 按配置执行 `npm run build:esa`，并发布生成的 `dist/`。构建脚本只收集 C 端页面和运行资源，不把本地 Node 服务、测试文件或 B 端管理界面上传为公开静态资源。

`functions/esa-entry.js` 是 ESA 边缘函数入口。静态资源由 Pages 直接返回，未命中的 `/api/public/confirmation-email` 由边缘函数处理并调用 Resend。部署后在 ESA 函数环境变量中配置：

- `CONFIRMATION_EMAIL_TO`：项目订单收件邮箱
- `RESEND_FROM`：Resend 已验证域名的发件邮箱，例如 `Skate CIM <orders@your-domain.com>`
- `RESEND_API_KEY`：Resend API 密钥，作为加密变量或 Secret 保存

当前 B 端 `/b-side/` 配置页依赖 `server/local-server.mjs` 和本地后端接口，ESA 包会有意排除该管理页。要在线启用 B 端登录、草稿保存和发布，还需要单独实现并部署带持久化存储的管理 API；不能把本地 Node/SQLite 后端直接部署为 ESA Pages 静态资源。

邮件发送失败时，先在浏览器 Network 中检查 `/api/public/confirmation-email` 的状态码和响应 JSON，再查看 ESA 函数日志中的 `[confirmation-email]`。`400` 通常表示请求内容或邮箱格式有误；`405` 表示请求方法不是 POST；`500` 通常表示收件邮箱或 Resend 环境变量缺失；Resend 返回的错误状态和消息会回传给调用方。

## C 端多语言

C 端页面支持中文 / English 切换，入口是顶部 `EN` / `中` 按钮，当前语言会保存在浏览器 `localStorage` 的 `SKATE_CIM_LANGUAGE`。

多语言资源不要直接写死在 `app.js`：

- 页面通用文案维护在 `i18n/c-side-copy.js` 的 `window.SKATE_CIM_I18N`
- C 端内置产品补充文案维护在 `i18n/c-side-copy.js` 的 `window.SKATE_CIM_PRODUCT_COPY`
- B 端配置或 schema 后续可直接使用 `{ zh: "中文", en: "English" }` 结构，C 端会按当前语言读取，并兼容旧的纯字符串字段

## 版本迭代

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| `0.1.3` | 2026-05-26 | 确认流程改为手机端快速确认卡，完整生产单支持通过 Resend 发送到工程配置邮箱；客户邮箱、特殊定制附图、发送中/失败提示、必填校验和移动端输入稳定性同步完善。 |
| `0.1.2` | 2026-05-24 | 个人信息表单新增电话字段，确认单同步展示客户电话，方便后续沟通和交付核对。 |
| `0.1.1` | 2026-05-18 | 效果确认页使用 Canvas 生成静态 PNG 快照，确认单复用三视角 PNG 效果图，返回表单后再次确认会重新生成快照，降低手机端进入预览时重载回首页的风险。 |
| `0.1.0` | 2026-05-18 | 替换公司 Logo；首页及介绍页新增真实产品图片轮播；确认单改为三视角效果图；更新正面裁片贴图(base/C2/I)；移除鞋眼(Eyelets)定制选项，改用 base 固有效果。 |
| `0.0.9` | 2026-05-18 | C 端导出改为 HTML 确认单，内嵌最终鞋子效果 UI、配色表格、特殊定制信息和上传参考图，并支持浏览器打印 / 另存 PDF。 |
| `0.0.8` | 2026-05-18 | C 端裁片选择栏移除裁片缩略图，仅保留名称和颜色预览，编号保留在按钮提示中。 |
| `0.0.7` | 2026-05-18 | 主定制页鞋图按预览容器宽高动态缩放；确认鞋子效果页收紧预览图和缩略图边界；返回表单固定回到确认流程上一层。 |
| `0.0.5` | 2026-05-17 | C 端确认页改为先填写定制表单，再确认鞋子效果 UI；特殊定制的电绣/Logo 项支持上传图片缩略图，确认表导出补充图片文件名和大小。 |
| `0.0.4` | 2026-05-17 | 移动端颜色侧栏保持 30% 宽度，不再覆盖主 UI 区；修复 30% 侧栏内颜色区与材质区重叠、PC 端防磨片颜色选项过大并压住材质标题的问题。 |
| `0.0.3` | 2026-05-17 | C 端定制页裁片点选态改为外侧渐变模糊描边，避免影响裁片自身颜色和材质；修复 PC 端鞋图点击命中、空白区关闭侧边栏并清除点选态。 |
| `0.0.2` | 2026-05-16 | C 端定制页响应式重设计：三层横向布局、30% 侧栏、侧栏关闭后主图区域扩展、底部裁片 rail、点击鞋图裁片切换编辑对象、颜色/布料区域内部滚动。 |
| `0.0.1` | 2026-05-11 | 初始静态版本：提供 C 端轮滑鞋定制预览、B 端配置管理基础能力、发布态配置读取和定制确认表导出流程。 |
