"use client";
import React from "react";
import { motion } from "motion/react";

export type Testimonial = {
  text: string;
  /** Ausente quando o membro não tem foto -- cai no círculo com iniciais. */
  image?: string;
  name: string;
  /** Metadado curto abaixo do nome (aqui: data relativa da avaliação, não cargo). */
  role: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="w-full max-w-xs rounded-2xl border border-border bg-white p-6" key={i}>
                  <div className="text-[15px] leading-relaxed text-foreground/85">{text}</div>
                  <div className="mt-4 flex items-center gap-3">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img width={40} height={40} src={image} alt={name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
                        {initials(name)}
                      </span>
                    )}
                    <div className="flex flex-col">
                      <div className="text-[14px] font-medium leading-5 tracking-tight text-foreground">{name}</div>
                      <div className="text-[13px] leading-5 tracking-tight text-muted">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
