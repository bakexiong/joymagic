"use client";

import React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  stagger?: boolean;
}

export function ScrollAnimation({
  children,
  className = "",
  delay = 0,
  direction = "up",
  stagger = false,
}: ScrollAnimationProps) {
  const ref = useRef(null);
  const [mounted, setMounted] = React.useState(false);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const isInView = useInView(ref, {
    once: true,
    margin: "-50px",
  });

  // Respect user's reduced motion preference (accessibility)
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isInView && mounted && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, mounted, hasAnimated]);

  // If user prefers reduced motion, show content directly
  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  // On server side or before mount, show content with animation styles but visible
  if (!mounted) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 30, x: 0 };
      case "down":
        return { y: -30, x: 0 };
      case "left":
        return { x: 30, y: 0 };
      case "right":
        return { x: -30, y: 0 };
      default:
        return { y: 30, x: 0 };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      ...getInitialPosition(),
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  if (stagger) {
    return (
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial={hasAnimated && isInView ? "hidden" : "visible"}
        animate={hasAnimated && isInView ? "visible" : "visible"}
        className={className}
      >
        {React.Children.map(children, (child) => (
          <motion.div
            variants={itemVariants}
            initial={hasAnimated && isInView ? "hidden" : "visible"}
            animate={hasAnimated && isInView ? "visible" : "visible"}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...getInitialPosition(),
        filter: "blur(4px)",
      }}
      animate={
        hasAnimated
          ? isInView
            ? {
                opacity: 1,
                x: 0,
                y: 0,
                filter: "blur(0px)",
              }
            : {
                opacity: 1,
                ...getInitialPosition(),
                filter: "blur(4px)",
              }
          : {
              opacity: 1,
              x: 0,
              y: 0,
              filter: "blur(0px)",
            }
      }
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
