import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple .env parser
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
});

import dbConnect from './lib/mongodb.js';
import User from './models/User.js';
import Ambassador from './models/Ambassador.js';

async function check() {
    await dbConnect();
    const ambassadors = await Ambassador.find({});
    console.log("--- AMBASSADORS ---");
    ambassadors.forEach(a => {
        console.log(`ID: ${a._id}, Name: ${a.fullName}, Code: "${a.referralCode}", Count: ${a.userCount}`);
    });

    const allUsers = await User.find({});
    console.log(`\nTotal Users: ${allUsers.length}`);

    const usersWithCodes = await User.find({ referralCodeUsed: { $ne: null } });
    console.log("\n--- USERS WITH REFERRAL CODES ---");
    usersWithCodes.forEach(u => {
        console.log(`Name: ${u.fullName}, Code Used: "${u.referralCodeUsed}"`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
