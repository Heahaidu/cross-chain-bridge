import { useState, useEffect } from "react"
import { convertKeysToCamelCase } from "./utils"
import { db } from "../app/firebase/client"
import { ref, get } from 'firebase/database'

export interface Token {
  symbol: string
  decimals: number
  iconUrl: string
  address: string
  poolAddress: string
}

export interface SupportedChain {
  chainId: number
  chainSelector: string
  name: string
  explorer: string
  chainSelectorName: string
  iconUrl: string
  router: string
  tokens: Token[]
}

export type SupportedChains = SupportedChain[]

export function useSupportedChains() {
  const [chains, setChains] = useState<SupportedChains>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadChains = async () => {
      try {
        setLoading(true)
        setError(null)

        const dataRef = ref(db, 'supported_chains')
        const snapshot = await get(dataRef)

        const data = snapshot.val()
        console.log(data)

        const camelCaseData = convertKeysToCamelCase<SupportedChains>(data)

        setChains(camelCaseData)

      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    loadChains()
  }, [])

  return { chains, loading, error }
}

