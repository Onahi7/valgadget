'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Category } from '@/lib/services/category.service'
import type { CategoryTreeNode } from '@/lib/category-hierarchy'
import { categoryIsAvailable } from '@/lib/category-navigation'
import { cn } from '@/lib/utils'

interface CategoryTreeMenuProps {
  nodes: CategoryTreeNode<Category>[]
  pathname: string
  idPrefix: string
  variant: 'desktop' | 'mobile'
}

type CategoryTreeItemProps = Omit<CategoryTreeMenuProps, 'nodes'> & {
  node: CategoryTreeNode<Category>
  depth: number
}

function nodeContainsPath(node: CategoryTreeNode<Category>, pathname: string): boolean {
  return pathname === `/categories/${node.slug}` || node.children.some(child => nodeContainsPath(child, pathname))
}

function CategoryTreeItem({
  node,
  pathname,
  idPrefix,
  variant,
  depth,
}: CategoryTreeItemProps) {
  const active = nodeContainsPath(node, pathname)
  const [expanded, setExpanded] = useState(active)
  const available = categoryIsAvailable(node)
  const hasChildren = node.children.length > 0
  const panelId = `${idPrefix}-${node.id}`

  useEffect(() => {
    if (active) setExpanded(true)
  }, [active])

  if (!available) {
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-muted-foreground',
          variant === 'desktop' ? 'min-h-10' : 'min-h-11',
        )}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        aria-disabled="true"
      >
        <span>{node.name}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide">Soon</span>
      </div>
    )
  }

  if (!hasChildren) {
    return (
      <Link
        href={`/categories/${node.slug}`}
        className={cn(
          'flex min-h-11 items-center justify-between rounded-md py-2.5 text-sm transition-colors hover:bg-muted hover:text-primary',
          depth === 0 && 'font-semibold',
          pathname === `/categories/${node.slug}` && 'bg-[#EDF5EF] font-semibold text-primary',
        )}
        style={{ paddingLeft: `${12 + depth * 14}px`, paddingRight: '12px' }}
      >
        <span>{node.name}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </Link>
    )
  }

  return (
    <div className={cn(depth === 0 && 'border-b border-border/70 last:border-0')}>
      <button
        type="button"
        onClick={() => setExpanded(current => !current)}
        className={cn(
          'flex min-h-11 w-full items-center justify-between rounded-md py-2.5 text-left text-sm font-semibold transition-colors hover:bg-muted hover:text-primary',
          active && 'text-primary',
          expanded && depth === 0 && 'bg-[#EDF5EF] text-primary',
        )}
        style={{ paddingLeft: `${12 + depth * 14}px`, paddingRight: '12px' }}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span>
          <span className="block">{node.name}</span>
          {depth === 0 ? (
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              {node.children.length} {node.children.length === 1 ? 'subcategory' : 'subcategories'}
            </span>
          ) : null}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
      </button>

      {expanded ? (
        <div id={panelId} className={cn('mb-1', depth === 0 && 'border-l-2 border-[#DCE4DE]')}>
          <Link
            href={`/categories/${node.slug}`}
            className="flex min-h-10 items-center justify-between rounded-md py-2 text-xs font-bold text-primary hover:bg-muted"
            style={{ paddingLeft: `${12 + (depth + 1) * 14}px`, paddingRight: '12px' }}
          >
            Shop all {node.name}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          {node.children.map(child => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              pathname={pathname}
              idPrefix={idPrefix}
              variant={variant}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CategoryTreeMenu({ nodes, pathname, idPrefix, variant }: CategoryTreeMenuProps) {
  if (nodes.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">No categories available.</p>
  }

  return (
    <>
      {nodes.map(node => (
        <CategoryTreeItem
          key={node.id}
          node={node}
          pathname={pathname}
          idPrefix={idPrefix}
          variant={variant}
          depth={0}
        />
      ))}
    </>
  )
}
