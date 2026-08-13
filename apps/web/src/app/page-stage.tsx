import type { ReactNode } from "react";

import { HeroBackdrop } from "./hero-backdrop";

export function PageStage({ children }: { children: ReactNode }) {
  return (
    <main>
      <section className="hero" aria-hidden="true">
        <HeroBackdrop />
      </section>
      {children}
    </main>
  );
}
