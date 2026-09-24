import { Request, Response, NextFunction } from 'express';
import { Truck, Trip, Location } from '../models';
import { mlClient } from '../clients/mlClient';
import { NotFoundError, BadRequestError } from '../utils/errors';

/**
 * Controller exposing direct machine learning prediction interfaces.
 */
export class AIController {
  /**
   * Uses historical trip patterns, location, timing, and return-load availability
   * to predict the probability that a truck will travel empty after completing its current trip.
   */
  public async predictDeadMileageRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { truck_id, trip_id } = req.body;

      if (!truck_id && !trip_id) {
        throw new BadRequestError('Either truck_id or trip_id must be provided');
      }

      let truck: any = null;
      let destLat = 19.0760;
      let destLon = 72.8777;

      if (trip_id) {
        const trip = await Trip.findByPk(trip_id, {
          include: [
            { model: Truck, as: 'truck' },
            { model: Location, as: 'destinationLocation' },
          ],
        });
        if (!trip) throw new NotFoundError(`Trip ${trip_id} not found`);
        truck = trip.truck;
        if (trip.destinationLocation) {
          destLat = parseFloat(trip.destinationLocation.latitude);
          destLon = parseFloat(trip.destinationLocation.longitude);
        }
      } else if (truck_id) {
        truck = await Truck.findByPk(truck_id, {
          include: [{ model: Location, as: 'currentLocation' }],
        });
        if (!truck) throw new NotFoundError(`Truck ${truck_id} not found`);
        if (truck.currentLocation) {
          destLat = parseFloat(truck.currentLocation.latitude);
          destLon = parseFloat(truck.currentLocation.longitude);
        }
      }

      const prediction = await mlClient.predictDeadMileage({
        dest_latitude: destLat,
        dest_longitude: destLon,
        completion_hour: new Date().getHours(),
        day_of_week: new Date().getDay(),
        truck_capacity_tons: truck ? parseFloat(truck.capacity_tons) : 10.0,
      });

      res.status(200).json({
        success: true,
        data: {
          truck_id: truck ? truck.id : null,
          truck_number: truck ? truck.truck_number : null,
          ...prediction,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
