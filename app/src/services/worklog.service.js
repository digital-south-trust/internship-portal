import Worklog from '../models/Worklog.js';
import User from '../models/User.js';
import dbConnect from '../lib/mongodb.js';

// Helper to get IST date string (YYYY-MM-DD)
export const getISTDateString = (date = new Date()) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get previous day's IST date string (YYYY-MM-DD)
export const getPreviousISTDateString = () => {
    const today = new Date();
    const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
    const yesterday = new Date(utc + (3600000 * 5.5) - (24 * 60 * 60 * 1000));
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const WorklogService = {
    /**
     * Submit today's worklog for an intern.
     */
    async submitWorklog(userId, worklogData) {
        await dbConnect();
        const todayStr = getISTDateString();

        // Check if already submitted today
        const existing = await Worklog.findOne({ userId, date: todayStr });
        if (existing) {
            throw new Error("You have already submitted a worklog for today.");
        }

        const newLog = new Worklog({
            userId,
            date: todayStr,
            content: worklogData.content,
            links: worklogData.links || [],
            status: 'Present'
        });

        await newLog.save();
        return newLog.toObject();
    },

    /**
     * Get history of worklogs and attendance percentage for an intern.
     */
    async getInternHistory(userId) {
        await dbConnect();
        const logs = await Worklog.find({ userId }).sort({ date: -1 }).lean();

        const totalLogs = logs.length;
        const presentLogs = logs.filter(l => l.status === 'Present').length;
        const attendancePercentage = totalLogs > 0 
            ? Math.round((presentLogs / totalLogs) * 100) 
            : 0;

        return {
            logs,
            attendancePercentage
        };
    },

    /**
     * Get today's worklogs status of all active interns.
     */
    async getAdminTodayLogs(search = '', filter = 'All') {
        await dbConnect();
        const todayStr = getISTDateString();

        // Find all active interns
        const activeInterns = await User.find({
            role: 'intern',
            status: { $in: ['ACTIVE', 'Active', 'VERIFIED', 'SELECTED'] }
        }).select('fullName email track status').lean();

        // Find all worklogs for today
        const todayLogs = await Worklog.find({ date: todayStr }).lean();
        const logsMap = new Map(todayLogs.map(l => [l.userId.toString(), l]));

        let result = activeInterns.map(intern => {
            const log = logsMap.get(intern._id.toString());
            return {
                intern,
                filled: !!log,
                worklog: log || null
            };
        });

        // Apply filters
        if (filter === 'Filled') {
            result = result.filter(r => r.filled);
        } else if (filter === 'Not Filled') {
            result = result.filter(r => !r.filled);
        }

        // Apply search by name
        if (search.trim() !== '') {
            const searchRegex = new RegExp(search.trim(), 'i');
            result = result.filter(r => searchRegex.test(r.intern.fullName));
        }

        return result;
    },

    /**
     * Get master list of interns with their attendance percentage.
     */
    async getAdminInternsList(search = '') {
        await dbConnect();
        
        const query = {
            role: 'intern',
            status: { $in: ['ACTIVE', 'Active', 'VERIFIED', 'SELECTED'] }
        };

        if (search.trim() !== '') {
            query.fullName = { $regex: new RegExp(search.trim(), 'i') };
        }

        const interns = await User.find(query).select('fullName email track status').lean();

        // Fetch histories to calculate attendance percentage for each
        const result = await Promise.all(interns.map(async (intern) => {
            const { attendancePercentage } = await this.getInternHistory(intern._id);
            return {
                ...intern,
                attendancePercentage
            };
        }));

        return result;
    },

    /**
     * Get details of a specific worklog by ID along with owner's attendance percentage.
     */
    async getWorklogDetails(worklogId) {
        await dbConnect();
        const worklog = await Worklog.findById(worklogId).populate('userId', 'fullName email track status').lean();
        if (!worklog) return null;

        const { attendancePercentage } = await this.getInternHistory(worklog.userId._id);
        return {
            worklog,
            attendancePercentage
        };
    },

    /**
     * Cron Job function: Evaluate daily attendance for the previous day.
     * Finds active interns without a worklog for yesterday and marks them 'Absent'.
     */
    async evaluateDailyAttendance() {
        await dbConnect();
        const yesterdayStr = getPreviousISTDateString();

        // 1. Get all active interns
        const activeInterns = await User.find({
            role: 'intern',
            status: { $in: ['ACTIVE', 'Active', 'VERIFIED', 'SELECTED'] }
        }).select('_id').lean();

        if (activeInterns.length === 0) return { count: 0, message: "No active interns found." };

        // 2. Get all worklogs for yesterday
        const yesterdayLogs = await Worklog.find({ date: yesterdayStr }).select('userId').lean();
        const yesterdayUserIds = new Set(yesterdayLogs.map(l => l.userId.toString()));

        // 3. Find interns who did NOT submit a worklog for yesterday
        const absentLogs = [];
        for (const intern of activeInterns) {
            if (!yesterdayUserIds.has(intern._id.toString())) {
                absentLogs.push({
                    userId: intern._id,
                    date: yesterdayStr,
                    content: '',
                    links: [],
                    status: 'Absent'
                });
            }
        }

        // 4. Bulk insert if there are any absences to record
        if (absentLogs.length > 0) {
            // Use unordered insertion to avoid failing completely on unique index violations (e.g. if rerun)
            await Worklog.insertMany(absentLogs, { ordered: false }).catch(err => {
                console.error("Some daily attendance inserts failed (likely due to duplicates):", err.message);
            });
        }

        return {
            count: absentLogs.length,
            message: `Successfully processed attendance. Marked ${absentLogs.length} interns as Absent for ${yesterdayStr}.`
        };
    }
};
