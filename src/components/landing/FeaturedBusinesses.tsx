"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { BusinessAvatar } from "@/components/BusinessAvatar";
import type { Business } from "@/data/businesses";

type FeaturedBusinessesProps = {
  businesses: Business[];
};

const gradients = [
  "linear-gradient(135deg, #2997ff, #0071e3)",
  "linear-gradient(135deg, #5ac8fa, #0071e3)",
  "linear-gradient(135deg, #64d2ff, #2997ff)",
  "linear-gradient(135deg, #0071e3, #5ac8fa)",
  "linear-gradient(135deg, #2997ff, #64d2ff)",
];

function SpotlightContent({ active }: { active: Business }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none select-none text-[clamp(6rem,16vw,11rem)] font-bold leading-none tracking-tight text-white/10"
      >
        {active.initials}
      </span>

      <div className="relative -mt-8 sm:-mt-16">
        <span className="glass-dark inline-block rounded-full px-3 py-1 text-[11px] font-medium">
          Empresa fundadora
        </span>
        <h3 className="mt-5 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight">{active.name}</h3>
        <p className="mt-1 text-[14px] text-white/70">
          {active.category} · {active.floor}
        </p>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/80">{active.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={buildWhatsAppLink(active.phone, active.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black transition-opacity hover:opacity-85"
          >
            Falar no WhatsApp
          </a>
          <Link
            href={`/empresa/${active.id}`}
            className="rounded-full border border-white/30 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </>
  );
}

export function FeaturedBusinesses({ businesses }: FeaturedBusinessesProps) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = businesses[activeIndex];

  if (!active) return null;

  return (
    <section id="empresas-destaque" className="bg-background px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
          Empresas parceiras
        </p>
        <h2 className="mt-4 max-w-xl text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-tight tracking-tight">
          Quem já está construindo essa rede.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          {reducedMotion ? (
            <div
              className="relative overflow-hidden rounded-3xl p-10 text-white sm:p-14"
              style={{ background: gradients[activeIndex % gradients.length] }}
            >
              <SpotlightContent active={active} />
            </div>
          ) : (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl p-10 text-white sm:p-14"
              style={{ background: gradients[activeIndex % gradients.length] }}
            >
              <SpotlightContent active={active} />
            </motion.div>
          )}

          <div className="flex flex-col gap-2">
            {businesses.map((business, index) => (
              <button
                key={business.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                  index === activeIndex
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-white hover:border-primary/20"
                }`}
              >
                <BusinessAvatar
                  business={business}
                  className="h-10 w-10 rounded-full bg-surface"
                  textClassName="text-[12px] font-semibold"
                />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold tracking-tight">{business.name}</p>
                  <p className="truncate text-[12px] text-muted">{business.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
