import { Op } from 'sequelize';
import { Load, Location, TruckType, User, Truck } from '../models';
import { LoadStatusEnum } from '../models/Load';
import { TruckStatusEnum } from '../models/Truck';
import { haversineDistance } from '../utils/geo';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { notificationService } from './notificationService';
import { NotificationTypeEnum } from '../models/Notification';

export interface CreateLoadDTO {
  pickup_location_id: number;
  destination_location_id: number;
  truck_type_id: number;
  weight_tons: number;
  cargo_description: string;
  offered_price: number;
  pickup_start_time: Date | string;
  pickup_end_time: Date | string;
}

export interface UpdateLoadDTO {
  status?: LoadStatusEnum;
  offered_price?: number;
  assigned_truck_id?: number | null;
}

/**
 * Service managing freight marketplace loads, geospatial pickup clustering, and status transitions.
 */
export class LoadService {
  /**
   * Posts a new load shipment from a verified shipper, broker, or transporter.
   */
  public async createLoad(posterId: number, dto: CreateLoadDTO) {
    const pickupLoc = await Location.findByPk(dto.pickup_location_id);
    if (!pickupLoc) {
      throw new NotFoundError(`Pickup location ID ${dto.pickup_location_id} not found`);
    }

    const dropLoc = await Location.findByPk(dto.destination_location_id);
    if (!dropLoc) {
      throw new NotFoundError(`Destination location ID ${dto.destination_location_id} not found`);
    }

    const truckType = await TruckType.findByPk(dto.truck_type_id);
    if (!truckType) {
      throw new NotFoundError(`Truck type ID ${dto.truck_type_id} not found`);
    }

    const load = await Load.create({
      poster_id: posterId,
      pickup_location_id: dto.pickup_location_id,
      destination_location_id: dto.destination_location_id,
      truck_type_id: dto.truck_type_id,
      weight_tons: dto.weight_tons,
      cargo_description: dto.cargo_description,
      offered_price: dto.offered_price,
      pickup_start_time: new Date(dto.pickup_start_time),
      pickup_end_time: new Date(dto.pickup_end_time),
      status: LoadStatusEnum.AVAILABLE,
    });

    return this.getLoadById(load.id);
  }

  /**
   * Retrieves open marketplace loads supporting filters by status, truck type, or poster.
   */
  public async getLoads(filter: { status?: LoadStatusEnum; posterId?: number; limit?: number }) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.posterId) where.poster_id = filter.posterId;

    return Load.findAll({
      where,
      include: [
        { model: Location, as: 'pickupLocation' },
        { model: Location, as: 'destinationLocation' },
        { model: TruckType, as: 'truckType' },
        { model: User, as: 'poster', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Truck, as: 'assignedTruck' },
      ],
      limit: filter.limit || 50,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Retrieves details for a specific freight load.
   */
  public async getLoadById(id: number) {
    const load = await Load.findByPk(id, {
      include: [
        { model: Location, as: 'pickupLocation' },
        { model: Location, as: 'destinationLocation' },
        { model: TruckType, as: 'truckType' },
        { model: User, as: 'poster', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Truck, as: 'assignedTruck' },
      ],
    });

    if (!load) {
      throw new NotFoundError(`Load with ID ${id} not found`);
    }

    return load;
  }

  /**
   * Finds currently available loads whose pickup locations fall within the requested geographical radius.
   * Uses spherical trigonometry (Haversine formula) to filter candidate locations.
   */
  public async findNearbyLoads(latitude: number, longitude: number, radiusKm = 150) {
    const availableLoads = await Load.findAll({
      where: { status: LoadStatusEnum.AVAILABLE },
      include: [
        { model: Location, as: 'pickupLocation' },
        { model: Location, as: 'destinationLocation' },
        { model: TruckType, as: 'truckType' },
      ],
    });

    const nearby = availableLoads
      .map((load: any) => {
        const pickup = load.pickupLocation;
        if (!pickup) return null;

        const distance = haversineDistance(
          latitude,
          longitude,
          parseFloat(pickup.latitude),
          parseFloat(pickup.longitude)
        );

        if (distance <= radiusKm) {
          const raw = load.toJSON();
          return {
            ...raw,
            distance_from_query_km: distance,
          };
        }
        return null;
      })
      .filter((item) => item !== null)
      .sort((a, b) => (a?.distance_from_query_km || 0) - (b?.distance_from_query_km || 0));

    return nearby;
  }

  /**
   * Updates an existing load's status, offered price, or assigned vehicle.
   */
  public async updateLoad(id: number, posterId: number, dto: UpdateLoadDTO, isAdmin = false) {
    const load = await this.getLoadById(id);
    if (!isAdmin && load.poster_id !== posterId) {
      throw new ForbiddenError('Unauthorized: You can only edit loads you posted');
    }

    await load.update(dto);
    return this.getLoadById(id);
  }

  /**
   * Accepts a load for a specific truck and notifies the shipper.
   */
  public async acceptLoad(loadId: number, carrierUser: any, truckId: number, recommendationId?: number) {
    const load = await this.getLoadById(loadId);
    if (load.status !== LoadStatusEnum.AVAILABLE) {
      throw new ForbiddenError(`Load #${loadId} is not available for booking (current status: ${load.status})`);
    }

    const truck = await Truck.findByPk(truckId, {
      include: [{ model: User, as: 'owner' }],
    });
    if (!truck) {
      throw new NotFoundError(`Truck ID ${truckId} not found`);
    }

    const isAdmin = Array.isArray(carrierUser.roles) && carrierUser.roles.includes('ADMIN');
    if (!isAdmin && truck.owner_id !== carrierUser.id) {
      throw new ForbiddenError('Unauthorized: You can only assign loads to trucks belonging to your fleet');
    }

    // Update load status to ASSIGNED and assign truck
    await load.update({
      status: LoadStatusEnum.ASSIGNED,
      assigned_truck_id: truck.id,
    });

    // Update truck status to IN_TRANSIT
    await truck.update({
      status: TruckStatusEnum.IN_TRANSIT,
    });

    const pickupCity = load.pickupLocation?.city || load.pickupLocation?.name || 'Pickup';
    const dropCity = load.destinationLocation?.city || load.destinationLocation?.name || 'Destination';

    // Dispatch notification to the Shipper (poster_id)
    await notificationService.createNotification({
      userId: load.poster_id,
      title: 'Load Accepted!',
      message: `${truck.truck_number} (${carrierUser.name}) accepted your freight shipment (${pickupCity} → ${dropCity}, ${load.weight_tons}T, ₹${Number(load.offered_price).toLocaleString('en-IN')}).`,
      type: NotificationTypeEnum.LOAD_ACCEPTED,
      data: {
        load_id: load.id,
        truck_id: truck.id,
        truck_number: truck.truck_number,
        carrier_id: carrierUser.id,
        carrier_name: carrierUser.name,
        recommendation_id: recommendationId || null,
        status: 'ASSIGNED',
        offered_price: load.offered_price,
        pickup_city: pickupCity,
        drop_city: dropCity,
      },
    });

    return {
      load: await this.getLoadById(loadId),
      truck,
      message: `Load #${loadId} accepted by ${truck.truck_number}`,
    };
  }

  /**
   * Cancels or removes an active load posting.
   */
  public async deleteLoad(id: number, posterId: number, isAdmin = false) {
    const load = await this.getLoadById(id);
    if (!isAdmin && load.poster_id !== posterId) {
      throw new ForbiddenError('Unauthorized: You can only delete loads you posted');
    }

    await load.destroy();
    return { success: true, message: `Load ${id} cancelled successfully` };
  }
}

export const loadService = new LoadService();
