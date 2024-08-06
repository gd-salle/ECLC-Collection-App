import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { addConsultant, getAdmin} from '../services/UserService';

const AccountCreationDialog = ({ visible, onClose, onConfirm }) => {
  const [consultantName, setConsultantName] = useState('');
  const [area, setArea] = useState('');
  const [admin_passcode, setAdminPasscode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [consultantNameError, setConsultantNameError] = useState('');
  const [areaError, setAreaError] = useState('');
  const [adminPasscodeError, setAdminPasscodeError] = useState('');
  const [passwordInputError, setPasswordInputError] = useState('');
  const [confirmPasswordInputError, setConfirmPasswordInputError] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      setConsultantName('');
      setArea('');
      setAdminPasscode('');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setConsultantNameError('');
      setAreaError('');
      setAdminPasscodeError('');
      setPasswordInputError('');
      setConfirmPasswordInputError('');
      setAdminUsername('');
      setAdminPassword('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    let isValid = true;

    if (!consultantName) {
      setConsultantNameError('Consultant Name is required');
      isValid = false;
    }

    if (!area) {
      setAreaError('Area is required');
      isValid = false;
    }

    if (!admin_passcode) {
      setAdminPasscodeError('Admin Passcode is required');
      isValid = false;
    } else {
      setAdminPasscodeError('');
    }

    if (!password) {
      setPasswordInputError('Password is required');
      isValid = false;
    } else if (password.length <= 5) {
      setPasswordError('Password must be more than 5 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordInputError('Confirm Password is required');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      isValid = false;
    }

    if (isValid) {
      try {
        // Fetch admin credentials
        const adminCredentials = await getAdmin('admin', admin_passcode);

        if (adminCredentials) {
          // Store username and password in state variables
          setAdminUsername(adminCredentials.username);
          setAdminPassword(adminCredentials.password);

          if (adminPassword === admin_passcode) {
            // Admin passcode is valid, proceed with adding the consultant
            await addConsultant(consultantName, admin_passcode, password, area);
            onConfirm(consultantName, admin_passcode, password, area);
            onClose();
          } else {
            // Admin passcode is invalid
            setAdminPasscodeError('Invalid admin passcode');
          }
        } else {
          // Handle case where no admin credentials are found
          setAdminPasscodeError('Admin not found');
        }
      } catch (error) {
        console.error('Error adding consultant:', error);
      }
    }
  };

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.titleContainer}>
            <View style={styles.verticalLine} />
            <Text style={styles.title}>Account Creation</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          {consultantNameError ? <Text style={styles.errorText}>{consultantNameError}</Text> : null}
          <TextInput
            label="Consultant Name"
            value={consultantName}
            onChangeText={(text) => {
              setConsultantName(text);
              if (text) setConsultantNameError('');
            }}
            mode="outlined"
            style={styles.input}
            error={!!consultantNameError}
          />
          {areaError ? <Text style={styles.errorText}>{areaError}</Text> : null}
          <TextInput
            label="Area"
            value={area}
            onChangeText={(text) => {
              setArea(text);
              if (text) setAreaError('');
            }}
            mode="outlined"
            style={styles.input}
            error={!!areaError}
          />
          {adminPasscodeError ? <Text style={styles.errorText}>{adminPasscodeError}</Text> : null}
          <TextInput
            label="Admin Passcode"
            secureTextEntry
            value={admin_passcode}
            onChangeText={(text) => {
              setAdminPasscode(text);
              if (text) setAdminPasscodeError('');
            }}
            mode="outlined"
            style={styles.input}
            error={!!adminPasscodeError}
          />
          {passwordInputError ? <Text style={styles.errorText}>{passwordInputError}</Text> : null}
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          <TextInput
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (text) setPasswordInputError('');
            }}
            mode="outlined"
            style={styles.input}
            error={!!passwordInputError}
          />
          {confirmPasswordInputError ? <Text style={styles.errorText}>{confirmPasswordInputError}</Text> : null}
          <TextInput
            label="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (text) setConfirmPasswordInputError('');
            }}
            mode="outlined"
            style={styles.input}
            error={!!confirmPasswordInputError}
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
  errorText: {
    color: 'red',
    marginBottom: 15,
  },
});

export default AccountCreationDialog;