// components/TourismPlaceForm.tsx

import React from 'react';
import { View, Text, TextInput, Button, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import MapPicker from './MapPicker'; 

export default function TourismPlaceForm({ onNext }: { onNext: (data: any) => void }) {
  const { control, handleSubmit, setValue, getValues } = useForm();

  const onSubmit = (data: any) => onNext(data);
  const handleLocationSelected = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    console.log('Location selected:', latitude, longitude);
    setValue('latitude', latitude);
    setValue('longitude', longitude);
  };


  const inputFields = [
    { name: 'name', placeholder: 'Place Name' },
    { name: 'description', placeholder: 'Description' },
    { name: 'category', placeholder: 'Category' },
    // { name: 'language_support', placeholder: 'Languages (e.g. English,Sinhala)' },
    { name: 'phone_number', placeholder: 'Phone Number' },
    { name: 'website', placeholder: 'Website' },
    { name: 'price_per_night', placeholder: 'Price Per Night', keyboardType: 'numeric' },
    
  ];

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        backgroundColor: '#f9f9f9',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          marginBottom: 20,
          textAlign: 'center',
          color: '#333',
        }}
      >
        📝 Step 1: Enter Place Details
      </Text>

      {inputFields.map((field, idx) => (
        <Controller
          key={idx}
          control={control}
          name={field.name}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder={field.placeholder}
              onChangeText={onChange}
              value={value}
              multiline={true}
              numberOfLines={7} // Adjust height with this or via styles
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                paddingVertical: 12,
                paddingHorizontal: 15,
                borderRadius: 10,
                marginBottom: 12,
                fontSize: 16,
                backgroundColor: '#fff',
              }}
            />
          )}
        />
      ))}
      <MapPicker onLocationSelected={handleLocationSelected} />
      <Controller
        control={control}
        name="latitude"
        defaultValue={null}
        render={({ field: { value } }) => <View />}
      />
      <Controller
        control={control}
        name="longitude"
        defaultValue={null}
        render={({ field: { value } }) => <View />}
      />
      <View
        style={{
          marginVertical: 10,
          paddingVertical: 10,
          paddingHorizontal: 15,
          backgroundColor: '#fff',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#ccc',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 16, color: '#333' }}>🌱 Eco Friendly</Text>
          <Controller
            control={control}
            name="eco_friendly"
            defaultValue={false}
            render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#333' }}>🏞️ Rural Area</Text>
          <Controller
            control={control}
            name="is_rural"
            defaultValue={false}
            render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        style={{
          backgroundColor: '#0066cc',
          paddingVertical: 15,
          borderRadius: 10,
          marginTop: 20,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Next: Upload Images</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
