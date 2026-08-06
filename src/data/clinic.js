/**
 * SINGLE SOURCE OF TRUTH for every clinic-specific string on the site.
 *
 * ⚠ EVERYTHING IN THIS FILE IS PLACEHOLDER CONTENT.
 * The clinic must replace these values before launch. See CONTENT-TO-REPLACE.md.
 *
 * Phone numbers use the 555-01xx range, which is reserved for fictional use, so
 * a half-configured build can never dial a real person.
 */

export const PLACEHOLDER = true;

export const clinic = {
  name: 'Northlight Dental',
  nameShort: 'Northlight',
  // What the practice actually does — used in the hero subline.
  specialism: 'General and cosmetic dentistry',

  city: 'Portland, Oregon',
  neighbourhood: 'Pearl District',

  phone: {
    display: '(503) 555-0142',
    href: 'tel:+15035550142',
  },
  email: 'hello@northlightdental.example',

  address: {
    line1: '1420 NW Marshall Street',
    line2: 'Suite 200',
    city: 'Portland',
    region: 'OR',
    postalCode: '97209',
    country: 'US',
  },

  // Used for the map embed, the directions deep link, and LocalBusiness JSON-LD.
  geo: { lat: 45.5335, lng: -122.6848 },

  hours: [
    { day: 'Monday', open: '08:00', close: '17:00' },
    { day: 'Tuesday', open: '08:00', close: '17:00' },
    { day: 'Wednesday', open: '08:00', close: '19:00' },
    { day: 'Thursday', open: '08:00', close: '17:00' },
    { day: 'Friday', open: '08:00', close: '15:00' },
    { day: 'Saturday', open: '09:00', close: '13:00' },
    { day: 'Sunday', open: null, close: null },
  ],

  // Shown above the fold. Emergency availability must never be buried.
  emergency: 'Same-day emergency slots held daily until 3pm.',

  // Trust bar. These are claims — the clinic must confirm each one is true.
  figures: [
    { value: 18, suffix: '', label: 'Years in practice' },
    { value: 12400, suffix: '', label: 'Patients treated' },
    { value: 4.8, decimals: 1, label: 'Average rating', sub: '612 reviews · Google' },
    { value: 4, suffix: '', label: 'Dentists on staff' },
  ],

  reviewProfileUrl: 'https://www.google.com/maps/place/?q=place_id:PLACEHOLDER_PLACE_ID',

  social: [
    { label: 'Instagram', href: 'https://instagram.com/PLACEHOLDER' },
    { label: 'Facebook', href: 'https://facebook.com/PLACEHOLDER' },
  ],

  legal: {
    privacyUrl: '/privacy',
    accessibilityUrl: '/accessibility',
  },
};

export const fullAddress = [
  clinic.address.line1,
  clinic.address.line2,
  `${clinic.address.city}, ${clinic.address.region} ${clinic.address.postalCode}`,
]
  .filter(Boolean)
  .join(', ');

export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  fullAddress
)}`;

export const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
  clinic.geo.lng - 0.006
}%2C${clinic.geo.lat - 0.003}%2C${clinic.geo.lng + 0.006}%2C${
  clinic.geo.lat + 0.003
}&layer=mapnik&marker=${clinic.geo.lat}%2C${clinic.geo.lng}`;

/** "08:00" -> "8:00 am" */
export function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatHoursRow(row) {
  if (!row.open) return 'Closed';
  return `${formatTime(row.open)} – ${formatTime(row.close)}`;
}
