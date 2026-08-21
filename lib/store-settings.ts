export const DEFAULT_STORE_SETTINGS = {
  storeName: 'Val Gadgets',
  storeEmail: 'support@valgadgets.com',
  storePhone: '+234 703 857 2046',
  storeAddress: 'Lagos, Nigeria',
  storeDescription: 'Your number 1 gadget plug. Solution to every gadget need — with nationwide delivery across Nigeria.',
  maintenanceMode: 'false',
  shippingEnabled: 'true',
  freeShippingEnabled: 'true',
  freeShippingThreshold: '500000',
  taxEnabled: 'false',
  taxRate: '0',
  pricesIncludeTax: 'true',
  paystackEnabled: 'true',
  btcEnabled: 'true',
  ethEnabled: 'true',
  usdtTrc20Enabled: 'true',
  usdtErc20Enabled: 'true',
  codEnabled: 'true',
  emailOrderConfirm: 'true',
  emailShippingUpdate: 'true',
  emailPromo: 'false',
  seoTitle: 'Val Gadgets — Your #1 Gadget Plug in Nigeria',
  seoDescription: 'Your number 1 gadget plug. Shop phones, laptops, power banks, solar inverters & accessories. Nationwide delivery.',
  seoKeywords: 'gadgets Nigeria, buy phones Nigeria, laptops Nigeria, power bank Nigeria, solar inverter Nigeria',
  alertNewOrder: 'true',
} as const

export type StoreSettingKey = keyof typeof DEFAULT_STORE_SETTINGS
export type StoreSettings = Record<StoreSettingKey, string>

export const STORE_SETTING_KEYS = Object.keys(DEFAULT_STORE_SETTINGS) as StoreSettingKey[]

const BOOLEAN_KEYS = new Set<StoreSettingKey>([
  'maintenanceMode', 'shippingEnabled', 'freeShippingEnabled', 'taxEnabled', 'pricesIncludeTax',
  'paystackEnabled', 'btcEnabled', 'ethEnabled', 'usdtTrc20Enabled', 'usdtErc20Enabled',
  'codEnabled', 'emailOrderConfirm', 'emailShippingUpdate', 'emailPromo', 'alertNewOrder',
])

const NUMBER_RULES: Partial<Record<StoreSettingKey, { min: number; max: number }>> = {
  freeShippingThreshold: { min: 0, max: 1_000_000_000 },
  taxRate: { min: 0, max: 100 },
}

const MAX_LENGTHS: Partial<Record<StoreSettingKey, number>> = {
  storeName: 100,
  storeEmail: 254,
  storePhone: 40,
  storeAddress: 300,
  storeDescription: 1_000,
  seoTitle: 200,
  seoDescription: 500,
  seoKeywords: 1_000,
}

export function mergeStoreSettings(values: Partial<Record<StoreSettingKey, string>>): StoreSettings {
  return { ...DEFAULT_STORE_SETTINGS, ...values }
}

export function settingIsTrue(settings: StoreSettings, key: StoreSettingKey): boolean {
  return settings[key] === 'true'
}

export function settingNumber(settings: StoreSettings, key: StoreSettingKey): number {
  const value = Number(settings[key])
  return Number.isFinite(value) ? value : Number(DEFAULT_STORE_SETTINGS[key]) || 0
}

export function validateStoreSetting(key: string, rawValue: unknown): { key: StoreSettingKey; value: string } | { error: string } {
  if (!STORE_SETTING_KEYS.includes(key as StoreSettingKey)) return { error: `Unknown setting: ${key}` }
  if (typeof rawValue !== 'string') return { error: `${key} must be a string` }

  const settingKey = key as StoreSettingKey
  const value = rawValue.trim()

  if (BOOLEAN_KEYS.has(settingKey) && value !== 'true' && value !== 'false') {
    return { error: `${key} must be true or false` }
  }

  const numberRule = NUMBER_RULES[settingKey]
  if (numberRule) {
    const numberValue = Number(value)
    if (!Number.isFinite(numberValue) || numberValue < numberRule.min || numberValue > numberRule.max) {
      return { error: `${key} must be between ${numberRule.min} and ${numberRule.max}` }
    }
  }

  const maxLength = MAX_LENGTHS[settingKey] ?? 50
  if (value.length > maxLength) return { error: `${key} is too long` }
  if (settingKey === 'storeEmail' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { error: 'Store email is invalid' }
  }

  return { key: settingKey, value }
}

export interface PublicStoreConfig {
  storeName: string
  storeEmail: string
  storePhone: string
  shippingEnabled: boolean
  freeShippingEnabled: boolean
  freeShippingThreshold: number
  taxEnabled: boolean
  taxRate: number
  pricesIncludeTax: boolean
  paymentMethods: {
    paystack: boolean
    cod: boolean
    btc: boolean
    eth: boolean
    usdtTrc20: boolean
    usdtErc20: boolean
  }
}

export function toPublicStoreConfig(settings: StoreSettings): PublicStoreConfig {
  return {
    storeName: settings.storeName,
    storeEmail: settings.storeEmail,
    storePhone: settings.storePhone,
    shippingEnabled: settingIsTrue(settings, 'shippingEnabled'),
    freeShippingEnabled: settingIsTrue(settings, 'freeShippingEnabled'),
    freeShippingThreshold: settingNumber(settings, 'freeShippingThreshold'),
    taxEnabled: settingIsTrue(settings, 'taxEnabled'),
    taxRate: settingNumber(settings, 'taxRate'),
    pricesIncludeTax: settingIsTrue(settings, 'pricesIncludeTax'),
    paymentMethods: {
      paystack: settingIsTrue(settings, 'paystackEnabled') && Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
      cod: settingIsTrue(settings, 'codEnabled'),
      btc: settingIsTrue(settings, 'btcEnabled') && Boolean(process.env.CRYPTO_BTC_ADDRESS),
      eth: settingIsTrue(settings, 'ethEnabled') && Boolean(process.env.CRYPTO_ETH_ADDRESS),
      usdtTrc20: settingIsTrue(settings, 'usdtTrc20Enabled') && Boolean(process.env.CRYPTO_USDT_TRC20_ADDRESS),
      usdtErc20: settingIsTrue(settings, 'usdtErc20Enabled') && Boolean(process.env.CRYPTO_USDT_ERC20_ADDRESS),
    },
  }
}
