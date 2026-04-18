#!/usr/bin/env node

/**
 * Environment validation script for ValGadget
 * Run this to check if all required environment variables are set
 */

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
]

const optionalVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
  'IMAGEKIT_PRIVATE_KEY',
  'NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY',
  'NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT',
]

console.log('🔍 Checking environment variables...\n')

let hasErrors = false

// Check required variables
console.log('Required variables:')
for (const varName of requiredVars) {
  const value = process.env[varName]
  if (!value) {
    console.log(`  ❌ ${varName} - MISSING`)
    hasErrors = true
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value
    console.log(`  ✅ ${varName} - ${preview}`)
  }
}

// Check optional variables
console.log('\nOptional variables:')
for (const varName of optionalVars) {
  const value = process.env[varName]
  if (!value) {
    console.log(`  ⚠️  ${varName} - not set`)
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value
    console.log(`  ✅ ${varName} - ${preview}`)
  }
}

console.log('\n' + '='.repeat(60))

if (hasErrors) {
  console.log('❌ Some required environment variables are missing!')
  console.log('📝 Copy .env.local.example to .env.local and fill in the values.')
  process.exit(1)
} else {
  console.log('✅ All required environment variables are set!')
  process.exit(0)
}
