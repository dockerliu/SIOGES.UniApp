# SIOGES UniApp 点餐客户端

Vue 3、TypeScript、Pinia 的 UniApp CLI 项目，包含桌态、点餐、订单和我的四个移动端 Tab。点餐页按参考图采用左侧分类、右侧菜品列表和底部购物栏布局。
本项目需要配合后端使用：[SIOGES API地址](https://github.com/dockerliu/SIOGES.Api)

## H5 预览

1. 在 HBuilderX 导入 `SIOGES.UniApp` 目录，或在项目目录运行 `npm install`。
2. 启动 SIOGES.Api，使 `http://localhost:5000/health` 返回 `connected: true`。
3. 运行 `npm run dev:h5`，打开 Vite 输出的地址；首页为 `#/pages/index/index`。
4. 在桌态选择空闲桌后进入点餐页。可通过“我的”修改中间件地址并重新测试连通性。

若在手机或其他电脑预览，将中间件地址设为运行 API 的 Windows 主机局域网 IP，例如 `http://192.168.1.20:5000`，并确保 Windows 防火墙允许 TCP 5000 入站。浏览器预览还需 API CORS 放行对应 origin。

## 页面与状态

- `src/pages/index/index.vue`：按厅房展示桌态，空闲桌开始点餐，占用桌可继续加菜或查看当前设备的订单页。
- `src/pages/menu/index.vue`：按桌读取适用菜单及价格，支持搜索、分类、规格/备注、购物车和送单。
- `src/pages/order/index.vue`：读取 `GET /api/v1/orders`，显示所有当前未结票据及其菜品明细，支持按票催菜和换台；每 20 秒刷新。该列表以 SIOGES 的未结状态为准，不包含已结账历史票据。
- `src/pages/user/index.vue`：使用 SIOGES 启用店员工号和密码登录，管理会话、API 地址、连通性测试和菜单缓存。
- `src/stores/cart.ts`：购物车、规格选择、金额计算和订单幂等提交。
- `src/stores/auth.ts`：持久化中间件地址和本地店员信息。
- `src/api/request.ts`：基于 `uni.request` 统一处理请求和错误。
- `src/pages.json`：注册四个 Tab 页面，并保留旧的桌态和连接设置路径。

登录由 `POST /api/v1/auth/login` 校验 `ts_Usuarios` 中的启用账号并签发 12 小时内存会话；Token 保存在本机，密码不会保存。订单列表、送单、催菜和换台 API 要求 Bearer Token。API 重启后会话失效，需要重新登录。

## 后端 API

点餐菜单请求带 `zone_id`、`table_id` 和 `lang=zh`，使用 API 返回的桌价、税率和含税标记；下单调用 `POST /api/v1/orders`，并以 `client_order_no` 防止网络重试造成重复送单。订单页通过 `GET /api/v1/orders` 查询所有当前未结票据；催菜和换台分别调用 `/api/v1/orders/{id}/urgente` 与 `/api/v1/tables/transfer`。
