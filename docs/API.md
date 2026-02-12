# API 接口说明

## 1. 客户端身份校验（TMA）
所有用户接口必须携带 Telegram initData：
- Header: `x-telegram-init-data: <initData>`
- 或 URL Query: `?initData=...`

系统会校验 initData hash 与 auth_date（默认 24h 有效）。
所有用户端 POST 请求需携带 `x-nonce` 以防重放（前端已内置）。 

## 2. 管理端签名（HMAC）
管理接口使用签名校验：
- Headers：
  - `x-signature`
  - `x-timestamp` (秒级)
  - `x-nonce`
  - `x-admin-id`
- 签名计算：
  - payload = `${timestamp}.${nonce}.${METHOD}.${PATH}.${RAW_BODY}`
  - signature = HMAC_SHA256(payload, API_SIGNING_SECRET)

> 注意：签名接口都会进行 nonce 防重放校验。

## 3. 用户接口
- GET `/api/me`
- GET `/api/summary`
- POST `/api/checkin`
- GET `/api/exchanges`
- POST `/api/bindings`
- GET `/api/transactions?type=REBATE&limit=50`
- GET `/api/withdrawals`
- POST `/api/withdrawals`
- GET `/api/vip`
- POST `/api/community/vip-invite`

## 4. 管理接口
- GET `/api/admin/dashboard`
- GET `/api/admin/bindings?status=PENDING`
- POST `/api/admin/bindings/:id/approve`
- POST `/api/admin/bindings/:id/reject`
- GET `/api/admin/withdrawals?status=PENDING`
- POST `/api/admin/withdrawals/:id/approve`
- POST `/api/admin/withdrawals/:id/reject`
- POST `/api/admin/withdrawals/:id/paid`
- POST `/api/admin/import` (multipart/form-data, file)
- POST `/api/admin/settlements/run`
- GET `/api/admin/config`
- POST `/api/admin/config`
- GET `/api/admin/vip-configs`
- POST `/api/admin/vip-configs`
- GET `/api/admin/exchanges`
- POST `/api/admin/exchanges`
