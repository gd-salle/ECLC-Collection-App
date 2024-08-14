import { openDatabase } from './Database';

// Admin Authentication
export const getAdmin = async (username, password) => {
  try {
    const db = await openDatabase();
    const user = await db.getFirstAsync(
      'SELECT * FROM admin_accounts WHERE username = ? AND password = ?',
      [username, password]
    );
    return user;
  } catch (error) {
    console.log('Error getting admin:', error);
    throw error;
  }
};

// Consultant Authentication
export const getConsultant = async (username, password) => {
  try {
    const db = await openDatabase();
    const user = await db.getFirstAsync(
      'SELECT * FROM consultant WHERE name = ? AND password = ?',
      [username, password]
    );
    return user;
  } catch (error) {
    console.error('Error in getConsultant:', error);
    throw error;
  }
};

// Get Consultant Information
export const getConsultantInfo = async () => {
  try {
    const db = await openDatabase();
    const result = await db.getFirstAsync(
      'SELECT consultant_id, name, area FROM consultant LIMIT 1'
    );

    if (result) {
      const consultantInfo = {
        consultant_id: result.consultant_id,
        name: result.name,
        area: result.area,
      };
      return consultantInfo;
    }

    return null;
  } catch (error) {
    console.error('Error in getConsultantInfo:', error);
    throw error;
  }
};

// Add a new consultant to the database
export const addConsultant = async (name, username, admin_passcode, area) => {
  try {
    const db = await openDatabase();
    console.log('Database connection established for adding consultant');

    await db.runAsync(
      'INSERT INTO consultant (name, admin_passcode, password, area) VALUES (?, ?, ?, ?)',
      [name, username, admin_passcode, area]
    );

    console.log('Consultant added successfully');
  } catch (error) {
    console.error('Error adding consultant:', error);
    throw error;
  }
};

// Get all Admin names
export const getAdminNames = async () => {
  try {
    const db = await openDatabase();
    const result = await db.getAllAsync('SELECT username FROM admin_accounts');
    const adminNames = result.map(row => row.username);
    return adminNames;
  } catch (error) {
    console.error('Error getting admin names:', error);
    throw error;
  }
};

// Get all Consultant names
export const getConsultantNames = async () => {
  try {
    const db = await openDatabase();
    const result = await db.getAllAsync('SELECT name FROM consultant');
    const consultantNames = result.map(row => row.name);
    return consultantNames;
  } catch (error) {
    console.error('Error getting consultant names:', error);
    throw error;
  }
};
