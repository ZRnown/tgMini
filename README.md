# Telegram TMA 返佣代理系统

本仓库包含 Telegram 小程序前端 + 后端 API + 管理机器人。后端基于 Next.js API Routes + Prisma + MySQL。

## 快速开始

1) 安装依赖
```
pnpm install
```

2) 配置环境
```
cp .env.example .env.local
```
填写数据库、BOT_TOKEN、ADMIN_TG_IDS、API_SIGNING_SECRET。开发环境可选配置 `DEV_TG_ID` 以绕过 Telegram initData 校验。

若需接入 Weex 返佣桥接同步，可额外配置：
- `BINANCE_BRIDGE_URL` / `BINANCE_BRIDGE_TOKEN`
- `OKX_BRIDGE_URL` / `OKX_BRIDGE_TOKEN`
- `BITGET_BRIDGE_URL` / `BITGET_BRIDGE_TOKEN`
- `GATE_BRIDGE_URL` / `GATE_BRIDGE_TOKEN`
- `WEEX_BRIDGE_URL` / `WEEX_BRIDGE_TOKEN`

若未配置交易所专属键，系统会回退使用 `WEEX_BRIDGE_URL` / `WEEX_BRIDGE_TOKEN`。

3) 初始化数据库
```
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
```

4) 启动开发环境
```
pnpm dev
```

5) 启动管理机器人
```
pnpm bot
```

## 目录结构
- `app/`：TMA 前端与 API Routes
- `server/`：服务层、鉴权、计算引擎
- `prisma/`：数据模型
- `bot/`：Telegram 管理机器人
- `docs/`：系统架构与 API 文档

## 安全说明
- 用户端依赖 Telegram initData 校验
- 管理端使用 HMAC 签名 + nonce 防重放

## 关键文档
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/WEEX_BRIDGE.md`
# tgMini
