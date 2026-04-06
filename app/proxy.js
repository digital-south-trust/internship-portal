import { NextResponse } from 'next/server';

export async function proxy(request) {
    const { pathname } = request.nextUrl;

    // Allow static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Since Edge middleware cannot read localStorage directly (which the app currently uses),
    // we use a cookie-based check as a fallback exactly as requested.
    // NOTE: True auto-redirect is primarily handled via client-side useEffect hooks on the login/register pages.
    const userRole = request.cookies.get('userRole')?.value;
    const userEmail = request.cookies.get('userEmail')?.value;

    // Public pages that anyone can access (Login, Register, Root, Home)
    const publicPaths = ['/login', '/internship/register', '/', '/internship', '/internship/verify-otp'];
    
    // Auth-related API routes that must always be accessible
    const publicApiPaths = ['/api/login', '/api/register', '/api/auth/verify-otp', '/api/user/me', '/api/tracks', '/api/ambassador'];

    if (publicApiPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    if (userRole === 'admin') {
        // Admins can access anything except public auth pages
        if (publicPaths.includes(pathname)) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.next();
    }

    // Role-based protection for /admin
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Intern Workflow Logic
    if (userRole === 'intern' && userEmail) {
        try {
            const origin = request.nextUrl.origin;
            const res = await fetch(`${origin}/api/user/me?email=${encodeURIComponent(userEmail)}`, {
                headers: { 'Cookie': request.headers.get('cookie') || '' }
            });

            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const user = await res.json();
                    const status = user.status;

                    if (status === 'Terminated') {
                        if (pathname !== '/login') return NextResponse.redirect(new URL('/login?error=terminated', request.url));
                        return NextResponse.next();
                    }

                    // Status-based route mapping
                    const roadmap = {
                        'OTP_VERIFIED': '/assessment',
                        'ASSESSMENT_COMPLETED': '/internship/result-pending',
                        'SELECTED': '/dashboard/complete-profile',
                        'PROFILE_PENDING': '/dashboard/complete-profile',
                        'REJECTED': '/internship/rejected',
                        'VERIFIED': '/dashboard/complete-profile?step=verification',
                        'ACTIVE': '/dashboard'
                    };

                    const targetPath = roadmap[status] || '/login';
                    
                    const isAllowed = (path) => {
                        if (status === 'OTP_VERIFIED' && path === '/assessment') return true;
                        if (status === 'ASSESSMENT_COMPLETED' && path === '/internship/result-pending') return true;
                        if (status === 'REJECTED' && path === '/internship/rejected') return true;
                        if (status.includes('SELECTED') || status.includes('PENDING') || status === 'VERIFIED') {
                            if (path.startsWith('/dashboard/complete-profile')) return true;
                        }
                        if (status === 'ACTIVE' && path.startsWith('/dashboard')) return true;
                        return false;
                    };

                    if (!isAllowed(pathname)) {
                        if (pathname === targetPath) return NextResponse.next();
                        if (pathname.startsWith('/dashboard') || pathname === '/assessment' || pathname === '/internship/verify-otp' || publicPaths.includes(pathname)) {
                             return NextResponse.redirect(new URL(targetPath + (status === 'NEW' ? `?email=${encodeURIComponent(userEmail)}` : ''), request.url));
                        }
                    }
                    return NextResponse.next();
                } else {
                    console.error('Proxy Error: Received non-JSON response from /api/user/me');
                    return NextResponse.next();
                }
            } else {
                console.error(`Proxy Error: /api/user/me returned ${res.status}`);
                return NextResponse.next();
            }
        } catch (err) {
            console.error('Middleware Error:', err);
            return NextResponse.next();
        }
    } // <-- RESTORED MISSING BRACE

    // Ambassador Workflow Logic
    if (userRole === 'ambassador') {
        if (pathname.startsWith('/ambassador') || publicPaths.includes(pathname)) {
            return NextResponse.next();
        }
        // If they try to access standard intern/admin routes, force them back to their portal
        return NextResponse.redirect(new URL('/ambassador/dashboard', request.url));
    }

    if (!publicPaths.includes(pathname)) {
        // Not logged in and trying to access a protected route
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
