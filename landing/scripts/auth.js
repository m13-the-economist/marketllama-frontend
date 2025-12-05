// landing/scripts/auth.js

(function (window, document) {
  const cfg = window.ML_CONFIG || {};
  const API_BASE_URL = cfg.API_BASE_URL || "http://72.61.201.223:8000";
  const DASHBOARD_URL =
    cfg.DASHBOARD_URL || `${window.location.origin}/dashboard/accounts.html`;

  const VERIFY_EMAIL_URL =
    cfg.VERIFY_EMAIL_URL ||
    `${window.location.origin}/landing/verify-email.html`;

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
    field.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ---------------------------------
  // STRICT EMAIL VALIDATION
  // ---------------------------------
  // Rules:
  // - Must be basic email format: local@domain.tld
  // - If domain looks like gmail/yahoo/outlook, it MUST be exactly:
  //     gmail.com, yahoo.com, outlook.com
  //   Anything like gm.com, gmai.com, gmail.co, gmail.con, yahho.com, outlok.com, etc. = INVALID.
  // - Other providers (company.com, protonmail.com, etc.) are allowed if they match the basic pattern.
  function isRoughEmail(value) {
    if (!value) return false;

    const trimmed = value.trim().toLowerCase();

    // Basic email pattern
    const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicPattern.test(trimmed)) return false;

    const parts = trimmed.split("@");
    if (parts.length !== 2) return false;

    const local = parts[0];
    const domain = parts[1];

    if (!local || !domain) return false;

    const coreNames = ["gmail", "yahoo", "outlook"];
    const coreDomains = ["gmail.com", "yahoo.com", "outlook.com"];

    // ✅ Exact match for the big three -> always valid
    if (coreDomains.includes(domain)) {
      return true;
    }

    // ❌ If domain ends with .com and is a *shortened/prefix* of gmail/yahoo/outlook,
    //    treat as a typo and reject. Examples:
    //    gm.com, gma.com, gmai.com, yah.com, ya.com, outl.com, outloo.com, etc.
    if (domain.endsWith(".com")) {
      const base = domain.slice(0, -4); // strip ".com"
      for (const core of coreNames) {
        if (core.startsWith(base) && base !== core) {
          // Looks like an incomplete/typo version of the core provider
          return false;
        }
      }
    }

    // ❌ If domain contains gmail/yahoo/outlook but is NOT exactly their .com, reject.
    //    Examples: gmail.co, gmail.con, gmail.com.ng, yahoo.co.uk, outlook.co
    if (coreNames.some((core) => domain.includes(core))) {
      return false;
    }

    // ✅ Any other provider that passes the basic pattern is allowed (proper .com domain etc.)
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

  const MIN_PASSWORD_LENGTH = 8; // keep aligned with backend rules

  document.addEventListener("DOMContentLoaded", () => {
    const signinForm = document.getElementById("signinForm");
    const signupForm = document.getElementById("signupForm");

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

      // Clear errors on input
      [emailInput, passwordInput].forEach((field) => {
        if (!field) return;
        field.addEventListener("input", () => clearFieldError(field));
      });

      signinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearFormErrors(signinForm);

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        console.log("[auth] signin email:", email);
        console.log("[auth] signin password length:", password.length);

        let hasError = false;
        let firstInvalid = null;

        // Email validation
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

        // Password validation
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
            const msg = (extractBackendMessage(data) || "").toLowerCase();

            if (res.status === 401 || res.status === 400) {
              const text = "Incorrect email or password.";
              // Show as global + inline near password
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

          // Save token if backend returns one
          if (data && data.access_token) {
            localStorage.setItem("ml_access_token", data.access_token);
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

      // Optional: confirm password + terms if present in HTML
      const confirmPasswordInput = pickInput(signupForm, [
        'input[name="passwordConfirm"]',
        'input[id*="confirm"]',
        '#confirmPassword',
      ]);
      const termsCheckbox = pickInput(signupForm, [
        'input[name="terms"]',
        '#terms',
      ]);

      const submitBtn = signupForm.querySelector('button[type="submit"]');

      // Clear errors on input/change
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
        const termsChecked = termsCheckbox ? termsCheckbox.checked : true; // default true if checkbox not present

        console.log("[auth] signup email:", email);
        console.log("[auth] signup password length:", password.length);

        let hasError = false;
        let firstInvalid = null;

        // Email validation
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

        // Password validation
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

        // Confirm password if the field exists
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

        // Terms checkbox if present
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
              (msgLower.includes("already") &&
                (msgLower.includes("email") || msgLower.includes("registered")))
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

          // ✅ After backend creates the user, move to verify-email UI
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
  });
})(window, document);