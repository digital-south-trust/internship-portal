
import { Octokit } from "octokit";
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get('url');

    if (!repoUrl) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    try {
        // Extract owner and repo from URL (e.g., https://github.com/owner/repo)
        const parts = repoUrl.replace('https://github.com/', '').split('/');
        const owner = parts[0];
        const repo = parts[1];

        if (!owner || !repo) {
            return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
        }

        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });

        // Get code frequency stats
        const response = await octokit.request('GET /repos/{owner}/{repo}/stats/code_frequency', {
            owner,
            repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        // GitHub API might return 202 if stats are still being computed
        if (response.status === 202) {
            return NextResponse.json({ message: "Computing stats...", status: 202 });
        }

        return NextResponse.json(response.data);
    } catch (error) {
        console.error("GitHub API Error:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub stats" }, { status: 500 });
    }
}
