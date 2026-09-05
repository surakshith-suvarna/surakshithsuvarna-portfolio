export default function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 36 36" focusable="false">
        <circle className="brand-mark-field" cx="18" cy="18" r="17.25" />
        <path className="brand-mark-orbit" d="M7.4 24.8A13 13 0 0 0 28.7 10.1" />
        <circle className="brand-mark-node" cx="28.7" cy="10.1" r="1.65" />
        <path
          className="brand-mark-glyph"
          d="M23.5 10.6c-1.4-1.15-3.25-1.75-5.35-1.75-3.25 0-5.55 1.45-5.55 3.6 0 2.05 1.8 3.05 5.15 3.62l1.5.27c2.95.5 4.45 1.65 4.45 3.85 0 2.85-2.7 4.95-6.5 4.95-2.85 0-5.3-.95-7.25-2.75"
        />
      </svg>
    </span>
  );
}
