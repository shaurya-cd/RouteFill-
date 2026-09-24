"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlClient = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
/**
 * HTTP client communicating with the external Python FastAPI AI/ML microservice.
 */
class MLClient {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: env_1.ENV.ML_SERVICE_URL,
            timeout: env_1.ENV.ML_SERVICE_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Dispatches dead mileage prediction parameters to the Python ML model.
     */
    async predictDeadMileage(tripFeatures) {
        try {
            const response = await this.client.post('/predict/dead-mileage', tripFeatures);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('MLClient predictDeadMileage failed:', error.message);
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
    async scoreCandidates(truck, candidateLoads, ownerHistory = {}) {
        try {
            const response = await this.client.post('/predict/recommendation-scores', {
                truck,
                candidate_loads: candidateLoads,
                owner_history: ownerHistory,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('MLClient scoreCandidates failed:', error.message);
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
    async triggerRetraining(outcomes) {
        try {
            const response = await this.client.post('/train', { outcomes });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('MLClient triggerRetraining failed:', error.message);
            throw new Error(`ML retraining failed: ${error.message}`);
        }
    }
    /**
     * Checks heartbeat status of the Python ML engine.
     */
    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        }
        catch (error) {
            return { status: 'UNAVAILABLE', error: error.message };
        }
    }
}
exports.mlClient = new MLClient();
