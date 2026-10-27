import Track from './models/Track.js';
import TrackCategory from './models/TrackCategory.js';
import mongoose from 'mongoose';

async function check() {
    try {
        const uri = process.env.mongo_uri || process.env.MONGODB_URI; 
        if (!uri) {
            console.error('Please set mongo_uri or MONGODB_URI in your environment');
            process.exit(1);
        }
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
