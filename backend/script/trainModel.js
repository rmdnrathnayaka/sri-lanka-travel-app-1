// scripts/trainModel.js
const TourismRecommendationEngine = require('../model/recommendationModel');
const connection = require('../db');

async function trainRecommendationModel() {
  console.log('🚀 Starting Tourism Recommendation Model Training...\n');
  
  const engine = new TourismRecommendationEngine();
  
  try {
    // Check if we have enough data
    console.log('📊 Checking data availability...');
    
    const [placeCount] = await connection.promise().query('SELECT COUNT(*) as count FROM tourism_places');
    const [bookingCount] = await connection.promise().query('SELECT COUNT(*) as count FROM bookings');
    const [userCount] = await connection.promise().query('SELECT COUNT(DISTINCT userid) as count FROM bookings');
    
    console.log(`   Places: ${placeCount[0].count}`);
    console.log(`   Bookings: ${bookingCount[0].count}`);
    console.log(`   Unique Users: ${userCount[0].count}\n`);
    
    if (placeCount[0].count < 5) {
      console.log('❌ Not enough tourism places (minimum 5 required)');
      process.exit(1);
    }
    
    if (bookingCount[0].count < 10) {
      console.log('❌ Not enough bookings (minimum 10 required)');
      process.exit(1);
    }
    
    if (userCount[0].count < 3) {
      console.log('❌ Not enough unique users (minimum 3 required)');
      process.exit(1);
    }
    
    console.log('✅ Sufficient data available for training\n');
    
    // Start training
    console.log('🧠 Training recommendation model...');
    console.log('   This may take a few minutes...\n');
    
    const startTime = Date.now();
    const history = await engine.trainModel();
    const endTime = Date.now();
    
    const trainingTime = Math.round((endTime - startTime) / 1000);
    
    console.log('🎉 Training completed successfully!\n');
    console.log('📈 Training Results:');
    console.log(`   Training Time: ${trainingTime} seconds`);
    console.log(`   Epochs: ${history.history.loss.length}`);
    console.log(`   Final Loss: ${history.history.loss[history.history.loss.length - 1].toFixed(4)}`);
    console.log(`   Final Accuracy: ${(history.history.acc[history.history.acc.length - 1] * 100).toFixed(2)}%`);
    
    if (history.history.val_acc) {
      console.log(`   Validation Accuracy: ${(history.history.val_acc[history.history.val_acc.length - 1] * 100).toFixed(2)}%`);
    }
    
    console.log('\n✅ Model saved successfully!');
    console.log('🚀 You can now use the recommendation API endpoints.');
    
  } catch (error) {
    console.error('❌ Error during training:', error.message);
  } finally {
    // Close database connection
    if (connection && connection.end) {
      await connection.end();
    }
    process.exit(0);
  }
}

// Add some sample data generation for testing
async function generateSampleData() {
  console.log('🔧 Generating sample data for testing...\n');
  
  try {
    // Check if we already have data
    const [existingPlaces] = await connection.promise().query('SELECT COUNT(*) as count FROM tourism_places');
    const [existingBookings] = await connection.promise().query('SELECT COUNT(*) as count FROM bookings');
    
    if (existingPlaces[0].count >= 10 && existingBookings[0].count >= 20) {
      console.log('✅ Sufficient sample data already exists');
      return;
    }
    
    // Sample places data
    const samplePlaces = [
      {
        name: 'Mountain View Resort',
        description: 'Beautiful resort with mountain views and eco-friendly facilities',
        location: 'Hill Station, State',
        category: 'resort',
        is_rural: 1,
        eco_friendly: 1,
        price_per_night: 2500,
        max_guests: 4,
        latitude: 25.1234,
        longitude: 78.5678
      },
      {
        name: 'City Center Hotel',
        description: 'Modern hotel in the heart of the city with all amenities',
        location: 'Downtown, City',
        category: 'hotel',
        is_rural: 0,
        eco_friendly: 0,
        price_per_night: 3500,
        max_guests: 2,
        latitude: 26.1234,
        longitude: 79.5678
      },
      {
        name: 'Countryside Homestay',
        description: 'Traditional homestay experience in peaceful countryside',
        location: 'Village, Rural Area',
        category: 'homestay',
        is_rural: 1,
        eco_friendly: 1,
        price_per_night: 1200,
        max_guests: 6,
        latitude: 24.1234,
        longitude: 77.5678
      },
      {
        name: 'Beach Villa',
        description: 'Luxury villa with private beach access and ocean views',
        location: 'Coastal Area',
        category: 'villa',
        is_rural: 0,
        eco_friendly: 1,
        price_per_night: 5000,
        max_guests: 8,
        latitude: 27.1234,
        longitude: 80.5678
      },
      {
        name: 'Budget Guesthouse',
        description: 'Affordable accommodation for budget travelers',
        location: 'City Outskirts',
        category: 'guesthouse',
        is_rural: 0,
        eco_friendly: 0,
        price_per_night: 800,
        max_guests: 3,
        latitude: 25.5234,
        longitude: 78.9678
      }
    ];
    
    console.log('📝 Inserting sample places...');
    const placeIds = [];
    
    for (const place of samplePlaces) {
      const [result] = await connection.promise().query(
        `INSERT INTO tourism_places 
        (name, description, location, category, is_rural, eco_friendly, price_per_night, max_guests, latitude, longitude, review_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
        [
          place.name,
          place.description,
          place.location,
          place.category,
          place.is_rural,
          place.eco_friendly,
          place.price_per_night,
          place.max_guests,
          place.latitude,
          place.longitude
        ]
      );
      placeIds.push(result.insertId);
    }
    
    console.log('📝 Inserting sample bookings...');
    
    // Generate sample bookings
    const userIds = [1, 2, 3, 4, 5]; // Assuming these user IDs exist
    const bookingDates = [
      { checkin: '2024-01-15', checkout: '2024-01-18' },
      { checkin: '2024-02-10', checkout: '2024-02-13' },
      { checkin: '2024-03-05', checkout: '2024-03-08' },
      { checkin: '2024-04-20', checkout: '2024-04-23' },
      { checkin: '2024-05-12', checkout: '2024-05-15' }
    ];
    
    for (let i = 0; i < 25; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const placeId = placeIds[Math.floor(Math.random() * placeIds.length)];
      const dates = bookingDates[Math.floor(Math.random() * bookingDates.length)];
      const noofpersons = Math.floor(Math.random() * 4) + 1;
      const paid_amount = Math.floor(Math.random() * 5000) + 1000;
      
      await connection.promise().query(
        `INSERT INTO bookings (userid, locationid, checkin, checkout, noofpersons, paid_amount, payment_type)
        VALUES (?, ?, ?, ?, ?, ?, 'card')`,
        [userId, placeId, dates.checkin, dates.checkout, noofpersons, paid_amount]
      );
    }
    
    console.log('✅ Sample data generated successfully!\n');
  } catch (error) {
    console.error('❌ Error generating sample data:', error.message);
  } finally {
    // Close database connection if needed
    if (connection && connection.end) {
      await connection.end();
    }
  }
}

module.exports = { trainRecommendationModel, generateSampleData };