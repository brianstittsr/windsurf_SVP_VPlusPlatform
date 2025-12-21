const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// Create a new presentation
const pptx = new pptxgen();

// Set presentation properties
pptx.layout = 'LAYOUT_WIDE'; // 16:9 aspect ratio
pptx.title = 'BelPak - Toyota Battery Manufacturing NC Supplier Qualification';
pptx.author = 'Strategic Value Plus';
pptx.company = 'Strategic Value Plus';

// Define colors
const colors = {
  primary: '1a365d',
  primaryLight: '2c5282',
  accent: 'f5a623',
  accentGold: 'f5a623',
  success: '38a169',
  warning: 'ed8936',
  danger: 'e53e3e',
  toyotaRed: 'eb0a1e',
  gray50: 'f7fafc',
  gray100: 'edf2f7',
  gray200: 'e2e8f0',
  gray500: '718096',
  gray600: '4a5568',
  gray700: '2d3748',
  gray800: '1a202c',
  white: 'FFFFFF'
};

// Helper function to add logo bar
function addLogoBar(slide) {
  // V+ Logo
  slide.addText([
    { text: 'V', options: { fontSize: 24, bold: true, color: colors.accent } },
    { text: '+', options: { fontSize: 14, bold: true, color: colors.accent, superscript: true } }
  ], { x: 0.5, y: 5.0, w: 0.5, h: 0.4 });
  
  slide.addText('Strategic\nValue+', {
    x: 0.9, y: 5.0, w: 1, h: 0.4,
    fontSize: 9, color: colors.primary, fontFace: 'Segoe UI'
  });
  
  // BelPak Logo
  slide.addText('BELPAK', {
    x: 11.5, y: 5.0, w: 1, h: 0.35,
    fontSize: 10, bold: true, color: colors.white,
    fill: { color: colors.primary },
    align: 'center', valign: 'middle'
  });
}

// ============================================
// PRESENTATION V1 SLIDES
// ============================================

// Slide 1: Title Slide (V1)
let slide1 = pptx.addSlide();
slide1.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide1.addText('BELPAK', {
  x: 4.5, y: 1.5, w: 4, h: 0.5,
  fontSize: 18, color: colors.white, align: 'center',
  fill: { color: colors.accent, transparency: 50 }
});
slide1.addText('Toyota Battery Manufacturing NC', {
  x: 1, y: 2.2, w: 11, h: 0.8,
  fontSize: 44, bold: true, color: colors.primary, align: 'center'
});
slide1.addShape(pptx.shapes.RECTANGLE, { x: 5.5, y: 3.1, w: 2, h: 0.08, fill: { color: colors.accent } });
slide1.addText('Supplier Qualification Brief', {
  x: 1, y: 3.3, w: 11, h: 0.5,
  fontSize: 24, color: colors.gray600, align: 'center'
});
slide1.addText('Prepared by Strategic Value+ Solutions | December 2025', {
  x: 1, y: 4.5, w: 11, h: 0.3,
  fontSize: 12, color: colors.gray500, align: 'center'
});
addLogoBar(slide1);
slide1.addText('1', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 2: Executive Summary (V1)
let slide2 = pptx.addSlide();
slide2.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide2.addText("BelPak's embedded operations model positions them as a potential Toyota Battery NC packaging & logistics partner", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// The Opportunity box
slide2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 5.8, h: 2.2, fill: { color: colors.gray50 } });
slide2.addText('🎯 The Opportunity', { x: 0.7, y: 1.1, w: 5.4, h: 0.4, fontSize: 14, bold: true, color: colors.primary });
slide2.addText([
  { text: '• Contract packaging and logistics services\n', options: { bullet: false } },
  { text: '• Embedded operations model proven with Subaru\n', options: { bullet: false } },
  { text: '• MBE certification supports Toyota diversity goals\n', options: { bullet: false } },
  { text: '• 25+ facilities with national coverage', options: { bullet: false } }
], { x: 0.7, y: 1.5, w: 5.4, h: 1.6, fontSize: 12, color: colors.gray700, valign: 'top' });

// Key Gaps box
slide2.addShape(pptx.shapes.RECTANGLE, { x: 6.5, y: 1.0, w: 5.8, h: 2.2, fill: { color: 'fff5eb' } });
slide2.addText('⚠️ Key Gaps to Address', { x: 6.7, y: 1.1, w: 5.4, h: 0.4, fontSize: 14, bold: true, color: colors.warning });
slide2.addText([
  { text: '• No hazmat experience - critical for battery handling\n', options: { bullet: false } },
  { text: '• ISO 9001/IATF 16949 certifications required\n', options: { bullet: false } },
  { text: '• Battery packaging expertise needs development\n', options: { bullet: false } },
  { text: '• Toyota interest in outsourcing not yet confirmed', options: { bullet: false } }
], { x: 6.7, y: 1.5, w: 5.4, h: 1.6, fontSize: 12, color: colors.gray700, valign: 'top' });

// Critical Question callout
slide2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.4, w: 11.8, h: 0.8, fill: { color: 'fff5eb' } });
slide2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.4, w: 0.05, h: 0.8, fill: { color: colors.warning } });
slide2.addText('Critical Question', { x: 0.7, y: 3.45, w: 11.4, h: 0.3, fontSize: 12, bold: true, color: colors.warning });
slide2.addText('Does Toyota intend to outsource packaging & logistics? This must be validated before proceeding.', {
  x: 0.7, y: 3.7, w: 11.4, h: 0.4, fontSize: 11, color: colors.gray700
});

addLogoBar(slide2);
slide2.addText('2', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 3: BelPak At A Glance (V1)
let slide3 = pptx.addSlide();
slide3.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide3.addText("BelPak brings 25+ facilities, 1,000 employees, and proven OEM experience with Subaru", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Stats grid
const stats = [
  { value: '25+', label: 'Facilities' },
  { value: '1,000', label: 'Employees' },
  { value: '99.6%', label: 'OTIF Rate' },
  { value: '45', label: 'Day Standup' }
];
stats.forEach((stat, i) => {
  const x = 0.5 + (i * 3);
  slide3.addShape(pptx.shapes.RECTANGLE, { x: x, y: 1.0, w: 2.8, h: 1.2, fill: { color: colors.gray50 } });
  slide3.addText(stat.value, { x: x, y: 1.1, w: 2.8, h: 0.7, fontSize: 36, bold: true, color: colors.primary, align: 'center' });
  slide3.addText(stat.label, { x: x, y: 1.7, w: 2.8, h: 0.4, fontSize: 12, color: colors.gray600, align: 'center' });
});

// Company info
slide3.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 2.4, w: 5.8, h: 2.0, fill: { color: colors.gray50 } });
slide3.addText('📍 Company Profile', { x: 0.7, y: 2.5, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.primary });
slide3.addText([
  { text: 'Founded: 1989 (30+ years)\n' },
  { text: 'Headquarters: Indianapolis, IN\n' },
  { text: 'Revenue: ~$400M (estimated)\n' },
  { text: 'Ownership: Red Arts Capital (PE)' }
], { x: 0.7, y: 2.85, w: 5.4, h: 1.4, fontSize: 11, color: colors.gray700 });

// Questions to clarify
slide3.addShape(pptx.shapes.RECTANGLE, { x: 6.5, y: 2.4, w: 5.8, h: 2.0, fill: { color: 'fff5eb' } });
slide3.addText('❓ Questions to Clarify', { x: 6.7, y: 2.5, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.warning });
slide3.addText([
  { text: 'Subaru Relationship: Which entity? Location?\n' },
  { text: 'Legacy Companies: 8 acquisitions - which ones?\n' },
  { text: 'Certifications: Current ISO/IATF status?' }
], { x: 6.7, y: 2.85, w: 5.4, h: 1.4, fontSize: 11, color: colors.gray700 });

addLogoBar(slide3);
slide3.addText('3', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 4: The Subaru Model (V1)
let slide4 = pptx.addSlide();
slide4.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide4.addText("BelPak's Subaru relationship demonstrates their embedded operations capability", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

slide4.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 5.8, h: 2.5, fill: { color: colors.gray50 } });
slide4.addText('✅ What We Know', { x: 0.7, y: 1.1, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.success });
slide4.addText([
  { text: '• Operates inside Subaru facility\n' },
  { text: '• Manages packaging & logistics\n' },
  { text: '• Long-term relationship\n' },
  { text: '• Proven embedded model' }
], { x: 0.7, y: 1.5, w: 5.4, h: 1.8, fontSize: 12, color: colors.gray700 });

slide4.addShape(pptx.shapes.RECTANGLE, { x: 6.5, y: 1.0, w: 5.8, h: 2.5, fill: { color: 'fff5eb' } });
slide4.addText('❓ What We Need to Learn', { x: 6.7, y: 1.1, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.warning });
slide4.addText([
  { text: '• Which legacy company serves Subaru?\n' },
  { text: '• What certifications does that entity hold?\n' },
  { text: '• Contract structure and scope?\n' },
  { text: '• Lessons learned for Toyota?' }
], { x: 6.7, y: 1.5, w: 5.4, h: 1.8, fontSize: 12, color: colors.gray700 });

slide4.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.7, w: 11.8, h: 0.7, fill: { color: 'fff5eb' } });
slide4.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.7, w: 0.05, h: 0.7, fill: { color: colors.warning } });
slide4.addText('Key Question for BelPak', { x: 0.7, y: 3.75, w: 11.4, h: 0.25, fontSize: 11, bold: true, color: colors.warning });
slide4.addText('Which legacy company serves Subaru? This may be the best candidate for Toyota certification.', {
  x: 0.7, y: 4.0, w: 11.4, h: 0.3, fontSize: 10, color: colors.gray700
});

addLogoBar(slide4);
slide4.addText('4', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 5: Service Opportunities (V1)
let slide5 = pptx.addSlide();
slide5.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide5.addText("Toyota Battery NC presents multiple service opportunities for BelPak", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Core Services
slide5.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 5.8, h: 2.3, fill: { color: colors.gray50 } });
slide5.addText('📦 Core Services (Strong Fit)', { x: 0.7, y: 1.1, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.success });
slide5.addText([
  { text: '✓ Contract packaging\n' },
  { text: '✓ Kitting and assembly\n' },
  { text: '✓ Warehouse management\n' },
  { text: '✓ Logistics coordination' }
], { x: 0.7, y: 1.5, w: 5.4, h: 1.6, fontSize: 12, color: colors.gray700 });

// Stretch Services
slide5.addShape(pptx.shapes.RECTANGLE, { x: 6.5, y: 1.0, w: 5.8, h: 2.3, fill: { color: 'fff5eb' } });
slide5.addText('🔋 Stretch Services (Gaps Exist)', { x: 6.7, y: 1.1, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.warning });
slide5.addText([
  { text: '⚠ Battery module packaging (hazmat)\n' },
  { text: '⚠ Specialized handling equipment\n' },
  { text: '⚠ EV-specific certifications\n' },
  { text: '⚠ Temperature-controlled logistics' }
], { x: 6.7, y: 1.5, w: 5.4, h: 1.6, fontSize: 12, color: colors.gray700 });

slide5.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.5, w: 11.8, h: 0.8, fill: { color: colors.gray50 } });
slide5.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.5, w: 0.05, h: 0.8, fill: { color: colors.primary } });
slide5.addText('Strategic Question', { x: 0.7, y: 3.55, w: 11.4, h: 0.25, fontSize: 11, bold: true, color: colors.primary });
slide5.addText('Does BelPak want to enter the hazmat business? This is a significant capability investment.', {
  x: 0.7, y: 3.85, w: 11.4, h: 0.35, fontSize: 10, color: colors.gray700
});

addLogoBar(slide5);
slide5.addText('5', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 6: Certification Requirements (V1)
let slide6 = pptx.addSlide();
slide6.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide6.addText("Toyota supplier qualification requires ISO 9001 and IATF 16949 certifications", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Certification table
const certData = [
  ['Certification', 'Timeline', 'Investment', 'Status'],
  ['ISO 9001:2015', '9-12 months', '$50-75K', 'Required'],
  ['IATF 16949:2016', '12-18 months', '$100-150K', 'Required'],
  ['Hazmat (if needed)', '6-9 months', '$25-50K', 'TBD'],
  ['ESG/Sustainability', '3-6 months', '$15-25K', 'Recommended']
];

certData.forEach((row, rowIdx) => {
  const y = 1.0 + (rowIdx * 0.45);
  const isHeader = rowIdx === 0;
  row.forEach((cell, colIdx) => {
    const x = 0.5 + (colIdx * 3);
    slide6.addText(cell, {
      x: x, y: y, w: 2.9, h: 0.4,
      fontSize: 11, bold: isHeader, 
      color: isHeader ? colors.white : colors.gray700,
      fill: { color: isHeader ? colors.primary : (rowIdx % 2 === 0 ? colors.gray100 : colors.white) },
      align: 'center', valign: 'middle'
    });
  });
});

// Key considerations
slide6.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.4, w: 11.8, h: 1.0, fill: { color: colors.gray50 } });
slide6.addText('❓ Key Considerations', { x: 0.7, y: 3.5, w: 11.4, h: 0.3, fontSize: 12, bold: true, color: colors.primary });
slide6.addText([
  { text: '• How many facilities? Strategic decision for BelPak\n' },
  { text: '• Proximity to Toyota is key factor\n' },
  { text: '• 6 months just to schedule Stage 1 audit' }
], { x: 0.7, y: 3.8, w: 11.4, h: 0.6, fontSize: 10, color: colors.gray700 });

addLogoBar(slide6);
slide6.addText('6', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 7: Implementation Approach (V1)
let slide7 = pptx.addSlide();
slide7.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide7.addText("A phased approach allows BelPak to validate opportunity before major investment", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Phases
const phases = [
  { phase: 'Phase 0', title: 'Discovery', duration: '4-6 weeks', items: ['Toyota interest validation', 'Facility assessment', 'Gap analysis'] },
  { phase: 'Phase 1', title: 'Foundation', duration: '6-9 months', items: ['ISO 9001 certification', 'Process documentation', 'Training program'] },
  { phase: 'Phase 2', title: 'Automotive', duration: '12-18 months', items: ['IATF 16949 certification', 'Toyota qualification', 'Pilot program'] }
];

phases.forEach((p, i) => {
  const x = 0.5 + (i * 4);
  slide7.addShape(pptx.shapes.RECTANGLE, { x: x, y: 1.0, w: 3.8, h: 2.5, fill: { color: i === 0 ? colors.accent : colors.gray50 } });
  slide7.addText(p.phase, { x: x, y: 1.1, w: 3.8, h: 0.3, fontSize: 12, bold: true, color: i === 0 ? colors.white : colors.primary, align: 'center' });
  slide7.addText(p.title, { x: x, y: 1.4, w: 3.8, h: 0.3, fontSize: 16, bold: true, color: i === 0 ? colors.white : colors.primary, align: 'center' });
  slide7.addText(p.duration, { x: x, y: 1.7, w: 3.8, h: 0.25, fontSize: 10, color: i === 0 ? colors.white : colors.gray600, align: 'center' });
  slide7.addText(p.items.map(item => '• ' + item).join('\n'), { 
    x: x + 0.2, y: 2.0, w: 3.4, h: 1.4, fontSize: 10, color: i === 0 ? colors.white : colors.gray700 
  });
});

// Key decisions
slide7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.7, w: 11.8, h: 0.8, fill: { color: 'fff5eb' } });
slide7.addText('Key Decisions for BelPak', { x: 0.7, y: 3.75, w: 11.4, h: 0.25, fontSize: 11, bold: true, color: colors.warning });
slide7.addText('Which facility? How many sites? Hazmat investment? Subaru synergy?', {
  x: 0.7, y: 4.0, w: 11.4, h: 0.35, fontSize: 10, color: colors.gray700
});

addLogoBar(slide7);
slide7.addText('7', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 8: Investment Estimate (V1)
let slide8 = pptx.addSlide();
slide8.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide8.addText("Total investment for Toyota qualification ranges from $200K-$400K over 18-24 months", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Investment table
const investData = [
  ['Category', 'Low Estimate', 'High Estimate', 'Notes'],
  ['ISO 9001 Certification', '$50K', '$75K', '9-12 months'],
  ['IATF 16949 Certification', '$100K', '$150K', '12-18 months'],
  ['Consulting & Support', '$30K', '$50K', 'SV+ engagement'],
  ['Training & Development', '$20K', '$40K', 'Staff certification'],
  ['Hazmat (if applicable)', '$25K', '$50K', 'Optional'],
  ['TOTAL', '$225K', '$365K', '18-24 months']
];

investData.forEach((row, rowIdx) => {
  const y = 1.0 + (rowIdx * 0.4);
  const isHeader = rowIdx === 0;
  const isTotal = rowIdx === investData.length - 1;
  row.forEach((cell, colIdx) => {
    const x = 0.5 + (colIdx * 3);
    slide8.addText(cell, {
      x: x, y: y, w: 2.9, h: 0.38,
      fontSize: 10, bold: isHeader || isTotal, 
      color: isHeader ? colors.white : (isTotal ? colors.primary : colors.gray700),
      fill: { color: isHeader ? colors.primary : (isTotal ? colors.accent : (rowIdx % 2 === 0 ? colors.gray100 : colors.white)) },
      align: colIdx === 0 ? 'left' : 'center', valign: 'middle'
    });
  });
});

slide8.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.9, w: 11.8, h: 0.6, fill: { color: colors.gray50 } });
slide8.addText('Important Notes: Final pricing requires Phase 0 discovery. Additional facilities would add incremental cost.', {
  x: 0.7, y: 4.0, w: 11.4, h: 0.4, fontSize: 10, color: colors.gray700
});

addLogoBar(slide8);
slide8.addText('8', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 9: Key Risks (V1)
let slide9 = pptx.addSlide();
slide9.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide9.addText("Several critical risks must be addressed before proceeding with Toyota qualification", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Risk table
const riskData = [
  ['Risk', 'Impact', 'Likelihood', 'Mitigation'],
  ['Toyota not outsourcing', 'Critical', 'Unknown', 'Validate in Phase 0'],
  ['No hazmat experience', 'High', 'Certain', 'Partner or develop'],
  ['Certification timeline', 'Medium', 'Medium', 'Start early'],
  ['Resource constraints', 'Medium', 'Medium', 'Dedicated team']
];

riskData.forEach((row, rowIdx) => {
  const y = 1.0 + (rowIdx * 0.45);
  const isHeader = rowIdx === 0;
  row.forEach((cell, colIdx) => {
    const x = 0.5 + (colIdx * 3);
    let cellColor = colors.gray700;
    if (!isHeader && colIdx === 1) {
      cellColor = cell === 'Critical' ? colors.danger : (cell === 'High' ? colors.warning : colors.gray700);
    }
    slide9.addText(cell, {
      x: x, y: y, w: 2.9, h: 0.4,
      fontSize: 10, bold: isHeader, 
      color: isHeader ? colors.white : cellColor,
      fill: { color: isHeader ? colors.primary : (rowIdx % 2 === 0 ? colors.gray100 : colors.white) },
      align: 'center', valign: 'middle'
    });
  });
});

slide9.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.4, w: 11.8, h: 0.8, fill: { color: 'ffebeb' } });
slide9.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.4, w: 0.05, h: 0.8, fill: { color: colors.danger } });
slide9.addText('Biggest Risk', { x: 0.7, y: 3.45, w: 11.4, h: 0.25, fontSize: 11, bold: true, color: colors.danger });
slide9.addText("Toyota may not be interested in outsourcing. Even if they are, BelPak's lack of hazmat experience is a significant barrier.", {
  x: 0.7, y: 3.75, w: 11.4, h: 0.4, fontSize: 10, color: colors.gray700
});

addLogoBar(slide9);
slide9.addText('9', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 10: Discovery Questions (V1)
let slide10 = pptx.addSlide();
slide10.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide10.addText("Phase 0 Discovery must answer these critical questions before proceeding", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Questions columns
slide10.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 5.8, h: 2.8, fill: { color: colors.gray50 } });
slide10.addText('🎯 For Toyota', { x: 0.7, y: 1.1, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.primary });
slide10.addText([
  { text: '• Will they outsource packaging/logistics?\n' },
  { text: '• What certifications are required?\n' },
  { text: '• Timeline for supplier qualification?\n' },
  { text: '• Diversity supplier preferences?' }
], { x: 0.7, y: 1.5, w: 5.4, h: 2.2, fontSize: 11, color: colors.gray700 });

slide10.addShape(pptx.shapes.RECTANGLE, { x: 6.5, y: 1.0, w: 5.8, h: 2.8, fill: { color: colors.gray50 } });
slide10.addText('🏢 For BelPak', { x: 6.7, y: 1.1, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.primary });
slide10.addText([
  { text: '• Which facility for Toyota?\n' },
  { text: '• Appetite for hazmat investment?\n' },
  { text: '• Current certification status?\n' },
  { text: '• Subaru entity details?' }
], { x: 6.7, y: 1.5, w: 5.4, h: 2.2, fontSize: 11, color: colors.gray700 });

slide10.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 4.0, w: 11.8, h: 0.6, fill: { color: colors.gray50 } });
slide10.addText('Recommended Next Step: Phase 0 Discovery engagement to answer these questions before committing to full certification project', {
  x: 0.7, y: 4.1, w: 11.4, h: 0.4, fontSize: 10, color: colors.gray700
});

addLogoBar(slide10);
slide10.addText('10', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 11: Team & Next Steps (V1)
let slide11 = pptx.addSlide();
slide11.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
slide11.addText("Strategic Value+ team is ready to support BelPak's Toyota qualification journey", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// SV+ Team
slide11.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 5.8, h: 2.0, fill: { color: colors.gray50 } });
slide11.addText('👥 SV+ Team', { x: 0.7, y: 1.1, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.primary });
slide11.addText([
  { text: '• Nelinia Varenas - CEO\n' },
  { text: '• Roy Dickan - CRO\n' },
  { text: '• Dave McFarland - Strategic Advisor\n' },
  { text: '• Certification Partners - TBD' }
], { x: 0.7, y: 1.5, w: 5.4, h: 1.4, fontSize: 11, color: colors.gray700 });

// Next Steps
slide11.addShape(pptx.shapes.RECTANGLE, { x: 6.5, y: 1.0, w: 5.8, h: 2.0, fill: { color: colors.gray50 } });
slide11.addText('📋 Immediate Next Steps', { x: 6.7, y: 1.1, w: 5.4, h: 0.3, fontSize: 14, bold: true, color: colors.primary });
slide11.addText([
  { text: '✓ Review this brief with BelPak leadership\n' },
  { text: '✓ Schedule discovery call\n' },
  { text: '✓ Gather Subaru relationship details\n' },
  { text: '✓ Assess Toyota interest' }
], { x: 6.7, y: 1.5, w: 5.4, h: 1.4, fontSize: 11, color: colors.gray700 });

// BelPak Leadership
slide11.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.2, w: 11.8, h: 1.0, fill: { color: colors.gray50 } });
slide11.addText('🤝 BelPak Leadership', { x: 0.7, y: 3.3, w: 11.4, h: 0.3, fontSize: 12, bold: true, color: colors.primary });
slide11.addText('Henry Hicks III - Revenue Growth  |  Anthony [Last Name] - Operating Partner (Red Arts)  |  Dawn Statsney - Chief HR Officer', {
  x: 0.7, y: 3.65, w: 11.4, h: 0.4, fontSize: 10, color: colors.gray700
});

addLogoBar(slide11);
slide11.addText('11', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Slide 12: Thank You (V1)
let slide12 = pptx.addSlide();
slide12.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.accent } });
slide12.addText('BELPAK × TOYOTA', {
  x: 4.5, y: 1.5, w: 4, h: 0.5,
  fontSize: 16, color: colors.white, align: 'center',
  fill: { color: colors.accent }
});
slide12.addText('Thank You', {
  x: 1, y: 2.2, w: 11, h: 0.8,
  fontSize: 48, bold: true, color: colors.primary, align: 'center'
});
slide12.addShape(pptx.shapes.RECTANGLE, { x: 5.5, y: 3.1, w: 2, h: 0.08, fill: { color: colors.accent } });
slide12.addText('Ready to Begin Discovery?', {
  x: 1, y: 3.3, w: 11, h: 0.5,
  fontSize: 22, color: colors.gray600, align: 'center'
});
slide12.addText('Strategic Value+ Solutions\nNelinia Varenas, CEO | Roy Dickan, CRO', {
  x: 1, y: 4.2, w: 11, h: 0.6,
  fontSize: 12, color: colors.gray500, align: 'center'
});
addLogoBar(slide12);
slide12.addText('12', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// ============================================
// PRESENTATION V2 SLIDES (APPENDED)
// ============================================

// Divider slide
let divider = pptx.addSlide();
divider.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
divider.addText('V2 - REVISED PRESENTATION', {
  x: 1, y: 2.0, w: 11, h: 0.6,
  fontSize: 36, bold: true, color: colors.white, align: 'center'
});
divider.addText('Updated with feedback and refinements', {
  x: 1, y: 2.7, w: 11, h: 0.4,
  fontSize: 18, color: colors.accent, align: 'center'
});
divider.addText('13', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: 'ffffff80' });

// V2 Slide 1: Title
let v2slide1 = pptx.addSlide();
v2slide1.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.accent } });
v2slide1.addText('BELPAK', {
  x: 4.5, y: 1.5, w: 4, h: 0.5,
  fontSize: 18, color: colors.white, align: 'center',
  fill: { color: colors.accent }
});
v2slide1.addText('Toyota Battery Manufacturing NC', {
  x: 1, y: 2.2, w: 11, h: 0.8,
  fontSize: 44, bold: true, color: colors.primary, align: 'center'
});
v2slide1.addShape(pptx.shapes.RECTANGLE, { x: 5.5, y: 3.1, w: 2, h: 0.08, fill: { color: colors.accent } });
v2slide1.addText('Supplier Qualification Discovery', {
  x: 1, y: 3.3, w: 11, h: 0.5,
  fontSize: 24, color: colors.gray600, align: 'center'
});
v2slide1.addText('Prepared by Strategic Value+ Solutions | December 2025', {
  x: 1, y: 4.5, w: 11, h: 0.3,
  fontSize: 12, color: colors.gray500, align: 'center'
});
addLogoBar(v2slide1);
v2slide1.addText('14', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// V2 Slide 2: Executive Summary (Updated)
let v2slide2 = pptx.addSlide();
v2slide2.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
v2slide2.addText('V2 - REVISED', { x: 11, y: 0.15, w: 1.3, h: 0.25, fontSize: 9, bold: true, color: colors.white, fill: { color: colors.accent }, align: 'center' });
v2slide2.addText("BelPak brings $400M revenue, 1,000 employees, and 30+ years of OEM experience", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Content boxes
v2slide2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 5.8, h: 2.2, fill: { color: colors.gray50 } });
v2slide2.addText('🎯 The Opportunity', { x: 0.7, y: 1.1, w: 5.4, h: 0.4, fontSize: 14, bold: true, color: colors.primary });
v2slide2.addText([
  { text: '• Contract packaging and logistics services\n' },
  { text: '• Embedded operations model proven with Subaru\n' },
  { text: '• MBE certification supports Toyota diversity goals\n' },
  { text: '• 25+ facilities with national coverage' }
], { x: 0.7, y: 1.5, w: 5.4, h: 1.6, fontSize: 12, color: colors.gray700, valign: 'top' });

v2slide2.addShape(pptx.shapes.RECTANGLE, { x: 6.5, y: 1.0, w: 5.8, h: 2.2, fill: { color: 'fff5eb' } });
v2slide2.addText('⚠️ Key Gaps to Address', { x: 6.7, y: 1.1, w: 5.4, h: 0.4, fontSize: 14, bold: true, color: colors.warning });
v2slide2.addText([
  { text: '• No hazmat experience - critical for battery handling\n' },
  { text: '• ISO 9001/IATF 16949 certifications required\n' },
  { text: '• Battery packaging expertise needs development\n' },
  { text: '• Toyota interest in outsourcing not yet confirmed' }
], { x: 6.7, y: 1.5, w: 5.4, h: 1.6, fontSize: 12, color: colors.gray700, valign: 'top' });

v2slide2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.4, w: 11.8, h: 0.8, fill: { color: 'fff5eb' } });
v2slide2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.4, w: 0.05, h: 0.8, fill: { color: colors.warning } });
v2slide2.addText('Critical Question', { x: 0.7, y: 3.45, w: 11.4, h: 0.3, fontSize: 12, bold: true, color: colors.warning });
v2slide2.addText('Does Toyota intend to outsource packaging & logistics? This must be validated before proceeding.', {
  x: 0.7, y: 3.7, w: 11.4, h: 0.4, fontSize: 11, color: colors.gray700
});

addLogoBar(v2slide2);
v2slide2.addText('15', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// V2 Slide 3: 8 Competitive Advantages
let v2slide3 = pptx.addSlide();
v2slide3.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.primary } });
v2slide3.addText("BelPak's 8 competitive advantages position them as Toyota's ideal partner", {
  x: 0.5, y: 0.3, w: 12, h: 0.6,
  fontSize: 22, bold: true, color: colors.primary
});

// Stats grid
const v2stats = [
  { value: '25+', label: 'Facilities' },
  { value: '1,000', label: 'Employees' },
  { value: '99.6%', label: 'OTIF Rate' },
  { value: '45', label: 'Day Standup' }
];
v2stats.forEach((stat, i) => {
  const x = 0.5 + (i * 3);
  v2slide3.addShape(pptx.shapes.RECTANGLE, { x: x, y: 1.0, w: 2.8, h: 1.2, fill: { color: colors.gray50 } });
  v2slide3.addText(stat.value, { x: x, y: 1.1, w: 2.8, h: 0.7, fontSize: 36, bold: true, color: colors.primary, align: 'center' });
  v2slide3.addText(stat.label, { x: x, y: 1.7, w: 2.8, h: 0.4, fontSize: 12, color: colors.gray600, align: 'center' });
});

// Advantages
v2slide3.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 2.4, w: 11.8, h: 2.0, fill: { color: colors.gray50 } });
v2slide3.addText('8 Competitive Advantages', { x: 0.7, y: 2.5, w: 11.4, h: 0.3, fontSize: 14, bold: true, color: colors.primary });
v2slide3.addText([
  { text: '1. $400M revenue scale  |  2. 1,000+ employees  |  3. 30+ years OEM experience  |  4. Proven Subaru relationship\n' },
  { text: '5. 25+ facilities nationwide  |  6. MBE certification  |  7. 99.6% OTIF rate  |  8. 45-day standup capability' }
], { x: 0.7, y: 2.9, w: 11.4, h: 1.4, fontSize: 11, color: colors.gray700 });

addLogoBar(v2slide3);
v2slide3.addText('16', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// V2 Final Slide: Thank You
let v2final = pptx.addSlide();
v2final.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: colors.accent } });
v2final.addText('BELPAK × TOYOTA', {
  x: 4.5, y: 1.5, w: 4, h: 0.5,
  fontSize: 16, color: colors.white, align: 'center',
  fill: { color: colors.accent }
});
v2final.addText('Thank You', {
  x: 1, y: 2.2, w: 11, h: 0.8,
  fontSize: 48, bold: true, color: colors.primary, align: 'center'
});
v2final.addShape(pptx.shapes.RECTANGLE, { x: 5.5, y: 3.1, w: 2, h: 0.08, fill: { color: colors.accent } });
v2final.addText('Ready to Begin Discovery?', {
  x: 1, y: 3.3, w: 11, h: 0.5,
  fontSize: 22, color: colors.gray600, align: 'center'
});
v2final.addText('Strategic Value+ Solutions\nNelinia Varenas, CEO | Roy Dickan, CRO', {
  x: 1, y: 4.2, w: 11, h: 0.6,
  fontSize: 12, color: colors.gray500, align: 'center'
});
addLogoBar(v2final);
v2final.addText('17', { x: 12.2, y: 5.0, w: 0.3, h: 0.3, fontSize: 10, color: colors.gray500 });

// Save the presentation
const outputPath = path.join(__dirname, '..', 'public', 'presentations', 'BelPak-TBMNC-Combined-Presentation.pptx');
pptx.writeFile({ fileName: outputPath })
  .then(fileName => {
    console.log(`✅ PowerPoint presentation created: ${fileName}`);
  })
  .catch(err => {
    console.error('Error creating presentation:', err);
  });
