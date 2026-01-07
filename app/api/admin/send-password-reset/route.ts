import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/schema";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Resend } from "resend";

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

// Generate a secure reset token using Web Crypto API (Edge Runtime compatible)
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint32Array(64);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(randomValues[i] % chars.length);
  }
  return token;
}

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { email, adminInitiated = false } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    // Find the team member by email to get their name
    let firstName = "User";
    let memberId = null;

    if (db) {
      try {
        const teamMembersRef = collection(db, COLLECTIONS.TEAM_MEMBERS);
        const q1 = query(teamMembersRef, where("emailPrimary", "==", email));
        const snapshot1 = await getDocs(q1);
        
        if (!snapshot1.empty) {
          const memberData = snapshot1.docs[0].data();
          firstName = memberData.firstName || "User";
          memberId = snapshot1.docs[0].id;
        } else {
          // Try email field
          const q2 = query(teamMembersRef, where("email", "==", email));
          const snapshot2 = await getDocs(q2);
          
          if (!snapshot2.empty) {
            const memberData = snapshot2.docs[0].data();
            firstName = memberData.firstName || "User";
            memberId = snapshot2.docs[0].id;
          }
        }
      } catch (queryError: any) {
        console.error("Error querying team members:", queryError);
      }
    }

    // Generate password reset link using Firebase Admin SDK
    // The link will use Firebase's default action URL, but we send it in our branded email
    // Users can also be directed to our custom /auth/action page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const actionCodeSettings = {
      // This URL is where users go AFTER completing the reset on Firebase's page
      // To use fully custom page, configure Action URL in Firebase Console → Authentication → Templates
      url: `${baseUrl}/sign-in?resetComplete=true`,
      handleCodeInApp: false,
    };

    let resetLink: string;
    try {
      resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
    } catch (authError: any) {
      if (authError.code === "auth/user-not-found") {
        // For security, don't reveal if user exists or not
        return NextResponse.json({
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        });
      }
      throw authError;
    }

    // Send branded email using Resend
    if (resend) {
      const emailContent = generatePasswordResetEmail(firstName, resetLink, 24);
      
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Strategic Value+ <noreply@strategicvalueplus.com>",
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (error) {
        console.error("Resend error:", error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log(`Branded password reset email sent to ${email} (${firstName}, ID: ${memberId || 'unknown'}), Resend ID: ${data?.id}`);
    } else {
      // Fallback: Log the reset link (for development/testing)
      console.warn("Resend not configured. Password reset link:", resetLink);
      console.log(`Password reset requested for ${email} (${firstName}, ID: ${memberId || 'unknown'})`);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${email}`,
      note: resend ? "Branded email sent via Resend" : "Email service not configured - check server logs for reset link",
    });

  } catch (error: any) {
    console.error("Password reset error:", error);
    
    if (error?.code === "auth/invalid-email") {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    
    if (error?.code === "auth/too-many-requests") {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    return NextResponse.json({ 
      error: "Failed to send password reset email",
      details: error?.message || "Unknown error",
      code: error?.code || "UNKNOWN"
    }, { status: 500 });
  }
}
