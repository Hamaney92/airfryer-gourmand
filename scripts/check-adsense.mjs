import { readFileSync } from 'node:fs';
import { validateAdSenseConnection } from '../src/lib/adsense-connection.mjs';

const config = JSON.parse(readFileSync(new URL('../src/config/adsense.json', import.meta.url), 'utf8'));
const connection = validateAdSenseConnection(config);
console.log(JSON.stringify({
  connection: connection.connectedForReview ? 'verification_configured_not_approval' : 'pending_publisher_and_verification',
  publisherConfigured: Boolean(connection.publisherId),
  adDelivery: 'not_enabled',
  siteApproval: 'must_be_verified_in_adsense',
  certifiedCmp: 'must_be_configured_and_verified_before_ad_delivery',
  nextAction: connection.connectedForReview
    ? 'Verify live meta tag and ads.txt, then the site review status in Google AdSense.'
    : 'Supply the real public ca-pub ID and verify ownership of the AdSense account before enabling site verification.'
}, null, 2));
if (process.argv.includes('--require-publisher') && !connection.connectedForReview) process.exitCode = 1;
