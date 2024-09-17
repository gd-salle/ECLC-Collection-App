import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { fetchOfficeAddress, addAddress, updateAddress } from '../services/OfficeAddress';

const OnSetupOfficeAddress = ({ visible, onClose }) => {
  const [currentOfficeAddress, setCurrentOfficeAddress] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false); // To toggle between add and update

  useEffect(() => {
    const loadOfficeAddress = async () => {
      try {
        const fetchedAddress = await fetchOfficeAddress();
        if (fetchedAddress && fetchedAddress.name) {
          setCurrentOfficeAddress(fetchedAddress.name);
          setIsUpdating(true); // If address exists, switch to update mode
        } else {
          setCurrentOfficeAddress('');
          setIsUpdating(false); // If no address exists, switch to add mode
        }
      } catch (error) {
        console.error('Error loading office address:', error);
      }
    };

    if (visible) {
      loadOfficeAddress();
    }
  }, [visible]);

  const clearFields = () => {
    setOfficeAddress('');
    setAddressError('');
  };

  const validateFields = () => {
    let isValid = true;

    if (!officeAddress) {
      setAddressError('Please enter an office address.');
      isValid = false;
    } else {
      setAddressError('');
    }

    return isValid;
  };

  const handleConfirm = () => {
    if (validateFields()) {
      Alert.alert(
        isUpdating ? 'Update Office Address' : 'Confirm Office Address',
        `Are you sure you want to ${isUpdating ? 'update' : 'confirm'} this office address?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: async () => {
              try {
                if (isUpdating) {
                  await updateAddress(officeAddress);
                  Alert.alert('Success', 'Office address has been successfully updated.');
                } else {
                  await addAddress(officeAddress);
                  Alert.alert('Success', 'Office address has been successfully added.');
                }
                clearFields();
                onClose();
              } catch (error) {
                console.error('Error updating/adding office address:', error);
                Alert.alert('Error', 'An error occurred while processing the office address.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.titleContainer}>
            <View style={styles.verticalLine} />
            <Text style={styles.title}>Setup Office Address</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>

          {/* Current Office Address Display */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={currentOfficeAddress || ''} // Ensure a default value
              enabled={false} // Disable the picker, only for display
              style={styles.picker}
            >
              {/* Always provide a default Picker.Item in case of no address */}
              <Picker.Item label="No Current Office Address" value="" />
              {currentOfficeAddress ? (
                <Picker.Item label={currentOfficeAddress} value={currentOfficeAddress} />
              ) : null}
            </Picker>
          </View>


          {/* Office Address Input */}
          <TextInput
            label="New Office Address"
            value={officeAddress}
            onChangeText={(text) => setOfficeAddress(text)}
            mode="outlined"
            style={styles.input}
            error={!!addressError}
          />
          {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}

          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.button}
            labelStyle={styles.buttonText}
          >
            {isUpdating ? 'UPDATE' : 'CONFIRM'}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: 350,
    padding: 20,
    backgroundColor: '#EBF4F6',
    borderRadius: 10,
    alignItems: 'flex-start',
    position: 'relative',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  verticalLine: {
    width: 10,
    height: '100%',
    backgroundColor: '#0A154D',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A154D',
    flexShrink: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'gray',
    marginBottom: 15,
    backgroundColor: '#FFF',
  },
  picker: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.87)',
  },
  input: {
    width: '100%',
    marginBottom: 5,
  },
  button: {
    width: '100%',
    backgroundColor: '#0A154D',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFF',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default OnSetupOfficeAddress;
