export { logMessage } from "./log-message";
export type { ChannelConfig, LogMessageParams } from "./types";

export {
  logCampaignAppliedEmail,
  logFeedbackLinkEmail,
  logLoyaltyEarnEmail,
  logNegativeFeedbackAlertEmail,
  logOtpEmail,
  logReferralClaimEmail,
} from "./email";

export {
  logCampaignAppliedWhatsApp,
  logFeedbackLinkWhatsApp,
  logLoyaltyEarnWhatsApp,
  logNegativeFeedbackAlertWhatsApp,
  logOtpWhatsApp,
  logReferralClaimWhatsApp,
} from "./whatsapp";

export {
  logCampaignAppliedSms,
  logFeedbackLinkSms,
  logLoyaltyEarnSms,
  logNegativeFeedbackAlertSms,
  logOtpSms,
  logReferralClaimSms,
} from "./sms";
