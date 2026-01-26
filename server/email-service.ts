import type { ContentRequest, IssueReport } from "./storage";

// Email addresses
const ADMIN_EMAIL = "streamvault.live@gmail.com";
// Temporary: Use verified email until SPF records are verified in Resend
const VERIFIED_EMAIL = "yawaraquil121@gmail.com";
// Set to true once all DNS records show "Verified" in Resend dashboard
const DOMAIN_FULLY_VERIFIED = true; // ✅ DNS records verified!

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Email notification function using Resend
async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      // Fallback to console logging if no API key
      console.log("\n" + "=".repeat(60));
      console.log("📧 EMAIL NOTIFICATION (Console Only - No API Key)");
      console.log("=".repeat(60));
      console.log("To:", data.to);
      console.log("Subject:", data.subject);
      console.log("-".repeat(60));
      console.log(data.text);
      console.log("=".repeat(60) + "\n");
      return true;
    }

    // Use verified email until domain SPF records are verified
    const recipientEmail = DOMAIN_FULLY_VERIFIED ? data.to : VERIFIED_EMAIL;
    const fromEmail = DOMAIN_FULLY_VERIFIED
      ? "StreamVault <noreply@streamvault.live>"
      : "StreamVault <onboarding@resend.dev>";

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject: data.subject,
        html: data.html,
        text: data.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Failed to send email via Resend:", error);

      // Log to console as fallback
      console.log("\n📧 Email (failed to send, showing content):");
      console.log("To:", data.to);
      console.log("Subject:", data.subject);
      console.log(data.text);
      return false;
    }

    const result = await response.json();
    console.log("✅ Email sent successfully via Resend");
    console.log("   From:", fromEmail);
    console.log("   To:", recipientEmail);
    if (!DOMAIN_FULLY_VERIFIED) {
      console.log("   ⚠️  Using verified email until SPF records propagate");
      console.log("   📝 Intended recipient:", data.to);
    }
    console.log("   Subject:", data.subject);
    console.log("   Email ID:", result.id);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);

    // Log to console as fallback
    console.log("\n📧 Email (error occurred, showing content):");
    console.log("To:", data.to);
    console.log("Subject:", data.subject);
    console.log(data.text);
    return false;
  }
}

export async function sendContentRequestEmail(request: ContentRequest): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Content Request</title>
</head>
<body style="margin:0; padding:0; background-color:#141414; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#141414;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#1f1f1f; border-radius:8px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px; background-color:#000000;">
              <h1 style="margin:0; color:#E50914; font-size:36px; font-weight:900; letter-spacing:2px; text-transform:uppercase;">STREAMVAULT</h1>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin:0 0 10px 0; color:#ffffff; font-size:24px; font-weight:bold;">New Content Request</h2>
              <p style="margin:0; color:#b3b3b3; font-size:16px;">A user has requested adding a new ${request.contentType}.</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#2a2a2a; border-radius:6px; border:1px solid #333;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin:0 0 5px 0; color:#E50914; font-size:20px; font-weight:bold;">${request.title}</h3>
                    <p style="margin:0 0 20px 0; color:#ffffff; font-size:14px;">${request.year ? request.year + ' • ' : ''}${request.contentType.toUpperCase()}</p>
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      ${request.genre ? `
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px; width: 100px;">Genre</td>
                        <td style="padding: 8px 0; color:#ddd; font-size:14px;">${request.genre}</td>
                      </tr>` : ''}
                      ${request.description ? `
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px; vertical-align: top;">Description</td>
                        <td style="padding: 8px 0; color:#ddd; font-size:14px; line-height: 1.4;">${request.description}</td>
                      </tr>` : ''}
                      ${request.reason ? `
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px; vertical-align: top;">Reason</td>
                        <td style="padding: 8px 0; color:#ddd; font-size:14px; line-height: 1.4;">${request.reason}</td>
                      </tr>` : ''}
                      ${request.email ? `
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px;">Requested By</td>
                        <td style="padding: 8px 0; color:#E50914; font-size:14px;">${request.email}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px;">Total Requests</td>
                        <td style="padding: 8px 0; color:#fff; font-size:14px;"><span style="background:#E50914; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${request.requestCount}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px;">Submitted</td>
                        <td style="padding: 8px 0; color:#ddd; font-size:14px;">${new Date(request.createdAt).toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://streamvault.live/admin" style="display: inline-block; background-color: #E50914; color: #ffffff; padding: 16px 32px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 4px; text-transform: uppercase;">Review in Admin Panel</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px; background-color:#181818; border-top:1px solid #2a2a2a;">
              <p style="margin:0; color:#666; font-size:12px;">© ${new Date().getFullYear()} StreamVault. All rights reserved.</p>
              <p style="margin:5px 0 0; color:#444; font-size:12px;">This is an automated notification sent to the admin team.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `NEW CONTENT REQUEST

Title: ${request.title}
Type: ${request.contentType}
${request.year ? 'Year: ' + request.year : ''}
${request.email ? 'Requested By: ' + request.email : ''}
Request Count: ${request.requestCount}

${request.description ? 'Description: ' + request.description : ''}
${request.reason ? 'Reason: ' + request.reason : ''}

Manage in Admin Panel: https://streamvault.live/admin
`;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `📺 Request: ${request.title}`,
    html,
    text,
  });
}

export async function sendIssueReportEmail(report: IssueReport): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Issue Report</title>
</head>
<body style="margin:0; padding:0; background-color:#141414; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#141414;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#1f1f1f; border-radius:8px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px; background-color:#000000;">
              <h1 style="margin:0; color:#E50914; font-size:36px; font-weight:900; letter-spacing:2px; text-transform:uppercase;">STREAMVAULT</h1>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin:0 0 10px 0; color:#E50914; font-size:24px; font-weight:bold;">⚠️ Issue Reported</h2>
              <p style="margin:0; color:#b3b3b3; font-size:16px;">A user has reported an issue that requires attention.</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#2a2a2a; border-radius:6px; border:1px solid #333;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin:0 0 5px 0; color:#ffffff; font-size:20px; font-weight:bold;">${report.title}</h3>
                    <p style="margin:0 0 20px 0; color:#e5e5e5; font-size:14px; font-weight:bold; letter-spacing: 0.5px;">TYPE: <span style="color:#E50914;">${report.issueType.replace(/_/g, ' ').toUpperCase()}</span></p>
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px; vertical-align: top; width: 100px;">Description</td>
                        <td style="padding: 8px 0; color:#ddd; font-size:14px; line-height: 1.4;">${report.description}</td>
                      </tr>
                      ${report.url ? `
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px; vertical-align: top;">Affected URL</td>
                        <td style="padding: 8px 0; color:#E50914; font-size:14px;"><a href="${report.url}" style="color:#E50914; text-decoration:none;">${report.url}</a></td>
                      </tr>` : ''}
                      ${report.email ? `
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px;">Reported By</td>
                        <td style="padding: 8px 0; color:#ddd; font-size:14px;">${report.email}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px;">Status</td>
                        <td style="padding: 8px 0; color:#fff; font-size:14px;"><span style="background:#333; border: 1px solid #555; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${report.status.toUpperCase()}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color:#888; font-size:14px;">Submitted</td>
                        <td style="padding: 8px 0; color:#ddd; font-size:14px;">${new Date(report.createdAt).toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://streamvault.live/admin" style="display: inline-block; background-color: #E50914; color: #ffffff; padding: 16px 32px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 4px; text-transform: uppercase;">Resolve in Admin Panel</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px; background-color:#181818; border-top:1px solid #2a2a2a;">
              <p style="margin:0; color:#666; font-size:12px;">© ${new Date().getFullYear()} StreamVault. All rights reserved.</p>
              <p style="margin:5px 0 0; color:#444; font-size:12px;">Please prioritize this issue to ensure platform stability.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `NEW ISSUE REPORT

Title: ${report.title}
Type: ${report.issueType}
Status: ${report.status}
${report.email ? 'Reported By: ' + report.email : ''}

Description: ${report.description}
${report.url ? 'URL: ' + report.url : ''}

Manage in Admin Panel: https://streamvault.live/admin
`;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `⚠️ Issue: ${report.title}`,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0; padding:0; background-color:#141414; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#141414;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#1f1f1f; border-radius:8px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 30px; background-color:#000000;">
              <h1 style="margin:0; color:#E50914; font-size:36px; font-weight:900; letter-spacing:2px; text-transform:uppercase;">STREAMVAULT</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h2 style="margin:0 0 10px 0; color:#ffffff; font-size:24px; font-weight:bold;">Reset Your Password</h2>
              <p style="margin:0 0 30px 0; color:#b3b3b3; font-size:16px;">Biometric scan failed? Don't worry. Use the code below to reset your password.</p>
              
              <div style="background-color:#2a2a2a; border:1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <span style="color:#E50914; font-size: 32px; font-weight: bold; letter-spacing: 5px;">${token}</span>
              </div>

              <p style="margin:0 0 10px 0; color:#666; font-size:14px;">This code will expire in 15 minutes.</p>
              <p style="margin:0; color:#666; font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px; background-color:#181818; border-top:1px solid #2a2a2a;">
              <p style="margin:0; color:#666; font-size:12px;">© ${new Date().getFullYear()} StreamVault. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `RESET YOUR PASSWORD
  
Use the code below to reset your password:

${token}

This code will expire in 15 minutes.
If you didn't request this, please ignore this email.
`;

  return sendEmail({
    to: email,
    subject: "🔐 Reset Your Password",
    html,
    text,
  });
}
