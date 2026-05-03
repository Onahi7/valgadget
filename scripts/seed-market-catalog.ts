import dotenv from 'dotenv'
import { promises as fs } from 'node:fs'
import path from 'node:path'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { categories, products } from '../lib/server/schema'
import { eq, notInArray } from 'drizzle-orm'

type CategorySeed = {
  name: string
  slug: string
  description: string
  image: string
  sortOrder: number
  parentSlug?: string
}

type ProductSeed = {
  name: string
  sku: string
  categorySlug: string
  price: string
  stock: number
  tags: string[]
  image: string
  imageQuery?: string
  sourcePage?: string
  gsmArenaImage?: string
  localImageName?: string
  shortDescription: string
}

const categorySeeds: CategorySeed[] = [
  { name: 'Power & Charging', slug: 'power-charging', description: 'Powerbanks, chargers, extensions, and power backup solutions.', image: 'https://source.unsplash.com/1600x1200/?powerbank,charger', sortOrder: 100 },
  { name: 'Powerbanks', slug: 'powerbanks', parentSlug: 'power-charging', description: 'Portable charging solutions for phones, tablets, and gadgets.', image: 'https://source.unsplash.com/1600x1200/?powerbank', sortOrder: 101 },
  { name: 'Fast Chargers', slug: 'fast-chargers', parentSlug: 'power-charging', description: 'Wall and USB-C fast chargers for modern devices.', image: 'https://source.unsplash.com/1600x1200/?fast,charger', sortOrder: 102 },
  { name: 'Power Extensions & Surge Protectors', slug: 'surge-extensions', parentSlug: 'power-charging', description: 'Power strips, extension boards, and surge protection.', image: 'https://source.unsplash.com/1600x1200/?surge,protector', sortOrder: 103 },
  { name: 'Power Stations & Solar Generators', slug: 'power-stations-generators', parentSlug: 'power-charging', description: 'Backup powerstations and solar-ready generators.', image: 'https://source.unsplash.com/1600x1200/?portable,powerstation', sortOrder: 104 },

  { name: 'Audio & Entertainment', slug: 'audio-entertainment', description: 'Audio gear, TVs, gaming, and streaming devices.', image: 'https://source.unsplash.com/1600x1200/?headphones,speaker', sortOrder: 90 },
  { name: 'Earbuds', slug: 'earbuds', parentSlug: 'audio-entertainment', description: 'Wireless and wired earbuds for calls and music.', image: 'https://source.unsplash.com/1600x1200/?earbuds', sortOrder: 91 },
  { name: 'Headphones', slug: 'headphones', parentSlug: 'audio-entertainment', description: 'Over-ear and on-ear headphones for immersive audio.', image: 'https://source.unsplash.com/1600x1200/?headphones', sortOrder: 92 },
  { name: 'Speakers & Soundbars', slug: 'speakers-soundbars', parentSlug: 'audio-entertainment', description: 'Portable speakers, soundbars, and home audio.', image: 'https://source.unsplash.com/1600x1200/?speaker,soundbar', sortOrder: 93 },
  { name: 'Gaming Consoles', slug: 'gaming-consoles', parentSlug: 'audio-entertainment', description: 'PlayStation, Xbox, Nintendo and gaming accessories.', image: 'https://source.unsplash.com/1600x1200/?game,console', sortOrder: 94 },
  { name: 'TVs & Projectors', slug: 'tvs-projectors', parentSlug: 'audio-entertainment', description: 'Smart TVs and projectors for home entertainment.', image: 'https://source.unsplash.com/1600x1200/?smart,tv,projector', sortOrder: 95 },
  { name: 'Streaming Devices', slug: 'streaming-devices', parentSlug: 'audio-entertainment', description: 'Streaming sticks and media players.', image: 'https://source.unsplash.com/1600x1200/?streaming,device', sortOrder: 96 },

  { name: 'Computing & Accessories', slug: 'computing-accessories', description: 'Phones, laptops, monitors, and productivity accessories.', image: 'https://source.unsplash.com/1600x1200/?laptop,keyboard', sortOrder: 80 },
  { name: 'Smartphones & Tablets', slug: 'smartphones-tablets', parentSlug: 'computing-accessories', description: 'iPhones, iPads, Redmi phones and tablets.', image: 'https://source.unsplash.com/1600x1200/?smartphone,tablet', sortOrder: 81 },
  { name: 'Laptops & Monitors', slug: 'laptops-monitors', parentSlug: 'computing-accessories', description: 'Work and gaming laptops, desktop monitors.', image: 'https://source.unsplash.com/1600x1200/?laptop,monitor', sortOrder: 82 },
  { name: 'Computer Peripherals', slug: 'computer-peripherals', parentSlug: 'computing-accessories', description: 'Keyboards, mice, webcams and desk accessories.', image: 'https://source.unsplash.com/1600x1200/?keyboard,mouse', sortOrder: 83 },

  { name: 'Home Appliances & Comfort', slug: 'home-appliances-comfort', description: 'Home essentials for cooling, lighting, and convenience.', image: 'https://source.unsplash.com/1600x1200/?home,appliance', sortOrder: 70 },
  { name: 'Kitchen & Refrigeration', slug: 'kitchen-refrigeration', parentSlug: 'home-appliances-comfort', description: 'Refrigerators, blenders and kitchen appliances.', image: 'https://source.unsplash.com/1600x1200/?kitchen,refrigerator', sortOrder: 71 },
  { name: 'Cooling & Air Care', slug: 'cooling-air-care', parentSlug: 'home-appliances-comfort', description: 'ACs, rechargeable fans and comfort devices.', image: 'https://source.unsplash.com/1600x1200/?air,conditioner,fan', sortOrder: 72 },

  { name: 'Networking & Connectivity', slug: 'networking-connectivity', description: 'Internet and connectivity devices for homes and offices.', image: 'https://source.unsplash.com/1600x1200/?router,wifi', sortOrder: 60 },
  { name: 'MiFi & Routers', slug: 'mifi-routers', parentSlug: 'networking-connectivity', description: 'Portable and home broadband routers.', image: 'https://source.unsplash.com/1600x1200/?mifi,router', sortOrder: 61 },
  { name: 'Satellite Internet', slug: 'satellite-internet', parentSlug: 'networking-connectivity', description: 'Satellite internet equipment and kits.', image: 'https://source.unsplash.com/1600x1200/?satellite,internet', sortOrder: 62 },

  { name: 'Wearables & Smart Devices', slug: 'wearables-smart-devices', description: 'Smart wearables and advanced smart gadgets.', image: 'https://source.unsplash.com/1600x1200/?smartwatch,wearable', sortOrder: 50 },
  { name: 'Smartwatches', slug: 'smartwatches', parentSlug: 'wearables-smart-devices', description: 'Fitness and lifestyle smartwatches.', image: 'https://source.unsplash.com/1600x1200/?smartwatch', sortOrder: 51 },
  { name: 'Smart Glasses', slug: 'smart-glasses', parentSlug: 'wearables-smart-devices', description: 'AI-enabled smart glasses and wearable optics.', image: 'https://source.unsplash.com/1600x1200/?smart,glasses', sortOrder: 52 },

  { name: 'Security & Surveillance', slug: 'security-surveillance', description: 'Security cameras and smart locking solutions.', image: 'https://source.unsplash.com/1600x1200/?cctv,security', sortOrder: 40 },
  { name: 'CCTV Cameras', slug: 'cctv-cameras', parentSlug: 'security-surveillance', description: 'Indoor and outdoor surveillance cameras.', image: 'https://source.unsplash.com/1600x1200/?cctv,camera', sortOrder: 41 },
  { name: 'Smart Locks', slug: 'smart-locks', parentSlug: 'security-surveillance', description: 'Electronic locks and smart access control.', image: 'https://source.unsplash.com/1600x1200/?smart,lock', sortOrder: 42 },

  { name: 'Drones & Accessories', slug: 'drones-accessories', description: 'Drones and creator accessories for aerial content.', image: 'https://source.unsplash.com/1600x1200/?drone,camera', sortOrder: 30 },
  { name: 'Drones', slug: 'drones', parentSlug: 'drones-accessories', description: 'Consumer and prosumer camera drones.', image: 'https://source.unsplash.com/1600x1200/?drone', sortOrder: 31 },
  { name: 'Drone Audio & Mics', slug: 'drone-audio-mics', parentSlug: 'drones-accessories', description: 'Wireless mics and creator audio kits.', image: 'https://source.unsplash.com/1600x1200/?wireless,microphone', sortOrder: 32 },

  { name: 'Content Creation Kits', slug: 'content-creation-kits', description: 'Creator tools for recording, lighting, and storage.', image: 'https://source.unsplash.com/1600x1200/?camera,microphone', sortOrder: 20 },
  { name: 'Camera & Recording Gear', slug: 'camera-recording-gear', parentSlug: 'content-creation-kits', description: 'Cameras, tripods, mics and mixers.', image: 'https://source.unsplash.com/1600x1200/?camera,tripod,microphone', sortOrder: 21 },
  { name: 'Storage & Media', slug: 'storage-media', parentSlug: 'content-creation-kits', description: 'Flash drives and content storage.', image: 'https://source.unsplash.com/1600x1200/?flash,drive', sortOrder: 22 },

  { name: 'Sport Equipment', slug: 'sport-equipment', description: 'Fitness and home workout equipment.', image: 'https://source.unsplash.com/1600x1200/?fitness,dumbbell', sortOrder: 10 },
  { name: 'Bodyweight Training', slug: 'bodyweight-training', parentSlug: 'sport-equipment', description: 'Push-up and sit-up training gear.', image: 'https://source.unsplash.com/1600x1200/?pushup,workout', sortOrder: 11 },
  { name: 'Strength Training', slug: 'strength-training', parentSlug: 'sport-equipment', description: 'Dumbbells and strength accessories.', image: 'https://source.unsplash.com/1600x1200/?dumbbell', sortOrder: 12 },
]

const productSeeds: ProductSeed[] = [
  { name: 'Anker PowerCore 20000mAh', sku: 'PWR-ANK-PWRCORE20K', categorySlug: 'powerbanks', price: '65000', stock: 20, tags: ['powerbank', 'anker'], image: 'https://source.unsplash.com/1600x1200/?anker,powerbank', sourcePage: 'https://www.ankerjapan.com/products/a1364n21', shortDescription: 'High-capacity fast-charging power bank.' },
  { name: 'Oraimo Traveler 4 20000mAh Power Bank', sku: 'PWR-ORA-TRAV4', categorySlug: 'powerbanks', price: '32000', stock: 30, tags: ['powerbank', 'oraimo'], image: 'https://source.unsplash.com/1600x1200/?oraimo,powerbank', sourcePage: 'https://www.jumia.com.ng/catalog/?q=oraimo+traveler+4+20000mah+opb-p204d', shortDescription: 'Reliable multi-port powerbank for daily carry.' },
  { name: 'Baseus Bipow 10000mAh Power Bank', sku: 'PWR-BAS-BIPOW10K', categorySlug: 'powerbanks', price: '28000', stock: 25, tags: ['powerbank', 'baseus'], image: 'https://source.unsplash.com/1600x1200/?baseus,powerbank', sourcePage: 'https://www.baseus.com/products/bipow-2-power-bank-with-built-in-usb-c-cable-10000mah-20w', shortDescription: 'Compact power bank with display and fast output.' },
  { name: 'itel 20000mAh Fast Charge Power Bank', sku: 'PWR-ITE-20K', categorySlug: 'powerbanks', price: '24000', stock: 25, tags: ['powerbank', 'itel'], image: 'https://source.unsplash.com/1600x1200/?itel,powerbank', sourcePage: 'https://www.jumia.com.ng/catalog/?q=itel+powerpulse+20000mah+a1460', shortDescription: 'Budget-friendly high-capacity power bank.' },
  { name: 'Anker 33W USB-C Fast Charger', sku: 'PWR-ANK-33W', categorySlug: 'fast-chargers', price: '22000', stock: 20, tags: ['charger', 'anker'], image: 'https://source.unsplash.com/1600x1200/?usb-c,charger', sourcePage: 'https://www.jumia.com.ng/anker-usb-c-323-charger-33w-compact-2-port-charger-259234749.html', shortDescription: 'Fast wall charger for phones and tablets.' },
  { name: 'Lontor Surge Protector Extension', sku: 'PWR-LON-SURGE6', categorySlug: 'surge-extensions', price: '18000', stock: 40, tags: ['extension', 'surge-protector'], image: 'https://source.unsplash.com/1600x1200/?power,extension', shortDescription: 'Power surge extension with multi-outlet support.' },
  { name: 'EcoFlow River 2 Power Station', sku: 'PWR-ECO-RIVER2', categorySlug: 'power-stations-generators', price: '420000', stock: 8, tags: ['powerstation', 'solar'], image: 'https://source.unsplash.com/1600x1200/?portable,powerstation', shortDescription: 'Portable power station for home backup.' },

  { name: 'Anker Soundcore R50i Earbuds', sku: 'AUD-ANK-R50I', categorySlug: 'earbuds', price: '29000', stock: 30, tags: ['earbuds', 'anker'], image: 'https://source.unsplash.com/1600x1200/?earbuds', shortDescription: 'True wireless earbuds with clear sound.' },
  { name: 'Oraimo BoomPop 2 Headphones', sku: 'AUD-ORA-BOOMPOP2', categorySlug: 'headphones', price: '34000', stock: 20, tags: ['headphones', 'oraimo'], image: 'https://source.unsplash.com/1600x1200/?headphones', shortDescription: 'Over-ear wireless headphones with deep bass.' },
  { name: 'JBL Flip 6 Bluetooth Speaker', sku: 'AUD-JBL-FLIP6', categorySlug: 'speakers-soundbars', price: '145000', stock: 14, tags: ['speaker', 'jbl'], image: 'https://source.unsplash.com/1600x1200/?bluetooth,speaker', shortDescription: 'Portable waterproof speaker with punchy sound.' },
  { name: 'Sony HT-S40R Soundbar System', sku: 'AUD-SNY-HTS40R', categorySlug: 'speakers-soundbars', price: '520000', stock: 6, tags: ['soundbar', 'sony'], image: 'https://source.unsplash.com/1600x1200/?soundbar', sourcePage: 'https://www.konga.com/product/sony-ht-s40r-5-1ch-home-theater-soundbar-system-black-6699884', shortDescription: '5.1 channel home theater soundbar setup.' },
  { name: 'Sony PlayStation 5 Slim', sku: 'AUD-PS5-SLIM', categorySlug: 'gaming-consoles', price: '890000', stock: 8, tags: ['playstation', 'gaming'], image: 'https://source.unsplash.com/1600x1200/?playstation,console', shortDescription: 'Latest PlayStation console for immersive gaming.' },
  { name: 'LG 55-inch 4K Smart TV', sku: 'AUD-LG-55-4K', categorySlug: 'tvs-projectors', price: '680000', stock: 10, tags: ['smart-tv', 'lg'], image: 'https://source.unsplash.com/1600x1200/?smart,tv', shortDescription: '4K UHD smart TV with streaming apps.' },
  { name: 'XGIMI MoGo 2 HD Projector', sku: 'AUD-XGI-MOGO2', categorySlug: 'tvs-projectors', price: '510000', stock: 7, tags: ['projector', 'xgimi'], image: 'https://source.unsplash.com/1600x1200/?projector', sourcePage: 'https://www.jumia.com.ng/slp/xgimi-halo-portable-led-smart-projector', shortDescription: 'Portable HD smart projector for movies and games.' },
  { name: 'Amazon Fire TV Stick 4K', sku: 'AUD-AMZ-FIRE4K', categorySlug: 'streaming-devices', price: '85000', stock: 16, tags: ['streaming-stick', 'amazon'], image: 'https://source.unsplash.com/1600x1200/?streaming,stick', sourcePage: 'https://www.konga.com/product/amazon-fire-tv-stick-4k-2nd-gen-2023-release-with-latest-alexa-voice-remote-6397254', shortDescription: '4K streaming stick with voice remote.' },

  { name: 'Apple iPhone 15 128GB', sku: 'COM-APL-IP15-128', categorySlug: 'smartphones-tablets', price: '1340000', stock: 12, tags: ['iphone', 'apple'], image: 'https://source.unsplash.com/1600x1200/?iphone', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg', localImageName: 'apple-iphone-15.jpg', shortDescription: 'Premium iPhone with advanced camera and performance.' },
  { name: 'Apple iPhone 15 Pro Max 256GB', sku: 'COM-APL-IP15PM-256', categorySlug: 'smartphones-tablets', price: '1880000', stock: 8, tags: ['iphone', 'apple', 'pro-max'], image: 'https://source.unsplash.com/1600x1200/?iphone', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg', localImageName: 'apple-iphone-15-pro-max.jpg', shortDescription: 'Flagship iPhone with top-tier performance and camera system.' },
  { name: 'Apple iPhone 14 128GB', sku: 'COM-APL-IP14-128', categorySlug: 'smartphones-tablets', price: '1120000', stock: 10, tags: ['iphone', 'apple'], image: 'https://source.unsplash.com/1600x1200/?iphone', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg', localImageName: 'apple-iphone-14.jpg', shortDescription: 'Balanced iPhone option with strong all-round performance.' },
  { name: 'Apple iPhone 13 128GB', sku: 'COM-APL-IP13-128', categorySlug: 'smartphones-tablets', price: '910000', stock: 12, tags: ['iphone', 'apple'], image: 'https://source.unsplash.com/1600x1200/?iphone', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13.jpg', localImageName: 'apple-iphone-13.jpg', shortDescription: 'Popular iPhone model with dependable daily performance.' },
  { name: 'Apple iPad 10th Gen 64GB', sku: 'COM-APL-IPAD10-64', categorySlug: 'smartphones-tablets', price: '740000', stock: 10, tags: ['ipad', 'apple'], image: 'https://source.unsplash.com/1600x1200/?ipad', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/apple-ipad-10-2022.jpg', localImageName: 'apple-ipad-10-2022.jpg', shortDescription: 'Versatile iPad for school, work, and entertainment.' },
  { name: 'Redmi Note 13 Pro', sku: 'COM-RDM-N13PRO', categorySlug: 'smartphones-tablets', price: '465000', stock: 18, tags: ['redmi', 'phone'], image: 'https://source.unsplash.com/1600x1200/?android,phone', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-5g.jpg', localImageName: 'xiaomi-redmi-note-13-pro-5g.jpg', shortDescription: 'High-value Android phone with strong battery life.' },
  { name: 'Redmi Note 13 256GB', sku: 'COM-RDM-N13-256', categorySlug: 'smartphones-tablets', price: '335000', stock: 16, tags: ['redmi', 'phone'], image: 'https://source.unsplash.com/1600x1200/?android,phone', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13.jpg', localImageName: 'xiaomi-redmi-note-13.jpg', shortDescription: 'Affordable Redmi smartphone with AMOLED display and strong battery.' },
  { name: 'Samsung Galaxy A55 5G', sku: 'COM-SAM-A55-5G', categorySlug: 'smartphones-tablets', price: '690000', stock: 10, tags: ['samsung', 'galaxy', '5g'], image: 'https://source.unsplash.com/1600x1200/?samsung,phone', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg', localImageName: 'samsung-galaxy-a55.jpg', shortDescription: 'Midrange Samsung phone with premium build and reliable camera output.' },
  { name: 'Tecno Camon 30', sku: 'COM-TEC-CAMON30', categorySlug: 'smartphones-tablets', price: '355000', stock: 14, tags: ['tecno', 'camon', 'phone'], image: 'https://source.unsplash.com/1600x1200/?tecno,phone', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/tecno-camon-30.jpg', localImageName: 'tecno-camon-30.jpg', shortDescription: 'Camera-focused Tecno phone designed for content and social use.' },
  { name: 'HP Pavilion 15 Laptop', sku: 'COM-HP-PAV15', categorySlug: 'laptops-monitors', price: '920000', stock: 9, tags: ['laptop', 'hp'], image: 'https://source.unsplash.com/1600x1200/?laptop', shortDescription: 'Everyday laptop for work and productivity.' },
  { name: 'Dell 24-inch IPS Monitor', sku: 'COM-DEL-24IPS', categorySlug: 'laptops-monitors', price: '230000', stock: 14, tags: ['monitor', 'dell'], image: 'https://source.unsplash.com/1600x1200/?computer,monitor', shortDescription: 'Crisp IPS monitor for office and creative tasks.' },
  { name: 'Logitech MK270 Keyboard & Mouse', sku: 'COM-LOG-MK270', categorySlug: 'computer-peripherals', price: '55000', stock: 30, tags: ['keyboard', 'mouse'], image: 'https://source.unsplash.com/1600x1200/?keyboard,mouse', shortDescription: 'Wireless keyboard and mouse combo set.' },

  { name: 'Haier Thermocool Refrigerator 200L', sku: 'HOM-HTC-REF200', categorySlug: 'kitchen-refrigeration', price: '620000', stock: 8, tags: ['refrigerator'], image: 'https://source.unsplash.com/1600x1200/?refrigerator', sourcePage: 'https://www.jumia.com.ng/haier-thermocool-200-litres-double-door-refrigerator-210blux-r6-sliver-3-years-warranty-261814755.html', shortDescription: 'Energy-efficient family-size refrigerator.' },
  { name: 'Binatone Blender BLG-600', sku: 'HOM-BIN-BLG600', categorySlug: 'kitchen-refrigeration', price: '78000', stock: 20, tags: ['blender'], image: 'https://source.unsplash.com/1600x1200/?blender,kitchen', shortDescription: 'Durable kitchen blender for daily use.' },
  { name: 'LG 1.5HP Split Air Conditioner', sku: 'HOM-LG-15HP-AC', categorySlug: 'cooling-air-care', price: '910000', stock: 6, tags: ['air-conditioner'], image: 'https://source.unsplash.com/1600x1200/?air,conditioner', shortDescription: 'Efficient cooling with inverter technology.' },
  { name: 'Qasa Solar Rechargeable Fan', sku: 'HOM-QAS-SOLARFAN', categorySlug: 'cooling-air-care', price: '115000', stock: 18, tags: ['solar-fan'], image: 'https://source.unsplash.com/1600x1200/?rechargeable,fan', shortDescription: 'Solar fan for power-outage comfort.' },

  { name: 'TP-Link M7350 MiFi', sku: 'NET-TPL-M7350', categorySlug: 'mifi-routers', price: '95000', stock: 15, tags: ['mifi', 'router'], image: 'https://source.unsplash.com/1600x1200/?mifi,router', sourcePage: 'https://www.jumia.com.ng/tp-link-m7350-4g-lte-mifi-portable-wi-fi-for-travel-decipher-mobile-wi-fi-hotspot-263214949.html', shortDescription: 'Portable 4G MiFi router for mobile internet.' },
  { name: 'Starlink Standard Kit', sku: 'NET-STR-STD-KIT', categorySlug: 'satellite-internet', price: '930000', stock: 5, tags: ['starlink', 'satellite-internet'], image: 'https://source.unsplash.com/1600x1200/?satellite,internet', shortDescription: 'Satellite internet kit for high-speed connectivity.' },

  { name: 'Apple Watch SE (2nd Gen)', sku: 'WEA-APL-WSE2', categorySlug: 'smartwatches', price: '460000', stock: 9, tags: ['smartwatch', 'apple'], image: 'https://source.unsplash.com/1600x1200/?smartwatch', gsmArenaImage: 'https://fdn2.gsmarena.com/vv/bigpic/apple-watch-se.jpg', localImageName: 'apple-watch-se.jpg', shortDescription: 'Smartwatch for fitness, calls, and notifications.' },
  { name: 'Ray-Ban Meta Smart Glasses', sku: 'WEA-RBM-META', categorySlug: 'smart-glasses', price: '820000', stock: 4, tags: ['smart-glasses', 'ai'], image: 'https://source.unsplash.com/1600x1200/?smart,glasses', shortDescription: 'AI-enabled smart glasses with camera and audio.' },

  { name: 'Hikvision 4MP CCTV Camera', sku: 'SEC-HIK-4MP', categorySlug: 'cctv-cameras', price: '115000', stock: 22, tags: ['cctv', 'hikvision'], image: 'https://source.unsplash.com/1600x1200/?cctv,camera', sourcePage: 'https://www.jumia.com.ng/hikvision-4mp-pro-solar-powered-security-pt-camera-4g-lte-pir-radar-detectotion-ds-2de2c400iwg-k-4g-c05s10-418628214.html', shortDescription: 'High-resolution surveillance camera.' },
  { name: 'Yale Smart Security Lock', sku: 'SEC-YAL-SMARTLOCK', categorySlug: 'smart-locks', price: '390000', stock: 7, tags: ['security-lock', 'smart-lock'], image: 'https://source.unsplash.com/1600x1200/?smart,door,lock', sourcePage: 'https://www.jumia.com.ng/generic-smart-electric-mortise-lock-access-control-magnetic-lock-410353190.html', shortDescription: 'Keyless smart security lock for modern homes.' },

  { name: 'DJI Mini 4 Pro Drone', sku: 'DRN-DJI-MINI4PRO', categorySlug: 'drones', price: '1650000', stock: 6, tags: ['dji', 'drone'], image: 'https://source.unsplash.com/1600x1200/?dji,drone', shortDescription: 'Compact premium drone for cinematic footage.' },
  { name: 'DJI Mic 2 Wireless Microphone', sku: 'DRN-DJI-MIC2', categorySlug: 'drone-audio-mics', price: '520000', stock: 9, tags: ['dji', 'microphone'], image: 'https://source.unsplash.com/1600x1200/?wireless,microphone', shortDescription: 'Dual-channel wireless mic for creators.' },

  { name: 'Ulanzi Heavy Duty Tripod Stand', sku: 'CCK-ULA-TRIPOD', categorySlug: 'camera-recording-gear', price: '98000', stock: 12, tags: ['tripod'], image: 'https://source.unsplash.com/1600x1200/?tripod,camera', sourcePage: 'https://www.jumia.com.ng/generic-ulanzi-portable-vlog-tripod-mini-tripod-gimbal-base-for-4-2-260445709.html', shortDescription: 'Stable tripod for video and photography.' },
  { name: 'Canon EOS M50 Mark II Camera', sku: 'CCK-CAN-M50II', categorySlug: 'camera-recording-gear', price: '980000', stock: 5, tags: ['camera', 'canon'], image: 'https://source.unsplash.com/1600x1200/?mirrorless,camera', shortDescription: 'Creator-friendly mirrorless camera.' },
  { name: 'Godox LED Video Light', sku: 'CCK-GDX-LED', categorySlug: 'camera-recording-gear', price: '145000', stock: 10, tags: ['led-light'], image: 'https://source.unsplash.com/1600x1200/?led,video,light', shortDescription: 'Adjustable LED light for studio-quality content.' },
  { name: 'SanDisk 128GB USB Flash Drive', sku: 'CCK-SND-128USB', categorySlug: 'storage-media', price: '22000', stock: 25, tags: ['flash-drive'], image: 'https://source.unsplash.com/1600x1200/?usb,flash,drive', sourcePage: 'https://www.jumia.com.ng/sandisk-128gb-flash-drive-252330964.html', shortDescription: 'Reliable high-speed storage drive.' },

  { name: 'Push-Up Board 14-in-1', sku: 'SPT-PUSH-14IN1', categorySlug: 'bodyweight-training', price: '48000', stock: 17, tags: ['pushup-board'], image: 'https://source.unsplash.com/1600x1200/?pushup,board', sourcePage: 'https://www.jumia.com.ng/generic-14-in-1-push-up-rack-board-system-unisex-comprehensive-327682631.html', shortDescription: 'Portable multi-angle push-up training board.' },
  { name: 'Doorway Sit-Up Bar', sku: 'SPT-SITUP-BAR', categorySlug: 'bodyweight-training', price: '35000', stock: 20, tags: ['sit-up-bar'], image: 'https://source.unsplash.com/1600x1200/?workout,bar', sourcePage: 'https://www.konga.com/product/suction-sit-up-bar-5254058', shortDescription: 'Compact sit-up support bar for home workouts.' },
  { name: 'Adjustable Dumbbell Pair 24kg', sku: 'SPT-DUMB-24KG', categorySlug: 'strength-training', price: '180000', stock: 11, tags: ['dumbbell'], image: 'https://source.unsplash.com/1600x1200/?dumbbell,fitness', sourcePage: 'https://www.jumia.com.ng/liveup-xprt-adjustable-dumbbell-set-24kg-418778943.html', shortDescription: 'Space-saving adjustable dumbbell set.' },
]

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function fullDescription(p: ProductSeed) {
  const bullets = [
    'Sourced for the Nigerian market with practical warranty and after-sales expectations.',
    'Balanced for daily reliability, performance, and value in its category.',
    'Ideal for home, office, or creator workflows depending on use case.',
  ]
  return `${p.name} is a ${p.shortDescription.toLowerCase()} Built for users who want dependable performance and clear value, this model is selected to match common buying preferences in Nigeria for quality, durability, and ease of use.\n\n${bullets.join(' ')}`
}

async function upsertCategories() {
  const bySlug = new Map<string, string>()

  for (const c of categorySeeds.filter(x => !x.parentSlug)) {
    const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, c.slug)).limit(1)
    if (existing) {
      await db.update(categories).set({ name: c.name, description: c.description, image: c.image, sortOrder: c.sortOrder, parentId: null, isActive: true, updatedAt: new Date() }).where(eq(categories.id, existing.id))
      bySlug.set(c.slug, existing.id)
    } else {
      const [created] = await db.insert(categories).values({ name: c.name, slug: c.slug, description: c.description, image: c.image, sortOrder: c.sortOrder, parentId: null, isActive: true }).returning({ id: categories.id })
      bySlug.set(c.slug, created.id)
    }
  }

  for (const c of categorySeeds.filter(x => x.parentSlug)) {
    const parentId = bySlug.get(c.parentSlug!)
    if (!parentId) continue
    const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, c.slug)).limit(1)
    if (existing) {
      await db.update(categories).set({ name: c.name, description: c.description, image: c.image, sortOrder: c.sortOrder, parentId, isActive: true, updatedAt: new Date() }).where(eq(categories.id, existing.id))
      bySlug.set(c.slug, existing.id)
    } else {
      const [created] = await db.insert(categories).values({ name: c.name, slug: c.slug, description: c.description, image: c.image, sortOrder: c.sortOrder, parentId, isActive: true }).returning({ id: categories.id })
      bySlug.set(c.slug, created.id)
    }
  }

  return bySlug
}

async function upsertProducts(categoryMap: Map<string, string>) {
  const imageCache = new Map<string, string>()
  const localCatalogDir = path.join(process.cwd(), 'public', 'catalog', 'phones')
  await fs.mkdir(localCatalogDir, { recursive: true })

  async function downloadToPublic(imageUrl: string, fileName: string) {
    const safeName = fileName.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
    const absolutePath = path.join(localCatalogDir, safeName)
    try {
      await fs.access(absolutePath)
      return `/catalog/phones/${safeName}`
    } catch {
      const res = await fetch(imageUrl, { headers: { 'user-agent': 'Mozilla/5.0' } })
      if (!res.ok) throw new Error(`Failed to download image: ${imageUrl}`)
      const arr = await res.arrayBuffer()
      await fs.writeFile(absolutePath, Buffer.from(arr))
      return `/catalog/phones/${safeName}`
    }
  }

  async function ogImageFromPage(url: string) {
    const page = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } })
    const markup = await page.text()
    const og =
      markup.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? markup.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      ?? markup.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? markup.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)?.[1]
    if (og && og.startsWith('http')) return og.replace(/^http:\/\//i, 'https://')
    const jumiaInline = markup.match(/https?:\/\/ng\.jumia\.is\/[^"'\\\s>]+/i)?.[0]
    if (jumiaInline) return jumiaInline.replace(/^http:\/\//i, 'https://')
    const kongaInline = markup.match(/https?:\/\/[^"'\\\s>]*konga[^"'\\\s>]*\.(?:jpg|jpeg|png|webp)[^"'\\\s>]*/i)?.[0]
    if (kongaInline) return kongaInline.replace(/^http:\/\//i, 'https://')
    return null
  }

  async function resolveImage(p: ProductSeed) {
    const query = (p.imageQuery ?? p.name).trim()
    if (imageCache.has(query)) return imageCache.get(query)!
    try {
      if (p.gsmArenaImage && p.localImageName) {
        const localUrl = await downloadToPublic(p.gsmArenaImage, p.localImageName)
        imageCache.set(query, localUrl)
        return localUrl
      }

      if (p.sourcePage) {
        const official = await ogImageFromPage(p.sourcePage)
        if (official) { imageCache.set(query, official); return official }
      }
      const jumiaSearch = `https://www.jumia.com.ng/catalog/?q=${encodeURIComponent(query)}`
      const jumiaOg = await ogImageFromPage(jumiaSearch)
      if (jumiaOg && jumiaOg.includes('ng.jumia.is/') && !jumiaOg.includes('jumialogonew')) { imageCache.set(query, jumiaOg); return jumiaOg }
    } catch {}
    imageCache.set(query, p.image)
    return p.image
  }

  for (const p of productSeeds) {
    const categoryId = categoryMap.get(p.categorySlug)
    if (!categoryId) continue
    const resolvedImage = await resolveImage(p)

    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.sku, p.sku)).limit(1)
    const payload = {
      name: p.name,
      slug: slugify(p.name),
      description: fullDescription(p),
      shortDescription: p.shortDescription,
      price: p.price,
      comparePrice: null as string | null,
      cost: null as string | null,
      images: [resolvedImage],
      categoryId,
      stock: p.stock,
      sku: p.sku,
      tags: p.tags,
      featured: false,
      isNew: false,
      isActive: true,
      updatedAt: new Date(),
    }

    if (existing) await db.update(products).set(payload).where(eq(products.id, existing.id))
    else await db.insert(products).values(payload)
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing. Set it in your environment or .env.local before running seed.')
  const categoryMap = await upsertCategories()
  await upsertProducts(categoryMap)
  await db.update(categories).set({ isActive: false, updatedAt: new Date() }).where(notInArray(categories.slug, categorySeeds.map(c => c.slug)))
  await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(notInArray(products.sku, productSeeds.map(p => p.sku)))
  console.log(`Seed complete: ${categorySeeds.length} categories, ${productSeeds.length} products.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
