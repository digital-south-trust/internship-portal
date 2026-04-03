import dbConnect from './lib/mongodb';
import Track from './models/Track';
import TrackCategory from './models/TrackCategory';

async function check() {
    await dbConnect();
    const tracksCount = await Track.countDocuments({});
    const categoriesCount = await TrackCategory.countDocuments({});
    const allTracks = await Track.find({});
    const allCategories = await TrackCategory.find({});
    
    console.log('Tracks Count:', tracksCount);
    console.log('Categories Count:', categoriesCount);
    console.log('Tracks:', allTracks.map(t => t.name));
    console.log('Categories:', allCategories.map(c => c.name));
    process.exit(0);
}

check();
