# Settings Changes Summary

## Backend / DB Changes

### Referral reminders

- Added `reminderDelayDays` to the referral program data model.
- Added a Prisma migration for the new `reminderDelayDays` column.
- Updated referral create/update schemas and API handlers to save reminder delay days.
- Added validation so reminder delay days are required when `sendReminderToCustomer` is enabled.

### Referral reminder scheduling

- Updated referral claim handling to create scheduled reminder message logs when reminders are enabled.
- Added reminder logging helpers for WhatsApp, Email, and SMS.
- Extended shared message logging to support `scheduledAt`.

### Branding defaults

- Added shared branding fallback utilities so referral and feedback can inherit business default branding consistently.
- Standardized fallback default colors to:
  - Theme color: `#8651e1`
  - Text color: `#ffffff`

### Public API branding behavior

- Updated public referral APIs to resolve branding from service branding plus business default branding when default branding is enabled.
- Updated public feedback API to resolve branding with the same default-branding fallback logic.

## Frontend / Product Logic Changes

### SKU settings

- Replaced free-text unit entry in add/edit SKU flows with selectable unit options.
- Added a reusable unit options constant for consistency.

### Analytics dropdown styling

- Updated the shared analytics period selector styling so the date-range dropdown looks better and matches settings UI more closely.

### Referral onboarding

- Added reminder day input when `Send reminder` is enabled.
- Changed notification channel selection to card-style switches for easier use.
- Kept expiry-related fields visible in the referral setup flow.
- Changed subtitle in branding step from multiline textarea to single-line input.
- Added referral preview directly in onboarding step 4.
- Made onboarding branding inherit business default branding when `useDefaultBrandingForServices` is enabled.

### Referral existing settings

- Added reminder day configuration to existing referral notification settings.
- Changed notification channels to switch-based cards here as well.
- Made referral branding preview and editor use resolved branding defaults.

### Referral customer-facing pages

- Updated referral landing and claim pages to use the new shared branding fallback logic.
- Ensured fallback colors are aligned with the new business branding defaults.

### Feedback settings

- Simplified branding preview to only show the feedback page view.
- Moved thank-you style preview behavior into the Follow-up Messages section.
- Added positive and negative preview tabs in the Follow-up Messages section.
- Reduced preview scaling/scroll pressure so the preview fits better without excessive scrolling.
- Ensured feedback preview colors follow service/business branding defaults consistently.

### Feedback customer-facing page

- Updated default theme/text colors to the new standard branding defaults.
- Kept “How did you hear about us?” visible in preview and customer-facing page flow.
- Ensured feedback thank-you and form views use consistent branding fallback behavior.

### Business settings

- Updated business default branding save behavior so theme/text colors fall back to the new standard values if empty.
- Updated onboarding business creation so default branding starts with the new standard colors.

### Cashier settings

- Reduced the visual intensity of the `Active` badge background in the cashier detail sheet.

## Verification

- Ran: `pnpm --filter web typecheck`
- Result: passed

## Notes

- This summary focuses on logic and behavior changes, not every file-level implementation detail.
- Existing unrelated local changes such as [Readme.md](/Users/devitaliya/Documents/Code/reelo/apps/web/Readme.md) and [next-env.d.ts](/Users/devitaliya/Documents/Code/reelo/apps/web/next-env.d.ts) were left untouched.
