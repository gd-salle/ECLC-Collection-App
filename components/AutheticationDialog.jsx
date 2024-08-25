import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { getConsultantNames, getAdminNames } from '../services/UserService';

const AuthDialog = ({ visible, onClose, onConfirm, isConsultantAuth, selectedConsultantName }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [users, setUsers] = useState([]);
  // console.log(selectedConsultantName)
  useEffect(() => {
    if (visible) {
      fetchUsers();
    } else {
      setSelectedUser('');
      setPassword('');
      setPasswordError('');
    }
  }, [visible]);

  const fetchUsers = async () => {
    try {
      const consultants = await getConsultantNames();
      const admins = await getAdminNames();
      setUsers([...consultants, ...admins]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const validateFields = () => {
    let isValid = true;

    if (selectedUser.trim().length === 0) {
      Alert.alert('Error', 'Please select a user');
      isValid = false;
    }

    if (password.trim().length === 0) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleConfirm = async () => {
    if (!validateFields()) {
      return;
    }

    try {
      await onConfirm(selectedUser, password); // Call the onConfirm prop with the selected user and password
    } catch (error) {
      Alert.alert('Error', 'An error occurred during authentication.');
    }
  };

  const handleClose = () => {
    setSelectedUser('');
    setPassword('');
    onClose();
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.titleContainer}>
            <View style={styles.verticalLine} />
            <Text style={styles.title}>
              {isConsultantAuth
                ? 'This action requires a Consultant Authentication'
                : 'This action requires an Admin Authentication'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedUser}
              onValueChange={(itemValue) => setSelectedUser(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select User" value="" />
              {users.map((user) => (
                <Picker.Item key={user} label={user} value={user} />
              ))}
            </Picker>
          </View>

          {passwordError ? <HelperText type="error">{passwordError}</HelperText> : null}
          <TextInput
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            error={!!passwordError}
          />
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.button}
            labelStyle={styles.buttonText}
          >
            CONFIRM
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
    fontSize: 16,
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
    borderColor: 'rgba(0, 0, 0, 0.25)',
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
    marginBottom: 15,
  },
  button: {
    width: '100%',
    backgroundColor: '#0A154D',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFF',
  },
});

export default AuthDialog;
