/**
 * Check the generated static model/poster contract without loading a GPU renderer.
 * @packageDocumentation
 */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const model = readFileSync('src/assets/intro/intro-scene.glb');
const jsonLength = model.readUInt32LE(12);
const document = JSON.parse(
  model.subarray(20, 20 + jsonLength).toString('utf8'),
);
const manifest = JSON.parse(
  readFileSync('src/assets/intro/intro-scene.json', 'utf8'),
);

test('intro GLB is self-contained and contains no animation, camera or lights', () => {
  expect(model.toString('ascii', 0, 4)).toBe('glTF');
  expect(model.readUInt32LE(4)).toBe(2);
  expect(model.readUInt32LE(8)).toBe(model.length);
  expect(manifest.glb_bytes).toBe(model.length);
  expect(document.animations ?? []).toHaveLength(0);
  expect(document.cameras ?? []).toHaveLength(0);
  expect(document.extensions?.KHR_lights_punctual).toBeUndefined();
  expect(
    document.buffers.every((buffer: { uri?: string }) => !buffer.uri),
  ).toBe(true);
  expect(document.images ?? []).toHaveLength(0);
  expect(manifest.external_assets).toEqual([]);
  expect(manifest.source_review).toBe('review-06');
  expect(document.meshes).toHaveLength(manifest.material_batches);
  const names = document.meshes.map((mesh: { name: string }) => mesh.name);
  for (const material of [
    'shirt',
    'trousers',
    'chair',
    'flask',
    'wood',
    'leaf',
  ]) {
    expect(names).toContain(`Web / ${material}`);
  }
  for (const name of ['shirt', 'trousers', 'chair']) {
    const material = document.materials.find(
      (entry: { name: string }) => entry.name === `Web / ${name}`,
    );
    expect(
      material.pbrMetallicRoughness.baseColorFactor
        .slice(0, 3)
        .every((channel: number) => channel < 0.03),
    ).toBe(true);
    for (const channel of material.extensions.KHR_materials_sheen
      .sheenColorFactor) {
      expect(channel).toBeCloseTo(0.03, 5);
    }
  }
});

test('intro poster has an alpha channel and responsive intrinsic dimensions', () => {
  const poster = readFileSync('src/assets/intro/intro-scene.png');
  expect(poster.readUInt32BE(16)).toBe(1200);
  expect(poster.readUInt32BE(20)).toBe(900);
  expect(poster[25]).toBe(6);
  expect(manifest.poster_bytes).toBe(poster.length);
});
