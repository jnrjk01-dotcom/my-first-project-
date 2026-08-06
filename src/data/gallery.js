/**
 * ⚠ PLACEHOLDER BY CONSTRUCTION — READ THIS BEFORE TOUCHING.
 *
 * These are NOT real cases. Every field here is dummy structure awaiting the clinic's
 * own consented before/after photography and the real treatment records that go with it.
 *
 * Deliberate decision: the before/after panes ship with NO generated imagery.
 * A synthesised "after" photograph is a simulated clinical outcome, and putting one in
 * a smile gallery presents it as a result this practice produced for a real person.
 * That is the one thing this section must never do, so the slider renders a marked
 * awaiting-content pane instead. The interaction, layout and dimensions are final;
 * only the two image sources are missing.
 *
 * To go live: replace `before` / `after` with paths to real, consented photographs,
 * set `status: 'ready'`, and confirm the visits/duration figures against the record.
 */

export const galleryFilters = [
  { id: 'all', label: 'All cases' },
  { id: 'whitening', label: 'Whitening' },
  { id: 'veneers', label: 'Veneers' },
  { id: 'implants', label: 'Implants' },
  { id: 'aligners', label: 'Aligners' },
];

export const galleryCases = [
  {
    id: 'case-1',
    type: 'whitening',
    treatment: 'Custom-tray whitening',
    visits: 2,
    duration: '3 weeks',
    status: 'awaiting-content',
    before: null,
    after: null,
  },
  {
    id: 'case-2',
    type: 'veneers',
    treatment: 'Four upper veneers',
    visits: 3,
    duration: '5 weeks',
    status: 'awaiting-content',
    before: null,
    after: null,
  },
  {
    id: 'case-3',
    type: 'implants',
    treatment: 'Single implant, upper left',
    visits: 4,
    duration: '5 months',
    status: 'awaiting-content',
    before: null,
    after: null,
  },
  {
    id: 'case-4',
    type: 'aligners',
    treatment: 'Clear aligners, both arches',
    visits: 7,
    duration: '11 months',
    status: 'awaiting-content',
    before: null,
    after: null,
  },
  {
    id: 'case-5',
    type: 'veneers',
    treatment: 'Composite bonding, upper front',
    visits: 2,
    duration: '2 weeks',
    status: 'awaiting-content',
    before: null,
    after: null,
  },
  {
    id: 'case-6',
    type: 'implants',
    treatment: 'Two implants, lower right',
    visits: 5,
    duration: '6 months',
    status: 'awaiting-content',
    before: null,
    after: null,
  },
];

export const RESULTS_VARY =
  'Every case is different. Treatment time, the number of visits and the result depend ' +
  'on your own teeth, gums and bone. These figures describe individual cases and are ' +
  'not a prediction of your outcome.';
