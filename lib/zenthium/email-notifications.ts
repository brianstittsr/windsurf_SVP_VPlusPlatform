import { sendEmail } from "@/lib/email";

// SVP Team emails for notifications
const SVP_TEAM = [
  "bstitt@strategicvalueplus.com",
  "nhallums@strategicvalueplus.com",
  "nelinia@strategicvalueplus.com",
  "rdickan@strategicvalueplus.com",
];

interface InterestResponseParams {
  submission: any;
  submissionId: string;
  isInterested: boolean;
  respondedAt: Date;
}

export async function sendInterestResponseEmail(params: InterestResponseParams): Promise<void> {
  const { submission, submissionId, isInterested, respondedAt } = params;

  const propertyName = submission.propertyName || "Unnamed Property";
  const address = submission.address || submission.city || "Address on file";
  const status = isInterested ? "Partner Interested" : "Partner Declined";

  // Email to SVP Team
  const svpSubject = `Zenthium: Partner ${isInterested ? 'INTERESTED' : 'DECLINED'} - ${propertyName}`;
  const svpHtml = generateSVPNotificationHTML(params);

  await sendEmail({
    to: SVP_TEAM,
    subject: svpSubject,
    html: svpHtml,
  });

  // Email to Submitter
  const submitterEmail = submission.poc?.email || submission.submitterEmail || submission.directContact?.email;
  if (submitterEmail) {
    const submitterSubject = isInterested 
      ? `Good News! Data Center Partner Interested in ${propertyName}`
      : `Update on ${propertyName} - Partner Response`;
    
    const submitterHtml = generateSubmitterNotificationHTML(params);

    await sendEmail({
      to: [submitterEmail],
      subject: submitterSubject,
      html: submitterHtml,
    });
  }
}

function generateSVPNotificationHTML(params: InterestResponseParams): string {
  const { submission, submissionId, isInterested, respondedAt } = params;
  const propertyName = submission.propertyName || "Unnamed Property";
  const fullAddress = submission.address 
    ? `${submission.address}, ${submission.city || ''}, ${submission.state || ''} ${submission.zip || ''}`
    : 'Address on file';

  const statusColor = isInterested ? "#00c853" : "#9e9e9e";
  const statusText = isInterested ? "✓ INTERESTED" : "✗ NOT INTERESTED";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .property-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
    .value { font-size: 16px; margin: 5px 0 15px; }
    .action-needed { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #e94560; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusText}</h1>
      <p>Partner Response Received - ${respondedAt.toLocaleString()}</p>
    </div>
    
    <div class="content">
      <div class="property-card">
        <div class="label">Property Name</div>
        <div class="value">${propertyName}</div>
        
        <div class="label">Address</div>
        <div class="value">${fullAddress}</div>
        
        <div class="label">Submission ID</div>
        <div class="value">${submissionId}</div>
        
        ${submission.acreage ? `<div class="label">Size</div><div class="value">${submission.acreage} acres</div>` : ''}
        ${submission.powerCapacityMW ? `<div class="label">Power</div><div class="value">${submission.powerCapacityMW} MW</div>` : ''}
        
        <div class="label">Submitter</div>
        <div class="value">${submission.poc?.name || submission.submitterName || 'Not provided'}<br>${submission.poc?.email || submission.submitterEmail || ''}</div>
      </div>
      
      ${isInterested ? `
      <div class="action-needed">
        <h3>⚡ Action Required</h3>
        <p>A data center partner has expressed interest in this property. Recommended next steps:</p>
        <ul>
          <li>Contact partner within 24 hours</li>
          <li>Schedule site visit</li>
          <li>Prepare detailed property information package</li>
          <li>Coordinate with Nelinia Varenas for high-level discussions</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://strategicvalueplus.com'}/portal/admin/zenthium-referrals/submissions/${submissionId}" class="button">View in Admin Portal</a>
      </div>
      ` : `
      <div class="action-needed" style="background: #e9ecef; border-color: #6c757d;">
        <h3>Property Declined</h3>
        <p>The partner has declined this property opportunity. Consider:</p>
        <ul>
          <li>Following up for specific feedback</li>
          <li>Exploring other potential partners</li>
          <li>Notifying the property owner of the decision</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://strategicvalueplus.com'}/portal/admin/zenthium-referrals/submissions/${submissionId}" class="button">View in Admin Portal</a>
      </div>
      `}
    </div>
    
    <div class="footer">
      <p>Zenthium Data Center Division | Strategic Value Plus, Inc.</p>
      <p>This is an automated notification sent to all SVP team members.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateSubmitterNotificationHTML(params: InterestResponseParams): string {
  const { submission, isInterested, respondedAt } = params;
  const propertyName = submission.propertyName || "your property";

  if (isInterested) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00c853 0%, #69f0ae 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { padding: 30px; background: white; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .highlight { background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00c853; }
    .next-steps { margin: 25px 0; }
    .next-steps li { margin: 10px 0; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Great News!</h1>
      <p style="font-size: 18px; margin-top: 10px;">A Data Center Partner is Interested</p>
    </div>
    
    <div class="content">
      <p>Dear ${submission.poc?.name || submission.submitterName || 'Property Owner'},</p>
      
      <p>We are excited to inform you that a data center development partner has expressed interest in <strong>${propertyName}</strong> following our presentation of your property.</p>
      
      <div class="highlight">
        <h3 style="margin-top: 0; color: #00c853;">What This Means</h3>
        <p style="margin-bottom: 0;">Your property has met the initial criteria for data center development, and a potential partner wants to learn more about the opportunity.</p>
      </div>
      
      <div class="next-steps">
        <h3>Next Steps</h3>
        <ol>
          <li><strong>Site Visit:</strong> The partner will likely request a site visit within the next 1-2 weeks</li>
          <li><strong>Detailed Analysis:</strong> We'll provide comprehensive property information and coordinate with your team</li>
          <li><strong>Partnership Discussion:</strong> If the site visit goes well, we'll move into formal partnership negotiations</li>
          <li><strong>Direct Contact:</strong> Nelinia Varenas, CEO of Strategic Value Plus, will personally oversee this opportunity</li>
        </ol>
      </div>
      
      <p>We will keep you informed at every step. If you have any questions or need to discuss this opportunity, please don't hesitate to contact us directly.</p>
      
      <div class="signature">
        <p>Best regards,</p>
        <p><strong>Nelinia Varenas</strong><br>
        Chief Executive Officer<br>
        Strategic Value Plus, Inc.</p>
        <p style="font-size: 14px; margin-top: 15px;">
          📧 zenthium@strategicvalueplus.com<br>
          📞 1-800-555-0199
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p>Zenthium Data Center Partnership Program</p>
      <p>Strategic Value Plus, Inc.</p>
    </div>
  </div>
</body>
</html>
    `;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f5f5f5; color: #666; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { padding: 30px; background: white; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .message { margin: 25px 0; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Property Update</h1>
    </div>
    
    <div class="content">
      <p>Dear ${submission.poc?.name || submission.submitterName || 'Property Owner'},</p>
      
      <div class="message">
        <p>Thank you for submitting <strong>${propertyName}</strong> to our Zenthium Data Center Partnership program.</p>
        
        <p>After careful review, the data center partner we presented your property to has determined that it does not align with their current development criteria at this time.</p>
        
        <p>This decision does not reflect on the quality of your property. Data center partners have very specific requirements related to power capacity, fiber connectivity, and geographic positioning that can change based on their strategic priorities.</p>
        
        <p><strong>What happens next:</strong></p>
        <ul>
          <li>We will continue to evaluate your property for other potential opportunities</li>
          <li>As market conditions change, we may re-present your property to other partners</li>
          <li>You will remain in our database for future data center development opportunities</li>
        </ul>
      </div>
      
      <p>We appreciate your interest in the Zenthium program and encourage you to reach out if you have any questions about this decision or future opportunities.</p>
      
      <div class="signature">
        <p>Best regards,</p>
        <p><strong>Nelinia Varenas</strong><br>
        Chief Executive Officer<br>
        Strategic Value Plus, Inc.</p>
        <p style="font-size: 14px; margin-top: 15px;">
          📧 zenthium@strategicvalueplus.com<br>
          📞 1-800-555-0199
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p>Zenthium Data Center Partnership Program</p>
      <p>Strategic Value Plus, Inc.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
