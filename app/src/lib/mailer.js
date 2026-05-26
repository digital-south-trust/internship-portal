import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Internship Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Email Error:', error);
    throw error;
  }
}

export async function sendMeetingReminder({ to, recipientName, date, time, meetingLink, description }) {
  const subject = `${description}: Internship Meeting`;
  const dateStr = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="background: #f1f5f9; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Meeting Reminder</span>
            </div>
            <h2 style="color: #000; margin-bottom: 16px; font-size: 24px; font-weight: 800; text-align: center;">${description}</h2>
            <p>Hi <strong>${recipientName}</strong>,</p>
            <p>This is a reminder for your upcoming internship meeting.</p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #f1f5f9;">
                <p style="margin: 8px 0; display: flex; align-items: center;"><strong>📅 Date:</strong> &nbsp; ${dateStr}</p>
                <p style="margin: 8px 0; display: flex; align-items: center;"><strong>⏰ Time:</strong> &nbsp; ${time}</p>
            </div>
            <div style="text-align: center; margin-top: 32px; margin-bottom: 24px;">
                <a href="${meetingLink}" style="display: inline-block; padding: 14px 32px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">Join Meeting Now</a>
            </div>
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 20px;">
                Please ensure you join exactly at the scheduled time. If the button above doesn't work, use this link: <br/>
                <a href="${meetingLink}" style="color: #4f46e5;">${meetingLink}</a>
            </p>
        </div>
    `;

  return sendEmail(to, subject, html);
}

export async function sendMissedMeetingWarning({ to, internName, warningCount }) {
  const subject = `⚠️ Warning: Missed Internship Meeting (${warningCount}/3)`;

  let message = `We noticed you missed your scheduled weekly review meeting today.`;
  if (warningCount >= 3) {
    message = `This is your 3rd missed meeting. As per our policy, your internship has been <strong>terminated</strong> effective immediately.`;
  } else {
    message += ` Note that after 3 missed meetings, your internship will be automatically terminated. This is warning <strong>${warningCount}/3</strong>.`;
  }

  const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="background: #fef2f2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #ef4444; border: 1px solid #fee2e2;">URGENT NOTIFICATION</span>
            </div>
            <h2 style="color: #000; margin-bottom: 16px; font-size: 24px; font-weight: 800; text-align: center;">${warningCount >= 3 ? 'Internship Terminated' : 'Missed Meeting Warning'}</h2>
            <p>Hi <strong>${internName}</strong>,</p>
            <p style="line-height: 1.6;">${message}</p>
            <p style="margin-top: 24px;">Please ensure you attend all future scheduled meetings to avoid termination.</p>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="font-size: 12px; color: #64748b;">This is an automated system notification from the Internship Portal.</p>
            </div>
        </div>
    `;

  return sendEmail(to, subject, html);
}

export async function sendSelectionEmail(to, candidateName) {
  const subject = '🎉 Congratulations! You Have Been Selected for the Internship Program';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dcfce7; border-radius: 12px; padding: 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: #f0fdf4; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #16a34a; border: 1px solid #dcfce7;">SELECTION CONFIRMED</span>
      </div>
      <h2 style="color: #000; margin-bottom: 16px; font-size: 28px; font-weight: 800; text-align: center;">You're In! 🚀</h2>
      <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${candidateName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">We're thrilled to inform you that you have been <strong>selected</strong> for our internship program based on your exceptional performance in the assessment!</p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #22c55e;">
        <h3 style="color: #16a34a; margin-top: 0;">Next Steps:</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li style="margin: 8px 0;">Complete your profile with personal and educational details</li>
          <li style="margin: 8px 0;">Upload required documents (Passport photo, Aadhar card)</li>
          <li style="margin: 8px 0;">Verify your identity via DigiLocker</li>
          <li style="margin: 8px 0;">Access the internship portal and begin your journey</li>
        </ol>
      </div>

      <p style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://internship.digitalsouth.co.in'}/login" style="display: inline-block; padding: 14px 32px; background-color: #22c55e; color: #fff; text-decoration: none; font-weight: bold; border-radius: 12px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);">
          Login to Your Dashboard
        </a>
      </p>

      <p style="font-size: 14px; color: #64748b; margin-top: 32px; text-align: center;">We look forward to working with you!</p>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-size: 12px; color: #64748b;">This is an automated notification from the Internship Portal.</p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendRejectionEmail(to, candidateName) {
  const subject = 'Internship Program Assessment Result';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: #fef2f2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #dc2626; border: 1px solid #fecaca;">ASSESSMENT UPDATE</span>
      </div>
      <h2 style="color: #000; margin-bottom: 16px; font-size: 24px; font-weight: 800; text-align: center;">Assessment Decision</h2>
      <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${candidateName}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">Thank you for taking our internship eligibility assessment. Unfortunately, we are unable to move forward with your application at this time.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444;">
        <h3 style="color: #dc2626; margin-top: 0;">What's Next?</h3>
        <p style="margin: 0;">We encourage you to:</p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li style="margin: 6px 0;">Review the assessment topics and strengthen your knowledge</li>
          <li style="margin: 6px 0;">Keep an eye on future internship opportunities</li>
          <li style="margin: 6px 0;">Feel free to reach out if you have any questions</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px; text-align: center;">We appreciate your interest and wish you the very best in your future endeavors!</p>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-size: 12px; color: #64748b;">This is an automated notification from the Internship Portal.</p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}
export async function sendOTPEmail(to, otp) {
  const subject = '🔐 Verify Your Identity: Internship Portal OTP';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #edf2f7; border-radius: 12px; padding: 40px; color: #1a202c; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="background: #ebf4ff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; color: #2b6cb0;">SECURITY VERIFICATION</span>
      </div>
      <h2 style="color: #000000; margin-bottom: 20px; font-size: 26px; font-weight: 800; text-align: center;">Verify Your Account</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #4a5568; text-align: center; margin-bottom: 30px;">Use the code below to complete your registration. This code will expire in 10 minutes.</p>
      
      <div style="background-color: #f7fafc; padding: 24px; border-radius: 16px; margin: 30px 0; text-align: center; border: 2px dashed #e2e8f0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #000000;">${otp}</span>
      </div>

      <p style="font-size: 14px; color: #718096; text-align: center; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
      <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #edf2f7; text-align: center;">
        <p style="font-size: 12px; color: #a0aec0;">Digital South Internship Program • India</p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}

export async function sendAmbassadorOfferLetter({ to, ambassadorName, referralCode, password }) {
    const subject = '🎉 Welcome to the Ambassador Program: Your Official Offer Letter';
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fde68a; border-radius: 12px; padding: 24px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background: #fffbeb; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #b45309; border: 1px solid #fde68a;">OFFICIAL APPOINTMENT</span>
        </div>
        <h2 style="color: #000; margin-bottom: 16px; font-size: 28px; font-weight: 800; text-align: center;">Welcome, Ambassador! 👑</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${ambassadorName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">We are excited to officially appoint you as a <strong>Growth Ambassador</strong> for our Digital South Internship Program!</p>
        
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #b45309; margin-top: 0;">Your Credentials:</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>📧 Login Email:</strong> ${to}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>🔑 Temporary Password:</strong> <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
          <p style="margin: 12px 0; font-size: 14px;"><strong>🎫 Unique Referral Code:</strong> <span style="font-size: 20px; font-weight: 900; color: #000; letter-spacing: 2px; text-transform: uppercase;">${referralCode}</span></p>
        </div>
  
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0;">
          <h3 style="color: #0f172a; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Program Highlights:</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
            <li style="margin: 6px 0;">Earn commission for every successful intern you recruit.</li>
            <li style="margin: 6px 0;">Provide exclusive discounts to candidates using your code.</li>
            <li style="margin: 6px 0;">Access your dedicated performance dashboard to track joins and earnings.</li>
          </ul>
        </div>
  
        <p style="text-align: center; margin-top: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://internship.digitalsouth.co.in'}/login" style="display: inline-block; padding: 14px 32px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            Access Ambassador Dashboard
          </a>
        </p>
  
        <p style="font-size: 14px; color: #64748b; margin-top: 32px; text-align: center;">We are thrilled to have you lead our expansion efforts!</p>
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 12px; color: #64748b;">This is a formal appointment letter from the Digital South Recruitment Hub.</p>
        </div>
      </div>
    `;
  
    return sendEmail(to, subject, html);
  }

export async function sendMeetingCancellation({ to, internName, date, time, description }) {
  const subject = `❌ CANCELLED: ${description} — Internship Meeting`;
  const dateStr = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; padding: 24px; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="background: #fef2f2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #ef4444; text-transform: uppercase;">Meeting Cancelled</span>
            </div>
            <h2 style="color: #000; margin-bottom: 16px; font-size: 24px; font-weight: 800; text-align: center;">Update: Session Cancelled</h2>
            <p>Hi <strong>${internName}</strong>,</p>
            <p>Please note that your scheduled internship meeting has been <strong>cancelled</strong> by the administrator.</p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #f1f5f9; text-decoration: line-through; opacity: 0.6;">
                <p style="margin: 8px 0;"><strong>🏢 Session:</strong> &nbsp; ${description}</p>
                <p style="margin: 8px 0;"><strong>📅 Date:</strong> &nbsp; ${dateStr}</p>
                <p style="margin: 8px 0;"><strong>⏰ Time:</strong> &nbsp; ${time}</p>
            </div>
            <p style="line-height: 1.6;">If this was a required weekly review, a new slot will be scheduled for you shortly. Please check your dashboard for updates.</p>
            <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://internship.digitalsouth.co.in'}/dashboard/schedule" style="display: inline-block; padding: 12px 24px; background-color: #f1f5f9; color: #000; text-decoration: none; font-weight: bold; border-radius: 8px;">View Updated Schedule</a>
            </div>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="font-size: 12px; color: #64748b;">This is an automated system notification from the Internship Portal.</p>
            </div>
        </div>
    `;

  return sendEmail(to, subject, html);
}

export async function sendManualCredentialEmail({ to, recipientName, password, role }) {
  const subject = `🔐 Your Account Credentials - Internship Portal`;
  const roleName = role === 'admin' ? 'Administrator' : 'Intern Candidate';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: #f1f5f9; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Portal Access Credentials</span>
      </div>
      <h2 style="color: #000; margin-bottom: 16px; font-size: 24px; font-weight: 800; text-align: center;">Account Created Successfully</h2>
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>An administrator has manually created your account as an <strong>${roleName}</strong> on the Internship Portal.</p>
      <p>Here are your access credentials to login:</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #f1f5f9;">
        <p style="margin: 8px 0; font-size: 14px;"><strong>📧 Login Email:</strong> ${to}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>🔑 Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${password}</code></p>
      </div>
      
      <p style="text-align: center; margin-top: 32px; margin-bottom: 24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://internship.digitalsouth.co.in'}/login" style="display: inline-block; padding: 14px 32px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">Log In Now</a>
      </p>
      
      <p style="font-size: 13px; color: #64748b; text-align: center; line-height: 1.6;">
        For security purposes, we recommend changing your password immediately after logging in.
      </p>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from the Digital South Internship Program.</p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
}
