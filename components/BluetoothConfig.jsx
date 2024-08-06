import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Modal, Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import {
  isBluetoothEnabled,
  initializeBluetoothListeners,
  connect,
  unPair,
  scanDevices,
} from '../services/BluetoothService';

const BluetoothConfig = ({ visible, onClose }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [bluetoothDevices, setBluetoothDevices] = useState([]);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const checkBluetooth = async () => {
      const enabled = await isBluetoothEnabled();
      if (!enabled) {
        Alert.alert('Bluetooth is not enabled');
      } else {
        initializeBluetoothListeners(setConnectedDevice, setBluetoothDevices, setNearbyDevices);
        scanForDevices();
      }
    };

    if (visible) {
      checkBluetooth();
    } else {
      // Stop any scanning operation when the modal is closed
      if (scanning) {
        setScanning(false);
        setLoading(false);
      }
    }

    return () => {
      if (scanning) {
        setScanning(false);
        setLoading(false);
      }
    };
  }, [visible]);

  const scanForDevices = async () => {
    setScanning(true);
    await scanDevices(setLoading, setNearbyDevices);
    setScanning(false);
  };

  const handleConnect = async (device) => {
    await connect(device, setLoading, setConnectedDevice);
  };

  const handleDisconnect = async () => {
    if (connectedDevice) {
      await unPair(connectedDevice, setLoading, setConnectedDevice);
    }
  };

  const renderConnectedDeviceItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity onPress={handleDisconnect} disabled={loading}>
        <Text style={styles.disconnect}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDeviceItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity onPress={() => handleConnect(item)}>
        <Text style={styles.connect}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNearbyDeviceItem = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity onPress={() => handleConnect(item)}>
        <Text style={styles.pair}>Pair</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={styles.overlay}
      dismissable={false} // Prevent closing on tap outside
    >
      <View style={styles.dialog}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Bluetooth Active</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Printer connected to the application:</Text>
        {connectedDevice ? (
          <FlatList
            data={[connectedDevice]}
            renderItem={renderConnectedDeviceItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.list}
          />
        ) : (
          <Text style={styles.noDeviceText}>No device connected</Text>
        )}

        <Text style={styles.sectionTitle}>Bluetooth connected to this device:</Text>
        {loading ? <ActivityIndicator animating={true} /> : null}
        <FlatList
          data={bluetoothDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
        />

        <Text style={styles.sectionTitle}>Nearby devices:</Text>
        <FlatList
          data={nearbyDevices}
          renderItem={renderNearbyDeviceItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
        />

        <Button
          mode="contained"
          onPress={scanForDevices}
          style={[styles.scanButton, scanning && styles.disabledButton]}
          disabled={scanning}
          loading={loading}
        >
          {scanning ? 'SCANNING...' : 'SCAN DEVICES'}
        </Button>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '90%',
    padding: 20,
    backgroundColor: '#EBF4F6',
    borderRadius: 10,
    alignSelf: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A154D',
  },
  closeButton: {
    padding: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A154D',
    marginTop: 20,
    marginBottom: 10,
  },
  list: {
    maxHeight: 150,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flexDirection: 'column',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#000000',
  },
  disconnect: {
    color: 'red',
    fontWeight: 'bold',
  },
  connect: {
    color: '#0A154D',
    fontWeight: 'bold',
  },
  pair: {
    color: '#0A154D',
    fontWeight: 'bold',
  },
  noDeviceText: {
    fontSize: 14,
    color: '#0A154D',
    textAlign: 'center',
    marginVertical: 10,
  },
  scanButton: {
    marginTop: 20,
    backgroundColor: '#0A154D',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default BluetoothConfig;
