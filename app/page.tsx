/**
 * XEEBRAND Home Page — `app/page.tsx`
 *
 * Composition of all homepage sections per OS spec §1.2.
 * Server Component — 3D scenes load client-side via next/dynamic (ssr: false).
 *
 * Section order:
 *   1. Hero         — 3D X mark + positioning headline
 *   2. ProofStrip   — metrics + logo marquee (low-motion, high-trust)
 *   3. Capabilities — 4 service pillars, card lift on hover
 *   4. Process      — scroll-scrubbed X disassembly/reassembly
 *   5. Testimonial  — single quote, maximum stillness
 *   6. CTABlock     — magnetic 3D X mark, final conversion
 *   7. Footer       — utility, no animation
 */

import { Hero }         from "@/components/sections/Hero";
import { ProofStrip }   from "@/components/sections/ProofStrip";
import { Capabilities } from "@/components/sections/Capabilities";
import { Process }      from "@/components/sections/Process";
import { Testimonial }  from "@/components/sections/Testimonial";
import { CTABlock }     from "@/components/sections/CTABlock";
import { Footer }       from "@/components/sections/Footer";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProofStrip />
      <Capabilities />
      <Process />
      <Testimonial />
      <CTABlock />
      <Footer />
    </>
  );
}
