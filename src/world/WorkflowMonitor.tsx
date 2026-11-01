/**
 * One owned About me surface shared by the opening room and monitor approach.
 * @packageDocumentation
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import {
  CanvasTexture,
  LinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import type { Object3D } from 'three';
import { MONITOR_SCREEN } from './monitor-landmarks';
import { drawTerminalWelcome } from './terminal-screen';

/** Per-mount model attachment target. */
interface MonitorProps {
  /** Independently cloned scene, never the loader cache. */
  scene: Object3D;
}

/** Attach an emissive screen while preserving the original room/model and its loader cache.
 * @param props - Independently cloned model instance.
 * @returns No Fiber geometry; the effect owns all attached display resources.
 */
export default function WorkflowMonitor(props: MonitorProps) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1040;
    canvas.height = 585;
    const context = canvas.getContext('2d');
    if (!context) return;
    drawTerminalWelcome(context);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    const geometry = new PlaneGeometry(
      MONITOR_SCREEN.width,
      MONITOR_SCREEN.height,
    );
    const material = new MeshPhysicalMaterial({
      color: '#000000',
      emissive: '#ffffff',
      emissiveMap: texture,
      emissiveIntensity: 1,
      roughness: 1,
      clearcoat: 0,
      toneMapped: false,
    });
    const plane = new Mesh(geometry, material);
    plane.position.set(MONITOR_SCREEN.x, MONITOR_SCREEN.y, MONITOR_SCREEN.z);
    props.scene.add(plane);
    gl.domElement.setAttribute('data-monitor-desktop', 'ready');
    gl.domElement.setAttribute('data-monitor-terminal', 'true');
    invalidate();
    return () => {
      props.scene.remove(plane);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      gl.domElement.removeAttribute('data-monitor-desktop');
      gl.domElement.removeAttribute('data-monitor-terminal');
    };
  }, [props.scene, gl, invalidate]);
  return null;
}
