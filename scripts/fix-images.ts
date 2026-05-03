import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import { db } from '../lib/server/db'
import { products } from '../lib/server/schema'
import { eq } from 'drizzle-orm'

const IMAGE_MAP: Record<string, string[]> = {
  'PWR-ORA-TRAV4':      ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80'],
  'PWR-ITE-20K':        ['https://images.unsplash.com/photo-1618410320928-25b4b3e5e5e8?auto=format&fit=crop&w=800&q=80'],
  'PWR-ANK-33W':        ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'],
  'PWR-LON-SURGE6':     ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'],
  'PWR-ECO-RIVER2':     ['https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?auto=format&fit=crop&w=800&q=80'],

  'AUD-ANK-R50I':       ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'],
  'AUD-ORA-BOOMPOP2':   ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
  'AUD-JBL-FLIP6':      ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80'],
  'AUD-PS5-SLIM':       ['https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=800&q=80'],
  'AUD-LG-55-4K':       ['https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80'],
  'AUD-XGI-MOGO2':      ['https://images.unsplash.com/photo-1626379953822-baec19c3accd?auto=format&fit=crop&w=800&q=80'],

  'COM-HP-PAV15':       ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'],
  'COM-DEL-24IPS':      ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'],
  'COM-LOG-MK270':      ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'],

  'HOM-HTC-REF200':     ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80'],
  'HOM-BIN-BLG600':     ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80'],
  'HOM-LG-15HP-AC':     ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80'],
  'HOM-QAS-SOLARFAN':   ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'],

  'NET-TPL-M7350':      ['https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=800&q=80'],
  'NET-STR-STD-KIT':    ['https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80'],

  'WEA-RBM-META':       ['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80'],

  'SEC-HIK-4MP':        ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80'],
  'SEC-YAL-SMARTLOCK':  ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'],

  'DRN-DJI-MINI4PRO':   ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=80'],
  'DRN-DJI-MIC2':       ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80'],

  'CCK-ULA-TRIPOD':     ['https://images.unsplash.com/photo-1617886759934-8bb94f0e5cb8?auto=format&fit=crop&w=800&q=80'],
  'CCK-CAN-M50II':      ['https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=800&q=80'],
  'CCK-GDX-LED':        ['https://images.unsplash.com/photo-1601944179066-29786cb9d32a?auto=format&fit=crop&w=800&q=80'],
  'CCK-SND-128USB':     ['https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=800&q=80'],

  'SPT-PUSH-14IN1':     ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80'],
  'SPT-DUMB-24KG':      ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80'],
}

async function run() {
  let updated = 0
  for (const [sku, images] of Object.entries(IMAGE_MAP)) {
    await db.update(products)
      .set({ images, updatedAt: new Date() })
      .where(eq(products.sku, sku))
    updated++
    process.stdout.write(`\r  Fixed ${updated}/${Object.keys(IMAGE_MAP).length}: ${sku}`)
  }
  console.log(`\nDone — updated ${updated} products.`)
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
