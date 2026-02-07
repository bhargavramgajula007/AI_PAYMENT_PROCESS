
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_PATH = path.join(__dirname, 'dataProfile.json');

class SimulationEngine extends EventEmitter {
    constructor() {
        super();
        try {
            this.profile = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
        } catch (e) {
            console.error('Failed to load dataProfile.json, using defaults.', e);
            this.profile = { types: { 'PAYMENT': { mean: 100, max: 500, count: 1 } } };
        }
        this.intervalId = null;
        this.isRunning = false;
        this.transactionCount = 0;
        this.blockedCount = 0;
        this.totalVolume = 0;

        // Generate synthetic accounts with metadata
        this.accounts = Array.from({ length: 200 }, (_, i) => ({
            id: `ACCT-${1000 + i}`,
            device_id: `DEV-${Math.floor(Math.random() * 50)}`, // Shared devices create rings
            ip: `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 255)}`,
            asn: 64500 + Math.floor(Math.random() * 20),
            country: ['US', 'GB', 'DE', 'FR', 'SG'][Math.floor(Math.random() * 5)],
            risk_score: Math.random() * 0.3, // Base risk
            kyc_status: Math.random() > 0.1 ? 'VERIFIED' : 'PENDING',
            age_days: Math.floor(Math.random() * 365)
        }));

        // Create some known mule accounts for ring detection
        this.muleAccounts = Array.from({ length: 10 }, (_, i) => ({
            id: `MULE-${100 + i}`,
            device_id: `DEV-MULE-${Math.floor(i / 3)}`, // Mules share devices
            ip: `10.0.0.${i}`,
            asn: 64512,
            country: 'XX',
            risk_score: 0.7 + Math.random() * 0.3,
            kyc_status: 'PENDING',
            age_days: Math.floor(Math.random() * 30)
        }));
    }

    generateTransaction() {
        const types = Object.keys(this.profile.types);
        const type = types[Math.floor(Math.random() * types.length)];
        const stats = this.profile.types[type];

        // Generate amount with some variance
        const amount = Math.max(10, stats.mean * (0.5 + Math.random() * 1.5));

        // Select origin account
        const origin = this.accounts[Math.floor(Math.random() * this.accounts.length)];

        // Destination: sometimes a mule, sometimes random
        const isMuleTarget = Math.random() < 0.05;
        const dest = isMuleTarget
            ? this.muleAccounts[Math.floor(Math.random() * this.muleAccounts.length)]
            : { id: `DEST-${Math.floor(Math.random() * 5000)}`, device_id: null, ip: null };

        // Fraud probability based on amount and destination
        const baseFraudRate = stats.fraudRate || 0.01;
        const isFraud = isMuleTarget ? (Math.random() < 0.6) : (Math.random() < baseFraudRate);

        const tx = {
            transaction_id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type,
            amount: parseFloat(amount.toFixed(2)),
            currency: 'USD',
            nameOrig: origin.id,
            nameDest: dest.id,
            device_id: origin.device_id,
            ip: origin.ip,
            asn: origin.asn,
            country: origin.country,
            vpn_proxy: Math.random() < 0.1,
            new_device: origin.age_days < 7,
            kyc_status: origin.kyc_status,
            account_age_days: origin.age_days,
            isFraud: isFraud ? 1 : 0,
            timestamp: new Date().toISOString()
        };

        this.transactionCount++;
        this.totalVolume += tx.amount;

        return tx;
    }

    start(intervalMs = 1500) {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('Simulation Engine Started...');

        this.intervalId = setInterval(() => {
            const tx = this.generateTransaction();
            this.emit('transaction', tx);
        }, intervalMs);
    }

    injectFraudPattern(patternType) {
        const sharedDevice = `DEV-FRAUD-${Date.now()}`;
        const sharedIp = `10.99.99.${Math.floor(Math.random() * 255)}`;

        if (patternType === 'RING_LOOP') {
            // Create a 3-node fraud ring with shared device
            const a = this.accounts[Math.floor(Math.random() * this.accounts.length)];
            const b = this.muleAccounts[0];
            const c = this.muleAccounts[1];
            const amount = 9800.00;

            setTimeout(() => this.emit('transaction', {
                transaction_id: `TX-FRAUD-${Date.now()}-1`,
                type: 'TRANSFER',
                amount,
                currency: 'USD',
                nameOrig: a.id,
                nameDest: b.id,
                device_id: sharedDevice,
                ip: sharedIp,
                asn: 64512,
                isFraud: 1,
                timestamp: new Date().toISOString()
            }), 100);

            setTimeout(() => this.emit('transaction', {
                transaction_id: `TX-FRAUD-${Date.now()}-2`,
                type: 'TRANSFER',
                amount,
                currency: 'USD',
                nameOrig: b.id,
                nameDest: c.id,
                device_id: sharedDevice,
                ip: sharedIp,
                asn: 64512,
                isFraud: 1,
                timestamp: new Date().toISOString()
            }), 600);

            setTimeout(() => this.emit('transaction', {
                transaction_id: `TX-FRAUD-${Date.now()}-3`,
                type: 'CASH_OUT',
                amount,
                currency: 'USD',
                nameOrig: c.id,
                nameDest: 'MULE-BANK',
                device_id: sharedDevice,
                ip: sharedIp,
                asn: 64512,
                isFraud: 1,
                timestamp: new Date().toISOString()
            }), 1100);
        }

        if (patternType === 'VELOCITY_ABUSE') {
            const origin = this.accounts[0];
            // Rapid fire transactions
            for (let i = 0; i < 5; i++) {
                setTimeout(() => this.emit('transaction', {
                    transaction_id: `TX-VEL-${Date.now()}-${i}`,
                    type: 'CASH_OUT',
                    amount: 4999.00,
                    currency: 'USD',
                    nameOrig: origin.id,
                    nameDest: `MULE-${100 + i}`,
                    device_id: origin.device_id,
                    ip: origin.ip,
                    isFraud: 1,
                    timestamp: new Date().toISOString()
                }), i * 200);
            }
        }

        if (patternType === 'NO_TRADE_FRAUD') {
            const origin = this.accounts[Math.floor(Math.random() * 10)];
            const amount = 25000 + Math.random() * 10000;

            this.emit('transaction', {
                transaction_id: `TX-NTF-${Date.now()}`,
                type: 'TRANSFER',
                amount: parseFloat(amount.toFixed(2)),
                currency: 'USD',
                nameOrig: origin.id,
                nameDest: 'MULE-100',
                device_id: origin.device_id,
                ip: origin.ip,
                vpn_proxy: true,
                new_device: true,
                isFraud: 1,
                timestamp: new Date().toISOString()
            });
        }
    }

    getStats() {
        return {
            transactionCount: this.transactionCount,
            blockedCount: this.blockedCount,
            totalVolume: this.totalVolume,
            isRunning: this.isRunning
        };
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.isRunning = false;
        console.log('Simulation Engine Stopped.');
    }
}

export const simulation = new SimulationEngine();
