import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Result from "@/models/Result";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await dbConnect();

        // Get all users who have completed assessment
        const users = await User.find({
            isAssessmentDone: true,
            role: 'intern'
        }).select('_id fullName email track assessmentScore assessmentDate selectionStatus isAssessmentDone status aadhaarCard aadhaarNumber passportPhoto');

        // Get results data
        const results = await Result.find({}).select('user exam score scorePercentage totalQuestions passed');

        // Define the 24h threshold
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Process automatic selection logic for items still in pending status
        for (const user of users) {
             if (user.selectionStatus === 'Pending Selection (24h Buffer)' && user.assessmentScore >= 75) {
                  if (user.assessmentDate && user.assessmentDate < threshold) {
                       // Auto-approve after 24 hours
                       user.selectionStatus = 'Selected';
                       user.status = 'SELECTED';
                       user.isApproved = true;
                       await user.save();
                  }
             }
        }

        // Combine the data
        const assessments = users.map(user => {
            const result = results.find(r => r.user.toString() === user._id.toString());
            
            // Check if user is already accepted/active in the system
            const isAccepted = ['SELECTED', 'PROFILE_PENDING', 'VERIFIED', 'ACTIVE'].includes(user.status);
            const selectionStatus = user.selectionStatus || (isAccepted ? 'Selected' : 'Pending Selection (24h Buffer)');
            
            return {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                track: user.track,
                assessmentScore: user.assessmentScore || 0,
                assessmentDate: user.assessmentDate,
                selectionStatus: selectionStatus,
                scorePercentage: result?.scorePercentage || 0,
                passed: result?.passed || false,
                aadhaarCard: user.aadhaarCard,
                aadhaarNumber: user.aadhaarNumber,
                passportPhoto: user.passportPhoto
            };
        });

        return NextResponse.json({ assessments }, { status: 200 });

    } catch (error) {
        console.error("Get Assessments error:", error);
        return NextResponse.json({ 
            error: 'Failed to fetch assessments',
            details: error.message 
        }, { status: 500 });
    }
}
