"use client";

import { Children, type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type RevealTextProps = {
  /** cada filho direto vira um item que entra com stagger (ex.: linhas de um título) */
  children: ReactNode;
  /** controla se o bloco está visível — a narrativa decide o momento, não o viewport */
  active: boolean;
  className?: string;
  itemClassName?: string;
  /** segundos entre a entrada de cada item filho */
  stagger?: number;
  delay?: number;
};

const container: Variants = {
  hidden: {},
  visible: {},
};

const item: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export function RevealText({
  children,
  active,
  className,
  itemClassName,
  stagger = 0.08,
  delay = 0,
}: RevealTextProps) {
  const reducedMotion = useReducedMotion();
  const items = Children.toArray(children);

  if (reducedMotion) {
    // sem movimento: todo o conteúdo fica visível e navegável normalmente,
    // sem depender de `active` (que corresponde a um estágio de scroll que
    // deixa de existir quando a narrativa vira um fluxo estático).
    return (
      <div className={className}>
        {items.map((child, index) => (
          <div key={index} className={itemClassName}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <motion.div
        initial="hidden"
        animate={active ? "visible" : "hidden"}
        variants={container}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
      >
        {items.map((child, index) => (
          <motion.div key={index} variants={item} className={itemClassName}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
