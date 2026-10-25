/**
 * Typed shape of the checked-in intro glTF fixture used by asset regressions.
 * @packageDocumentation
 */

/** Geometry, animation and material fields asserted by the intro regression suites. */
export interface IntroModel {
  accessors: {
    componentType: number;
    type: 'SCALAR' | 'VEC3' | 'VEC4';
    bufferView: number;
    byteOffset?: number;
    count: number;
  }[];
  bufferViews: { byteOffset?: number; byteLength: number }[];
  animations: {
    name: string;
    channels: { sampler: number; target: { node: number; path: string } }[];
    samplers: { input: number; output: number }[];
  }[];
  nodes: { name: string; skin?: number }[];
  skins: { joints: number[] }[];
  cameras?: unknown[];
  extensions?: { KHR_lights_punctual?: unknown };
  buffers: { uri?: string }[];
  images?: unknown[];
  meshes: {
    name: string;
    primitives: {
      indices: number;
      extensions: { KHR_draco_mesh_compression: { bufferView: number } };
    }[];
  }[];
  materials: {
    name: string;
    pbrMetallicRoughness: { baseColorFactor: number[] };
    extensions?: { KHR_materials_sheen?: { sheenColorFactor?: number[] } };
  }[];
  extensionsRequired: string[];
}
