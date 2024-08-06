import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ExportConfirmationDialog = ({ visible, onConfirm, onCancel, onClose }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.dialog}>
          <View style={styles.titleContainer}>
            <View style={styles.verticalLine} />
            <Text style={styles.title}>Are you sure you want to export the Collections?</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonTextCancel}>NO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={styles.buttonTextConfirm}>YES</Text>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A154D',
    flexShrink: 1,
  },
  verticalLine: {
    width: 10,
    height: '100%',
    backgroundColor: '#0A154D',
    marginRight: 10,
  },
  closeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
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

export default ExportConfirmationDialog;
