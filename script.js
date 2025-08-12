const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);

if (params.get('page') === 'reset-password') {
  document.getElementById('reset-password-page').style.display = 'block';
  // run reset password logic
} else if (params.get('page') === 'email-verified') {
  document.getElementById('email-verified-page').style.display = 'block';
  // run email verified logic
} else {
  document.body.innerHTML = "<h1>404 - Page not found</h1>";
}
