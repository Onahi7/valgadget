export type CategoryHierarchyItem = {
  id: string
  name: string
  parentId?: string | null
  sortOrder?: number | null
  productCount?: number
}

export type CategoryTreeNode<T extends CategoryHierarchyItem> = Omit<T, 'children'> & {
  children: CategoryTreeNode<T>[]
}

function compareCategories<T extends CategoryHierarchyItem>(a: T, b: T) {
  const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  return order !== 0 ? order : a.name.localeCompare(b.name)
}

export function buildCategoryTree<T extends CategoryHierarchyItem>(categories: T[]): CategoryTreeNode<T>[] {
  const byId = new Map(categories.map(category => [category.id, category]))
  const childrenByParent = new Map<string, T[]>()

  for (const category of categories) {
    if (!category.parentId || !byId.has(category.parentId) || category.parentId === category.id) continue
    const children = childrenByParent.get(category.parentId) ?? []
    children.push(category)
    childrenByParent.set(category.parentId, children)
  }

  const visiting = new Set<string>()
  const toNode = (category: T): CategoryTreeNode<T> => {
    if (visiting.has(category.id)) return { ...category, children: [] }
    visiting.add(category.id)
    const children = (childrenByParent.get(category.id) ?? [])
      .sort(compareCategories)
      .map(toNode)
    visiting.delete(category.id)
    return { ...category, children }
  }

  return categories
    .filter(category => !category.parentId || !byId.has(category.parentId) || category.parentId === category.id)
    .sort(compareCategories)
    .map(toNode)
}

export function flattenCategoryTree<T extends CategoryHierarchyItem>(tree: CategoryTreeNode<T>[]) {
  const flattened: Array<CategoryTreeNode<T> & { depth: number; path: string[] }> = []

  const visit = (nodes: CategoryTreeNode<T>[], depth: number, path: string[]) => {
    for (const node of nodes) {
      const nextPath = [...path, node.name]
      flattened.push({ ...node, depth, path: nextPath })
      visit(node.children, depth + 1, nextPath)
    }
  }

  visit(tree, 0, [])
  return flattened
}

export function getDescendantCategoryIds<T extends CategoryHierarchyItem>(categories: T[], rootId: string) {
  const childrenByParent = new Map<string, string[]>()
  for (const category of categories) {
    if (!category.parentId) continue
    const children = childrenByParent.get(category.parentId) ?? []
    children.push(category.id)
    childrenByParent.set(category.parentId, children)
  }

  const ids: string[] = []
  const pending = [rootId]
  const visited = new Set<string>()
  while (pending.length > 0) {
    const id = pending.pop()!
    if (visited.has(id)) continue
    visited.add(id)
    ids.push(id)
    pending.push(...(childrenByParent.get(id) ?? []))
  }
  return ids
}

export function withDescendantProductCounts<T extends CategoryHierarchyItem>(categories: T[]): T[] {
  const childrenByParent = new Map<string, string[]>()
  const directCountById = new Map(categories.map(category => [category.id, Number(category.productCount ?? 0)]))

  for (const category of categories) {
    if (!category.parentId) continue
    const children = childrenByParent.get(category.parentId) ?? []
    children.push(category.id)
    childrenByParent.set(category.parentId, children)
  }

  const totals = new Map<string, number>()
  const totalFor = (id: string, visiting: Set<string>): number => {
    const cached = totals.get(id)
    if (cached !== undefined) return cached
    if (visiting.has(id)) return directCountById.get(id) ?? 0
    visiting.add(id)
    const total = (directCountById.get(id) ?? 0) + (childrenByParent.get(id) ?? [])
      .reduce((sum, childId) => sum + totalFor(childId, visiting), 0)
    visiting.delete(id)
    totals.set(id, total)
    return total
  }

  return categories.map(category => ({
    ...category,
    productCount: totalFor(category.id, new Set()),
  }))
}

export function getCategoryDescendantSet<T extends CategoryHierarchyItem>(categories: T[], rootId: string) {
  return new Set(getDescendantCategoryIds(categories, rootId).slice(1))
}

export function getCategoryLineage<T extends CategoryHierarchyItem>(categories: T[], categoryId: string) {
  const byId = new Map(categories.map(category => [category.id, category]))
  const lineage: T[] = []
  const visited = new Set<string>()
  let current = byId.get(categoryId)

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    lineage.unshift(current)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }

  return lineage
}
