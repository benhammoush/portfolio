/**
 * Preserve existing hosting/routing/configuration checks while consuming the shared tested artifact.
 * @file
 */
import { deliver } from './delivery.mjs';

Object.assign(process.env, {
  SOURCE_SHA: process.env.CI_SOURCE_SHA,
  DELIVERY_TARGET: process.env.CI_ENVIRONMENT,
  CI_CANDIDATE_ROOT: '.',
});
await deliver();
