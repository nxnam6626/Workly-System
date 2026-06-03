# CV Degrees and Certifications Extraction and Verification Plan

Detailed plan to implement automatic extraction of degrees and certifications from CVs, saving them in candidate profiles, notifying them to upload proof, and allowing verification via international credential links or semi-automated admin review.

## Overview
This feature automatically detects, stores, and manages verification credentials (certifications & academic degrees) parsed from candidate CVs. It allows candidates to upload proofs/documents later for confirmation and lets admins approve/reject submissions through an administrative dashboard.

## Project Type
- **WEB** (Next.js Client)
- **BACKEND** (NestJS Server with Prisma)

## Success Criteria
1. **CV Parsing:** Parsing CV automatically populates `Certification` and a new `Degree` table.
2. **Alert Notifications:** Candidates receive in-app notifications if new credentials are detected.
3. **Profile Updates:** Candidates can view status badges for each credential and upload proof documents.
4. **Admin Dashboard:** Admins can review pending approvals, view documents, and update verification status (VERIFIED/REJECTED) with custom feedback.

---

## Technical Stack & Database Changes

- **NestJS** + **Next.js** + **Prisma ORM** + **PostgreSQL**
- New Enum in `schema.prisma`:
  ```prisma
  enum VerificationStatus {
    UNVERIFIED
    PENDING
    VERIFIED
    REJECTED
  }
  ```
- Enhanced `Certification` schema with `fileUrl`, `status`, `issueDate`, `issuer`, `credentialId`, `credentialUrl`, and `adminFeedback`.
- New `Degree` model linked to `Candidate`.

---

## Detailed Task Breakdown

### Phase 1: Database Setup & Migrations
- **Task 1.1: Update schema.prisma**
  - **Agent:** `database-architect`
  - **Skills:** `database-design`, `prisma-expert`
  - **INPUT:** Existing `schema.prisma`
  - **OUTPUT:** Updated `schema.prisma` with `VerificationStatus` enum, modified `Certification` model, and new `Degree` model.
  - **VERIFY:** Run `npx prisma validate` to ensure schema correctness.

- **Task 1.2: Generate and Apply Migration**
  - **Agent:** `database-architect`
  - **Skills:** `database-design`
  - **INPUT:** Updated `schema.prisma`
  - **OUTPUT:** New database migration files and updated Prisma Client.
  - **VERIFY:** Run `npx prisma migrate dev --name add_degree_and_verification_status` and ensure no database errors occur.

### Phase 2: Backend Business Logic
- **Task 2.1: Enhance CV Parsing Service**
  - **Agent:** `backend-specialist`
  - **Skills:** `nestjs-expert`, `python-patterns`
  - **INPUT:** `cv-parsing.service.ts`
  - **OUTPUT:** Prompts and schemas updated to extract degrees (degree, major, school, duration) and certs (name, organization, issueDate).
  - **VERIFY:** Mock parse text and check extracted JSON fields.

- **Task 2.2: Implement Notification Hooks**
  - **Agent:** `backend-specialist`
  - **Skills:** `nestjs-expert`
  - **INPUT:** `candidate-cv.service.ts`
  - **OUTPUT:** Hook that compares parsed certificates/degrees with existing ones, and triggers `NotificationsService` if new ones are detected.
  - **VERIFY:** Upload a new CV and check if a record is added to the `Notification` table.

- **Task 2.3: Update Candidate Profile Update Logic**
  - **Agent:** `backend-specialist`
  - **Skills:** `database-design`
  - **INPUT:** `candidate-management.service.ts`
  - **OUTPUT:** `update` function supports nested `degrees` array and detailed `certifications` parameters.
  - **VERIFY:** Call update API with new schema and verify DB contents.

- **Task 2.4: Create Verification Upload & Admin Endpoints**
  - **Agent:** `backend-specialist`
  - **Skills:** `nestjs-expert`
  - **INPUT:** `candidates.controller.ts` and new `admin-verifications.controller.ts`
  - **OUTPUT:** File upload verification endpoints for candidates and management/approval endpoints for admins.
  - **VERIFY:** Test file upload endpoint with Postman and confirm status transitions to `PENDING` and file is stored in Supabase.

### Phase 3: Frontend Client Integration
- **Task 3.1: Update profile-api.ts**
  - **Agent:** `frontend-specialist`
  - **Skills:** `react-best-practices`
  - **INPUT:** `profile-api.ts`
  - **OUTPUT:** Support for new `degrees` type, updated `certifications` fields, and new endpoint callers (`verifyCertification`, `verifyDegree`).
  - **VERIFY:** Verify type-checking passes successfully.

- **Task 3.2: Update Profile Layout & Verification Badges**
  - **Agent:** `frontend-specialist`
  - **Skills:** `frontend-design`, `react-best-practices`
  - **INPUT:** `app/(public)/(candidate)/profile/page.tsx`
  - **OUTPUT:** Rendered lists of Degrees and Certifications with their status badges (`UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`) and action buttons.
  - **VERIFY:** Visually inspect page on local server.

- **Task 3.3: Implement Upload Modal**
  - **Agent:** `frontend-specialist`
  - **Skills:** `frontend-design`
  - **INPUT:** `CertificationsModal.tsx` and new `DegreesModal.tsx` / `VerificationUploadModal.tsx`
  - **OUTPUT:** Modals to input certificate metadata and upload files for verification.
  - **VERIFY:** Upload a mock image and check if it sets status to PENDING on success.

- **Task 3.4: Build Admin Verification Dashboard**
  - **Agent:** `frontend-specialist`
  - **Skills:** `frontend-design`
  - **INPUT:** New page `app/(admin)/verifications/page.tsx`
  - **OUTPUT:** Table of pending verifications, preview file URLs, and buttons to approve or reject with custom feedback.
  - **VERIFY:** Check if admin updates propagate to the candidate profile and trigger status updates.

---

## Phase X: Verification Checklist

- [ ] Prisma Schema parses and migrates cleanly: `npx prisma validate`
- [ ] Backend Server compiles and starts successfully: `npm run start:dev`
- [ ] Frontend Client compiles and builds cleanly: `npm run build`
- [ ] No purple or violet color hexes are used in new designs (WCAG Accessibility compliance)
- [ ] Socratic Gate was respected and plan was reviewed by User.
