import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';

const WarningConfirmationDialog = ({ visible, onConfirm, onCancel, onClose }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.dialog}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>!</Text>
          </View>
          <Text style={styles.title}>Warning</Text>
          <Text style={styles.message}>Are you absolutely sure you want to print the receipt?</Text>
          <Text style={styles.subMessage}>This action is irreversible. Please ensure that all information is accurate and complete.</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonTextCancel}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={styles.buttonTextConfirm}>PRINT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: 350,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#005EB8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A154D',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#0A154D',
    textAlign: 'auto',
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 12,
    color: '#0A154D',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    borderColor: '#0A154D',
    borderWidth: 2,
  },
  confirmButton: {
    backgroundColor: '#0A154D',
  },
  buttonTextCancel: {
    color: '#0A154D',
    fontSize: 14,
  },
  buttonTextConfirm: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default WarningConfirmationDialog;
