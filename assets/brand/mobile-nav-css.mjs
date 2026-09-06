/**
 * Styles for the rebuilt phone menu. Companion to mobile-nav.mjs, which does the markup.
 *
 *   node assets/brand/mobile-nav-css.mjs
 *
 * Kept as a script rather than a hand edit for the same reason as the rest of assets/brand:
 * there are two copies of the stylesheet, one per colour variant, and anything applied to
 * only one of them drifts silently. Appends once, guarded by the marker below.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MARK = '/* --- nav: phone menu ergonomics --- */';

const CSS = `

${MARK}
/* The Services row used to be a single disclosure control containing both the label and
   the chevron. It is now a link plus a chevron, which have to sit on one line. */
.navbar_dropdown { display: flex; align-items: center; }
.navbar-services_link { display: flex; align-items: center; }

@media screen and (min-width: 992px) {
  /* The mega-panel was placed at -220% of the toggle's own width. The toggle is now just
     a chevron, so that percentage resolves to a fraction of what it used to and the panel
     ran 104px off the right edge of a 1440px screen.
     The panel is 834px wide and the Services row is about 110px, so no offset measured
     from that row can hold it on screen at every width. Hang it from the header instead,
     whose right edge is the one edge that is always there.
     The row is the panel's containing block only because it is positioned, so it has to
     stop being positioned for the header to take over. Nothing else in the row depends
     on that. */
  .navbar_container { position: relative; }
  .navbar_dropdown { position: static; }
  /* The chevron kept the toggle's own left padding, which now reads as a gap between the
     word and its own arrow rather than as spacing between two nav items. */
  .navbar-dropdown_toggle { padding-left: 0; }
  .navbar-services_link { padding-right: 6px; }
  .navbar-dropdown_list {
    inset: 100% 0 auto auto;
    transform: none;
    /* An absolutely positioned box sizes its 1fr columns against the containing block,
       which is now the whole header — so without this the four columns spread across the
       full width of the screen. max-content sizes them to the treatment names instead. */
    width: max-content;
    max-width: calc(100vw - 48px);
    /* The nav runtime's own rule gives every dropdown panel min-width:100%, which used to
       mean "at least as wide as the little Services row" and now means "at least as wide
       as the header". */
    min-width: 0;
  }
  /* Contact and the booking button are for the collapsed menu; the desktop header already
     carries a call pill and a Get Appointment button. */
  .navbar-menu_contact, .navbar-menu_cta { display: none; }
}

@media screen and (max-width: 991px) {
  /* The open menu is a panel, and long panels have to scroll themselves. Expanded, this
     one was 850px of content in a 664px screen, so its last rows were simply unreachable.
     dvh rather than vh because mobile Safari's toolbars make vh taller than what you can
     actually see. */
  .navbar_menu {
    max-height: calc(100dvh - 60px);
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    align-items: stretch;
    padding-bottom: 20px;
  }

  /* Label left, chevron right, categories on their own line underneath. The collapsed
     nav stacks this container's children in a column, which put the chevron on a row of
     its own below the word and opened a 56px hole above the categories. */
  .navbar_dropdown {
    flex-flow: row wrap;
    align-items: center;
    width: 100%;
  }
  .navbar-services_link { flex: 1 1 auto; }
  .navbar-dropdown_toggle { flex: 0 0 auto; margin-left: auto; }
  .navbar-dropdown_list { flex: 1 0 100%; }

  /* 48px rows. The template's were 36px, under the 44px minimum for a thumb, and two of
     them sat close enough together to be a coin-toss which one you hit. */
  .navbar_link,
  .navbar-services_link,
  .navbar-dropdown_toggle {
    min-height: 48px;
    display: flex;
    align-items: center;
    padding-top: 0;
    padding-bottom: 0;
  }
  .navbar-dropdown_toggle { padding-right: 20px; padding-left: 20px; }

  /* Four categories, not seventeen rows. The thirteen individual treatments stay in the
     markup — desktop still shows them, and they are one tap further on a phone via the
     category they belong to — but listing them here pushed Home and About Us off the top
     of the screen. */
  .navbar-dropdown_wrapper.is-services .navbar-dropdown_link { display: none; }
  .navbar-dropdown_wrapper.is-services { padding: 0; gap: 0; }
  .svc-group_title {
    display: flex;
    align-items: center;
    min-height: 48px;
    margin: 0;
    padding: 0 var(--_size-variables---element-spacing--xl);
    font-size: 15px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    opacity: 1;
    white-space: normal;
    /* neutral-100 is the near-white the header uses over the dark hero; in the collapsed
       menu, which is a light panel, it left these four rows almost invisible. */
    color: var(--primitive-color--black);
    text-decoration: none;
  }
  /* A left rule marks them as one level in, which is what the indent used to say on
     desktop with columns. */
  .navbar-dropdown_wrapper.is-services .navbar-dropdown_column {
    border-left: 2px solid rgba(0, 0, 0, .08);
    margin-left: var(--_size-variables---element-spacing--xl);
    width: auto;
    align-self: stretch;
  }

  /* The two things the menu did not offer and a patient most often wants: where the
     practice is, and a way to book without hunting for a number. */
  .navbar-menu_contact { min-height: 48px; }
  .navbar-menu_cta {
    padding: 16px var(--_size-variables---element-spacing--xl) 0;
    margin-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, .08);
  }
  .navbar-menu_book {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 52px;
    border-radius: 999px;
    /* 5.4:1 against the white label. WhatsApp's own green is 2:1 and unreadable. */
    background: #0f7a3c;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: background-color .2s;
  }
  .navbar-menu_book:hover, .navbar-menu_book:focus { background: #0c6532; color: #fff; }
  .navbar-menu_book:focus-visible { outline: 3px solid #3389CC; outline-offset: 2px; }
}
`;

for (const rel of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, rel);
  const css = readFileSync(p, 'utf8');
  /* Replace the block rather than refusing when it is already there, so this stays the
     one place the phone menu's styling is edited. The block is always last, so cutting
     from the marker cannot take anything else with it. */
  const at = css.indexOf(MARK);
  const base = at < 0 ? css : css.slice(0, at).replace(/\s+$/, '');
  writeFileSync(p, base + CSS);
  console.log(`  ${rel}: ${at < 0 ? 'appended' : 'updated'}`);
}
