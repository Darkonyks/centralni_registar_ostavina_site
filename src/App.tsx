import { CookieBanner } from './components/consent/CookieBanner';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { AccessControl } from './components/sections/AccessControl';
import { Benefits } from './components/sections/Benefits';
import { Contact } from './components/sections/Contact';
import { DashboardSection } from './components/sections/DashboardSection';
import { FinalCta } from './components/sections/FinalCta';
import { Hero } from './components/sections/Hero';
import { Lifecycle } from './components/sections/Lifecycle';
import { Pricing } from './components/sections/Pricing';

export default function App() {
  return (
    <>
      <a
        href="#sadrzaj"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-800 focus:shadow-lg"
      >
        Preskoči na sadržaj
      </a>
      <Header />
      <main id="sadrzaj" tabIndex={-1} className="outline-none">
        <Hero />
        <Benefits />
        <DashboardSection />
        <Lifecycle />
        <AccessControl />
        <Pricing />
        <FinalCta />
        <Contact />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
