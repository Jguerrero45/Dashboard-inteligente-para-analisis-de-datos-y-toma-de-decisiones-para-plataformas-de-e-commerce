"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

type Currency = "USD" | "VES"

interface CurrencyStore {
  currency: Currency
  exchangeRate: number
  setCurrency: (currency: Currency) => void
  toggleCurrency: () => void
  setExchangeRate: (rate: number) => void
  formatPrice: (amount: number) => string
  convertPrice: (amount: number, from: Currency) => number
}

export const useCurrency = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: "USD",
      exchangeRate: 36.5, // Tasa de cambio USD a VES (ejemplo)
      setCurrency: (currency) => set({ currency }),
      toggleCurrency: () =>
        set((state) => ({
          currency: state.currency === "USD" ? "VES" : "USD",
        })),
      setExchangeRate: (rate) => set({ exchangeRate: rate }),
      formatPrice: (amount) => {
        const { currency, exchangeRate } = get()
        const value = currency === "VES" ? amount * exchangeRate : amount

        // Usar formato localizado en español para todas las monedas
        if (currency === "USD") {
          return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "USD",
          }).format(value)
        } else {
          return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 2,
          }).format(value)
        }
      },
      convertPrice: (amount, from) => {
        const { currency, exchangeRate } = get()
        if (from === currency) return amount
        if (from === "USD" && currency === "VES") return amount * exchangeRate
        if (from === "VES" && currency === "USD") return amount / exchangeRate
        return amount
      },
    }),
    {
      name: "currency-storage",
    },
  ),
)
