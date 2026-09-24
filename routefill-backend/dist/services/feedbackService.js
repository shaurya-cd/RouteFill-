"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackService = exports.FeedbackService = void 0;
const models_1 = require("../models");
const Recommendation_1 = require("../models/Recommendation");
const Load_1 = require("../models/Load");
const Truck_1 = require("../models/Truck");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
/**
 * Service managing the real-world feedback loop, updating operational outcomes
 * and populating historical data essential for ongoing ML model retraining.
 */
class FeedbackService {
    /**
     * Records the real-world result of an AI recommendation so future model
     * training can learn from accepted, rejected, successful, and unsuccessful decisions.
     */
    async recordRecommendationOutcome(recommendationId, dto) {
        const recommendation = await models_1.Recommendation.findByPk(recommendationId, {
            include: [
                { model: models_1.Load, as: 'load' },
                { model: models_1.Truck, as: 'truck' },
            ],
        });
        if (!recommendation) {
            throw new errors_1.NotFoundError(`Recommendation ${recommendationId} not found`);
        }
        // 1. Update recommendation status based on acceptance
        const newStatus = dto.was_accepted
            ? Recommendation_1.RecommendationStatusEnum.ACCEPTED
            : Recommendation_1.RecommendationStatusEnum.REJECTED;
        await recommendation.update({ status: newStatus });
        // 2. If accepted, reserve/assign the load to the truck
        if (dto.was_accepted && recommendation.load) {
            await recommendation.load.update({
                status: dto.was_completed ? Load_1.LoadStatusEnum.COMPLETED : Load_1.LoadStatusEnum.ASSIGNED,
                assigned_truck_id: recommendation.truck_id,
            });
            if (dto.was_completed && recommendation.truck) {
                await recommendation.truck.update({
                    status: Truck_1.TruckStatusEnum.AVAILABLE,
                });
            }
        }
        // 3. Create or update the RecommendationOutcome row
        let outcome = await models_1.RecommendationOutcome.findOne({
            where: { recommendation_id: recommendationId },
        });
        if (outcome) {
            await outcome.update({
                was_accepted: dto.was_accepted,
                was_completed: dto.was_completed ?? outcome.was_completed,
                actual_profit: dto.actual_profit ?? outcome.actual_profit,
                actual_fuel_cost: dto.actual_fuel_cost ?? outcome.actual_fuel_cost,
                actual_toll_cost: dto.actual_toll_cost ?? outcome.actual_toll_cost,
                actual_waiting_time_minutes: dto.actual_waiting_time_minutes ?? outcome.actual_waiting_time_minutes,
                actual_distance_km: dto.actual_distance_km ?? outcome.actual_distance_km,
                completion_delay_minutes: dto.completion_delay_minutes ?? outcome.completion_delay_minutes,
            });
        }
        else {
            outcome = await models_1.RecommendationOutcome.create({
                recommendation_id: recommendationId,
                was_accepted: dto.was_accepted,
                was_completed: dto.was_completed ?? false,
                actual_profit: dto.actual_profit || null,
                actual_fuel_cost: dto.actual_fuel_cost || null,
                actual_toll_cost: dto.actual_toll_cost || null,
                actual_waiting_time_minutes: dto.actual_waiting_time_minutes || null,
                actual_distance_km: dto.actual_distance_km || null,
                completion_delay_minutes: dto.completion_delay_minutes || 0,
            });
        }
        logger_1.logger.info(`Recorded outcome for recommendation ${recommendationId}: Accepted=${dto.was_accepted}, Completed=${dto.was_completed}`);
        return {
            recommendation,
            outcome,
            message: 'Outcome successfully recorded in historical training dataset',
        };
    }
}
exports.FeedbackService = FeedbackService;
exports.feedbackService = new FeedbackService();
