'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Warns users before navigating away when there are unsaved changes.
 * Usage: const { dirty, reset } = useUnsavedChanges(isDirty)
 */
export function useUnsavedChanges(isDirty: boolean) {
  const dirtyRef = useRef(isDirty)
  dirtyRef.current = isDirty

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const reset = useCallback(() => {
    dirtyRef.current = false
  }, [])

  return { dirty: isDirty, reset }
}
