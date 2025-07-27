import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import BASE_URL from '../../constants/config';

const TourismPlacesScreen = ({ navigation }) => {
  const [places, setPlaces] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // const [placesRes, recommendsRes] = await Promise.all([
      //   axios.get(`${BASE_URL}/api/tourism/tourism-places`),
      //   axios.get(`${BASE_URL}/api/tourism/recommended-places`)
      // ]);

      setLoading(true);
      const placesRes = await axios.get(`${BASE_URL}/api/tourism/tourism-places`);
      const recommendsRes = await axios.get(`${BASE_URL}/api/tourism/recommended-places`);
      // Correct way to set state with just one argument
      setPlaces(placesRes.data);
      console.log('Places:', placesRes.data);
      console.log('Recommended:', recommendsRes.data);
      setRecommended(recommendsRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendedItem = ({ item }) => {
    const imageUrl = item.images?.length > 0 ? `${BASE_URL}/${item.images[0]}` : 'https://via.placeholder.com/150';
    return (
      <TouchableOpacity
        style={styles.recommendCard}
        onPress={() => navigation.navigate('PlaceDetail', {
          place: {
            ...item,
            images: item.images?.map(img => `${BASE_URL}/${img}`) || [],
          }
        })}
      >
        <Image source={{ uri: imageUrl }} style={styles.recommendImage} />
        <Text style={styles.recommendName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const imageUrl = item.images?.length > 0 ? `${BASE_URL}/${item.images[0]}` : 'https://via.placeholder.com/150';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PlaceDetail', {
          place: {
            ...item,
            images: item.images?.map(img => `${BASE_URL}/${img}`) || [],
          }
        })}
      >
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>Rs.{item.price_per_night} / Per night</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading places...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.recommendSection}>
        <Text style={styles.recommendTitle}>Recommended Places</Text>
        <FlatList
          data={recommended}
          renderItem={renderRecommendedItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={places}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No places found</Text>
          </View>
        }
        scrollEnabled={false} // Prevent nested scrolling conflict
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f2f2f2',
  },
  recommendSection: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  recommendTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  
  recommendCard: {
    marginRight: 14,
    width: 150,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  recommendImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  
  recommendName: {
    fontSize: 15,
    fontWeight: '600',
    padding: 8,
    color: '#444',
  },
  
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 130,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    color: '#333',
  },
  price: {
    color: '#00BFA6',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});


export default TourismPlacesScreen;
