import { sequelize } from '../config/database';
import { logger } from '../utils/logger';

async function clearOperationalData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database successfully.');

    // Count before
    const [countsBefore]: any = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM trucks) as trucks,
        (SELECT COUNT(*) FROM loads) as loads,
        (SELECT COUNT(*) FROM trips) as trips,
        (SELECT COUNT(*) FROM trip_status_history) as trip_status_history,
        (SELECT COUNT(*) FROM recommendations) as recommendations,
        (SELECT COUNT(*) FROM recommendation_outcomes) as recommendation_outcomes,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM roles) as roles,
        (SELECT COUNT(*) FROM truck_types) as truck_types,
        (SELECT COUNT(*) FROM locations) as locations
    `);

    console.log('--- Before clearing ---');
    console.log('Operational data:', {
      trucks: countsBefore[0].trucks,
      loads: countsBefore[0].loads,
      trips: countsBefore[0].trips,
      trip_status_history: countsBefore[0].trip_status_history,
      recommendations: countsBefore[0].recommendations,
      recommendation_outcomes: countsBefore[0].recommendation_outcomes,
    });
    console.log('Reference data preserved:', {
      users: countsBefore[0].users,
      roles: countsBefore[0].roles,
      truck_types: countsBefore[0].truck_types,
      locations: countsBefore[0].locations,
    });

    console.log('Truncating operational tables with CASCADE...');
    await sequelize.query(`
      TRUNCATE TABLE 
        recommendation_outcomes, 
        recommendations, 
        trip_status_history, 
        trips, 
        loads, 
        trucks 
      RESTART IDENTITY CASCADE;
    `);

    // Count after
    const [countsAfter]: any = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM trucks) as trucks,
        (SELECT COUNT(*) FROM loads) as loads,
        (SELECT COUNT(*) FROM trips) as trips,
        (SELECT COUNT(*) FROM trip_status_history) as trip_status_history,
        (SELECT COUNT(*) FROM recommendations) as recommendations,
        (SELECT COUNT(*) FROM recommendation_outcomes) as recommendation_outcomes,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM roles) as roles,
        (SELECT COUNT(*) FROM truck_types) as truck_types,
        (SELECT COUNT(*) FROM locations) as locations
    `);

    console.log('--- After clearing ---');
    console.log('Operational data (should all be 0):', {
      trucks: countsAfter[0].trucks,
      loads: countsAfter[0].loads,
      trips: countsAfter[0].trips,
      trip_status_history: countsAfter[0].trip_status_history,
      recommendations: countsAfter[0].recommendations,
      recommendation_outcomes: countsAfter[0].recommendation_outcomes,
    });
    console.log('Reference data preserved:', {
      users: countsAfter[0].users,
      roles: countsAfter[0].roles,
      truck_types: countsAfter[0].truck_types,
      locations: countsAfter[0].locations,
    });

    console.log('SUCCESS: Operational data has been cleanly emptied.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing operational data:', error);
    await sequelize.close();
    process.exit(1);
  }
}

clearOperationalData();
