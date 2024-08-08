import { openDatabase } from "./Database";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform} from 'react-native';
import { storePeriodDate } from './CollectiblesServices';
import { getConsultantInfo } from './UserService';
import * as Sharing from 'expo-sharing';

// Function to insert collectibles data into the database
export const insertCollectiblesIntoDatabase = async (entry) => {
  try {
    const db = await openDatabase();
    const { account_number, name, remaining_balance, due_date, payment_type, cheque_number, amount_paid, daily_due, creditors_name, is_printed, period_id } = entry;
    await db.runAsync(
      'INSERT OR IGNORE INTO collectibles (account_number, name, remaining_balance, due_date, payment_type, cheque_number, amount_paid, daily_due, creditors_name, is_printed, period_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [account_number, name, parseFloat(remaining_balance), due_date, parseFloat(amount_paid), payment_type, cheque_number,parseFloat(daily_due), creditors_name, is_printed, period_id]
    );
  } catch (error) {
    console.error('Error inserting collectibles data into the database:', error);
  }
};

// Function to handle import of CSV file
export const handleImport = async (selectedCollectionDate) => {
  console.log('Starting handleImport');
  
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'application/csv', 'text/comma-separated-values'],
    copyToCacheDirectory: true
  });

  console.log('Document picker result:', result);

  if (result.canceled) {
    console.log('Document picker canceled');
    return;
  }

  const assets = result.assets;
  if (!assets) {
    console.log('No assets found');
    return false;
  }

  const file = assets[0];
  const csvFile = {
    name: file.name,
    uri: file.uri,
    mimetype: file.mimeType,
    size: file.size,
  };
  console.log('Selected file:', csvFile);

  // Store the date only if the user proceeds with the file
  const periodID = await storePeriodDate(selectedCollectionDate);

  console.log('Period ID:', periodID);

  try {
    const content = await FileSystem.readAsStringAsync(csvFile.uri);
    await processCSVContent(content, selectedCollectionDate, periodID);
    console.log('File processed successfully');
    return true;
  } catch (e) {
    console.log('Error reading file:', e);
    Alert.alert('Error', 'Failed to read file');
    return false;
  }
};

const processCSVContent = async (content, selectedCollectionDate, periodID) => {
  const requiredHeaders = [
    'account_number', 'name', 'remaining_balance', 'due_date', 'payment_type', 'cheque_number', 
    'amount_paid', 'daily_due', 'creditors_name'
  ];

  const rows = content.split('\n').map(row => row.trim()).filter(row => row.length > 0);
  if (rows.length < 2) {
    Alert.alert('Error', 'The CSV file is empty or does not contain enough data.');
    return;
  }

  const headers = rows[0].split(',').map(header => header.trim());

  // Verify that the headers contain all required headers
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    Alert.alert('Error', `Invalid CSV format. Missing headers: ${missingHeaders.join(', ')}`);
    return;
  }

  const data = rows.slice(1).map(row => {
    const values = row.split(',').map(value => value.trim());
    const entry = headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
    // Add the period_id to each entry
    entry['period_id'] = periodID;
    entry['is_printed'] = 0; // Default value for is_printed
    return entry;
  });

  for (const entry of data) {
    await insertCollectiblesIntoDatabase(entry);
  }

  Alert.alert('Success', 'Collectibles Successfully Imported');
};


export const exportCollectibles = async (periodId) => {
  try {
    const db = await openDatabase();
    const consultantInfo = await getConsultantInfo();
    if (!consultantInfo) {
      Alert.alert('Error', 'Consultant information not found');
      return 'error';
    }

    const collectibles = await getCollectiblesData(db, periodId);
    const unprintedCheck = await checkUnprintedCollectibles(db, periodId);
    if (unprintedCheck === 'unprinted_collectibles') {
      return 'unprinted_collectibles';
    }
    const period = await getPeriodData(db, periodId);
    if (!period) throw new Error('Period not found');
    if (period.isExported) {
      Alert.alert('Export Error', 'This period has already been exported.');
      return 'already_exported';
    }

    const { name: consultantName } = consultantInfo;
    const formattedDate = getFormattedDate();

    const csvContent = convertToCSV(collectibles);

    const fileName = `${consultantName}_${formattedDate}.csv`.replace(/[/]/g, '-');
    const fileUri = FileSystem.documentDirectory + fileName;

    const saveStatus = await saveCSVToFile(fileUri, csvContent, fileName);

    if (saveStatus === 'canceled') {
      return 'canceled';
    }

    await markPeriodAsExported(db, periodId);
    // await deleteCollectiblesData(db, periodId);
    // await deletePeriodData(db, periodId);
    return 'success';
  } catch (error) {
    console.error('Error exporting collectibles:', error);
    throw error;
  }
};


const getFormattedDate = () => {
  const date = new Date();
  return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
};

const checkUnprintedCollectibles = async (db, periodId) => {
  const unprintedCollectibles = await db.getAllAsync(`
    SELECT account_number FROM collectibles
    WHERE period_id = ? AND is_printed = 0
  `, [periodId]);

  if (unprintedCollectibles.length > 0) {
    // console.log('Not all collectibles are printed. Export aborted.');
    Alert.alert('Export Aborted', 'Not all collectibles are printed. Please ensure all collectibles are printed before exporting.');
    return 'unprinted_collectibles';
  }
};


const getPeriodData = async (db, periodId) => {
  const periods = await db.getAllAsync(`
    SELECT * FROM period
    WHERE period_id = ?
  `, [periodId]);
  return periods.length ? periods[0] : null;
};

const getCollectiblesData = async (db, periodId) => {
  return await db.getAllAsync(`
    SELECT * FROM collectibles
    WHERE period_id = ?
  `, [periodId]);
};

const convertToCSV = (collectibles) => {
  const csvHeaders = 'account_number,name,remaining_balance,due_date,payment_type,cheque_number,amount_paid,daily_due,creditors_name\n';
  const csvRows = collectibles.map(c => 
    `${c.account_number},${c.name},${c.remaining_balance},${c.due_date},${c.payment_type},${c.cheque_number},${c.amount_paid},${c.daily_due},${c.creditors_name}`
  );
  return csvHeaders + csvRows.join('\n');
};

const saveCSVToFile = async (fileUri, csvContent, fileName) => {
  try {
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    const saveStatus = await save(fileUri, fileName, 'text/csv');
    return saveStatus;
  } catch (error) {
    console.error('Error saving CSV to file:', error);
    throw error;
  }
};

const shareCSVFile = async (fileUri) => {
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Share CSV File',
    UTI: 'public.comma-separated-values-text'
  });
};

const markPeriodAsExported = async (db, periodId) => {
  await db.runAsync(`
    UPDATE period
    SET isExported = 1
    WHERE period_id = ?
  `, [periodId]);
};

const save = async (uri, filename, mimetype) => {
  if (Platform.OS === "android") {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (permissions.granted) {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, mimetype)
        .then(async (uri) => {
          await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
        })
        .catch(e => {
          console.log(e);
          throw new Error('Failed to save file');
        });
      return 'success';
    } else {
      return 'canceled';
    }
  } else {
    await shareCSVFile(uri);
    return 'success';
  }
};

const deleteCollectiblesData = async (db, periodId) => {
  await db.runAsync(`
    DELETE FROM collectibles
    WHERE period_id = ?
  `, [periodId]);
};

const deletePeriodData = async (db, periodId) => {
  await db.runAsync(`
    DELETE FROM period
    WHERE period_id = ?
  `, [periodId]);
};