# 系统架构设计说明（返佣代理系统）

## 1. 总览
本系统是基于 Telegram 小程序 (TMA) 的返佣代理中间件，负责连接交易者与平台代理商。用户通过平台代理链接注册交易所后产生交易手续费，平台将部分手续费以“积分/USDT 余额”形式返还给用户。

核心模块：
- 用户与身份体系（Telegram User ID 作为主键）
- 交易所绑定与审核
- 返佣计算引擎（T+1 结算）
- 提现审批流程（安全优先）
- 社群门槛与邀请
- 管理后台（报表导入、审核、资金管理）

## 2. 数据流（核心链路）
1) 用户进入 TMA → 通过 initData 验证身份 → 拉取用户信息与余额
2) 用户申请绑定交易所 → 状态进入 Pending → 管理员审核通过/拒绝
3) 每日导入交易所报表（CSV/XLSX）→ 生成交易日报 → 计算返佣（Manual）→ 创建 T+1 结算任务
4) 结算任务到期 → 自动入账 → 生成资金流水
5) 用户发起提现 → 冻结余额 → 管理员审核 → 人工打款 → 完成

## 3. 数据库结构（Prisma）
- Users：TG_ID, Username, Balance, Points, VIP_Level, Inviter_ID, checkIn
- Exchanges：Name, Icon, Reg_Link, Guide, Status
- User_Bindings：User_ID, Exchange_ID, UID, Status, Submit_Time, reviewed
- Transaction_Logs：Type, Amount, Balance_Delta, Points_Delta, Reference_ID
- VIP_Configs：Level, Name, Min_Points, Rebate_Ratio_Bonus
- Withdrawal_Requests：User_ID, Amount, Address, Status, Tx_Hash, Fee
- DailyTradeReport：交易日报（交易量、费率、自动/手动返佣）
- RebateSettlement：T+1 结算计划与执行状态
- Config：后台可配置项（最低提现、手续费、群链接）
- ReplayNonce：防重放记录

## 4. 返佣计算引擎（核心公式）
- 公式：`应发返佣 = (用户当日交易量 * 基础费率) * VIP 额外返佣比例`
- VIP 额外返佣比例来自 `VIP_Configs`，完全可配置，不写死
- 结算周期：T+1，系统自动创建 `RebateSettlement` 计划
- 交易所直返（Auto）仅展示，不进入系统余额（可扩展为可入账）

## 5. 绑定与审核
- 绑定状态机：Unbound → Pending → Verified / Rejected
- 支持自动审核开关（AUTO_BIND_APPROVE）
- 绑定与审核记录写入 User_Bindings

## 6. 提现流程（安全优先）
- 用户发起提现 → 扣除余额，冻结到账户 `balanceFrozen`
- 管理员审核 → 手工打款 → 标记完成
- 可配置 `MIN_WITHDRAWAL_AMOUNT` 与 `WITHDRAWAL_FEE`

## 7. 社群与门槛
- 普通群：展示静态链接
- VIP 群：满足 `is_verified_uid == true` 或 `total_trade_volume > X` 时生成邀请链接

## 8. 安全与风控
- TMA 身份验证：使用 Telegram initData 校验
- 管理端签名：HMAC + timestamp + nonce，防重放
- 所有资金变动接口必须通过签名验证

## 9. 通知
- 绑定通过 / 提现完成 / 审核结果等关键动作通过 Bot 推送给用户

## 10. 可扩展点
- 支持多交易所 API 拉取、自动导入
- 返佣规则可以扩展为阶梯费率、特殊活动
- 可增加后台任务调度（Cron）自动执行结算
