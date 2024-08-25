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
import { fetchAllConsultant, updateConsultantPassword, updateConsultantStatus } from '../services/UserService';

const UpdateConsultantDialog = ({ visible, onClose, onConfirm, onConfirmStatus }) => {
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consultants, setConsultants] = useState([]);
  const [statusError, setStatusError] = useState('');
  const [areaError, setAreaError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (visible) {
      fetchConsultants();
    } else {
      clearFields();
    }
  }, [visible]);

  const fetchConsultants = async () => {
    try {
      const consultantsList = await fetchAllConsultant();
      setConsultants(consultantsList);
    } catch (error) {
      console.error('Failed to fetch consultants:', error);
    }
  };

  const clearFields = () => {
    setSelectedConsultant('');
    setArea('');
    setStatus('');
    setPassword('');
    setConfirmPassword('');
    setStatusError('');
    setAreaError('');
    setPasswordError('');
    setConfirmPasswordError('');
  };

  const handleConsultantChange = (consultantId) => {
    setSelectedConsultant(consultantId);
    const consultant = consultants.find(c => c.consultant_id === consultantId);

    if (consultant) {
      setArea(consultant.area);
      setStatus(consultant.status === 0 ? 'Active' : 'Inactive');
    } else {
      setArea('');
      setStatus('');
    }
  };

  const validateFields = () => {
    let isValid = true;

    if (!selectedConsultant) {
      Alert.alert('Validation Error', 'Please select a consultant.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please enter a password.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be more than 8 characters.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleConfirm = async () => {
  if (validateFields()) {
    Alert.alert(
      'Confirm Change Password',
      'Are you sure you want to change the password of this consultant?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              const consultant = consultants.find(c => c.consultant_id === selectedConsultant);
              const consultantName = consultant ? consultant.name : 'Consultant';
              // console.log(selec)
              await updateConsultantPassword(password, selectedConsultant);

              onConfirm();
              clearFields();
              onClose();

              Alert.alert('Success', `You have successfully updated ${consultantName} password.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update consultant.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }
};


  const handleStatusToggle = async () => {
    if (!selectedConsultant) {
      Alert.alert('Validation Error', 'Please select a consultant.');
      return;
    }
    const newStatus = status === 'Active' ? 1 : 0;
    const action = status === 'Active' ? 'deactivate' : 'activate';

    Alert.alert(
      'Status Update',
      `Are you sure you want to ${action} this account?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              
              const updatedStatus = newStatus === 0 ? 'Active' : 'Inactive';
              setStatus(updatedStatus);
              await updateConsultantStatus(newStatus, selectedConsultant);

              Alert.alert('Success', `Consultant status has been changed to ${updatedStatus}.`);
              onConfirmStatus();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to update consultant status.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };


  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.titleContainer}>
            <View style={styles.verticalLine} />
            <Text style={styles.title}>Update Consultant</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedConsultant}
              onValueChange={handleConsultantChange}
              style={styles.picker}
            >
              <Picker.Item label="Select Consultant" value="" />
              {consultants.map((consultant) => (
                <Picker.Item key={consultant.consultant_id} label={consultant.name} value={consultant.consultant_id} />
              ))}
            </Picker>
          </View>

          <TextInput
            label="Area"
            value={area}
            onChangeText={(text) => setArea(text)}
            mode="outlined"
            style={styles.input}
            error={!!areaError}
            editable={false}
          />
          {areaError ? <Text style={styles.errorText}>{areaError}</Text> : null}

          <TextInput
            label="Status"
            value={status}
            mode="outlined"
            style={styles.input}
            editable={false}
          />

          <TextInput
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={(text) => setPassword(text)}
            mode="outlined"
            style={styles.input}
            error={!!passwordError}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <TextInput
            label="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => setConfirmPassword(text)}
            mode="outlined"
            style={styles.input}
            error={!!confirmPasswordError}
          />
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.button}
            labelStyle={styles.buttonText}
          >
            UPDATE
          </Button>
          <Button
            mode="outlined"
            onPress={handleStatusToggle}
            style={styles.outlinedButton}
            labelStyle={styles.buttonTextOutlined}
          >
            {status === 'Active' ? 'DEACTIVATE ACCOUNT' : 'ACTIVATE ACCOUNT'}
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
  outlinedButton: {
    width: '100%',
    borderColor: '#0A154D',
    borderRadius: 5,
    borderWidth: 2,
  },
  buttonTextOutlined: {
    color: '#0A154D',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default UpdateConsultantDialog;
