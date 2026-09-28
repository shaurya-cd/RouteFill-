/**
 * RouteFill AI - Centralized Backend & ML Integration API Client
 * Wires routefill-canvas to routefill-backend (Port 5000) and python ML microservice (Port 8000).
 */

const getApiBase = (): string => {
  const raw = (import.meta.env['VITE_API_URL'] as string | undefined)?.trim();
  if (!raw) return 'http://localhost:5000/api';
  
  let formatted = raw;
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://') && !formatted.startsWith('/')) {
    formatted = `https://${formatted}`;
  }
  
  if (!formatted.endsWith('/api')) {
    formatted = `${formatted.replace(/\/+$/, '')}/api`;
  }
  
  return formatted;
};

const API_BASE = getApiBase();

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'FLEET_OWNER' | 'ADMIN' | 'SHIPPER' | 'LOAD_POSTER' | string;
  roles?: string[];
  last_login_at?: string;
  last_logout_at?: string;
}

export interface LocationModel {
  id: number;
  name: string;
  city?: string;
  state: string;
  country?: string;
  latitude: number | string;
  longitude: number | string;
}

export interface TruckTypeModel {
  id: number;
  name: string;
  description?: string;
}

export interface RouteOptionModel {
  route_id: string;
  name: string;
  distance_km: number;
  toll_cost: number;
  fuel_cost: number;
  traffic_level: 'LOW' | 'MODERATE' | 'HIGH';
  estimated_hours: number;
  road_condition: string;
  ai_recommended: boolean;
  verdict: string;
  waypoints: [number, number][];
  why_not_reasons?: string[];
}

export interface SixChecksModel {
  suitability: {
    passed: boolean;
    truck_capacity_tons: number;
    load_weight_tons: number;
    truck_type: string;
    utilization_pct: number;
    summary: string;
  };
  pickup_distance: {
    distance_km: number;
    evaluation: 'EXCELLENT' | 'GOOD' | 'POOR';
    summary: string;
  };
  timing_match: {
    passed: boolean;
    truck_arrival: string;
    pickup_window: string;
    buffer_hours: number;
    summary: string;
  };
  empty_travel_saved: {
    empty_km_avoided: number;
    summary: string;
  };
  financial_net_profit: {
    offered_price: number;
    fuel_cost: number;
    toll_cost: number;
    deadhead_cost: number;
    net_profit: number;
    summary: string;
  };
  historical_ai_learning: {
    past_trips_count: number;
    success_rate_pct: number;
    on_time_rate_pct: number;
    avg_waiting_minutes: number;
    summary: string;
  };
}

export interface FilteredLoadModel {
  load_id: number;
  cargo: string;
  weight_tons: number;
  pickup_city: string;
  dest_city: string;
  reason: string;
  check_failed: string;
}

export interface TruckModel {
  id: number;
  truck_number: string;
  capacity_tons: number | string;
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'AT_RISK' | 'MAINTENANCE' | string;
  truck_type_id: number;
  current_location_id: number;
  truckType?: TruckTypeModel;
  currentLocation?: LocationModel;
  owner?: { id: number; name: string };
  trips?: TripModel[];
}

export interface LoadModel {
  id: number;
  weight_tons: number | string;
  offered_price: number | string;
  cargo_description: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED';
  pickup_location_id: number;
  destination_location_id: number;
  truck_type_id: number;
  pickup_location?: string;
  destination_location?: string;
  pickupLocation?: LocationModel;
  destinationLocation?: LocationModel;
  truckType?: TruckTypeModel;
  poster?: { id: number; name: string; phone?: string };
  pickup_distance_km?: number;
  pickup_start_time?: string;
  pickup_end_time?: string;
}

export interface TripModel {
  id: number;
  truck_id: number;
  origin_location_id: number;
  destination_location_id: number;
  scheduled_start_time?: string;
  actual_start_time?: string;
  estimated_completion_time?: string;
  actual_completion_time?: string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  truck?: TruckModel;
  originLocation?: LocationModel;
  destinationLocation?: LocationModel;
}

export interface DeadMileageRisk {
  dead_mileage_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  predicted_empty_distance_km: number;
  model_version?: string;
}

export interface RecommendationModel {
  id: number;
  truck_id: number;
  load_id: number;
  acceptance_probability: number;
  success_probability: number;
  predicted_profit: number;
  final_score: number;
  composite_score?: number | string;
  deadhead_km?: number | string;
  pickup_distance_km?: number;
  trip_distance_km?: number;
  estimated_profit?: number | string;
  origin_proximity_km?: number | string;
  dest_deviation_km?: number | string;
  rank?: number;
  explanation?: string;
  model_version: string;
  reason: string;
  status?: string;
  six_checks?: SixChecksModel;
  route_options?: RouteOptionModel[];
  load: {
    id: number;
    cargo_description: string;
    weight_tons: number | string;
    offered_price: number | string;
    pickup_location?: string;
    destination_location?: string;
    pickupLocation?: LocationModel;
    destinationLocation?: LocationModel;
    truckType?: TruckTypeModel;
  };
  truck?: TruckModel;
  generated_at?: string;
}

export interface RecommendationResponse {
  truck_id: number;
  dead_mileage_risk?: {
    probability: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    predicted_empty_distance_km: number;
  };
  filtered_loads?: FilteredLoadModel[];
  recommendations: RecommendationModel[];
  message?: string;
}

export interface NotificationModel {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'LOAD_ACCEPTED' | 'ORDER_STATUS' | 'CHAT_MESSAGE' | 'SYSTEM' | string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessageModel {
  id: number;
  load_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  sender?: { id: number; name: string; email: string };
  receiver?: { id: number; name: string; email: string };
}

export interface ActiveOrderModel {
  load_id: number;
  truck_id: number;
  truck_number: string;
  carrier_id: number;
  carrier_name: string;
  poster_id: number;
  status: 'ACCEPTED' | 'EN_ROUTE_PICKUP' | 'IN_TRANSIT' | 'COMPLETED';
  pickup_city: string;
  drop_city: string;
  cargo: string;
  weight_tons: number;
  agreed_price: number;
  predicted_profit?: number;
  recommendation_id?: number;
  accepted_at: string;
}

export interface AnalyticsOverview {
  total_users: number;
  registered_trucks: number;
  active_loads: number;
  completed_trips: number;
}

export interface AiImpactAnalytics {
  total_recommendations_evaluated: number;
  total_profit_generated_inr: number;
  estimated_empty_km_eliminated: number;
  average_acceptance_rate: number;
}

export interface RetrainMetrics {
  model_version: string;
  acceptance_accuracy: number;
  success_accuracy: number;
  profit_mae: number;
  profit_r2: number;
  training_samples?: number;
}

export interface OverviewMetrics {
  total_trucks: number;
  available_trucks: number;
  at_risk_trucks: number;
  active_loads: number;
  active_trips: number;
  recommendations_generated: number;
  recommendations_accepted: number;
  total_dead_mileage_saved_km: number;
  acceptance_rate: number;
}

export interface DeadMileageRiskResponse {
  truck_id: number;
  truck_number: string;
  destination_city: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  inflow_outflow_ratio: number;
  outbound_loads_count: number;
  active_trucks_in_area: number;
  dead_mileage_probability: number;
  reason: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('routefill_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('routefill_token', token);
      } else {
        localStorage.removeItem('routefill_token');
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async ensureToken(): Promise<string | null> {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('routefill_token');
      if (stored) {
        this.token = stored;
        return stored;
      }
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token && !endpoint.includes('/auth/login')) {
      await this.ensureToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        (typeof data?.error === 'object' && data.error?.message) ||
        data?.message ||
        (typeof data?.error === 'string' ? data.error : null) ||
        `HTTP error ${response.status}`;

      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.data = data;

      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('routefill:unauthorized', { detail: { endpoint } }));
      }

      throw error;
    }

    return data;
  }

  // ==========================================
  // [1/8] Authentication APIs
  // ==========================================
  async register(payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }): Promise<{ token: string; user: UserProfile }> {
    const res = await this.request<{ success: boolean; data: { token: string; user: UserProfile } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.data.token);
    return res.data;
  }

  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await this.request<{ success: boolean; data: { token: string; user: UserProfile } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.data.token);
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.request<{ success: boolean; message: string }>('/auth/logout', {
          method: 'POST',
        });
      }
    } catch {
      // Ignore network errors on session termination
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<UserProfile> {
    const res = await this.request<{ success: boolean; data: UserProfile }>('/auth/me');
    return res.data;
  }

  // Locations Catalog & Dynamic Creation
  async getLocations(): Promise<LocationModel[]> {
    const res = await this.request<{ success: boolean; data: LocationModel[] }>('/locations');
    return res.data;
  }

  async createOrResolveLocation(payload: {
    name: string;
    city?: string;
    state?: string;
    country?: string;
    latitude: number;
    longitude: number;
  }): Promise<LocationModel> {
    const res = await this.request<{ success: boolean; data: LocationModel }>('/locations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  // Truck Types Catalog
  async getTruckTypes(): Promise<TruckTypeModel[]> {
    const res = await this.request<{ success: boolean; data: TruckTypeModel[] }>('/truck-types');
    return res.data;
  }

  // ==========================================
  // [2/8] Truck APIs
  // ==========================================
  async getTrucks(): Promise<TruckModel[]> {
    const res = await this.request<{ success: boolean; data: TruckModel[] }>('/trucks');
    return res.data;
  }

  async getTruckById(id: number): Promise<TruckModel> {
    const res = await this.request<{ success: boolean; data: TruckModel }>(`/trucks/${id}`);
    return res.data;
  }

  async createTruck(payload: {
    truck_number: string;
    truck_type_id: number;
    capacity_tons: number;
    current_location_id?: number | undefined;
    origin_location_id?: number | undefined;
    destination_location_id?: number | undefined;
    expected_arrival_time?: string | undefined;
  }): Promise<TruckModel> {
    const res = await this.request<{ success: boolean; data: TruckModel }>('/trucks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async updateTruck(
    id: number,
    payload: {
      truck_number?: string;
      truck_type_id?: number;
      capacity_tons?: number;
      status?: 'AVAILABLE' | 'IN_TRANSIT' | 'AT_RISK' | 'MAINTENANCE' | string;
      current_location_id?: number;
    }
  ): Promise<TruckModel> {
    const res = await this.request<{ success: boolean; data: TruckModel }>(`/trucks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async deleteTruck(id: number): Promise<void> {
    await this.request<{ success: boolean; message: string }>(`/trucks/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // [3/8] Load APIs & Geo-Search
  // ==========================================
  async getLoads(): Promise<LoadModel[]> {
    const res = await this.request<{ success: boolean; data: LoadModel[] }>('/loads');
    return res.data;
  }

  async createLoad(payload: {
    pickup_location_id: number;
    destination_location_id: number;
    truck_type_id: number;
    weight_tons: number;
    cargo_description: string;
    offered_price: number;
    pickup_start_time?: string;
    pickup_end_time?: string;
  }): Promise<LoadModel> {
    const now = new Date();
    const res = await this.request<{ success: boolean; data: LoadModel }>('/loads', {
      method: 'POST',
      body: JSON.stringify({
        pickup_start_time: now.toISOString(),
        pickup_end_time: new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
        ...payload,
      }),
    });
    return res.data;
  }

  async getNearbyLoads(latitude: number, longitude: number, radiusKm = 300): Promise<LoadModel[]> {
    const res = await this.request<{ success: boolean; data: LoadModel[] }>(
      `/loads/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}`
    );
    return res.data;
  }

  // ==========================================
  // [4/8] Line-Haul Trip Lifecycle
  // ==========================================
  async getTrips(): Promise<TripModel[]> {
    const res = await this.request<{ success: boolean; data: TripModel[] }>('/trips');
    return res.data;
  }

  async createTrip(payload: {
    truck_id: number;
    origin_location_id: number;
    destination_location_id: number;
    scheduled_start_time?: string;
    estimated_completion_time?: string;
  }): Promise<TripModel> {
    const res = await this.request<{ success: boolean; data: TripModel }>('/trips', {
      method: 'POST',
      body: JSON.stringify({
        scheduled_start_time: new Date().toISOString(),
        estimated_completion_time: new Date(Date.now() + 86400000).toISOString(),
        ...payload,
      }),
    });
    return res.data;
  }

  async completeTrip(
    tripId: number
  ): Promise<{ trip: TripModel; dead_mileage_analysis: DeadMileageRisk }> {
    const res = await this.request<{
      success: boolean;
      data: { trip: TripModel; dead_mileage_analysis: DeadMileageRisk };
    }>(`/trips/${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'COMPLETED',
        actual_completion_time: new Date().toISOString(),
      }),
    });
    return res.data;
  }

  // ==========================================
  // [5/8] Direct Dead Mileage AI Prediction
  // ==========================================
  async predictDeadMileage(truckId: number): Promise<DeadMileageRisk> {
    const res = await this.request<{ success: boolean; data: DeadMileageRisk }>('/ai/dead-mileage/predict', {
      method: 'POST',
      body: JSON.stringify({ truck_id: truckId }),
    });
    return res.data;
  }

  // ==========================================
  // [6/8] 5-Stage ML Recommendation Pipeline
  // ==========================================
  async generateRecommendations(truckId: number): Promise<RecommendationResponse> {
    const res = await this.request<{ success: boolean; data: RecommendationResponse }>(
      `/recommendations/generate/${truckId}`,
      { method: 'POST' }
    );
    return res.data;
  }

  // ==========================================
  // [7/8] Real-World Feedback Loop
  // ==========================================
  async recordOutcome(
    recommendationId: number,
    payload: {
      was_accepted?: boolean;
      was_completed?: boolean;
      actual_profit: number;
      actual_fuel_cost?: number;
      actual_toll_cost?: number;
      actual_waiting_time_minutes?: number;
      actual_distance_km?: number;
      completion_delay_minutes?: number;
    }
  ): Promise<{ message: string; outcome: any }> {
    const res = await this.request<{ success: boolean; data: { message: string; outcome: any } }>(
      `/recommendations/${recommendationId}/outcome`,
      {
        method: 'POST',
        body: JSON.stringify({
          was_accepted: true,
          was_completed: true,
          ...payload,
        }),
      }
    );
    return res.data;
  }

  // ==========================================
  // [8/8] Admin Continuous Retraining & Analytics
  // ==========================================
  async getAnalytics(): Promise<{
    overview: AnalyticsOverview;
    ai_impact: AiImpactAnalytics;
    recent_outcomes: any[];
  }> {
    const res = await this.request<{
      success: boolean;
      data: { overview: AnalyticsOverview; ai_impact: AiImpactAnalytics; recent_outcomes: any[] };
    }>('/admin/analytics');
    return res.data;
  }

  async triggerRetraining(): Promise<{ status: string; message: string; metrics: RetrainMetrics }> {
    const res = await this.request<{
      success: boolean;
      data: { status: string; message: string; metrics: RetrainMetrics };
    }>('/admin/ml/retrain', { method: 'POST' });
    return res.data;
  }

  // ==========================================
  // [9/9] Notifications, Chat & Load Acceptance
  // ==========================================
  async acceptLoad(loadId: number, payload: { truck_id: number; recommendation_id?: number }): Promise<{
    success: boolean;
    message: string;
    data: {
      load: LoadModel;
      truck: TruckModel;
    };
  }> {
    return this.request(`/loads/${loadId}/accept`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getNotifications(): Promise<{ success: boolean; unread_count: number; data: NotificationModel[] }> {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.request('/notifications/read-all', { method: 'PATCH' });
  }

  async getChatMessages(loadId: number): Promise<ChatMessageModel[]> {
    const res = await this.request<{ success: boolean; data: ChatMessageModel[] }>(`/chat/${loadId}`);
    return res.data;
  }

  async sendChatMessage(loadId: number, payload: { receiver_id: number; message: string }): Promise<ChatMessageModel> {
    const res = await this.request<{ success: boolean; data: ChatMessageModel }>(`/chat/${loadId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }
}

export const api = new ApiClient();
