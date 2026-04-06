/**
 * Default input/copy for the public feedback form when admin has not set custom values.
 * Only form content: title, labels, placeholders, default thank-you message, reward copy.
 */

export const FEEDBACK_FORM_DEFAULTS = {
  /** Form heading when customer opens the feedback link */
  title: "We'd love your feedback",

  /** Default thank-you message after submit when admin hasn't set a custom one */
  followUpMessage: "Thank you for your feedback.",

  /** Thank-you card title after submit */
  thankYouTitle: "Thank you",

  /** Reward copy: "₹X has been added to your wallet" (amount inserted by caller) */
  rewardAddedToWallet: (amount: number) =>
    `₹${amount} has been added to your wallet.`,

  /** Form labels and placeholders */
  labels: {
    howWasExperience: "How was your experience?",
    commentOptional: "Comment (optional)",
    commentPlaceholder: "Tell us more...",
    whatCouldWeImprove: "What could we improve? (optional)",
    howDidYouHear: "How did you hear about us?",
    selectOption: "Select...",
    submitButton: "Submit feedback",
    submittingButton: "Submitting…",
    leaveReview: "Leave us a review",
  },

  /** Default selection options shown on the feedback form */
  selectionOptions: ["Service", "Ambience", "Cleanliness", "Value for money"],

  /** Fixed frontend choices for "How did you hear about us?" */
  howDidYouHearOptions: [
    "Google",
    "Instagram",
    "Others",
    "Friends",
    "Referral",
  ],
} as const;
