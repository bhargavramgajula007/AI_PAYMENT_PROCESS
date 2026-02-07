
import fs from 'fs';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_FILE = path.join(__dirname, '../../archive/PS_20174392719_1491204439457_log.csv');
const OUTPUT_FILE = path.join(__dirname, '../data/dataProfile.json');

const stats = {
    types: {},
    fraudPatterns: [],
    legitPatterns: [],
    accountBehavior: {}
};

console.log('Starting analysis of PaySim dataset...');


const finish = () => {
    console.log('\nAnalysis complete.');

    // Calculate means
    Object.keys(stats.types).forEach(type => {
        const s = stats.types[type];
        s.mean = s.totalAmount / s.count;
        s.fraudRate = s.fraudCount / s.count;
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2));
    console.log(`Profile saved to ${OUTPUT_FILE}`);
    process.exit(0);
};

const stream = fs.createReadStream(INPUT_FILE)
    .pipe(csv());

let count = 0;
const MAX_ROWS = 500000; // Analyze first 500k rows for speed (sufficient for distribution)

stream.on('data', (row) => {
    if (count >= MAX_ROWS) {
        stream.destroy();
        finish();
        return;
    }
    count++;

    const amount = parseFloat(row.amount);
    const type = row.type;
    const isFraud = row.isFraud === '1';

    // 1. Transaction Type Stats
    if (!stats.types[type]) {
        stats.types[type] = { count: 0, totalAmount: 0, min: Infinity, max: -Infinity, fraudCount: 0 };
    }

    const s = stats.types[type];
    s.count++;
    s.totalAmount += amount;
    s.min = Math.min(s.min, amount);
    s.max = Math.max(s.max, amount);
    if (isFraud) s.fraudCount++;

    // 2. Extract Fraud Examples (for ring generation)
    if (isFraud && stats.fraudPatterns.length < 50) {
        stats.fraudPatterns.push({
            type,
            amount,
            nameOrig: row.nameOrig,
            nameDest: row.nameDest,
            oldbalanceOrg: parseFloat(row.oldbalanceOrg),
            newbalanceOrig: parseFloat(row.newbalanceOrig)
        });
    }

    // 3. Extract Legit Examples
    if (!isFraud && stats.legitPatterns.length < 50 && Math.random() < 0.01) {
        stats.legitPatterns.push({
            type,
            amount,
            nameOrig: row.nameOrig,
            nameDest: row.nameDest
        });
    }

    if (count % 50000 === 0) process.stdout.write(`Processed ${count} rows...\r`);
});

stream.on('end', finish);

stream.on('error', (err) => {
    console.error('Error reading CSV:', err.message);
});
