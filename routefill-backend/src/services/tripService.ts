import { Trip, Truck, Location, TripStatusHistory } from '../models';
import { TripStatusEnum } from '../models/Trip';
import { TruckStatusEnum } from '../models/Truck';
import { mlClient } from '../clients/mlClient';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface CreateTripDTO {
  truck_id: number;
  origin_location_id: number;
  destination_location_id: number;
  scheduled_start_time: Date | string;
  estimated_completion_time: Date | string;
}

export interface UpdateTripDTO {
  status?: TripStatusEnum;
  actual_start_time?: Date | string;
  actual_completion_time?: Date | string;
}

/**
 * Service managing line-haul trips, execution lifecycles, and deadhead risk analysis triggers.
 */
export class TripService {
  /**
   * Schedules a new line-haul trip for a truck and marks the vehicle IN_TRANSIT.
   */
  public async createTrip(dto: CreateTripDTO) {
    const truck = await Truck.findByPk(dto.truck_id);
    if (!truck) {
      throw new NotFoundError(`Truck ID ${dto.truck_id} not found`);
    }

    const trip = await Trip.create({
      truck_id: dto.truck_id,
      origin_location_id: dto.origin_location_id,
      destination_location_id: dto.destination_location_id,
      scheduled_start_time: new Date(dto.scheduled_start_time),
      estimated_completion_time: new Date(dto.estimated_completion_time),
      status: TripStatusEnum.SCHEDULED,
    });

    await truck.update({
      status: TruckStatusEnum.IN_TRANSIT,
      current_location_id: dto.origin_location_id,
    });

    await TripStatusHistory.create({
      trip_id: trip.id,
      previous_status: 'NONE',
      new_status: TripStatusEnum.SCHEDULED,
      notes: 'Initial trip creation',
    });

    return this.getTripById(trip.id);
  }

  /**
   * Retrieves line-haul trips with associated origins, destinations, and assigned vehicles.
   */
  public async getTrips(truckId?: number) {
    const where: any = {};
    if (truckId) where.truck_id = truckId;

    return Trip.findAll({
      where,
      include: [
        { model: Truck, as: 'truck' },
        { model: Location, as: 'originLocation' },
        { model: Location, as: 'destinationLocation' },
        { model: TripStatusHistory, as: 'statusHistory' },
      ],
      order: [['id', 'DESC']],
    });
  }

  /**
   * Retrieves single trip record with full associations.
   */
  public async getTripById(id: number) {
    const trip = await Trip.findByPk(id, {
      include: [
        { model: Truck, as: 'truck' },
        { model: Location, as: 'originLocation' },
        { model: Location, as: 'destinationLocation' },
        { model: TripStatusHistory, as: 'statusHistory' },
      ],
    });

    if (!trip) {
      throw new NotFoundError(`Trip with ID ${id} not found`);
    }

    return trip;
  }

  /**
   * Updates trip status and triggers dead-mileage detection upon trip completion.
   */
  public async updateTrip(id: number, dto: UpdateTripDTO) {
    const trip = await this.getTripById(id);
    const oldStatus = trip.status;

    const updatePayload: any = { ...dto };
    if (dto.status === TripStatusEnum.COMPLETED && !dto.actual_completion_time) {
      updatePayload.actual_completion_time = new Date();
    }

    await trip.update(updatePayload);

    if (dto.status && dto.status !== oldStatus) {
      await TripStatusHistory.create({
        trip_id: trip.id,
        previous_status: oldStatus,
        new_status: dto.status,
        notes: `Trip transitioned to ${dto.status}`,
      });
    }

    // Trigger dead-mileage analysis upon trip completion
    let deadMileageRisk = null;
    if (dto.status === TripStatusEnum.COMPLETED) {
      try {
        const dest = trip.destinationLocation;
        const truck = trip.truck;

        if (dest && truck) {
          // Update truck location to the trip's destination
          await truck.update({
            current_location_id: dest.id,
          });

          // Query dead-mileage prediction model
          deadMileageRisk = await mlClient.predictDeadMileage({
            dest_latitude: parseFloat(dest.latitude),
            dest_longitude: parseFloat(dest.longitude),
            completion_hour: new Date().getHours(),
            day_of_week: new Date().getDay(),
            truck_capacity_tons: parseFloat(truck.capacity_tons),
          });

          // If risk is HIGH, mark truck AT_RISK
          const newTruckStatus =
            deadMileageRisk.risk_level === 'HIGH'
              ? TruckStatusEnum.AT_RISK
              : TruckStatusEnum.AVAILABLE;

          await truck.update({ status: newTruckStatus });
          logger.info(`Trip ${id} completed. Truck ${truck.id} assigned status: ${newTruckStatus}`);
        }
      } catch (err: any) {
        logger.error('Error during post-trip dead-mileage evaluation:', err.message);
      }
    }

    const refreshedTrip = await this.getTripById(id);
    return {
      trip: refreshedTrip,
      dead_mileage_analysis: deadMileageRisk,
    };
  }
}

export const tripService = new TripService();
