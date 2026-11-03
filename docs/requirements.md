# Sponsor-Backed Property Listing and Inquiry Requirements

## Story 1: Property Owner

As a registered property owner, I want to submit listing drafts so that prospective buyers can review them once verified by administrative staff.

Scope: Medium
Database role: authenticated user with a property_owner profile.

Acceptance criteria:
- Given an authenticated property owner, when a valid listing is submitted, then it is persisted with status = 'draft' and owner_id equal to auth.uid().
- Given an invalid payload or unknown field, when a listing is submitted, then the API returns HTTP 400 with structured validation errors and creates no record.
- Given no authenticated session, when a valid listing is submitted, then the API returns HTTP 401 and creates no record.
- Given Owner A and Owner B, when Owner A attempts to modify Owner B's listing, then access is denied.
- Given an owner's draft or rejected listing, when the owner updates it, then ownership is preserved and the owner cannot approve the listing.
- Given an approved or pending listing, when its owner attempts to update it, then access is denied.

Implementation traceability:
- Migration: ../supabase/migrations/20261029140000_exam_schema_persistence.sql
- Contract: ../src/schemas/property.ts
- Route: ../src/app/api/properties/route.ts — POST
- Verification: security-audit.md — owner isolation and status restrictions.

## Story 2: Public Inquirer

As a prospective neighborhood resident, I want to view approved properties alongside their tier-level sponsors and submit an inquiry without seeing prior inquiries from other users.

Scope: Large
Database roles: anon and authenticated public users.

Acceptance criteria:
- Given an anonymous visitor, when querying the public listing API, then only approved properties with at least one active sponsor are returned.
- Given a public listing response, when inspecting property fields, then only id, address, price, bedrooms, bathrooms, and square_feet are exposed as property attributes.
- Given an anonymous visitor, when reading sponsors, then only active sponsors are visible.
- Given an anonymous visitor, when reading property-sponsor associations, then only associations for approved properties and active sponsors are visible.
- Given a valid inquiry with an existing property, valid email, and message of at least 10 characters, when submitted, then the inquiry is saved.
- Given an anonymous visitor or unrelated authenticated user, when querying existing inquiries, then no inquiry rows are disclosed.
- Given a property owner, when querying inquiries, then only inquiries associated with that owner's properties are visible.
- Given invalid inquiry data, when insertion is attempted, then database constraints reject the insertion.

Implementation traceability:
- Migration: ../supabase/migrations/20261029140000_exam_schema_persistence.sql
- Public listing route: ../src/app/api/properties/route.ts — GET
- Inquiry insertion: Supabase inquiries table API protected by grants, constraints, and RLS.
- Verification: security-audit.md — anonymous reads, sponsor visibility, inquiry insertion, and inquiry privacy.

## Story 3: Platform Administrator

As a platform administrator, I want full override authority across all records and tables to conduct compliance audits.

Scope: Medium
Execution role: trusted server-side service role, following administrator authorization.

Acceptance criteria:
- Given authorized administrative execution, when reading or writing any of the five examination tables, then the operation succeeds subject to relational and check constraints.
- Given authorized administrative execution, when approving a property, then its status can be changed to approved.
- Given a browser client or ordinary authenticated user, when attempting to obtain administrative credentials or grant themselves an admin role, then access is denied.
- Given an ordinary listing request, when the server processes it, then it uses the caller's authenticated context rather than service-role privileges.

Implementation traceability:
- Migration: ../supabase/migrations/20261029140000_exam_schema_persistence.sql
- Server credential boundary: ../src/lib/supabaseServer.ts
- Route security boundary: ../src/app/api/properties/route.ts — GET and POST must not expose administrative privileges.
- Administrative verification: security-audit.md — controlled service-role operations across all five tables.

## Implementation Status

These criteria describe required behavior. Implementation and test results
must be verified separately; this document does not claim tests have passed.
