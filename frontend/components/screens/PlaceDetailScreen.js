import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Button,
  Linking 
} from 'react-native';
import Swiper from 'react-native-swiper';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import MapView, { Marker } from 'react-native-maps';


const PlaceDetailScreen = ({ route, navigation }) => {
  const { place } = route.params;

  const [modalVisible, setModalVisible] = useState(false);
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000)); // Set default checkout to tomorrow
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [numPersons, setNumPersons] = useState(1);
  const [total, setTotal] = useState(0);
  const [numPersonsText, setNumPersonsText] = useState('1');


  // Recalculate total whenever dates or number of persons changes
  useEffect(() => {
    calculateTotal();
  }, [checkInDate, checkOutDate, numPersons]);

  // Separate function to calculate total - can be called directly when needed
  const calculateTotal = () => {
    const nights = moment(checkOutDate).diff(moment(checkInDate), 'days');
    const calculatedTotal = nights > 0 ? nights * place.price_per_night * numPersons : 0;
    setTotal(calculatedTotal);
    return calculatedTotal; // Return the calculated value for immediate use
  };

  const handleBooking = () => {
    setModalVisible(true);
  };

  const handleNavigateToPayment = () => {
    // Re-calculate the total just before navigation to ensure it's up to date
    const currentTotal = calculateTotal();
    
    navigation.navigate('Payment', {
      place,
      checkInDate,
      checkOutDate,
      persons: numPersons,
      totalAmount: currentTotal, // Use the freshly calculated total
    });
    
    setModalVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.swiperContainer}>
        <Swiper showsButtons autoplay>
          {place.images.map((img, index) => (
            <Image key={index} source={{ uri: img }} style={styles.image} />
          ))}
        </Swiper>
      </View>

      <Text style={styles.title}>{place.name}</Text>
      <Text style={styles.price}>Rs.{place.price_per_night} / night</Text>
      <Text style={styles.description}>{place.description}</Text>

      <Text style={styles.facilitiesTitle}>Facilities</Text>
      <View style={styles.facilities}>
        {place.facilities.map((facility, index) => (
          <Text key={index} style={styles.facility}>{facility}</Text>
        ))}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          const lat = place.latitude;
          const lng = place.longitude;
          const label = encodeURIComponent(place.name);
          const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;
          Linking.openURL(url);
        }}
      >
        <Text style={styles.buttonText}>View Location on Map</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitbutton} onPress={handleBooking}>
        <Text style={styles.buttonText}>Book Now</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Booking Details</Text>

            <TouchableOpacity
  style={styles.dateInput}
  onPress={() => setShowCheckInPicker(true)}
>
  <Text style={styles.dateText}>
    {checkInDate.toDateString()}
  </Text>
</TouchableOpacity>

{showCheckInPicker && (
  <DateTimePicker
    value={checkInDate}
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShowCheckInPicker(false);
      if (selectedDate) {
        setCheckInDate(selectedDate);
        if (selectedDate >= checkOutDate) {
          const newCheckout = new Date(selectedDate.getTime() + 86400000);
          setCheckOutDate(newCheckout);
        }
      }
    }}
    minimumDate={new Date()}
  />
)}

<TouchableOpacity
  style={styles.dateInput}
  onPress={() => setShowCheckOutPicker(true)}
>
  <Text style={styles.dateText}>
    {checkOutDate.toDateString()}
  </Text>
</TouchableOpacity>

{showCheckOutPicker && (
  <DateTimePicker
    value={checkOutDate}
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShowCheckOutPicker(false);
      if (selectedDate && selectedDate > checkInDate) {
        setCheckOutDate(selectedDate);
      } else if (selectedDate) {
        Alert.alert('Invalid Date', 'Check-out date must be after check-in date');
      }
    }}
    minimumDate={new Date(checkInDate.getTime() + 86400000)}
  />
)}

          {/* //commit */}
<TextInput
  style={styles.input}
  placeholder="Number of Persons"
  keyboardType="numeric"
  value={numPersonsText}
  onChangeText={(text) => {
    // Allow only numbers or empty input
    if (/^\d*$/.test(text)) {
      setNumPersonsText(text);
      const parsed = parseInt(text);
      setNumPersons(parsed > 0 ? parsed : 1); // Still keep total updated
    }
  }}
/>

            <Text style={styles.totalAmount}>Total: Rs.{total.toFixed(2)}</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={handleNavigateToPayment}
            >
              <Text style={styles.buttonText}>Confirm Booking</Text>
            </TouchableOpacity>

            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  swiperContainer: {
    height: 260,
  },
  image: {
    width: '100%',
    height: 260,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  price: {
    fontSize: 22,
    color: '#10B981',
    paddingHorizontal: 20,
    marginTop: 6,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    paddingHorizontal: 20,
    marginTop: 12,
    lineHeight: 24,
  },
  facilitiesTitle: {
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
    color: '#1F2937',
  },
  facilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  facility: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 6,
    paddingHorizontal: 14,
    margin: 6,
    borderRadius: 16,
    fontSize: 14,
    color: '#065F46',
    elevation: 1,
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginHorizontal: 70,
    marginVertical: 17,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
   
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitbutton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
    marginHorizontal: 40,
    elevation: 6,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    margin: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
    color: '#111827',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginVertical: 10,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
    color: '#10B981',
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  
});

export default PlaceDetailScreen;