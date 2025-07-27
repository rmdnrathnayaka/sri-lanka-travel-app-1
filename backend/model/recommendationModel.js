// ml/recommendationEngine.js
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const connection = require('../db');

class TourismRecommendationEngine {
  constructor() {
    this.model = null;
    this.scaler = null;
    this.modelPath = path.join(__dirname, 'models');
    this.isModelTrained = false;
  }

  // Ensure model directory exists
  ensureModelDirectory() {
    if (!fs.existsSync(this.modelPath)) {
      fs.mkdirSync(this.modelPath, { recursive: true });
    }
  }

  // Fetch training data from database
  async fetchTrainingData() {
    try {
      // Get all tourism places with their features
      const [places] = await connection.promise().query(`
        SELECT 
          tp.*,
          COUNT(b.bookingid) as booking_count,
          AVG(CASE WHEN b.bookingid IS NOT NULL THEN 1 ELSE 0 END) as popularity_score,
          COUNT(DISTINCT b.userid) as unique_visitors
        FROM tourism_places tp
        LEFT JOIN bookings b ON tp.id = b.locationid
        GROUP BY tp.id
      `);

      // Get booking patterns for collaborative filtering
      const [bookings] = await connection.promise().query(`
        SELECT 
          b.userid,
          b.locationid,
          tp.category,
          tp.is_rural,
          tp.eco_friendly,
          tp.price_per_night,
          DATEDIFF(b.checkout, b.checkin) as stay_duration,
          b.noofpersons
        FROM bookings b
        JOIN tourism_places tp ON b.locationid = tp.id
      `);

      // Get user preferences based on booking history
      const [userPreferences] = await connection.promise().query(`
        SELECT 
          b.userid,
          AVG(tp.price_per_night) as avg_price_preference,
          AVG(tp.is_rural) as rural_preference,
          AVG(tp.eco_friendly) as eco_preference,
          AVG(b.noofpersons) as group_size_preference,
          AVG(DATEDIFF(b.checkout, b.checkin)) as stay_duration_preference,
          COUNT(b.bookingid) as booking_frequency
        FROM bookings b
        JOIN tourism_places tp ON b.locationid = tp.id
        GROUP BY b.userid
      `);

      return { places, bookings, userPreferences };
    } catch (error) {
      console.error('Error fetching training data:', error);
      throw error;
    }
  }

  // Normalize features
  normalizeFeatures(data, min = null, max = null) {
    const tensor = tf.tensor2d(data);
    
    if (min === null || max === null) {
      min = tensor.min(0);
      max = tensor.max(0);
    }
    
    const normalized = tensor.sub(min).div(max.sub(min));
    return { normalized, min, max };
  }

  // Prepare features for training
  prepareFeatures(places, userPreferences) {
    const placeFeatures = places.map(place => [
      place.price_per_night || 0,
      place.max_guests || 0,
      place.is_rural ? 1 : 0,
      place.eco_friendly ? 1 : 0,
      place.booking_count || 0,
      place.popularity_score || 0,
      place.unique_visitors || 0,
      this.encodeCategoryFeature(place.category),
      place.latitude || 0,
      place.longitude || 0
    ]);

    // Create user-place interaction matrix
    const userPlaceMatrix = [];
    const labels = [];

    userPreferences.forEach(user => {
      places.forEach(place => {
        const userFeatures = [
          user.avg_price_preference || 0,
          user.group_size_preference || 0,
          user.rural_preference || 0,
          user.eco_preference || 0,
          user.stay_duration_preference || 0,
          user.booking_frequency || 0
        ];

        const placeIdx = places.findIndex(p => p.id === place.id);
        const combinedFeatures = [
          ...userFeatures,
          ...placeFeatures[placeIdx]
        ];

        userPlaceMatrix.push(combinedFeatures);
        
        // Label: 1 if user has booked this place, 0 otherwise
        const hasBooked = this.checkUserBookedPlace(user.userid, place.id);
        labels.push(hasBooked ? 1 : 0);
      });
    });

    return { features: userPlaceMatrix, labels };
  }

  // Helper function to check if user booked a place
  async checkUserBookedPlace(userId, placeId) {
    const [result] = await connection.promise().query(
      'SELECT COUNT(*) as count FROM bookings WHERE userid = ? AND locationid = ?',
      [userId, placeId]
    );
    return result[0].count > 0;
  }

  // Encode category as numeric feature
  encodeCategoryFeature(category) {
    const categories = {
      'hotel': 1,
      'resort': 2,
      'homestay': 3,
      'guesthouse': 4,
      'villa': 5,
      'apartment': 6
    };
    return categories[category?.toLowerCase()] || 0;
  }

  // Create neural network model
  createModel(inputShape) {
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      units: 128,
      activation: 'relu',
      inputShape: [inputShape],
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    // Hidden layers with dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    // Output layer for binary classification (recommend or not)
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));

    // Compile with appropriate optimizer and loss
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });

    return model;
  }

  // Train the recommendation model
  async trainModel() {
    try {
      console.log('Fetching training data...');
      const { places, userPreferences } = await this.fetchTrainingData();
      
      if (places.length === 0 || userPreferences.length === 0) {
        throw new Error('Insufficient data for training. Need places and user booking history.');
      }

      console.log(`Training with ${places.length} places and ${userPreferences.length} users`);
      
      // Prepare features and labels
      const { features, labels } = this.prepareFeatures(places, userPreferences);
      
      // Normalize features
      const { normalized: normalizedFeatures, min, max } = this.normalizeFeatures(features);
      this.scaler = { min, max };
      
      // Convert to tensors
      const X = normalizedFeatures;
      const y = tf.tensor2d(labels, [labels.length, 1]);
      
      // Create model
      const inputShape = features[0].length;
      this.model = this.createModel(inputShape);
      
      console.log('Starting model training...');
      
      // Train the model
      const history = await this.model.fit(X, y, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            }
          }
        }
      });
      
      // Save the model
      this.ensureModelDirectory();
      await this.model.save(`file://${this.modelPath}`);
      
      // Save scaler parameters
      fs.writeFileSync(
        path.join(this.modelPath, 'scaler.json'),
        JSON.stringify({
          min: await this.scaler.min.data(),
          max: await this.scaler.max.data()
        })
      );
      
      this.isModelTrained = true;
      console.log('Model training completed and saved!');
      
      // Cleanup tensors
      X.dispose();
      y.dispose();
      
      return history;
      
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  // Load trained model
  async loadModel() {
    try {
      const modelPath = path.join(this.modelPath, 'model.json');
      const scalerPath = path.join(this.modelPath, 'scaler.json');
      
      if (!fs.existsSync(modelPath) || !fs.existsSync(scalerPath)) {
        throw new Error('Model not found. Please train the model first.');
      }
      
      this.model = await tf.loadLayersModel(`file://${modelPath}`);
      
      const scalerData = JSON.parse(fs.readFileSync(scalerPath, 'utf8'));
      this.scaler = {
        min: tf.tensor1d(scalerData.min),
        max: tf.tensor1d(scalerData.max)
      };
      
      this.isModelTrained = true;
      console.log('Model loaded successfully!');
      
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  // Get personalized recommendations for a user
  async getRecommendations(userId, limit = 5) {
    try {
      if (!this.isModelTrained) {
        await this.loadModel();
      }

      // Get user preferences
      const [userPref] = await connection.promise().query(`
        SELECT 
          AVG(tp.price_per_night) as avg_price_preference,
          AVG(tp.is_rural) as rural_preference,
          AVG(tp.eco_friendly) as eco_preference,
          AVG(b.noofpersons) as group_size_preference,
          AVG(DATEDIFF(b.checkout, b.checkin)) as stay_duration_preference,
          COUNT(b.bookingid) as booking_frequency
        FROM bookings b
        JOIN tourism_places tp ON b.locationid = tp.id
        WHERE b.userid = ?
        GROUP BY b.userid
      `, [userId]);

      // If user has no booking history, use default preferences
      const userPreferences = userPref.length > 0 ? userPref[0] : {
        avg_price_preference: 100,
        rural_preference: 0.5,
        eco_preference: 0.5,
        group_size_preference: 2,
        stay_duration_preference: 2,
        booking_frequency: 0
      };

      // Get all places not yet booked by user
      const [places] = await connection.promise().query(`
        SELECT tp.*, 
               COUNT(b2.bookingid) as booking_count,
               AVG(CASE WHEN b2.bookingid IS NOT NULL THEN 1 ELSE 0 END) as popularity_score,
               COUNT(DISTINCT b2.userid) as unique_visitors
        FROM tourism_places tp
        LEFT JOIN bookings b2 ON tp.id = b2.locationid
        LEFT JOIN bookings b1 ON tp.id = b1.locationid AND b1.userid = ?
        WHERE b1.bookingid IS NULL
        GROUP BY tp.id
      `, [userId]);

      if (places.length === 0) {
        return [];
      }

      // Prepare features for prediction
      const features = places.map(place => [
        userPreferences.avg_price_preference || 0,
        userPreferences.group_size_preference || 0,
        userPreferences.rural_preference || 0,
        userPreferences.eco_preference || 0,
        userPreferences.stay_duration_preference || 0,
        userPreferences.booking_frequency || 0,
        place.price_per_night || 0,
        place.max_guests || 0,
        place.is_rural ? 1 : 0,
        place.eco_friendly ? 1 : 0,
        place.booking_count || 0,
        place.popularity_score || 0,
        place.unique_visitors || 0,
        this.encodeCategoryFeature(place.category),
        place.latitude || 0,
        place.longitude || 0
      ]);

      // Normalize features
      const featureTensor = tf.tensor2d(features);
      const normalizedFeatures = featureTensor.sub(this.scaler.min).div(this.scaler.max.sub(this.scaler.min));

      // Get predictions
      const predictions = this.model.predict(normalizedFeatures);
      const scores = await predictions.data();

      // Combine places with scores
      const recommendations = places.map((place, index) => ({
        ...place,
        recommendation_score: scores[index]
      }));

      // Sort by recommendation score and return top results
      recommendations.sort((a, b) => b.recommendation_score - a.recommendation_score);

      // Cleanup tensors
      featureTensor.dispose();
      normalizedFeatures.dispose();
      predictions.dispose();

      return recommendations.slice(0, limit);

    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // Get popular places (fallback when no personalized data available)
  async getPopularPlaces(limit = 5) {
    try {
      const [places] = await connection.promise().query(`
        SELECT tp.*, 
               COUNT(b.bookingid) as booking_count,
               AVG(CASE WHEN b.bookingid IS NOT NULL THEN 1 ELSE 0 END) as popularity_score,
               GROUP_CONCAT(pi.image_url) as images
        FROM tourism_places tp
        LEFT JOIN bookings b ON tp.id = b.locationid
        LEFT JOIN place_images pi ON tp.id = pi.tourism_place_id
        GROUP BY tp.id
        ORDER BY booking_count DESC, popularity_score DESC
        LIMIT ?
      `, [limit]);

      return places.map(place => ({
        ...place,
        images: place.images ? place.images.split(',') : []
      }));

    } catch (error) {
      console.error('Error getting popular places:', error);
      throw error;
    }
  }
}

module.exports = TourismRecommendationEngine;