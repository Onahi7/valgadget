export type ProductSpecTemplate = {
  name: string
  labels: string[]
}

type CategoryLike = {
  id: string
  name: string
  slug: string
  parentId?: string | null
}

const defaultTemplate: ProductSpecTemplate = {
  name: 'General product',
  labels: ['Brand', 'Model', 'Condition', 'Color', 'Warranty', 'In the Box'],
}

const templates: Record<string, ProductSpecTemplate> = {
  audio: {
    name: 'Audio',
    labels: ['Brand', 'Model', 'Connectivity', 'Battery Life', 'Charging Port', 'Microphone', 'Water Resistance', 'In the Box'],
  },
  'audio-entertainment': {
    name: 'Audio & entertainment',
    labels: ['Brand', 'Model', 'Connectivity', 'Battery Life', 'Output Power', 'Water Resistance', 'Input Ports', 'In the Box'],
  },
  earbuds: {
    name: 'Earbuds',
    labels: ['Brand', 'Model', 'Connectivity', 'Battery Life', 'Charging Case', 'Noise Cancellation', 'Water Resistance', 'Microphone'],
  },
  headphones: {
    name: 'Headphones',
    labels: ['Brand', 'Model', 'Connectivity', 'Battery Life', 'Noise Cancellation', 'Microphone', 'Charging Port', 'Foldable'],
  },
  speakers: {
    name: 'Speakers',
    labels: ['Brand', 'Model', 'Connectivity', 'Battery Life', 'Output Power', 'Water Resistance', 'Input Ports', 'Features'],
  },
  'speakers-soundbars': {
    name: 'Speakers & soundbars',
    labels: ['Brand', 'Model', 'Connectivity', 'Output Power', 'Channels', 'Input Ports', 'Remote Control', 'Features'],
  },
  'gaming-consoles': {
    name: 'Gaming consoles',
    labels: ['Brand', 'Model', 'Storage', 'Resolution', 'Controller Included', 'Disc Drive', 'Connectivity', 'In the Box'],
  },
  'tvs-projectors': {
    name: 'TVs & projectors',
    labels: ['Brand', 'Model', 'Screen Size', 'Resolution', 'Display Type', 'Smart TV OS', 'Ports', 'Warranty'],
  },
  'streaming-devices': {
    name: 'Streaming devices',
    labels: ['Brand', 'Model', 'Resolution', 'Connectivity', 'Remote Control', 'Voice Assistant', 'Ports', 'Compatible Apps'],
  },
  wearables: {
    name: 'Wearables',
    labels: ['Brand', 'Model', 'Case Size', 'Connectivity', 'Battery Life', 'Water Resistance', 'Compatibility', 'Condition'],
  },
  'wearables-smart-devices': {
    name: 'Wearables & smart devices',
    labels: ['Brand', 'Model', 'Connectivity', 'Battery Life', 'Sensors', 'Compatibility', 'Color', 'Condition'],
  },
  smartwatches: {
    name: 'Smartwatches',
    labels: ['Brand', 'Series', 'Case Size', 'Connectivity', 'GPS', 'Cellular', 'Color', 'Compatibility'],
  },
  'smart-glasses': {
    name: 'Smart glasses',
    labels: ['Brand', 'Model', 'Frame Style', 'Connectivity', 'Camera', 'Audio', 'Battery Life', 'Compatibility'],
  },
  cameras: {
    name: 'Cameras',
    labels: ['Brand', 'Model', 'Resolution', 'Lens Mount', 'Video Quality', 'Connectivity', 'Battery', 'In the Box'],
  },
  'content-creation-kits': {
    name: 'Content creation kits',
    labels: ['Brand', 'Model', 'Kit Type', 'Compatibility', 'Connectivity', 'Power Source', 'Mount Type', 'In the Box'],
  },
  'camera-recording-gear': {
    name: 'Camera & recording gear',
    labels: ['Brand', 'Model', 'Gear Type', 'Resolution', 'Compatibility', 'Connectivity', 'Power Source', 'In the Box'],
  },
  'storage-media': {
    name: 'Storage & media',
    labels: ['Brand', 'Model', 'Capacity', 'Storage Type', 'Read Speed', 'Write Speed', 'Interface', 'Compatibility'],
  },
  computing: {
    name: 'Computing',
    labels: ['Brand', 'Model', 'Processor', 'RAM', 'Storage', 'Display', 'Operating System', 'Ports'],
  },
  'computing-accessories': {
    name: 'Computing & accessories',
    labels: ['Brand', 'Model', 'Compatibility', 'Connectivity', 'Power Source', 'Color', 'Warranty', 'In the Box'],
  },
  'smartphones-tablets': {
    name: 'Smartphones & tablets',
    labels: ['Brand', 'Model', 'RAM', 'Storage', 'Display', 'Camera', 'Battery', 'Network'],
  },
  'android-phones-tablets': {
    name: 'Android phones & tablets',
    labels: ['Brand', 'Model', 'RAM', 'Storage', 'Display', 'Camera', 'Battery', 'Network'],
  },
  'iphones-uk-used': {
    name: 'iPhones UK used',
    labels: ['Brand', 'Model', 'Storage', 'Condition', 'SIM', 'Battery Health', 'Color', 'Network'],
  },
  'laptops-monitors': {
    name: 'Laptops & monitors',
    labels: ['Brand', 'Model', 'Processor', 'RAM', 'Storage', 'Screen Size', 'Resolution', 'Ports'],
  },
  monitors: {
    name: 'Monitors',
    labels: ['Brand', 'Model', 'Screen Size', 'Resolution', 'Panel Type', 'Refresh Rate', 'Ports', 'Bezel Type'],
  },
  'computer-peripherals': {
    name: 'Computer peripherals',
    labels: ['Brand', 'Model', 'Peripheral Type', 'Connectivity', 'Compatibility', 'Power Source', 'Color', 'Features'],
  },
  'smart-home': {
    name: 'Smart home',
    labels: ['Brand', 'Model', 'Device Type', 'Connectivity', 'Power Source', 'App Support', 'Voice Assistant', 'Compatibility'],
  },
  'home-appliances-comfort': {
    name: 'Home appliances & comfort',
    labels: ['Brand', 'Model', 'Appliance Type', 'Capacity', 'Power Rating', 'Energy Rating', 'Color', 'Warranty'],
  },
  'kitchen-refrigeration': {
    name: 'Kitchen & refrigeration',
    labels: ['Brand', 'Model', 'Appliance Type', 'Capacity', 'Power Rating', 'Energy Rating', 'Material', 'Warranty'],
  },
  'cooling-air-care': {
    name: 'Cooling & air care',
    labels: ['Brand', 'Model', 'Cooling Type', 'Power Rating', 'Capacity', 'Remote Control', 'Energy Rating', 'Warranty'],
  },
  'rechargeable-fans': {
    name: 'Rechargeable fans',
    labels: ['Brand', 'Model', 'Size', 'Power Source', 'Battery Capacity', 'Solar Panel', 'Mist Function', 'Speed Levels'],
  },
  'networking-connectivity': {
    name: 'Networking & connectivity',
    labels: ['Brand', 'Model', 'Network Type', 'Speed', 'Bands', 'SIM Support', 'Battery', 'Ports'],
  },
  'mifi-routers': {
    name: 'MiFi & routers',
    labels: ['Brand', 'Model', 'Network Type', 'Speed', 'SIM Support', 'Battery Capacity', 'Wi-Fi Standard', 'Ports'],
  },
  'satellite-internet': {
    name: 'Satellite internet',
    labels: ['Brand', 'Model', 'Kit Type', 'Speed', 'Coverage', 'Power Source', 'Mount Type', 'In the Box'],
  },
  'power-charging': {
    name: 'Power & charging',
    labels: ['Brand', 'Model', 'Capacity', 'Output Power', 'Input Power', 'Ports', 'Fast Charging', 'Compatibility'],
  },
  powerbanks: {
    name: 'Powerbanks',
    labels: ['Brand', 'Model', 'Capacity', 'Output Power', 'Input Power', 'Ports', 'Fast Charging', 'Battery Type'],
  },
  'fast-chargers': {
    name: 'Fast chargers',
    labels: ['Brand', 'Model', 'Output Power', 'Ports', 'Charging Standard', 'Cable Included', 'Compatibility', 'Safety Features'],
  },
  'surge-extensions': {
    name: 'Power extensions & surge protectors',
    labels: ['Brand', 'Model', 'Number of Sockets', 'Cable Length', 'Surge Protection', 'USB Ports', 'Power Rating', 'Safety Switch'],
  },
  'power-stations-generators': {
    name: 'Power stations & solar generators',
    labels: ['Brand', 'Model', 'Battery Capacity', 'Output Power', 'AC Outlets', 'Solar Input', 'Charging Time', 'Weight'],
  },
  'security-surveillance': {
    name: 'Security & surveillance',
    labels: ['Brand', 'Model', 'Device Type', 'Resolution', 'Connectivity', 'Power Source', 'Storage Support', 'Night Vision'],
  },
  'cctv-cameras': {
    name: 'CCTV cameras',
    labels: ['Brand', 'Model', 'Resolution', 'Lens Type', 'Night Vision', 'Connectivity', 'Storage Support', 'Weather Resistance'],
  },
  'smart-locks': {
    name: 'Smart locks',
    labels: ['Brand', 'Model', 'Unlock Methods', 'Connectivity', 'Power Source', 'Door Compatibility', 'App Support', 'Material'],
  },
  'drones-accessories': {
    name: 'Drones & accessories',
    labels: ['Brand', 'Model', 'Product Type', 'Flight Time', 'Camera', 'Range', 'Battery', 'In the Box'],
  },
  drones: {
    name: 'Drones',
    labels: ['Brand', 'Model', 'Flight Time', 'Camera', 'Video Quality', 'Range', 'Battery', 'Weight'],
  },
  'drone-audio-mics': {
    name: 'Drone audio & mics',
    labels: ['Brand', 'Model', 'Microphone Type', 'Connectivity', 'Battery Life', 'Range', 'Compatibility', 'In the Box'],
  },
  'sport-equipment': {
    name: 'Sport equipment',
    labels: ['Brand', 'Model', 'Equipment Type', 'Material', 'Max Load', 'Adjustable', 'Dimensions', 'Use Case'],
  },
  'bodyweight-training': {
    name: 'Bodyweight training',
    labels: ['Brand', 'Model', 'Equipment Type', 'Material', 'Max Load', 'Adjustable', 'Foldable', 'Use Case'],
  },
  'strength-training': {
    name: 'Strength training',
    labels: ['Brand', 'Model', 'Equipment Type', 'Weight', 'Material', 'Adjustable', 'Grip Type', 'Use Case'],
  },
}

export function getSpecTemplateForCategory(
  category: CategoryLike | null | undefined,
  categories: CategoryLike[] = [],
): ProductSpecTemplate {
  if (!category) return defaultTemplate

  const parent = category.parentId ? categories.find(item => item.id === category.parentId) : undefined
  return templates[category.slug] ?? (parent ? templates[parent.slug] : undefined) ?? defaultTemplate
}

