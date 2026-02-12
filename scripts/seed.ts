import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local", override: true })

const prisma = new PrismaClient()

const main = async () => {
  await prisma.vipConfig.createMany({
    data: [
      { level: 1, name: "青铜", minPoints: 0, rebateRatioBonus: 0.1 },
      { level: 2, name: "白银", minPoints: 1000, rebateRatioBonus: 0.15 },
      { level: 3, name: "黄金", minPoints: 3000, rebateRatioBonus: 0.2 },
      { level: 4, name: "钻石", minPoints: 8000, rebateRatioBonus: 0.25 },
    ],
    skipDuplicates: true,
  })

  await prisma.exchange.createMany({
    data: [
      { name: "Binance" },
      { name: "OKX" },
      { name: "Bitget" },
      { name: "Gate.io" },
      { name: "Weex" },
    ],
    skipDuplicates: true,
  })

  console.log("Seed completed")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
