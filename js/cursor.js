document.addEventListener('DOMContentLoaded', () => {
  // Only initialize custom cursor on non-touch devices (desktops/laptops)
  if (window.matchMedia("(pointer: coarse)").matches) return;

  // Create cursor elements
  const cursorDot = document.createElement('div');
  cursorDot.classList.add('custom-cursor-dot');
  
  const cursorOutline = document.createElement('div');
  cursorOutline.classList.add('custom-cursor-outline');

  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorOutline);

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    * {
      cursor: none !important;
    }
    .custom-cursor-dot {
      width: 8px;
      height: 8px;
      background-color: #38bdf8;
      border-radius: 50%;
      position: fixed;
      top: 0;
      left: 0;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 999999;
      transition: width 0.2s ease, height 0.2s ease, background-color 0.2s ease;
    }
    .custom-cursor-outline {
      width: 40px;
      height: 40px;
      border: 2px solid rgba(56, 189, 248, 0.5);
      border-radius: 50%;
      position: fixed;
      top: 0;
      left: 0;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 999998;
      transition: width 0.2s ease, height 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
    }
    /* Hover effects */
    .custom-cursor-dot.hover {
      background-color: #ffffff;
      width: 12px;
      height: 12px;
    }
    .custom-cursor-outline.hover {
      width: 60px;
      height: 60px;
      border-color: #ffffff;
      background-color: rgba(255, 255, 255, 0.1);
    }
  `;
  document.head.appendChild(style);

  // Mouse move listener
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let outlineX = mouseX;
  let outlineY = mouseY;
  let isMoving = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Dot follows instantly
    cursorDot.style.left = \`\${mouseX}px\`;
    cursorDot.style.top = \`\${mouseY}px\`;
    
    // Only show cursor after first move
    if (!isMoving) {
      isMoving = true;
      cursorDot.style.opacity = 1;
      cursorOutline.style.opacity = 1;
    }
  });

  // Hide initially until mouse moves
  cursorDot.style.opacity = 0;
  cursorOutline.style.opacity = 0;

  // Smooth animation loop for outline
  function animateOutline() {
    // Easing for smooth trailing effect
    outlineX += (mouseX - outlineX) * 0.2;
    outlineY += (mouseY - outlineY) * 0.2;
    
    cursorOutline.style.left = \`\${outlineX}px\`;
    cursorOutline.style.top = \`\${outlineY}px\`;
    
    requestAnimationFrame(animateOutline);
  }
  animateOutline();

  // Add hover effect to interactive elements
  function bindHoverEffects() {
    const interactables = document.querySelectorAll('a, button, input, textarea, select, .nav-toggle, label, .clickable, .wizard-step, .recap-slide, .nav-brand');
    
    interactables.forEach(el => {
      if(!el.dataset.cursorBound) {
        el.dataset.cursorBound = "true";
        el.addEventListener('mouseenter', () => {
          cursorDot.classList.add('hover');
          cursorOutline.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
          cursorDot.classList.remove('hover');
          cursorOutline.classList.remove('hover');
        });
      }
    });
  }

  // Initial bind
  bindHoverEffects();
  
  // Re-bind when DOM changes (useful for modals or dynamic content)
  const observer = new MutationObserver(() => {
    bindHoverEffects();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Handle mouse leaving the window
  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity = 0;
    cursorOutline.style.opacity = 0;
  });
  document.addEventListener('mouseenter', () => {
    cursorDot.style.opacity = 1;
    cursorOutline.style.opacity = 1;
  });
});
