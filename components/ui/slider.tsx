"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <motion.div
    className={cn(
      "relative w-full touch-none select-none items-center",
      className
    )}
    drag={"x"}
    dragConstraints={{ left: 0, right: 0 }}
    dragElastic={0.03}

    dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
  >
    <SliderPrimitive.Root
      ref={ref}
      className="relative flex h-5 w-full select-none items-center"
      {...props}
    >
      <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-6 w-2 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  </motion.div>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
