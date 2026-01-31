import { prisma } from "./prisma";

export type PercentSignalSource = "structured" | "text";

export type PercentFeatures = {
  source: PercentSignalSource;
  percent: number;
  hasList: boolean;
  hasCurrent: boolean;
  hasPrice: boolean;
};

export type PercentModelState = {
  weights: Record<string, number>;
  bias: number;
  samples: number;
};

const MODEL_ID = 1;

const DEFAULT_STATE: PercentModelState = {
  weights: {
    source_structured: 0.4,
    source_text: -0.3,
    has_list: 0.2,
    has_current: 0.2,
    has_price: 0.1,
    percent_value: 0.15,
  },
  bias: -0.35,
  samples: 0,
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export function getPercentConfidenceThreshold(): number {
  const threshold = parseNumber(process.env.PERCENT_ML_THRESHOLD, 0.8);
  return Math.min(0.99, Math.max(0.5, threshold));
}

export function getPercentMatchTolerance(): number {
  const tolerance = parseNumber(process.env.PERCENT_ML_TOLERANCE, 4);
  return Math.min(15, Math.max(1, Math.round(tolerance)));
}

export async function loadPercentModel(): Promise<PercentModelState> {
  const row = await prisma.percentModel.findUnique({ where: { id: MODEL_ID } });
  if (row) {
    return {
      weights: (row.weights as Record<string, number>) || { ...DEFAULT_STATE.weights },
      bias: row.bias ?? DEFAULT_STATE.bias,
      samples: row.samples ?? 0,
    };
  }
  await prisma.percentModel.create({
    data: {
      id: MODEL_ID,
      weights: DEFAULT_STATE.weights,
      bias: DEFAULT_STATE.bias,
      samples: 0,
    },
  });
  return { ...DEFAULT_STATE };
}

export async function savePercentModel(state: PercentModelState): Promise<void> {
  await prisma.percentModel.update({
    where: { id: MODEL_ID },
    data: {
      weights: state.weights,
      bias: state.bias,
      samples: state.samples,
    },
  });
}

export function buildPercentFeatures(features: PercentFeatures): Record<string, number> {
  return {
    source_structured: features.source === "structured" ? 1 : 0,
    source_text: features.source === "text" ? 1 : 0,
    has_list: features.hasList ? 1 : 0,
    has_current: features.hasCurrent ? 1 : 0,
    has_price: features.hasPrice ? 1 : 0,
    percent_value: Math.min(1, Math.max(0, features.percent / 100)),
  };
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

export function predictPercentConfidence(
  state: PercentModelState,
  features: Record<string, number>
): number {
  let score = state.bias;
  for (const [key, value] of Object.entries(features)) {
    score += (state.weights[key] ?? 0) * value;
  }
  return sigmoid(score);
}

export function trainPercentModel(
  state: PercentModelState,
  features: Record<string, number>,
  label: 0 | 1
): PercentModelState {
  const prediction = predictPercentConfidence(state, features);
  const error = label - prediction;
  const lr = 0.08 / Math.sqrt(state.samples + 1);

  for (const [key, value] of Object.entries(features)) {
    state.weights[key] = (state.weights[key] ?? 0) + lr * error * value;
  }
  state.bias += lr * error;
  state.samples += 1;
  return state;
}
