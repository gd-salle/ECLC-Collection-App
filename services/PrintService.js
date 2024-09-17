import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import { logo } from '../assets/printLogo'
import { fetchOfficeAddress } from './OfficeAddress';


export const printReceipt = async (data) => {
    const { account_number, name, remaining_balance, payment_type, cheque_number, amount_paid, creditors_name } = data;
    const columnWidths = [15, 18];
    const offset = 8 * 60; // GMT+8 offset in minutes
    const currentDate = new Date(new Date().getTime() + offset * 60 * 1000)
        .toISOString()
        .split('T')[0];

    // Ensure remaining_balance and amount_paid are numbers
    const balance = typeof remaining_balance === 'number' ? remaining_balance : parseFloat(remaining_balance);
    const amount = typeof amount_paid === 'number' ? amount_paid : parseFloat(amount_paid);

    // Calculate the new balance
    const newBalance = balance - amount;

    // Format the new balance as a currency string with comma separation and two decimal places
    const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    const formattedBalance = new Intl.NumberFormat("en-US", options).format(newBalance);
    const formattedAmountPaid = new Intl.NumberFormat("en-US", options).format(amount);


    try {
        const addressData = await fetchOfficeAddress();
        const address = addressData.name || 'Address Not Available'; // Default if no address is found
        const printerWidth = 384; // This can vary slightly depending on the specific printer
        const imageWidth = 150;   // The width you are setting for the image
        const leftOffset = (printerWidth - imageWidth) / 2; // Calculate center position

        // Print the image with manual centering
        await BluetoothEscposPrinter.printPic(logo, { width: imageWidth, left: leftOffset });
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText(`${address}\n`, {});
        // Print text content
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText('EXTRA CASH\n', {});
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText('LENDING CORPORATION\n', {});
        await BluetoothEscposPrinter.printText('\r\n', {});

        await BluetoothEscposPrinter.printText('--------------------------------', {});
        await BluetoothEscposPrinter.printText('ACKNOWLEDGEMENT', {});
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText('--------------------------------', {});

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        await BluetoothEscposPrinter.printText(`Account Name: ${name}\n`, {});
        await BluetoothEscposPrinter.printText('--------------------------------\n', {});

        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Payment Type', payment_type],
            {},
        );

        if (payment_type === 'Cheque') {
            await BluetoothEscposPrinter.printColumn(
                columnWidths,
                [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
                ['Cheque Number', cheque_number.toString()],
                {},
            );
        }

        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Amount Paid', 'PHP '+formattedAmountPaid.toString()],
            {},
        );

        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Balance', 'PHP '+formattedBalance.toString()],
            {},
        );

        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Date Collected', currentDate],
            {},
        );
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        await BluetoothEscposPrinter.printText('--------------------------------\n', {});
        await BluetoothEscposPrinter.printText(`Collected By:`, {});
        await BluetoothEscposPrinter.printText('\r\n\r\n\r\n\r\n', {});
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText(`____________________`, {});
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText(`${creditors_name}\n\n\n\n`, {});
        await BluetoothEscposPrinter.printText('-\n', {});
    } catch (e) {
        console.error("Printing Error: ", e.message);
        alert(e.message || 'ERROR');
    }
};

export const printAccountHistory = async (data,name) => {
    try {
        const addressData = await fetchOfficeAddress();
        const address = addressData.name || 'Address Not Available'; // Default if no address is found
        const printerWidth = 384; // This can vary slightly depending on the specific printer
        const imageWidth = 150;   // The width you are setting for the image
        const leftOffset = (printerWidth - imageWidth) / 2; // Calculate center position

        // Print the image with manual centering
        await BluetoothEscposPrinter.printPic(logo, { width: imageWidth, left: leftOffset });
        await BluetoothEscposPrinter.printText(`${address}`, {});

        // Print text content
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText('EXTRA CASH\n', {});
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText('LENDING CORPORATION\n', {});
        await BluetoothEscposPrinter.printText('\r\n', {});

        await BluetoothEscposPrinter.printText('--------------------------------', {});
        await BluetoothEscposPrinter.printText('PAYMENT HISTORY', {});
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText('--------------------------------', {});

        // Print the account name (Assuming data.name is the account holder's name)
        const { history } = data;
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        await BluetoothEscposPrinter.printText(`Account Name: ${name}\n`, {});
        await BluetoothEscposPrinter.printText('--------------------------------\n', {});

        // Print the column headers
        await BluetoothEscposPrinter.printColumn(
            [15, 18],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Date', 'Amount Paid'],
            {}, 
        );

        // Iterate over each history entry in the data.history array for date and amount_paid only
        for (const entry of history) {
            const { date, amount_paid } = entry;
            const amount = typeof amount_paid === 'number' ? amount_paid : parseFloat(amount_paid);

            // Format the amount as a currency string with two decimal places
            const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
            const formattedBalance = new Intl.NumberFormat("en-US", options).format(amount);
            const newBalance = 'PHP ' + formattedBalance;

            await BluetoothEscposPrinter.printColumn(
                [15, 18],
                [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
                [date, newBalance],
                {},
            );
        }

        await BluetoothEscposPrinter.printText('\r\n', {}); // Add spacing after the history entries
        await BluetoothEscposPrinter.printText('-------------- END -------------\n\n\n\n', {});
        await BluetoothEscposPrinter.printText('-\n', {});

    } catch (e) {
        console.error("Printing Error: ", e.message);
        alert(e.message || 'ERROR');
    }
};

