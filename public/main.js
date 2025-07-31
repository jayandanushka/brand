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

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Enhanced IntersectionObserver
  const observerOptions = {
    root: null,
    threshold: 0.6,
    rootMargin: '-10% 0px -10% 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = sections.indexOf(entry.target);
        if (index !== -1) {
          currentIndex = index;
          // Reset scrolling state after intersection
          setTimeout(() => {
            isScrolling = false;
            isTouchScrolling = false;
          }, 100);
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Enhanced scroll helper
  function scrollToSection(index, force = false) {
    if (index < 0 || index >= sections.length) return;
    if (isScrolling && !force) return;
    
    isScrolling = true;
    currentIndex = index;
    
    sections[index].scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });

    // Reset scrolling state
    setTimeout(() => {
      isScrolling = false;
      isTouchScrolling = false;
    }, 800);
  }

  // Improved debounce utility
  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // Throttle utility for touch events
  function throttle(fn, delay) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  // Enhanced wheel scroll handling
  const handleWheel = debounce((e) => {
    if (isScrolling || isTouchScrolling) return;
    
    e.preventDefault();
    const delta = e.deltaY;
    
    if (Math.abs(delta) > 20) {
      if (delta > 0) {
        scrollToSection(currentIndex + 1);
      } else {
        scrollToSection(currentIndex - 1);
      }
    }
  }, 50);

  // Only add wheel listener for non-touch devices or desktop
  if (!isMobile && !isTouch) {
    window.addEventListener('wheel', handleWheel, { passive: false });
  }

  // Enhanced touch handling for mobile
  let touchMoveY = 0;
  let touchMoveX = 0;
  let touchDistance = 0;
  let touchVelocity = 0;
  let isCarouselTouch = false;

  // Touch start
  const handleTouchStart = (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
    touchMoveY = touchStartY;
    touchMoveX = touchStartX;
    touchDistance = 0;
    touchVelocity = 0;
    
    // Check if touch started on carousel
    isCarouselTouch = carousel && carousel.contains(e.target);
  };

  // Touch move with throttling
  const handleTouchMove = throttle((e) => {
    if (isScrolling) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = touchStartY - currentY;
    const deltaX = touchStartX - currentX;
    const currentTime = Date.now();
    
    touchMoveY = currentY;
    touchMoveX = currentX;
    touchDistance = deltaY;
    
    // Calculate velocity (pixels per millisecond)
    const timeDelta = currentTime - touchStartTime;
    if (timeDelta > 0) {
      touchVelocity = Math.abs(deltaY) / timeDelta;
    }

    // Handle carousel horizontal scrolling
    if (isCarouselTouch && Math.abs(deltaX) > Math.abs(deltaY)) {
      return; // Let carousel handle horizontal scrolling
    }

    // Prevent default scrolling for vertical gestures outside carousel
    if (!isCarouselTouch && Math.abs(deltaY) > 10) {
      e.preventDefault();
      isTouchScrolling = true;
    }
  }, 16); // ~60fps

  // Touch end with improved gesture detection
  const handleTouchEnd = (e) => {
    if (isScrolling || isCarouselTouch) {
      isCarouselTouch = false;
      return;
    }
    
    const endTime = Date.now();
    const totalTime = endTime - touchStartTime;
    const finalDistance = touchDistance;
    
    // Minimum thresholds
    const minDistance = 30;
    const minVelocity = 0.1; // pixels per millisecond
    const maxTime = 500; // milliseconds
    
    // Enhanced gesture detection
    const isValidSwipe = Math.abs(finalDistance) > minDistance && 
                        totalTime < maxTime && 
                        touchVelocity > minVelocity;
    
    if (isValidSwipe) {
      isTouchScrolling = true;
      
      if (finalDistance > 0) {
        // Swipe up - next section
        scrollToSection(currentIndex + 1);
      } else {
        // Swipe down - previous section
        scrollToSection(currentIndex - 1);
      }
    } else {
      // Reset state for small movements
      setTimeout(() => {
        isTouchScrolling = false;
      }, 100);
    }
    
    isCarouselTouch = false;
  };

  // Add touch event listeners
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

  // Scroll arrow click
  scrollArrow?.addEventListener('click', () => {
    const pointSection = document.getElementById('point');
    if (!pointSection) return;
    
    const pointIndex = sections.indexOf(pointSection);
    if (pointIndex !== -1) {
      scrollToSection(pointIndex, true);
    }
  });

  // Enhanced carousel arrows with touch feedback
  leftArrow?.addEventListener('click', () => {
    if (carousel) {
      carousel.scrollBy({ 
        left: -220, 
        behavior: 'smooth' 
      });
      
      // Add haptic feedback for mobile
      if (navigator.vibrate && isMobile) {
        navigator.vibrate(50);
      }
    }
  });

  rightArrow?.addEventListener('click', () => {
    if (carousel) {
      carousel.scrollBy({ 
        left: 220, 
        behavior: 'smooth' 
      });
      
      // Add haptic feedback for mobile
      if (navigator.vibrate && isMobile) {
        navigator.vibrate(50);
      }
    }
  });

  // Enhanced carousel touch scrolling
  if (carousel && (isTouch || isMobile)) {
    let carouselTouchStartX = 0;
    let carouselTouchStartY = 0;
    let isCarouselScrolling = false;

    carousel.addEventListener('touchstart', (e) => {
      carouselTouchStartX = e.touches[0].clientX;
      carouselTouchStartY = e.touches[0].clientY;
      isCarouselScrolling = false;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      const deltaX = carouselTouchStartX - e.touches[0].clientX;
      const deltaY = carouselTouchStartY - e.touches[0].clientY;
      
      // If horizontal movement is greater, handle carousel scrolling
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isCarouselScrolling = true;
        // Let default carousel scrolling handle this
      }
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
      setTimeout(() => {
        isCarouselScrolling = false;
      }, 100);
    }, { passive: true });
  }

  // Modal image functionality with touch improvements
  document.querySelectorAll('.project-image').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      if (modalImg && modal) {
        modalImg.src = img.src;
        modalImg.alt = img.alt || '';
        modal.classList.add('show');
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close modal functionality
  const closeModal = () => {
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = 'auto';
    }
  };

  closeBtn?.addEventListener('click', closeModal);
  
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal on escape key (desktop)
  if (!isMobile) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('show')) {
        closeModal();
      }
    });
  }

  // Handle orientation changes on mobile
  if (isMobile) {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Recalculate current section after orientation change
        const currentSection = sections[currentIndex];
        if (currentSection) {
          currentSection.scrollIntoView({ 
            behavior: 'auto',
            block: 'start'
          });
        }
      }, 500);
    });
  }

  // Prevent elastic scrolling on iOS
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Allow scrolling within carousel
      if (carousel && carousel.contains(target)) {
        return;
      }
      
      // Prevent other elastic scrolling
      if (!target?.closest('.contact-form')) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  // Add visual feedback for touch interactions
  if (isMobile || isTouch) {
    const addTouchFeedback = (element) => {
      if (!element) return;
      
      element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.98)';
        element.style.opacity = '0.8';
      });
      
      element.addEventListener('touchend', () => {
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
      });
    };

    // Add feedback to interactive elements
    [scrollArrow, leftArrow, rightArrow].forEach(addTouchFeedback);
    document.querySelectorAll('.project-card').forEach(addTouchFeedback);
  }
});