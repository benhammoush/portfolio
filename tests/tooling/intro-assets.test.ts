/**
 * Check the generated static model/poster contract without loading a GPU renderer.
 * @packageDocumentation
 */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import manifest from '../../src/assets/intro/intro-scene.json';
import type { IntroModel } from '../intro-model';

const model = readFileSync('src/assets/intro/intro-scene.glb');
const jsonLength = model.readUInt32LE(12);
const document = JSON.parse(
  model.subarray(20, 20 + jsonLength).toString('utf8'),
) as IntroModel;

/**
 * Read uncompressed float animation tracks (geometry itself remains Draco).
 * @param index - glTF animation accessor index.
 * @returns Flat scalar values, without requiring a renderer or decoder.
 */
function animationValues(index: number): number[] {
  const accessor = document.accessors[index];
  expect(accessor.componentType).toBe(5126);
  const width = { SCALAR: 1, VEC3: 3, VEC4: 4 }[accessor.type];
  const view = document.bufferViews[accessor.bufferView];
  const start =
    28 + jsonLength + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return Array.from({ length: accessor.count * width }, (_, i) =>
    model.readFloatLE(start + i * 4),
  );
}

test('articulated loop closes at matching poses with bounded joint motion', () => {
  const animation = document.animations[0];
  for (const channel of animation.channels) {
    const sampler = animation.samplers[channel.sampler];
    const times = animationValues(sampler.input);
    expect(times[0]).toBe(0);
    expect(times.at(-1)).toBe(24);
    const values = animationValues(sampler.output);
    const width = document.accessors[sampler.output].type === 'VEC4' ? 4 : 3;
    if (
      document.nodes[channel.target.node].name.startsWith('KeyboardFinger') &&
      channel.target.path === 'rotation'
    ) {
      const angles = Array.from({ length: values.length / 4 }, (_, frame) => {
        const dot = values
          .slice(frame * 4, frame * 4 + 4)
          .reduce((sum, value, axis) => sum + value * values[axis], 0);
        return 2 * Math.acos(Math.min(1, Math.abs(dot)));
      });
      // Separate finger articulation replaces moving the entire palm up/down.
      expect(Math.max(...angles)).toBeGreaterThan(0.05);
      expect(Math.max(...angles)).toBeLessThan(0.25);
    }
    for (let axis = 0; axis < width; axis++) {
      expect(values.at(-width + axis)).toBeCloseTo(values[axis], 6);
      if (channel.target.path === 'translation') {
        const positions = values.filter((_, i) => i % width === axis);
        expect(
          Math.max(...positions.map((value) => Math.abs(value - positions[0]))),
        ).toBeLessThan(
          document.nodes[channel.target.node].name.startsWith('Mouse') &&
            document.nodes[channel.target.node].name !== 'MouseDevice'
            ? 0.38
            : 0.06,
        );
        if (
          axis === 1 &&
          ['MouseDevice'].includes(document.nodes[channel.target.node].name)
        ) {
          // glTF Y is up: the mouse stays on its mat even during hand transfers.
          expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(
            1e-6,
          );
        }
      }
    }
  }
});

test('intro GLB embeds geometry and a bounded character clip without camera or lights', () => {
  expect(model.toString('ascii', 0, 4)).toBe('glTF');
  expect(model.readUInt32LE(4)).toBe(2);
  expect(model.readUInt32LE(8)).toBe(model.length);
  expect(manifest.glb_bytes).toBe(model.length);
  expect(document.animations).toHaveLength(1);
  expect(manifest.animations).toBe(1);
  expect(document.animations[0].name).toBe('Intro natural working cycle');
  expect(document.skins).toHaveLength(1);
  const jointNames = document.skins[0].joints.map(
    (index: number) => document.nodes[index].name,
  );
  expect(jointNames).toHaveLength(47);
  for (const name of [
    'Rest',
    'Spine',
    'Head',
    'KeyboardUpperArm',
    'KeyboardForearm',
    'KeyboardPalm',
    'MouseUpperArm',
    'MouseForearm',
    'MousePalm',
    'MouseDevice',
    'MouseFinger0Base',
    'MouseFinger0Tip',
    'FlagWave1',
    'FlagWave2',
    'FlagWave3',
    'FlagWave15',
    'LeftThigh',
    'LeftCalf',
    'LeftFoot',
    'RightThigh',
    'RightCalf',
    'RightFoot',
  ]) {
    expect(jointNames).toContain(name);
  }
  for (let finger = 0; finger < 4; finger++) {
    expect(jointNames).toContain(`KeyboardFinger${finger}Base`);
    expect(jointNames).toContain(`KeyboardFinger${finger}Tip`);
    expect(jointNames).toContain(`MouseFinger${finger}Base`);
    expect(jointNames).toContain(`MouseFinger${finger}Tip`);
  }
  for (const channel of document.animations[0].channels) {
    expect(document.skins[0].joints).toContain(channel.target.node);
    expect(['translation', 'rotation', 'scale']).toContain(channel.target.path);
  }
  expect(document.cameras ?? []).toHaveLength(0);
  expect(document.extensions?.KHR_lights_punctual).toBeUndefined();
  expect(
    document.buffers.every((buffer: { uri?: string }) => !buffer.uri),
  ).toBe(true);
  expect(document.images ?? []).toHaveLength(0);
  expect(manifest.external_assets).toEqual([]);
  expect(manifest.source_review).toBe('cloth-feet-01');
  expect(manifest.inventory).toEqual({
    hood: false,
    parallettes: false,
    vietnam_flag: true,
  });
  expect(document.meshes).toHaveLength(manifest.material_batches);
  const names = document.meshes.map((mesh: { name: string }) => mesh.name);
  for (const material of [
    'Character review / hoodie.001',
    'Character review / joggers.001',
    'Character review / sole',
    'Furniture review / fabric',
    'Furniture review / flask',
    'Furniture review / oak',
    'Plant review / underside',
    'Flag review / Vietnam red',
    'Flag review / Vietnam yellow',
    'Input review / charcoal shell',
    'Input review / graphite keys',
    'Input review / muted red keys',
    'Input review / black desk mat',
  ]) {
    expect(names).toContain(`Web / ${material}`);
  }
  for (const name of [
    'Character review / hoodie.001',
    'Character review / joggers.001',
    'Furniture review / fabric',
  ]) {
    const material = document.materials.find(
      (entry: { name: string }) => entry.name === `Web / ${name}`,
    );
    expect(
      material!.pbrMetallicRoughness.baseColorFactor
        .slice(0, 3)
        .every((channel: number) => channel < 0.06),
    ).toBe(true);
    for (const channel of material!.extensions?.KHR_materials_sheen
      ?.sheenColorFactor ?? []) {
      expect(channel).toBeLessThanOrEqual(0.031);
    }
  }
});

test('compressed model matches the local input-details trial triangle count and batches', () => {
  expect(document.extensionsRequired).toContain('KHR_draco_mesh_compression');
  expect(manifest.compression).toEqual({
    codec: 'draco',
    position_bits: 16,
    normal_bits: 14,
  });
  // The approved uncompressed derivative was 2,167,156 bytes. This is a
  // comparative regression check, not a physical-device performance budget.
  expect(model.length).toBeLessThan(2_167_156);
  let triangles = 0;
  for (const mesh of document.meshes) {
    for (const primitive of mesh.primitives) {
      expect(primitive.extensions.KHR_draco_mesh_compression).toBeDefined();
      triangles += document.accessors[primitive.indices].count / 3;
    }
  }
  expect(triangles).toBe(141_252);
  expect(triangles).toBe(manifest.triangles);
  expect(manifest.material_batches).toBe(37);
});

test('flag cloth and star flutter while the pole and stand remain unskinned', () => {
  for (const name of [
    'Flag review / Vietnam red',
    'Flag review / Vietnam yellow',
  ]) {
    expect(
      document.nodes.find(
        (node: { name: string }) => node.name === `Web / ${name}`,
      )!.skin,
    ).toBeDefined();
  }
  expect(
    document.nodes.find(
      (node: { name: string }) =>
        node.name === 'Web / Flag review / dark stand',
    )!.skin,
  ).toBeUndefined();
  const animation = document.animations[0];
  const wave = animation.channels.find(
    (channel: { target: { node: number; path: string } }) =>
      document.nodes[channel.target.node].name === 'FlagWave15' &&
      channel.target.path === 'rotation',
  );
  const rotations = animationValues(animation.samplers[wave!.sampler].output);
  const angles = Array.from({ length: rotations.length / 4 }, (_, frame) => {
    const dot = rotations
      .slice(frame * 4, frame * 4 + 4)
      .reduce((sum, value, axis) => sum + value * rotations[axis], 0);
    return 2 * Math.acos(Math.min(1, Math.abs(dot)));
  });
  expect(Math.max(...angles)).toBeGreaterThan(0.2);
  expect(Math.max(...angles)).toBeLessThan(2.2);
});

test('lower-body batches are skinned and include an occasional heel rock', () => {
  for (const material of ['joggers.001', 'shoe.001', 'sole']) {
    expect(
      document.nodes.find(
        (node: { name: string }) =>
          node.name === `Web / Character review / ${material}`,
      )!.skin,
    ).toBeDefined();
  }
  const clip = document.animations[0];
  const foot = clip.channels.find(
    (channel: { target: { node: number; path: string } }) =>
      document.nodes[channel.target.node].name === 'RightFoot' &&
      channel.target.path === 'rotation',
  );
  const values = animationValues(clip.samplers[foot!.sampler].output);
  const angles = Array.from(
    { length: values.length / 4 },
    (_, frame) =>
      2 *
      Math.acos(
        Math.min(
          1,
          Math.abs(
            values
              .slice(frame * 4, frame * 4 + 4)
              .reduce((sum, value, axis) => sum + value * values[axis], 0),
          ),
        ),
      ),
  );
  expect(Math.max(...angles)).toBeGreaterThan(0.08);
  expect(Math.max(...angles)).toBeLessThan(0.15);
});

test('intro poster has an alpha channel and responsive intrinsic dimensions', () => {
  const poster = readFileSync('src/assets/intro/intro-scene.png');
  expect(poster.readUInt32BE(16)).toBe(1200);
  expect(poster.readUInt32BE(20)).toBe(900);
  expect(poster[25]).toBe(6);
  expect(manifest.poster_bytes).toBe(poster.length);
});

test('the evening desktop fallback includes an opaque room in 1200×900 RGB framing', () => {
  const poster = readFileSync('src/assets/intro/desktop-poster.png');
  expect(poster.readUInt32BE(16)).toBe(1200);
  expect(poster.readUInt32BE(20)).toBe(900);
  expect(poster[25]).toBe(2);
});
