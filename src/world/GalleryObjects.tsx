/**
 * Restrained exhibition architecture supporting the detailed Iris instrument.
 * @packageDocumentation
 */
import IrisInstallation, { MachinedBody } from './IrisInstallation';

/**
 * Ground the hub and Iris in one beveled ceramic platform, not scattered primitives.
 * @returns The provisional low hub and installation, without a page-spanning floor.
 */
export default function GalleryObjects() {
  return (
    <group>
      <MachinedBody
        size={[7.2, 0.14, 4.5]}
        position={[0, -0.06, 0]}
        color="#9da99a"
        bevel={0.025}
      />
      <MachinedBody
        size={[7.3, 0.2, 4.6]}
        position={[0, 0.04, 0]}
        color="#e4e8db"
        bevel={0.045}
      />
      <group position={[-1.85, 0.14, -0.4]}>
        <MachinedBody
          size={[1.9, 0.2, 1.9]}
          position={[0, 0.1, 0]}
          color="#d8e0d0"
          bevel={0.035}
        />
        <MachinedBody
          size={[1.32, 1.45, 0.95]}
          position={[0, 0.91, -0.15]}
          color="#edeedf"
          bevel={0.08}
        />
        <MachinedBody
          size={[0.86, 0.86, 0.06]}
          position={[0, 1.03, 0.365]}
          color="#344c3e"
          bevel={0.012}
          metalness={0.3}
        />
        {[-0.22, -0.07, 0.08, 0.23].map((x) => (
          <mesh key={x} position={[x, 1.02, 0.405]}>
            <boxGeometry args={[0.025, 0.4, 0.007]} />
            <meshStandardMaterial
              color="#abbda5"
              roughness={0.4}
              metalness={0.5}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.52, 0.36]}>
          <boxGeometry args={[0.7, 0.025, 0.018]} />
          <meshStandardMaterial
            color="#93a48c"
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      </group>
      <IrisInstallation />
      <mesh position={[-0.55, 0.146, 0.78]}>
        <boxGeometry args={[3.9, 0.007, 0.018]} />
        <meshStandardMaterial color="#7f9880" roughness={0.5} />
      </mesh>
      <mesh position={[1.39, 0.146, 0.56]}>
        <boxGeometry args={[0.018, 0.007, 0.45]} />
        <meshStandardMaterial
          color="#ba8c60"
          metalness={0.6}
          roughness={0.32}
        />
      </mesh>
    </group>
  );
}
