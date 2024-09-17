import * as SQLite from 'expo-sqlite';

const databaseName = 'eclcDB.db';

export const openDatabase = async () => {
  try {
    const db = await SQLite.openDatabaseAsync(databaseName, { useNewConnection: true });
    // Get current database version
    const [{ user_version }] = await db.getAllAsync('PRAGMA user_version;');
    
    // Check if a migration is needed
    if (user_version < 1) {
      // Initial setup or migration for version 1
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS admin_accounts (
          username TEXT NOT NULL,
          password TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS consultant (
          consultant_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          name TEXT NOT NULL,
          admin_passcode TEXT NOT NULL,
          password TEXT NOT NULL,
          area TEXT NOT NULL,
          status INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS period (
          period_id INTEGER PRIMARY KEY NOT NULL,
          date TEXT NOT NULL,
          isExported INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS collectibles (
          account_number TEXT NOT NULL,
          name TEXT NOT NULL,
          remaining_balance TEXT NOT NULL,
          payment_type TEXT NOT NULL,
          cheque_number TEXT NOT NULL,
          amount_paid TEXT NOT NULL,
          daily_due TEXT NOT NULL,
          creditors_name TEXT NULL,
          is_printed INTEGER NOT NULL DEFAULT 0,
          period_id INTEGER NOT NULL REFERENCES period(period_id)
        );

        INSERT INTO admin_accounts (username, password) 
        SELECT 'admin', 'ECLC_@dm1n@cc'
        WHERE NOT EXISTS (SELECT 1 FROM admin_accounts WHERE username = 'admin');

        -- Set the user version to 1 after successful migration
        PRAGMA user_version = 1;
      `);
      console.log('Database initialized or migrated to version 1');
    }

    // Migration for version 2 (Add new table 'office_address')
    if (user_version < 2) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS office_address (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          name TEXT NOT NULL
        );

        -- Set the user version to 2 after successful migration
        PRAGMA user_version = 2;
      `);
      console.log('Database migrated to version 2 with office_address table');
    }

    return db;
  } catch (error) {
    console.error('Error creating/opening database:', error);
    throw error;
  }
};