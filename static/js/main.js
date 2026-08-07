const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('nav');
navToggle?.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('visible');
}), { threshold: .13 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Interactive Project Category Filter
const filterButtons = document.querySelectorAll('.filters button');
const projectCards = document.querySelectorAll('.project');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    const filter = button.dataset.filter || 'all';
    projectCards.forEach(card => {
      const category = card.dataset.category;
      if (filter === 'all' || category === filter) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

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

// Continuous Hero Background Video Playlist (Smooth Multi-Video Loop)
const heroVideo = document.querySelector('#hero-bg-video');
if (heroVideo && heroVideo.dataset.playlist) {
  try {
    const playlist = JSON.parse(heroVideo.dataset.playlist);
    let currentIndex = 0;
    let isTransitioning = false;

    const playNext = () => {
      if (isTransitioning || !playlist.length) return;
      isTransitioning = true;
      currentIndex = (currentIndex + 1) % playlist.length;
      
      heroVideo.style.transition = 'opacity 0.4s ease-in-out';
      heroVideo.style.opacity = '0.3';

      setTimeout(() => {
        heroVideo.src = playlist[currentIndex];
        heroVideo.load();
        const playPromise = heroVideo.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            heroVideo.style.opacity = '0.72';
            isTransitioning = false;
          }).catch(err => {
            console.warn('Background video playback catch:', err);
            heroVideo.style.opacity = '0.72';
            isTransitioning = false;
          });
        } else {
          heroVideo.style.opacity = '0.72';
          isTransitioning = false;
        }
      }, 350);
    };

    heroVideo.addEventListener('ended', playNext);
    heroVideo.addEventListener('error', () => {
      setTimeout(playNext, 1000);
    });
  } catch (err) {
    console.error('Failed to parse video playlist:', err);
  }
}

// Our Journey — Play Profile Modal
const playBtn     = document.querySelector('#btn-play-profile');
const modal       = document.querySelector('#journey-modal');
const modalClose  = document.querySelector('#journey-modal-close');
const journeyVid  = document.querySelector('#journey-video');

function openJourneyModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  journeyVid.play().catch(() => {});
}

function closeJourneyModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  journeyVid.pause();
  journeyVid.currentTime = 0;
}

playBtn?.addEventListener('click', openJourneyModal);
playBtn?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openJourneyModal(); } });
modalClose?.addEventListener('click', closeJourneyModal);
modal?.addEventListener('click', e => { if (e.target === modal) closeJourneyModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.classList.contains('open')) closeJourneyModal(); });

// Enforce single video playback across the entire page
document.addEventListener('play', function(e) {
  const activeVideo = e.target;
  if (activeVideo.id === 'hero-bg-video') return;

  document.querySelectorAll('video').forEach(video => {
    if (video !== activeVideo && video.id !== 'hero-bg-video') {
      video.pause();
    }
  });
}, true);

// Watch Site Video anchor scroll & auto-play
document.querySelectorAll('.project-video-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    const targetId = btn.getAttribute('href');
    const targetCard = document.querySelector(targetId);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const video = targetCard.querySelector('video');
      if (video) {
        video.play().catch(() => {});
      }
    }
  });
});






