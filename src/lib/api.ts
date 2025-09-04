const API_BASE_URL = 'https://localhost:7213';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  FullName: string;
  UserName: string;
  Email: string;
  Password: string;
  ConfirmPassword: string;
  Role: string;  // or specific enum strings
}

export interface GoogleAuthRequest {
  token: string;
  userType?: string;
}

export interface Organization {
  id: number;
  name: string;
  description: string;
  location: string;
  telephone: string;
  email: string;
  openTime: string;
  closeTime: string;
  organizationType: 'Shop' | 'Clinic' | 'Shelter';
  imageUrl?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  weight: number;
  count: number;
  productCategoryId: number;
  animalId: number;
  imageUrl?: string; // Changed from imageUrl to image to match API response
  shopId: number; // Added shopId field
}

export interface Pet {
  id: number;
  name: string;
  description: string;
  location: string;
  birthDate: string;
  breedId: string;
  gender: 'male' | 'female';
  imageUrl?: string;
isActive: boolean
}

export interface Service {
  id: number;
  name: string;
}

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  if (Array.isArray(headers)) {
    return headers.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }
  return headers;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const originalHeaders = normalizeHeaders(options.headers);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...originalHeaders,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        // Try to parse backend error as JSON
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.message) errorMsg = parsed.message;
        } catch {
          // errorText is not JSON, use as is
          errorMsg = errorText;
        }
        // Throw error with backend message
        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<any> {
    return this.request('/api/Account/Login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async register(data: RegisterRequest): Promise<any> {
    return this.request('/api/Account/Register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async googleLogin(data: GoogleAuthRequest): Promise<any> {
    return this.request('/api/Account/GoogleLogin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async googleRegister(data: GoogleAuthRequest): Promise<any> {
    return this.request('/api/Account/GoogleRegister', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<any> {
    return this.request('/api/Account/Logout', {
      method: 'GET',
    });
  }

  // Organization endpoints
  async getAllOrganizations(): Promise<Organization[]> {
    return this.request('/api/Organization/getAll');
  }

  async getOrganizationsByType(type: 'Shop' | 'Clinic' | 'Shelter'): Promise<Organization[]> {
    return this.request(`/api/Organization/getAllByOrganizationType?organizationType=${type}`);
  }

  async getOrganizationById(id: number): Promise<Organization> {
    return this.request(`/api/Organization/getBy${id}`);
  }

  async getMyOrganization(): Promise<Organization> {
    return this.request('/api/Organization/me');
  }

  // Product endpoints
  async getAllProducts(): Promise<Product[]> {
    return this.request('/api/Product/getAll');
  }

  async getProductById(id: number): Promise<Product> {
    return this.request(`/api/Product/getBy${id}`);
  }

  // Pet endpoints
  async getAllPets(): Promise<Pet[]> {
    return this.request('/api/Pet/getAll');
  }

  async getPetById(id: number): Promise<Pet> {
    return this.request(`/api/Pet/getBy${id}`);
  }

  async getMyPets(): Promise<Pet[]> {
    return this.request('/api/Pet/me');
  }

  // Service endpoints
  async getAllServices(): Promise<Service[]> {
    return this.request('/api/Service/GetAll');
  }

  async getServiceById(id: number): Promise<Service> {
    return this.request(`/api/Service/GetBy/${id}`);
  }

  // HomeSlider endpoints
  async getAllSliders(): Promise<any[]> {
    return this.request('/api/HomeSlider/GetAll');
  }

  async getSliderById(id: number): Promise<any> {
    return this.request(`/api/HomeSlider/GetBy/${id}`);
  }

  // Shelter endpoints
  async createShelter(data: any): Promise<any> {
    // If you need to send FormData (for image upload), use this:
    // const formData = new FormData();
    // formData.append("Name", data.name);
    // formData.append("Description", data.description);
    // formData.append("Location", data.location);
    // formData.append("Telephone", data.telephone);
    // formData.append("Email", data.email);
    // formData.append("OpenTime", data.openTime);
    // formData.append("CloseTime", data.closeTime);
    // formData.append("OrganizationType", "Shelter");
    // if (data.imgFile) formData.append("ImgFile", data.imgFile);

    // return this.request('/api/Organization/Add', {
    //   method: 'POST',
    //   body: formData,
    //   headers: {}, // Let browser set Content-Type for FormData
    // });

    // If no image upload, send JSON:
    return this.request('/api/Organization/Add', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        organizationType: "Shelter",
      }),
    });
  }

  // Additional Auth endpoints
  async forgetPassword(email: string): Promise<any> {
    return this.request('/api/Account/ForgetPassword', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
