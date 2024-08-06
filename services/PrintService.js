import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

export const printReceipt = async (data) => {
    const { account_number, name, remaining_balance, payment_type, cheque_number, amount_paid, daily_due, creditors_name } = data;
    const columnWidths = [15, 18];
    
    try {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText('EXTRA CASH', { align: 'center' });
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText('LENDING CORPORATION', {});
        await BluetoothEscposPrinter.printText('\r\n', {});

        await BluetoothEscposPrinter.printText('--------------------------------', {});
        await BluetoothEscposPrinter.printText('COLLECTION RECEIPT', {});
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText('--------------------------------', {});


        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        await BluetoothEscposPrinter.printText(`Account No  ${account_number}\r\n`, {});
        await BluetoothEscposPrinter.printText(`Name        ${name}\n`,{});
        
        await BluetoothEscposPrinter.printText('--------------------------------', {});
        await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ['Balance', remaining_balance.toString()],
            {},
        );
        
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
            ['New Balance', newBalance.toString()],
            {},
        );

        
        
        await BluetoothEscposPrinter.printColumn(
            [48],
            [BluetoothEscposPrinter.ALIGN.LEFT],
            ['Signature .....................'],
            {},
        );
        await BluetoothEscposPrinter.printText('\r\n', {});
        await BluetoothEscposPrinter.printText(`Creditors Name ${creditors_name}\n`, {});
        
        await BluetoothEscposPrinter.printText('\r\n\r\n\r\n', {});
    } catch (e) {
        alert(e.message || 'ERROR');
    }
};
