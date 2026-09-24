import { Truck, TruckType, Location, User, Trip } from '../models';
import { TruckStatusEnum } from '../models/Truck';
import { TripStatusEnum } from '../models/Trip';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';

export interface CreateTruckDTO {
  truck_number: string;
  truck_type_id: number;
  capacity_tons: number;
  current_location_id?: number;
  origin_location_id?: number;
  destination_location_id?: number;
  expected_arrival_time?: string;
}

export interface UpdateTruckDTO {
  truck_number?: string;
  truck_type_id?: number;
  status?: TruckStatusEnum;
  capacity_tons?: number;
  current_location_id?: number;
}

/**
 * Service managing truck fleet registration, owner scoping, and vehicle telemetry state.
 */
export class TruckService {
  /**
   * Creates a truck belonging to the authenticated truck owner
   * and validates truck type, capacity, and registration number uniqueness.
   */
  public async createTruck(ownerId: number, dto: CreateTruckDTO) {
    const existing = await Truck.findOne({ where: { truck_number: dto.truck_number } });
    if (existing) {
      throw new ConflictError(`Truck with registration number ${dto.truck_number} is already registered`);
    }

    const typeExists = await TruckType.findByPk(dto.truck_type_id);
    if (!typeExists) {
      throw new NotFoundError(`Truck type ID ${dto.truck_type_id} does not exist`);
    }

    if (dto.current_location_id) {
      const loc = await Location.findByPk(dto.current_location_id);
      if (!loc) {
        throw new NotFoundError(`Location ID ${dto.current_location_id} does not exist`);
      }
    }

    const hasActiveTrip = !!(dto.origin_location_id && dto.destination_location_id);

    const truck = await Truck.create({
      owner_id: ownerId,
      truck_number: dto.truck_number,
      truck_type_id: dto.truck_type_id,
      capacity_tons: dto.capacity_tons,
      current_location_id: dto.destination_location_id || dto.current_location_id || null,
      status: hasActiveTrip ? TruckStatusEnum.IN_TRANSIT : TruckStatusEnum.AVAILABLE,
    });

    // If current trip details provided, schedule the active line-haul trip
    if (hasActiveTrip) {
      const arrival = dto.expected_arrival_time
        ? new Date(dto.expected_arrival_time)
        : new Date(Date.now() + 24 * 3600 * 1000);

      await Trip.create({
        truck_id: truck.id,
        origin_location_id: dto.origin_location_id!,
        destination_location_id: dto.destination_location_id!,
        scheduled_start_time: new Date(),
        actual_start_time: new Date(),
        estimated_completion_time: arrival,
        status: TripStatusEnum.IN_TRANSIT,
      });
    }

    return this.getTruckById(truck.id);
  }

  /**
   * Retrieves registered fleet trucks with populated associations and active trips.
   * If ownerId is specified, filters by that owner; otherwise retrieves all fleet trucks.
   */
  public async getTrucks(ownerId?: number, status?: TruckStatusEnum) {
    const where: any = {};
    if (ownerId) {
      where.owner_id = ownerId;
    }
    if (status) {
      where.status = status;
    }
    return Truck.findAll({
      where,
      include: [
        { model: TruckType, as: 'truckType', attributes: ['id', 'name', 'description'] },
        { model: Location, as: 'currentLocation', attributes: ['id', 'name', 'city', 'state', 'latitude', 'longitude'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: Trip,
          as: 'trips',
          required: false,
          include: [
            { model: Location, as: 'originLocation', attributes: ['id', 'name', 'city', 'state'] },
            { model: Location, as: 'destinationLocation', attributes: ['id', 'name', 'city', 'state'] },
          ],
        },
      ],
      order: [
        ['id', 'DESC'],
        [{ model: Trip, as: 'trips' }, 'id', 'DESC'],
      ],
    });
  }

  /**
   * Retrieves only trucks belonging to the authenticated owner.
   */
  public async getOwnerTrucks(ownerId: number) {
    return this.getTrucks(ownerId);
  }

  /**
   * Retrieves a single truck record with populated associations and active trip.
   */
  public async getTruckById(id: number, ownerId?: number) {
    const truck = await Truck.findByPk(id, {
      include: [
        { model: TruckType, as: 'truckType', attributes: ['id', 'name', 'description'] },
        { model: Location, as: 'currentLocation', attributes: ['id', 'name', 'city', 'state', 'latitude', 'longitude'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: Trip,
          as: 'trips',
          required: false,
          include: [
            { model: Location, as: 'originLocation', attributes: ['id', 'name', 'city', 'state'] },
            { model: Location, as: 'destinationLocation', attributes: ['id', 'name', 'city', 'state'] },
          ],
        },
      ],
      order: [[{ model: Trip, as: 'trips' }, 'id', 'DESC']],
    });

    if (!truck) {
      throw new NotFoundError(`Truck with ID ${id} not found`);
    }

    if (ownerId && truck.owner_id !== ownerId) {
      throw new ForbiddenError('Unauthorized: You do not own this vehicle');
    }

    return truck;
  }

  /**
   * Modifies truck operational status or capacity after confirming owner permissions.
   */
  public async updateTruck(id: number, ownerId: number | undefined, dto: UpdateTruckDTO) {
    const truck = await this.getTruckById(id, ownerId);
    await truck.update(dto);
    return this.getTruckById(id);
  }

  /**
   * Removes a vehicle record from the owner's active fleet.
   */
  public async deleteTruck(id: number, ownerId: number | undefined) {
    const truck = await this.getTruckById(id, ownerId);
    await truck.destroy();
    return { success: true, message: `Truck ${truck.truck_number} deleted successfully` };
  }
}

export const truckService = new TruckService();
