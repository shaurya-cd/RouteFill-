"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationController = exports.RecommendationController = void 0;
const recommendationService_1 = require("../services/recommendationService");
const feedbackService_1 = require("../services/feedbackService");
/**
 * Controller orchestrating recommendation generation and real-world feedback recording.
 */
class RecommendationController {
    /**
     * Generates ranked AI return-load recommendations for a vehicle facing deadhead risk.
     */
    async generateRecommendations(req, res, next) {
        try {
            const truckId = parseInt(req.params.truckId, 10);
            const result = await recommendationService_1.recommendationService.generateRecommendationsForTruck(truckId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves previous recommendations generated for a given truck.
     */
    async getRecommendationsForTruck(req, res, next) {
        try {
            const truckId = parseInt(req.params.truckId, 10);
            const recommendations = await recommendationService_1.recommendationService.getRecommendationsForTruck(truckId);
            res.status(200).json({
                success: true,
                count: recommendations.length,
                data: recommendations,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves a single recommendation by ID.
     */
    async getRecommendationById(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const rec = await recommendationService_1.recommendationService.getRecommendationById(id);
            res.status(200).json({
                success: true,
                data: rec,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Records the real-world operational result of an AI recommendation
     * to continuously enrich the historical training dataset.
     */
    async recordOutcome(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const result = await feedbackService_1.feedbackService.recordRecommendationOutcome(id, req.body);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RecommendationController = RecommendationController;
exports.recommendationController = new RecommendationController();
