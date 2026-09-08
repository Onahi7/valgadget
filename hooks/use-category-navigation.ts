'use client'

import { useEffect, useState } from 'react'
import { buildCategoryGroups, FALLBACK_NAV_CATEGORIES, type CategoryGroup } from '@/lib/category-navigation'
import { categoryService, type Category } from '@/lib/services/category.service'

let categoryRequest: Promise<Category[]> | null = null

function loadCategories() {
  categoryRequest ??= categoryService.getFlat().catch(() => FALLBACK_NAV_CATEGORIES)
  return categoryRequest
}

export function useCategoryNavigation() {
  const [groups, setGroups] = useState<CategoryGroup[]>(() => buildCategoryGroups(FALLBACK_NAV_CATEGORIES))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    loadCategories()
      .then(categories => {
        if (active && Array.isArray(categories) && categories.length > 0) {
          setGroups(buildCategoryGroups(categories))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { groups, loading }
}
