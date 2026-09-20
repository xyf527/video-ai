const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export type HealthResponse = {
  status: string;
  service: string;
};

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`, { signal });

  if (!response.ok) {
    throw new Error(`Health request failed (${response.status})`);
  }

  return response.json() as Promise<HealthResponse>;
}
