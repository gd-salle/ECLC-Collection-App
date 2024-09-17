import { openDatabase } from "./Database";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform} from 'react-native';
import { storePeriodDate, fetchPeriodDateById, fetchPeriodIdByDateOfNotExported, fetchAndSetPeriodDate, isPeriodDateExported, fetchPeriodIdOfNotExported } from './CollectiblesServices';
import { getConsultantInfo } from './UserService';
import * as Sharing from 'expo-sharing';
import { zipWithPassword, subscribe } from 'react-native-zip-archive';
let csvFileUri = '';
// Function to check if an account number already exists in the list
const isDuplicateCollectible = (accountNumbers, account_number) => {
  console.log('Checking for duplicate:', account_number);
  console.log('Account Numbers:', accountNumbers);

  // Create a Set from the account numbers for efficient lookup
  const accountNumberSet = new Set(accountNumbers);

  console.log('Account Numbers Set:', Array.from(accountNumberSet));
  console.log('Account Number to Check:', account_number);

  // Check if the account number already exists in the Set
  return accountNumberSet.has(account_number);
};


// Function to insert collectibles data into the database
export const insertCollectiblesIntoDatabase = async (entry,selectedDate) => {
  try {
    const db = await openDatabase();
    const { account_number, name, remaining_balance, payment_type, cheque_number, amount_paid, daily_due, creditors_name, is_printed, period_id } = entry;
    const offset = 8 * 60; // GMT+8 offset in minutes
    const currentDate = new Date(new Date().getTime() + offset * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // console.log('Current Date: ',currentDate)
    // Fetch all collectibles for the current date
    const allRows = await db.getAllAsync(
      'SELECT * FROM collectibles c JOIN period p ON c.period_id = p.period_id WHERE p.date = ?', 
      [selectedDate] // Pass currentDate as a parameter
    );

    // Log fetched rows for debugging
    // console.log('All Rows from DB:', allRows);

    // Map the rows from the database to get the account numbers
    const accountNumbers = allRows.map(row => row.account_number);
    // console.log('Account Numbers from DB:', accountNumbers);

    // Check for duplicates using the extracted account numbers
    const isDuplicate = isDuplicateCollectible(accountNumbers, account_number);
    // console.log('Duplicate Check Result:', isDuplicate);

    if (isDuplicate) {
      Alert.alert('Duplicate Entry Detected', `Account number ${account_number} already exists for ${selectedDate} period.`);
      return false; // Indicate failure due to duplicate
    }

    // Proceed with adding the new collectible if no duplicate is found
    await db.runAsync(
      'INSERT INTO collectibles (account_number, name, remaining_balance, payment_type, cheque_number, amount_paid, daily_due, creditors_name, is_printed, period_id) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [account_number, name, parseFloat(remaining_balance), payment_type, cheque_number, parseFloat(amount_paid), parseFloat(daily_due), creditors_name, is_printed, period_id]
    );

    // console.log('Insertion successful for account number:', account_number);
    return true; // Indicate success

  } catch (error) {
    console.error('Error inserting collectibles data into the database:', error);
    return false; // Indicate failure
  }
};












// Function to handle import of CSV file
export const handleImport = async (selectedCollectionDate) => {
  console.log('Starting handleImport');
  console.log(selectedCollectionDate)
  
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'application/csv', 'text/comma-separated-values'],
    copyToCacheDirectory: true
  });

  console.log('Document picker result:', result);

  if (result.canceled) {
    Alert.alert('Canceled', 'Import was canceled.');
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
    const success = await processCSVContent(content, selectedCollectionDate, periodID);

    if (success) {
      console.log('File processed successfully');
    } else {
      const db = await openDatabase();
      await deletePeriod(db, periodID);
      await deleteCollectibles(db, periodID);
    }
    return success;
  } catch (e) {
    console.log('Error reading file:', e);
    Alert.alert('Error', 'Failed to read file');
    return false;
  }
};















const processCSVContent = async (content, selectedCollectionDate, periodID) => {
  const requiredHeaders = [
    'account_number', 'name', 'remaining_balance', 'daily_due'
  ];

  const offset = 8 * 60; // GMT+8 offset in minutes
  const currentDate = new Date(new Date().getTime() + offset * 60 * 1000)
    .toISOString()
    .split('T')[0];
  console.log('selected:', selectedCollectionDate);
  console.log('current:', currentDate);

  // Check if the collectibles for the selected date have already been exported
  const result = await isPeriodDateExported(selectedCollectionDate);
  if (result) {
    Alert.alert('Import Error', `The collectibles for ${selectedCollectionDate} have already been exported. You can no longer import for this date.`);
    return false;
  }

  // Check if the CSV is empty or has missing data
  const rows = content.split('\n').map(row => row.trim()).filter(row => row.length > 0);
  if (rows.length < 2) {
    Alert.alert('Import Error', 'The CSV file is empty or does not contain enough data.');
    return false;
  }

  const headers = rows[0].split(',').map(header => header.trim());

  // Check for missing headers
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    Alert.alert('Import Error', `Invalid CSV format. Missing headers: ${missingHeaders.join(', ')}`);
    return false;
  }

  // Check for extra headers
  const extraHeaders = headers.filter(header => !requiredHeaders.includes(header));
  if (extraHeaders.length > 0) {
    Alert.alert('Import Error', `Invalid CSV format. Extra headers found: ${extraHeaders.join(', ')}`);
    return false;
  }

  const data = rows.slice(1).map((row, rowIndex) => {
    const values = row.split(',').map(value => value.trim());
    const entry = headers.reduce((obj, header, index) => {
      obj[header] = values[index] || ''; // Use empty string for missing data
      return obj;
    }, {});
    entry['period_id'] = periodID;
    entry['is_printed'] = 0; // Default value for is_printed
    entry['payment_type'] = '';
    entry['amount_paid'] = 0;
    entry['creditors_name'] = '';
    entry['cheque_number'] = '';

    // Add a check to ensure that entries with remaining_balance of 0 are excluded
    // if (parseFloat(entry['remaining_balance']) === 0) {
    //   return null; // Skip this entry
    // }

    return entry;
  }).filter(entry => entry !== null); // Remove null entries

  // Check for missing data in required fields
  const incompleteRows = data.reduce((acc, entry, index) => {
    const missingData = requiredHeaders.filter(header => !entry[header]);
    if (missingData.length > 0) {
      acc.push(`Row ${index + 2}: Missing data for fields: ${missingData.join(', ')}`);
    }
    return acc;
  }, []);

  if (incompleteRows.length > 0) {
    Alert.alert('Import Error', `Incomplete data found:\n${incompleteRows.join('\n')}`);
    return false;
  }

  // Additional validation for numeric fields
  const invalidNumericRows = data.reduce((acc, entry, index) => {
    const remainingBalance = entry['remaining_balance'];
    const dailyDue = entry['daily_due'];
    const rowNumber = index + 2; // Adjust for header row

    if (isNaN(parseFloat(remainingBalance)) || !isFinite(remainingBalance)) {
      acc.push(`Row ${rowNumber}: Invalid remaining_balance value '${remainingBalance}'`);
    }

    if (isNaN(parseFloat(dailyDue)) || !isFinite(dailyDue)) {
      acc.push(`Row ${rowNumber}: Invalid daily_due value '${dailyDue}'`);
    }

    return acc;
  }, []);

  if (invalidNumericRows.length > 0) {
    Alert.alert('Import Error', `Invalid numeric values found:\n${invalidNumericRows.join('\n')}`);
    return false;
  }

  for (const entry of data) {
    const success = await insertCollectiblesIntoDatabase(entry, selectedCollectionDate);
    if (!success) {
      return false; // Stop further processing if there's an error
    }
  }

  return true;
};


















export const exportCollectibles = async (periodId) => {
  try {
    const db = await openDatabase();
    const consultantInfo = await getConsultantInfo();
    if (!consultantInfo) {
      Alert.alert('Error', 'Consultant information not found');
      return 'error';
    }
    const periodDate = await fetchPeriodDateById(periodId);

    const newPeriodId = await fetchPeriodIdOfNotExported();
    const newPeriodDate = await fetchPeriodDateById(newPeriodId);
    const period = await getPeriodData(db, periodDate);

    if (!period) {
      Alert.alert('Export Error', 'No Period Found.');
      return 'no_period';
    }

    if (!newPeriodId) {
      Alert.alert('Export Error', 'All periods have already been exported or no period was found.');
      return 'already_exported';
    } else {
      const userConfirmed = await new Promise((resolve) => {
        Alert.alert(
          'Export Confirmation',
          `You will be exporting Period #${newPeriodId} on ${newPeriodDate}.`,
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'OK', onPress: () => resolve(true) },
          ],
          { cancelable: false }
        );
      });

      if (!userConfirmed) {
        return 'canceled';
      }
    }

    const collectibles = await getCollectiblesData(db, newPeriodId);
    const unprintedCheck = await checkUnprintedCollectibles(db, newPeriodId);
    if (unprintedCheck === 'canceled') {
      return 'canceled';
    }

    const { name: consultantName } = consultantInfo;

    // Get the current date and format it
    const offset = 8 * 60; // GMT+8 offset in minutes
    const currentDate = new Date(new Date().getTime() + offset * 60 * 1000)
      .toISOString()
      .split('T')[0]; // Produces "YYYY-MM-DD"
    const password = `ECLC_${currentDate}`;

    const formattedDate = getFormattedDate();
    const csvContent = convertToCSV(collectibles);

    const fileName = `${consultantName}_${formattedDate}.csv`.replace(/[/]/g, '-');
    const fileUri = FileSystem.documentDirectory + fileName;

    // Step 1: Save CSV file
    console.log('Saving CSV file...');
    const saveStatus = await saveCSVToFile(fileUri, csvContent, fileName);
    if (saveStatus === 'canceled') {
      return 'canceled';
    }

    // Step 2: Halt and wait for the user to confirm folder selection via an alert
    await new Promise((resolve) => {
      Alert.alert(
        'Notice',
        'Please choose the folder to save the zip file.',
        [{ text: 'OK', onPress: () => resolve() }],
        { cancelable: false }
      );
    });

    // Step 3: Request directory access from the user
    let directoryUri;
    if (Platform.OS === 'android') {
      try {
        console.log('Requesting directory access...');
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          console.log('Directory permission denied');
          Alert.alert('Permission Denied', 'You need to grant access to save the file.');
          return 'permission_denied';
        }

        directoryUri = permissions.directoryUri;
        console.log('Directory selected:', directoryUri);
      } catch (error) {
        console.error('Error requesting directory permissions:', error);
        return 'error';
      }
    } else {
      Alert.alert('Error', 'Directory selection is only supported on Android with Storage Access Framework.');
      return 'unsupported_platform';
    }

    // Step 4: Zip the CSV file (add password encryption)
    const zipFileName = `${consultantName}_${formattedDate}.zip`;
    const zipFileUri = FileSystem.documentDirectory + zipFileName;

    console.log(`Zipping file ${fileName}...`);

    try {
      // Modify here to include password (if a new library is used that supports password zipping)
      await zipWithPassword(fileUri, zipFileUri, password, 'AES-256');
      console.log(`Successfully zipped CSV file to ${zipFileUri}`);

      // Inform the user where the zip file will be saved
      Alert.alert(
        'Notice',
        `The zip file will be saved as ${zipFileName} in the selected folder with password "${password}".`,
        [{ text: 'OK' }],
        { cancelable: false }
      );

      // Step 5: Save the zipped file to the chosen directory
      const base64 = await FileSystem.readAsStringAsync(zipFileUri, { encoding: FileSystem.EncodingType.Base64 });
      console.log('Saving zipped file to user-chosen directory...');

      await FileSystem.StorageAccessFramework.createFileAsync(directoryUri, zipFileName, 'application/zip')
        .then(async (uri) => {
          console.log('Writing zipped file...');
          await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
          console.log('Zipped file saved successfully:', uri);
        })
        .catch((error) => {
          console.error('Error saving the zipped file to the directory:', error);
          throw new Error('Failed to save zipped file');
        });

      // Step 6: Delete the CSV file from the original directory
      console.log('Deleting CSV file from the original directory...');
      console.log('File URI:', fileUri);
      await FileSystem.deleteAsync(csvFileUri);
      console.log('CSV file deleted successfully.');

      // Step 7: Mark period as exported
      await markPeriodAsExported(db, newPeriodId);
      console.log('Marked period as exported.');
      return 'success';
    } catch (zipError) {
      console.error('Error zipping or saving the CSV file:', zipError);

      // Delete the CSV file if zipping or saving fails
      try {
        console.log('Deleting CSV file due to zip failure...');
        await FileSystem.deleteAsync(fileUri);
        console.log('CSV file deleted successfully.');
      } catch (deleteError) {
        console.error('Error deleting CSV file after failure:', deleteError);
      }

      Alert.alert('Error', 'Failed to zip or save the CSV file.');
      return 'error';
    }
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
  const userConfirmed = await new Promise((resolve) => {
    Alert.alert(
      'Warning',
      'There are still unprinted collectibles. Are you sure you want to export?',
      [
        { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
        { text: 'OK', onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });

  if (!userConfirmed) {
    return 'canceled';
  }
}

};


const getPeriodData = async (db, periodDate) => {
  const periods = await db.getAllAsync(`
    SELECT * FROM period
    WHERE date = ?
  `, [periodDate]);
  return periods.length ? periods[0] : null;
};

const getCollectiblesData = async (db, periodId) => {
  return await db.getAllAsync(`
    SELECT * FROM collectibles
    WHERE period_id = ?
    ORDER BY name ASC
  `, [periodId]);
};

const convertToCSV = (collectibles) => {
  const csvHeaders = 'account_number,name,remaining_balance,payment_type,cheque_number,amount_paid,daily_due,creditors_name\n';
  const sortedCollectibles = collectibles.sort((a, b) => a.name.localeCompare(b.name));  // Ensure data is sorted alphabetically by name
  const csvRows = sortedCollectibles.map(c => 
    `${c.account_number},${c.name},${c.remaining_balance},${c.payment_type},${c.cheque_number},${c.amount_paid},${c.daily_due},${c.creditors_name}`
  );
  return csvHeaders + csvRows.join('\n');
};


const saveCSVToFile = async (fileUri, csvContent, fileName) => {
  try {
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    const saveStatus = await save(fileUri, fileName, 'text/csv');
    console.log('savestatus:', fileUri)
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
          console.log('Directory:', permissions.directoryUri);
          await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
          console.log('Directory URI:', uri);
          csvFileUri = uri;
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
const deletePeriod = async (db, periodId) => {
  await db.runAsync(
    'DELETE FROM period WHERE period_id = ?', [periodId]);
};

const deleteCollectibles = async (db, periodId) => {
  await db.runAsync(
    'DELETE FROM collectibles WHERE period_id =?', [periodId]
  );
}