// Connection/ownership verification only. This module never enables ad delivery.
export function validateAdSenseConnection(config) {
  if (!config || typeof config !== 'object') throw new Error('Configuration AdSense absente.');
  const { publisherId, verificationEnabled } = config;
  if (typeof publisherId !== 'string' || typeof verificationEnabled !== 'boolean')
    throw new Error('AdSense : publisherId doit être une chaîne et verificationEnabled un booléen.');
  if (publisherId && (!/^ca-pub-\d{16}$/.test(publisherId) || /^ca-pub-0{16}$/.test(publisherId) || publisherId === 'ca-pub-1234567890123456'))
    throw new Error('AdSense : utilisez le véritable identifiant ca-pub du compte, pas un exemple.');
  if (verificationEnabled && !publisherId)
    throw new Error('AdSense : identifiant éditeur requis avant la vérification du site.');
  return { publisherId, verificationEnabled, connectedForReview: verificationEnabled && Boolean(publisherId) };
}

export function adSenseAdsTxt(config) {
  const connection = validateAdSenseConnection(config);
  return connection.connectedForReview
    ? `google.com, ${connection.publisherId.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`
    : null;
}

export function adSenseVerificationPaths(config) {
  return adSenseAdsTxt(config) ? [{ params: { adsenseFile: 'ads' } }] : [];
}

export function adSenseAdsTxtResponse(config) {
  const body = adSenseAdsTxt(config);
  return body
    ? new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    : new Response(null, { status: 404 });
}
