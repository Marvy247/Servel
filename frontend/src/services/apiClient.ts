const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/dashboard';

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  details?: string
  timestamp: string
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async get<T>(path: string = ''): Promise<ApiResponse<T>> {
    // Handle empty path case and normalize slashes
    const cleanPath = path ? path.replace(/^\/|\/$/g, '') : '';
    let fullUrl = this.baseUrl;
    if (cleanPath) {
      fullUrl = `${this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl}/${cleanPath}`;
    }
    console.log('API Request:', fullUrl);


    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async post<T>(path: string = '', body: any): Promise<ApiResponse<T>> {
    // Handle empty path case and normalize slashes
    const cleanPath = path ? path.replace(/^\/|\/$/g, '') : '';
    let fullUrl = this.baseUrl;
    if (cleanPath) {
      fullUrl = `${this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl}/${cleanPath}`;
    }
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
}

const apiClient = new ApiClient();

export default apiClient;
