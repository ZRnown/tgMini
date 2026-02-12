import { Prisma } from "@prisma/client"

export const toDecimal = (value: number | string) => {
  if (value instanceof Prisma.Decimal) {
    return value
  }
  return new Prisma.Decimal(value)
}

export const toNumber = (value: Prisma.Decimal | number | string) => {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber()
  }
  return Number(value)
}
