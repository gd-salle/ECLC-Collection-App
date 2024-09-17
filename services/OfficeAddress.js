import { openDatabase } from './Database';

// Fetch the office address, return an empty object if not found
export const fetchOfficeAddress = async () => {
    try {
        const db = await openDatabase();
        const address = await db.getFirstAsync(`
            SELECT id, name FROM office_address WHERE id = 1
        `);

        // Ensure we return an empty object if no address is found
        console.log('TEST:',address)
        return address || { id: 1, name: '' };
    } catch (e) {
        console.error('Error fetching office address:', e);
        throw e;
    }
};

// Update the office address
export const updateAddress = async (name) => {
    try {
        const db = await openDatabase();
        await db.runAsync(`
            UPDATE office_address
            SET name = ? WHERE id = 1
        `, [name]);
    } catch (e) {
        console.error('Error updating office address:', e);
        throw e;
    }
};

// Add a new office address
export const addAddress = async (name) => {
    try {
        const db = await openDatabase();
        await db.runAsync(`
            INSERT INTO office_address (name) VALUES (?)
        `, [name]);
    } catch (e) {
        console.error('Error adding office address:', e);
        throw e;
    }
};
