// landing/scripts/config.js

(function (window) {
  const ORIGIN = window.location.origin;

  const ML_CONFIG = {
    // Backend API
    API_BASE_URL: "https://marketllama.com",

    // Where to send users AFTER successful login
    DASHBOARD_URL: `${ORIGIN}/dashboard/accounts.html`,

    // Auth-related front-end pages (all in /landing)
    SIGNIN_URL: `${ORIGIN}/landing/signin.html`,
    SIGNUP_URL: `${ORIGIN}/landing/signup.html`,
    RESET_PASSWORD_URL: `${ORIGIN}/landing/reset-password.html`,
    RESET_PASSWORD_CONFIRM_URL: `${ORIGIN}/landing/reset-password-confirm.html`,
    VERIFY_EMAIL_URL: `${ORIGIN}/landing/verify-email.html`,
    VERIFY_PHONE_URL: `${ORIGIN}/landing/verify-phone.html`,
    FINAL_STEP_URL: `${ORIGIN}/landing/final-step.html`,
  };

  window.ML_CONFIG = ML_CONFIG;
})(window);