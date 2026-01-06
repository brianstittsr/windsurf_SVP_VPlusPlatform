import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/schema";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";

// Professional password reset email template
function generatePasswordResetEmail(
  firstName: string,
  resetLink: string,
  expirationHours: number = 24
): { subject: string; html: string; text: string } {
  const subject = "Reset Your Strategic Value+ Password";
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Strategic Value+</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 12px 12px 0 0;">
              <img src="https://strategicvalueplus.com/VPlus_logo.webp" alt="Strategic Value+" style="height: 60px; width: auto; margin-bottom: 16px;" />
              <h1 style="margin: 0; color: #C8A951; font-size: 24px; font-weight: 600;">Strategic Value+</h1>
              <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Transforming U.S. Manufacturing</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px; font-weight: 600;">Password Reset Request</h2>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Hello ${firstName},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your Strategic Value+ account. Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #C8A951 0%, #a08840 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(200, 169, 81, 0.4);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                This link will expire in <strong>${expirationHours} hours</strong> for security reasons.
              </p>
              
              <p style="margin: 20px 0 0 0; color: #475569; font-size: 14px; line-height: 1.6;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <!-- Alternative Link -->
              <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${resetLink}" style="color: #C8A951; font-size: 13px; text-decoration: none;">${resetLink}</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                  <strong>Security Tip:</strong> Strategic Value+ will never ask for your password via email. If you receive suspicious emails claiming to be from us, please report them to <a href="mailto:support@strategicvalueplus.com" style="color: #92400e;">support@strategicvalueplus.com</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">
                      Strategic Value+
                    </p>
                    <p style="margin: 0 0 15px 0; color: #94a3b8; font-size: 12px;">
                      Empowering manufacturers with strategic solutions
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} Strategic Value+. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0 0;">
                      <a href="https://strategicvalueplus.com" style="color: #C8A951; font-size: 12px; text-decoration: none; margin: 0 10px;">Website</a>
                      <a href="https://www.linkedin.com/company/strategic-value-plus" style="color: #C8A951; font-size: 12px; text-decoration: none; margin: 0 10px;">LinkedIn</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Unsubscribe / Contact -->
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                This is an automated message from Strategic Value+. Please do not reply directly to this email.
                <br />
                For support, contact us at <a href="mailto:support@strategicvalueplus.com" style="color: #64748b;">support@strategicvalueplus.com</a>
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Strategic Value+ - Password Reset Request

Hello ${firstName},

We received a request to reset the password for your Strategic Value+ account.

To reset your password, visit the following link:
${resetLink}

This link will expire in ${expirationHours} hours for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Security Tip: Strategic Value+ will never ask for your password via email. If you receive suspicious emails claiming to be from us, please report them to support@strategicvalueplus.com

---
Strategic Value+
Empowering manufacturers with strategic solutions
© ${new Date().getFullYear()} Strategic Value+. All rights reserved.

This is an automated message. For support, contact us at support@strategicvalueplus.com
  `.trim();

  return { subject, html, text };
}

// Generate a secure reset token
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const { email, adminInitiated = false } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Find the team member by email
    const teamMembersRef = collection(db, COLLECTIONS.TEAM_MEMBERS);
    const q = query(teamMembersRef, where("emailPrimary", "==", email));
    const snapshot = await getDocs(q);

    let firstName = "User";
    let memberId = null;

    if (!snapshot.empty) {
      const memberData = snapshot.docs[0].data();
      firstName = memberData.firstName || "User";
      memberId = snapshot.docs[0].id;
    } else {
      // Try secondary email
      const q2 = query(teamMembersRef, where("emailSecondary", "==", email));
      const snapshot2 = await getDocs(q2);
      if (!snapshot2.empty) {
        const memberData = snapshot2.docs[0].data();
        firstName = memberData.firstName || "User";
        memberId = snapshot2.docs[0].id;
      }
    }

    // Generate reset token and expiration
    const resetToken = generateResetToken();
    const expirationHours = 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    // Store the reset token in Firestore
    const resetTokensRef = collection(db, "passwordResetTokens");
    await addDoc(resetTokensRef, {
      email,
      token: resetToken,
      memberId,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      adminInitiated,
    });

    // Generate the reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.strategicvalueplus.com";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Generate the email content
    const emailContent = generatePasswordResetEmail(firstName, resetLink, expirationHours);

    // Return the email content for sending via your email service
    // In production, you would integrate with SendGrid, AWS SES, or similar
    return NextResponse.json({
      success: true,
      message: `Password reset email prepared for ${email}`,
      emailContent: {
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      },
      resetToken, // Only return in development for testing
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Failed to process password reset" }, { status: 500 });
  }
}
