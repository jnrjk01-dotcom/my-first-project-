/**
 * ⚠ PLACEHOLDER CONTENT — every price, duration and named piece of equipment must be
 * confirmed by the clinic before launch. See CONTENT-TO-REPLACE.md.
 *
 * Copy rule: each service carries one concrete detail a visitor could not have
 * guessed. No promised outcomes, no superlatives, no fear.
 */

export const services = [
  {
    id: 'general',
    name: 'General dentistry',
    blurb: 'Check-ups, fillings, and the cleaning that actually takes the time it needs.',
    duration: '45 min',
    price: 'From $120',
    span: 'wide',
    detail: [
      'A check-up is an exam, a set of bitewing X-rays if you are due, and a scale and polish.',
      'A hygiene appointment is booked for a full 45 minutes. If your teeth need 45 minutes of work, you get 45 minutes, not a rushed 20.',
      'Composite fillings are shade-matched to the tooth next to it and cured in layers.',
    ],
  },
  {
    id: 'cosmetic',
    name: 'Cosmetic dentistry',
    blurb: 'Veneers, bonding, and reshaping. We show you the plan on screen before we start.',
    duration: '60 min consult',
    price: 'Price after consultation',
    detail: [
      'The first appointment is a scan and a conversation. Nothing is prepared on the day.',
      'Veneers are designed from your digital scan, and you see the proposed shape on screen before any tooth is touched.',
      'We will tell you when we think a case is better treated with orthodontics than with veneers.',
    ],
  },
  {
    id: 'implants',
    name: 'Implants',
    blurb: 'A titanium post replaces the root. Planned from a 3D scan, placed under local anaesthetic.',
    duration: '90 min placement',
    price: 'From $3,400',
    detail: [
      'Planning uses a cone beam CT scan, so the position is known before the day of surgery.',
      'Placement takes about 90 minutes under local anaesthetic. Most people drive themselves home.',
      'The post needs three to four months to integrate with bone before the crown goes on. There is a temporary in the meantime.',
    ],
  },
  {
    id: 'aligners',
    name: 'Clear aligners',
    blurb: 'Removable trays that move teeth in small steps. Scanned, not moulded.',
    duration: '40 min consult',
    price: 'From $2,900',
    span: 'wide',
    detail: [
      'We scan with an iTero Element intraoral scanner. There are no impression trays and nothing sets in your mouth.',
      'You see the projected movement as an animation at the consultation, before you commit.',
      'Trays are worn 20 to 22 hours a day. Most cases run 6 to 14 months, with a check every 8 weeks.',
    ],
  },
  {
    id: 'whitening',
    name: 'Teeth whitening',
    blurb: 'Custom trays and a peroxide gel you use at home over two weeks.',
    duration: '30 min fitting',
    price: 'From $340',
    detail: [
      'We take a scan and make trays that fit only your teeth, so the gel stays off your gums.',
      'You wear them for a few hours a day, or overnight, for about two weeks.',
      'Whitening does not change the colour of crowns, veneers or fillings. If you have them at the front, we discuss that first.',
    ],
  },
  {
    id: 'root-canal',
    name: 'Root canal',
    blurb: 'Removes the infected nerve and seals the tooth. Usually one appointment.',
    duration: '90 min',
    price: 'From $890',
    detail: [
      'It is done under local anaesthetic. The appointment is longer than a filling because the canals are cleaned under magnification.',
      'Most front teeth and premolars are finished in one visit. Molars sometimes need two.',
      'The tooth is sore for a few days afterwards and usually needs a crown to stop it splitting.',
    ],
  },
  {
    id: 'paediatric',
    name: "Children's dentistry",
    blurb: 'First visits from age one. The first appointment is a look and a ride in the chair.',
    duration: '30 min',
    price: 'From $80',
    detail: [
      'A first appointment for a small child is counting teeth and going up and down in the chair. No instruments unless they are comfortable.',
      'Fluoride varnish takes about a minute and is painted on with a small brush.',
      'We book children early in the day, when they have the most patience.',
    ],
  },
  {
    id: 'emergency',
    name: 'Emergency care',
    blurb: 'Pain, a broken tooth, or a lost crown. Same-day slots are held until 3pm.',
    duration: '30 min',
    price: 'From $150',
    urgent: true,
    detail: [
      'We hold slots every day for same-day problems. Call before 3pm and you will be seen that day.',
      'The first appointment gets you out of pain. The permanent fix is booked separately.',
      'Out of hours, the answerphone gives the number for the regional emergency dental service.',
    ],
  },
];
