/**
 * A single decorative typing pass with complete, immediately accessible profile text.
 * @packageDocumentation
 */
import { useEffect, useRef } from 'react';

/** Personal copy stays owned by the approved content document. */
interface TypingFactsProps {
  /** Full text available to assistive technology from the first render. */
  text: string;
}

/** Type once without announcing individual characters.
 * @param props - Approved personal details.
 * @returns Responsive personal details with a decorative blinking cursor.
 */
export default function TypingFacts(props: TypingFactsProps) {
  const line = useRef<HTMLParagraphElement>(null);
  const visual = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const container = line.current;
    const output = visual.current;
    if (!container || !output) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number | undefined;
    const started = performance.now();
    output.textContent = '';
    container.scrollLeft = 0;
    container.dataset.typing = 'active';
    /** Finish decoration immediately when motion is reduced or the page is hidden. */
    function finish() {
      window.clearInterval(timer);
      output!.textContent = props.text;
      container!.dataset.typing = 'complete';
      container!.scrollLeft = 0;
    }
    /** Respect a newly enabled motion preference without replaying the typing. */
    function preference() {
      if (motion.matches) finish();
    }
    /** Hidden time is not replayed when returning to the tab. */
    function visibility() {
      container!.toggleAttribute('data-hidden', document.hidden);
      if (document.hidden) finish();
    }
    if (motion.matches || document.hidden) finish();
    else
      timer = window.setInterval(() => {
        // Late callbacks catch up rather than extending the entry delay under load.
        const index = Math.min(
          props.text.length,
          Math.floor((performance.now() - started) / 40),
        );
        output.textContent = props.text.slice(0, index);
        // Follow the cursor only when the desktop line overflows its container.
        container.scrollLeft = container.scrollWidth;
        if (index >= props.text.length) {
          window.clearInterval(timer);
          container.dataset.typing = 'complete';
        }
      }, 40);
    motion.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearInterval(timer);
      motion.removeEventListener('change', preference);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [props.text]);
  return (
    <p
      className="landing-facts"
      data-typing="active"
      ref={line}
      tabIndex={0}
      role="region"
      aria-label="Personal details"
    >
      <span className="landing-facts-readable">{props.text}</span>
      <span aria-hidden="true">
        <span className="landing-facts-text" ref={visual} />
        <span className="monitor-cursor" />
      </span>
    </p>
  );
}
