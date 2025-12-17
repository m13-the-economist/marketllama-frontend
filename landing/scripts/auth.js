// landing/scripts/auth.js
(function (window, document) {
  const cfg = window.ML_CONFIG || {};
  const API_BASE_URL = cfg.API_BASE_URL || "https://marketllama.com";

  const DASHBOARD_URL =
    cfg.DASHBOARD_URL || `${window.location.origin}/dashboard/accounts.html`;

  const VERIFY_EMAIL_URL =
    cfg.VERIFY_EMAIL_URL ||
    `${window.location.origin}/landing/verify-email.html`;

  const FINAL_STEP_URL =
    cfg.FINAL_STEP_URL ||
    `${window.location.origin}/landing/final-step.html`;

  const RESET_PASSWORD_CONFIRM_URL =
    cfg.RESET_PASSWORD_CONFIRM_URL ||
    `${window.location.origin}/landing/reset-password-confirm.html`;

  // -------------------------
  // Shared DOM helpers
  // -------------------------

  function pickInput(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getFieldKey(field) {
    if (!field) return null;
    return field.id || field.name || null;
  }

  function getErrorElementForField(field) {
    const key = getFieldKey(field);
    if (!key) return null;
    const form = field.form || field.closest("form") || document;
    return form.querySelector(`.field-error[data-error-for="${key}"]`);
  }

  function setFieldError(field, message) {
    if (!field) return;
    const errorEl = getErrorElementForField(field);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("is-visible");
    }
    field.classList.add("input-invalid");
  }

  function clearFieldError(field) {
    if (!field) return;
    const errorEl = getErrorElementForField(field);
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("is-visible");
    }
    field.classList.remove("input-invalid");
  }

  function clearFormErrors(form) {
    if (!form) return;

    form.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
      el.classList.remove("is-visible");
    });

    form.querySelectorAll(".input-invalid").forEach((el) => {
      el.classList.remove("input-invalid");
    });

    const globalError = form.querySelector("[data-form-error]");
    if (globalError) {
      globalError.textContent = "";
      globalError.classList.remove("is-visible");
    }
  }

  function setGlobalFormError(form, message) {
    if (!form) return;
    const globalError = form.querySelector("[data-form-error]");
    if (!globalError) return;
    globalError.textContent = message;
    globalError.classList.add("is-visible");
  }

  function focusFirstError(field) {
    if (!field) return;
    try {
      field.focus({ preventScroll: true });
    } catch (_) {
      try {
        field.focus();
      } catch (_) {}
    }
    try {
      field.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (_) {}
  }

  // ---------------------------------
  // STRICT EMAIL VALIDATION
  // ---------------------------------
  function isRoughEmail(value) {
    if (!value) return false;

    const trimmed = value.trim().toLowerCase();

    const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicPattern.test(trimmed)) return false;

    const parts = trimmed.split("@");
    if (parts.length !== 2) return false;

    const local = parts[0];
    const domain = parts[1];

    if (!local || !domain) return false;

    const coreNames = ["gmail", "yahoo", "outlook"];
    const coreDomains = ["gmail.com", "yahoo.com", "outlook.com"];

    if (coreDomains.includes(domain)) {
      return true;
    }

    if (domain.endsWith(".com")) {
      const base = domain.slice(0, -4);
      for (const core of coreNames) {
        if (core.startsWith(base) && base !== core) {
          return false;
        }
      }
    }

    if (coreNames.some((core) => domain.includes(core))) {
      return false;
    }

    return true;
  }

  function extractBackendMessage(data) {
    if (!data) return "";
    if (typeof data === "string") return data;
    return (
      data.detail ||
      data.message ||
      (Array.isArray(data.errors) && data.errors[0]?.msg) ||
      ""
    );
  }

  const MIN_PASSWORD_LENGTH = 8;

  // ==========================================
  // 1) SIGN IN, SIGN UP, RESET (STEP 1)
  // ==========================================
  document.addEventListener("DOMContentLoaded", () => {
    const signinForm = document.getElementById("signinForm");
    const signupForm = document.getElementById("signupForm");

    // 🔧 IMPORTANT: support both resetForm and resetPasswordForm
    const resetPasswordForm =
      document.getElementById("resetForm") ||
      document.getElementById("resetPasswordForm") ||
      document.querySelector('form[data-reset-step="request"]');

    // =========================
    // SIGN IN
    // =========================
    if (signinForm) {
      const emailInput = pickInput(signinForm, [
        'input[name="email"]',
        'input[id*="email"]',
        'input[type="email"]',
      ]);
      const passwordInput = pickInput(signinForm, [
        'input[name="password"]',
        'input[id*="password"]',
        'input[type="password"]',
      ]);
      const submitBtn = signinForm.querySelector('button[type="submit"]');

      [emailInput, passwordInput].forEach((field) => {
        if (!field) return;
        field.addEventListener("input", () => clearFieldError(field));
      });

      signinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearFormErrors(signinForm);

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        let hasError = false;
        let firstInvalid = null;

        if (!email) {
          hasError = true;
          firstInvalid = firstInvalid || emailInput;
          setFieldError(emailInput, "Enter your email.");
        } else if (!isRoughEmail(email)) {
          hasError = true;
          firstInvalid = firstInvalid || emailInput;
          setFieldError(
            emailInput,
            "Enter a valid email address (e.g. name@gmail.com, name@yahoo.com, name@outlook.com, or another correctly spelled .com address)."
          );
        }

        if (!password) {
          hasError = true;
          firstInvalid = firstInvalid || passwordInput;
          setFieldError(passwordInput, "Enter your password.");
        }

        if (hasError) {
          focusFirstError(firstInvalid);
          return;
        }

        const originalText = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Signing in...";
        }

        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          let data = null;
          try {
            data = await res.json();
          } catch (_) {
            data = null;
          }

          if (!res.ok) {
            if (res.status === 401 || res.status === 400) {
              const text = "Incorrect email or password.";
              setGlobalFormError(signinForm, text);
              if (passwordInput) {
                setFieldError(passwordInput, text);
                focusFirstError(passwordInput);
              }
            } else {
              setGlobalFormError(
                signinForm,
                extractBackendMessage(data) ||
                  "Sign in failed. Please check your details."
              );
            }
            return;
          }

          if (data && data.access_token) {
            localStorage.setItem("ml_access_token", data.access_token);
            localStorage.setItem("ml_user_email", email);
          }

          const lang =
            typeof window.getLang === "function" ? window.getLang() : "en";

          const url =
            DASHBOARD_URL.includes("?") || DASHBOARD_URL.includes("#")
              ? DASHBOARD_URL
              : `${DASHBOARD_URL}?lang=${lang}`;

          window.location.href = url;
        } catch (err) {
          console.error("Login error:", err);
          setGlobalFormError(
            signinForm,
            "Network error while signing in. Please try again."
          );
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      });
    }

    // =========================
    // SIGN UP (STEP 1)
    // =========================
    if (signupForm) {
      const emailInput = pickInput(signupForm, [
        'input[name="email"]',
        'input[id*="email"]',
        'input[type="email"]',
      ]);
      const passwordInput = pickInput(signupForm, [
        'input[name="password"]',
        'input[id*="password"]',
        'input[type="password"]',
      ]);

      const confirmPasswordInput = pickInput(signupForm, [
        'input[name="passwordConfirm"]',
        'input[id*="confirm"]',
        "#confirmPassword",
      ]);
      const termsCheckbox = pickInput(signupForm, [
        'input[name="terms"]',
        "#terms",
      ]);

      const submitBtn = signupForm.querySelector('button[type="submit"]');

      [emailInput, passwordInput, confirmPasswordInput].forEach((field) => {
        if (!field) return;
        field.addEventListener("input", () => clearFieldError(field));
      });

      if (termsCheckbox) {
        termsCheckbox.addEventListener("change", () =>
          clearFieldError(termsCheckbox)
        );
      }

      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearFormErrors(signupForm);

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const passwordConfirm = confirmPasswordInput
          ? confirmPasswordInput.value
          : "";
        const termsChecked = termsCheckbox ? termsCheckbox.checked : true;

        let hasError = false;
        let firstInvalid = null;

        if (!email) {
          hasError = true;
          firstInvalid = firstInvalid || emailInput;
          setFieldError(
            emailInput,
            "Enter a valid email address (e.g. name@gmail.com, name@yahoo.com, name@outlook.com, or another correctly spelled .com address)."
          );
        } else if (!isRoughEmail(email)) {
          hasError = true;
          firstInvalid = firstInvalid || emailInput;
          setFieldError(
            emailInput,
            "Enter a valid email address (e.g. name@gmail.com, name@yahoo.com, name@outlook.com, or another correctly spelled .com address)."
          );
        }

        if (!password) {
          hasError = true;
          firstInvalid = firstInvalid || passwordInput;
          setFieldError(passwordInput, "Password is required.");
        } else if (password.length < MIN_PASSWORD_LENGTH) {
          hasError = true;
          firstInvalid = firstInvalid || passwordInput;
          setFieldError(
            passwordInput,
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
          );
        }

        if (confirmPasswordInput) {
          if (!passwordConfirm) {
            hasError = true;
            firstInvalid = firstInvalid || confirmPasswordInput;
            setFieldError(
              confirmPasswordInput,
              "Please confirm your password."
            );
          } else if (passwordConfirm !== password) {
            hasError = true;
            firstInvalid = firstInvalid || confirmPasswordInput;
            setFieldError(
              confirmPasswordInput,
              "Passwords do not match."
            );
          }
        }

        if (termsCheckbox && !termsChecked) {
          hasError = true;
          firstInvalid = firstInvalid || termsCheckbox;
          setFieldError(
            termsCheckbox,
            "You must agree to the Terms and Privacy Policy to continue."
          );
        }

        if (hasError) {
          focusFirstError(firstInvalid);
          return;
        }

        const originalText = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Creating account...";
        }

        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          let data = null;
          try {
            data = await res.json();
          } catch (_) {
            data = null;
          }

          if (!res.ok) {
            const backendMsg = extractBackendMessage(data) || "";
            const msgLower = backendMsg.toLowerCase();

            if (
              emailInput &&
              msgLower.includes("already") &&
              (msgLower.includes("email") || msgLower.includes("registered"))
            ) {
              setFieldError(emailInput, "This email is already in use.");
              focusFirstError(emailInput);
            } else {
              setGlobalFormError(
                signupForm,
                backendMsg || "Sign up failed. Please check your details."
              );
            }
            return;
          }

          // Store pending credentials for verify-email
          localStorage.setItem("ml_pending_email", email);
          localStorage.setItem("ml_pending_password", password);

          window.location.href = VERIFY_EMAIL_URL;
        } catch (err) {
          console.error("Signup error:", err);
          setGlobalFormError(
            signupForm,
            "Network error while creating your account. Please try again."
          );
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      });
    }

    // =========================
    // RESET PASSWORD (STEP 1)
    // =========================
    if (resetPasswordForm) {
      const emailInput = pickInput(resetPasswordForm, [
        'input[name="email"]',
        'input[id*="email"]',
        'input[type="email"]',
      ]);
      const submitBtn =
        resetPasswordForm.querySelector('button[type="submit"]');

      if (emailInput) {
        emailInput.addEventListener("input", () => clearFieldError(emailInput));
      }

      resetPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearFormErrors(resetPasswordForm);

        const email = emailInput ? emailInput.value.trim() : "";

        let hasError = false;
        let firstInvalid = null;

        if (!email) {
          hasError = true;
          firstInvalid = firstInvalid || emailInput;
          setFieldError(emailInput, "Enter your email address.");
        } else if (!isRoughEmail(email)) {
          hasError = true;
          firstInvalid = firstInvalid || emailInput;
          setFieldError(
            emailInput,
            "Enter a valid email address (e.g. name@gmail.com, name@yahoo.com, name@outlook.com, or another correctly spelled .com address)."
          );
        }

        if (hasError) {
          focusFirstError(firstInvalid);
          return;
        }

        const originalText = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending reset link...";
        }

        try {
          const res = await fetch(
            `${API_BASE_URL}/api/auth/request-password-reset`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            }
          );

          let data = null;
          try {
            data = await res.json();
          } catch (_) {
            data = null;
          }

          if (!res.ok) {
            const backendMsg = extractBackendMessage(data) || "";
            const msgLower = backendMsg.toLowerCase();

            if (
              emailInput &&
              msgLower.includes("not found") &&
              msgLower.includes("email")
            ) {
              setFieldError(
                emailInput,
                "We couldn’t find an account with this email."
              );
              focusFirstError(emailInput);
            } else {
              setGlobalFormError(
                resetPasswordForm,
                backendMsg ||
                  "Could not start password reset. Please try again."
              );
            }
            return;
          }

          // Store email so confirm page can show it / reuse it
          localStorage.setItem("ml_reset_email", email);

          // Go to verify-reset-code page (step 2)
          window.location.href = RESET_PASSWORD_CONFIRM_URL;
        } catch (err) {
          console.error("Reset password error:", err);
          setGlobalFormError(
            resetPasswordForm,
            "Network error while requesting password reset. Please try again."
          );
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      });
    }
  });

  // ==========================================
  // 2) VERIFY EMAIL PAGE INITIALISER
  // ==========================================
  function initVerifyEmailPage() {
    const form = document.getElementById("verifyEmailForm");
    if (!form) return;

    const codeInputs = Array.from(form.querySelectorAll(".auth-code-input"));
    const errorEl = document.getElementById("verifyEmailError");
    const subtitleEl = document.getElementById("verifyEmailSubtitle");
    const resendLink = document.getElementById("resendEmailCode");
    const submitBtn = document.getElementById("verifyEmailSubmit");

    const pendingEmail = localStorage.getItem("ml_pending_email");
    const pendingPassword = localStorage.getItem("ml_pending_password");

    function showError(msg) {
      if (!errorEl) return;
      errorEl.textContent = msg || "";
      errorEl.style.display = msg ? "block" : "none";
    }

    function clearCodeErrors() {
      showError("");
      codeInputs.forEach((inp) => {
        inp.classList.remove("input-invalid");
      });
    }

    if (pendingEmail && subtitleEl) {
      subtitleEl.textContent =
        "Enter the 6-digit code we just sent to " + pendingEmail + ".";
    }

    if (!pendingEmail || !pendingPassword) {
      showError(
        "We couldn’t find your sign-up session. If this keeps happening, please start again from Create account."
      );
    }

    codeInputs.forEach((input, idx) => {
      input.addEventListener("input", (e) => {
        const val = e.target.value.replace(/\D/g, "");
        e.target.value = val.slice(-1);
        clearCodeErrors();
        if (val && idx < codeInputs.length - 1) {
          codeInputs[idx + 1].focus();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && idx > 0) {
          codeInputs[idx - 1].focus();
        }
        if (e.key === "ArrowLeft" && idx > 0) {
          e.preventDefault();
          codeInputs[idx - 1].focus();
        }
        if (e.key === "ArrowRight" && idx < codeInputs.length - 1) {
          e.preventDefault();
          codeInputs[idx + 1].focus();
        }
      });

      input.addEventListener("paste", (e) => {
        const text = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, codeInputs.length);
        if (!text) return;
        e.preventDefault();
        codeInputs.forEach((inp, i) => {
          inp.value = text[i] || "";
        });
        if (text.length === codeInputs.length) {
          codeInputs[codeInputs.length - 1].focus();
        }
      });
    });

    if (codeInputs[0]) {
      try {
        codeInputs[0].focus({ preventScroll: true });
      } catch (_) {
        codeInputs[0].focus();
      }
    }

    if (resendLink) {
      resendLink.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!pendingEmail) {
          showError("Session expired. Please start again from Create account.");
          return;
        }
        resendLink.textContent = "Resending...";
        resendLink.style.pointerEvents = "none";

        try {
          const res = await fetch(
            `${API_BASE_URL}/api/auth/resend-verification-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: pendingEmail }),
            }
          );

          if (!res.ok) {
            const data = await res.json().catch(() => null);
            showError(
              extractBackendMessage(data) ||
                "Could not resend code. Please try again."
            );
          } else {
            showError(
              "If an account exists for this email, a new verification code has been sent."
            );
          }
        } catch (err) {
          console.error("Resend code error:", err);
          showError("Network error while resending the code. Try again.");
        } finally {
          resendLink.textContent = "Resend code";
          resendLink.style.pointerEvents = "auto";
        }
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearCodeErrors();

      const code = codeInputs.map((i) => i.value.trim()).join("");
      if (!code || code.length !== 6) {
        codeInputs.forEach((inp) => inp.classList.add("input-invalid"));
        showError("Enter the 6-digit code sent to your email.");
        if (codeInputs[0]) focusFirstError(codeInputs[0]);
        return;
      }

      if (!pendingEmail || !pendingPassword) {
        showError(
          "We lost your sign-up session. Please go back and start again from Create account."
        );
        return;
      }

      const originalText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying...";
      }

      try {
        const verifyRes = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingEmail, code }),
        });

        let verifyData = null;
        try {
          verifyData = await verifyRes.json();
        } catch (_) {
          verifyData = null;
        }

        if (!verifyRes.ok) {
          const msg = (extractBackendMessage(verifyData) || "").toLowerCase();

          if (msg.includes("code") || msg.includes("invalid")) {
            codeInputs.forEach((inp) => inp.classList.add("input-invalid"));
            showError("Invalid or expired code. Check the code and try again.");
          } else {
            showError(
              extractBackendMessage(verifyData) ||
                "We couldn’t verify your email. Please try again."
            );
          }
          return;
        }

        const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: pendingEmail,
            password: pendingPassword,
          }),
        });

        let loginData = null;
        try {
          loginData = await loginRes.json();
        } catch (_) {
          loginData = null;
        }

        if (!loginRes.ok || !loginData || !loginData.access_token) {
          showError(
            extractBackendMessage(loginData) ||
              "We verified your email but could not sign you in automatically. Please try signing in again."
          );
          return;
        }

        localStorage.setItem("ml_access_token", loginData.access_token);
        localStorage.setItem("ml_user_email", pendingEmail);
        localStorage.removeItem("ml_pending_password");

        window.location.href = FINAL_STEP_URL;
      } catch (err) {
        console.error("Verify email error:", err);
        showError(
          "Network error while verifying your code. Please try again."
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Expose for verify-email.html
  window.initVerifyEmailPage = initVerifyEmailPage;
})(window, document);