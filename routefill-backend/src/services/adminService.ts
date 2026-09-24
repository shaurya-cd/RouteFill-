import { User, Truck, Load, Trip, Recommendation, RecommendationOutcome } from '../models';
import { mlClient } from '../clients/mlClient';
import { logger } from '../utils/logger';

/**
 * Service managing administrative controls, platform analytics, and ML model retraining.
 */
export class AdminService {
  /**
   * Extracts historical recommendation outcomes from PostgreSQL and triggers
   * continuous retraining on the Python AI/ML microservice.
   */
  public async retrainModels() {
    // Retrieve historical outcomes with associated loads
    const outcomes = await RecommendationOutcome.findAll({
      include: [
        {
          model: Recommendation,
          as: 'recommendation',
          include: [{ model: Load, as: 'load' }],
        },
      ],
    });

    const formattedData = outcomes.map((o: any) => ({
      recommendation_id: o.recommendation_id,
      was_accepted: o.was_accepted,
      was_completed: o.was_completed,
      actual_profit: o.actual_profit,
      actual_fuel_cost: o.actual_fuel_cost,
      actual_toll_cost: o.actual_toll_cost,
      actual_waiting_time_minutes: o.actual_waiting_time_minutes,
      actual_distance_km: o.actual_distance_km,
      completion_delay_minutes: o.completion_delay_minutes,
      offered_revenue: o.recommendation?.load?.offered_price,
    }));

    logger.info(`Dispatching ${formattedData.length} outcome records to Python ML training engine...`);
    const trainingResult = await mlClient.triggerRetraining(formattedData);
    return trainingResult;
  }

  /**
   * Compiles executive platform health statistics and environmental efficiency gains.
   */
  public async getPlatformAnalytics() {
    const [userCount, truckCount, loadCount, tripCount, outcomeStats] = await Promise.all([
      User.count(),
      Truck.count(),
      Load.count(),
      Trip.count(),
      RecommendationOutcome.findAll({
        attributes: ['was_accepted', 'was_completed', 'actual_profit', 'actual_distance_km'],
      }),
    ]);

    const totalAccepted = outcomeStats.filter((o) => o.was_accepted).length;
    const totalCompleted = outcomeStats.filter((o) => o.was_completed).length;
    const totalProfitGenerated = outcomeStats.reduce(
      (sum, o) => sum + (parseFloat(o.actual_profit as any) || 0),
      0
    );
    const totalEmptyKmSaved = outcomeStats
      .filter((o) => o.was_completed)
      .reduce((sum, o) => sum + (parseFloat(o.actual_distance_km as any) || 0), 0);

    return {
      overview: {
        total_users: userCount,
        registered_trucks: truckCount,
        total_loads_posted: loadCount,
        trips_managed: tripCount,
      },
      ai_impact: {
        total_recommendations_evaluated: outcomeStats.length,
        total_accepted_loads: totalAccepted,
        acceptance_rate:
          outcomeStats.length > 0
            ? Math.round((totalAccepted / outcomeStats.length) * 1000) / 10
            : 0,
        trips_completed: totalCompleted,
        total_profit_generated_inr: Math.round(totalProfitGenerated),
        estimated_empty_km_eliminated: Math.round(totalEmptyKmSaved),
      },
    };
  }

  /**
   * Lists registered system users and their active role configurations.
   */
  public async getAllUsers() {
    return User.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ association: 'roles', attributes: ['name', 'description'] }],
      order: [['id', 'DESC']],
    });
  }
}

export const adminService = new AdminService();
