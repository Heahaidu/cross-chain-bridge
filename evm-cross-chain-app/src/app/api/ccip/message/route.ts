// src/app/api/ccip/message/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json(
      { error: 'Missing `id` parameter' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://ccip.chain.link/api/h/atlas/message/${id}`
    )
    if (!response.ok) {
      throw new Error(`CCIP API returned ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('CCIP message error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}