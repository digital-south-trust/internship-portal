import Track from './models/Track.js';
import TrackCategory from './models/TrackCategory.js';
import mongoose from 'mongoose';

async function check() {
    try {
        const uri = "mongodb+srv://gauthamramum_db_user:1234@cluster0.ptajmsu.mongodb.net/?appName=Cluster0"; 
        console.log('Connecting to DB...');
        await mongoose.connect(uri);
        
        const tracks = await Track.find({});
        const categories = await TrackCategory.find({});
        
        console.log('--- DB CHECK RESULTS ---');
        console.log('Tracks found:', tracks.length);
        console.log('Categories found:', categories.length);
        
        console.log('\n--- TRACK NAMES ---');
        tracks.forEach(t => console.log(`- ${t.name} (${t.category}) [${t.status || 'ACTIVE'}]`));
        
        console.log('\n--- CATEGORY NAMES ---');
        categories.forEach(c => console.log(`- ${c.name}`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
