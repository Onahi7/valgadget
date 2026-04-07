import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function fail(message: string, status = 400, errors?: Record<string, string[]>) {
  return NextResponse.json({ message, errors }, { status })
}
