import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView
} from 'react-native';
import axios from 'axios';
import moment from 'moment'; // Import moment for consistent date formatting
import BASE_URL from '../../constants/config';

const PaymentScreen = ({ route, navigation }) => {
  const { place, checkInDate, checkOutDate, persons, totalAmount } = route.params;
  const [paymentType, setPaymentType] = useState('visa');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // Display booking summary
  const nights = moment(checkOutDate).diff(moment(checkInDate), 'days');

  // Validate card information
  const validateCard = () => {
    if (cardNumber.length < 16 ) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return false;
    }
    
    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
      Alert.alert('Invalid Date', 'Please enter expiry date in MM/YY format');
      return false;
    }
    
    if (cvv.length < 3 || cvv.length > 4) {
      Alert.alert('Invalid CVV', 'Please enter a valid security code');
      return false;
    }
    
    return true;
  };

  const handlePaymentSuccess = async () => {
    // First validate card information
    if (!validateCard()) {
      return;
    }
    
    try {
      // Here you would normally process the payment with a payment gateway
      
      const bookingRes = await axios.post(`${BASE_URL}/api/tourism/bookings`, {
        userid: 1, // Replace with actual user ID
        location: place.id,
        checkin: checkInDate,
        checkout: checkOutDate,
        noofpersons: persons,
        payment_type: paymentType,
        paid_amount: totalAmount, // Make sure to store the total amount
      });

      Alert.alert('Success', 'Your payment was successful!');
      navigation.navigate('UserHome');
    } catch (error) {
      console.error(error);
      Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
    }
  };

  // Format card number with spaces
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const chunks = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      chunks.push(cleaned.substring(i, i + 4));
    }
    
    return chunks.join(' ').trim();
  };
  
  // Format expiry date with slash
  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned;
    }
    
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.bookingSummary}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        <Text style={styles.summaryText}>
          {place.name}
        </Text>
        <Text style={styles.summaryText}>
          Check-in: {moment(checkInDate).format('MMM DD, YYYY')}
        </Text>
        <Text style={styles.summaryText}>
          Check-out: {moment(checkOutDate).format('MMM DD, YYYY')}
        </Text>
        <Text style={styles.summaryText}>
          {nights} night{nights !== 1 ? 's' : ''} × {persons} person{persons !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.summaryText}>
          Rs.{place.price_per_night} per night
        </Text>
      </View>

      <Text style={styles.totalAmount}>Total: Rs.{totalAmount.toFixed(2)}</Text>

      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.paymentTypeContainer}>
        {['visa', 'mastercard', 'paypal'].map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.paymentTypeButton,
              paymentType === type && styles.selectedPaymentType,
            ]}
            onPress={() => setPaymentType(type)}
          >
            <Text
              style={[
                styles.paymentTypeText,
                paymentType === type && styles.selectedText,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Card Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Card Number"
        value={cardNumber}
        onChangeText={(text) => setCardNumber(formatCardNumber(text))}
        keyboardType="numeric"
        maxLength={19} // 16 digits + 3 spaces
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="MM/YY"
          value={expiryDate}
          onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
          keyboardType="numeric"
          maxLength={5} // MM/YY format
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="CVV"
          value={cvv}
          onChangeText={(text) => setCvv(text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handlePaymentSuccess}>
        <Text style={styles.submitButtonText}>Pay Rs.{totalAmount.toFixed(2)}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  bookingSummary: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C786C',
    marginBottom: 25,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderColor: '#2C786C',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPaymentType: {
    backgroundColor: '#2C786C',
  },
  paymentTypeText: {
    color: '#2C786C',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#2C786C',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default PaymentScreen;