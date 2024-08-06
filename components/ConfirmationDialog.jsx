import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal } from 'react-native';
import { Button } from 'react-native-paper';

const ConfirmationDialog = ({ visible, onConfirm, onCancel, onClose }) => {

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <>
      <Modal
        transparent={true}
        animationType="fade"
        visible={visible}
      >
        <View style={styles.container}>
          <View style={styles.dialog}>
            <View style={styles.titleContainer}>
              <View style={styles.verticalLine} />
              <Text style={styles.title}>Do you wish to continue printing the receipt?</Text>
            </View>
            <Text style={styles.subtitle}>
              Please review the information carefully before proceeding.
              Once printed, this data cannot be modified.
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={onCancel}
                style={styles.cancelButton}
                labelStyle={styles.buttonTextCancel}
              >
                CANCEL
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  handleConfirm();
                }}
                style={styles.confirmButton}
                labelStyle={styles.buttonTextConfirm}
              >
                CONFIRM
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    backgroundColor: '#F2F5FA',
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
  verticalLine: {
    width: 10,
    height: '100%',
    backgroundColor: '#0A154D',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A154D',
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#333',
    paddingLeft: 6,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#0A154D',
    borderRadius: 5,
    marginLeft: 5,
    flex: 1,
  },
  cancelButton: {
    borderColor: '#0A154D',
    borderRadius: 5,
    marginRight: 5,
    flex: 1,
  },
  buttonTextConfirm: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  buttonTextCancel: {
    color: '#0A154D',
    fontSize: 14,
  },
});

export default ConfirmationDialog;
