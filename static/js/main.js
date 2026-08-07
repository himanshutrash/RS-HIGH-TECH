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
  button.disabled = true; button.textContent = 'Sendingâ€¦'; status.textContent = '';
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

// Our Journey â€” Play Profile Modal
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

// â”€â”€ Gallery Lightbox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function () {
  const lightbox   = document.getElementById('lightbox');
  const lbImg      = document.getElementById('lightbox-img');
  const lbCaption  = document.getElementById('lightbox-caption');
  const lbClose    = document.getElementById('lightbox-close');
  const lbPrev     = document.getElementById('lightbox-prev');
  const lbNext     = document.getElementById('lightbox-next');
  const lbBackdrop = document.getElementById('lightbox-backdrop');

  if (!lightbox) return;

  // Collect all gallery images
  const cgItems = Array.from(document.querySelectorAll('.cg-item'));
  let current = 0;

  function openLightbox(index) {
    current = index;
    const item = cgItems[index];
    const img  = item.querySelector('img');
    const cap  = item.querySelector('.cg-overlay span');
    lbImg.src             = img.src;
    lbImg.alt             = img.alt || 'Project photo';
    lbCaption.textContent = cap ? cap.textContent : '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  function showPrev() {
    current = (current - 1 + cgItems.length) % cgItems.length;
    openLightbox(current);
  }

  function showNext() {
    current = (current + 1) % cgItems.length;
    openLightbox(current);
  }

  // Bind clicks on each gallery card
  cgItems.forEach((item, i) => {
    item.style.cursor = 'zoom-in';
    item.addEventListener('click', () => openLightbox(i));
  });

  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });

  // Keyboard: Esc to close, arrows to navigate
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
})();


// Dedicated full-size photo viewer for the customer gallery
(() => {
  const viewer = document.createElement('div');
  viewer.id = 'image-viewer';
  viewer.innerHTML = '<button type="button" aria-label="Close image viewer">&times;</button><img alt="Full size project photo"><p></p>';
  document.body.appendChild(viewer);
  const fullImage = viewer.querySelector('img');
  const caption = viewer.querySelector('p');
  const close = () => { viewer.classList.remove('open'); fullImage.removeAttribute('src'); document.body.style.overflow = ''; };
  document.addEventListener('click', event => {
    const image = event.target.closest('.customer-gallery .cg-item img');
    if (!image) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    fullImage.src = image.currentSrc || image.src;
    fullImage.alt = image.alt || 'Project photo';
    caption.textContent = image.closest('.cg-item')?.querySelector('.cg-overlay span')?.textContent || image.alt || '';
    viewer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }, true);
  viewer.querySelector('button').addEventListener('click', close);
  viewer.addEventListener('click', event => { if (event.target === viewer) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && viewer.classList.contains('open')) close(); });
})();
// Fold-safe quick dock: tap or swipe to open/close
(() => {
  const dock = document.querySelector('.quick-dock');
  if (!dock) return;
  const toggle = document.createElement('button');
  toggle.className = 'dock-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open quick contact links');
  toggle.innerHTML = '<i class="fa-solid fa-phone"></i>';
  dock.insertAdjacentElement('afterend', toggle);
  const setOpen = open => { dock.classList.toggle('is-open', open); toggle.setAttribute('aria-label', open ? 'Close quick contact links' : 'Open quick contact links'); toggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-phone"></i>'; };
  toggle.addEventListener('click', () => setOpen(!dock.classList.contains('is-open')));
  let startX = 0;
  dock.addEventListener('pointerdown', e => { startX = e.clientX; });
  dock.addEventListener('pointerup', e => { const delta = e.clientX - startX; if (delta < -24) setOpen(true); if (delta > 24) setOpen(false); });
})();


// No in-page translator: visitors may use their browser's built-in translation.

