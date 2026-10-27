/**
 * Per-mount keyboard pose correction, retaining the original loop and mouse gestures.
 * @packageDocumentation
 */
import { Quaternion, Vector3 } from 'three';
import type { AnimationClip } from 'three';

/**
 * Lift the wrist above the keys, soften finger travel and keep the arm connected.
 * Only cloned keyboard tracks change; the cached clip and other joints stay intact.
 * @param source - Original authored, looping working-pose clip.
 * @returns A local corrected clip with the same duration and closed endpoints.
 */
export function refineKeyboardAnimation(source: AnimationClip): AnimationClip {
  const clip = source.clone();
  /**
   * Small model-space home-row adjustments, in metres rather than screen pixels.
   * @param name - Keyboard joint name.
   * @returns Translation from the original neutral pose.
   */
  function shift(name: string): Vector3 {
    if (name === 'KeyboardForearm') return new Vector3(-0.01, 0.01, 0.005);
    if (name === 'KeyboardPalm') return new Vector3(-0.025, 0.022, 0.015);
    if (/^KeyboardFinger\d+Base$/.test(name))
      return new Vector3(-0.025, 0.017, 0.015);
    if (/^KeyboardFinger\d+Tip$/.test(name))
      return new Vector3(-0.025, 0.014, 0.015);
    return new Vector3();
  }
  /**
   * Aim an upper-arm/forearm correction at the adjusted distal joint.
   * @param from - Proximal joint name.
   * @param to - Distal joint name.
   * @returns Global-space rotation preserving the authored limb's twist.
   */
  function directionCorrection(from: string, to: string): Quaternion {
    const a = source.tracks.find((track) => track.name === `${from}.position`);
    const b = source.tracks.find((track) => track.name === `${to}.position`);
    if (!a || !b) return new Quaternion();
    const start = new Vector3().fromArray(a.values);
    const end = new Vector3().fromArray(b.values);
    const original = end.clone().sub(start).normalize();
    const corrected = end
      .add(shift(to))
      .sub(start.add(shift(from)))
      .normalize();
    return new Quaternion().setFromUnitVectors(original, corrected);
  }
  for (const track of clip.tracks) {
    const [name, property] = track.name.split('.');
    if (!name.startsWith('Keyboard')) continue;
    if (property === 'position') {
      const offset = shift(name);
      const origin = new Vector3().fromArray(track.values);
      for (let i = 0; i < track.values.length; i += 3) {
        const point = new Vector3()
          .fromArray(track.values, i)
          .sub(origin)
          .multiplyScalar(0.35)
          .add(origin)
          .add(offset);
        point.toArray(track.values, i);
      }
    } else if (property === 'quaternion') {
      const origin = new Quaternion().fromArray(track.values);
      const correction =
        name === 'KeyboardUpperArm'
          ? directionCorrection(name, 'KeyboardForearm')
          : name === 'KeyboardForearm'
            ? directionCorrection(name, 'KeyboardPalm')
            : name === 'KeyboardPalm'
              ? new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.045)
              : new Quaternion();
      for (let i = 0; i < track.values.length; i += 4) {
        const sample = new Quaternion().fromArray(track.values, i);
        origin
          .clone()
          .slerp(sample, 0.55)
          .premultiply(correction)
          .normalize()
          .toArray(track.values, i);
      }
    }
  }
  return clip;
}
