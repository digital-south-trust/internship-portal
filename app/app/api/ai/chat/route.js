import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import ChatConversation from '@/models/ChatConversation';
import User from '@/models/User';

export async function GET(req) {
    try {
        await connectMongo();
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const id = searchParams.get('id');

        if (id) {
            const conversation = await ChatConversation.findById(id);
            return NextResponse.json(conversation);
        }

        if (email) {
            const user = await User.findOne({ email });
            if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

            const conversations = await ChatConversation.find({ userId: user._id })
                .sort({ isPinned: -1, updatedAt: -1 })
                .select('title updatedAt isPinned');
            return NextResponse.json(conversations);
        }

        return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectMongo();
        const { message, email, conversationId, history } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                message: "AI Credentials not configured.",
                isSystem: true
            }, { status: 500 });
        }

        const user = await User.findOne({ email });
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        // Rate limit: 50 prompts per user per day
        const DAILY_LIMIT = 50;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayConversations = await ChatConversation.find({
            userId: user._id,
            'messages.timestamp': { $gte: todayStart }
        });

        let todayMessageCount = 0;
        for (const conv of todayConversations) {
            todayMessageCount += conv.messages.filter(
                m => m.role === 'user' && new Date(m.timestamp) >= todayStart
            ).length;
        }

        if (todayMessageCount >= DAILY_LIMIT) {
            return NextResponse.json({
                message: `Daily limit reached (${DAILY_LIMIT} prompts/day). Contact admin for more access.`,
                limitReached: true
            }, { status: 429 });
        }

        let conversation;
        if (conversationId) {
            conversation = await ChatConversation.findById(conversationId);
        }

        if (!conversation) {
            // Generate a clean title from the first message
            const cleanTitle = message
                .replace(/[^a-zA-Z0-9\s]/g, '')
                .trim()
                .split(' ')
                .slice(0, 6)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
            conversation = await ChatConversation.create({
                userId: user._id,
                title: cleanTitle || 'New Chat',
                messages: []
            });
        }

        // Prepare the prompt for the AI
        const systemPrompt = `You are a friendly AI Assistant for Digital South interns. You help them with technical doubts and general questions.

CRITICAL INSTRUCTION: You MUST ONLY respond with a raw JSON object. Do NOT include ANY text, markdown, or code blocks outside the JSON. No "here is your answer", no "certainly". ONLY JSON.

INTERN PROFILE CONTEXT:
- Name: ${user.fullName}
- Track: ${user.track}
- College: ${user.collegeName || 'N/A'}
- Internship Duration: ${user.duration}
- Join Date: ${user.joinDate ? new Date(user.joinDate).toDateString() : 'N/A'}

IMPORTANT RULES:
1. TRACK-BASED CONTEXTUALIZATION: Everything you say MUST be filtered through the lens of the intern's chosen track (${user.track}). 
   - If they ask general or philosophical questions (e.g., "how is life", "what is the meaning of this", "is it hard?"), you MUST relate it back to their track. 
   - Example for Web Development: Talk about the "Web Development Life Cycle", "Front-end vs Back-end balance", or "Debugging complexity".
   - Example for Robotics: Talk about "Robot Life Cycle", "Feedback Loops", etc.
   - Never give a generic human answer. Give a track-expert answer.
2. IDENTITY QUERIES ("Who am I?"): If the intern asks "who am I", "tell me about myself", or similar questions:
   - Provide their Full Name: ${user.fullName}
   - Track: ${user.track}
   - College: ${user.collegeName || 'N/A'}
   - Duration: ${user.duration}
   - Join Date: ${user.joinDate ? new Date(user.joinDate).toDateString() : 'N/A'}
   - Do NOT reveal: Gender, Aadhaar details, address, payment/fess information, or any other private documents. If asked, say it's sensitive information.
3. Understand the user's intent. If they say "hi", "hello", "hey", "how are you", or any casual greeting or general chat, respond naturally and conversationally, keeping the ${user.track} context in mind.
4. For technical questions (coding, debugging, concepts, tools, frameworks, etc.):
   - Provide clear, professional, and concise technical answers.
   - Include relevant documentation links from trusted sources like:
     • GeeksforGeeks (https://www.geeksforgeeks.org/...)
     • W3Schools (https://www.w3schools.com/...)
     • MDN Web Docs (https://developer.mozilla.org/...)
     • Official documentation sites (e.g., https://react.dev, https://nextjs.org/docs, https://docs.python.org, etc.)
   - Format links in markdown: [Link Text](URL)
   - Do NOT generate YouTube video links. Instead suggest what to search on YouTube. Example: "Search YouTube for: 'React hooks tutorial'"
   - Be encouraging and helpful.
5. If the user indicates they didn't understand (e.g., "I didn't quite understand that"):
   - Provide a much more detailed, "classified", and structured explanation.
   - Use headings, bullet points, and numbered lists.
   - Provide at least 2 clear, real-world examples or code snippets from the ${user.track} field.
6. For follow-up questions or clarifications, continue the conversation naturally.
7. If the intern seems confused after multiple attempts, acknowledge that and gently suggest they contact a mentor for 1-on-1 help.
8. IMPORTANT: If the user is asking the SAME question again (or a very similar question with the same meaning), set "repeated" to true in your response.

You MUST respond in this exact JSON format:
{"type": "casual" or "technical", "repeated": true or false, "response": "your response text here"}

- Use "casual" for greetings, general chat, identity queries, thank you messages, goodbyes, etc.
- Use "technical" for any track-specific question, doubt, or problem-solving response.
- Set "repeated" to true ONLY if the user is asking the same or very similar question again.

Always respond with valid JSON. Do NOT wrap in markdown code blocks.`;

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...history.map(h => ({
                role: h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: h.content }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return NextResponse.json({ message: "AI Service Error." }, { status: response.status });
        }

        const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

        // Parse the JSON response from AI
        let aiResponse = rawResponse;
        let responseType = 'technical'; // default to technical
        let isRepeated = false;

        try {
            // Find the first { and last } to extract JSON even if there's surrounding text or markdown blocks
            const firstBrace = rawResponse.indexOf('{');
            const lastBrace = rawResponse.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const jsonString = rawResponse.substring(firstBrace, lastBrace + 1);
                try {
                    const parsed = JSON.parse(jsonString);
                    if (parsed.response) {
                        aiResponse = parsed.response;
                        responseType = parsed.type || 'technical';
                        isRepeated = parsed.repeated === true;
                    }
                } catch (jsonErr) {
                    // Non-greedy fallback for unescaped quotes
                    const match = jsonString.match(/"response"\s*:\s*"(.*)"\s*[},]/s) || jsonString.match(/"response"\s*:\s*"(.*)"/s);
                    if (match?.[1]) {
                        aiResponse = match[1]
                            .replace(/\\"/g, '"')
                            .replace(/\\n/g, '\n')
                            .trim()
                            .replace(/"\s*$/, ''); // Strip potential trailing quote

                        const typeMatch = jsonString.match(/"type"\s*:\s*"(.*?)"/);
                        if (typeMatch?.[1]) responseType = typeMatch[1];
                        isRepeated = jsonString.includes('"repeated": true');
                    }
                }
                // Response already handled in try/catch block above
            }
        } catch (e) {
            console.error("AI Response Parsing Failed:", e);
            aiResponse = rawResponse.replace(/```json|```/g, '').trim();
        }

        // Persist messages
        conversation.messages.push({ role: 'user', content: message });
        conversation.messages.push({ role: 'assistant', content: aiResponse });
        if (responseType === 'technical') {
            conversation.aiResponseCount += 1;
        }
        await conversation.save();

        return NextResponse.json({
            content: aiResponse,
            conversationId: conversation._id,
            aiResponseCount: conversation.aiResponseCount,
            responseType: responseType,
            repeated: isRepeated
        });

    } catch (error) {
        console.error("AI Route Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        await connectMongo();
        const body = await req.json();
        const { conversationId, isResolved, isPinned } = body;

        const updateData = {};
        if (isResolved !== undefined) updateData.isResolved = isResolved;
        if (isPinned !== undefined) updateData.isPinned = isPinned;

        const conversation = await ChatConversation.findByIdAndUpdate(
            conversationId,
            updateData,
            { returnDocument: 'after' }
        );
        return NextResponse.json(conversation);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await connectMongo();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: 'Missing conversation ID' }, { status: 400 });

        await ChatConversation.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Conversation deleted' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
