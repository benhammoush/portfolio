/**
 * Original, schematic screen artwork shared by the desk and its review close-up.
 * @packageDocumentation
 */

/** Static screen concepts, not screenshots, real data or working product controls. */
interface ScreenStudyPanelProps {
  /** Workflow shows engineering stages; Iris suggests a compact research workspace. */
  chapter: 'workflow' | 'iris';
}

/**
 * Draw a quiet dark workspace in a 240 by 216 view box, without effects or assets.
 * No completion states, balances, returns or live product activity are implied.
 * @param props - Which section-specific screen design to draw.
 * @returns Decorative vector elements for a parent SVG with HTML explanation.
 */
export default function ScreenStudyPanel(props: ScreenStudyPanelProps) {
  const workflow = props.chapter === 'workflow';
  return (
    <g fontFamily="system-ui, sans-serif" data-screen-design={props.chapter}>
      <rect
        x="1"
        y="1"
        width="238"
        height="214"
        rx="7"
        fill="#17252e"
        stroke="#65808b"
      />
      <path d="M1 29h238" stroke="#344750" />
      <rect x="13" y="11" width="8" height="8" rx="2" fill="#a9c9b5" />
      <text x="28" y="18" fill="#c2d1d6" fontSize="8" letterSpacing="1">
        {workflow ? 'ENGINEERING' : 'IRIS'}
      </text>
      <text
        x="225"
        y="18"
        textAnchor="end"
        fill="#a5b7bf"
        fontSize="7"
        letterSpacing="0.8"
      >
        CONCEPT
      </text>
      <text x="14" y="55" fill="#eef4f2" fontSize="18" fontWeight="550">
        {workflow ? 'Workflow' : 'Market overview'}
      </text>
      {workflow ? (
        <>
          <text x="14" y="69" fill="#a5b7bf" fontSize="8">
            Plan → Build → Check
          </text>
          {[
            ['Plan', 'Scope & constraints'],
            ['Build', 'Code & interfaces'],
            ['Check', 'Tests & review'],
          ].map(([title, detail], index) => (
            <g key={title} transform={`translate(14 ${81 + index * 42})`}>
              <rect
                width="212"
                height="34"
                rx="5"
                fill={index === 1 ? '#263d42' : '#20323c'}
                stroke={index === 1 ? '#779c8b' : '#344b56'}
              />
              <rect x="9" y="9" width="17" height="17" rx="4" fill="#344b51" />
              <text
                x="17.5"
                y="21"
                textAnchor="middle"
                fill="#c2d6c9"
                fontSize="8"
              >
                {String(index + 1).padStart(2, '0')}
              </text>
              <text x="36" y="14" fill="#e3edeb" fontSize="11" fontWeight="550">
                {title}
              </text>
              <text x="36" y="26" fill="#b7c7cb" fontSize="8">
                {detail}
              </text>
              <path
                d="m191 14 4 3-4 3"
                fill="none"
                stroke="#91aaa9"
                strokeWidth="1.5"
              />
            </g>
          ))}
        </>
      ) : (
        <>
          <g fill="#acbec5" fontSize="8">
            <text x="14" y="73" fill="#c8dfd2">
              Markets
            </text>
            <text x="71" y="73">
              Wallets
            </text>
            <text x="125" y="73">
              Watchlist
            </text>
          </g>
          <path d="M14 79h35" stroke="#a9c9b5" strokeWidth="2" />
          <rect
            x="14"
            y="88"
            width="212"
            height="66"
            rx="5"
            fill="#20323c"
            stroke="#344b56"
          />
          <text x="24" y="103" fill="#b7c7cb" fontSize="8">
            Illustrative trend
          </text>
          <path
            d="M25 116h190m-190 15h190m-190 15h190"
            stroke="#344b56"
            strokeWidth="0.8"
          />
          <path
            d="m25 139 20-13 20 8 21-18 20 7 21-10 20 17 21-9 20 10 27-13"
            fill="none"
            stroke="#aacdb9"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <g fill="#20323c" stroke="#344b56">
            <rect x="14" y="164" width="101" height="38" rx="5" />
            <rect x="125" y="164" width="101" height="38" rx="5" />
          </g>
          <g fill="#e3edeb" fontSize="10" fontWeight="550">
            <text x="24" y="180">
              Wallets
            </text>
            <text x="135" y="180">
              Watchlist
            </text>
          </g>
          <g fill="#b7c7cb" fontSize="8">
            <text x="24" y="193">
              Public view
            </text>
            <text x="135" y="193">
              Saved assets
            </text>
          </g>
        </>
      )}
    </g>
  );
}
