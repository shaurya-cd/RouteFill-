import { Recommendation, RecommendationOutcome, Load, Truck } from '../models';
import { RecommendationStatusEnum } from '../models/Recommendation';
import { LoadStatusEnum } from '../models/Load';
import { TruckStatusEnum } from '../models/Truck';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface RecordOutcomeDTO {
  was_accepted: boolean;
  was_completed?: boolean;
  actual_profit?: number;
  actual_fuel_cost?: number;
  actual_toll_cost?: number;
  actual_waiting_time_minutes?: number;
  actual_distance_km?: number;
  completion_delay_minutes?: number;
}

/**
 * Service managing the real-world feedback loop, updating operational outcomes
 * and populating historical data essential for ongoing ML model retraining.
 */
export class FeedbackService {
  /**
   * Records the real-world result of an AI recommendation so future model
   * training can learn from accepted, rejected, successful, and unsuccessful decisions.
   */
  public async recordRecommendationOutcome(
    recommendationId: number,
    dto: RecordOutcomeDTO
  ) {
    const recommendation = await Recommendation.findByPk(recommendationId, {
      include: [
        { model: Load, as: 'load' },
        { model: Truck, as: 'truck' },
      ],
    });

    if (!recommendation) {
      throw new NotFoundError(`Recommendation ${recommendationId} not found`);
    }

    // 1. Update recommendation status based on acceptance
    const newStatus = dto.was_accepted
      ? RecommendationStatusEnum.ACCEPTED
      : RecommendationStatusEnum.REJECTED;

    await recommendation.update({ status: newStatus });

    // 2. If accepted, reserve/assign the load to the truck
    if (dto.was_accepted && recommendation.load) {
      await recommendation.load.update({
        status: dto.was_completed ? LoadStatusEnum.COMPLETED : LoadStatusEnum.ASSIGNED,
        assigned_truck_id: recommendation.truck_id,
      });

      if (dto.was_completed && recommendation.truck) {
        await recommendation.truck.update({
          status: TruckStatusEnum.AVAILABLE,
        });
      }
    }

    // 3. Create or update the RecommendationOutcome row
    let outcome = await RecommendationOutcome.findOne({
      where: { recommendation_id: recommendationId },
    });

    if (outcome) {
      await outcome.update({
        was_accepted: dto.was_accepted,
        was_completed: dto.was_completed ?? outcome.was_completed,
        actual_profit: dto.actual_profit ?? outcome.actual_profit,
        actual_fuel_cost: dto.actual_fuel_cost ?? outcome.actual_fuel_cost,
        actual_toll_cost: dto.actual_toll_cost ?? outcome.actual_toll_cost,
        actual_waiting_time_minutes:
          dto.actual_waiting_time_minutes ?? outcome.actual_waiting_time_minutes,
        actual_distance_km: dto.actual_distance_km ?? outcome.actual_distance_km,
        completion_delay_minutes:
          dto.completion_delay_minutes ?? outcome.completion_delay_minutes,
      });
    } else {
      outcome = await RecommendationOutcome.create({
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

    logger.info(
      `Recorded outcome for recommendation ${recommendationId}: Accepted=${dto.was_accepted}, Completed=${dto.was_completed}`
    );

    return {
      recommendation,
      outcome,
      message: 'Outcome successfully recorded in historical training dataset',
    };
  }
}

export const feedbackService = new FeedbackService();
