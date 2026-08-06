/**
 * ASSET MANIFEST
 *
 * Every visual asset on the site is declared here exactly once, together with the
 * Higgsfield generation recipe that produces it. Components never hardcode a path;
 * they call `asset('hero.master')` and get back a record.
 *
 * Why the recipe lives in the app repo: the generation run and the build are done by
 * different people at different times. Keeping prompt + model + params next to the
 * `src` path means the set can be regenerated, or a single shot re-rolled, without
 * anyone reverse-engineering the look from the finished site.
 *
 * `derivesFrom` is load-bearing. Anything with a parent MUST be generated
 * image-to-image from that parent's finished output so materials, light temperature
 * and colour grade match across the whole site. Generate parents first.
 *
 * Status: 'pending' = not yet generated. `AssetImage` renders a marked, correctly
 * proportioned unshot state for these instead of a stock placeholder, so layout is
 * final before the shoot lands and nothing ships pretending to be a photograph.
 */

const GRADE =
  'Studio-grade interior architectural photography. Pale oak, matte white walls, ' +
  'micro-cement floor, soft even mid-morning daylight through full-height windows, ' +
  'warm off-white and pale clinical grey palette, one deep teal accent element. ' +
  'Wide lens, natural light only, no harsh shadows, calm and clinical-modern, ' +
  'no people in frame unless stated, no signage text, no clip-art, no lens flare.';

const PORTRAIT_GRADE =
  'Clean studio portrait against the same warm off-white wall, natural daylight from ' +
  'one side, relaxed and direct to camera, neutral expression, scrubs or smart casual, ' +
  'arms relaxed at sides, no folded arms, no toothy grin, no props. ' +
  'Waist-up framing, subject centred, identical crop and camera distance across the set.';

/** @type {Record<string, AssetRecord>} */
export const ASSETS = {
  // ── 1. Master interior ────────────────────────────────────────────────────
  // Generate this first and approve it before anything else. It sets the grade.
  'interior.master': {
    src: '/assets/images/interior-master.webp',
    width: 2560,
    height: 1440,
    aspect: '16/9',
    status: 'pending',
    priority: true, // preloaded — this is the LCP element
    alt:
      'The reception and waiting area at Northlight Dental: pale oak seating, matte ' +
      'white walls and a micro-cement floor, lit by daylight from full-height windows.',
    recipe: {
      tool: 'generate_image',
      model: 'nano_banana_pro',
      aspect_ratio: '16:9',
      resolution: '4k',
      prompt:
        'Reception and waiting area of a modern dental practice at mid-morning. ' +
        'Pale oak bench seating and a pale oak reception desk, matte white walls, ' +
        'terrazzo-flecked micro-cement floor, full-height windows with soft daylight, ' +
        'a single deep teal upholstered element, low planting, no signage. ' +
        GRADE,
    },
  },

  // ── 2. Six interiors, image-to-image from the master ──────────────────────
  'interior.operatory': {
    src: '/assets/images/interior-operatory.webp',
    width: 2560, height: 1440, aspect: '16/9', status: 'pending',
    alt:
      'A treatment room with a modern dental chair beneath an overhead light, ' +
      'facing a window with daylight.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '16:9', resolution: '4k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'A dental treatment operatory in the same practice. A modern dental chair ' +
        'centred under a slim overhead light, instrument cart, monitor arm on the wall, ' +
        'window daylight from the left. Match the reference materials, light ' +
        'temperature and colour grade exactly. ' + GRADE,
    },
  },
  'interior.scanning': {
    src: '/assets/images/interior-scanning.webp',
    width: 2560, height: 1440, aspect: '16/9', status: 'pending',
    alt: 'The digital scanning and imaging room, with a wall-mounted scanner and a large display.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '16:9', resolution: '4k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'A digital scanning and imaging room in the same practice. Wall-mounted ' +
        'imaging arm, a large matte display showing a neutral grey interface, pale oak ' +
        'cabinetry. Match the reference materials, light temperature and grade exactly. ' +
        GRADE,
    },
  },
  'interior.consult': {
    src: '/assets/images/interior-consult.webp',
    width: 2560, height: 1440, aspect: '16/9', status: 'pending',
    alt: 'A private consultation room with a pale oak desk, two chairs and a wall-mounted screen.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '16:9', resolution: '4k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'A private consultation room in the same practice. Pale oak desk, two soft ' +
        'chairs, a wall-mounted screen showing a neutral grey interface, window ' +
        'daylight. Match the reference materials, light temperature and grade exactly. ' +
        GRADE,
    },
  },
  'interior.sterilisation': {
    src: '/assets/images/interior-sterilisation.webp',
    width: 2560, height: 1440, aspect: '16/9', status: 'pending',
    alt: 'The sterilisation bay, with stainless steel counters and sealed instrument trays.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '16:9', resolution: '4k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'A sterilisation bay in the same practice. Stainless steel counter, autoclave ' +
        'units set into pale oak cabinetry, sealed instrument pouches stacked neatly. ' +
        'Match the reference materials, light temperature and grade exactly. ' + GRADE,
    },
  },
  'interior.hygiene': {
    src: '/assets/images/interior-hygiene.webp',
    width: 2560, height: 1440, aspect: '16/9', status: 'pending',
    alt: 'The hygiene suite, with a reclined chair beside a window.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '16:9', resolution: '4k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'A dental hygiene suite in the same practice. A reclined hygiene chair beside a ' +
        'full-height window, compact instrument cart, pale oak and matte white surfaces. ' +
        'Match the reference materials, light temperature and grade exactly. ' + GRADE,
    },
  },
  'interior.entrance': {
    src: '/assets/images/interior-entrance.webp',
    width: 2560, height: 1440, aspect: '16/9', status: 'pending',
    alt:
      'The street entrance: a glazed door under a plain canopy, at pavement level ' +
      'with no step up from the street.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '16:9', resolution: '4k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'The street frontage and entrance of the same practice. A glazed door under a ' +
        'plain canopy, flush and step-free with the pavement, pale oak reveal, matte ' +
        'white render, quiet city street, mid-morning. No readable signage text. ' +
        'Match the reference materials, light temperature and grade exactly. ' + GRADE,
    },
  },

  // ── 3. Four team portraits ────────────────────────────────────────────────
  // Consistent framing so the grid tiles cleanly. Faces here are synthetic and
  // must be replaced with real, consented photographs of the actual team.
  'portrait.1': {
    src: '/assets/images/portrait-1.webp',
    width: 1200, height: 1500, aspect: '4/5', status: 'pending',
    replaceWithReal: true,
    alt: 'Portrait of a dentist standing against a plain off-white wall.',
    recipe: {
      tool: 'generate_image', model: 'soul_2', aspect_ratio: '4:5', resolution: '2k',
      prompt: 'A dentist in their forties, dark hair, navy scrubs. ' + PORTRAIT_GRADE,
    },
  },
  'portrait.2': {
    src: '/assets/images/portrait-2.webp',
    width: 1200, height: 1500, aspect: '4/5', status: 'pending',
    replaceWithReal: true,
    alt: 'Portrait of a dentist standing against a plain off-white wall.',
    derivesFrom: 'portrait.1',
    recipe: {
      tool: 'generate_image', model: 'soul_2', aspect_ratio: '4:5', resolution: '2k',
      medias: [{ role: 'image_references', from: 'portrait.1' }],
      prompt:
        'A dentist in their thirties, fair hair, smart casual shirt, no tie. ' +
        'Match the reference lighting, wall tone, framing and crop exactly. ' + PORTRAIT_GRADE,
    },
  },
  'portrait.3': {
    src: '/assets/images/portrait-3.webp',
    width: 1200, height: 1500, aspect: '4/5', status: 'pending',
    replaceWithReal: true,
    alt: 'Portrait of a dentist standing against a plain off-white wall.',
    derivesFrom: 'portrait.1',
    recipe: {
      tool: 'generate_image', model: 'soul_2', aspect_ratio: '4:5', resolution: '2k',
      medias: [{ role: 'image_references', from: 'portrait.1' }],
      prompt:
        'A dentist in their fifties, greying hair, deep teal scrubs. ' +
        'Match the reference lighting, wall tone, framing and crop exactly. ' + PORTRAIT_GRADE,
    },
  },
  'portrait.4': {
    src: '/assets/images/portrait-4.webp',
    width: 1200, height: 1500, aspect: '4/5', status: 'pending',
    replaceWithReal: true,
    alt: 'Portrait of a dentist standing against a plain off-white wall.',
    derivesFrom: 'portrait.1',
    recipe: {
      tool: 'generate_image', model: 'soul_2', aspect_ratio: '4:5', resolution: '2k',
      medias: [{ role: 'image_references', from: 'portrait.1' }],
      prompt:
        'A dentist in their late twenties, curly dark hair, light grey scrubs. ' +
        'Match the reference lighting, wall tone, framing and crop exactly. ' + PORTRAIT_GRADE,
    },
  },

  // ── 4. Three detail shots ─────────────────────────────────────────────────
  'detail.tray': {
    src: '/assets/images/detail-tray.webp',
    width: 1600, height: 1600, aspect: '1/1', status: 'pending',
    alt: 'A sterilised instrument tray laid out on a white surface.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '1:1', resolution: '2k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'Near-macro detail: a sterilised dental instrument tray laid out in a neat row ' +
        'on a matte white surface, shallow depth of field, soft daylight, quiet and ' +
        'texture-forward, abstract. Match the reference light temperature and grade. ' + GRADE,
    },
  },
  'detail.scanner': {
    src: '/assets/images/detail-scanner.webp',
    width: 1600, height: 1600, aspect: '1/1', status: 'pending',
    alt: 'A digital intraoral scanner wand held in a gloved hand.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '1:1', resolution: '2k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'Near-macro detail: a white digital intraoral scanner wand held in a blue ' +
        'gloved hand against an out-of-focus pale interior, shallow depth of field, ' +
        'soft daylight. Match the reference light temperature and grade. ' + GRADE,
    },
  },
  'detail.ceramic': {
    src: '/assets/images/detail-ceramic.webp',
    width: 1600, height: 1600, aspect: '1/1', status: 'pending',
    alt: 'Water and light on a clean ceramic surface.',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image', model: 'nano_banana_pro',
      aspect_ratio: '1:1', resolution: '2k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'Near-macro abstract detail: a thin film of water and refracted daylight on a ' +
        'clean white ceramic surface, quiet, minimal, texture-forward, no objects. ' +
        'Match the reference light temperature and grade. ' + GRADE,
    },
  },

  // ── 5. Two cutouts (background removed) ───────────────────────────────────
  // Float and parallax behind the Services grid. Must be true transparent PNGs.
  'cutout.chair': {
    src: '/assets/images/cutout-chair.png',
    width: 1400, height: 1400, aspect: '1/1', status: 'pending',
    decorative: true,
    alt: '',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image + remove_background',
      model: 'nano_banana_pro', aspect_ratio: '1:1', resolution: '2k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'A single modern dental chair unit, complete and isolated, centred on a plain ' +
        'flat light grey background, even studio light, three-quarter view, no room ' +
        'around it, no people. Match the reference chair design. ' + GRADE,
      then: "remove_background({ media_id: <job_id>, media_type: 'image' })",
    },
  },
  'cutout.scanner': {
    src: '/assets/images/cutout-scanner.png',
    width: 1400, height: 1400, aspect: '1/1', status: 'pending',
    decorative: true,
    alt: '',
    derivesFrom: 'interior.master',
    recipe: {
      tool: 'generate_image + remove_background',
      model: 'nano_banana_pro', aspect_ratio: '1:1', resolution: '2k',
      medias: [{ role: 'image_references', from: 'interior.master' }],
      prompt:
        'A single clear orthodontic aligner tray, isolated and centred on a plain flat ' +
        'light grey background, even studio light, no hands, no packaging. ' + GRADE,
      then: "remove_background({ media_id: <job_id>, media_type: 'image' })",
    },
  },
};

/**
 * ── 6. The Visit — video sequence ────────────────────────────────────────────
 * Four separate Seedance 2.0 clips, generated one per space, then concatenated
 * into a single file with hard cuts and no crossfades.
 *
 * `startsAt` is the timestamp of each cut in the CONCATENATED file and is what the
 * overlay data cards key off via the video's own `timeupdate`. If clip durations
 * change at generation time, these MUST be updated to the real measured values —
 * run `npm run assets:check`, which reads them back out of the encoded file.
 */
export const VISIT_VIDEO = {
  src: '/assets/video/the-visit.mp4',
  poster: '/assets/video/the-visit-poster.webp', // frame pulled from the master grade
  width: 3840,
  height: 2160,
  status: 'pending',
  totalDuration: 18,
  encode:
    "ffmpeg -f concat -safe 0 -i clips.txt -c:v libx264 -crf 20 -preset slow -an " +
    "-pix_fmt yuv420p public/assets/video/the-visit.mp4",
  clips: [
    {
      index: 1,
      key: 'arrival',
      startsAt: 0,
      duration: 4.5,
      derivesFrom: 'interior.entrance',
      prompt:
        'Smooth, steady camera push forward through the entrance doors of a modern ' +
        'dental practice into the reception area, daylight opening up as the space ' +
        'widens. Calm and confident move, locked-off dolly, no handheld shake, no whip ' +
        'pan, no zoom snap. No identifiable faces; any people are mid-distance and ' +
        'out of focus.',
    },
    {
      index: 2,
      key: 'consultation',
      startsAt: 4.5,
      duration: 4.5,
      derivesFrom: 'interior.consult',
      prompt:
        'Slow lateral dolly across a consultation desk toward a screen showing a ' +
        'neutral 3D dental scan, a dentist and patient soft and out of focus behind. ' +
        'Calm steady slide, no handheld shake, no whip pan. No identifiable faces.',
    },
    {
      index: 3,
      key: 'treatment',
      startsAt: 9,
      duration: 4.5,
      derivesFrom: 'interior.operatory',
      prompt:
        'Controlled, steady push into a dental operatory. The chair and overhead light ' +
        'centred in frame, instruments crisp in the foreground. Calm confident dolly, ' +
        'no handheld shake, no whip pan. No identifiable faces.',
    },
    {
      index: 4,
      key: 'result',
      startsAt: 13.5,
      duration: 4.5,
      derivesFrom: 'interior.operatory',
      prompt:
        'Slow steady pull back from mid-distance over a reclined patient in a dental ' +
        'chair, revealing the full treatment room and daylight through the window ' +
        'beyond. Calm reveal, no handheld shake. The face stays mid-distance, soft and ' +
        'non-identifiable throughout.',
    },
  ],
  recipe: {
    tool: 'generate_video_batch',
    model: 'seedance_2_0',
    params: {
      resolution: '4k',
      mode: 'std',
      duration: 5,
      aspect_ratio: '16:9',
      generate_audio: false, // the section plays muted
      bitrate_mode: 'high',
    },
    note:
      'Pass the derivesFrom still as medias[{ role: "start_image" }] on each clip so ' +
      'identity and grade carry from the photographed set into the footage.',
  },
};

/** Overlay data cards. One per cut; switched from the video timeline, never scroll. */
export const VISIT_CARDS = [
  { n: '01', label: 'Arrival', figure: '0 WAIT', line: 'Appointments start on the hour. We run on time.' },
  { n: '02', label: 'Consultation', figure: '3D SCAN', line: 'Your teeth are scanned digitally. No impression trays.' },
  { n: '03', label: 'Treatment', figure: '45 MIN', line: 'Most restorations are milled and fitted in one visit.' },
  { n: '04', label: 'Result', figure: '1 VISIT', line: 'You leave with the finished tooth, not a temporary.' },
];

export function asset(key) {
  const record = ASSETS[key];
  if (!record) throw new Error(`Unknown asset key: ${key}`);
  return record;
}

/** True once the generated files have actually been committed to /public. */
export const assetsReady = Object.values(ASSETS).every((a) => a.status === 'ready');
