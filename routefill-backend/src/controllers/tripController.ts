import { Request, Response, NextFunction } from 'express';
import { tripService } from '../services/tripService';

/**
 * Controller managing line-haul journey execution, trip progress, and completion analysis.
 */
export class TripController {
  /**
   * Schedules a new line-haul trip for a vehicle.
   */
  public async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trip = await tripService.createTrip(req.body);
      res.status(201).json({
        success: true,
        message: 'Trip scheduled successfully',
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves active or completed trips.
   */
  public async getTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { truck_id } = req.query;
      const trips = await tripService.getTrips(
        truck_id ? parseInt(truck_id as string, 10) : undefined
      );
      res.status(200).json({
        success: true,
        count: trips.length,
        data: trips,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves single trip record by ID.
   */
  public async getTripById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const trip = await tripService.getTripById(id);
      res.status(200).json({
        success: true,
        data: trip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates trip status. Transitions to COMPLETED trigger automated dead-mileage analysis.
   */
  public async updateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await tripService.updateTrip(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Trip updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const tripController = new TripController();
