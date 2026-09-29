import { sequelize } from '../config/database';
import { User } from './User';
import { Role } from './Role';
import { UserRole } from './UserRole';
import { TruckType } from './TruckType';
import { Truck } from './Truck';
import { Location } from './Location';
import { Trip } from './Trip';
import { Load } from './Load';
import { Recommendation } from './Recommendation';
import { RecommendationOutcome } from './RecommendationOutcome';
import { TripStatusHistory } from './TripStatusHistory';
import { Notification } from './Notification';
import { ChatMessage } from './ChatMessage';

let associationsInitialized = false;

/**
 * Defines all relational entity associations ensuring referential integrity and clean 3NF navigation.
 */
export function setupAssociations(): void {
  if (associationsInitialized) {
    return;
  }
  associationsInitialized = true;

  // Users & Roles (Many-to-Many via UserRole)
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });

  // Notifications & User
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ChatMessages & Users / Load
  User.hasMany(ChatMessage, { foreignKey: 'sender_id', as: 'sentMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
  User.hasMany(ChatMessage, { foreignKey: 'receiver_id', as: 'receivedMessages' });
  ChatMessage.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
  Load.hasMany(ChatMessage, { foreignKey: 'load_id', as: 'chatMessages' });
  ChatMessage.belongsTo(Load, { foreignKey: 'load_id', as: 'load' });

  // Trucks & Owner
  User.hasMany(Truck, { foreignKey: 'owner_id', as: 'trucks' });
  Truck.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

  // Trucks & TruckType
  TruckType.hasMany(Truck, { foreignKey: 'truck_type_id', as: 'trucks' });
  Truck.belongsTo(TruckType, { foreignKey: 'truck_type_id', as: 'truckType' });

  // Trucks & Current Location
  Location.hasMany(Truck, { foreignKey: 'current_location_id', as: 'currentTrucks' });
  Truck.belongsTo(Location, { foreignKey: 'current_location_id', as: 'currentLocation' });

  // Loads & Poster
  User.hasMany(Load, { foreignKey: 'poster_id', as: 'postedLoads' });
  Load.belongsTo(User, { foreignKey: 'poster_id', as: 'poster' });

  // Loads & Locations
  Location.hasMany(Load, { foreignKey: 'pickup_location_id', as: 'pickupLoads' });
  Load.belongsTo(Location, { foreignKey: 'pickup_location_id', as: 'pickupLocation' });

  Location.hasMany(Load, { foreignKey: 'destination_location_id', as: 'dropLoads' });
  Load.belongsTo(Location, { foreignKey: 'destination_location_id', as: 'destinationLocation' });

  // Loads & TruckType
  TruckType.hasMany(Load, { foreignKey: 'truck_type_id', as: 'loads' });
  Load.belongsTo(TruckType, { foreignKey: 'truck_type_id', as: 'truckType' });

  // Loads & Assigned Truck
  Truck.hasMany(Load, { foreignKey: 'assigned_truck_id', as: 'assignedLoads' });
  Load.belongsTo(Truck, { foreignKey: 'assigned_truck_id', as: 'assignedTruck' });

  // Trips & Truck
  Truck.hasMany(Trip, { foreignKey: 'truck_id', as: 'trips' });
  Trip.belongsTo(Truck, { foreignKey: 'truck_id', as: 'truck' });

  // Trips & Locations
  Location.hasMany(Trip, { foreignKey: 'origin_location_id', as: 'originTrips' });
  Trip.belongsTo(Location, { foreignKey: 'origin_location_id', as: 'originLocation' });

  Location.hasMany(Trip, { foreignKey: 'destination_location_id', as: 'destinationTrips' });
  Trip.belongsTo(Location, { foreignKey: 'destination_location_id', as: 'destinationLocation' });

  // Trips & Status History
  Trip.hasMany(TripStatusHistory, { foreignKey: 'trip_id', as: 'statusHistory' });
  TripStatusHistory.belongsTo(Trip, { foreignKey: 'trip_id', as: 'trip' });

  // Recommendations & Truck / Load
  Truck.hasMany(Recommendation, { foreignKey: 'truck_id', as: 'recommendations' });
  Recommendation.belongsTo(Truck, { foreignKey: 'truck_id', as: 'truck' });

  Load.hasMany(Recommendation, { foreignKey: 'load_id', as: 'recommendations' });
  Recommendation.belongsTo(Load, { foreignKey: 'load_id', as: 'load' });

  // Recommendation & Outcome
  Recommendation.hasOne(RecommendationOutcome, { foreignKey: 'recommendation_id', as: 'outcome' });
  RecommendationOutcome.belongsTo(Recommendation, { foreignKey: 'recommendation_id', as: 'recommendation' });
}

export {
  sequelize,
  User,
  Role,
  UserRole,
  TruckType,
  Truck,
  Location,
  Trip,
  Load,
  Recommendation,
  RecommendationOutcome,
  TripStatusHistory,
  Notification,
  ChatMessage,
};
