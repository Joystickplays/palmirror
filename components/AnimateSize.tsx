import classNames from 'classnames'
import { motion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'

interface AnimateChangeInSizeProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const AnimateChangeInSize: React.FC<AnimateChangeInSizeProps> = ({
  children,
  className,
  style,
}) => {
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ width: number | 'auto'; height: number | 'auto' }>({
    width: 'auto',
    height: 'auto',
  })

  useEffect(() => {
    if (measureRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const rect = entries[0].contentRect
        setSize({
          width: rect.width,
          height: rect.height,
        })
      })

      resizeObserver.observe(measureRef.current)

      return () => resizeObserver.disconnect()
    }
  }, [])

  return (
    <motion.div
      style={{ overflow: 'hidden', display: 'inline-block', ...style }}
      animate={{ width: size.width, height: size.height }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className={classNames(className)}
    >
      <div
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>

      <div className={classNames(className)}>{children}</div>
    </motion.div>
  )
}
