import { NextRequest, NextResponse } from "next/server";

const APOLLO_API_BASE = "https://api.apollo.io/v1";

// Apollo API endpoints
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, apiKey, searchParams } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Apollo API key is required", connected: false },
        { status: 400 }
      );
    }

    // Apollo requires X-Api-Key header for authentication
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apiKey,
    };

    switch (action) {
      case "test_connection": {
        // Test connection by making a simple search request
        try {
          const response = await fetch(`${APOLLO_API_BASE}/mixed_people/search`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              page: 1,
              per_page: 1,
            }),
          });

          const data = await response.json();
          
          if (response.ok || data.people !== undefined) {
            return NextResponse.json({ connected: true, message: "Connected to Apollo" });
          } else {
            return NextResponse.json(
              { connected: false, error: data.error || data.message || "Failed to connect to Apollo" },
              { status: response.status }
            );
          }
        } catch (err) {
          return NextResponse.json(
            { connected: false, error: "Network error connecting to Apollo" },
            { status: 500 }
          );
        }
      }

      case "search_people": {
        // Search for people/contacts
        const searchBody: Record<string, unknown> = {
          page: searchParams?.page || 1,
          per_page: searchParams?.per_page || 25,
        };

        // Only add non-empty arrays/strings
        if (searchParams?.titles?.length > 0) {
          searchBody.person_titles = searchParams.titles;
        }
        if (searchParams?.locations?.length > 0) {
          searchBody.person_locations = searchParams.locations;
        }
        if (searchParams?.industries?.length > 0) {
          searchBody.q_organization_keyword_tags = searchParams.industries;
        }
        if (searchParams?.keywords && searchParams.keywords.trim()) {
          searchBody.q_keywords = searchParams.keywords;
        }
        if (searchParams?.employee_ranges?.length > 0) {
          searchBody.organization_num_employees_ranges = searchParams.employee_ranges;
        }

        const response = await fetch(`${APOLLO_API_BASE}/mixed_people/search`, {
          method: "POST",
          headers,
          body: JSON.stringify(searchBody),
        });

        const data = await response.json();

        if (response.ok && data.people) {
          return NextResponse.json({
            connected: true,
            results: data.people || [],
            pagination: data.pagination || {},
            total: data.pagination?.total_entries || 0,
          });
        } else {
          return NextResponse.json(
            { connected: false, error: data.error || data.message || "Search failed", results: [] },
            { status: response.status }
          );
        }
      }

      case "search_by_company_title": {
        // Search for people by company name and job title
        const searchBody: Record<string, unknown> = {
          page: searchParams?.page || 1,
          per_page: searchParams?.per_page || 25,
        };

        // Company name is the primary search criteria
        if (searchParams?.companyName && searchParams.companyName.trim()) {
          searchBody.q_organization_name = searchParams.companyName.trim();
        }

        // Job titles to filter by
        if (searchParams?.titles?.length > 0) {
          searchBody.person_titles = searchParams.titles;
        }

        // Optional additional filters
        if (searchParams?.locations?.length > 0) {
          searchBody.person_locations = searchParams.locations;
        }
        if (searchParams?.employee_ranges?.length > 0) {
          searchBody.organization_num_employees_ranges = searchParams.employee_ranges;
        }

        const response = await fetch(`${APOLLO_API_BASE}/mixed_people/search`, {
          method: "POST",
          headers,
          body: JSON.stringify(searchBody),
        });

        const data = await response.json();

        if (response.ok && data.people) {
          return NextResponse.json({
            connected: true,
            results: data.people || [],
            pagination: data.pagination || {},
            total: data.pagination?.total_entries || 0,
          });
        } else {
          return NextResponse.json(
            { connected: false, error: data.error || data.message || "Search failed", results: [] },
            { status: response.status }
          );
        }
      }

      case "search_companies": {
        // Search for companies/organizations
        const companySearchBody: Record<string, unknown> = {
          page: searchParams?.page || 1,
          per_page: searchParams?.per_page || 25,
        };

        if (searchParams?.locations?.length > 0) {
          companySearchBody.organization_locations = searchParams.locations;
        }
        if (searchParams?.employee_ranges?.length > 0) {
          companySearchBody.organization_num_employees_ranges = searchParams.employee_ranges;
        }
        if (searchParams?.industries?.length > 0) {
          companySearchBody.q_organization_keyword_tags = searchParams.industries;
        }
        if (searchParams?.keywords && searchParams.keywords.trim()) {
          companySearchBody.q_keywords = searchParams.keywords;
        }

        const response = await fetch(`${APOLLO_API_BASE}/mixed_companies/search`, {
          method: "POST",
          headers,
          body: JSON.stringify(companySearchBody),
        });

        const data = await response.json();

        if (response.ok && data.organizations) {
          return NextResponse.json({
            connected: true,
            results: data.organizations || [],
            pagination: data.pagination || {},
            total: data.pagination?.total_entries || 0,
          });
        } else {
          return NextResponse.json(
            { connected: false, error: data.error || data.message || "Search failed", results: [] },
            { status: response.status }
          );
        }
      }

      case "enrich_person": {
        // Enrich a person's data
        const enrichBody: Record<string, unknown> = {};

        if (searchParams?.email) enrichBody.email = searchParams.email;
        if (searchParams?.first_name) enrichBody.first_name = searchParams.first_name;
        if (searchParams?.last_name) enrichBody.last_name = searchParams.last_name;
        if (searchParams?.company) enrichBody.organization_name = searchParams.company;
        if (searchParams?.linkedin_url) enrichBody.linkedin_url = searchParams.linkedin_url;

        const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
          method: "POST",
          headers,
          body: JSON.stringify(enrichBody),
        });

        const data = await response.json();

        if (response.ok && data.person) {
          return NextResponse.json({
            connected: true,
            person: data.person || null,
          });
        } else {
          return NextResponse.json(
            { connected: false, error: data.error || data.message || "Enrichment failed" },
            { status: response.status }
          );
        }
      }

      case "reveal_email": {
        // Reveal email for a specific person
        const personId = searchParams?.personId;
        const firstName = searchParams?.firstName;
        const lastName = searchParams?.lastName;
        const company = searchParams?.company;
        const linkedIn = searchParams?.linkedIn;
        
        // Helper to check if email is a placeholder
        const isPlaceholder = (email: string) => 
          !email || 
          email.includes("email_not_unlocked") || 
          email.includes("@domain.com") ||
          email === "email@domain.com";

        // Helper to extract email from person/contact object
        const extractEmail = (person: Record<string, unknown>): string | null => {
          // Check primary email
          if (person.email && !isPlaceholder(person.email as string)) {
            return person.email as string;
          }
          // Check personal_emails array
          const personalEmails = person.personal_emails as string[] | undefined;
          if (personalEmails?.length) {
            const validEmail = personalEmails.find((e: string) => !isPlaceholder(e));
            if (validEmail) return validEmail;
          }
          // Check work email
          if (person.work_email && !isPlaceholder(person.work_email as string)) {
            return person.work_email as string;
          }
          // Check contact email
          if (person.contact_email && !isPlaceholder(person.contact_email as string)) {
            return person.contact_email as string;
          }
          return null;
        };

        // FIRST: Search Apollo's saved contacts (already unlocked data)
        // This searches contacts that have been added to the user's Apollo database
        if (firstName && lastName) {
          try {
            const contactSearchResponse = await fetch(`${APOLLO_API_BASE}/contacts/search`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                q_keywords: `${firstName} ${lastName}`,
                per_page: 25,
              }),
            });

            const contactSearchData = await contactSearchResponse.json();
            console.log("Apollo contacts/search response for email:", JSON.stringify(contactSearchData, null, 2));

            if (contactSearchResponse.ok && contactSearchData.contacts?.length > 0) {
              // Find the matching contact by name (relaxed matching - just check name match)
              const matchingContact = contactSearchData.contacts.find((c: Record<string, unknown>) => {
                const contactFirstName = ((c.first_name || "") as string).toLowerCase().trim();
                const contactLastName = ((c.last_name || "") as string).toLowerCase().trim();
                const searchFirstName = (firstName || "").toLowerCase().trim();
                const searchLastName = (lastName || "").toLowerCase().trim();
                
                // Match if first and last name match
                const nameMatch = contactFirstName === searchFirstName && contactLastName === searchLastName;
                
                // Optionally also check company if provided
                if (company) {
                  const org = c.organization as Record<string, unknown> | undefined;
                  const contactCompany = ((c.organization_name || org?.name || "") as string).toLowerCase();
                  const searchCompany = company.toLowerCase();
                  const companyMatch = contactCompany.includes(searchCompany) || searchCompany.includes(contactCompany) || !contactCompany;
                  return nameMatch && companyMatch;
                }
                
                return nameMatch;
              });

              if (matchingContact) {
                const email = extractEmail(matchingContact);
                console.log("Found matching contact in Apollo saved contacts:", {
                  name: `${matchingContact.first_name} ${matchingContact.last_name}`,
                  email: email,
                  hasEmail: !!email,
                });
                if (email) {
                  console.log("Returning email from saved contacts (no credits used):", email);
                  return NextResponse.json({
                    connected: true,
                    email,
                    person: matchingContact,
                    source: "saved_contacts",
                    creditsUsed: false,
                  });
                }
              }
            }
          } catch (err) {
            console.log("Contacts search failed, trying other methods:", err);
          }
        }

        // SECOND: Try Apollo's people/enrich endpoint (consumes credits to reveal data)
        if (firstName && lastName && company) {
          const enrichBody: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName,
            organization_name: company,
            reveal_personal_emails: true,
            reveal_phone_number: true,
          };
          
          if (linkedIn) {
            enrichBody.linkedin_url = linkedIn;
          }

          console.log("Calling Apollo people/enrich with:", JSON.stringify(enrichBody, null, 2));

          const response = await fetch(`${APOLLO_API_BASE}/people/enrich`, {
            method: "POST",
            headers,
            body: JSON.stringify(enrichBody),
          });

          const data = await response.json();
          console.log("Apollo people/enrich response:", JSON.stringify(data, null, 2));

          if (response.ok && data.person) {
            const email = extractEmail(data.person);
            
            return NextResponse.json({
              connected: true,
              email,
              person: data.person,
              source: "people_enrich",
              creditsUsed: true,
              debug: { 
                hasEmail: !!data.person.email, 
                hasPersonalEmails: data.person.personal_emails?.length > 0,
                emailValue: data.person.email,
                personalEmails: data.person.personal_emails,
              }
            });
          }
        }
        
        // THIRD: Try Apollo's people/match endpoint as fallback
        if (firstName && lastName && company) {
          const matchBody: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName,
            organization_name: company,
            reveal_personal_emails: true,
            reveal_phone_number: true,
          };
          
          if (linkedIn) {
            matchBody.linkedin_url = linkedIn;
          }

          const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
            method: "POST",
            headers,
            body: JSON.stringify(matchBody),
          });

          const data = await response.json();
          console.log("Apollo people/match response:", JSON.stringify(data, null, 2));

          if (response.ok && data.person) {
            const email = extractEmail(data.person);
            
            return NextResponse.json({
              connected: true,
              email,
              person: data.person,
              source: "people_match",
              debug: { 
                hasEmail: !!data.person.email, 
                hasPersonalEmails: data.person.personal_emails?.length > 0,
                emailValue: data.person.email,
                personalEmails: data.person.personal_emails,
              }
            });
          }
        }

        // THIRD: Try with LinkedIn URL if available
        if (linkedIn) {
          const linkedInResponse = await fetch(`${APOLLO_API_BASE}/people/match`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              linkedin_url: linkedIn,
              reveal_personal_emails: true,
            }),
          });

          const linkedInData = await linkedInResponse.json();

          if (linkedInResponse.ok && linkedInData.person) {
            const email = extractEmail(linkedInData.person);
            
            return NextResponse.json({
              connected: true,
              email,
              person: linkedInData.person,
              source: "linkedin_match",
            });
          }
        }
        
        return NextResponse.json(
          { connected: true, error: "Email not available in Apollo for this contact", email: null },
          { status: 200 }
        );
      }

      case "reveal_phone": {
        // Reveal phone for a specific person
        const personId = searchParams?.personId;
        const firstName = searchParams?.firstName;
        const lastName = searchParams?.lastName;
        const company = searchParams?.company;
        const linkedIn = searchParams?.linkedIn;
        
        // Helper to extract phone from person object
        const extractPhone = (person: Record<string, unknown>): string | null => {
          // Check phone_numbers array first
          const phoneNumbers = person.phone_numbers as Array<{ sanitized_number?: string; raw_number?: string }> | undefined;
          if (phoneNumbers && phoneNumbers.length > 0) {
            const firstPhone = phoneNumbers[0];
            if (firstPhone) {
              return firstPhone.sanitized_number || firstPhone.raw_number || null;
            }
          }
          // Check other phone fields
          if (person.mobile_phone) return person.mobile_phone as string;
          if (person.corporate_phone) return person.corporate_phone as string;
          if (person.direct_phone) return person.direct_phone as string;
          if (person.phone) return person.phone as string;
          return null;
        };

        // FIRST: Search Apollo's saved contacts (already unlocked data)
        if (firstName && lastName) {
          try {
            const contactSearchResponse = await fetch(`${APOLLO_API_BASE}/contacts/search`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                q_keywords: `${firstName} ${lastName}`,
                per_page: 25,
              }),
            });

            const contactSearchData = await contactSearchResponse.json();
            console.log("Apollo contacts/search for phone:", JSON.stringify(contactSearchData, null, 2));

            if (contactSearchResponse.ok && contactSearchData.contacts?.length > 0) {
              // Find the matching contact by name (relaxed matching)
              const matchingContact = contactSearchData.contacts.find((c: Record<string, unknown>) => {
                const contactFirstName = ((c.first_name || "") as string).toLowerCase().trim();
                const contactLastName = ((c.last_name || "") as string).toLowerCase().trim();
                const searchFirstName = (firstName || "").toLowerCase().trim();
                const searchLastName = (lastName || "").toLowerCase().trim();
                
                // Match if first and last name match
                const nameMatch = contactFirstName === searchFirstName && contactLastName === searchLastName;
                
                // Optionally also check company if provided
                if (company) {
                  const org = c.organization as Record<string, unknown> | undefined;
                  const contactCompany = ((c.organization_name || org?.name || "") as string).toLowerCase();
                  const searchCompany = company.toLowerCase();
                  const companyMatch = contactCompany.includes(searchCompany) || searchCompany.includes(contactCompany) || !contactCompany;
                  return nameMatch && companyMatch;
                }
                
                return nameMatch;
              });

              if (matchingContact) {
                const phone = extractPhone(matchingContact);
                console.log("Found matching contact in Apollo saved contacts for phone:", {
                  name: `${matchingContact.first_name} ${matchingContact.last_name}`,
                  phone: phone,
                  hasPhone: !!phone,
                });
                if (phone) {
                  console.log("Returning phone from saved contacts (no credits used):", phone);
                  return NextResponse.json({
                    connected: true,
                    phone,
                    person: matchingContact,
                    source: "saved_contacts",
                    creditsUsed: false,
                  });
                }
              }
            }
          } catch (err) {
            console.log("Contacts search failed, trying other methods:", err);
          }
        }

        // SECOND: Try Apollo's people/enrich endpoint (consumes credits to reveal data)
        if (firstName && lastName && company) {
          const enrichBody: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName,
            organization_name: company,
            reveal_phone_number: true,
            reveal_personal_emails: true,
          };
          
          if (linkedIn) {
            enrichBody.linkedin_url = linkedIn;
          }

          console.log("Calling Apollo people/enrich for phone with:", JSON.stringify(enrichBody, null, 2));

          const response = await fetch(`${APOLLO_API_BASE}/people/enrich`, {
            method: "POST",
            headers,
            body: JSON.stringify(enrichBody),
          });

          const data = await response.json();
          console.log("Apollo people/enrich for phone response:", JSON.stringify(data, null, 2));

          if (response.ok && data.person) {
            const phone = extractPhone(data.person);
            
            return NextResponse.json({
              connected: true,
              phone,
              person: data.person,
              source: "people_enrich",
              creditsUsed: true,
              debug: {
                phoneNumbers: data.person.phone_numbers,
                mobilePhone: data.person.mobile_phone,
                corporatePhone: data.person.corporate_phone,
              }
            });
          }
        }
        
        // THIRD: Try Apollo's people/match endpoint as fallback
        if (firstName && lastName && company) {
          const matchBody: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName,
            organization_name: company,
            reveal_phone_number: true,
            reveal_personal_emails: true,
          };
          
          if (linkedIn) {
            matchBody.linkedin_url = linkedIn;
          }

          const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
            method: "POST",
            headers,
            body: JSON.stringify(matchBody),
          });

          const data = await response.json();
          console.log("Apollo people/match for phone:", JSON.stringify(data, null, 2));

          if (response.ok && data.person) {
            const phone = extractPhone(data.person);
            
            return NextResponse.json({
              connected: true,
              phone,
              person: data.person,
              source: "people_match",
              debug: {
                phoneNumbers: data.person.phone_numbers,
                mobilePhone: data.person.mobile_phone,
                corporatePhone: data.person.corporate_phone,
              }
            });
          }
        }

        // THIRD: Try with LinkedIn URL if available
        if (linkedIn) {
          const linkedInResponse = await fetch(`${APOLLO_API_BASE}/people/match`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              linkedin_url: linkedIn,
              reveal_phone_number: true,
            }),
          });

          const linkedInData = await linkedInResponse.json();

          if (linkedInResponse.ok && linkedInData.person) {
            const phone = extractPhone(linkedInData.person);
            
            return NextResponse.json({
              connected: true,
              phone,
              person: linkedInData.person,
              source: "linkedin_match",
            });
          }
        }
        
        return NextResponse.json(
          { connected: true, error: "Phone not available in Apollo for this contact", phone: null },
          { status: 200 }
        );
      }

      case "bulk_reveal": {
        // Bulk reveal emails and phones for multiple people
        const personIds = searchParams?.personIds;
        
        if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
          return NextResponse.json(
            { error: "Person IDs array is required", connected: false },
            { status: 400 }
          );
        }

        // Process in batches to avoid rate limiting
        const results: { id: string; email?: string; phone?: string }[] = [];
        
        for (const personId of personIds) {
          try {
            const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                id: personId,
                reveal_personal_emails: true,
                reveal_phone_number: true,
              }),
            });

            const data = await response.json();
            
            if (response.ok && data.person) {
              results.push({
                id: personId,
                email: data.person.email || data.person.personal_emails?.[0] || undefined,
                phone: data.person.phone_numbers?.[0]?.sanitized_number || 
                       data.person.mobile_phone || 
                       data.person.corporate_phone || undefined,
              });
            }
          } catch (err) {
            console.error(`Error revealing contact ${personId}:`, err);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return NextResponse.json({
          connected: true,
          results,
          total: results.length,
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action", connected: false },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Apollo API error:", error);
    return NextResponse.json(
      { error: "Internal server error", connected: false },
      { status: 500 }
    );
  }
}

// GET endpoint to check connection status
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-apollo-api-key");

  if (!apiKey) {
    return NextResponse.json({ connected: false, error: "No API key provided" });
  }

  try {
    const response = await fetch(`${APOLLO_API_BASE}/auth/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
    });

    if (response.ok) {
      return NextResponse.json({ connected: true });
    } else {
      return NextResponse.json({ connected: false, error: "Invalid API key or connection failed" });
    }
  } catch (error) {
    return NextResponse.json({ connected: false, error: "Failed to connect to Apollo" });
  }
}
