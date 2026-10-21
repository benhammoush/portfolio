/**
 * Original public-safe monitor illustrations, not replicas or working product UIs.
 * @packageDocumentation
 */

/** Approved stories that still need their own decorative monitor artwork. */
interface ProjectScreenArtworkProps {
  /** Project identity; artwork never requests accounts, providers or live data. */
  project: 'iris' | 'gateway' | 'dripperz';
}

/**
 * Draw distinct product concepts from the approved portfolio descriptions only.
 * @param props - The public project story to illustrate.
 * @returns Self-contained vector artwork suitable for a local canvas texture.
 */
export default function ProjectScreenArtwork(props: ProjectScreenArtworkProps) {
  const dripperz = props.project === 'dripperz';
  const accent = dripperz
    ? '#c1f26b'
    : props.project === 'iris'
      ? '#7edac9'
      : '#8cc8f4';
  const title =
    props.project === 'iris'
      ? 'IRIS'
      : dripperz
        ? 'DRIPPERZ'
        : 'CRYPTO GATEWAY';
  return (
    <svg viewBox="0 0 1040 640" aria-hidden="true">
      <rect
        width="1040"
        height="640"
        rx="12"
        fill={dripperz ? '#191525' : '#14272d'}
      />
      <path d="M0 50h1040" stroke="#40545d" />
      <g fontFamily="system-ui, sans-serif">
        <circle cx="30" cy="25" r="7" fill={accent} />
        <text
          x="49"
          y="31"
          fill={accent}
          fontSize="15"
          fontWeight="700"
          letterSpacing="2"
        >
          {title}
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
        {props.project === 'iris' ? (
          <>
            <text x="36" y="101" fill="#ecf5f3" fontSize="29" fontWeight="600">
              A clearer view of the chain.
            </text>
            <text x="36" y="128" fill="#b1c9cc" fontSize="14">
              Markets, public wallets and activity. No wallet connection
              required.
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
              <text
                x="58"
                y="257"
                fill="#e2efed"
                fontSize="17"
                fontWeight="600"
              >
                Market perspective
              </text>
              <text
                x="590"
                y="256"
                textAnchor="end"
                fill="#a9c7ca"
                fontSize="11"
              >
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
              <text
                x="655"
                y="257"
                fill="#e2efed"
                fontSize="17"
                fontWeight="600"
              >
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
            <rect
              x="36"
              y="505"
              width="968"
              height="90"
              rx="12"
              fill="#1b3338"
            />
            <text x="58" y="536" fill="#9ae8d4" fontSize="12" letterSpacing="1">
              FROM STACKS TO SOLANA
            </text>
            <text x="58" y="565" fill="#d4e5e3" fontSize="15">
              Public data → aggregation API → a readable interface
            </text>
            <text x="983" y="565" textAnchor="end" fill="#b1c9cc" fontSize="12">
              Illustrative activity only
            </text>
          </>
        ) : props.project === 'gateway' ? (
          <>
            <text x="36" y="101" fill="#eff5f7" fontSize="29" fontWeight="600">
              A checkout with clear boundaries.
            </text>
            <text x="36" y="128" fill="#b9cbd7" fontSize="14">
              Portable API integration. Wallet-side signing. Independent
              verification.
            </text>
            <g data-concept="checkout-preview">
              <rect
                x="645"
                y="155"
                width="359"
                height="440"
                rx="14"
                fill="#edf3f3"
              />
              <text
                x="670"
                y="191"
                fill="#28434a"
                fontSize="11"
                fontWeight="700"
                letterSpacing="1.5"
              >
                EXAMPLE CHECKOUT
              </text>
              <text
                x="670"
                y="233"
                fill="#172f38"
                fontSize="24"
                fontWeight="600"
              >
                Review payment
              </text>
              <text x="670" y="260" fill="#4c666e" fontSize="13">
                An illustrative order, not a real invoice.
              </text>
              <path d="M670 282h309" stroke="#bccdd0" />
              <text x="670" y="318" fill="#48626d" fontSize="13">
                Order
              </text>
              <text
                x="979"
                y="318"
                textAnchor="end"
                fill="#203e48"
                fontSize="14"
              >
                DEMO-001
              </text>
              <text x="670" y="354" fill="#48626d" fontSize="13">
                Amount
              </text>
              <text
                x="979"
                y="354"
                textAnchor="end"
                fill="#203e48"
                fontSize="14"
              >
                Example only
              </text>
              <rect
                x="670"
                y="383"
                width="309"
                height="58"
                rx="10"
                fill="#dae7ec"
              />
              <circle cx="692" cy="411" r="6" fill="#567f97" />
              <text
                x="709"
                y="416"
                fill="#294b5b"
                fontSize="14"
                fontWeight="600"
              >
                Wallet not connected
              </text>
              <rect
                x="670"
                y="460"
                width="309"
                height="48"
                rx="9"
                fill="#244957"
              />
              <text
                x="824"
                y="489"
                textAnchor="middle"
                fill="#eff8fa"
                fontSize="14"
              >
                Checkout preview · no transaction
              </text>
              <text x="670" y="544" fill="#49646d" fontSize="12">
                No credentials, addresses or funds are used.
              </text>
              <text x="670" y="568" fill="#49646d" fontSize="12">
                An unresolved payment is never marked paid.
              </text>
            </g>
            <g data-concept="trust-boundaries">
              <text
                x="36"
                y="180"
                fill="#8cc8f4"
                fontSize="12"
                letterSpacing="1.3"
              >
                PAYMENT FLOW / CONCEPTUAL
              </text>
              {[
                [
                  '01',
                  'Merchant API',
                  'Create a request; keep credentials server-side.',
                ],
                ['02', 'Customer wallet', 'Signing stays with the customer.'],
                [
                  '03',
                  'Backend verification',
                  'Verify the transaction independently.',
                ],
              ].map(([number, label, detail], i) => (
                <g key={number}>
                  <rect
                    x="36"
                    y={202 + i * 120}
                    width="577"
                    height="94"
                    rx="12"
                    fill="#203942"
                    stroke="#45616e"
                  />
                  <rect
                    x="54"
                    y={222 + i * 120}
                    width="45"
                    height="45"
                    rx="12"
                    fill="#315769"
                  />
                  <text
                    x="76"
                    y={251 + i * 120}
                    textAnchor="middle"
                    fill="#b6dfff"
                    fontSize="16"
                  >
                    {number}
                  </text>
                  <text
                    x="118"
                    y={236 + i * 120}
                    fill="#e6f0f5"
                    fontSize="18"
                    fontWeight="600"
                  >
                    {label}
                  </text>
                  <text x="118" y={264 + i * 120} fill="#bdced7" fontSize="13">
                    {detail}
                  </text>
                  {i < 2 && (
                    <path
                      d={`M76 ${301 + i * 120}v15m-5-5 5 5 5-5`}
                      stroke="#83b6d4"
                      fill="none"
                      strokeWidth="2"
                    />
                  )}
                </g>
              ))}
              <text x="36" y="592" fill="#bed1d8" fontSize="12">
                Repeated requests · interrupted checkouts · uncertain outcomes
              </text>
            </g>
          </>
        ) : (
          <>
            <text
              x="36"
              y="101"
              fill="#f1ecff"
              fontSize="30"
              fontWeight="700"
              letterSpacing="1"
            >
              A world built around the mint.
            </text>
            <text x="36" y="128" fill="#c5b9db" fontSize="14">
              Ethereum contracts, an interactive frontend and a cyberpunk visual
              identity.
            </text>
            <g data-concept="original-collectible-art">
              <rect
                x="36"
                y="155"
                width="584"
                height="354"
                rx="12"
                fill="#251f39"
                stroke="#6e558e"
              />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <path
                  key={i}
                  d={`M${60 + i * 105} 177v307M58 ${192 + i * 55}h540`}
                  stroke="#3c3054"
                />
              ))}
              <path
                d="m171 335 157-119 157 119-157 119Z"
                fill="#372b50"
                stroke="#9b7ace"
                strokeWidth="2"
              />
              <path d="m171 335 157 119v33l-157-119Z" fill="#251c3b" />
              <path d="m328 454 157-119v33L328 487Z" fill="#53416a" />
              <path
                d="M265 278q0-49 63-49t63 49v86q0 20-17 20t-17-20v37q0 20-17 20t-17-20v-19q0-16-16-16t-16 16v-30q0 20-13 20t-13-20Z"
                fill="#b5f06b"
              />
              <rect
                x="287"
                y="280"
                width="27"
                height="18"
                rx="4"
                fill="#30243f"
              />
              <rect
                x="342"
                y="280"
                width="27"
                height="18"
                rx="4"
                fill="#30243f"
              />
              <path
                d="M310 321h36"
                stroke="#3b3c3e"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="m109 243 25-16m-25 168 25 16m389-168 25 16m-25 136 25-16"
                stroke="#d48fc9"
                strokeWidth="3"
              />
              <text
                x="58"
                y="485"
                fill="#c8b8df"
                fontSize="11"
                letterSpacing="1"
              >
                ORIGINAL PORTFOLIO ART · NOT A COLLECTION ASSET
              </text>
            </g>
            <g data-concept="mint-controls">
              <rect
                x="644"
                y="155"
                width="360"
                height="354"
                rx="12"
                fill="#2c2440"
                stroke="#75618d"
              />
              <text
                x="669"
                y="190"
                fill="#c1f26b"
                fontSize="12"
                letterSpacing="1.5"
              >
                MINT WORKSPACE / CONCEPT
              </text>
              <text
                x="669"
                y="234"
                fill="#f1ecff"
                fontSize="27"
                fontWeight="600"
              >
                Choose your phase.
              </text>
              <rect
                x="669"
                y="254"
                width="141"
                height="35"
                rx="7"
                fill="#534069"
              />
              <text
                x="739"
                y="277"
                textAnchor="middle"
                fill="#f1e8ff"
                fontSize="13"
              >
                Whitelist
              </text>
              <rect
                x="821"
                y="254"
                width="157"
                height="35"
                rx="7"
                fill="#3a304d"
              />
              <text
                x="899"
                y="277"
                textAnchor="middle"
                fill="#cfc0e2"
                fontSize="13"
              >
                Public sale
              </text>
              <text x="669" y="326" fill="#d8cde6" fontSize="14">
                Supply limits and reservations
              </text>
              <path d="M669 348h309" stroke="#554666" />
              <path d="M669 348h186" stroke="#a987d3" strokeWidth="5" />
              <text x="669" y="379" fill="#c5b9db" fontSize="12">
                Abstract supply indicator · not a real allocation
              </text>
              <rect
                x="669"
                y="401"
                width="309"
                height="47"
                rx="8"
                fill="#c1f26b"
              />
              <text
                x="823"
                y="430"
                textAnchor="middle"
                fill="#263422"
                fontSize="14"
                fontWeight="600"
              >
                Preview only · minting disabled
              </text>
              <text x="669" y="484" fill="#c5b9db" fontSize="12">
                No wallet connection or transaction is initiated.
              </text>
            </g>
            <rect
              x="36"
              y="529"
              width="968"
              height="66"
              rx="10"
              fill="#251e35"
            />
            {[
              'Solidity / sale controls',
              'React / wallet flows',
              'Metadata / deployment',
            ].map((label, i) => (
              <g key={label}>
                <circle cx={58 + i * 321} cy="562" r="4" fill="#b5f06b" />
                <text x={73 + i * 321} y="568" fill="#d5cae4" fontSize="14">
                  {label}
                </text>
              </g>
            ))}
          </>
        )}
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
