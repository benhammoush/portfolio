/**
 * Original exhibition hardware for Iris: beveled housing, optical panes and signals.
 * No product screenshots, downloaded models or live data are embedded.
 * @packageDocumentation
 */
import { useMemo } from 'react';
import { CatmullRomCurve3, Shape, Vector3 } from 'three';
import type { Point } from './chapters';

/** Dimensions and finish for a machined, edge-softened solid. */
interface BodyProps {
  /** Width, height and depth in arbitrary scene units. */
  size: Point;
  /** World or parent-relative placement. */
  position: Point;
  /** Surface pigment, independent of its roughness. */
  color: string;
  /** Edge bevel width; constrained to fit the smallest dimension. */
  bevel?: number;
  /** Metallic response, kept separate from ceramic bodies. */
  metalness?: number;
}

/**
 * Form a centered rounded outline that can be extruded or used as a frame opening.
 * @param width - Outline width in scene units.
 * @param height - Outline height in scene units.
 * @param radius - Corner radius, less than half either dimension.
 * @returns A closed two-dimensional contour; it owns no GPU resources.
 */
function roundedOutline(width: number, height: number, radius: number): Shape {
  const left = -width / 2;
  const right = width / 2;
  const bottom = -height / 2;
  const top = height / 2;
  const shape = new Shape();
  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  shape.closePath();
  return shape;
}

/**
 * Add a small physical bevel so edges receive highlights instead of razor-box shading.
 * @param props - Dimensions, placement and restrained surface finish.
 * @returns Declaratively owned geometry/material, disposed when the world unmounts.
 */
export function MachinedBody(props: BodyProps) {
  const [width, height, depth] = props.size;
  const bevel = Math.min(props.bevel ?? 0.025, height / 4, depth / 4);
  const outline = useMemo(
    () =>
      roundedOutline(
        width - bevel * 2,
        height - bevel * 2,
        Math.min(bevel * 2, (width - bevel * 2) / 2, (height - bevel * 2) / 2),
      ),
    [width, height, bevel],
  );
  return (
    <mesh position={[...props.position]} castShadow receiveShadow>
      <extrudeGeometry
        args={[
          outline,
          {
            depth: depth - bevel * 2,
            bevelEnabled: true,
            bevelSize: bevel,
            bevelThickness: bevel,
            bevelSegments: 3,
            steps: 1,
            curveSegments: 8,
          },
        ]}
        onUpdate={(geometry) => geometry.center()}
      />
      <meshStandardMaterial
        color={props.color}
        roughness={props.metalness ? 0.3 : 0.58}
        metalness={props.metalness ?? 0.08}
      />
    </mesh>
  );
}

/**
 * Build the opening rather than hiding a rectangle behind an opaque pseudo-frame.
 * @returns A beveled frame with an actual aperture and recessed glass.
 */
function ObservationFrame() {
  const frame = useMemo(() => {
    const outer = roundedOutline(2.5, 2.8, 0.12);
    outer.holes.push(roundedOutline(2.2, 2.5, 0.065));
    return outer;
  }, []);
  return (
    <group position={[0, 1.83, 0]}>
      <mesh castShadow receiveShadow>
        <extrudeGeometry
          args={[
            frame,
            {
              depth: 0.12,
              bevelEnabled: true,
              bevelSize: 0.018,
              bevelThickness: 0.018,
              bevelSegments: 3,
              curveSegments: 12,
            },
          ]}
        />
        <meshStandardMaterial
          color="#d9dfd3"
          metalness={0.55}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[2.19, 2.49, 0.045]} />
        <meshPhysicalMaterial
          color="#e2eee3"
          transparent
          opacity={0.24}
          depthWrite={false}
          roughness={0.18}
          metalness={0}
          clearcoat={0.5}
        />
      </mesh>
      {[-1.16, 1.16].flatMap((x) =>
        [-1.31, 1.31].map((y) => (
          <group key={`${x}-${y}`} position={[x, y, 0.15]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.029, 0.029, 0.016, 12]} />
              <meshStandardMaterial
                color="#79877d"
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
            <mesh position={[0, 0, 0.012]}>
              <boxGeometry args={[0.027, 0.006, 0.002]} />
              <meshStandardMaterial color="#34443b" />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

/**
 * Use constructed, recessed signal paths rather than floating chart dots.
 * @returns Schematic physical routing behind the optical panel, not product metrics.
 */
function SignalAssembly() {
  const paths = useMemo(
    () =>
      [
        [
          [-0.78, -0.7],
          [-0.4, -0.7],
          [-0.1, -0.4],
          [0.12, -0.4],
          [0.6, 0.18],
        ],
        [
          [-0.78, -0.3],
          [-0.54, -0.3],
          [-0.1, 0.14],
          [0.3, 0.14],
          [0.6, 0.48],
        ],
        [
          [-0.78, 0.1],
          [-0.5, 0.1],
          [-0.2, 0.5],
          [0.26, 0.5],
          [0.6, 0.78],
        ],
      ].map(
        (points) =>
          new CatmullRomCurve3(
            points.map(([x, y]) => new Vector3(x, y, 0)),
            false,
            'centripetal',
            0.1,
          ),
      ),
    [],
  );
  return (
    <group position={[0, 1.83, -0.11]}>
      <MachinedBody
        size={[2.15, 2.44, 0.09]}
        position={[0, 0, -0.22]}
        color="#243e34"
        bevel={0.02}
      />
      {paths.map((curve, index) => (
        <group key={index}>
          <mesh>
            <tubeGeometry args={[curve, 32, 0.016, 6, false]} />
            <meshStandardMaterial
              color={index === 1 ? '#c59162' : '#89a893'}
              metalness={0.45}
              roughness={0.3}
            />
          </mesh>
          <mesh position={curve.getPoint(1)} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.062, 0.062, 0.025, 24]} />
            <meshStandardMaterial
              color={index === 1 ? '#dab184' : '#bed0bd'}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[-0.8 + index * 0.22, -0.99, -0.09]}>
          <boxGeometry args={[0.06, 0.012, 0.012]} />
          <meshStandardMaterial color="#98b09a" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Assemble one coherent exhibit with housing, supports, optical layers and service detail.
 * @returns The original Iris installation; no external assets or live telemetry.
 */
export default function IrisInstallation() {
  return (
    <group position={[1.45, 0.12, -0.45]} rotation={[0, -0.12, 0]}>
      <MachinedBody
        size={[3.05, 0.17, 1.65]}
        position={[0, 0.1, -0.45]}
        color="#89988b"
        bevel={0.03}
        metalness={0.45}
      />
      <MachinedBody
        size={[2.95, 0.23, 1.5]}
        position={[0, 0.28, -0.42]}
        color="#edf0e5"
        bevel={0.035}
      />
      <MachinedBody
        size={[2.5, 0.08, 0.33]}
        position={[0, 0.44, -0.14]}
        color="#56695b"
        bevel={0.012}
        metalness={0.5}
      />
      <MachinedBody
        size={[0.17, 2.6, 0.26]}
        position={[-1.18, 1.72, -0.25]}
        color="#dde2d5"
        bevel={0.025}
      />
      <MachinedBody
        size={[0.17, 2.6, 0.26]}
        position={[1.18, 1.72, -0.25]}
        color="#dde2d5"
        bevel={0.025}
      />
      <ObservationFrame />
      <SignalAssembly />
      <mesh position={[0.1, 1.95, -0.68]}>
        <boxGeometry args={[2.32, 2.38, 0.055]} />
        <meshStandardMaterial
          color="#d0dfd1"
          transparent
          opacity={0.16}
          depthWrite={false}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <MachinedBody
        size={[0.13, 2.8, 0.17]}
        position={[1.38, 1.83, 0.04]}
        color="#b57a49"
        metalness={0.8}
        bevel={0.02}
      />
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[-0.95 + index * 0.13, 0.33, 0.98]}>
          <boxGeometry args={[0.055, 0.025, 0.01]} />
          <meshStandardMaterial
            color="#819080"
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
