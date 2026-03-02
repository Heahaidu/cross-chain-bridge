// src/app/api/ccip/search/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const first = searchParams.get('first')
  const offset = searchParams.get('offset')
  const sender = searchParams.get('sender')

  if (!first || !offset || !sender) {
    return NextResponse.json(
      { error: 'Missing `hash` parameter' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://ccip.chain.link/api/h/atlas/transactions?first=${first}&offset=${offset}&sender=${sender.toLowerCase()}`
    )
    if (!response.ok) {
      throw new Error(`CCIP API returned ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('CCIP search error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}