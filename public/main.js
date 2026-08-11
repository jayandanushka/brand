document.addEventListener('DOMContentLoaded', () => {
  // Core Elements
  const sections = Array.from(document.querySelectorAll('.section'));
  const carousel = document.getElementById('carousel');
  const leftArrow = document.getElementById('arrowLeft');
  const rightArrow = document.getElementById('arrowRight');
  const scrollArrow = document.getElementById('scrollArrow');
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const closeBtn = modal?.querySelector('.close');

  // State Management
  let currentIndex = 0;
  let isScrolling = false;
  let isTouchScrolling = false;
  let animationFrame = null;

  // Environment checks
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // IntersectionObserver for tracking current visible section
  const observerOptions = {
    root: null,
    threshold: [0.3, 0.7],
    rootMargin: '-5% 0px -5% 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    let mostVisible = entries.reduce((prev, current) => 
      current.intersectionRatio > prev.intersectionRatio ? current : prev
    );

    if (mostVisible.isIntersecting && mostVisible.intersectionRatio > 0.5) {
      const index = sections.indexOf(mostVisible.target);
      if (index !== -1 && index !== currentIndex) {
        currentIndex = index;
      }
    }
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Optimized smooth section scrolling
  function scrollToSection(index, force = false) {
    if (index < 0 || index >= sections.length) return;
    if (isScrolling && !force) return;
    
    if (animationFrame) cancelAnimationFrame(animationFrame);
    
    isScrolling = true;
    currentIndex = index;
    
    animationFrame = requestAnimationFrame(() => {
      sections[index].scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });

    setTimeout(() => {
      isScrolling = false;
      isTouchScrolling = false;
      animationFrame = null;
    }, 600);
  }

  // Helper Throttling Function
  function rafThrottle(fn) {
    let rafId;
    let lastArgs;
    return (...args) => {
      lastArgs = args;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          fn(...lastArgs);
          rafId = null;
        });
      }
    };
  }

  // Wheel handling for desktop
  let wheelTimeout;
  const handleWheel = (e) => {
    if (isScrolling || isTouchScrolling) {
      e.preventDefault();
      return;
    }
    
    clearTimeout(wheelTimeout);
    const delta = e.deltaY;
    const threshold = 50;
    
    if (Math.abs(delta) > threshold) {
      e.preventDefault();
      wheelTimeout = setTimeout(() => {
        if (delta > 0) {
          scrollToSection(currentIndex + 1);
        } else {
          scrollToSection(currentIndex - 1);
        }
      }, 50);
    }
  };

  if (!isMobile && !isTouch) {
    window.addEventListener('wheel', handleWheel, { passive: false });
  }

  // Mobile Touch Gestures
  let touchData = {
    startY: 0,
    startX: 0,
    startTime: 0,
    currentY: 0,
    currentX: 0,
    isCarouselTouch: false,
    isVerticalSwipe: false
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchData.startY = touch.clientY;
    touchData.startX = touch.clientX;
    touchData.startTime = Date.now();
    touchData.currentY = touch.clientY;
    touchData.currentX = touch.clientX;
    touchData.isCarouselTouch = carousel && carousel.contains(e.target);
    touchData.isVerticalSwipe = false;
  };

  const handleTouchMove = rafThrottle((e) => {
    if (isScrolling) return;
    
    const touch = e.touches[0];
    touchData.currentY = touch.clientY;
    touchData.currentX = touch.clientX;
    
    const deltaY = touchData.startY - touchData.currentY;
    const deltaX = touchData.startX - touchData.currentX;
    
    if (Math.abs(deltaY) > 20 || Math.abs(deltaX) > 20) {
      touchData.isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
      if (touchData.isVerticalSwipe && !touchData.isCarouselTouch) {
        e.preventDefault();
        isTouchScrolling = true;
      }
    }
  });

  const handleTouchEnd = () => {
    if (isScrolling || touchData.isCarouselTouch) {
      touchData.isCarouselTouch = false;
      return;
    }
    
    const deltaY = touchData.startY - touchData.currentY;
    const deltaTime = Date.now() - touchData.startTime;
    const velocity = Math.abs(deltaY) / deltaTime;
    
    const isValidSwipe = Math.abs(deltaY) > 50 && 
                        deltaTime < 400 && 
                        velocity > 0.3 &&
                        touchData.isVerticalSwipe;
    
    if (isValidSwipe) {
      if (deltaY > 0) {
        scrollToSection(currentIndex + 1);
      } else {
        scrollToSection(currentIndex - 1);
      }
    }
    
    setTimeout(() => {
      isTouchScrolling = false;
      touchData.isCarouselTouch = false;
    }, 100);
  };

  if (isTouch || isMobile) {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  // Keyboard navigation
  if (!isMobile) {
    window.addEventListener('keydown', (e) => {
      if (isScrolling || isTouchScrolling) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSection(currentIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSection(currentIndex - 1);
      }
    });
  }

  // Scroll arrow listener
  scrollArrow?.addEventListener('click', () => {
    const pointSection = document.getElementById('point');
    if (!pointSection) return;
    const pointIndex = sections.indexOf(pointSection);
    if (pointIndex !== -1) {
      requestAnimationFrame(() => scrollToSection(pointIndex, true));
    }
  });

  // Carousel controls
  const scrollCarousel = (direction) => {
    if (!carousel) return;
    requestAnimationFrame(() => {
      carousel.scrollBy({ 
        left: direction * 220, 
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(30);
    }
  };

  leftArrow?.addEventListener('click', () => scrollCarousel(-1));
  rightArrow?.addEventListener('click', () => scrollCarousel(1));

  // Modal Functionality
  const showModal = (imgSrc, imgAlt = '') => {
    if (!modalImg || !modal) return;
    requestAnimationFrame(() => {
      modalImg.src = imgSrc;
      modalImg.alt = imgAlt;
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  };

  const closeModal = () => {
    if (!modal) return;
    requestAnimationFrame(() => {
      modal.classList.remove('show');
      document.body.style.overflow = 'auto';
    });
  };

  document.querySelectorAll('.project-image').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      showModal(img.src, img.alt);
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (!isMobile) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('show')) {
        closeModal();
      }
    });
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });
});