import type { APIRoute } from 'astro';
import config from '../config/adsense.json';
import { adSenseVerificationPaths, adSenseAdsTxtResponse } from '../lib/adsense-connection.mjs';

// No ads.txt route is emitted while the real publisher ID is unknown.
export function getStaticPaths() {
  return adSenseVerificationPaths(config);
}

export const GET: APIRoute = () => adSenseAdsTxtResponse(config);
