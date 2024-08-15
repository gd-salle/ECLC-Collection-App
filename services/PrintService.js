import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import { logo } from '../assets/printLogo'


export const printReceipt = async (data) => {
    const { account_number, name, remaining_balance, payment_type, cheque_number, amount_paid, creditors_name } = data;
    const columnWidths = [15, 18];
    const offset = 8 * 60; // GMT+8 offset in minutes
    const currentDate = new Date(new Date().getTime() + offset * 60 * 1000)
      .toISOString()
      .split('T')[0];

    try {

        const printerWidth = 384; // This can vary slightly depending on the specific printer
        const imageWidth = 150;   // The width you are setting for the image
        const leftOffset = (printerWidth - imageWidth) / 2; // Calculate center position

        // Print the image with manual centering
        await BluetoothEscposPrinter.printPic(logo, { width: imageWidth, left: leftOffset });

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
            ['Amount Paid', amount_paid.toString()],
            {},
        );

        const newBalance = remaining_balance - amount_paid;
        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Balance', newBalance.toString()],
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
