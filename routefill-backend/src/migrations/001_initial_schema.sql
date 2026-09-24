-- =============================================================================
-- RouteFill AI - 3NF Database Schema Migration
-- =============================================================================

-- 1. Roles (Lookup table for 3NF normalization)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- 2. Users (Authentication and System Actors)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 3. User Roles (Junction table supporting multiple roles per user)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- 4. Truck Types (Lookup table for normalized vehicle bodies)
CREATE TABLE IF NOT EXISTS truck_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- 5. Locations (Normalized spatial master table)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    country VARCHAR(80) DEFAULT 'India' NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_lat_lon ON locations(latitude, longitude);

-- 6. Trucks (Fleet vehicle registry)
CREATE TABLE IF NOT EXISTS trucks (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    truck_number VARCHAR(30) NOT NULL UNIQUE,
    truck_type_id INTEGER NOT NULL REFERENCES truck_types(id),
    capacity_tons DECIMAL(6, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'AVAILABLE' NOT NULL,
    current_location_id INTEGER REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trucks_owner ON trucks(owner_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_trucks_type ON trucks(truck_type_id);

-- 7. Trips (Line-haul journeys)
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    truck_id INTEGER NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
    origin_location_id INTEGER NOT NULL REFERENCES locations(id),
    destination_location_id INTEGER NOT NULL REFERENCES locations(id),
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    estimated_completion_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_completion_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'SCHEDULED' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trips_truck ON trips(truck_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_dest ON trips(destination_location_id);

-- 8. Loads (Freight shipments)
CREATE TABLE IF NOT EXISTS loads (
    id SERIAL PRIMARY KEY,
    poster_id INTEGER NOT NULL REFERENCES users(id),
    pickup_location_id INTEGER NOT NULL REFERENCES locations(id),
    destination_location_id INTEGER NOT NULL REFERENCES locations(id),
    truck_type_id INTEGER NOT NULL REFERENCES truck_types(id),
    weight_tons DECIMAL(6, 2) NOT NULL,
    cargo_description VARCHAR(255) NOT NULL,
    offered_price DECIMAL(10, 2) NOT NULL,
    pickup_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) DEFAULT 'AVAILABLE' NOT NULL,
    assigned_truck_id INTEGER REFERENCES trucks(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_pickup ON loads(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_loads_drop ON loads(destination_location_id);
CREATE INDEX IF NOT EXISTS idx_loads_truck_type ON loads(truck_type_id);

-- 9. Recommendations (AI-generated load pairings)
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    truck_id INTEGER NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
    load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    dead_mileage_probability DECIMAL(5, 4) NOT NULL,
    acceptance_probability DECIMAL(5, 4) NOT NULL,
    success_probability DECIMAL(5, 4) NOT NULL,
    predicted_profit DECIMAL(10, 2) NOT NULL,
    final_recommendation_score DECIMAL(6, 2) NOT NULL,
    rank INTEGER DEFAULT 1 NOT NULL,
    model_version VARCHAR(30) DEFAULT 'v1.0' NOT NULL,
    status VARCHAR(30) DEFAULT 'GENERATED' NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recommendations_truck ON recommendations(truck_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_load ON recommendations(load_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);

-- 10. Recommendation Outcomes (Feedback loop dataset for ML training)
CREATE TABLE IF NOT EXISTS recommendation_outcomes (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL UNIQUE REFERENCES recommendations(id) ON DELETE CASCADE,
    was_accepted BOOLEAN NOT NULL,
    was_completed BOOLEAN DEFAULT FALSE NOT NULL,
    actual_profit DECIMAL(10, 2),
    actual_fuel_cost DECIMAL(10, 2),
    actual_toll_cost DECIMAL(10, 2),
    actual_waiting_time_minutes INTEGER,
    actual_distance_km DECIMAL(8, 2),
    completion_delay_minutes INTEGER DEFAULT 0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_outcomes_accepted ON recommendation_outcomes(was_accepted);
CREATE INDEX IF NOT EXISTS idx_outcomes_completed ON recommendation_outcomes(was_completed);

-- 11. Trip Status History (Audit trail for journey transitions)
CREATE TABLE IF NOT EXISTS trip_status_history (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    notes VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trip_history_trip ON trip_status_history(trip_id);
