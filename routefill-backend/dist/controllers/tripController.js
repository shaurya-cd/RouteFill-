"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripController = exports.TripController = void 0;
const tripService_1 = require("../services/tripService");
/**
 * Controller managing line-haul journey execution, trip progress, and completion analysis.
 */
class TripController {
    /**
     * Schedules a new line-haul trip for a vehicle.
     */
    async createTrip(req, res, next) {
        try {
            const trip = await tripService_1.tripService.createTrip(req.body);
            res.status(201).json({
                success: true,
                message: 'Trip scheduled successfully',
                data: trip,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves active or completed trips.
     */
    async getTrips(req, res, next) {
        try {
            const { truck_id } = req.query;
            const trips = await tripService_1.tripService.getTrips(truck_id ? parseInt(truck_id, 10) : undefined);
            res.status(200).json({
                success: true,
                count: trips.length,
                data: trips,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Retrieves single trip record by ID.
     */
    async getTripById(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const trip = await tripService_1.tripService.getTripById(id);
            res.status(200).json({
                success: true,
                data: trip,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Updates trip status. Transitions to COMPLETED trigger automated dead-mileage analysis.
     */
    async updateTrip(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const result = await tripService_1.tripService.updateTrip(id, req.body);
            res.status(200).json({
                success: true,
                message: 'Trip updated successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TripController = TripController;
exports.tripController = new TripController();
