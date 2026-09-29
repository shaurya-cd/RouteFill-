import { Router } from 'express';
import { Location, TruckType } from '../models';
import { seedDatabase } from '../seeders/seed';
import authRoutes from './authRoutes';
import truckRoutes from './truckRoutes';
import loadRoutes from './loadRoutes';
import tripRoutes from './tripRoutes';
import aiRoutes from './aiRoutes';
import recommendationRoutes from './recommendationRoutes';
import adminRoutes from './adminRoutes';
import notificationRoutes from './notificationRoutes';
import chatRoutes from './chatRoutes';

const apiRouter = Router();

/**
 * Public & Admin Seed Endpoints
 * Populates all standard reference data, Indian hubs, test fleet trucks, and active marketplace loads.
 */
apiRouter.all('/seed', async (req, res) => {
  try {
    const force = req.body?.force === true || req.query?.force === 'true';
    const result = await seedDatabase(force);
    res.status(200).json({
      success: true,
      message: 'RouteFill AI database seeded and verified successfully.',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Database seeding error',
      error: {
        name: err?.name,
        message: err?.message,
        details: err?.original?.message || err?.parent?.message || err?.errors,
        stack: err?.stack,
      },
    });
  }
});

apiRouter.get('/locations', async (req, res, next) => {
  try {
    const locations = await Location.findAll({ order: [['id', 'ASC']] });
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (err) {
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
    const existing = await Location.findOne({
      where: {
        name: locName,
      },
    });

    if (existing) {
      return res.status(200).json({ success: true, data: existing, created: false });
    }

    // Check if another location has almost identical coordinates
    const all = await Location.findAll();
    const closeMatch = all.find(
      (l) => Math.abs(parseFloat(String(l.latitude)) - lat) < 0.02 &&
             Math.abs(parseFloat(String(l.longitude)) - lng) < 0.02
    );

    if (closeMatch) {
      return res.status(200).json({ success: true, data: closeMatch, created: false });
    }

    const created = await Location.create({
      name: locName,
      city: locCity,
      state: locState,
      country: locCountry,
      latitude: lat,
      longitude: lng,
    });

    res.status(201).json({ success: true, data: created, created: true });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/truck-types', async (req, res, next) => {
  try {
    const types = await TruckType.findAll({ order: [['id', 'ASC']] });
    res.status(200).json({ success: true, count: types.length, data: types });
  } catch (err) {
    next(err);
  }
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/trucks', truckRoutes);
apiRouter.use('/loads', loadRoutes);
apiRouter.use('/trips', tripRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/chat', chatRoutes);

export default apiRouter;
