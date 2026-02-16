// ADD THIS: Generic neumorphic card shell
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

export type NeoCardProps<T extends ElementType = 'div'> = {
  as?: T
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

export const NeoCard = <T extends ElementType = 'div'>({
  as,
  className,
  children,
  ...rest
}: NeoCardProps<T>) => {
  const Tag = (as || 'div') as ElementType
  const composed = ['neo-card', 'neo-pressable', className].filter(Boolean).join(' ')
  return (
    <Tag className={composed} {...rest}>
      {children}
    </Tag>
  )
}
