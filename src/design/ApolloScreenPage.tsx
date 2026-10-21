/**
 * Original Apollo monitor concept based only on the approved public-safe narrative.
 * @packageDocumentation
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import './workflow-screen.css';

/**
 * Subscribe to the user's reduced-motion preference for the review artwork.
 * @param listener - React snapshot invalidation callback.
 * @returns Listener cleanup.
 */
function subscribeMotion(listener: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

/**
 * Read whether decorative artwork must remain still.
 * @returns The current reduced-motion preference.
 */
function readReducedMotion() {
  // Unknown preference support is a static view, never implicit animation consent.
  return (
    typeof window.matchMedia !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Suggest trading-platform engineering without private source or real market activity.
 * @returns Vector artwork with HTML explanations; no providers, engine or live data.
 */
export default function ApolloScreenPage() {
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readReducedMotion,
    () => true,
  );
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const artwork = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = artwork.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    let intersecting = false;
    /** Pause artwork outside the viewport or while its document is hidden. */
    function updateVisibility() {
      setVisible(intersecting && !document.hidden);
    }
    const observer = new IntersectionObserver((entries) => {
      intersecting = entries.some((entry) => entry.isIntersecting);
      updateVisibility();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);
  return (
    <div className="workflow-screen-page">
      <a className="skip-link" href="#apollo-screen-main">
        Skip to Apollo concept
      </a>
      <header className="workflow-screen-header">
        <a href="/#world-apollo">← Read the Apollo section</a>
        <span>Local artwork review · Illustrative concept · Not live 3D</span>
      </header>
      <main
        className="container workflow-screen-main"
        id="apollo-screen-main"
        tabIndex={-1}
      >
        <p className="workflow-screen-eyebrow">Monitor close-up / Apollo</p>
        <h1>Strategy, engine, perspective.</h1>
        <p className="workflow-screen-intro">
          Original artwork inspired by the approved Apollo story. All market
          shapes and connections are illustrative—not real prices, trading
          signals, architecture documentation or performance results. No private
          source or screenshots are used. Decorative motion is not a simulation
          of trading or live system activity.
        </p>
        <div className="workflow-motion-controls">
          <p>
            {reducedMotion
              ? 'Still artwork: reduced motion is enabled.'
              : 'Decorative motion only—not market updates or live telemetry.'}
          </p>
          <button
            type="button"
            disabled={reducedMotion}
            onClick={() => setPaused(!paused)}
          >
            {reducedMotion
              ? 'Animation off'
              : paused
                ? 'Resume animation'
                : 'Pause animation'}
          </button>
        </div>
        <div
          className="workflow-screen-scroll"
          ref={artwork}
          data-motion={
            visible && !paused && !reducedMotion ? 'playing' : 'paused'
          }
          tabIndex={0}
          role="region"
          aria-label="Apollo artwork; scroll horizontally on narrow screens"
        >
          <svg
            viewBox="0 0 1040 640"
            className="workflow-screen-art"
            aria-hidden="true"
          >
            <rect width="1040" height="640" rx="12" fill="#17232f" />
            <path d="M0 50h1040" stroke="#344454" />
            <g fontFamily="system-ui, sans-serif">
              <path
                d="m25 32 9-16 9 16m-14-5h10"
                fill="none"
                stroke="#e6bd84"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <text
                x="56"
                y="31"
                fill="#f0dfc3"
                fontSize="14"
                fontWeight="600"
                letterSpacing="1.5"
              >
                APOLLO
              </text>
              <text
                x="1009"
                y="30"
                textAnchor="end"
                fill="#acbdcc"
                fontSize="10"
                letterSpacing="1"
              >
                VISUAL CONCEPT · NOT LIVE
              </text>
              <text
                x="42"
                y="101"
                fill="#eaf1f3"
                fontSize="29"
                fontWeight="550"
              >
                A connected trading workspace.
              </text>
              <text x="42" y="127" fill="#aebfce" fontSize="13">
                Strategy, independent components and a clear view of the system.
              </text>
              <g data-concept="market-context">
                <rect
                  x="42"
                  y="153"
                  width="596"
                  height="272"
                  rx="16"
                  fill="#213541"
                  stroke="#587e8d"
                />
                <text
                  x="64"
                  y="188"
                  fill="#c7e4ed"
                  fontSize="18"
                  fontWeight="550"
                >
                  Market context
                </text>
                <text
                  x="615"
                  y="187"
                  textAnchor="end"
                  fill="#9fb8c4"
                  fontSize="10"
                >
                  ABSTRACT SHAPES / NO REAL DATA
                </text>
                {[234, 282, 330, 378].map((y) => (
                  <path key={y} d={`M64 ${y}h552`} stroke="#38515e" />
                ))}
                {[
                  [261, 300, false],
                  [276, 317, false],
                  [267, 304, true],
                  [244, 279, true],
                  [232, 267, true],
                  [250, 285, false],
                  [270, 305, false],
                  [293, 331, false],
                  [284, 319, true],
                  [265, 302, true],
                  [253, 286, true],
                  [269, 302, false],
                  [287, 324, false],
                  [310, 343, false],
                  [298, 330, true],
                  [279, 316, true],
                  [266, 299, true],
                  [281, 314, false],
                  [294, 329, false],
                  [284, 316, true],
                ].map(([top, bottom, rising], index) => {
                  const y = top as number;
                  const end = bottom as number;
                  const color = rising ? '#96cfb8' : '#e5a29a';
                  return (
                    <g
                      key={index}
                      transform={`translate(${81 + index * 27} 0)`}
                    >
                      <g
                        className="apollo-candle"
                        style={{ animationDelay: `${index * 0.12}s` }}
                      >
                        <path
                          d={`M0 ${y - 12}v${end - y + 24}`}
                          stroke={color}
                          strokeWidth="1.5"
                        />
                        <rect
                          x="-6"
                          y={y}
                          width="12"
                          height={end - y}
                          rx="2"
                          fill={color}
                        />
                      </g>
                    </g>
                  );
                })}
              </g>
              <g data-concept="strategy">
                <rect
                  x="662"
                  y="153"
                  width="336"
                  height="272"
                  rx="16"
                  fill="#39334f"
                  stroke="#8c77b5"
                />
                <rect
                  x="684"
                  y="175"
                  width="29"
                  height="4"
                  rx="2"
                  fill="#cdb0f1"
                />
                <text
                  x="684"
                  y="212"
                  fill="#e1ccf9"
                  fontSize="22"
                  fontWeight="550"
                >
                  Strategy
                </text>
                <text x="684" y="236" fill="#bfb1d2" fontSize="12">
                  Intent, constraints and decisions.
                </text>
                <path
                  d="M711 289h205m-103 0v76"
                  stroke="#9581b5"
                  strokeWidth="2"
                />
                <rect
                  x="689"
                  y="269"
                  width="44"
                  height="40"
                  rx="10"
                  fill="#9c83bf"
                />
                <rect
                  className="workflow-core"
                  x="782"
                  y="258"
                  width="62"
                  height="62"
                  rx="15"
                  fill="#c5a8ed"
                />
                <circle cx="916" cy="289" r="20" fill="#9c83bf" />
                <rect
                  x="784"
                  y="345"
                  width="58"
                  height="35"
                  rx="8"
                  fill="#75628e"
                />
                <text
                  x="711"
                  y="337"
                  textAnchor="middle"
                  fill="#cfbfdf"
                  fontSize="11"
                >
                  Rules
                </text>
                <text
                  x="916"
                  y="337"
                  textAnchor="middle"
                  fill="#cfbfdf"
                  fontSize="11"
                >
                  Limits
                </text>
                <text
                  x="813"
                  y="400"
                  textAnchor="middle"
                  fill="#cfbfdf"
                  fontSize="11"
                >
                  Decisions
                </text>
              </g>
              <g data-concept="engine">
                <rect
                  x="42"
                  y="449"
                  width="596"
                  height="149"
                  rx="16"
                  fill="#443a2e"
                  stroke="#ac9054"
                />
                <text
                  x="64"
                  y="483"
                  fill="#efd6a5"
                  fontSize="20"
                  fontWeight="550"
                >
                  Trading engine
                </text>
                <text
                  x="615"
                  y="481"
                  textAnchor="end"
                  fill="#ccbd9f"
                  fontSize="10"
                >
                  CONCEPTUAL CONNECTIONS
                </text>
                <path
                  className="apollo-link"
                  d="M208 548h65m149 0h65"
                  stroke="#b39b71"
                  strokeWidth="2"
                />
                <circle
                  className="workflow-signal"
                  cx="240"
                  cy="548"
                  r="5"
                  fill="#f0cf93"
                />
                <circle
                  className="workflow-signal"
                  style={{ animationDelay: '1s' }}
                  cx="454"
                  cy="548"
                  r="5"
                  fill="#f0cf93"
                />
                {[
                  ['Inputs', 64, '#766143'],
                  ['Engine', 273, '#ae8c57'],
                  ['Interface', 487, '#766143'],
                ].map(([label, x, color]) => (
                  <g key={label} transform={`translate(${x} 520)`}>
                    <rect
                      width={label === 'Interface' ? 128 : 144}
                      height="56"
                      rx="10"
                      fill={color as string}
                    />
                    <circle cx="22" cy="28" r="7" fill="#e5cb97" />
                    <text x="39" y="33" fill="#f3e5ca" fontSize="13">
                      {label}
                    </text>
                  </g>
                ))}
              </g>
              <g data-concept="monitoring">
                <rect
                  x="662"
                  y="449"
                  width="336"
                  height="149"
                  rx="16"
                  fill="#243e46"
                  stroke="#5e98a9"
                />
                <text
                  x="684"
                  y="483"
                  fill="#bde5ed"
                  fontSize="20"
                  fontWeight="550"
                >
                  Monitoring
                </text>
                <text x="684" y="505" fill="#a9c6ce" fontSize="12">
                  Visibility · checks · limits
                </text>
                <path
                  d="m686 548 14-9 14 5 15-12 14 9 15-4 14 9 15-6 14 5"
                  fill="none"
                  stroke="#97d4df"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {[22, 31, 18, 28, 24, 34, 20].map((height, index) => (
                  <rect
                    key={index}
                    className="apollo-meter"
                    style={{ animationDelay: `${index * 0.18}s` }}
                    x={842 + index * 18}
                    y={567 - height}
                    width="9"
                    height={height}
                    rx="3"
                    fill={index % 2 ? '#73b2bd' : '#466f7d'}
                  />
                ))}
                <text x="684" y="580" fill="#9dbac5" fontSize="9">
                  ILLUSTRATIVE ONLY / NO TELEMETRY
                </text>
              </g>
            </g>
          </svg>
        </div>
        <div className="workflow-screen-notes">
          <section>
            <h2>Strategy</h2>
            <p>
              A visual suggestion of rules and constraints, not an actual
              strategy or trading signal.
            </p>
          </section>
          <section>
            <h2>Trading engine</h2>
            <p>
              Independent parts brought together in one workspace, as described
              in the approved narrative. This is not an architecture disclosure.
            </p>
          </section>
          <section>
            <h2>Monitoring</h2>
            <p>
              A clear view of the system—not live telemetry, verified
              performance or profitability.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
