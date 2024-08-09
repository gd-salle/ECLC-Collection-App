import { BluetoothManager } from "react-native-bluetooth-escpos-printer";
import {
  PermissionsAndroid,
  Platform,
  DeviceEventEmitter,
  NativeEventEmitter,
  ToastAndroid,
  Alert,
} from "react-native";
import { PERMISSIONS, requestMultiple, RESULTS } from "react-native-permissions";

let isBluetootDeviceConnected = false;

// Method to check if a Bluetooth device is connected
export const setConnectionStatus = (status) => {
  isBluetootDeviceConnected = status;
};

export const getConnectionStatus = () => {
  return isBluetootDeviceConnected;
};

// Method to check if Bluetooth is enabled
export const isBluetoothEnabled = async () => {
  try {
    const enabled = await BluetoothManager.isBluetoothEnabled();
    if (!enabled) {
      const request = await requestMultiple([
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ]);

      if (request["android.permission.BLUETOOTH_CONNECT"] === RESULTS.GRANTED &&
          request["android.permission.BLUETOOTH_SCAN"] === RESULTS.GRANTED &&
          request["android.permission.ACCESS_FINE_LOCATION"] === RESULTS.GRANTED) {
        try {
          await BluetoothManager.enableBluetooth();
          return true;
        } catch (error) {
          console.error('Failed to enable Bluetooth:', error);
          Alert.alert('Error', 'Failed to enable Bluetooth. Please enable it manually in the settings.');
          if (Platform.OS === 'android') {
            BluetoothManager.openBluetoothSettings();
          }
          return false;
        }
      } else {
        Alert.alert('Permissions Denied', 'Bluetooth permissions are required to use this app.');
        return false;
      }
    }
    return Boolean(enabled);
  } catch (err) {
    console.error(err);
    return false;
  }
};

// Method to initialize Bluetooth event listeners
export const initializeBluetoothListeners = (setConnectedDevice, setBluetoothDevices, setNearbyDevices) => {
  const bluetoothEventEmitter = Platform.OS === "ios"
    ? new NativeEventEmitter(BluetoothManager)
    : DeviceEventEmitter;

  bluetoothEventEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, (rsp) => deviceAlreadyPaired(rsp, setBluetoothDevices));
  bluetoothEventEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, (rsp) => deviceFoundEvent(rsp, setNearbyDevices));
  bluetoothEventEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, () => {
    setConnectedDevice(null);
  });

  if (Platform.OS === "android") {
    bluetoothEventEmitter.addListener(BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, () => {
      ToastAndroid.show("Device Not Support Bluetooth !", ToastAndroid.LONG);
    });
  }
};

// Method to handle already paired devices
export const deviceAlreadyPaired = (rsp, setBluetoothDevices) => {
  let ds = null;
  if (typeof rsp.devices === "object") {
    ds = rsp.devices;
  } else {
    try {
      ds = JSON.parse(rsp.devices);
    } catch (e) {}
  }
  if (ds && ds.length) {
    setBluetoothDevices(ds);
  }
};

// Method to handle found devices
export const deviceFoundEvent = (rsp, setNearbyDevices) => {
  let r = null;
  try {
    if (typeof rsp.device === "object") {
      r = rsp.device;
    } else {
      r = JSON.parse(rsp.device);
    }
  } catch (e) {}

  if (r) {
    setNearbyDevices((prevDevices) => [...prevDevices, r]);
  }
};

// Method to connect to a Bluetooth device
export const connect = async (device, setLoading, setConnectedDevice) => {
  try {
    setLoading(true);
    await BluetoothManager.connect(device.address);
    setLoading(false);
    setConnectedDevice(device);
    console.log('Connected to device:', device);
    setConnectionStatus(true);
  } catch (e) {
    setLoading(false);
    if (e.message.includes('timeout') || e.message.includes('failed')) {
      Alert.alert(
        'Connection Failed',
        'Unable to connect to the device. Please check if the device is powered on and in range. If the problem persists, try re-pairing the device or refer to the troubleshooting tips.',
        [
          { text: 'Troubleshoot', onPress: () => {
              // Here you can add custom troubleshooting steps or redirect to a help page
              Alert.alert('Troubleshooting Tips', '1. Ensure the device is turned on.\n2. Check if the device is within range.\n3. Try re-pairing the device.\n4. Restart the Bluetooth on your phone.');
          }},
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert('Error', 'An unexpected error occurred while connecting to the device.');
    }
    setConnectionStatus(false);
  }
};


// Method to unpair a Bluetooth device
export const unPair = async (device, setLoading, setConnectedDevice) => {
  setLoading(true);
  try {
    await BluetoothManager.unpaire(device.address);
    setLoading(false);
    setConnectedDevice(null);
  } catch (e) {
    setLoading(false);
    Alert.alert(e);
  }
};

// Method to scan for Bluetooth devices
export const scanDevices = async (setLoading, setNearbyDevices) => {
  setLoading(true);
  setNearbyDevices([]);
  try {
    const s = await BluetoothManager.scanDevices();
    let found = s.found;
    try {
      found = JSON.parse(found);
    } catch (e) {}
    if (found && found.length) {
      setNearbyDevices(found);
    }
    setLoading(false);
  } catch (err) {
    setLoading(false);
    console.error(err);
  }
};

// Method to scan for Bluetooth devices with permissions
export const scan = async (setLoading, scanDevices) => {
  setLoading(true);
  try {
    const permissions = {
      title: "Bluetooth permissions",
      message: "This app needs access to Bluetooth to connect to devices.",
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK",
    };

    const bluetoothConnectGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      permissions
    );
    if (bluetoothConnectGranted === PermissionsAndroid.RESULTS.GRANTED) {
      const bluetoothScanGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        permissions
      );
      if (bluetoothScanGranted === PermissionsAndroid.RESULTS.GRANTED) {
        await scanDevices();
      }
    }
    setLoading(false);
  } catch (err) {
    setLoading(false);
    console.warn(err);
  }
};

// Method to scan Bluetooth devices with multiple permissions
export const scanBluetoothDevice = async (setLoading, scanDevices) => {
  setLoading(true);
  try {
    const request = await requestMultiple([
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ]);

    if (request["android.permission.ACCESS_FINE_LOCATION"] === RESULTS.GRANTED) {
      await scanDevices();
      setLoading(false);
    } else {
      setLoading(false);
    }
  } catch (err) {
    setLoading(false);
    console.error(err);
  }
};