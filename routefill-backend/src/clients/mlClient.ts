import axios, { AxiosInstance } from 'axios';
import { ENV } from '../config/env';
import { logger } from '../utils/logger';

/**
 * HTTP client communicating with the external Python FastAPI AI/ML microservice.
 */
class MLClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.ML_SERVICE_URL,
      timeout: ENV.ML_SERVICE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Dispatches dead mileage prediction parameters to the Python ML model.
   */
  public async predictDeadMileage(tripFeatures: {
    dest_latitude: number;
    dest_longitude: number;
    completion_hour?: number;
    day_of_week?: number;
    nearby_available_loads_count?: number;
    historical_corridor_empty_rate?: number;
    historical_avg_empty_km?: number;
    truck_capacity_tons?: number;
  }): Promise<{
    dead_mileage_probability: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    predicted_empty_distance_km: number;
    model_version: string;
  }> {
    try {
      const response = await this.client.post('/predict/dead-mileage', tripFeatures);
      return response.data;
    } catch (error: any) {
      logger.error('MLClient predictDeadMileage failed:', error.message);
      // Fallback heuristic if ML microservice is momentarily unreachable
      return {
        dead_mileage_probability: 0.65,
        risk_level: 'MEDIUM',
        predicted_empty_distance_km: 300,
        model_version: 'fallback-heuristic',
      };
    }
  }

  /**
   * Dispatches truck specifications and filtered candidate loads to Python ML for batch evaluation.
   */
  public async scoreCandidates(
    truck: any,
    candidateLoads: any[],
    ownerHistory: any = {}
  ): Promise<{
    model_version: string;
    scores: Array<{
      load_id: number;
      acceptance_probability: number;
      success_probability: number;
      predicted_profit: number;
      features: any;
    }>;
  }> {
    try {
      const response = await this.client.post('/predict/recommendation-scores', {
        truck,
        candidate_loads: candidateLoads,
        owner_history: ownerHistory,
      });
      return response.data;
    } catch (error: any) {
      logger.error('MLClient scoreCandidates failed:', error.message);
      // Fallback heuristic scoring
      return {
        model_version: 'fallback-heuristic',
        scores: candidateLoads.map((load) => ({
          load_id: load.id,
          acceptance_probability: 0.85,
          success_probability: 0.9,
          predicted_profit: Number(load.offered_price) * 0.55,
          features: {},
        })),
      };
    }
  }

  /**
   * Triggers background retraining on the Python service with exported historical outcomes.
   */
  public async triggerRetraining(outcomes?: any[]): Promise<any> {
    try {
      const response = await this.client.post('/train', { outcomes });
      return response.data;
    } catch (error: any) {
      logger.error('MLClient triggerRetraining failed:', error.message);
      throw new Error(`ML retraining failed: ${error.message}`);
    }
  }

  /**
   * Checks heartbeat status of the Python ML engine.
   */
  public async checkHealth(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error: any) {
      return { status: 'UNAVAILABLE', error: error.message };
    }
  }
}

export const mlClient = new MLClient();
