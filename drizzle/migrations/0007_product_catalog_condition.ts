import { sql } from 'drizzle-orm'

/** Add first-class condition data for gadget catalogue filtering and display. */
export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS condition VARCHAR(30) NOT NULL DEFAULT 'brand-new';

    UPDATE products
    SET condition = CASE
      WHEN tags::jsonb ? 'uk-used' THEN 'uk-used'
      WHEN tags::jsonb ? 'us-used' THEN 'us-used'
      WHEN tags::jsonb ? 'naija-used' THEN 'naija-used'
      WHEN tags::jsonb ? 'refurbished' THEN 'refurbished'
      WHEN tags::jsonb ? 'open-box' THEN 'open-box'
      ELSE condition
    END;

    UPDATE products p
    SET condition = 'uk-used'
    FROM categories c
    WHERE p.category_id = c.id
      AND c.slug = 'iphones-uk-used'
      AND p.condition = 'brand-new';

    CREATE INDEX IF NOT EXISTS products_condition_idx
    ON products(condition);
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    DROP INDEX IF EXISTS products_condition_idx;
    ALTER TABLE products DROP COLUMN IF EXISTS condition;
  `)
}
