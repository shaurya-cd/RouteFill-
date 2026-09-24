"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const truckRoutes_1 = __importDefault(require("./truckRoutes"));
const loadRoutes_1 = __importDefault(require("./loadRoutes"));
const tripRoutes_1 = __importDefault(require("./tripRoutes"));
const aiRoutes_1 = __importDefault(require("./aiRoutes"));
const recommendationRoutes_1 = __importDefault(require("./recommendationRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const chatRoutes_1 = __importDefault(require("./chatRoutes"));
const apiRouter = (0, express_1.Router)();
apiRouter.get('/locations', async (req, res, next) => {
    try {
        const locations = await models_1.Location.findAll({ order: [['id', 'ASC']] });
        res.status(200).json({ success: true, count: locations.length, data: locations });
    }
    catch (err) {
        next(err);
    }
});
apiRouter.post('/locations', async (req, res, next) => {
    try {
        const { name, city, state, country, latitude, longitude } = req.body;
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
            return res.status(400).json({ success: false, message: 'Invalid latitude. Must be between -90 and 90.' });
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ success: false, message: 'Invalid longitude. Must be between -180 and 180.' });
        }
        if (!name && !city) {
            return res.status(400).json({ success: false, message: 'Location name or city is required.' });
        }
        const locName = (name || city || 'Verified Hub').trim();
        const locCity = (city || locName.split(',')[0] || 'Unknown').trim();
        const locState = (state || 'India').trim();
        const locCountry = (country || 'India').trim();
        // Check if an existing location matches by exact name or very close coordinates (~2km)
        const existing = await models_1.Location.findOne({
            where: {
                name: locName,
            },
        });
        if (existing) {
            return res.status(200).json({ success: true, data: existing, created: false });
        }
        // Check if another location has almost identical coordinates
        const all = await models_1.Location.findAll();
        const closeMatch = all.find((l) => Math.abs(parseFloat(String(l.latitude)) - lat) < 0.02 &&
            Math.abs(parseFloat(String(l.longitude)) - lng) < 0.02);
        if (closeMatch) {
            return res.status(200).json({ success: true, data: closeMatch, created: false });
        }
        const created = await models_1.Location.create({
            name: locName,
            city: locCity,
            state: locState,
            country: locCountry,
            latitude: lat,
            longitude: lng,
        });
        res.status(201).json({ success: true, data: created, created: true });
    }
    catch (err) {
        next(err);
    }
});
apiRouter.get('/truck-types', async (req, res, next) => {
    try {
        const types = await models_1.TruckType.findAll({ order: [['id', 'ASC']] });
        res.status(200).json({ success: true, count: types.length, data: types });
    }
    catch (err) {
        next(err);
    }
});
apiRouter.use('/auth', authRoutes_1.default);
apiRouter.use('/trucks', truckRoutes_1.default);
apiRouter.use('/loads', loadRoutes_1.default);
apiRouter.use('/trips', tripRoutes_1.default);
apiRouter.use('/ai', aiRoutes_1.default);
apiRouter.use('/recommendations', recommendationRoutes_1.default);
apiRouter.use('/admin', adminRoutes_1.default);
apiRouter.use('/notifications', notificationRoutes_1.default);
apiRouter.use('/chat', chatRoutes_1.default);
exports.default = apiRouter;
