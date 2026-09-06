/**
 * On-page search setup for a Bulawayo dental practice.
 *
 *   node assets/brand/seo.mjs
 *
 * The pages were carrying the template's own wording: "Dental Care Centre | Modern, Gentle
 * Dentistry", with no mention of Bulawayo or Zimbabwe anywhere a search engine weighs
 * heavily. A patient in Bulawayo searching "dentist near me", "root canal Bulawayo" or
 * "teeth whitening Zimbabwe" had nothing to match on but a footer address.
 *
 * WHAT THIS SETS.
 *   - Titles and descriptions naming the city and the procedures people actually type.
 *   - lang="en-ZW", so the country is declared rather than inferred.
 *   - A Dentist record in JSON-LD: address, phone, opening hours, area served and the
 *     full treatment list. This is the machine-readable version of the practice, and it is
 *     what a search engine reads when deciding whether to show the clinic in a local
 *     result. Every value in it comes from the site's own contact block. There is no geo
 *     block: coordinates cannot be verified from here and a wrong pin is worse than none.
 *   - Open Graph and Twitter fields, so a link shared on WhatsApp shows the practice
 *     rather than a bare URL.
 *
 * WHAT IT DELIBERATELY DOES NOT SET. Canonical tags, og:url, an absolute og:image,
 * sitemap.xml and robots.txt all need the real domain, and a wrong canonical is one of the
 * few SEO mistakes that actively removes a site from results. Those are in set-domain.mjs,
 * to be run once the domain exists.
 *
 * Idempotent: reads the current values, writes the intended ones, and reports which pages
 * actually changed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* ── The practice, as stated on the site itself ──────────────────────────── */
const PRACTICE = {
  name: 'Dental Care Centre',
  street: 'Sunninghill Building, Suite Four, Cnr Fife Street & 14th Avenue',
  city: 'Bulawayo',
  country: 'ZW',
  phone: '+263292263687',
  whatsapp: '+263777804093',
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], open: '08:00', close: '17:00' },
    { days: ['Saturday'], open: '08:00', close: '13:00' },
  ],
  treatments: [
    'Consultation and Examination', 'Scaling and Polishing', 'Fillings', 'Root Canal Treatment',
    'Tooth Extraction', 'Surgical Extraction', 'Dental Crowns', 'Dental Bridges', 'Dentures',
    'Dental Implants', 'Veneers', 'Teeth Whitening', 'Braces and Orthodontics',
  ],
};

/* ── Per page. Descriptions sit at 150-160 characters, which is what a result actually
      shows before it is cut off. No em dashes: the copy across this site avoids them. ── */
const META = {
  'index.html': {
    title: 'Dentist in Bulawayo | Dental Care Centre',
    description:
      'Dental Care Centre is a dental clinic in central Bulawayo: check-ups, cleaning, ' +
      'fillings, root canals, extractions, crowns, dentures, implants and braces.',
  },
  'about.html': {
    title: 'About Our Bulawayo Dental Clinic | Dental Care Centre',
    description:
      'Meet the team at Dental Care Centre in Bulawayo: our dentists, our clinic on Fife ' +
      'Street, and how we care for patients of every age.',
  },
  'service.html': {
    title: 'Dental Treatments in Bulawayo | Dental Care Centre',
    description:
      'Every treatment offered at Dental Care Centre in Bulawayo, from scaling and ' +
      'polishing to root canals, crowns, dentures, implants, braces and teeth whitening.',
  },
  'privacy.html': {
    title: 'Privacy Policy | Dental Care Centre, Bulawayo',
    description:
      'How Dental Care Centre in Bulawayo collects, uses and protects the personal ' +
      'information of its patients and website visitors.',
  },
  'terms.html': {
    title: 'Terms &amp; Conditions | Dental Care Centre, Bulawayo',
    description:
      'The terms on which Dental Care Centre in Bulawayo provides this website and the ' +
      'information published on it.',
  },
};

/* Copy edits that put the city where a reader and a search engine both see it. Both of
   these were template leftovers: the first is not a complete sentence, and the second
   says nothing about where the practice is. */
const COPY = [
  {
    from: '<p data-w-id="59cae1c0-9ae0-0825-f9e9-7645d908b0e0" style="opacity:0" class="home-hero_para">We combine modern technology with heartfelt service to ensure every generation.</p>',
    to: '<p data-w-id="59cae1c0-9ae0-0825-f9e9-7645d908b0e0" style="opacity:0" class="home-hero_para">Gentle, modern dentistry in the centre of Bulawayo, for every member of your family.</p>',
  },
  {
    from: '<h1 hero-text-split="" class="heading">Comprehensive Dental Care, Tailored to You</h1>',
    to: '<h1 hero-text-split="" class="heading">Comprehensive Dental Care in Bulawayo</h1>',
  },
];

/* ── The Dentist record ──────────────────────────────────────────────────── */
function jsonLd(description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: PRACTICE.name,
    description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: PRACTICE.street,
      addressLocality: PRACTICE.city,
      addressCountry: PRACTICE.country,
    },
    telephone: PRACTICE.phone,
    areaServed: { '@type': 'City', name: PRACTICE.city },
    medicalSpecialty: 'Dentistry',
    openingHoursSpecification: PRACTICE.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.open,
      closes: h.close,
    })),
    availableService: PRACTICE.treatments.map((t) => ({
      '@type': 'MedicalProcedure',
      name: t,
    })),
  };
}

const LD_OPEN = '<script type="application/ld+json">';
const LD_RE = /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g;

const PAGES = Object.keys(META);
const TREES = ['', 'variant-blue/'];

let changed = 0;
for (const tree of TREES) {
  for (const page of PAGES) {
    const rel = tree + page;
    const p = join(ROOT, rel);
    let h;
    try {
      h = readFileSync(p, 'utf8');
    } catch {
      console.log(`  missing: ${rel}`);
      continue;
    }
    const before = h;
    const { title, description } = META[page];

    // The country belongs in the language tag; "en" alone says nothing about where.
    h = h.replace(/<html lang="en"[^>]*>/, '<html lang="en-ZW">');

    h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);

    /* Webflow writes these with content first and the name second, which is why a search
       for the usual attribute order finds nothing here. */
    const setMeta = (attr, key, value) =>
      (h = h.replace(
        new RegExp(`<meta content="[^"]*" ${attr}="${key}"\\s*/?>`),
        `<meta content="${value}" ${attr}="${key}"/>`
      ));

    setMeta('name', 'description', description);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:description', description);
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);

    /* Shared on WhatsApp, which is how most of this site's links will travel, these are
       what turn a bare URL into a card with the practice's name on it. */
    if (!h.includes('og:site_name')) {
      h = h.replace(
        /(<meta property="og:type"[^>]*>)/,
        `$1\n        <meta content="${PRACTICE.name}" property="og:site_name"/>` +
        '\n        <meta content="en_ZW" property="og:locale"/>'
      );
    }

    // Replace any previous record rather than accumulating one per run.
    h = h.replace(LD_RE, '');
    const ld = LD_OPEN + '\n' + JSON.stringify(jsonLd(description), null, 2) + '\n</' + 'script>\n    ';
    h = h.replace('</head>', ld + '</head>');

    for (const c of COPY) h = h.split(c.from).join(c.to);

    if (h !== before) {
      writeFileSync(p, h);
      changed += 1;
      console.log(`  ${rel}`);
    }
  }
}

console.log(`\n${changed} page(s) updated`);
console.log('canonical tags, og:url, sitemap.xml and robots.txt still need the domain:');
console.log('  node assets/brand/set-domain.mjs dentalcarecentre.co.zw');
