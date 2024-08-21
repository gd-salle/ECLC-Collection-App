import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Card, Text, TextInput, Checkbox, Button, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import ConfirmationDialog from '../components/ConfirmationDialog';
import WarningConfirmationDialog from '../components/WarningConfimationDialog';
import { fetchPeriodDateById, numberToWords, fetchAccountHistory, updateCollectible, isPeriodExported, updatePeriod} from '../services/CollectiblesServices';
import { printReceipt, printAccountHistory } from '../services/PrintService';
import { getConnectionStatus } from '../services/BluetoothService';
import BluetoothConfig from '../components/BluetoothConfig';
import { getConsultantInfo } from '../services/UserService';

const DataEntry = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { item } = route.params; // Access the passed data
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(item.payment_type || '');
  const [isChequeNumberVisible, setChequeNumberVisible] = useState(item.payment_type === 'Cheque');
  const [chequeNumber, setChequeNumber] = useState(item.cheque_number || '');
  const [amountPaid, setAmountPaid] = useState(item.amount_paid || '');
  const [sumOf, setSumOf] = useState(item.amount_paid ? numberToWords(parseFloat(item.amount_paid)) : '');
  const [confirmationDialogVisible, setConfirmationDialogVisible] = useState(false);
  const [warningDialogVisible, setWarningDialogVisible] = useState(false);
  const [periodDate, setPeriodDate] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmData, setConfirmData] = useState({});
  const [isBluetoothConfigVisible, setBluetoothConfigVisible] = useState(false);
  const [consultantName, setConsultantName] = useState('');
  const [isExported, setIsExported] = useState(false);

  // Get the current date
  const getCurrentDate = () => {
    // Convert to GMT+8
    const offset = 8 * 60; // GMT+8 offset in minutes
    const currentDate = new Date(new Date().getTime() + offset * 60 * 1000)
      .toISOString()
      .split('T')[0];
    return currentDate// Format YYYY-MM-DD
  };

  console.log('-------------------------------------')
  // Check if periodDate matches the current date
  // const isPrintDisabled = periodDate !== getCurrentDate();
  
  // console.log('Test', isPrintDisabled)
  // console.log('Current Date:', getCurrentDate())
  // console.log('Period Date', periodDate)
  // Determine if the checkboxes should be disabled based on the payment_type
  const isCheckboxDisabled = item.payment_type === 'Cash' || item.payment_type === 'Cheque';

  // Determine if the Cheque Number field should be disabled based on its length
  // const isChequeNumberDisabled = isPrintDisabled;

  // console.log('ChequeDisabled? :', isCheckboxDisabled)
  useEffect(() => {
    const fetchConsultantInfo = async () => {
      try {
        const info = await getConsultantInfo();
        if (info) {
          const name = info.name
          setConsultantName(name.toUpperCase()); // Set the consultant's name
        }
      } catch (error) {
        console.error('Failed to fetch consultant info:', error);
      }
    };

    const fetchPeriodDate = async () => {
      try {
        const date = await fetchPeriodDateById(item.period_id);
        setPeriodDate(date);
      } catch (error) {
        console.error('Failed to fetch period date:', error);
      }
    };
    fetchConsultantInfo();
    fetchPeriodDate();
  }, [item.period_id]);

  useEffect(() => {
    if (item.amount_paid) {
      setAmountPaid(item.amount_paid.toString());
      setSumOf(numberToWords(parseFloat(item.amount_paid)));
    }
  }, [item.amount_paid]);

  const handleCheckboxChange = (method) => {
    if (!isCheckboxDisabled) {
      setSelectedPaymentMethod(method);
      setChequeNumberVisible(method === 'Cheque');
      setErrors(prevErrors => ({ ...prevErrors, selectedPaymentMethod: '' }));
    }
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = {};

    if (selectedPaymentMethod !== 'Cash' && selectedPaymentMethod !== 'Cheque') {
      newErrors.selectedPaymentMethod = 'Please select a payment method.';
      valid = false;
    }
    if (selectedPaymentMethod === 'Cheque' && !chequeNumber) {
      newErrors.chequeNumber = 'Please enter the cheque number.';
      valid = false;
    }
    if (!amountPaid) {
      newErrors.amountPaid = 'Please enter the amount paid.';
      valid = false;
    }
    if (!sumOf) {
      newErrors.sumOf = 'Please enter the sum of.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleOpenDialog = () => {
    if (validateForm()) {
      setConfirmData({
        account_number: item.account_number,
        period_id: item.period_id,
        payment_type: selectedPaymentMethod,
        cheque_number: chequeNumber,
        amount_paid: amountPaid,
        creditors_name: consultantName,
      });
      setConfirmationDialogVisible(true);
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
    }
  };

  const handleConfirm = () => {
    setConfirmationDialogVisible(false);
    setWarningDialogVisible(true);
  };

  const bluetoothStatus = getConnectionStatus();

  const handleWarningConfirm = async () => {
    setWarningDialogVisible(false);
    // try {
    //   handlePrintReceipt();
    //   await updateCollectible(confirmData);
    //   navigation.navigate('Collectibles', { periodId: item.period_id });
    // } catch (e) {
    //   Alert.alert('Error', 'No bluetooth printer connected.');
    // }
    try {
      if (bluetoothStatus) {
        navigation.navigate('Collectibles', { periodId: item.period_id });
        handlePrintReceipt();
        await updateCollectible(confirmData);
        console.log(confirmData)
        Alert.alert('Success', 'Printed successfully.');
      } else {
        Alert.alert('Please connect to Bluetooth Printer', 'No bluetooth printer connected.');
        setBluetoothConfigVisible(true);  
      }
    } catch (error) {
      Alert.alert('Error', 'No bluetooth printer connected.');
    }
  };

  const handleAmountPaidChange = (value) => {
      const numericValue = parseFloat(value);

      if (numericValue > parseFloat(item.remaining_balance)) {
          Alert.alert('Error', 'The amount paid exceeds the remaining balance.');
          return;
      }

    const displayValue = numericValue === 0 ? '' : value;
      setAmountPaid(displayValue);

      if (!isNaN(numericValue)) {
          setSumOf(numericValue === 0 ? '' : numberToWords(numericValue));
      } else {
          setSumOf('');
      }
  };




  const handlePrintReceipt = async () => {
    const dataToPrint = {
      account_number: item.account_number,
      name: item.name,
      remaining_balance: item.remaining_balance,
      payment_type: selectedPaymentMethod,
      cheque_number: chequeNumber,
      amount_paid: amountPaid,
      creditors_name: consultantName,
    };

    console.log(dataToPrint)
    // try {
    //   await updatePeriod(item.period_id,item.account_number)
    // } catch (e) {
      
    // }
    try {
      await printReceipt(dataToPrint);
    } catch (error) {
      console.error('Error printing receipt:', error);
    }
  };

  useEffect(() => {
    const checkExportedStatus = async () => {
      const result = await isPeriodExported(item.period_id);
      console.log('RESULT:', result)
      console.log('RESULT:', item.is_printed)

      // setIsExported(result);

      if (result || item.is_printed === 1) {
        setIsExported(true);
      } else {
        setIsExported(false)
      }
    };

    checkExportedStatus();
  }, [item.period_id]);
  
  const handlePrintHistoryPress = async () => {
    const accountHistory = await fetchAccountHistory(item.name);
    if (!accountHistory) {
      Alert.alert('Error', 'No account history found.');
      return;
    }

    // Assuming `accountHistory` is an array of history objects
    const dataToPrint = {
      history: accountHistory.map(history => ({
        name: history.name,
        amount_paid: history.amount_paid,
        date: history.date,
      })),
    };
    Alert.alert(
      'Print History',
      'Are you sure you want to print the history?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await printAccountHistory(dataToPrint,item.name)
            } catch (error) {
              console.error('Failed to fetch account history:', error);
            }
          },
        },
      ],
    );
  };


  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Data Entry" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <Text style={styles.label}>Account Number</Text>
                <Text style={styles.label}>Balance</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.accountNumber}>{item.account_number}</Text>
                <Text style={styles.loanAmount}>₱ {item.remaining_balance}</Text>
              </View>
              <Divider style={{ padding: 2, marginTop: 5, marginBottom: 1 }} />
              <View style={styles.row}>
                <Text style={styles.label}>Account Name</Text>
                <Text style={styles.label}>Daily Due</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.value}>{item.name}</Text>
                <Text style={styles.value}>{item.daily_due}</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
        
        <Text style={styles.label}>Form of Payment</Text>
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={selectedPaymentMethod === 'Cash' ? 'checked' : 'unchecked'}
            onPress={() => handleCheckboxChange('Cash')}
            disabled={isCheckboxDisabled}
            
          />
          <Text style={styles.checkboxLabel}>Cash</Text>
          <Checkbox
            status={selectedPaymentMethod === 'Cheque' ? 'checked' : 'unchecked'}
            onPress={() => handleCheckboxChange('Cheque')}
            disabled={isCheckboxDisabled}
          />
          <Text style={styles.checkboxLabel}>Cheque</Text>
        </View>
        {errors.selectedPaymentMethod ? (
          <Text style={styles.errorText}>{errors.selectedPaymentMethod}</Text>
        ) : null}

        {isChequeNumberVisible && (
          <TextInput
            mode="flat"
            label="Cheque Number"
            style={styles.input}
            value={chequeNumber}
            onChangeText={setChequeNumber}
            error={!!errors.chequeNumber}
            keyboardType="numeric"
            disabled={isExported}
          />
        )}
        {errors.chequeNumber ? (
          <Text style={styles.errorText}>{errors.chequeNumber}</Text>
        ) : null}

        <View style={styles.dateContainer}>
          <TextInput
            mode="flat"
            label="Date"
            value={periodDate || 'Loading...'}
            style={[styles.input, { flex: 1 }]}
            editable={false}
          />
        </View>

        <TextInput
          mode="flat"
          label="Amount Paid"
          style={styles.input}
          value={amountPaid}
          onChangeText={handleAmountPaidChange}
          error={!!errors.amountPaid}
          keyboardType="numeric"
          disabled={isExported}
        />
        {errors.amountPaid ? (
          <Text style={styles.errorText}>{errors.amountPaid}</Text>
        ) : null}

        <TextInput
          mode="flat"
          label="Sum of"
          style={styles.input}
          value={sumOf}
          editable={false}
        />
        {errors.sumOf ? (
          <Text style={styles.errorText}>{errors.sumOf}</Text>
        ) : null}

        <TextInput
          mode="flat"
          label="Creditor's Name"
          style={styles.input}
          value={consultantName}
          editable={false}
        />

        <ConfirmationDialog
          visible={confirmationDialogVisible}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmationDialogVisible(false)}
          onClose={() => setConfirmationDialogVisible(false)}
          data={confirmData}
        />

        <WarningConfirmationDialog
          visible={warningDialogVisible}
          onConfirm={handleWarningConfirm}
          onCancel={() => setWarningDialogVisible(false)}
          onClose={() => setWarningDialogVisible(false)}
          data={confirmData}
        />
      </ScrollView>

      <Button
        mode="contained"
        style={[styles.button, !isExported ? styles.button : {display: 'none'}]}
        onPress={handleOpenDialog}
        // disabled={!isExported}
      >
        PRINT RECEIPT
      </Button>
      <Button
        mode="outlined"
        style={[styles.outlinedButton, { marginTop: 0 }]}
        onPress={handlePrintHistoryPress}
      >
        <Text style={styles.outlineText}>PRINT HISTORY</Text>
      </Button>
      <BluetoothConfig
        visible={isBluetoothConfigVisible}
        onClose={() => setBluetoothConfigVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F2F5FA',
  },
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 8,
    color: '#0f2045',
  },
  loanAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f2045',
  },
  accountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f2045',
  },
  agentName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#0f2045',
    lineHeight: 28,
  },
  code: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#0f2045',
  },
  column: {
    flex: 1,
  },
  label: {
    marginTop: 5,
    fontSize: 9,
    color: '#000000',
  },
  value: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#0f2045',
  },
  input: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    marginRight: 16,
  },
  button: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#002B5B',
  },
  outlinedButton: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderColor: '#002B5B',
    borderWidth: 2,
  },
  outlineText: {
    color: '#002B5B',
    fontWeight: '900',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
});

export default DataEntry;
