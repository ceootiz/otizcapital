"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@otiz/lib";

export function SectionShell({
  id,
  title,
  subtitle,
  children,
  className
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section id={id} className={cn("relative py-24 sm:py-28 lg:py-36", className)}>
      <div className="container relative z-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-5 text-center"
        >
          <h2 className="font-display text-4xl font-medium leading-tight tracking-[-0.045em] text-balance text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          {subtitle ? <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">{subtitle}</p> : null}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 26 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
