/**
 * Concept-led monitor artwork: color and shapes support the HTML, not a technical demo.
 * @packageDocumentation
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import './workflow-screen.css';

/**
 * Track reduced-motion changes without starting any animation from JavaScript.
 * @param listener - React snapshot invalidation callback.
 * @returns Cleanup for the media-query listener.
 */
function subscribeMotion(listener: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

/**
 * Read the current motion preference before allowing CSS playback.
 * @returns Whether the artwork must remain still.
 */
function readReducedMotion() {
  return (
    typeof window.matchMedia !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Present full-stack concepts without source code, project specifics or execution claims.
 * @returns Static review artwork and readable descriptions, independent of WebGL.
 */
export default function WorkflowScreenPage() {
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
    /** Gate CSS playback on both document visibility and artwork intersection. */
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
      <a className="skip-link" href="#workflow-screen-main" tabIndex={0}>
        Skip to screen concept
      </a>
      <header className="workflow-screen-header">
        <a href="/scene-study/workflow">← Back to the desk study</a>
        <span>Local artwork review · Not live 3D</span>
      </header>
      <main
        className="container workflow-screen-main"
        id="workflow-screen-main"
        tabIndex={-1}
      >
        <p className="workflow-screen-eyebrow">Monitor close-up / Workflow</p>
        <h1>One workspace, from idea to delivery.</h1>
        <p className="workflow-screen-intro">
          A colorful, concept-led screen: interface, services and data connected
          by one workflow. Decorative artwork only—not a product demo or
          execution evidence. The desk, homepage and camera are unchanged.
        </p>
        <div className="workflow-motion-controls">
          <p>
            {reducedMotion
              ? 'Still artwork: reduced motion is enabled.'
              : 'Subtle illustrative motion—not live system activity.'}
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
          aria-label="Workflow artwork; scroll horizontally on narrow screens"
        >
          <svg
            viewBox="0 0 1040 640"
            className="workflow-screen-art"
            aria-hidden="true"
          >
            <rect width="1040" height="640" rx="12" fill="#17232f" />
            <path d="M0 50h1040" stroke="#344454" />
            <g fontFamily="system-ui, sans-serif">
              <rect
                x="26"
                y="18"
                width="14"
                height="14"
                rx="4"
                fill="#b1cdb3"
              />
              <text x="51" y="30" fill="#e6eee8" fontSize="13" fontWeight="600">
                WORKFLOW
              </text>
              <text
                x="1009"
                y="30"
                textAnchor="end"
                fill="#acbdcc"
                fontSize="10"
                letterSpacing="1"
              >
                VISUAL CONCEPT
              </text>
              <text
                x="42"
                y="101"
                fill="#eaf1f3"
                fontSize="29"
                fontWeight="550"
              >
                One connected process.
              </text>
              <text x="42" y="127" fill="#aebfce" fontSize="13">
                From the experience people see to the systems behind it.
              </text>
              <path
                className="workflow-link"
                d="M310 302h48m324 0h48"
                stroke="#a6dbea"
                strokeWidth="3"
              />
              <circle
                className="workflow-signal"
                cx="334"
                cy="302"
                r="6"
                fill="#8c9eae"
              />
              <circle
                className="workflow-signal"
                style={{ animationDelay: '1s' }}
                cx="706"
                cy="302"
                r="6"
                fill="#8c9eae"
              />
              <g data-concept="interface">
                <rect
                  x="42"
                  y="165"
                  width="268"
                  height="268"
                  rx="18"
                  fill="#223f50"
                  stroke="#558fa5"
                />
                <rect
                  x="63"
                  y="187"
                  width="31"
                  height="5"
                  rx="2.5"
                  fill="#8fd5ed"
                />
                <text
                  x="63"
                  y="225"
                  fill="#c0eafb"
                  fontSize="23"
                  fontWeight="550"
                >
                  Interface
                </text>
                <text x="63" y="248" fill="#a8c7d6" fontSize="12">
                  Design · interaction · experience
                </text>
                <rect
                  x="80"
                  y="278"
                  width="193"
                  height="121"
                  rx="10"
                  fill="#142e3d"
                  stroke="#69aac3"
                />
                <path d="M80 303h193" stroke="#47778d" />
                <circle cx="93" cy="291" r="3" fill="#91cce1" />
                <circle cx="104" cy="291" r="3" fill="#527c90" />
                <rect
                  x="93"
                  y="317"
                  width="48"
                  height="67"
                  rx="6"
                  fill="#365b70"
                />
                <rect
                  className="workflow-interface-highlight"
                  x="152"
                  y="317"
                  width="107"
                  height="28"
                  rx="6"
                  fill="#91d1e5"
                />
                <rect
                  x="152"
                  y="355"
                  width="48"
                  height="29"
                  rx="6"
                  fill="#4e90a9"
                />
                <rect
                  x="211"
                  y="355"
                  width="48"
                  height="29"
                  rx="6"
                  fill="#396a82"
                />
              </g>
              <g data-concept="services">
                <rect
                  x="358"
                  y="165"
                  width="324"
                  height="268"
                  rx="18"
                  fill="#3a3453"
                  stroke="#8f7ab8"
                />
                <rect
                  x="379"
                  y="187"
                  width="31"
                  height="5"
                  rx="2.5"
                  fill="#cdb0f1"
                />
                <text
                  x="379"
                  y="225"
                  fill="#e2ccfc"
                  fontSize="23"
                  fontWeight="550"
                >
                  Services
                </text>
                <text x="379" y="248" fill="#c0b1d4" fontSize="12">
                  Logic · integration · coordination
                </text>
                <path
                  d="M415 342h62m86 0h62m-105-49v98"
                  stroke="#a38bc9"
                  strokeWidth="2"
                />
                <rect
                  x="395"
                  y="322"
                  width="40"
                  height="40"
                  rx="10"
                  fill="#9c83bf"
                />
                <rect
                  className="workflow-core"
                  x="477"
                  y="299"
                  width="86"
                  height="86"
                  rx="20"
                  fill="#c5a8ed"
                />
                <rect
                  x="605"
                  y="322"
                  width="40"
                  height="40"
                  rx="10"
                  fill="#9c83bf"
                />
                <circle
                  className="workflow-pulse"
                  cx="520"
                  cy="342"
                  r="16"
                  fill="#76608f"
                />
                <circle cx="520" cy="291" r="8" fill="#ae92d4" />
                <circle cx="520" cy="393" r="8" fill="#ae92d4" />
              </g>
              <g data-concept="data">
                <rect
                  x="730"
                  y="165"
                  width="268"
                  height="268"
                  rx="18"
                  fill="#49402f"
                  stroke="#ac9054"
                />
                <rect
                  x="751"
                  y="187"
                  width="31"
                  height="5"
                  rx="2.5"
                  fill="#e9cb85"
                />
                <text
                  x="751"
                  y="225"
                  fill="#f3dca7"
                  fontSize="23"
                  fontWeight="550"
                >
                  Data
                </text>
                <text x="751" y="248" fill="#d2c1a1" fontSize="12">
                  Structure · flow · information
                </text>
                <g className="workflow-data">
                  <path d="M810 305v72c0 24 108 24 108 0v-72" fill="#a98b53" />
                  <ellipse cx="864" cy="305" rx="54" ry="17" fill="#ebce8d" />
                  <path
                    d="M810 329c0 23 108 23 108 0m-108 25c0 23 108 23 108 0"
                    fill="none"
                    stroke="#e8c987"
                    strokeWidth="2"
                  />
                </g>
                <circle
                  className="workflow-pulse"
                  style={{ animationDelay: '2s' }}
                  cx="936"
                  cy="294"
                  r="7"
                  fill="#c2a567"
                />
                <circle cx="794" cy="382" r="5" fill="#e8c987" />
              </g>
              <rect
                x="42"
                y="454"
                width="956"
                height="54"
                rx="12"
                fill="#263d37"
                stroke="#547a67"
              />
              <text
                x="63"
                y="487"
                fill="#c8e4cb"
                fontSize="13"
                fontWeight="550"
              >
                Quality throughout
              </text>
              {['Accessibility', 'Reliability', 'Security', 'Performance'].map(
                (label, index) => (
                  <g
                    key={label}
                    transform={`translate(${275 + index * 177} 467)`}
                  >
                    <circle cx="6" cy="14" r="4" fill="#9cc8a6" />
                    <text x="21" y="18" fill="#bdd5c5" fontSize="12">
                      {label}
                    </text>
                  </g>
                ),
              )}
              {[
                ['Understand', '#8fd5ed'],
                ['Design', '#efb6aa'],
                ['Build', '#cdb0f1'],
                ['Check', '#a3d5ad'],
                ['Deliver', '#e9cb85'],
              ].map(([label, accent], index) => (
                <g key={label} transform={`translate(${42 + index * 195} 548)`}>
                  <rect
                    className="workflow-stage-card"
                    style={{ animationDelay: `${index * 1.2}s` }}
                    width="176"
                    height="58"
                    rx="10"
                    fill="#223240"
                  />
                  <circle
                    className="workflow-step"
                    style={{ animationDelay: `${index * 1.2}s` }}
                    cx="24"
                    cy="29"
                    r="9"
                    fill={accent}
                  />
                  <text x="44" y="34" fill="#d7e3eb" fontSize="13">
                    {label}
                  </text>
                  {index < 4 && (
                    <path d="m183 26 4 3-4 3" fill="none" stroke="#8c9eae" />
                  )}
                </g>
              ))}
            </g>
          </svg>
        </div>
        <div className="workflow-screen-notes">
          <section>
            <h2>Interface</h2>
            <p>The experience people see and interact with.</p>
          </section>
          <section>
            <h2>Services</h2>
            <p>The logic and connections behind that experience.</p>
          </section>
          <section>
            <h2>Data</h2>
            <p>
              Information structured and moved through the system. Quality
              concepts are design concerns, not measured results or
              certifications.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
