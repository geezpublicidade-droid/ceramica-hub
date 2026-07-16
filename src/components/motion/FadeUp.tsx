"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.16, 1, 0.3, 1] as const;

type FadeUpProps = {
  children: ReactNode;
  className?: string;
  /** segundos de atraso — útil pra escalonar itens de uma lista */
  delay?: number;
};

/**
 * Reveal padrão (fade + blur + y ao entrar no viewport) para as cenas fora
 * da narrativa pinada. Quando `prefers-reduced-motion` está ativo, renderiza
 * um <div> puro em vez de motion.div — não basta esvaziar as props do
 * motion.div, porque o SSR sempre assume "com animação" (não há como saber
 * a preferência do usuário no servidor) e o Framer Motion só lê `initial`
 * uma vez, no mount; trocar a forma das props num render seguinte (de
 * whileInView pra animate) deixa o elemento preso em opacity:0. Trocar o
 * próprio elemento (como no RevealText) evita esse problema por completo.
 */
export function FadeUp({ children, className, delay = 0 }: FadeUpProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
