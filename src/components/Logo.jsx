/**
 * Mark: a north-pointing arc over a horizon line. Geometric, no tooth clip-art.
 * Pure SVG so it stays crisp and costs no request.
 */
export default function Logo({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M3 15.5C3 9.7 7.03 5 12 5s9 4.7 9 10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 5V1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 19.5h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
