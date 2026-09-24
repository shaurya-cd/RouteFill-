"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = exports.Notification = exports.TripStatusHistory = exports.RecommendationOutcome = exports.Recommendation = exports.Load = exports.Trip = exports.Location = exports.Truck = exports.TruckType = exports.UserRole = exports.Role = exports.User = exports.sequelize = void 0;
exports.setupAssociations = setupAssociations;
const database_1 = require("../config/database");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return database_1.sequelize; } });
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Role_1 = require("./Role");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return Role_1.Role; } });
const UserRole_1 = require("./UserRole");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return UserRole_1.UserRole; } });
const TruckType_1 = require("./TruckType");
Object.defineProperty(exports, "TruckType", { enumerable: true, get: function () { return TruckType_1.TruckType; } });
const Truck_1 = require("./Truck");
Object.defineProperty(exports, "Truck", { enumerable: true, get: function () { return Truck_1.Truck; } });
const Location_1 = require("./Location");
Object.defineProperty(exports, "Location", { enumerable: true, get: function () { return Location_1.Location; } });
const Trip_1 = require("./Trip");
Object.defineProperty(exports, "Trip", { enumerable: true, get: function () { return Trip_1.Trip; } });
const Load_1 = require("./Load");
Object.defineProperty(exports, "Load", { enumerable: true, get: function () { return Load_1.Load; } });
const Recommendation_1 = require("./Recommendation");
Object.defineProperty(exports, "Recommendation", { enumerable: true, get: function () { return Recommendation_1.Recommendation; } });
const RecommendationOutcome_1 = require("./RecommendationOutcome");
Object.defineProperty(exports, "RecommendationOutcome", { enumerable: true, get: function () { return RecommendationOutcome_1.RecommendationOutcome; } });
const TripStatusHistory_1 = require("./TripStatusHistory");
Object.defineProperty(exports, "TripStatusHistory", { enumerable: true, get: function () { return TripStatusHistory_1.TripStatusHistory; } });
const Notification_1 = require("./Notification");
Object.defineProperty(exports, "Notification", { enumerable: true, get: function () { return Notification_1.Notification; } });
const ChatMessage_1 = require("./ChatMessage");
Object.defineProperty(exports, "ChatMessage", { enumerable: true, get: function () { return ChatMessage_1.ChatMessage; } });
/**
 * Defines all relational entity associations ensuring referential integrity and clean 3NF navigation.
 */
function setupAssociations() {
    // Users & Roles (Many-to-Many via UserRole)
    User_1.User.belongsToMany(Role_1.Role, { through: UserRole_1.UserRole, foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });
    Role_1.Role.belongsToMany(User_1.User, { through: UserRole_1.UserRole, foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });
    // Notifications & User
    User_1.User.hasMany(Notification_1.Notification, { foreignKey: 'user_id', as: 'notifications' });
    Notification_1.Notification.belongsTo(User_1.User, { foreignKey: 'user_id', as: 'user' });
    // ChatMessages & Users / Load
    User_1.User.hasMany(ChatMessage_1.ChatMessage, { foreignKey: 'sender_id', as: 'sentMessages' });
    ChatMessage_1.ChatMessage.belongsTo(User_1.User, { foreignKey: 'sender_id', as: 'sender' });
    User_1.User.hasMany(ChatMessage_1.ChatMessage, { foreignKey: 'receiver_id', as: 'receivedMessages' });
    ChatMessage_1.ChatMessage.belongsTo(User_1.User, { foreignKey: 'receiver_id', as: 'receiver' });
    Load_1.Load.hasMany(ChatMessage_1.ChatMessage, { foreignKey: 'load_id', as: 'chatMessages' });
    ChatMessage_1.ChatMessage.belongsTo(Load_1.Load, { foreignKey: 'load_id', as: 'load' });
    // Trucks & Owner
    User_1.User.hasMany(Truck_1.Truck, { foreignKey: 'owner_id', as: 'trucks' });
    Truck_1.Truck.belongsTo(User_1.User, { foreignKey: 'owner_id', as: 'owner' });
    // Trucks & TruckType
    TruckType_1.TruckType.hasMany(Truck_1.Truck, { foreignKey: 'truck_type_id', as: 'trucks' });
    Truck_1.Truck.belongsTo(TruckType_1.TruckType, { foreignKey: 'truck_type_id', as: 'truckType' });
    // Trucks & Current Location
    Location_1.Location.hasMany(Truck_1.Truck, { foreignKey: 'current_location_id', as: 'currentTrucks' });
    Truck_1.Truck.belongsTo(Location_1.Location, { foreignKey: 'current_location_id', as: 'currentLocation' });
    // Loads & Poster
    User_1.User.hasMany(Load_1.Load, { foreignKey: 'poster_id', as: 'postedLoads' });
    Load_1.Load.belongsTo(User_1.User, { foreignKey: 'poster_id', as: 'poster' });
    // Loads & Locations
    Location_1.Location.hasMany(Load_1.Load, { foreignKey: 'pickup_location_id', as: 'pickupLoads' });
    Load_1.Load.belongsTo(Location_1.Location, { foreignKey: 'pickup_location_id', as: 'pickupLocation' });
    Location_1.Location.hasMany(Load_1.Load, { foreignKey: 'destination_location_id', as: 'dropLoads' });
    Load_1.Load.belongsTo(Location_1.Location, { foreignKey: 'destination_location_id', as: 'destinationLocation' });
    // Loads & TruckType
    TruckType_1.TruckType.hasMany(Load_1.Load, { foreignKey: 'truck_type_id', as: 'loads' });
    Load_1.Load.belongsTo(TruckType_1.TruckType, { foreignKey: 'truck_type_id', as: 'truckType' });
    // Loads & Assigned Truck
    Truck_1.Truck.hasMany(Load_1.Load, { foreignKey: 'assigned_truck_id', as: 'assignedLoads' });
    Load_1.Load.belongsTo(Truck_1.Truck, { foreignKey: 'assigned_truck_id', as: 'assignedTruck' });
    // Trips & Truck
    Truck_1.Truck.hasMany(Trip_1.Trip, { foreignKey: 'truck_id', as: 'trips' });
    Trip_1.Trip.belongsTo(Truck_1.Truck, { foreignKey: 'truck_id', as: 'truck' });
    // Trips & Locations
    Location_1.Location.hasMany(Trip_1.Trip, { foreignKey: 'origin_location_id', as: 'originTrips' });
    Trip_1.Trip.belongsTo(Location_1.Location, { foreignKey: 'origin_location_id', as: 'originLocation' });
    Location_1.Location.hasMany(Trip_1.Trip, { foreignKey: 'destination_location_id', as: 'destinationTrips' });
    Trip_1.Trip.belongsTo(Location_1.Location, { foreignKey: 'destination_location_id', as: 'destinationLocation' });
    // Trips & Status History
    Trip_1.Trip.hasMany(TripStatusHistory_1.TripStatusHistory, { foreignKey: 'trip_id', as: 'statusHistory' });
    TripStatusHistory_1.TripStatusHistory.belongsTo(Trip_1.Trip, { foreignKey: 'trip_id', as: 'trip' });
    // Recommendations & Truck / Load
    Truck_1.Truck.hasMany(Recommendation_1.Recommendation, { foreignKey: 'truck_id', as: 'recommendations' });
    Recommendation_1.Recommendation.belongsTo(Truck_1.Truck, { foreignKey: 'truck_id', as: 'truck' });
    Load_1.Load.hasMany(Recommendation_1.Recommendation, { foreignKey: 'load_id', as: 'recommendations' });
    Recommendation_1.Recommendation.belongsTo(Load_1.Load, { foreignKey: 'load_id', as: 'load' });
    // Recommendation & Outcome
    Recommendation_1.Recommendation.hasOne(RecommendationOutcome_1.RecommendationOutcome, { foreignKey: 'recommendation_id', as: 'outcome' });
    RecommendationOutcome_1.RecommendationOutcome.belongsTo(Recommendation_1.Recommendation, { foreignKey: 'recommendation_id', as: 'recommendation' });
}
