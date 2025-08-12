const SUPABASE_URL = "https://xsoanrrdybimemacaror.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzb2FucnJkeWJpbWVtYWNhcm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNDg0OTQsImV4cCI6MjA2MTkyNDQ5NH0.GbdguCKb_UdXbtG4cAYqOCZV-ejjdL7YdRE7NHrb0vM";
const APP_DEEP_LINK = "compox://reset-password";
const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.yourcompany.compox";
const IOS_STORE_URL = "https://apps.apple.com/app/idYOUR_APP_ID";
const EMAIL_DEEP_LINK = "compox://login-callback";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~`+=\-_.?@$!%*#&])[A-Za-z\d~`+=\-_.?@$!%*#&]{8,}$/;

function getTokens() {
  let params = new URLSearchParams(window.location.hash.substring(1));
  if (!params.get("access_token")) {
    params = new URLSearchParams(window.location.search);
  }
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    exp: params.get("exp")
  };
}

function tryOpenAppReset() {
  const now = Date.now();
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = APP_DEEP_LINK;
  document.body.appendChild(iframe);

  setTimeout(() => {
    if (Date.now() - now < 1500) {
      document.getElementById("message-container").style.display = "none";
      document.getElementById("reset-container").style.display = "block";
    }
  }, 1000);
}

function initResetPassword() {
  const passwordInput = document.getElementById("password");
  const updateBtn = document.getElementById("update-btn");

  passwordInput.addEventListener("input", () => {
    const pwd = passwordInput.value;
    const rules = {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[~`+\=\-_.?@$!%*#&]/.test(pwd)
    };

    document.getElementById("rule-length").className = rules.length ? "valid" : "invalid";
    document.getElementById("rule-upper").className = rules.upper ? "valid" : "invalid";
    document.getElementById("rule-lower").className = rules.lower ? "valid" : "invalid";
    document.getElementById("rule-number").className = rules.number ? "valid" : "invalid";
    document.getElementById("rule-special").className = rules.special ? "valid" : "invalid";

    updateBtn.disabled = !passwordRegex.test(pwd);
  });

  document.getElementById("reset-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = passwordInput.value;
    const status = document.getElementById("status");

    if (!passwordRegex.test(password)) {
      status.textContent = "Password does not meet requirements.";
      status.className = "error";
      return;
    }

    const { error } = await supabaseClient.auth.updateUser({ password });

    if (error) {
      status.textContent = error.message;
      status.className = "error";
    } else {
      status.textContent = "Password updated successfully!";
      status.className = "success";
    }
  });

  const { access_token, refresh_token, exp } = getTokens();
  if (!access_token) {
    document.getElementById("message-container").innerHTML = "<p class='error'>Invalid or expired link.</p>";
  } else {
    if (exp && Date.now() / 1000 > parseInt(exp)) {
      document.getElementById("message-container").innerHTML = "<p class='error'>This reset link has expired.</p>";
    } else {
      supabaseClient.auth.setSession({ access_token, refresh_token: refresh_token || "" })
        .then(({ error }) => {
          if (error) {
            document.getElementById("message-container").innerHTML = `<p class='error'>${error.message}</p>`;
          } else {
            tryOpenAppReset();
          }
        });
    }
  }
}

function initEmailVerified() {
  setTimeout(() => {
    let hiddenCheck;

    function visibilityChange() {
      if (document.hidden) {
        hiddenCheck = true;
      }
    }
    document.addEventListener("visibilitychange", visibilityChange);

    window.location.href = EMAIL_DEEP_LINK;

    setTimeout(() => {
      document.removeEventListener("visibilitychange", visibilityChange);

      if (hiddenCheck) {
        document.getElementById("statusMessage").innerText = "Opening Compox...";
      } else {
        document.getElementById("statusMessage").innerText = "Compox is not installed.";
        const downloadLink = document.getElementById("downloadLink");
        downloadLink.style.display = "inline-block";

        if (/android/i.test(navigator.userAgent)) {
          downloadLink.href = ANDROID_STORE_URL;
        } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          downloadLink.href = IOS_STORE_URL;
        } else {
          downloadLink.href = "https://compox.com";
        }
      }
    }, 1500);
  }, 3200);
}

const params = new URLSearchParams(window.location.search);
if (params.get('page') === 'reset-password') {
  document.getElementById('reset-password-page').style.display = 'block';
  initResetPassword();
} else if (params.get('page') === 'email-verified') {
  document.getElementById('email-verified-page').style.display = 'block';
  initEmailVerified();
} else {
  document.body.innerHTML = "<h1>404 - Page not found</h1>";
}
