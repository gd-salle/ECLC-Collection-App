import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { Button, IconButton, TextInput } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { useNavigation } from '@react-navigation/native';
import AuthDialog from '../components/AutheticationDialog';
import AdminToolsDialog from '../components/AdminToolsDialog';
import AccountCreationDialog from '../components/AccountCreationDialog';
import UpdateConsultantDialog from '../components/UpdateConsultantDialog';
import ExportConfirmationDialog from '../components/ExportConfirmationDialog';
import CollectionDateDialog from '../components/CollectionDateDialog';
import BluetoothConfig from '../components/BluetoothConfig';
import { handleImport } from '../services/FileService';
// import { getConsultantInfo } from '../services/UserService';
import { fetchLatestPeriodDate, fetchPeriodIdByDate, fetchLatestPeriodID, fetchAllPeriods } from '../services/CollectiblesServices';
import { exportCollectibles } from '../services/FileService';
import { isBluetoothEnabled } from '../services/BluetoothService';
import { getAdmin, getConsultant,fetchAllActiveConsultant } from '../services/UserService';

const HomeScreen = () => {
  // const [consultant, setConsultant] = useState('');
  
  const [collectionDate, setCollectionDate] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [authAction, setAuthAction] = useState(null);
  const [isAdminToolsVisible, setAdminToolsVisible] = useState(false);
  const [isExportConfirmationVisible, setExportConfirmationVisible] = useState(false);
  const [isAccountCreationVisible, setAccountCreationVisible] = useState(false);
  const [isUpdateConsultantVisible, setUpdateConsultantVisible] = useState(false);
  const [isCollectionDateDialogVisible, setCollectionDateDialogVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(() => {});
  const [isBluetoothConfigVisible, setBluetoothConfigVisible] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const navigation = useNavigation();
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [selectedConsultantName, setSelectedConsultantName] = useState('');
  const [consultants, setConsultants] = useState([]);
  const [area, setArea] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  useEffect(() => {
    const fetchData = async () => {
      // await fetchConsultantInfo();
      await fetchAndSetLatestPeriodDate();
    };

    const checkBluetooth = async () => {
      const bluetoothEnabled = await isBluetoothEnabled();
      if (!bluetoothEnabled) {
        Alert.alert(
          'Bluetooth Required',
          'Please enable Bluetooth to use this app.',
          [{ text: 'OK' }]
        );
      } else {
        setBluetoothConfigVisible(true);
      }
    };

    const fetchConsultants = async () => {
    try {
        const consultantsList = await fetchAllActiveConsultant();
        setConsultants(consultantsList);
      } catch (error) {
        console.error('Failed to fetch consultants:', error);
      }
    };

    fetchConsultants();
    fetchData();
    checkBluetooth();
  }, [refreshFlag]);

  // const fetchConsultantInfo = async () => {
  //   try {
  //     const consultantInfo = await getConsultantInfo();
  //     if (consultantInfo) {
  //       setConsultant(consultantInfo.name);
  //       setArea(consultantInfo.area);
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch consultant info:', error);
  //   }
  // };

  const fetchAndSetLatestPeriodDate = async () => {
    try {
      const result = await fetchLatestPeriodDate();
      if (result) {
        setCollectionDate(result.date || '');
      } else {
        setCollectionDate(''); // Clear the collection date if no date is found
      }
    } catch (error) {
      console.error('Failed to fetch latest period date:', error);
    }
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = async (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    setCollectionDate(formattedDate);
    await fetchPeriodIdByDate(formattedDate);
    hideDatePicker();
  };

  const handleStartCollection = () => {
    if (!selectedConsultant) {
      Alert.alert('No Consultant', 'There is no consultant information.');
      return;
    }
    if (!collectionDate) {
      Alert.alert('No Collection Period', 'There is no collection period today.');
      return;
    }
    setAuthAction('consultant');
    setDialogVisible(true);
  };

  const handleAdminTools = () => {
    setAuthAction('admin');
    setDialogVisible(true);
  };

  const handleDialogClose = () => {
    setDialogVisible(false);
  };

  const fetchAndSetPeriodDate = async (selectedDate) => {
    try {
      const allPeriods = await fetchAllPeriods();
      const currentPeriod = allPeriods.find(period => period.date === selectedDate);

      if (currentPeriod) {
        const periodId = currentPeriod.period_id;
        setCollectionDate(selectedDate); // Set the selected date
        return periodId; // Return the period ID for use in navigation
      } else {
        setCollectionDate(''); // Clear the date if no period is found
        return null; // Return null if no period is found
      }
    } catch (error) {
      console.error('Failed to fetch period dates:', error);
      return null; // Return null in case of an error
    }
  };

  const handleDialogConfirm = async (username, password) => {
    const consultantInfo = consultants.find(c => c.consultant_id === selectedConsultant);
    try {
      if (authAction === 'consultant') {
        // Skip validation if the username is 'admin'
        if (username !== 'admin' && consultantInfo && username !== consultantInfo.name) {
          Alert.alert('Validation Error', 'Username should match the selected consultant\'s name.');
          return; // Exit the function if the names do not match
        }
        const consultant = await getConsultant(username, password);
        const admin = await getAdmin(username, password);
        if (admin || consultant) {
          setDialogVisible(false);

          const periodId = await fetchAndSetPeriodDate(collectionDate);
          if (periodId) {
            navigation.navigate('Collectibles', { periodId });
          } else {
            Alert.alert('Error', 'No valid period ID found for the selected date.');
          }
        } else {
          Alert.alert('Authentication Failed', 'Invalid consultant credentials.');
        }
      } else if (authAction === 'admin') {
        const admin = await getAdmin(username, password);
        if (admin) {
          setDialogVisible(false);
          setAdminToolsVisible(true);
        } else {
          const consultant = await getConsultant(username, password);
          if (consultant) {
            Alert.alert('Access Denied', 'Consultants cannot access admin features.');
          } else {
            Alert.alert('Authentication Failed', 'Invalid admin credentials.');
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during authentication.');
    }
  };


  const handleExport = async () => {
    try {
      const latestPeriod = await fetchLatestPeriodID();
      if (!latestPeriod || !latestPeriod.period_id) {
        Alert.alert('Error', 'No period found to export');
        return;
      }

      const status = await exportCollectibles(latestPeriod.period_id);

      if (status === 'success') {
        Alert.alert('Success', 'Collectibles exported successfully!');
        setRefreshFlag(prev => !prev);
      } else if (status === 'canceled') {
        Alert.alert('Canceled', 'Export was canceled.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const confirmExport = async () => {
    setExportConfirmationVisible(false);
    handleExport();
  };

  const handleExportDialogClose = () => {
    setExportConfirmationVisible(false);
  };

  const handleAccountCreation = () => {
    setAdminToolsVisible(false);
    setTimeout(() => {
      setAccountCreationVisible(true);
    }, 300);
  };

  const handleAccountCreationClose = () => {
    setAccountCreationVisible(false);
  };

  const handleAccountCreationConfirm = async (consultantName, area, username, password) => {
    try {
      setRefreshFlag(prev => !prev);

      setAdminToolsVisible(true);
      setAccountCreationVisible(false);
    } catch (error) {
      console.error('Error adding consultant:', error);
    }
  };

  const handleCollectionDateDialogClose = () => {
    setCollectionDateDialogVisible(false);
  };

  const handleUpdateConsultant = () => {
    setUpdateConsultantVisible(false);
    setTimeout(() => {
      setUpdateConsultantVisible(true);
    }, 300);
  }

  const handleUpdateConsultantClose = () => {
    setUpdateConsultantVisible(false);
  };

  const handleUpdateConsultantConfirm = async () => {
    try {
      setAdminToolsVisible(true);
      setUpdateConsultantVisible(false);
      setRefreshFlag(prev => !prev);
    } catch (error) {
      console.error('Error Updating Consultant:', error)
    }
  };

  const handleUpdateConsultantStatusConfirm = async () => {
    try {
      setAdminToolsVisible(true);
      setUpdateConsultantVisible(false);
      setSelectedConsultant('');
      setArea('');
      setRefreshFlag(prev => !prev);
    } catch (error) {
      console.error('Error Updating Consultant:', error)
    }
  };

  const handleCollectionDateDialogConfirm = async (date) => {
    console.log('asfgjabfvaj',date);
    setCollectionDate(date);
    setIsLoading(true);
    setAdminToolsVisible(false);
    const importSuccessful = await handleImport(date);
    setIsLoading(false);
    if (importSuccessful) {
      Alert.alert('Success', 'Collectibles Successfully Imported', [{ text: 'OK', onPress: () => {
        setAdminToolsVisible(true);
        setCollectionDateDialogVisible(false);
      }}]);
    } else {
      setCollectionDate('');
      setCollectionDateDialogVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>EXTRA CASH LENDING CORP.</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedConsultant}
          onValueChange={(itemValue) => {
            setSelectedConsultant(itemValue);
            
            // Find the selected consultant's area and update the area state
            const selectedConsultantData = consultants.find(c => c.consultant_id === itemValue);
            if (selectedConsultantData) {
              setArea(selectedConsultantData.area); // Update area state
              // console.log(selectedConsultantData.name);
              setSelectedConsultantName(selectedConsultantData.name);
            } else {
              setArea(''); // Clear area if no consultant is selected
            }
          }}
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
        onChangeText={setArea}
        mode="outlined"
        editable={false}
        style={styles.input}
      />
      <View style={styles.datePickerContainer}>
        <TextInput
          label="Date of Collection"
          value={collectionDate}
          onChangeText={setCollectionDate}
          mode="outlined"
          editable={false}
          style={[styles.input, styles.dateInput]}
        />
        <IconButton
          icon="calendar"
          size={24}
          onPress={showDatePicker}
        />
      </View>
      <Button
        mode="contained"
        onPress={handleStartCollection}
        style={styles.startButton}
        labelStyle={styles.startButtonText}
      >
        START COLLECTION
      </Button>
      <Button
        mode="outlined"
        onPress={handleAdminTools}
        style={styles.adminButton}
        labelStyle={styles.adminButtonText}
      >
        ADMIN TOOLS
      </Button>

      <AuthDialog
        visible={isDialogVisible}
        onClose={handleDialogClose}
        onConfirm={handleDialogConfirm}
        isConsultantAuth={authAction === 'consultant'}
        selectedConsultantName={selectedConsultantName}
      />
      <AdminToolsDialog
        visible={isAdminToolsVisible}
        onClose={() => setAdminToolsVisible(false)}
        onImport={() => {
          setPendingAction(() => () => {
            // Perform any additional actions after successful import
          });
          setCollectionDateDialogVisible(true);
        }}
        onExport={() => setExportConfirmationVisible(true)}
        onCreateAccount={handleAccountCreation}
        onUpdateConsultant={handleUpdateConsultant}
      />
      <AccountCreationDialog
        visible={isAccountCreationVisible}
        onClose={handleAccountCreationClose}
        onConfirm={handleAccountCreationConfirm}
      />
      <ExportConfirmationDialog
        visible={isExportConfirmationVisible}
        onConfirm={confirmExport}
        onCancel={() => setExportConfirmationVisible(false)}
        onClose={handleExportDialogClose}
      />
      <CollectionDateDialog
        visible={isCollectionDateDialogVisible}
        onClose={handleCollectionDateDialogClose}
        onConfirm={handleCollectionDateDialogConfirm}
      />
      <UpdateConsultantDialog
        visible={isUpdateConsultantVisible}
        onClose={handleUpdateConsultantClose}
        onConfirm={handleUpdateConsultantConfirm}
        onConfirmStatus={handleUpdateConsultantStatusConfirm}
      />
      <BluetoothConfig
        visible={isBluetoothConfigVisible}
        onClose={() => setBluetoothConfigVisible(false)}
      />
      <DateTimePicker
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
      />
      {isLoading && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={isLoading}
        >
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Importing Data...</Text>
          </View>
        </Modal>
      )}

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  logo: {
    width: '100%',
    height: 100,
    marginBottom: 20,
    objectFit: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 15,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  dateInput: {
    flex: 1,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#0A154D',
    borderRadius: 5,
    marginBottom: 10,
  },
  startButtonText: {
    color: '#FFF',
  },
  adminButton: {
    width: '100%',
    borderColor: '#0A154D',
    borderRadius: 5,
    marginBottom: 10,
  },
  adminButtonText: {
    color: '#0A154D',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 18,
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
});
