/**
 * Original vector study for an architectural world; not a WebGL implementation.
 * @packageDocumentation
 */
import { useId } from 'react';

/** Visual framing for the hub or a closer view of the Iris installation. */
interface GallerySceneProps {
  /** Crop around Iris rather than showing the whole connecting gallery. */
  detail?: boolean;
}

/**
 * Draw a motion-free material/composition study with no external artwork or data.
 * The containing figure supplies the description; every plotted mark is schematic.
 * @param props - Optional detail framing for the second chapter.
 * @returns Decorative, responsive SVG with instance-local gradient identifiers.
 */
export default function GalleryScene(props: GallerySceneProps) {
  const { detail = false } = props;
  const id = useId();
  const stone = `${id}-stone`;
  const glass = `${id}-glass`;
  const shadow = `${id}-shadow`;

  return (
    <svg
      viewBox={detail ? '400 150 420 430' : '0 0 1000 760'}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="gallery-scene"
    >
      <defs>
        <linearGradient
          id={stone}
          x1="230"
          y1="220"
          x2="730"
          y2="640"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#d7dcd8" />
        </linearGradient>
        <linearGradient
          id={glass}
          x1="574"
          y1="262"
          x2="753"
          y2="455"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#b7cfc6" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={shadow}>
          <stop stopColor="#394b40" stopOpacity="0.18" />
          <stop offset="1" stopColor="#394b40" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* A quiet floor plane and fine construction grid establish scale. */}
      <ellipse cx="503" cy="541" rx="444" ry="188" fill={`url(#${shadow})`} />
      <path
        d="M64 469 482 228 936 490 518 731Z"
        fill="#e8ece7"
        stroke="#d3dbd4"
      />
      <g stroke="#d5ddd6" strokeWidth="1">
        <path d="m133 429 454 262M203 389l454 262M273 349l454 262M343 309l454 262M413 269l454 262" />
        <path d="m134 509 418-241M204 549l418-241M274 589l418-241M344 629l418-241M414 669l418-241" />
      </g>

      {/* The wide gallery platform is ceramic above, cool stone at its edges. */}
      <path d="m145 436 337-194 358 207v38L503 681 145 474Z" fill="#c8d0c9" />
      <path d="m145 436 358 207 337-194v38L503 681 145 474Z" fill="#d7ddd7" />
      <path
        d="m145 436 337-194 358 207-337 194Z"
        fill={`url(#${stone})`}
        stroke="#fff"
        strokeWidth="2"
      />

      {/* Inlaid paths connect installations, not floating planets or a game map. */}
      <g stroke="#bdc9bf" strokeWidth="3">
        <path d="m286 441 193 111 205-119M479 552V373" />
        <path d="m479 552 88 51" />
      </g>
      <path
        d="m479 552 205-119"
        stroke="#b76b40"
        strokeWidth="3"
        strokeDasharray="5 8"
      />

      {/* Central hub: a matte column, nested rings and a small dark core. */}
      <ellipse
        cx="435"
        cy="419"
        rx="109"
        ry="62"
        fill="#c1cbc2"
        opacity="0.55"
      />
      <path d="M337 376v35c0 32 44 58 98 58s98-26 98-58v-35" fill="#cad3cb" />
      <ellipse
        cx="435"
        cy="376"
        rx="98"
        ry="57"
        fill="#f8faf7"
        stroke="#fff"
        strokeWidth="2"
      />
      <ellipse cx="435" cy="376" rx="67" ry="39" fill="#d9e1d9" />
      <path
        d="M382 287v85c0 17 24 31 53 31s53-14 53-31v-85"
        fill={`url(#${stone})`}
      />
      <ellipse
        cx="435"
        cy="287"
        rx="53"
        ry="31"
        fill="#fcfdfb"
        stroke="#fff"
        strokeWidth="2"
      />
      <ellipse cx="435" cy="287" rx="24" ry="14" fill="#253e35" />
      <path d="M411 247v39c0 8 11 14 24 14s24-6 24-14v-39" fill="#365648" />
      <ellipse cx="435" cy="247" rx="24" ry="14" fill="#567565" />
      <ellipse
        cx="435"
        cy="235"
        rx="80"
        ry="46"
        stroke="#9bafa0"
        strokeWidth="2"
      />
      <ellipse
        cx="435"
        cy="223"
        rx="80"
        ry="46"
        stroke="#fff"
        strokeWidth="4"
      />
      <path d="M355 223v12m160-12v12" stroke="#d0dacf" strokeWidth="2" />

      {/* Iris: transparent planes and an amber signal spine, without real UI. */}
      <path d="m571 419 99-57 112 65v21l-99 57-112-65Z" fill="#c5cec6" />
      <path
        d="m571 419 99-57 112 65-99 57Z"
        fill="#f6f8f4"
        stroke="#fff"
        strokeWidth="2"
      />
      <path
        d="M614 390V239l122 70v152Z"
        fill={`url(#${glass})`}
        stroke="#9eafa5"
        strokeWidth="1.5"
      />
      <path
        d="M588 405V254l122 70v152Z"
        fill={`url(#${glass})`}
        stroke="#fff"
        strokeWidth="2"
      />
      <path d="M605 286v79l89 51" stroke="#7b9b88" strokeWidth="1.5" />
      <path
        d="m614 355 17-18 15 23 18-17 18 38"
        stroke="#335f4a"
        strokeWidth="3"
      />
      <g fill="#446d55">
        <circle cx="614" cy="355" r="4" />
        <circle cx="646" cy="360" r="4" />
        <circle cx="682" cy="381" r="4" />
      </g>
      <path d="m747 405 11-6 11 6v43l-11 6-11-6Z" fill="#ad6335" />
      <path d="m747 405 11-6 11 6-11 7Z" fill="#edb57a" />
      <path d="M758 412v42" stroke="#d89c61" strokeWidth="2" />

      {/* Secondary unfinished forms suggest future rooms, not project evidence. */}
      <path d="m236 449 50-29 49 29v32l-50 29-49-29Z" fill="#c1cbc2" />
      <path d="m236 449 50-29 49 29-50 29Z" fill="#fafbf8" />
      <path
        d="m258 403 28-16 27 16v46l-28 16-27-16Z"
        fill="#dce4da"
        stroke="#fafff5"
      />
      <path d="m509 571 57-33 58 33v18l-57 33-58-33Z" fill="#c2cdc2" />
      <path d="m509 571 57-33 58 33-57 33Z" fill="#f7f9f4" />
      <ellipse
        cx="566"
        cy="565"
        rx="25"
        ry="14"
        stroke="#8aa18d"
        strokeWidth="3"
      />

      {/* Sparse guide ticks keep the world closer to an exhibition model. */}
      <g stroke="#829787" strokeWidth="1.5">
        <path d="M190 570v23m-11-6 22 12M823 353v23m-11-6 22 12" />
      </g>
    </svg>
  );
}
