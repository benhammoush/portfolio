/**
 * Local lazy Draco decoding for the single cached introduction model.
 * @packageDocumentation
 */
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import decoderJs from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url';
import decoderWasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url';
import { prepareScene, reportSceneDownload } from './scene-loading';

// This module belongs to the optional engine chunk. Do not preload the decoder:
// narrow/reduced-motion visitors should download only the approved poster.
const decoder = new DRACOLoader()
  .setDecoderPath({ js: decoderJs, wasm: decoderWasm })
  .setWorkerLimit(1);
const configured = new WeakSet<GLTFLoader>();

/**
 * Attach the shared decoder before useLoader begins the model request.
 * @param loader - The URL-cached introduction loader, never a second asset loader.
 */
export function configureIntroLoader(loader: GLTFLoader) {
  if (configured.has(loader)) return;
  configured.add(loader);
  loader.setDRACOLoader(decoder);
  const load = loader.load.bind(loader);
  /**
   * Release the dedicated decoder even if React unmounted during loading. Success
   * means all mesh tasks completed; a terminal error abandons this unusable asset
   * and its remaining tasks. The sticky HTML fallback requires reload to retry.
   * @param url - The single introduction URL for this page session.
   * @param onLoad - Resolve the cached model after successful parsing.
   * @param onProgress - Preserve the loader's optional progress callback.
   * @param onError - Reject into the existing poster/error boundary.
   */
  loader.load = (url, onLoad, onProgress, onError) => {
    load(
      url,
      (model) => {
        decoder.dispose();
        prepareScene();
        onLoad(model);
      },
      (event) => {
        reportSceneDownload(
          event.loaded,
          event.lengthComputable ? event.total : 0,
        );
        onProgress?.(event);
      },
      (error) => {
        decoder.dispose();
        onError?.(error);
      },
    );
  };
}
