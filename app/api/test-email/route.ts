import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #e94560 0%, #1a1a2e 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { padding: 30px; background: white; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button { display: inline-block; padding: 12px 24px; background: #e94560; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Test Email from Zenthium</h1>
      <p style="font-size: 18px; margin-top: 10px;">PDF Letterhead System Active</p>
    </div>
    
    <div class="content">
      <p>Hello Brian,</p>
      
      <p>This is a test email from the Zenthium Data Center Partnership system. The email notification functionality is now working!</p>
      
      <div class="highlight">
        <h3 style="margin-top: 0; color: #e94560;">What was just implemented:</h3>
        <ul>
          <li>✅ PDF letterhead generation with SVP branding</li>
          <li>✅ "I'm Interested" / "Not Interested" response buttons</li>
          <li>✅ Automatic email notifications to SVP team</li>
          <li>✅ Submitter notifications when partners respond</li>
          <li>✅ Status tracking and history</li>
        </ul>
      </div>
      
      <p>The system will now automatically notify the entire SVP team when a data center partner responds to a letterhead:</p>
      
      <ul>
        <li>Brian Stitt (bstitt@strategicvalueplus.com)</li>
        <li>Nelinia Varenas (nelinia@strategicvalueplus.com)</li>
        <li>Roy Dickan (rdickan@strategicvalueplus.com)</li>
        <li>Nate Hallums (nhallums@strategicvalueplus.com)</li>
      </ul>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://strategicvalueplus.com/portal/admin/zenthium-referrals" class="button">View Admin Portal</a>
      </p>
      
      <div class="footer">
        <p>Strategic Value Plus, Inc.</p>
        <p>Zenthium Data Center Division</p>
        <p style="margin-top: 10px;">
          📧 zenthium@strategicvalueplus.com<br>
          📞 1-800-555-0199
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: ["BrianStittSr@gmail.com"],
      subject: "🎉 Zenthium Email System Test - Letterhead Feature Active",
      html,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent to BrianStittSr@gmail.com",
    });
  } catch (error) {
    console.error("[Test Email] Error:", error);
    return NextResponse.json(
      { error: "Failed to send test email", details: String(error) },
      { status: 500 }
    );
  }
}
