"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadController = exports.LoadController = void 0;
const loadService_1 = require("../services/loadService");
/**
 * Controller handling load posting, marketplace querying, and geospatial proximity matching.
 */
class LoadController {
    /**
     * Posts a new load shipment to the marketplace.
     */
    async createLoad(req, res, next) {
        try {
            const posterId = req.user.id;
            const load = await loadService_1.loadService.createLoad(posterId, req.body);
            res.status(201).json({
                success: true,
                message: 'Load posted successfully',
                data: load,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves marketplace loads filtered by status or poster.
     * - ADMIN: sees all loads across the platform
     * - TRUCK_OWNER: sees available return loads ready for pickup
     * - LOAD_POSTER: sees their own posted loads and available marketplace loads
     */
    async getLoads(req, res, next) {
        try {
            const { status, poster_id, limit } = req.query;
            let effectiveStatus = status;
            let effectivePosterId = poster_id ? parseInt(poster_id, 10) : undefined;
            if (req.user) {
                const isAdmin = req.user.roles.includes('ADMIN');
                const isOwner = req.user.roles.includes('TRUCK_OWNER') || req.user.roles.includes('FLEET_OWNER');
                const isShipper = req.user.roles.includes('LOAD_POSTER') || req.user.roles.includes('SHIPPER');
                if (isAdmin) {
                    // Admin can see all loads and statuses
                    effectiveStatus = status || undefined;
                }
                else if (isOwner) {
                    // Fleet owner sees available loads to return/profit
                    effectiveStatus = status || 'AVAILABLE';
                }
                else if (isShipper) {
                    // If specific poster requested or default to shipper's view
                    if (!effectivePosterId && !status) {
                        // Can see all open loads or their own
                    }
                }
            }
            const loads = await loadService_1.loadService.getLoads({
                status: effectiveStatus,
                posterId: effectivePosterId,
                limit: limit ? parseInt(limit, 10) : undefined,
            });
            res.status(200).json({
                success: true,
                count: loads.length,
                data: loads,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves specific load by ID.
     */
    async getLoadById(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const load = await loadService_1.loadService.getLoadById(id);
            res.status(200).json({
                success: true,
                data: load,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Finds currently available loads whose pickup locations fall within the requested geographical radius.
     */
    async findNearbyLoads(req, res, next) {
        try {
            const { latitude, longitude, radius } = req.query;
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            const radiusKm = radius ? parseFloat(radius) : 150;
            const loads = await loadService_1.loadService.findNearbyLoads(lat, lon, radiusKm);
            res.status(200).json({
                success: true,
                count: loads.length,
                radius_km: radiusKm,
                data: loads,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates an existing load's status or details.
     */
    async updateLoad(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const posterId = req.user.id;
            const isAdmin = req.user?.roles.includes('ADMIN') || false;
            const updated = await loadService_1.loadService.updateLoad(id, posterId, req.body, isAdmin);
            res.status(200).json({
                success: true,
                message: 'Load updated successfully',
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Accepts a load for an active carrier truck.
     */
    async acceptLoad(req, res, next) {
        try {
            const loadId = parseInt(req.params.id, 10);
            const { truck_id, truckId: altTruckId, recommendation_id } = req.body;
            const targetTruckId = truck_id || altTruckId;
            if (!targetTruckId) {
                res.status(400).json({ success: false, message: 'truck_id is required' });
                return;
            }
            const carrierUser = req.user || { id: 2, name: 'Shaurya Transport' };
            const result = await loadService_1.loadService.acceptLoad(loadId, carrierUser, parseInt(targetTruckId, 10), recommendation_id ? parseInt(recommendation_id, 10) : undefined);
            res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deletes or cancels a posted load.
     */
    async deleteLoad(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const posterId = req.user.id;
            const isAdmin = req.user?.roles.includes('ADMIN') || false;
            const result = await loadService_1.loadService.deleteLoad(id, posterId, isAdmin);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LoadController = LoadController;
exports.loadController = new LoadController();
