export const MODEL = '@cf/mistralai/mistral-small-3.1-24b-instruct';

// Cloudflare Workers AI pricing, checked on 2026-11-18.
const inputNeuronsPerMillion = 31876;
const outputNeuronsPerMillion = 50488;
const responseDeadlineMs = 9000;

export function readUsage(usage) {
  if (!Number.isSafeInteger(usage?.prompt_tokens) || usage.prompt_tokens < 0 ||
      !Number.isSafeInteger(usage.completion_tokens) || usage.completion_tokens < 0) return null;
  return {
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    neurons: Number.isFinite(usage.neurons) && usage.neurons >= 0 ? usage.neurons : null,
  };
}

export function estimateUsage(usage) {
  const counts = readUsage(usage);
  if (!counts) return null;
  const { inputTokens, outputTokens, neurons } = counts;
  const estimatedNeurons = (inputTokens * inputNeuronsPerMillion + outputTokens * outputNeuronsPerMillion) / 1e6;
  return {
    inputTokens, outputTokens, reportedNeurons: neurons, estimatedNeurons,
    theoreticalRequestsPer10000: estimatedNeurons ? Math.floor(10000 / estimatedNeurons) : null,
    pricingChecked: '2026-11-18',
    note: 'Estimation du modèle seul, pas un solde de compte ni une facture. Quota partagé avec les autres usages.',
  };
}

export async function runModel(ai, system, query, schema, deadlineMs = responseDeadlineMs) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Model response deadline exceeded')), deadlineMs);
  });
  try {
    return await Promise.race([
      ai.run(MODEL, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: query },
        ],
        guided_json: schema,
        max_tokens: 220,
        temperature: 0,
      }),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function readResponse(result) {
  const value = result?.response;
  return typeof value === 'string' ? JSON.parse(value) : value;
}
