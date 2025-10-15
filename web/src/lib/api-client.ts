// API Response types based on your controllers
interface ApiResponse<T> {
  message: string;
  data: T;
}

// Error response from your backend
interface ApiErrorResponse {
  error: string;
}

export type { ApiResponse, ApiErrorResponse };

// Custom error class that matches your backend errors
export class ApiError extends Error {
  status: number;
  error: string;

  constructor(error: string, status: number) {
    super(error);
    this.name = "ApiError";
    this.status = status;
    this.error = error;
  }
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL) {
    this.baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,

        credentials: "include", // Send cookies automatically
      });

      const data = await response.json();

      // Handle error responses based on your controller pattern
      if (!response.ok) {
        throw new ApiError(
          data.error || "Something went wrong",
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or parsing errors
      throw new ApiError(
        error instanceof Error ? error.message : "Network error",
        0
      );
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.makeRequest<T>(url, { method: "GET" });
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create API client instance
export const api = new ApiClient();
