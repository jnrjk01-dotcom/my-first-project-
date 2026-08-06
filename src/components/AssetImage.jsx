import { asset } from '../data/assets';

/**
 * The only way an image reaches the page.
 *
 * When the asset has been generated and committed (`status: 'ready'`) this is a plain,
 * fast <img> with explicit dimensions, lazy loading, async decoding and real alt text.
 *
 * When it has not, it renders a marked, correctly proportioned unshot frame instead of
 * a stock photo. That is a deliberate choice: a stand-in that looks like a photograph
 * gets shipped by accident, and on a healthcare site an accidental photograph is a
 * claim about a real building and real people. This one cannot be mistaken for content.
 *
 * Either way the box is identical, so dropping the real files in causes no layout shift.
 */
export default function AssetImage({
  assetKey,
  className = '',
  imgClassName = '',
  sizes,
  alt: altOverride,
  priority: priorityOverride,
}) {
  const a = asset(assetKey);
  const alt = altOverride ?? a.alt;
  const priority = priorityOverride ?? a.priority;
  const ready = a.status === 'ready';

  const shared = `relative overflow-hidden ${className}`;
  const style = { aspectRatio: a.aspect };

  if (ready) {
    return (
      <div className={shared} style={style}>
        <img
          src={a.src}
          alt={a.decorative ? '' : alt}
          aria-hidden={a.decorative || undefined}
          width={a.width}
          height={a.height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          data-replace={a.replaceWithReal ? 'real-patient-content' : undefined}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${shared} bg-bone2 border border-ink/[0.08]`}
      style={style}
      data-asset-pending={assetKey}
      data-replace={a.replaceWithReal ? 'real-patient-content' : undefined}
      role={a.decorative ? 'presentation' : 'img'}
      aria-label={a.decorative ? undefined : `Image not yet available: ${alt}`}
    >
      {/* Quiet registration marks, so an unshot frame still reads as designed. */}
      <svg
        className="absolute inset-0 h-full w-full text-ink/[0.13]"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" />
      </svg>

      <div className="absolute inset-0 flex flex-col justify-end gap-1 p-4 md:p-5">
        <span className="font-display text-[10px] uppercase tracking-[0.22em] text-accent">
          Awaiting asset
        </span>
        <span className="font-mono text-[11px] text-muted break-all">{assetKey}</span>
      </div>
    </div>
  );
}
