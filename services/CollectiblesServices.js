import { openDatabase } from './Database';

export const fetchCollectibles = async (period_id) => {
    try {
        const db = await openDatabase();
        const allRows = await db.getAllAsync(
            'SELECT * FROM collectibles c JOIN period p ON c.period_id = p.period_id WHERE c.is_printed = 0 AND p.isExported = 0 AND c.period_id = ?', 
            [period_id] // Pass period_id as a parameter
        );

        // Map the rows from the database to your Collectibles object
        const collectibles = allRows.map(row => ({
            account_number: row.account_number,
            name: row.name,
            remaining_balance: row.remaining_balance,
            due_date: row.due_date,
            payment_type: row.payment_type,
            cheque_number: row.cheque_number,
            amount_paid: row.amount_paid,
            daily_due: row.daily_due,
            creditors_name: row.creditors_name,
            is_printed: row.is_printed,
            period_id: row.period_id,
        }));

        return collectibles;

    } catch (error) {
        console.error('Error fetching collectibles:', error);
        throw error;
    }
};

export const fetchAllCollectiblesByPeriodDate = async (period_date) => {
    try {
        const db = await openDatabase();
        const allRows = await db.getAllAsync(
            'SELECT * FROM collectibles c JOIN period p ON c.period_id = p.period_id WHERE p.date = ?', 
            [period_date] // Pass period_id as a parameter
        );

        // Map the rows from the database to your Collectibles object
        const collectibles = allRows.map(row => ({
            account_number: row.account_number,
            name: row.name,
            remaining_balance: row.remaining_balance,
            due_date: row.due_date,
            payment_type: row.payment_type,
            cheque_number: row.cheque_number,
            amount_paid: row.amount_paid,
            daily_due: row.daily_due,
            creditors_name: row.creditors_name,
            is_printed: row.is_printed,
            period_id: row.period_id,
        }));

        return collectibles;

    } catch (error) {
        console.error('Error fetching collectibles:', error);
        throw error;
    }
};
export const fetchAllCollectibles = async () => {
    try {
        const db = await openDatabase();
        const allRows = await db.getAllAsync(
            'SELECT * FROM collectibles'
        );

        // Map the rows from the database to your Collectibles object
        const collectibles = allRows.map(row => ({
            account_number: row.account_number,
            name: row.name,
            remaining_balance: row.remaining_balance,
            due_date: row.due_date,
            payment_type: row.payment_type,
            cheque_number: row.cheque_number,
            amount_paid: row.amount_paid,
            daily_due: row.daily_due,
            creditors_name: row.creditors_name,
            is_printed: row.is_printed,
            period_id: row.period_id,
        }));

        return collectibles;

    } catch (error) {
        console.error('Error fetching collectibles:', error);
        throw error;
    }
};

export const storePeriodDate = async (date) => {
  try {
    const db = await openDatabase();
    await db.runAsync(`
      INSERT INTO period (date, isExported)
      VALUES (?, 0)
    `, [date]);
    
    // Fetch the last inserted row ID
    const result = await db.getFirstAsync(`
      SELECT last_insert_rowid() AS lastInsertRowid
    `);

    if (!result || result.lastInsertRowid === undefined) {
      throw new Error('Failed to retrieve the inserted period ID');
    }

    const periodID = result.lastInsertRowid;
    console.log('Date stored successfully:', date);
    return periodID;
  } catch (error) {
    console.error('Error storing date:', error);
    throw error;
  }
};

export const fetchAllPeriods = async () => {
  try {
    const db = await openDatabase();
    const result = await db.getAllAsync(`
      SELECT * FROM period
    `);
    return result;
  } catch (error) {
    console.error('Error fetching period data:', error);
    throw error;
  }
};

export const fetchLatestPeriodID = async () => {
    try {
      const db = await openDatabase();
      const result = await db.getFirstAsync(`
        SELECT period_id FROM period
        ORDER BY period_id DESC
        LIMIT 1
      `);
      return result;
    } catch (error) {
      console.error('Error fetching period data:', error);
      throw error;
    }
};

export const fetchLatestPeriodDate = async () => {
  try {
    const db = await openDatabase();
    const result = await db.getFirstAsync(`
      SELECT date, isExported FROM period
      ORDER BY period_id DESC
      LIMIT 1
    `);
    return result && result.isExported === 0 ? result : null;
  } catch (error) {
    console.error('Error fetching latest period date:', error);
    throw error;
  }
};

export const fetchPeriodDateById = async (periodId) => {
  try {
    const db = await openDatabase();
    const result = await db.getFirstAsync(`
      SELECT date FROM period
      WHERE period_id = ?
    `, [periodId]);
    return result ? result.date : null;
  } catch (error) {
    console.error('Error fetching period date by ID:', error);
    throw error;
  }
};

export const fetchPeriodIdByDate = async (date) => {
    try {
        const db = await openDatabase();
        const result = await db.getFirstAsync(
            'SELECT period_id FROM period WHERE date = ?',
            [date]
        );
        return result ? result.period_id : null;
    } catch (error) {
        console.error('Error fetching period ID by date:', error);
        throw error;
    }
};


export const numberToWords = (num) => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const g = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

  const makeGroup = (num) => {
    const hundreds = Math.floor(num / 100);
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;
    let str = '';

    if (hundreds) {
      str += a[hundreds] + ' Hundred ';
    }

    if (tens >= 2) {
      str += b[tens] + ' ';
      if (ones) {
        str += a[ones] + ' ';
      }
    } else if (tens >= 1) {
      str += a[tens * 10 + ones] + ' ';
    } else if (ones) {
      str += a[ones] + ' ';
    }

    return str.trim();
  };

  const convertToWords = (num) => {
    let result = '';
    let groupIndex = 0;

    while (num > 0) {
      const groupNum = num % 1000;
      if (groupNum > 0) {
        result = makeGroup(groupNum) + ' ' + g[groupIndex] + ' ' + result;
      }
      num = Math.floor(num / 1000);
      groupIndex++;
    }

    return result.trim();
  };

  return num === 0 ? 'Zero' : convertToWords(num);
};

export const updateCollectible = async ({
  account_number,
  period_id,
  payment_type,
  cheque_number,
  amount_paid,
  creditors_name
}) => {
  try {
    const db = await openDatabase();

    await db.runAsync(`
      UPDATE collectibles
      SET 
        payment_type = ?,
        cheque_number = ?,
        amount_paid = ?,
        creditors_name = ?,
        is_printed = 1,
        remaining_balance = remaining_balance - ?
      WHERE account_number = ? AND period_id = ?
    `, [payment_type, cheque_number, amount_paid, creditors_name, amount_paid, account_number, period_id]);

    console.log('Collectible updated successfully.');
  } catch (error) {
    console.error('Error updating collectible:', error);
    throw error;
  }
};
export const updateAll = async () => {
  try {
    const db = await openDatabase();

    await db.runAsync(`
      UPDATE collectibles
      SET
        is_printed = 1

      WHERE is_printed = 0
      `);
  } catch (e) {
    console.error('Error updating collectible:', e);
  }
}
