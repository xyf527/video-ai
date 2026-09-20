export type HealthResponse = {
  status: string;
  service: string;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/health`);
  if (!response.ok) {
    throw new Error(`Health request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<HealthResponse>;
}
