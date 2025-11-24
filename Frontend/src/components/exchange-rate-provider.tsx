import React, { useEffect, useRef } from "react"
import { useCurrency } from "@/hooks/use-currency"

const API_URL = "https://ve.dolarapi.com/v1/dolares/oficial"
const ONE_HOUR = 1000 * 60 * 60

export const ExchangeRateProvider: React.FC = () => {
    const setExchangeRate = useCurrency((s) => s.setExchangeRate)
    const mounted = useRef(false)

    useEffect(() => {
        mounted.current = true

        const fetchRate = async () => {
            try {
                const resp = await fetch(API_URL)
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
                const data = await resp.json()
                // API returns { promedio: number, ... }
                const promedio = data?.promedio
                if (typeof promedio === "number" && !Number.isNaN(promedio)) {
                    setExchangeRate(promedio)
                    // persist last fetched value in localStorage for quick startup
                    try {
                        localStorage.setItem("exchangeRate", String(promedio))
                        localStorage.setItem("exchangeRateLastFetched", new Date().toISOString())
                    } catch (e) {
                        // ignore storage errors
                    }
                }
            } catch (e) {
                // on error, try to read persisted rate from localStorage
                try {
                    const cached = localStorage.getItem("exchangeRate")
                    if (cached) setExchangeRate(Number(cached))
                } catch (err) {
                    // ignore
                }
            }
        }

        // Fetch immediately
        fetchRate()

        // Set interval to update every hour
        const id = setInterval(() => {
            if (!mounted.current) return
            fetchRate()
        }, ONE_HOUR)

        return () => {
            mounted.current = false
            clearInterval(id)
        }
    }, [setExchangeRate])

    return null
}

export default ExchangeRateProvider
