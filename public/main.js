document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const sections = [...document.querySelectorAll('.section')];
  const carousel = document.getElementById('carousel');
  const leftArrow = document.getElementById('arrowLeft');
  const rightArrow = document.getElementById('arrowRight');
  const scrollArrow = document.getElementById('scrollArrow');
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const closeBtn = modal?.querySelector('.close');

  // State
  let currentIndex = 0;
  let isScrolling = false;

  // IntersectionObserver to detect active section and reset isScrolling
  const observerOptions = {
    root: null,
    threshold: 0.7,
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = sections.indexOf(entry.target);
        if (index !== -1) {
          currentIndex = index;
          isScrolling = false;
        }
      }
    });
  }, observerOptions);
  sections.forEach(section => observer.observe(section));

  // Scroll helper with debounce protection
  function scrollToSection(index) {
    if (index < 0 || index >= sections.length || isScrolling) return;
    isScrolling = true;
    sections[index].scrollIntoView({ behavior: 'smooth' });
  }

  // Debounce utility
  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // Handle wheel scroll with debounce
  const handleWheel = debounce((e) => {
    if (isScrolling) return;
    if (e.deltaY > 30) scrollToSection(currentIndex + 1);
    else if (e.deltaY < -30) scrollToSection(currentIndex - 1);
  }, 50);
  window.addEventListener('wheel', handleWheel);

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (isScrolling) return;
    if (e.key === 'ArrowDown') scrollToSection(currentIndex + 1);
    else if (e.key === 'ArrowUp') scrollToSection(currentIndex - 1);
  });

  // Touch support
  let touchStartY = 0;
  window.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  });
  window.addEventListener('touchend', e => {
    if (isScrolling) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    if (deltaY > 50) scrollToSection(currentIndex + 1);
    else if (deltaY < -50) scrollToSection(currentIndex - 1);
  });

  // Scroll arrow click — scrolls to #point section
  scrollArrow?.addEventListener('click', () => {
    const nextSection = document.getElementById('point');
    if (!nextSection) return;
    isScrolling = true;
    nextSection.scrollIntoView({ behavior: 'smooth' });
  });

  // Carousel arrows
  leftArrow?.addEventListener('click', () => {
    carousel?.scrollBy({ left: -220, behavior: 'smooth' });
  });
  rightArrow?.addEventListener('click', () => {
    carousel?.scrollBy({ left: 220, behavior: 'smooth' });
  });

  // Modal image functionality
  document.querySelectorAll('.project-image').forEach(img => {
    img.addEventListener('click', () => {
      modalImg.src = img.src;
      modalImg.alt = img.alt || '';
      modal.classList.add('show');
    });
  });

  closeBtn?.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });
});
