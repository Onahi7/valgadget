import type { Category } from '@/lib/services/category.service'
import { buildCategoryTree, type CategoryTreeNode } from '@/lib/category-hierarchy'

export interface CategoryGroup {
  parent: CategoryTreeNode<Category>
  children: CategoryTreeNode<Category>[]
}

export function categoryIsAvailable(category: Category) {
  return (category.productCount ?? 0) > 0
}

export function buildCategoryGroups(categories: Category[]): CategoryGroup[] {
  const active = categories.filter(category => category.isActive !== false)
  const sortCategories = (a: Category, b: Category) => {
    const availability = Number(categoryIsAvailable(b)) - Number(categoryIsAvailable(a))
    if (availability !== 0) return availability
    const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    return order !== 0 ? order : a.name.localeCompare(b.name)
  }

  return buildCategoryTree(active)
    .sort(sortCategories)
    .map(node => ({
      parent: node,
      children: node.children.sort(sortCategories),
    }))
}
