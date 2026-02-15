# Weex 桥接同步协议

当前项目不会直接调用交易所官方接口，而是调用“外部机器人提供的桥接接口”。
你可以在同一个桥接机器人里配置 5 个交易所（Binance / OKX / Bitget / Gate.io / Weex），
本项目只负责拉取标准化结果并入库。

## 配置项

可在管理机器人里设置：

- `BINANCE_BRIDGE_URL` / `BINANCE_BRIDGE_TOKEN`
- `OKX_BRIDGE_URL` / `OKX_BRIDGE_TOKEN`
- `BITGET_BRIDGE_URL` / `BITGET_BRIDGE_TOKEN`
- `GATE_BRIDGE_URL` / `GATE_BRIDGE_TOKEN`
- `WEEX_BRIDGE_URL` / `WEEX_BRIDGE_TOKEN`

说明：
- 推荐为每个交易所配置独立桥接地址与令牌。
- 若未配置任何交易所专属键，会回退到旧的 `WEEX_BRIDGE_URL` / `WEEX_BRIDGE_TOKEN`。

## 请求方式

- Method: `GET`
- Headers:
  - `Accept: application/json`
  - `Authorization: Bearer <WEEX_BRIDGE_TOKEN>`
- Query:
  - `from`（可选，ISO 字符串）
  - `to`（可选，ISO 字符串）

## 响应格式

```json
{
  "rows": [
    {
      "exchange": "binance",
      "uid": "10001",
      "tradeDate": "2026-02-01T08:00:00.000Z",
      "tradeVolume": "1234.56",
      "baseFeeRate": "0.001",
      "autoRebate": "2.4"
    }
  ]
}
```

## 字段说明

- `exchange`（可选）：`binance` / `okx` / `bitget` / `gate` / `gate.io` / `weex`
  - 不传时默认按 `Weex` 处理
- `uid`：用户 UID（会和已审核绑定的 UID 对应）
- `tradeDate`：支持 ISO 时间 / 毫秒时间戳 / 秒级时间戳
- `tradeVolume`：交易量
- `baseFeeRate`：基础费率（如 `0.001`）
- `autoRebate`（可选）：自动返佣

本项目会根据 `exchange` 自动映射为标准名称后落库。
