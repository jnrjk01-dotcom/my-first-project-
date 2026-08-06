import { useLenis } from './hooks/useLenis';
import { useReducedMotion } from './hooks/useMotion';
import { BookingProvider } from './lib/BookingContext';

import Header from './components/Header';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import About from './components/About';
import Services from './components/Services';
import TheVisit from './components/TheVisit';
import SmileGallery from './components/SmileGallery';
import Dentists from './components/Dentists';
import Testimonials from './components/Testimonials';
import Insurance from './components/Insurance';
import FAQ from './components/FAQ';
import Booking from './components/Booking';
import Contact from './components/Contact';
import Footer from './components/Footer';
import MobileActionBar from './components/MobileActionBar';
import CustomCursor from './components/CustomCursor';
import DevBanner from './components/DevBanner';

export default function App() {
  const reduced = useReducedMotion();

  // Smooth scroll is an enhancement, never a requirement. Off entirely under
  // reduced motion, where taking over the wheel is the wrong thing to do.
  useLenis(!reduced);

  return (
    <BookingProvider>
      <DevBanner />
      <CustomCursor />
      <Header />

      <main id="main">
        <Hero />
        <TrustBar />
        <About />
        <Services />
        <TheVisit />
        <SmileGallery />
        <Dentists />
        <Testimonials />
        <Insurance />
        <FAQ />
        <Booking />
        <Contact />
      </main>

      <Footer />
      <MobileActionBar />
    </BookingProvider>
  );
}
