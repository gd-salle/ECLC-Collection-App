import * as SQLite from 'expo-sqlite';

const databaseName = 'eclcDB6.db';

export const openDatabase = async () => {
  try {
    const db = await SQLite.openDatabaseAsync(databaseName, { useNewConnection: true });
    // console.log('Database opened successfully');

    const tablesCheck = await db.getAllAsync(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN (
        'admin_accounts', 'consultant', 'period', 'collectibles'
      )
    `);

    if (tablesCheck.length === 4) {
      return db;
    }

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
        area TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS period (
        period_id INTEGER PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        isExported INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS collectibles (
        account_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        remaining_balance REAL NOT NULL,
        payment_type TEXT NOT NULL,
        cheque_number TEXT NOT NULL,
        amount_paid REAL NOT NULL DEFAULT 0.00,
        daily_due REAL NOT NULL,
        creditors_name TEXT NULL,
        is_printed INTEGER NOT NULL DEFAULT 0,
        period_id INTEGER NOT NULL REFERENCES period(period_id)
      );

      INSERT INTO admin_accounts (username, password) 
      SELECT 'admin', 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM admin_accounts WHERE username = 'admin');
    `);

    console.log('Tables created successfully');
    return db;
  } catch (error) {
    console.error('Error creating/opening database:', error);
    throw error;
  }
};
