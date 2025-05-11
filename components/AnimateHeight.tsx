import classNames from 'classnames'
import { motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'

interface AnimateChangeInHeightProps {
  children: React.ReactNode
  className?: string
}

export const AnimateChangeInHeight: React.FC<AnimateChangeInHeightProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

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

  return (
    <motion.div className={classNames(className, 'overflow-hidden')} style={{ height }} animate={{ height }} transition={{ type: 'spring', stiffness: 200, damping: 23 }}>
      <div ref={containerRef}>{children}</div>
    </motion.div>
  )
}
