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
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;
  let isTouchScrolling = false;
  let animationFrame = null;

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Performance optimizations
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Optimized IntersectionObserver
  const observerOptions = {
    root: null,
    threshold: [0.3, 0.7], // Multiple thresholds for better detection
    rootMargin: '-5% 0px -5% 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    // Process only the most intersecting entry
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

  // Optimized scroll helper with RAF
  function scrollToSection(index, force = false) {
    if (index < 0 || index >= sections.length) return;
    if (isScrolling && !force) return;
    
    // Cancel any existing animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    isScrolling = true;
    currentIndex = index;
    
    // Use requestAnimationFrame for smoother animation
    animationFrame = requestAnimationFrame(() => {
      sections[index].scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });

    // Shorter timeout for better responsiveness
    setTimeout(() => {
      isScrolling = false;
      isTouchScrolling = false;
      animationFrame = null;
    }, 600);
  }

  // Lighter debounce with RAF
  function rafDebounce(fn, delay = 16) {
    let timeout;
    let rafId;
    
    return (...args) => {
      clearTimeout(timeout);
      if (rafId) cancelAnimationFrame(rafId);
      
      timeout = setTimeout(() => {
        rafId = requestAnimationFrame(() => fn(...args));
      }, delay);
    };
  }

  // Optimized throttle for high-frequency events
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

  // Simplified wheel handler
  let wheelTimeout;
  const handleWheel = (e) => {
    if (isScrolling || isTouchScrolling) {
      e.preventDefault();
      return;
    }
    
    // Clear previous timeout
    clearTimeout(wheelTimeout);
    
    const delta = e.deltaY;
    const threshold = 50; // Increased threshold for better control
    
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

  // Only add wheel listener for desktop
  if (!isMobile && !isTouch) {
    // Use passive: false only when necessary
    window.addEventListener('wheel', handleWheel, { 
      passive: false,
      capture: false 
    });
  }

  // Simplified touch handling
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
    
    // Determine swipe direction early
    if (Math.abs(deltaY) > 20 || Math.abs(deltaX) > 20) {
      touchData.isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
      
      // Prevent default only for vertical swipes outside carousel
      if (touchData.isVerticalSwipe && !touchData.isCarouselTouch) {
        e.preventDefault();
        isTouchScrolling = true;
      }
    }
  });

  const handleTouchEnd = (e) => {
    if (isScrolling || touchData.isCarouselTouch) {
      touchData.isCarouselTouch = false;
      return;
    }
    
    const deltaY = touchData.startY - touchData.currentY;
    const deltaTime = Date.now() - touchData.startTime;
    const velocity = Math.abs(deltaY) / deltaTime;
    
    // Simplified swipe detection
    const minDistance = 50;
    const minVelocity = 0.3;
    const maxTime = 400;
    
    const isValidSwipe = Math.abs(deltaY) > minDistance && 
                        deltaTime < maxTime && 
                        velocity > minVelocity &&
                        touchData.isVerticalSwipe;
    
    if (isValidSwipe) {
      if (deltaY > 0) {
        scrollToSection(currentIndex + 1);
      } else {
        scrollToSection(currentIndex - 1);
      }
    }
    
    // Reset touch data
    setTimeout(() => {
      isTouchScrolling = false;
      touchData.isCarouselTouch = false;
    }, 100);
  };

  // Add touch listeners with better passive handling
  if (isTouch || isMobile) {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  // Keyboard navigation (desktop only)
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

  // Scroll arrow with RAF
  scrollArrow?.addEventListener('click', () => {
    const pointSection = document.getElementById('point');
    if (!pointSection) return;
    
    const pointIndex = sections.indexOf(pointSection);
    if (pointIndex !== -1) {
      requestAnimationFrame(() => {
        scrollToSection(pointIndex, true);
      });
    }
  });

  // Optimized carousel arrows
  const scrollCarousel = (direction) => {
    if (!carousel) return;
    
    requestAnimationFrame(() => {
      carousel.scrollBy({ 
        left: direction * 220, 
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
    
    // Haptic feedback
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(30);
    }
  };

  leftArrow?.addEventListener('click', () => scrollCarousel(-1));
  rightArrow?.addEventListener('click', () => scrollCarousel(1));

  // Simplified carousel touch handling
  if (carousel && (isTouch || isMobile)) {
    let carouselStart = { x: 0, y: 0 };
    let isCarouselActive = false;

    carousel.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      carouselStart.x = touch.clientX;
      carouselStart.y = touch.clientY;
      isCarouselActive = false;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const deltaX = Math.abs(carouselStart.x - touch.clientX);
      const deltaY = Math.abs(carouselStart.y - touch.clientY);
      
      if (deltaX > deltaY && deltaX > 10) {
        isCarouselActive = true;
      }
    }, { passive: true });
  }

  // Optimized modal functionality
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

  // Modal image clicks
  document.querySelectorAll('.project-image').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      showModal(img.src, img.alt);
    });
  });

  // Modal close events
  closeBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Escape key for desktop
  if (!isMobile) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('show')) {
        closeModal();
      }
    });
  }

  // Handle orientation changes efficiently
  if (isMobile) {
    let orientationTimeout;
    
    window.addEventListener('orientationchange', () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = setTimeout(() => {
        const currentSection = sections[currentIndex];
        if (currentSection) {
          requestAnimationFrame(() => {
            currentSection.scrollIntoView({ 
              behavior: 'auto',
              block: 'start'
            });
          });
        }
      }, 300);
    });
  }

  // Minimal touch feedback with RAF
  if (isMobile || isTouch) {
    const addTouchFeedback = (element) => {
      if (!element) return;
      
      let feedbackFrame;
      
      element.addEventListener('touchstart', () => {
        if (feedbackFrame) cancelAnimationFrame(feedbackFrame);
        feedbackFrame = requestAnimationFrame(() => {
          element.style.transform = 'scale(0.98)';
          element.style.opacity = '0.9';
        });
      }, { passive: true });
      
      element.addEventListener('touchend', () => {
        if (feedbackFrame) cancelAnimationFrame(feedbackFrame);
        feedbackFrame = requestAnimationFrame(() => {
          element.style.transform = 'scale(1)';
          element.style.opacity = '1';
        });
      }, { passive: true });
    };

    // Add feedback to key interactive elements only
    [scrollArrow, leftArrow, rightArrow].forEach(addTouchFeedback);
  }

  // Intersection Observer cleanup on page unload
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  // Performance monitoring (optional - remove in production)
  if (typeof window !== 'undefined' && window.performance) {
    let scrollStartTime;
    
    window.addEventListener('scroll', () => {
      if (!scrollStartTime) {
        scrollStartTime = performance.now();
      }
    }, { passive: true });
    
    window.addEventListener('scrollend', () => {
      if (scrollStartTime) {
        const scrollDuration = performance.now() - scrollStartTime;
        // Log performance if needed
        scrollStartTime = null;
      }
    }, { passive: true });
  }
});
document.addEventListener("DOMContentLoaded", function () {
    const snowContainer = document.createElement("div");
    snowContainer.style.position = "fixed";
    snowContainer.style.top = 0;
    snowContainer.style.left = 0;
    snowContainer.style.width = "100%";
    snowContainer.style.height = "100%";
    snowContainer.style.pointerEvents = "none";
    snowContainer.style.overflow = "hidden";
    snowContainer.style.zIndex = 9999;
    document.body.appendChild(snowContainer);

    function createSnow() {
        const snow = document.createElement("div");
        snow.innerHTML = "❄";
        snow.style.position = "absolute";
        snow.style.color = "white";
        snow.style.fontSize = Math.random() * 10 + 10 + "px";
        snow.style.left = Math.random() * window.innerWidth + "px";
        snow.style.opacity = Math.random();
        snow.style.animation = `fall ${Math.random() * 3 + 3}s linear infinite`;
        snowContainer.appendChild(snow);

        setTimeout(() => snow.remove(), 6000);
    }

    setInterval(createSnow, 100);
});