import classNames from 'classnames'
import { motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'

interface AnimateChangeInHeightProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  instantOnFirstMount?: boolean
}

export const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({ children, className, style, instantOnFirstMount = false }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')
  const [forceInstant, setForceInstant] = useState(instantOnFirstMount)

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const observedHeight = entries[0].contentRect.height
        setHeight(observedHeight)
      })

      resizeObserver.observe(containerRef.current)

      return () => {
        // Cleanup the observer when the component is unmounted
        resizeObserver.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (forceInstant && height !== 'auto') {
      const t = setTimeout(() => setForceInstant(false), 50)
      return () => clearTimeout(t)
    }
  }, [height, forceInstant])

  return (
    <motion.div
      className={classNames(className, 'overflow-hidden')}
      style={{ height, ...style }}
      animate={{ height }}
      transition={forceInstant ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 23 }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  )
}
