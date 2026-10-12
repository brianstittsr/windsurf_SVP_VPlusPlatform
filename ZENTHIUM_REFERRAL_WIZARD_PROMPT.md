# Zenthium Referral Agreement Wizard - Development Prompt

## Overview
Create a comprehensive wizard at `/portal/admin/zenthium-referrals` that facilitates the creation, signing, and management of Property Location Introduction Agreements for Zenthium property management referrals. The wizard should leverage the existing proposal system architecture and digital signature workflow.

## Key Requirements

### 1. Wizard Location & Navigation
- **Route**: `/portal/admin/zenthium-referrals`
- **Navigation**: Add to admin sidebar with appropriate icon (e.g., Building or FileText)
- **Access**: Admin-only access, leveraging existing user profile context

### 2. Document Template System
Based on the Property_Location_Introduction_Agreement.docx template, create a digital template system with:

#### Template Fields (Placeholders):
```
{{contractor_name}} - Contractor's full legal name
{{contractor_company}} - Contractor's company name  
{{effective_date}} - Agreement effective date
{{property_address}} - Property location address
{{referral_fee_percentage}} - Referral fee percentage
{{nelinia_signature}} - Pre-populated Nelinia Varenas signature
{{nelinia_date}} - Nelinia's signature date
{{contractor_signature}} - Contractor's signature (to be added)
{{contractor_date}} - Contractor's signature date (to be added)
```

#### Template Storage:
- Store template in Firestore as base64 encoded document
- Include metadata: template name, type, version, created/updated dates
- Support template updates and versioning

### 3. Wizard Steps (4-Step Process)

#### Step 1: Property & Referral Details
- **Fields**:
  - Property Address (required, multi-line)
  - Property Type (dropdown: Residential, Commercial, Industrial, Mixed-Use)
  - Referral Source (dropdown: Direct Contact, Website, Partner, Other)
  - Referral Fee Percentage (number, default: 3%, min: 0%, max: 10%)
  - Special Instructions (optional, textarea)
- **Validation**: All required fields must be completed
- **UI**: Card-based layout with clear field labels and help text

#### Step 2: Contractor Information  
- **Fields**:
  - Contractor Name (required, text input)
  - Company Name (required, text input)
  - Email Address (required, email validation)
  - Phone Number (required, phone validation)
  - License Number (optional, text input)
  - Years in Business (optional, number input)
- **Validation**: Email format, phone format, required fields
- **UI**: Two-column layout for better organization

#### Step 3: Agreement Preview & Customization
- **Features**:
  - Live document preview with populated fields
  - Editable template sections (if needed)
  - Terms and conditions display
  - Fee structure explanation
- **UI**: Document preview pane with editing capabilities
- **Validation**: Ensure all placeholders are filled correctly

#### Step 4: Digital Signature & Send
- **Features**:
  - Digital signature pad for contractor
  - Typed signature option
  - Date auto-population
  - Send agreement via email
  - Download signed PDF option
- **UI**: Signature interface with clear instructions

### 4. Digital Signature Workflow

#### Signature Process:
1. **Pre-population**: Nelinia Varenas signature already embedded in template
2. **Contractor Signature**: 
   - Draw signature using canvas/mouse
   - Type signature option
   - Capture signature as base64 image
3. **Document Completion**:
   - Combine template + contractor signature
   - Generate final PDF
   - Store as base64 in Firestore
4. **Distribution**:
   - Email signed copy to contractor
   - Store in admin dashboard
   - Create audit trail

#### Technical Implementation:
```typescript
// Signature capture interface
interface SignatureCapture {
  type: 'draw' | 'type';
  signatureData: string; // base64 encoded
  timestamp: Date;
  signerName: string;
  signerEmail: string;
  ipAddress: string;
}

// Document storage interface
interface SignedAgreement {
  id: string;
  templateId: string;
  propertyAddress: string;
  contractorInfo: ContractorInfo;
  signatures: {
    nelinia: SignatureCapture;
    contractor: SignatureCapture;
  };
  finalDocumentBase64: string;
  status: 'draft' | 'sent' | 'signed' | 'completed';
  createdAt: Date;
  signedAt: Date;
}
```

### 5. Integration with Existing Proposal System

#### Leverage Existing Components:
- **Wizard Framework**: Use existing wizard step system from `/portal/proposals`
- **Form Components**: Reuse UI components (Input, Select, Textarea, etc.)
- **Dialog System**: Use existing Dialog components for confirmations
- **File Upload**: Adapt existing file upload for document handling
- **State Management**: Follow existing state patterns

#### Extend Proposal Types:
```typescript
// Add to lib/types/proposal.ts
export type ProposalType = 'grant' | 'nda' | 'rfp_response' | 'rfi_response' | 'contract' | 'agreement' | 'mou' | 'oem_supplier_readiness' | 'zenthium_referral';

export interface ZenthiumReferralData {
  propertyAddress: string;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'mixed_use';
  referralFeePercentage: number;
  contractorInfo: {
    name: string;
    company: string;
    email: string;
    phone: string;
    licenseNumber?: string;
    yearsInBusiness?: number;
  };
  specialInstructions?: string;
}
```

### 6. Database Schema (Firestore)

#### Collections:
```
/zenthium_templates
  - templateId (doc)
  - name: "Property Location Introduction Agreement"
  - contentBase64: string
  - placeholders: string[]
  - version: number
  - isActive: boolean
  - createdAt: Date
  - updatedAt: Date

/zenthium_referrals  
  - referralId (doc)
  - propertyAddress: string
  - propertyType: string
  - referralFeePercentage: number
  - contractorInfo: object
  - specialInstructions?: string
  - templateId: string
  - status: 'draft' | 'sent' | 'signed' | 'completed'
  - signatures: object
  - finalDocumentBase64?: string
  - createdAt: Date
  - signedAt?: Date
  - createdBy: string
```

### 7. API Routes

#### Required Endpoints:
```typescript
// /api/zenthium/templates
GET /api/zenthium/templates - List all templates
POST /api/zenthium/templates - Create new template
PUT /api/zenthium/templates/[id] - Update template

// /api/zenthium/referrals  
GET /api/zenthium/referrals - List all referrals
POST /api/zenthium/referrals - Create new referral
GET /api/zenthium/referrals/[id] - Get referral details
PUT /api/zenthium/referrals/[id] - Update referral
POST /api/zenthium/referrals/[id]/sign - Add signature
POST /api/zenthium/referrals/[id]/send - Send for signature
GET /api/zenthium/referrals/[id]/download - Download signed PDF
```

### 8. UI Components & Design

#### Page Structure:
```typescript
// Main wizard component
export default function ZenthiumReferralWizard() {
  // State management following proposal system pattern
  const [currentStep, setCurrentStep] = useState(1);
  const [referralData, setReferralData] = useState<ZenthiumReferralData>();
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate>();
  
  // Wizard steps
  const WIZARD_STEPS = [
    { id: 1, title: "Property Details", icon: Building, description: "Property and referral information" },
    { id: 2, title: "Contractor Info", icon: Users, description: "Contractor details" },
    { id: 3, title: "Review Agreement", icon: FileText, description: "Preview and customize" },
    { id: 4, title: "Sign & Send", icon: FileSignature, description: "Digital signature and distribution" }
  ];
}
```

#### Signature Component:
```typescript
// Reusable signature pad component
interface SignaturePadProps {
  onSignature: (signatureData: string) => void;
  signerName: string;
  signerTitle: string;
  mode: 'draw' | 'type';
}

export function SignaturePad({ onSignature, signerName, signerTitle, mode }: SignaturePadProps) {
  // Canvas drawing implementation
  // Typed signature implementation  
  // Base64 encoding
  // Validation
}
```

### 9. Email Templates

#### Contractor Notification:
- Subject: "Property Location Introduction Agreement - [Property Address]"
- Body: Include agreement details, signing link, contact information
- Attachment: Signed PDF (when completed)

#### Admin Notifications:
- New referral created
- Agreement signed
- Document completed

### 10. Security & Compliance

#### Security Measures:
- **Authentication**: Leverage existing Firebase Auth
- **Authorization**: Admin-only access control
- **Data Encryption**: Base64 encoding for document storage
- **Audit Trail**: Track all document actions
- **IP Logging**: Capture signer IP addresses

#### Legal Compliance:
- **Electronic Signature Act**: Comply with ESIGN/UETA
- **Record Retention**: Store documents for required period
- **Consent Tracking**: Record explicit consent to electronic signatures
- **Document Integrity**: Ensure documents cannot be altered after signing

### 11. Testing Strategy

#### Unit Tests:
- Form validation logic
- Signature capture functionality
- Template field replacement
- Base64 encoding/decoding

#### Integration Tests:
- End-to-end wizard flow
- Email sending functionality
- Document generation
- Database operations

#### User Acceptance Tests:
- Admin workflow testing
- Contractor signing process
- Document download functionality
- Error handling scenarios

### 12. Deployment Considerations

#### Environment Variables:
```env
NEXT_PUBLIC_ZENTHIUM_ADMIN_EMAIL=admin@zenthium.com
ZENTHIUM_EMAIL_FROM=noreply@strategicvalueplus.com
ZENTHIUM_EMAIL_REPLY=referrals@strategicvalueplus.com
ZENTHIUM_SIGNATURE_STORAGE_PATH=zenthium/signatures
```

#### Feature Flags:
- Enable/disable Zenthium referrals
- Test mode for signature workflows
- Debug mode for document generation

### 13. Performance Optimization

#### Document Handling:
- Lazy loading of large documents
- Progressive image loading for signatures
- Caching of template data
- Optimized base64 encoding

#### UI Performance:
- Step-by-step loading
- Form validation debouncing
- Signature canvas optimization
- Responsive design for mobile devices

### 14. Error Handling & User Experience

#### Error Scenarios:
- Network failures during signing
- Invalid email addresses
- Document generation failures
- Email sending failures

#### User Experience:
- Clear progress indicators
- Auto-save functionality
- Error recovery options
- Help text and tooltips
- Loading states and animations

### 15. Future Enhancements

#### Phase 2 Features:
- Bulk referral creation
- Advanced reporting dashboard
- Integration with CRM systems
- Mobile app support
- Advanced document analytics

#### Integration Opportunities:
- Connect with property management systems
- Automated fee tracking
- Integration with accounting systems
- API for third-party integrations

## Implementation Priority

### Phase 1 (MVP):
1. Basic wizard creation
2. Template management
3. Digital signature capture
4. Document generation and storage
5. Email distribution

### Phase 2 (Enhancement):
1. Advanced reporting
2. Bulk operations
3. Mobile optimization
4. API development
5. Third-party integrations

## Success Metrics

- **User Adoption**: Number of agreements created per month
- **Completion Rate**: Percentage of started wizards completed
- **Signing Time**: Average time from creation to signature
- **Error Rate**: Percentage of failed document generations
- **User Satisfaction**: Feedback scores from admin users

This comprehensive prompt provides a complete roadmap for developing the Zenthium referral agreement wizard, leveraging the existing proposal system architecture while adding specialized functionality for property management referrals and digital signatures.
