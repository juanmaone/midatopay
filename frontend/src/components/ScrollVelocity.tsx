'use client'

import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, useAnimationFrame } from 'framer-motion'
import './ScrollVelocity.css'

type AutoScrollProps = {
  children?: React.ReactNode
  velocity?: number
  className?: string
  parallaxClassName?: string
  scrollerClassName?: string
  parallaxStyle?: React.CSSProperties
  scrollerStyle?: React.CSSProperties
}

export default function ScrollVelocity({
  children,
  velocity = 20,
  className = '',
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
  parallaxStyle,
  scrollerStyle
}: AutoScrollProps) {
  const baseX = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useAnimationFrame((_, delta) => {
    const moveBy = velocity * (delta / 1000)
    const currentX = baseX.get()
    
    // Movimiento continuo hacia la izquierda
    let newX = currentX - moveBy
    
    // Reset cuando llega a -25% (una copia completa, ya que tenemos 4 copias)
    if (newX <= -25) {
      newX = newX + 25
    }
    
    baseX.set(newX)
  })

  const x = useTransform(baseX, v => `${v}%`)

  return (
    <div className={parallaxClassName} style={parallaxStyle}>
      <motion.div 
        className={scrollerClassName} 
        style={{ x, ...scrollerStyle }}
        ref={containerRef}
      >
        {/* Repetir el contenido varias veces para efecto continuo */}
        {children}
        {children}
        {children}
        {children}
      </motion.div>
    </div>
  )
}