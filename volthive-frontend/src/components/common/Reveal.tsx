'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Direction content slides in from. */
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}

/**
 * Scroll-reveal wrapper — content fades and slides in from a side when it
 * enters the viewport. Uses the site's premium easing for a slow, serene feel.
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.85,
  distance = 50,
  className,
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const offsets = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
  };
  const offset = offsets[direction];

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, ...offset }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
