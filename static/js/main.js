const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('nav');
navToggle?.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('visible');
}), { threshold: .13 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const form = document.querySelector('#lead-form');
const status = document.querySelector('.form-status');
form?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true; button.textContent = 'Sending…'; status.textContent = '';
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch('/api/lead', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    status.textContent = result.message; form.reset();
  } catch (error) { status.textContent = error.message || 'Something went wrong. Please call us directly.'; }
  finally { button.disabled = false; button.innerHTML = 'Request a consultation <span>&rarr;</span>'; }
});
const mapNode = document.querySelector('#project-map');
if (mapNode && window.L) {
  const map = L.map('project-map', { scrollWheelZoom: false }).setView([25.6, 79.2], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  [
    [25.4484, 78.5685, 'Jhansi', 'Solar EPC installations and head office'],
    [26.8467, 80.9462, 'Lucknow', 'Sales and project coverage'],
    [26.4499, 80.3319, 'Kanpur', 'Rooftop solar installation'],
    [27.1767, 78.0081, 'Agra', 'Project coverage'],
    [23.2599, 77.4126, 'Bhopal', 'Project coverage'],
    [26.2183, 78.1828, 'Gwalior', 'Project coverage'],
    [25.3176, 82.9739, 'Banaras', 'Project coverage'],
    [26.5471, 80.4878, 'Unnao', 'Project coverage']
  ].forEach(([lat, lng, city, detail]) => L.marker([lat, lng]).addTo(map).bindPopup(`<strong>RS HIGH TECH INDIA</strong><br>${city}<br><small>${detail}</small>`));
}
