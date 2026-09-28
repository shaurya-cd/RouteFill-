import { Request, Response, NextFunction } from 'express';
import { truckService } from '../services/truckService';
import { User } from '../models';

/**
 * Controller managing fleet vehicle registration, lifecycle statuses, and owner scoping.
 */
export class TruckController {
  /**
   * Creates a truck belonging to the authenticated truck owner (or default fleet owner in guest/demo mode)
   * and validates truck type, capacity, and registration number uniqueness.
   */
  public async createTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let ownerId = req.user?.id;
      if (!ownerId) {
        const defaultOwner = await User.findOne({ where: { email: 'owner@fleet.in' } });
        ownerId = defaultOwner ? defaultOwner.id : 2;
      }
      const truck = await truckService.createTruck(ownerId, req.body);
      res.status(201).json({
        success: true,
        message: 'Truck registered successfully',
        data: truck,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves platform fleet trucks.
   * - ADMIN: can see all trucks
   * - TRUCK_OWNER: can see ONLY their own trucks (not other owners' trucks)
   * - LOAD_POSTER (Shipper): can see available trucks capable of hauling loads
   * - Guest: defaults to full fleet for demonstration
   */
  public async getTrucks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scope = req.query.scope as string | undefined;
      let ownerId: number | undefined = undefined;
      let status: any = undefined;

      if (req.user) {
        const isAdmin = req.user.roles.includes('ADMIN');
        const isOwner = req.user.roles.includes('TRUCK_OWNER') || req.user.roles.includes('FLEET_OWNER');
        const isShipper = req.user.roles.includes('LOAD_POSTER') || req.user.roles.includes('SHIPPER');

        if (isAdmin) {
          // Admin can see all trucks and loads
          ownerId = undefined;
        } else if (isOwner) {
          // Fleet owner can see only their own trucks
          ownerId = req.user.id;
        } else if (isShipper) {
          // Shipper can see nearest / available trucks on the map
          status = req.query.status as any || undefined;
        }
      } else if (scope === 'owner') {
        ownerId = 2; // Default demo owner
      }

      const trucks = await truckService.getTrucks(ownerId, status);
      res.status(200).json({
        success: true,
        count: trucks.length,
        data: trucks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves only trucks belonging to the authenticated owner
   */
  public async getOwnerTrucks(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.getTrucks(req, res, next);
  }

  /**
   * Retrieves single truck details scoped to the owner or platform admin.
   */
  public async getTruckById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const ownerId = req.user ? (req.user.roles.includes('ADMIN') ? undefined : req.user.id) : undefined;
      const truck = await truckService.getTruckById(id, ownerId);
      res.status(200).json({
        success: true,
        data: truck,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates operational status or technical attributes of an owner's vehicle.
   */
  public async updateTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const isAdmin = req.user?.roles.includes('ADMIN');
      const ownerId = isAdmin ? undefined : req.user?.id;
      const updated = await truckService.updateTruck(id, ownerId, req.body);
      res.status(200).json({
        success: true,
        message: 'Truck updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a vehicle from the authenticated owner's active fleet.
   */
  public async deleteTruck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const isAdmin = req.user?.roles.includes('ADMIN');
      const ownerId = isAdmin ? undefined : req.user?.id;
      const result = await truckService.deleteTruck(id, ownerId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const truckController = new TruckController();
