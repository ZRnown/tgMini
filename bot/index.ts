import dotenv from "dotenv"
import { Bot, InlineKeyboard, Keyboard } from "grammy"

dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local", override: true })

const start = async () => {
  const { env } = await import("../server/env")
  const { prisma } = await import("../server/prisma")
  const { getDashboard } = await import("../server/services/dashboard")
  const { approveBinding, rejectBinding } = await import("../server/services/binding")
  const { approveWithdrawal, rejectWithdrawal, markWithdrawalPaid } = await import("../server/services/withdrawal")
  const { setConfig } = await import("../server/services/config")
  const { settleDueRebates } = await import("../server/services/settlement")
  const { syncWeexTradesFromBridge } = await import("../server/services/weex-sync")

  const adminBotToken = env.adminBotToken || env.botToken
  if (!adminBotToken || adminBotToken.includes("REPLACE_ME") || !adminBotToken.includes(":")) {
    console.error("ADMIN_BOT_TOKEN 未配置或无效，请在 .env.local 中填写真实的 Telegram Bot Token。")
    process.exit(1)
  }

  if (!env.adminBotToken || env.adminBotToken === env.botToken) {
    console.warn("建议使用独立的 ADMIN_BOT_TOKEN 管理机器人，避免与用户机器人冲突。")
  }

  const bot = new Bot(adminBotToken)

  const isAdmin = (userId?: number | string) => {
    if (!userId) return false
    return env.adminIds.includes(Number(userId))
  }

  bot.use(async (ctx, next) => {
    if (!isAdmin(ctx.from?.id)) {
      return ctx.reply("仅管理员可使用此机器人。")
    }
    await next()
  })

  const replyKeyboard = new Keyboard()
    .text("📊 数据看板")
    .text("📌 待审核绑定")
    .row()
    .text("💸 待处理提现")
    .text("⚙️ 配置管理")
    .row()
    .text("👑 VIP 配置")
    .text("🧾 结算返佣")
    .resized()

  const panelKeyboard = new InlineKeyboard()
    .text("数据看板", "admin:dashboard")
    .text("待审核绑定", "admin:bindings")
    .row()
    .text("待处理提现", "admin:withdrawals")
    .text("配置管理", "admin:config:menu")
    .row()
    .text("VIP 配置", "admin:vip:menu")
    .text("结算返佣", "admin:settle")

  const configKeyboard = new InlineKeyboard()
    .text("公群·公告频道", "admin:config:set:PUBLIC_GROUP_ANNOUNCE_URL")
    .row()
    .text("公群·新手指南", "admin:config:set:PUBLIC_GROUP_GUIDE_URL")
    .row()
    .text("公群·反馈建议", "admin:config:set:PUBLIC_GROUP_FEEDBACK_URL")
    .row()
    .text("聚合群机器人", "admin:config:set:COMMUNITY_BOT_URL")
    .row()
    .text("联系客服机器人", "admin:config:set:SUPPORT_BOT_URL")
    .row()
    .text("Binance桥接地址", "admin:config:set:BINANCE_BRIDGE_URL")
    .row()
    .text("Binance桥接令牌", "admin:config:set:BINANCE_BRIDGE_TOKEN")
    .row()
    .text("OKX桥接地址", "admin:config:set:OKX_BRIDGE_URL")
    .row()
    .text("OKX桥接令牌", "admin:config:set:OKX_BRIDGE_TOKEN")
    .row()
    .text("Bitget桥接地址", "admin:config:set:BITGET_BRIDGE_URL")
    .row()
    .text("Bitget桥接令牌", "admin:config:set:BITGET_BRIDGE_TOKEN")
    .row()
    .text("Gate桥接地址", "admin:config:set:GATE_BRIDGE_URL")
    .row()
    .text("Gate桥接令牌", "admin:config:set:GATE_BRIDGE_TOKEN")
    .row()
    .text("Weex桥接地址", "admin:config:set:WEEX_BRIDGE_URL")
    .row()
    .text("Weex桥接令牌", "admin:config:set:WEEX_BRIDGE_TOKEN")
    .row()
    .text("查看当前配置", "admin:config:list")

  const pendingConfig = new Map<number, string>()
  const pendingBindReject = new Map<number, string>()
  const pendingWithdrawReject = new Map<number, string>()
  const pendingWithdrawPaid = new Map<number, string>()
  const pendingVipInput = new Map<number, boolean>()
  const cancelInlineKeyboard = new InlineKeyboard().text("取消操作", "admin:cancel")

  const handleDashboard = async (ctx: any) => {
    const data = await getDashboard()
    return ctx.reply(
      `今日交易量：${data.todayTradeVolume}\n待审核绑定：${data.pendingBindings}\n待处理提现：${data.pendingWithdrawals}`
    )
  }

  const handleBindings = async (ctx: any) => {
    const list = await prisma.userBinding.findMany({
      where: { status: "PENDING" },
      take: 10,
      orderBy: { submitTime: "asc" },
      include: { user: true, exchange: true },
    })
    if (list.length === 0) return ctx.reply("暂无待审核绑定")

    for (const item of list) {
      await ctx.reply(
        `ID: ${item.id}\n用户: ${item.userId} (${item.user.username ?? "-"})\n交易所: ${item.exchange.name}\nUID: ${item.uid}`,
        {
          reply_markup: new InlineKeyboard()
            .text("通过", `admin:bind:approve:${item.id}`)
            .text("拒绝", `admin:bind:reject:${item.id}`),
        }
      )
    }
    return
  }

  const handleWithdrawals = async (ctx: any) => {
    const list = await prisma.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      take: 10,
      orderBy: { requestedAt: "asc" },
      include: { user: true },
    })
    if (list.length === 0) return ctx.reply("暂无待处理提现")

    for (const item of list) {
      await ctx.reply(
        `ID: ${item.id}\n用户: ${item.userId} (${item.user.username ?? "-"})\n金额: ${Number(item.amount).toFixed(2)}\n地址: ${item.address}`,
        {
          reply_markup: new InlineKeyboard()
            .text("通过", `admin:withdraw:approve:${item.id}`)
            .text("拒绝", `admin:withdraw:reject:${item.id}`)
            .row()
            .text("标记已打款", `admin:withdraw:paid:${item.id}`),
        }
      )
    }
    return
  }

  const handleConfigList = async (ctx: any) => {
    const list = await prisma.config.findMany({ orderBy: { key: "asc" } })
    if (list.length === 0) return ctx.reply("暂无配置")
    return ctx.reply(list.map((item) => `${item.key}=${item.value}`).join("\n"))
  }

  const handleWeexSync = async (ctx: any) => {
    try {
      const result = await syncWeexTradesFromBridge()
      const previewErrors = result.errors.slice(0, 3)
      const errorText = previewErrors.length ? `\n错误示例:\n${previewErrors.join("\n")}` : ""
      return ctx.reply(
        `交易所同步完成\n拉取: ${result.pulled}\n入库: ${result.inserted}\n跳过: ${result.skipped}${errorText}`
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return ctx.reply(`交易所同步失败：${message}`)
    }
  }

  bot.hears("📊 数据看板", handleDashboard)
  bot.hears("📌 待审核绑定", handleBindings)
  bot.hears("💸 待处理提现", handleWithdrawals)
  bot.hears("⚙️ 配置管理", (ctx) => ctx.reply("请选择要配置的项目：", { reply_markup: configKeyboard }))
  bot.hears("👑 VIP 配置", async (ctx) => {
    const list = await prisma.vipConfig.findMany({ orderBy: { level: "asc" } })
    const text = list.length
      ? list
          .map(
            (item) =>
              `等级 ${item.level}: ${item.name} | 最低积分 ${item.minPoints} | 返佣加成 ${Number(item.rebateRatioBonus)}`
          )
          .join("\n")
      : "暂无 VIP 配置"
    return ctx.reply(text, {
      reply_markup: new InlineKeyboard().text("设置等级", "admin:vip:set").text("返回", "admin:panel"),
    })
  })
  bot.hears("🧾 结算返佣", async (ctx) => {
    const result = await settleDueRebates()
    return ctx.reply(`已结算 ${result.settledCount} 笔，合计 ${result.totalAmount.toFixed(2)}`)
  })

  bot.callbackQuery("admin:dashboard", async (ctx) => {
    await ctx.answerCallbackQuery()
    return handleDashboard(ctx)
  })
  bot.callbackQuery("admin:bindings", async (ctx) => {
    await ctx.answerCallbackQuery()
    return handleBindings(ctx)
  })
  bot.callbackQuery("admin:withdrawals", async (ctx) => {
    await ctx.answerCallbackQuery()
    return handleWithdrawals(ctx)
  })
  bot.callbackQuery("admin:panel", async (ctx) => {
    await ctx.answerCallbackQuery()
    return ctx.reply("快捷面板", { reply_markup: panelKeyboard })
  })
  bot.callbackQuery("admin:config:menu", async (ctx) => {
    await ctx.answerCallbackQuery()
    return ctx.reply("请选择要配置的项目：", { reply_markup: configKeyboard })
  })
  bot.callbackQuery("admin:config:list", async (ctx) => {
    await ctx.answerCallbackQuery()
    return handleConfigList(ctx)
  })
  bot.callbackQuery(/admin:config:set:(.+)/, async (ctx) => {
    const key = ctx.match?.[1] ?? ""
    if (!key) return ctx.answerCallbackQuery()
    pendingConfig.set(Number(ctx.from?.id), key)
    await ctx.answerCallbackQuery()
    return ctx.reply(
      `请发送新的配置值：${key}\n支持链接或文本，可点击“取消操作”退出。`,
      { reply_markup: cancelInlineKeyboard }
    )
  })
  bot.callbackQuery("admin:vip:menu", async (ctx) => {
    await ctx.answerCallbackQuery()
    const list = await prisma.vipConfig.findMany({ orderBy: { level: "asc" } })
    const text = list.length
      ? list
          .map(
            (item) =>
              `等级 ${item.level}: ${item.name} | 最低积分 ${item.minPoints} | 返佣加成 ${Number(item.rebateRatioBonus)}`
          )
          .join("\n")
      : "暂无 VIP 配置"
    return ctx.reply(text, {
      reply_markup: new InlineKeyboard().text("设置等级", "admin:vip:set").text("返回", "admin:panel"),
    })
  })
  bot.callbackQuery("admin:vip:set", async (ctx) => {
    await ctx.answerCallbackQuery()
    pendingVipInput.set(Number(ctx.from?.id), true)
    return ctx.reply(
      "请输入：等级 名称 最低积分 返佣比例\n示例：3 黄金 3000 0.2",
      { reply_markup: cancelInlineKeyboard }
    )
  })
  bot.callbackQuery("admin:settle", async (ctx) => {
    await ctx.answerCallbackQuery()
    const result = await settleDueRebates()
    return ctx.reply(`已结算 ${result.settledCount} 笔，合计 ${result.totalAmount.toFixed(2)}`)
  })
  bot.callbackQuery("admin:weex:sync", async (ctx) => {
    await ctx.answerCallbackQuery()
    return handleWeexSync(ctx)
  })

  bot.callbackQuery(/admin:bind:approve:(.+)/, async (ctx) => {
    const id = ctx.match?.[1]
    if (!id) return ctx.answerCallbackQuery()
    await approveBinding(id, BigInt(ctx.from?.id ?? 0))
    await ctx.answerCallbackQuery()
    return ctx.reply("已通过绑定")
  })
  bot.callbackQuery(/admin:bind:reject:(.+)/, async (ctx) => {
    const id = ctx.match?.[1]
    if (!id) return ctx.answerCallbackQuery()
    pendingBindReject.set(Number(ctx.from?.id), id)
    await ctx.answerCallbackQuery()
    return ctx.reply("请输入拒绝原因：", { reply_markup: cancelInlineKeyboard })
  })

  bot.callbackQuery(/admin:withdraw:approve:(.+)/, async (ctx) => {
    const id = ctx.match?.[1]
    if (!id) return ctx.answerCallbackQuery()
    await approveWithdrawal(id, BigInt(ctx.from?.id ?? 0))
    await ctx.answerCallbackQuery()
    return ctx.reply("已通过提现审核")
  })
  bot.callbackQuery(/admin:withdraw:reject:(.+)/, async (ctx) => {
    const id = ctx.match?.[1]
    if (!id) return ctx.answerCallbackQuery()
    pendingWithdrawReject.set(Number(ctx.from?.id), id)
    await ctx.answerCallbackQuery()
    return ctx.reply("请输入拒绝原因：", { reply_markup: cancelInlineKeyboard })
  })
  bot.callbackQuery(/admin:withdraw:paid:(.+)/, async (ctx) => {
    const id = ctx.match?.[1]
    if (!id) return ctx.answerCallbackQuery()
    pendingWithdrawPaid.set(Number(ctx.from?.id), id)
    await ctx.answerCallbackQuery()
    return ctx.reply("请输入转账 TxHash：", { reply_markup: cancelInlineKeyboard })
  })
  bot.callbackQuery("admin:cancel", async (ctx) => {
    pendingConfig.delete(Number(ctx.from?.id))
    pendingBindReject.delete(Number(ctx.from?.id))
    pendingWithdrawReject.delete(Number(ctx.from?.id))
    pendingWithdrawPaid.delete(Number(ctx.from?.id))
    pendingVipInput.delete(Number(ctx.from?.id))
    await ctx.answerCallbackQuery()
    return ctx.reply("已取消操作。", { reply_markup: replyKeyboard })
  })

  bot.on("message:text", async (ctx, next) => {
    const pendingKey = pendingConfig.get(Number(ctx.from?.id))
    const text = ctx.message.text.trim()
    if (text === "取消" || text === "❌ 取消操作") {
      pendingConfig.delete(Number(ctx.from?.id))
      pendingBindReject.delete(Number(ctx.from?.id))
      pendingWithdrawReject.delete(Number(ctx.from?.id))
      pendingWithdrawPaid.delete(Number(ctx.from?.id))
      pendingVipInput.delete(Number(ctx.from?.id))
      return ctx.reply("已取消操作。", { reply_markup: replyKeyboard })
    }

    if (pendingKey) {
      pendingConfig.delete(Number(ctx.from?.id))
      await setConfig(pendingKey, text)
      return ctx.reply(`已更新 ${pendingKey}`, { reply_markup: replyKeyboard })
    }

    const pendingBindId = pendingBindReject.get(Number(ctx.from?.id))
    if (pendingBindId) {
      pendingBindReject.delete(Number(ctx.from?.id))
      await rejectBinding(pendingBindId, BigInt(ctx.from?.id ?? 0), text)
      return ctx.reply("已拒绝绑定", { reply_markup: replyKeyboard })
    }

    const pendingWithdrawId = pendingWithdrawReject.get(Number(ctx.from?.id))
    if (pendingWithdrawId) {
      pendingWithdrawReject.delete(Number(ctx.from?.id))
      await rejectWithdrawal(pendingWithdrawId, BigInt(ctx.from?.id ?? 0), text)
      return ctx.reply("已拒绝提现", { reply_markup: replyKeyboard })
    }

    const pendingPaidId = pendingWithdrawPaid.get(Number(ctx.from?.id))
    if (pendingPaidId) {
      pendingWithdrawPaid.delete(Number(ctx.from?.id))
      await markWithdrawalPaid(pendingPaidId, BigInt(ctx.from?.id ?? 0), text)
      return ctx.reply("提现已标记为完成", { reply_markup: replyKeyboard })
    }

    const vipInput = pendingVipInput.get(Number(ctx.from?.id))
    if (vipInput) {
      pendingVipInput.delete(Number(ctx.from?.id))
      const [levelRaw, name, minPointsRaw, bonusRaw] = text.split(/\s+/)
      if (!levelRaw || !name || !minPointsRaw || !bonusRaw) {
        return ctx.reply("格式错误：等级 名称 最低积分 返佣比例", { reply_markup: replyKeyboard })
      }
      const level = Number(levelRaw)
      const minPoints = Number(minPointsRaw)
      const rebateRatioBonus = Number(bonusRaw)
      if (!Number.isFinite(level) || !Number.isFinite(minPoints) || !Number.isFinite(rebateRatioBonus)) {
        return ctx.reply("请输入有效数字：等级/最低积分/返佣比例", { reply_markup: replyKeyboard })
      }
      await prisma.vipConfig.upsert({
        where: { level },
        create: { level, name, minPoints, rebateRatioBonus },
        update: { name, minPoints, rebateRatioBonus },
      })
      return ctx.reply("已更新 VIP 配置", { reply_markup: replyKeyboard })
    }

    await next()
    return ctx.reply("管理菜单", { reply_markup: replyKeyboard })
  })

  bot.start()
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})
