import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { COLLECTIONS, kioskDocumentUploadLinksCollection, kioskSpaApplicationsCollection } from "@/lib/schema";

// Document type configurations for AI analysis
const DOCUMENT_CONFIGS = {
  photo_id_front: {
    name: "Photo ID - Front",
    fields: ["fullName", "dateOfBirth", "address", "expirationDate"],
    patterns: {
      fullName: /([A-Z][a-z]+ [A-Z][a-z]+)/,
      dateOfBirth: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
      address: /(\d+\s+[\w\s]+,\s*[\w\s]+,\s*[A-Z]{2}\s*\d{5})/,
      expirationDate: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/
    }
  },
  photo_id_back: {
    name: "Photo ID - Back",
    fields: ["documentNumber", "issueDate", "class"],
    patterns: {
      documentNumber: /([A-Z0-9]{8,12})/,
      issueDate: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/
    }
  },
  social_security_card: {
    name: "Social Security Card",
    fields: ["ssn", "fullName"],
    patterns: {
      ssn: /(\d{3}-\d{2}-\d{4})/,
      fullName: /([A-Z][a-z]+ [A-Z][a-z]+)/
    }
  },
  tax_return: {
    name: "Tax Return",
    fields: ["filingStatus", "adjustedGrossIncome", "dependents", "taxYear"],
    patterns: {
      adjustedGrossIncome: /AGI\s*\$?([\d,]+)/,
      dependents: /Exemptions?:\s*(\d+)/,
      taxYear: /Tax Year\s*(\d{4})/
    }
  },
  pay_stub: {
    name: "Pay Stub",
    fields: ["employeeName", "payPeriod", "grossPay", "netPay", "employerName"],
    patterns: {
      grossPay: /Gross.*?\$?([\d,]+\.\d{2})/,
      netPay: /Net.*?\$?([\d,]+\.\d{2})/,
      payPeriod: /Pay Period:?\s*([\d\/\-\s]+)/
    }
  },
  utility_bill: {
    name: "Utility Bill",
    fields: ["serviceAddress", "accountNumber", "billDate", "amountDue"],
    patterns: {
      serviceAddress: /Service Address[:\s]*([\d\s\w,]+)/,
      accountNumber: /Account[:\s]*([\w\d-]+)/,
      amountDue: /Amount Due[:\s]*\$?([\d,]+\.\d{2})/
    }
  },
  insurance_card: {
    name: "Insurance Card",
    fields: ["memberName", "memberId", "groupNumber", "planType", "effectiveDate"],
    patterns: {
      memberId: /Member ID[:\s]*([\w\d-]+)/,
      groupNumber: /Group[:\s]*([\w\d-]+)/,
      effectiveDate: /Effective[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/
    }
  }
};

// Eligibility determination rules
const ELIGIBILITY_RULES = {
  incomeThreshold: {
    // 200% Federal Poverty Level (approximate values for 2024)
    householdSize1: 29160,
    householdSize2: 39440,
    householdSize3: 49720,
    householdSize4: 60000,
    householdSize5: 70280,
    householdSize6: 80560,
    householdSize7: 90840,
    householdSize8: 101120
  },
  residency: {
    requiredStates: ["NC"],
    proofDocuments: ["utility_bill", "photo_id_front", "photo_id_back"]
  },
  insurance: {
    uninsuredRequired: true,
    acceptablePrograms: ["medicaid", "medicare"],
    proofDocuments: ["insurance_card"]
  }
};

export async function POST(request: NextRequest) {
  let documentId: string | null = null;
  
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const body = await request.json();
    documentId = body.documentId;
    const { token } = body;

    if (!documentId || !token) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, token" },
        { status: 400 }
      );
    }

    // Validate the upload link token
    const uploadLinksRef = kioskDocumentUploadLinksCollection();
    if (!uploadLinksRef) {
      return NextResponse.json(
        { error: "Collection not available" },
        { status: 500 }
      );
    }

    const linkDoc = await getDoc(doc(uploadLinksRef, token));
    if (!linkDoc.exists()) {
      return NextResponse.json(
        { error: "Invalid or expired upload link" },
        { status: 400 }
      );
    }

    const linkData = linkDoc.data();
    
    // Get the uploaded document
    const documentsRef = collection(db, "kioskUploadedDocuments");
    const docRef = doc(documentsRef, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const document = docSnap.data();
    
    // Update status to processing
    await updateDoc(docRef, {
      aiStatus: "processing",
      aiStartedAt: Timestamp.now()
    });

    // Perform AI analysis
    const analysisResult = await analyzeDocument(document);
    
    // Store AI results
    await updateDoc(docRef, {
      aiStatus: "completed",
      aiResults: analysisResult,
      aiCompletedAt: Timestamp.now()
    });

    // Update the upload link with document analysis
    const currentDocuments = (linkData as any).documents || [];
    const updatedDocuments = currentDocuments.map((doc: any) => 
      doc.id === documentId 
        ? { ...doc, aiResults: analysisResult, aiStatus: "completed" }
        : doc
    );

    await updateDoc(doc(uploadLinksRef, token), {
      documents: updatedDocuments,
      updatedAt: Timestamp.now()
    });

    // If we have enough documents, run eligibility determination
    if (updatedDocuments.filter((doc: any) => doc.aiStatus === "completed").length >= 2) {
      const eligibilityResult = await determineEligibility(updatedDocuments, linkData.patientId);
      
      // Store eligibility results
      await updateDoc(doc(uploadLinksRef, token), {
        eligibilityDetermination: eligibilityResult,
        eligibilityDeterminedAt: Timestamp.now()
      });
    }

    return NextResponse.json({
      data: analysisResult
    });

  } catch (error) {
    console.error("Error in AI review:", error);
    
    // Update document status to failed
    try {
      if (documentId) {
        if (!db) throw new Error("Database not initialized");
        const documentsRef = collection(db, "kioskUploadedDocuments");
        await updateDoc(doc(documentsRef, documentId), {
          aiStatus: "failed",
          aiError: error instanceof Error ? error.message : "Unknown error",
          aiFailedAt: Timestamp.now()
        });
      }
    } catch (updateError) {
      console.error("Failed to update document status:", updateError);
    }

    return NextResponse.json(
      { error: "AI review failed" },
      { status: 500 }
    );
  }
}

async function analyzeDocument(document: any) {
  const { documentType, storageUrl, fileName } = document;
  const config = DOCUMENT_CONFIGS[documentType as keyof typeof DOCUMENT_CONFIGS];

  if (!config) {
    throw new Error(`Unsupported document type: ${documentType}`);
  }

  try {
    // Extract text from image using OCR (simulated for now)
    const extractedText = await extractTextFromImage(storageUrl);
    
    // Extract specific fields using patterns
    const extractedData: Record<string, any> = {};
    
    for (const field of config.fields) {
      const pattern = config.patterns[field as keyof typeof config.patterns];
      if (pattern) {
        const match = extractedText.match(pattern);
        if (match && match[1]) {
          extractedData[field] = match[1].trim();
        }
      }
    }

    // Validate document type
    const documentTypeConfirmed = validateDocumentType(extractedText, documentType);
    
    // Calculate confidence score
    const confidenceScore = calculateConfidence(extractedData, config.fields);

    return {
      documentType,
      documentTypeConfirmed,
      extractedData,
      confidenceScore,
      extractedText: extractedText.substring(0, 500), // Store first 500 chars for reference
      analyzedAt: new Date().toISOString(),
      discrepancies: checkDiscrepancies(extractedData, documentType)
    };

  } catch (error) {
    throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function extractTextFromImage(imageUrl: string): Promise<string> {
  // In a real implementation, this would use:
  // - Google Cloud Vision API
  // - Azure Computer Vision
  // - OpenAI GPT-4 Vision
  // - Tesseract.js for client-side processing
  
  // For now, return simulated text based on document type
  return `
    SAMPLE DOCUMENT TEXT
    This is simulated OCR text for demonstration purposes.
    In production, this would contain the actual extracted text from the document image.
    Name: John Doe
    Date of Birth: 01/15/1985
    Address: 123 Main Street, Raleigh, NC 27601
    Document Number: 123456789
    Expiration: 01/15/2030
  `;
}

function validateDocumentType(extractedText: string, expectedType: string): boolean {
  // Simple validation based on keywords
  const typeKeywords = {
    photo_id_front: ["driver", "license", "identification", "name", "date of birth"],
    photo_id_back: ["document", "number", "issue", "class"],
    social_security_card: ["social security", "ssn", "number"],
    tax_return: ["tax", "return", "income", "adjusted gross"],
    pay_stub: ["pay", "stub", "earnings", "gross", "net"],
    utility_bill: ["utility", "bill", "electric", "water", "gas"],
    insurance_card: ["insurance", "member", "id", "group", "plan"]
  };

  const keywords = typeKeywords[expectedType as keyof typeof typeKeywords] || [];
  const lowerText = extractedText.toLowerCase();
  
  return keywords.some(keyword => lowerText.includes(keyword));
}

function calculateConfidence(extractedData: Record<string, any>, requiredFields: string[]): number {
  const extractedFields = Object.keys(extractedData).length;
  const totalFields = requiredFields.length;
  
  if (totalFields === 0) return 0;
  
  let confidence = (extractedFields / totalFields) * 100;
  
  // Bonus for having key fields
  if (extractedData.fullName) confidence += 10;
  if (extractedData.dateOfBirth) confidence += 10;
  if (extractedData.address) confidence += 10;
  
  return Math.min(confidence, 100);
}

function checkDiscrepancies(extractedData: Record<string, any>, documentType: string): Array<{
  field: string;
  expected: string;
  found: string;
  severity: "low" | "medium" | "high";
}> {
  const discrepancies: Array<{
    field: string;
    expected: string;
    found: string;
    severity: "low" | "medium" | "high";
  }> = [];
  
  // Example discrepancy checks
  if (documentType === "photo_id_front") {
    if (extractedData.dateOfBirth) {
      const dob = new Date(extractedData.dateOfBirth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      
      if (age < 18) {
        discrepancies.push({
          field: "dateOfBirth",
          expected: "Adult (18+)",
          found: `Age ${age}`,
          severity: "high"
        });
      }
    }
  }
  
  if (documentType === "tax_return") {
    if (extractedData.adjustedGrossIncome) {
      const income = parseFloat(extractedData.adjustedGrossIncome.replace(/[^0-9.]/g, ""));
      
      if (income > 500000) {
        discrepancies.push({
          field: "adjustedGrossIncome",
          expected: "Within eligibility range",
          found: `$${income.toLocaleString()}`,
          severity: "medium"
        });
      }
    }
  }
  
  return discrepancies;
}

async function determineEligibility(documents: any[], patientId: string) {
  const factors = [];
  let overallConfidence = 0;
  let eligibleFactors = 0;
  let totalFactors = 0;

  // Income verification
  const incomeDocs = documents.filter(doc => 
    ["tax_return", "pay_stub"].includes(doc.documentType) && 
    doc.aiResults?.extractedData?.adjustedGrossIncome
  );

  if (incomeDocs.length > 0) {
    totalFactors++;
    const latestIncomeDoc = incomeDocs[0];
    const income = parseFloat(latestIncomeDoc.aiResults.extractedData.adjustedGrossIncome.replace(/[^0-9.]/g, ""));
    
    // Assume household size of 1 for now (would be determined from application)
    const threshold = ELIGIBILITY_RULES.incomeThreshold.householdSize1;
    const incomeEligible = income <= threshold;
    
    factors.push({
      name: "Income below 200% FPL",
      met: incomeEligible,
      details: `Income: $${income.toLocaleString()}, Threshold: $${threshold.toLocaleString()}`,
      source: "document" as const,
      confidence: latestIncomeDoc.aiResults.confidenceScore
    });
    
    if (incomeEligible) eligibleFactors++;
    overallConfidence += latestIncomeDoc.aiResults.confidenceScore;
  }

  // Residency verification
  const residencyDocs = documents.filter(doc => 
    ELIGIBILITY_RULES.residency.proofDocuments.includes(doc.documentType) &&
    doc.aiResults?.extractedData?.address
  );

  if (residencyDocs.length > 0) {
    totalFactors++;
    const addressDoc = residencyDocs[0];
    const address = addressDoc.aiResults.extractedData.address;
    const ncResident = address.includes("NC") || address.includes("North Carolina");
    
    factors.push({
      name: "NC Residency",
      met: ncResident,
      details: `Address: ${address}`,
      source: "document" as const,
      confidence: addressDoc.aiResults.confidenceScore
    });
    
    if (ncResident) eligibleFactors++;
    overallConfidence += addressDoc.aiResults.confidenceScore;
  }

  // Insurance verification
  const insuranceDocs = documents.filter(doc => 
    doc.documentType === "insurance_card" && doc.aiResults
  );

  if (insuranceDocs.length > 0) {
    totalFactors++;
    const insuranceDoc = insuranceDocs[0];
    const hasInsurance = true; // Would check for private insurance
    
    factors.push({
      name: "Uninsured or Underinsured",
      met: !hasInsurance, // Note: Logic depends on specific requirements
      details: `Insurance card detected`,
      source: "document" as const,
      confidence: insuranceDoc.aiResults.confidenceScore
    });
    
    if (!hasInsurance) eligibleFactors++;
    overallConfidence += insuranceDoc.aiResults.confidenceScore;
  } else {
    totalFactors++;
    eligibleFactors++;
    overallConfidence += 80; // Assume good if no insurance card provided
  }

  // Calculate overall status
  const eligibilityRatio = totalFactors > 0 ? eligibleFactors / totalFactors : 0;
  const avgConfidence = totalFactors > 0 ? overallConfidence / totalFactors : 0;
  
  let status: "likely_eligible" | "needs_review" | "likely_ineligible";
  if (eligibilityRatio >= 0.8 && avgConfidence >= 70) {
    status = "likely_eligible";
  } else if (eligibilityRatio >= 0.5 && avgConfidence >= 50) {
    status = "needs_review";
  } else {
    status = "likely_ineligible";
  }

  return {
    applicationId: patientId,
    status,
    factors,
    overallConfidence: Math.round(avgConfidence),
    generatedAt: new Date().toISOString(),
    reviewedByStaff: false,
    documentCount: documents.length,
    eligibilityRatio: Math.round(eligibilityRatio * 100)
  };
}
