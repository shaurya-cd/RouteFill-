import bcrypt from 'bcryptjs';
import { sequelize, setupAssociations } from '../models';
import { User } from '../models/User';
import { Role, UserRoleEnum } from '../models/Role';
import { UserRole } from '../models/UserRole';
import { TruckType, TruckTypeEnum } from '../models/TruckType';
import { Truck, TruckStatusEnum } from '../models/Truck';
import { Location } from '../models/Location';
import { Trip, TripStatusEnum } from '../models/Trip';
import { Load, LoadStatusEnum } from '../models/Load';
import { Recommendation, RecommendationStatusEnum } from '../models/Recommendation';
import { RecommendationOutcome } from '../models/RecommendationOutcome';
import { logger } from '../utils/logger';

/**
 * Seeds comprehensive initial reference and historical training data into PostgreSQL.
 */
export async function seedDatabase() {
  try {
    logger.info('Starting RouteFill AI database seeding...');
    await sequelize.authenticate();
    setupAssociations();
    await sequelize.sync({ force: true }); // Clean slate for initial seed
    logger.info('Clean database tables synchronized.');

    // 1. Seed Roles
    const roles = await Role.bulkCreate([
      { name: UserRoleEnum.ADMIN, description: 'Platform Administrator with system oversight' },
      { name: UserRoleEnum.TRUCK_OWNER, description: 'Fleet owner or single-truck operator' },
      { name: UserRoleEnum.LOAD_POSTER, description: 'Shipper, broker, or logistics enterprise' },
    ], { returning: true });
    const adminRole = roles.find((r) => r.name === UserRoleEnum.ADMIN)!;
    const ownerRole = roles.find((r) => r.name === UserRoleEnum.TRUCK_OWNER)!;
    const posterRole = roles.find((r) => r.name === UserRoleEnum.LOAD_POSTER)!;

    // 2. Seed Truck Types
    const truckTypes = await TruckType.bulkCreate([
      { name: TruckTypeEnum.OPEN_TRUCK, description: 'Open body standard cargo truck' },
      { name: TruckTypeEnum.CONTAINER, description: 'Enclosed weatherproof container body' },
      { name: TruckTypeEnum.TANKER, description: 'Liquid/gas tanker vehicle' },
      { name: TruckTypeEnum.REFRIGERATED, description: 'Temperature-controlled reefer vehicle' },
    ], { returning: true });
    const openType = truckTypes.find((t) => t.name === TruckTypeEnum.OPEN_TRUCK)!;
    const containerType = truckTypes.find((t) => t.name === TruckTypeEnum.CONTAINER)!;
    const reeferType = truckTypes.find((t) => t.name === TruckTypeEnum.REFRIGERATED)!;

    // 3. Seed Standard Indian Logistics Hub Locations
    const locations = await Location.bulkCreate([
      { name: 'Mumbai Nhava Sheva Hub', city: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
      { name: 'Delhi Sanjay Gandhi Transport Nagar', city: 'Delhi', state: 'Delhi', country: 'India', latitude: 28.7041, longitude: 77.1025 },
      { name: 'Bengaluru Electronic City Cargo', city: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
      { name: 'Jaipur VKIA Industrial Area', city: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873 },
      { name: 'Ahmedabad Changodar Freight Center', city: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714 },
      { name: 'Indore Dewas Naka Terminal', city: 'Indore', state: 'Madhya Pradesh', country: 'India', latitude: 22.7196, longitude: 75.8577 },
      { name: 'Surat Ring Road Textile Hub', city: 'Surat', state: 'Gujarat', country: 'India', latitude: 21.1702, longitude: 72.8311 },
      { name: 'Nagpur Multi-modal Logistics Park', city: 'Nagpur', state: 'Maharashtra', country: 'India', latitude: 21.1458, longitude: 79.0882 },
      { name: 'Pune Bhosari MIDC Terminal', city: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567 },
      { name: 'Hyderabad Auto Nagar Hub', city: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867 },
      { name: 'Chennai Port Freight Complex', city: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707 },
      { name: 'Kolkata Dankuni Transport Terminal', city: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639 },
    ], { returning: true });

    const locMap = new Map(locations.map((l) => [l.city, l.id]));

    // 4. Seed Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@routefill.ai',
      phone: '+919876543210',
      password_hash: passwordHash,
      is_active: true,
    });
    await UserRole.create({ user_id: adminUser.id, role_id: adminRole.id });

    // Shaurya Transport (Truck Owner from prompt)
    const fleetOwner1 = await User.create({
      name: 'Shaurya Transport (Delhi)',
      email: 'owner@fleet.in', // Keep owner@fleet.in as primary login
      phone: '+919822012345',
      password_hash: passwordHash,
      is_active: true,
    });
    await UserRole.create({ user_id: fleetOwner1.id, role_id: ownerRole.id });

    const fleetOwner2 = await User.create({
      name: 'Sunil Pawar (Pawar Logistics)',
      email: 'pawar@fleet.in',
      phone: '+919822098765',
      password_hash: passwordHash,
      is_active: true,
    });
    await UserRole.create({ user_id: fleetOwner2.id, role_id: ownerRole.id });

    // Load Posters
    const loadPoster1 = await User.create({
      name: 'Priya Sharma (Apex Cargo Brokers)',
      email: 'shipper@cargo.in',
      phone: '+919811099887',
      password_hash: passwordHash,
      is_active: true,
    });
    await UserRole.create({ user_id: loadPoster1.id, role_id: posterRole.id });

    const loadPoster2 = await User.create({
      name: 'Anil Mehta (Gujarat Freight Lines)',
      email: 'mehta@freight.in',
      phone: '+919811044556',
      password_hash: passwordHash,
      is_active: true,
    });
    await UserRole.create({ user_id: loadPoster2.id, role_id: posterRole.id });

    // 5. Seed Trucks
    const trucks = await Truck.bulkCreate([
      {
        owner_id: fleetOwner1.id,
        truck_number: 'DL01AB1234', // Shaurya Transport's 10-ton Open Truck
        truck_type_id: openType.id,
        capacity_tons: 10.0,
        status: TruckStatusEnum.IN_TRANSIT,
        current_location_id: locMap.get('Mumbai'), // Heading towards Mumbai hub
      },
      {
        owner_id: fleetOwner1.id,
        truck_number: 'MH12KL8890',
        truck_type_id: openType.id,
        capacity_tons: 16.0,
        status: TruckStatusEnum.AVAILABLE,
        current_location_id: locMap.get('Mumbai'),
      },
      {
        owner_id: fleetOwner2.id,
        truck_number: 'GJ05CD4521',
        truck_type_id: openType.id,
        capacity_tons: 9.0,
        status: TruckStatusEnum.AVAILABLE,
        current_location_id: locMap.get('Ahmedabad'),
      },
      {
        owner_id: fleetOwner2.id,
        truck_number: 'RJ14EF7788',
        truck_type_id: containerType.id,
        capacity_tons: 12.0,
        status: TruckStatusEnum.AT_RISK,
        current_location_id: locMap.get('Jaipur'),
      },
      {
        owner_id: fleetOwner1.id,
        truck_number: 'KA01XY9988',
        truck_type_id: reeferType.id,
        capacity_tons: 14.0,
        status: TruckStatusEnum.AVAILABLE,
        current_location_id: locMap.get('Bengaluru'),
      },
    ], { returning: true });

    const truck1 = trucks[0]; // DL01AB1234
    const truck2 = trucks[1]; // MH12KL8890

    // 6. Seed Current Available Loads
    const now = new Date();
    // Tomorrow 4 PM arrival for truck
    const tomorrowArrival = new Date(Date.now() + 20 * 60 * 60 * 1000); // ~Tomorrow 4 PM
    const tomorrowPickup7PM = new Date(Date.now() + 23 * 60 * 60 * 1000); // Tomorrow 7 PM
    const tomorrowPickup12PM = new Date(Date.now() + 16 * 60 * 60 * 1000); // Tomorrow 12 PM (Too early!)
    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const loads = await Load.bulkCreate([
      // Option A: Mumbai -> Jaipur (The WINNER!)
      {
        poster_id: loadPoster1.id,
        pickup_location_id: locMap.get('Mumbai')!,
        destination_location_id: locMap.get('Jaipur')!,
        truck_type_id: openType.id,
        weight_tons: 8.0,
        cargo_description: 'Electronics & Consumer Appliances',
        offered_price: 25000.0,
        pickup_start_time: tomorrowArrival,
        pickup_end_time: tomorrowPickup7PM, // Tomorrow before 7 PM
        status: LoadStatusEnum.AVAILABLE,
      },
      // Option B: Mumbai -> Delhi (High paper revenue trap!)
      {
        poster_id: loadPoster1.id,
        pickup_location_id: locMap.get('Mumbai')!,
        destination_location_id: locMap.get('Delhi')!,
        truck_type_id: openType.id,
        weight_tons: 9.0,
        cargo_description: 'FMCG Retail Cartons (Navi Mumbai)',
        offered_price: 35000.0, // High paper price, but high toll & fuel cost
        pickup_start_time: tomorrowArrival,
        pickup_end_time: dayAfter,
        status: LoadStatusEnum.AVAILABLE,
      },
      // Option C: Mumbai -> Pune (Short distance, lower profit)
      {
        poster_id: loadPoster2.id,
        pickup_location_id: locMap.get('Mumbai')!,
        destination_location_id: locMap.get('Pune')!,
        truck_type_id: openType.id,
        weight_tons: 7.0,
        cargo_description: 'Automobile Spare Parts & Castings',
        offered_price: 18000.0,
        pickup_start_time: tomorrowArrival,
        pickup_end_time: dayAfter,
        status: LoadStatusEnum.AVAILABLE,
      },
      // Filtered Load 1 (Step 1 ❌: Overweight - 15 Tons vs 10 Tons Truck Capacity)
      {
        poster_id: loadPoster2.id,
        pickup_location_id: locMap.get('Mumbai')!,
        destination_location_id: locMap.get('Ahmedabad')!,
        truck_type_id: openType.id,
        weight_tons: 15.0, // ❌ OVERWEIGHT for 10-Ton truck!
        cargo_description: 'Heavy Structural Steel Beams',
        offered_price: 42000.0,
        pickup_start_time: tomorrowArrival,
        pickup_end_time: dayAfter,
        status: LoadStatusEnum.AVAILABLE,
      },
      // Filtered Load 2 (Step 1 ❌: Timing Mismatch - Pickup required 12 PM, truck arrives 4 PM)
      {
        poster_id: loadPoster1.id,
        pickup_location_id: locMap.get('Mumbai')!,
        destination_location_id: locMap.get('Indore')!,
        truck_type_id: openType.id,
        weight_tons: 8.0,
        cargo_description: 'Perishable Dairy & Ice Cream Cargo',
        offered_price: 22000.0,
        pickup_start_time: now,
        pickup_end_time: tomorrowPickup12PM, // ❌ Truck arrives at 4 PM, arrives too late!
        status: LoadStatusEnum.AVAILABLE,
      },
      // Other India Loads
      {
        poster_id: loadPoster1.id,
        pickup_location_id: locMap.get('Jaipur')!,
        destination_location_id: locMap.get('Surat')!,
        truck_type_id: containerType.id,
        weight_tons: 7.5,
        cargo_description: 'Textiles and Garment Bundles',
        offered_price: 35000.0,
        pickup_start_time: now,
        pickup_end_time: dayAfter,
        status: LoadStatusEnum.AVAILABLE,
      },
      {
        poster_id: loadPoster2.id,
        pickup_location_id: locMap.get('Bengaluru')!,
        destination_location_id: locMap.get('Chennai')!,
        truck_type_id: reeferType.id,
        weight_tons: 11.0,
        cargo_description: 'Pharmaceutical Vaccines & Reagents',
        offered_price: 38000.0,
        pickup_start_time: now,
        pickup_end_time: dayAfter,
        status: LoadStatusEnum.AVAILABLE,
      },
    ], { returning: true });

    // 7. Seed Line-Haul Trips (Active trip for DL01AB1234: Delhi -> Mumbai arriving tomorrow 4 PM)
    const trip1 = await Trip.create({
      truck_id: truck1.id, // DL01AB1234
      origin_location_id: locMap.get('Delhi')!,
      destination_location_id: locMap.get('Mumbai')!,
      scheduled_start_time: new Date(Date.now() - 24 * 3600 * 1000), // Started yesterday from Delhi
      actual_start_time: new Date(Date.now() - 23 * 3600 * 1000),
      estimated_completion_time: tomorrowArrival, // Reaches Mumbai tomorrow around 4 PM!
      status: TripStatusEnum.IN_TRANSIT,
    });

    // 8. Seed Historical Recommendations & Real Outcomes (Feedback Dataset for ML)
    logger.info('Seeding historical recommendations and outcome records...');
    const historicalRecs = [];
    for (let i = 1; i <= 25; i++) {
      const isAccepted = i % 4 !== 0; // 75% accepted
      const isCompleted = isAccepted && i % 5 !== 0; // majority completed if accepted
      const offeredPrice = 20000 + (i * 1200);
      const estDistance = 300 + (i * 25);
      const fuelCost = estDistance * 14.8;
      const tollCost = estDistance * 2.1;
      const waitingMinutes = 60 + (i * 8);
      const delayMinutes = isCompleted ? (i % 3 === 0 ? 45 : 0) : 180;
      const actualProfit = isCompleted ? (offeredPrice - fuelCost - tollCost - (estDistance * 3.2)) : 0;

      const rec = await Recommendation.create({
        truck_id: (i % 2 === 0) ? truck1.id : truck2.id,
        load_id: loads[i % loads.length].id,
        dead_mileage_probability: 0.78,
        acceptance_probability: 0.88,
        success_probability: 0.92,
        predicted_profit: actualProfit + 500,
        final_recommendation_score: 88.5,
        rank: 1,
        model_version: 'v1.0',
        status: isAccepted ? RecommendationStatusEnum.ACCEPTED : RecommendationStatusEnum.REJECTED,
        generated_at: new Date(Date.now() - (30 - i) * 86400 * 1000),
      });

      await RecommendationOutcome.create({
        recommendation_id: rec.id,
        was_accepted: isAccepted,
        was_completed: isCompleted,
        actual_profit: isCompleted ? actualProfit : 0,
        actual_fuel_cost: fuelCost,
        actual_toll_cost: tollCost,
        actual_waiting_time_minutes: waitingMinutes,
        actual_distance_km: estDistance,
        completion_delay_minutes: delayMinutes,
        recorded_at: new Date(Date.now() - (30 - i) * 86400 * 1000 + 3600000),
      });
    }

    logger.info('=======================================================');
    logger.info(' Database Seeding Completed Successfully!');
    logger.info(' Credentials Created:');
    logger.info('   Admin:       admin@routefill.ai  / password123');
    logger.info('   Truck Owner: owner@fleet.in      / password123');
    logger.info('   Load Poster: shipper@cargo.in    / password123');
    logger.info('=======================================================');
  } catch (error: any) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

// Allow direct CLI execution
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
