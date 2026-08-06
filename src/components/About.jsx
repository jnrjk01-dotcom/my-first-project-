import { useReveal } from '../hooks/useMotion';
import AssetImage from './AssetImage';

export default function About() {
  const textRef = useReveal({ y: 28 });
  const imgRef = useReveal({ y: 34 });

  return (
    <section id="about" className="section">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Asymmetric: image takes 5 of 12 and sits lower than the text baseline. */}
        <div ref={imgRef} className="lg:col-span-5 lg:pt-16">
          <AssetImage
            assetKey="interior.consult"
            className="rounded-softer"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />

          {/* Pull-figure, deliberately breaking the grid edge on desktop. */}
          <div className="relative z-10 mx-4 -mt-12 rounded-soft bg-accent px-6 py-5 text-white lg:-mr-16 lg:ml-8">
            <div className="font-display text-[42px] leading-none tracking-[-0.04em]">
              1 visit
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-white/85">
              Crowns, inlays and onlays are designed, milled and fitted the same day.
            </p>
          </div>
        </div>

        <div ref={textRef} className="lg:col-span-6 lg:col-start-7">
          <p className="eyebrow">About the practice</p>

          <h2 className="display-lg mt-5 max-w-[18ch]">
            A dental practice that runs on time.
          </h2>

          <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-ink2 md:text-[17px]">
            <p>
              We book one patient per slot and we start on the hour. That is the whole
              approach. Appointments are longer than they are at most practices because a
              hygiene visit that is booked for 45 minutes takes 45 minutes.
            </p>
            <p>
              The building has an iTero Element intraoral scanner, a cone beam CT for
              implant planning, and a chairside milling unit. The mill is why a crown can
              be finished in a morning: the tooth is scanned, the crown is designed on
              screen, and it is milled from a single block of lithium disilicate ceramic in
              the room next door.
            </p>
            <p>
              A first visit starts with ten minutes of talking, not instruments. We go
              through your history, what has been bothering you, and when you last saw a
              dentist. Then we look, take X-rays if you are due them, and tell you what we
              found and what it costs. You leave with a written estimate that holds for 90
              days.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
