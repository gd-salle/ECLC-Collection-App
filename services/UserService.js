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
      'SELECT consultant_id, name, area FROM consultant WHERE status = 0 LIMIT 1'
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
      'INSERT INTO consultant (name, admin_passcode, password, area, status) VALUES (?, ?, ?, ?, 0)',
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
    const result = await db.getAllAsync('SELECT name FROM consultant WHERE status = 0');
    const consultantNames = result.map(row => row.name);
    return consultantNames;
  } catch (error) {
    console.error('Error getting consultant names:', error);
    throw error;
  }
};

export const fetchAllConsultant = async () => {
  try {
    const db = await openDatabase()
    const result = await db.getAllAsync('SELECT consultant_id, name, password, area, status FROM consultant');

    const consultants = result.map(row => ({
      consultant_id: row.consultant_id, // Fixed typo here
      name: row.name,
      password: row.password,
      area: row.area,
      status: row.status,
    }))

    return consultants;
  } catch (error) {
    console.error('Error getting consultant:', error);
    throw error;
  }
}

export const fetchAllActiveConsultant = async () => {
  try {
    const db = await openDatabase()
    const result = await db.getAllAsync('SELECT consultant_id, name, area FROM consultant WHERE status = 0');

    const consultants = result.map(row => ({
      consultant_id: row.consultant_id, // Fixed typo here
      name: row.name,
      password: row.password,
      area: row.area,
      status: row.status,
    }))

    return consultants;
  } catch (error) {
    console.error('Error getting consultant:', error);
    throw error;
  }
}

export const updateConsultantPassword = async (password, consultant_id) => {
  try {
    const db = await openDatabase()
    await db.runAsync(`UPDATE consultant SET password = ? WHERE consultant_id = ?`,[password, consultant_id]);
  } catch (error) {
    console.error('Error updating consultant:', error);
    throw error;
  }
}

export const updateConsultantStatus = async (status, consultant_id) => {
  try {
    const db = await openDatabase();
    await db.runAsync(`UPDATE consultant SET status = ? WHERE consultant_id = ?`, [status, consultant_id]);
  } catch (error) {
    console.error('Error updating consultant:', error);
    throw error;
  }
};
