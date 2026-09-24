import { Request, Response, NextFunction } from 'express';
import { recommendationService } from '../services/recommendationService';
import { feedbackService } from '../services/feedbackService';

/**
 * Controller orchestrating recommendation generation and real-world feedback recording.
 */
export class RecommendationController {
  /**
   * Generates ranked AI return-load recommendations for a vehicle facing deadhead risk.
   */
  public async generateRecommendations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const truckId = parseInt(req.params.truckId, 10);
      const result = await recommendationService.generateRecommendationsForTruck(truckId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves previous recommendations generated for a given truck.
   */
  public async getRecommendationsForTruck(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const truckId = parseInt(req.params.truckId, 10);
      const recommendations = await recommendationService.getRecommendationsForTruck(truckId);
      res.status(200).json({
        success: true,
        count: recommendations.length,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a single recommendation by ID.
   */
  public async getRecommendationById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const rec = await recommendationService.getRecommendationById(id);
      res.status(200).json({
        success: true,
        data: rec,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Records the real-world operational result of an AI recommendation
   * to continuously enrich the historical training dataset.
   */
  public async recordOutcome(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await feedbackService.recordRecommendationOutcome(id, req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const recommendationController = new RecommendationController();
