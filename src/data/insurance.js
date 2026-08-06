/**
 * ⚠ PLACEHOLDER CONTENT — the carrier list, the network status of each carrier, and
 * every financing term below must be confirmed by the clinic and by its finance
 * provider before launch. Stating the wrong network status costs patients money.
 * See CONTENT-TO-REPLACE.md.
 *
 * status: 'in-network' | 'out-of-network' | 'call'
 */

export const carriers = [
  { name: 'Delta Dental', status: 'in-network' },
  { name: 'Cigna', status: 'in-network' },
  { name: 'Aetna', status: 'in-network' },
  { name: 'MetLife', status: 'in-network' },
  { name: 'Guardian', status: 'in-network' },
  { name: 'United Healthcare', status: 'in-network' },
  { name: 'Principal', status: 'out-of-network' },
  { name: 'Humana', status: 'out-of-network' },
  { name: 'Ameritas', status: 'out-of-network' },
  { name: 'Regence BlueCross BlueShield', status: 'in-network' },
  { name: 'Moda Health', status: 'in-network' },
  { name: 'Kaiser Permanente', status: 'call' },
];

export const statusCopy = {
  'in-network': {
    label: 'In-network',
    line: 'We are in-network with this carrier. We submit the claim for you.',
    tone: 'yes',
  },
  'out-of-network': {
    label: 'Out-of-network',
    line: 'We can still bill this carrier out-of-network. You may pay more of the balance. We submit the claim for you.',
    tone: 'partial',
  },
  call: {
    label: 'Call to check',
    line: 'This one depends on your specific plan. Call us and we will look it up in about a minute.',
    tone: 'call',
  },
  unknown: {
    label: 'Not on our list',
    line: 'We do not have this carrier listed, which does not mean we cannot bill it. Call us and we will check.',
    tone: 'call',
  },
};

export const paymentMethods = [
  'Cash',
  'Debit card',
  'Visa, Mastercard, Amex',
  'Apple Pay and Google Pay',
  'HSA and FSA cards',
];

export const financing = [
  {
    title: 'In-house instalments',
    terms: 'Balances over $500, split across 3 monthly payments. 0% interest. No credit check.',
    detail: 'Set up at the front desk on the day. The first payment is taken at the appointment.',
  },
  {
    title: 'Extended finance',
    terms: '6 to 24 months through a third-party provider. Interest applies and rates depend on the term and your credit.',
    detail:
      'This one runs a credit check. We will print both the in-house and the extended figure so you can compare the total, not just the monthly.',
  },
];

export const uninsured = {
  title: 'If you have no insurance',
  body: [
    'You pay the same fees our insured patients are charged. There is no separate uninsured price list.',
    'You get a written estimate before treatment starts, and it holds for 90 days.',
    'Instalments are available on anything over $500, and the 3-month plan costs nothing extra.',
  ],
};
