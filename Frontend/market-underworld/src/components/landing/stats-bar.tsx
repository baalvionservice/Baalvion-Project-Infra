"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

const StatCounter = ({ value, label, prefix = "" }: { value: string, label: string, prefix?: string }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)
  const targetValue = value.replace(/[^0-9.]/g, '')
  const target = parseFloat(targetValue)

  useEffect(() => {
    if (isInView) {
      let start = 0
      const duration = 2000
      const stepTime = 50
      const steps = duration / stepTime
      const increment = target / steps

      const timer = setInterval(() => {
        start += increment
        if (start >= target) {
          setCount(target)
          clearInterval(timer)
        } else {
          setCount(start)
        }
      }, stepTime)
      return () => clearInterval(timer)
    }
  }, [isInView, target])

  return (
    <div ref={ref} className="flex flex-col items-center text-center px-12 lg:border-r border-gray-100 last:border-0 py-12 lg:py-0">
      <div className="text-5xl md:text-6xl font-bold mb-4 flex items-baseline tracking-tight text-gray-900">
        <span className="text-blue-600 mr-1">{prefix}</span>
        <span>{value.includes('.') ? count.toFixed(1) : Math.floor(count).toLocaleString()}</span>
        <span className="text-blue-600 ml-1">{value.includes('+') ? '+' : value.includes('M') ? 'M+' : ''}</span>
      </div>
      <div className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[11px]">{label}</div>
    </div>
  )
}

export const StatsBar = () => {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCounter value="7" label="Global Regions" />
        <StatCounter value="343" label="Expert Teachers" />
        <StatCounter value="3430" label="Active Students" />
        <StatCounter value="2.4" label="$ Crypto Traded" prefix="$" />
      </div>
    </section>
  )
}
