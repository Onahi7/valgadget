import type { Category } from '@/lib/services/category.service'

export interface CategoryGroup {
  parent: Category
  children: Category[]
}

const fallbackTimestamp = '2026-09-08T00:00:00.000Z'

function fallbackCategory(
  id: string,
  name: string,
  slug: string,
  productCount: number,
  sortOrder: number,
  parentId?: string,
): Category {
  return {
    id,
    name,
    slug,
    productCount,
    parentId,
    isActive: true,
    sortOrder,
    createdAt: fallbackTimestamp,
    updatedAt: fallbackTimestamp,
  }
}

export const FALLBACK_NAV_CATEGORIES: Category[] = [
  fallbackCategory('fallback-iphones', 'iPhones', 'iphones', 2, 10),
  fallbackCategory('fallback-iphones-new', 'Brand New iPhones', 'iphones-brand-new', 1, 11, 'fallback-iphones'),
  fallbackCategory('fallback-iphones-used', 'UK Used iPhones', 'iphones-uk-used', 1, 12, 'fallback-iphones'),
  fallbackCategory('fallback-laptops', 'Laptops', 'laptops', 18, 20),
  fallbackCategory('fallback-laptops-new', 'Brand New Laptops', 'laptops-brand-new', 1, 21, 'fallback-laptops'),
  fallbackCategory('fallback-laptops-used', 'UK Used Laptops', 'laptops-uk-used', 17, 22, 'fallback-laptops'),
  fallbackCategory('fallback-tablets', 'Tablets', 'tablets', 1, 30),
  fallbackCategory('fallback-audio', 'Audio', 'audio-entertainment', 2, 40),
  fallbackCategory('fallback-earbuds', 'Earbuds', 'earbuds', 0, 41, 'fallback-audio'),
  fallbackCategory('fallback-headphones', 'Headphones', 'headphones', 0, 42, 'fallback-audio'),
  fallbackCategory('fallback-speakers', 'Speakers', 'speakers', 2, 43, 'fallback-audio'),
  fallbackCategory('fallback-wearables', 'Wearables', 'wearables-smart-devices', 1, 50),
  fallbackCategory('fallback-smartwatches', 'Smartwatches', 'smartwatches', 1, 51, 'fallback-wearables'),
  fallbackCategory('fallback-monitors', 'Monitors', 'monitors', 1, 60),
]

export function categoryIsAvailable(category: Category) {
  return (category.productCount ?? 0) > 0
}

export function buildCategoryGroups(categories: Category[]): CategoryGroup[] {
  const active = categories.filter(category => category.isActive !== false)
  const byId = new Map(active.map(category => [category.id, category]))
  const childrenByParent = new Map<string, Category[]>()
  const parents: Category[] = []

  for (const category of active) {
    if (category.parentId && byId.has(category.parentId)) {
      const children = childrenByParent.get(category.parentId) ?? []
      children.push(category)
      childrenByParent.set(category.parentId, children)
    } else {
      parents.push(category)
    }
  }

  const sortCategories = (a: Category, b: Category) => {
    const availability = Number(categoryIsAvailable(b)) - Number(categoryIsAvailable(a))
    if (availability !== 0) return availability
    const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    return order !== 0 ? order : a.name.localeCompare(b.name)
  }

  return parents
    .sort(sortCategories)
    .map(parent => ({
      parent,
      children: (childrenByParent.get(parent.id) ?? []).sort(sortCategories),
    }))
}
