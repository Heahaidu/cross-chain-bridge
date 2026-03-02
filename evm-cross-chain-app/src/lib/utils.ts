import { type ClassValue, clsx } from "clsx"
import { type } from "os";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts snake_case keys to camelCase
 * Example: "pool_address" -> "poolAddress", "chain_id" -> "chainId"
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively converts all object keys from snake_case to camelCase
 * 
 * Example usage:
 * const jsonData = { "chain_id": 1, "pool_address": "0x..." }
 * const camelCaseData = convertKeysToCamelCase(jsonData)
 * // Result: { "chainId": 1, "poolAddress": "0x..." }
 */
export function convertKeysToCamelCase<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item)) as T;
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = toCamelCase(key);
        newObj[camelKey] = convertKeysToCamelCase(obj[key]);
      }
    }
    return newObj as T;
  }

  return obj;
}

export function shortenString(s: string, length: number): string {
  return normalizeNumericString(s.substring(0, length))
}

export function shortenAddr(s: string): string {
  return `${s.substring(0, 6)}...${s.substring(s.length - 6, s.length)}`
}

export async function getEtherPrice() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    )

    if (!response.ok) {
      return 0
    }

    const data = await response.json()
    return data.ethereum.usd
  } catch (error) {
    return 0
  }
}

export function normalizeNumericString(numStr: string | number) {
  if (typeof numStr !== 'string') {
    throw new Error('Input must be a string');
  }

  let normalized = numStr.replace(/^0+(\d)/, '\$1');

  if (normalized.includes('.')) {
    normalized = normalized.replace(/(\.\d*[1-9])0+$/, '\$1'); 
    normalized = normalized.replace(/\.0+$/, ''); 
  }

  return normalized || '0';
}

export function convertBigIntToString<T>(obj: any): any {
  if (typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = convertBigIntToString(obj[key])
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }

  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  return obj
}

export async function getTokenMetadata(chainSelectorName: string, tokenAddress: string): Promise<any> {
  try {
      const response = await fetch(`/api/ccip/token?chainSelectorName=${chainSelectorName}&tokenAddress=${tokenAddress}`)
      if (!response.ok) {
          return null
      }
      return response.json()
      
  } catch (err) {
      return null
  }
}