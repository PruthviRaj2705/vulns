// INTENTIONALLY VULNERABLE client code - SAST test only.

// [Vuln] DOM XSS: URL fragment/query written straight into the DOM
const params = new URLSearchParams(window.location.search);
document.getElementById('out').innerHTML = params.get('msg');

function search() {
  const q = document.getElementById('q').value;
  // [Vuln] DOM XSS via innerHTML / document.write
  document.getElementById('out').innerHTML = 'Results for ' + q;
  document.write('<p>' + q + '</p>');
}

function addComment() {
  const c = document.getElementById('comment').value;
  // [Vuln] Stored XSS pattern: unsanitised HTML insertion
  document.getElementById('comments').insertAdjacentHTML('beforeend', '<p>' + c + '</p>');
  // [Vuln] eval of user data
  eval('console.log("' + c + '")');
}

function login() {
  const body = JSON.stringify({
    user: document.getElementById('user').value,
    pass: document.getElementById('pass').value
  });
  fetch('http://localhost:3000/api/login', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } })
    .then(r => r.json())
    // [Hotspot] Auth token stored in localStorage
    .then(d => localStorage.setItem('token', d.token));
}

// [Vuln] postMessage handler without origin check
window.addEventListener('message', function (e) {
  document.getElementById('out').innerHTML = e.data;
});

// [Vuln] Open redirect / javascript: URL from query string
if (params.get('next')) { window.location = params.get('next'); }

// [Vuln] setTimeout with string argument (implicit eval)
setTimeout("console.log('tick')", 1000);

// [Hotspot] Math.random for session id
const sessionId = Math.random().toString(16);

// [Vuln] Hard-coded API key in client bundle
const API_KEY = 'AKIAIOSFODNN7EXAMPLE';
