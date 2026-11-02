/**
 * Original public-safe Iris illustration, not a replica or working product UI.
 * @packageDocumentation
 */

/** Draw the Iris concept without accounts, providers or live data.
 * @returns Self-contained vector artwork for the portfolio preview.
 */
export default function IrisScreenArtwork() {
  return (
    <svg viewBox="0 0 1040 640" aria-hidden="true">
      <rect width="1040" height="640" rx="12" fill="#14272d" />
      <path d="M0 50h1040" stroke="#40545d" />
      <g fontFamily="system-ui, sans-serif">
        <circle cx="30" cy="25" r="7" fill="#7edac9" />
        <text
          x="49"
          y="31"
          fill="#7edac9"
          fontSize="15"
          fontWeight="700"
          letterSpacing="2"
        >
          IRIS
        </text>
        <text
          x="1008"
          y="30"
          textAnchor="end"
          fill="#c0cbd2"
          fontSize="11"
          letterSpacing="1"
        >
          ILLUSTRATIVE CONCEPT · NOT LIVE
        </text>
        <text x="36" y="101" fill="#ecf5f3" fontSize="29" fontWeight="600">
          A clearer view of the chain.
        </text>
        <text x="36" y="128" fill="#b1c9cc" fontSize="14">
          Markets, public wallets and activity. No wallet connection required.
        </text>
        <g data-concept="public-wallet-explorer">
          <rect
            x="36"
            y="153"
            width="968"
            height="51"
            rx="10"
            fill="#203c43"
            stroke="#527d83"
          />
          <circle
            cx="61"
            cy="177"
            r="8"
            fill="none"
            stroke="#7edac9"
            strokeWidth="2"
          />
          <path d="m67 183 6 6" stroke="#7edac9" strokeWidth="2" />
          <text x="88" y="183" fill="#c5dadb" fontSize="15">
            Explore a public wallet or an asset
          </text>
          <rect
            x="854"
            y="164"
            width="132"
            height="29"
            rx="14"
            fill="#32545a"
          />
          <text
            x="920"
            y="183"
            textAnchor="middle"
            fill="#9ae8d4"
            fontSize="12"
          >
            SOLANA / REBUILD
          </text>
        </g>
        <g data-concept="market-overview">
          <rect
            x="36"
            y="225"
            width="576"
            height="260"
            rx="12"
            fill="#1c343d"
            stroke="#3c5a64"
          />
          <text x="58" y="257" fill="#e2efed" fontSize="17" fontWeight="600">
            Market perspective
          </text>
          <text x="590" y="256" textAnchor="end" fill="#a9c7ca" fontSize="11">
            ABSTRACT SHAPES
          </text>
          {[300, 344, 388, 432].map((y) => (
            <path key={y} d={`M58 ${y}h532`} stroke="#35505b" />
          ))}
          <path
            d="M58 428 101 402 146 415 188 361 234 375 276 337 322 355 368 311 412 330 455 290 499 312 543 281 590 294V456H58Z"
            fill="#234d51"
          />
          <path
            d="m58 428 43-26 45 13 42-54 46 14 42-38 46 18 46-44 44 19 43-40 44 22 44-31 47 13"
            fill="none"
            stroke="#7edac9"
            strokeWidth="3"
          />
          <circle cx="590" cy="294" r="5" fill="#b9f5df" />
        </g>
        <g data-concept="wallet-holdings">
          <rect
            x="632"
            y="225"
            width="372"
            height="260"
            rx="12"
            fill="#20383e"
            stroke="#45666a"
          />
          <text x="655" y="257" fill="#e2efed" fontSize="17" fontWeight="600">
            Public-wallet view
          </text>
          <text x="655" y="282" fill="#a9c7ca" fontSize="12">
            Holdings and transaction context
          </text>
          <circle
            cx="704"
            cy="352"
            r="40"
            fill="none"
            stroke="#385760"
            strokeWidth="15"
          />
          <path
            d="M704 312a40 40 0 0 1 34 61"
            fill="none"
            stroke="#7edac9"
            strokeWidth="15"
          />
          <path
            d="M738 373a40 40 0 0 1-59 10"
            fill="none"
            stroke="#b1a4df"
            strokeWidth="15"
          />
          {['Asset A', 'Asset B', 'Other assets'].map((label, i) => (
            <g key={label}>
              <circle
                cx="775"
                cy={324 + i * 31}
                r="4"
                fill={['#7edac9', '#b1a4df', '#70999c'][i]}
              />
              <text x="790" y={329 + i * 31} fill="#cadedd" fontSize="13">
                {label}
              </text>
              <path
                d={`M895 ${325 + i * 31}h${76 - i * 18}`}
                stroke="#5d8588"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>
          ))}
          <text x="655" y="454" fill="#a9c7ca" fontSize="11">
            Sample composition · no real addresses or balances
          </text>
        </g>
        <rect x="36" y="505" width="968" height="90" rx="12" fill="#1b3338" />
        <text x="58" y="536" fill="#9ae8d4" fontSize="12" letterSpacing="1">
          FROM STACKS TO SOLANA
        </text>
        <text x="58" y="565" fill="#d4e5e3" fontSize="15">
          Public data → aggregation API → a readable interface
        </text>
        <text x="983" y="565" textAnchor="end" fill="#b1c9cc" fontSize="12">
          Illustrative activity only
        </text>
        <text
          x="1004"
          y="623"
          textAnchor="end"
          fill="#aebfc6"
          fontSize="10"
          letterSpacing="1"
        >
          ORIGINAL PORTFOLIO ILLUSTRATION
        </text>
      </g>
    </svg>
  );
}
