import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import TrackCategory from '@/models/TrackCategory';

export async function GET() {
    try {
        await connectMongo();
        let categories = await TrackCategory.find({});
        
        if (categories.length === 0) {
            await TrackCategory.insertMany([
                { name: 'CODING' },
                { name: 'RESEARCH' }
            ]);
            categories = await TrackCategory.find({});
        }
        
        console.log(`API [GET] /api/admin/tracks/categories: Found ${categories.length} categories.`);
        return NextResponse.json(categories, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: 'Error fetching track categories' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectMongo();
        const { name } = await req.json();
        
        const existing = await TrackCategory.findOne({ name: name.toUpperCase() });
        if (existing) {
            return NextResponse.json({ message: 'Category already exists' }, { status: 400 });
        }
        
        const category = await TrackCategory.create({ name: name.toUpperCase() });
        return NextResponse.json(category, { status: 201 });
    } catch (err) {
        return NextResponse.json({ message: 'Error creating category' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await connectMongo();
        const { id, name } = await req.json();
        const category = await TrackCategory.findByIdAndUpdate(id, { name: name.toUpperCase() }, { new: true });
        return NextResponse.json(category, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: 'Error updating category' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await connectMongo();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        await TrackCategory.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Category deleted' }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: 'Error deleting category' }, { status: 500 });
    }
}
