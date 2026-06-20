/**
 * KTU CGPA & Percentage Calculator
 * Interactive Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const btnClear = document.getElementById('btnClear');
  const modeKtuBtn = document.getElementById('modeKtu');
  const modeSimpleBtn = document.getElementById('modeSimple');
  const form = document.getElementById('cgpaForm');
  const sgpaInputs = document.querySelectorAll('.sgpa-input');
  
  // Results Elements
  const cgpaVal = document.getElementById('cgpaVal');
  const percentVal = document.getElementById('percentVal');
  const semestersCountVal = document.getElementById('semestersCountVal');
  const totalCreditsVal = document.getElementById('totalCreditsVal');
  const gaugeFill = document.getElementById('gaugeFill');
  const resultsCard = document.getElementById('resultsCard');

  // State
  let currentMode = 'ktu'; // 'ktu' or 'simple'
  const defaultCredits = {
    1: 17,
    2: 21,
    3: 22,
    4: 22,
    5: 23,
    6: 22,
    7: 15,
    8: 18
  };

  // --- Theme Toggle Logic ---
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  // --- Calculation Mode Selector ---
  modeKtuBtn.addEventListener('click', () => {
    setMode('ktu');
  });

  modeSimpleBtn.addEventListener('click', () => {
    setMode('simple');
  });

  function setMode(mode) {
    if (currentMode === mode) return;
    
    currentMode = mode;
    
    // Toggle active classes on buttons
    if (mode === 'ktu') {
      modeKtuBtn.classList.add('active');
      modeSimpleBtn.classList.remove('active');
      // Update labels to show actual KTU credits
      Object.keys(defaultCredits).forEach(sem => {
        const label = document.getElementById(`s${sem}-credit-label`);
        if (label) label.textContent = `Credits: ${defaultCredits[sem]}`;
      });
      document.querySelector('.credit-stat').style.opacity = '1';
    } else {
      modeSimpleBtn.classList.add('active');
      modeKtuBtn.classList.remove('active');
      // Update labels to show credit is ignored
      Object.keys(defaultCredits).forEach(sem => {
        const label = document.getElementById(`s${sem}-credit-label`);
        if (label) label.textContent = 'Credits: 1';
      });
      document.querySelector('.credit-stat').style.opacity = '0.5';
    }
    
    calculateResults();
  }

  // --- Form Reset Logic ---
  btnClear.addEventListener('click', () => {
    // Reset all inputs
    sgpaInputs.forEach(input => {
      input.value = '';
      const card = input.closest('.input-card');
      card.classList.remove('has-value');
    });

    // Animate reset
    resultsCard.classList.add('resetting');
    setTimeout(() => {
      resultsCard.classList.remove('resetting');
    }, 400);

    calculateResults();
  });

  // --- Input Validation and Change Observers ---
  sgpaInputs.forEach(input => {
    // Check key events to limit range
    input.addEventListener('input', (e) => {
      let val = parseFloat(e.target.value);
      
      // Visual feedback card class toggle
      const card = input.closest('.input-card');
      if (e.target.value !== '') {
        card.classList.add('has-value');
      } else {
        card.classList.remove('has-value');
      }

      // Clamp max value dynamically
      if (val > 10) {
        e.target.value = '10';
      } else if (val < 0) {
        e.target.value = '0';
      }

      calculateResults();
    });

    // Ensure strict validation on blur
    input.addEventListener('blur', (e) => {
      if (e.target.value !== '') {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) {
          e.target.value = '';
        } else {
          // Keep it to 2 decimal places
          e.target.value = Math.max(0, Math.min(10, val)).toFixed(2);
        }
        calculateResults();
      }
    });
  });

  // --- Main Calculation Logic ---
  function calculateResults() {
    let totalWeightedSgpa = 0;
    let totalCredits = 0;
    let semestersCount = 0;
    let simpleSgpaSum = 0;

    for (let sem = 1; sem <= 8; sem++) {
      const input = document.getElementById(`s${sem}-sgpa`);
      const valStr = input ? input.value : '';

      if (valStr !== '') {
        const sgpa = parseFloat(valStr);
        if (!isNaN(sgpa) && sgpa >= 0 && sgpa <= 10) {
          const credits = defaultCredits[sem];
          totalWeightedSgpa += sgpa * credits;
          totalCredits += credits;
          simpleSgpaSum += sgpa;
          semestersCount++;
        }
      }
    }

    let cgpa = 0;
    let percentage = 0;

    if (semestersCount > 0) {
      if (currentMode === 'ktu') {
        cgpa = totalWeightedSgpa / totalCredits;
      } else {
        cgpa = simpleSgpaSum / semestersCount;
      }
      
      // Calculate Percentage using KTU Formula: Percentage = (CGPA - 0.75) * 10
      // KTU formula results in negative if CGPA < 0.75. We clamp to 0.
      percentage = Math.max(0, (cgpa - 0.75) * 10);
    }

    // Display Results with animations
    animateValue(cgpaVal, parseFloat(cgpaVal.textContent) || 0, cgpa, 800, 2);
    animateValue(percentVal, parseFloat(percentVal.textContent) || 0, percentage, 800, 2, '%');
    
    semestersCountVal.textContent = semestersCount;
    totalCreditsVal.textContent = currentMode === 'ktu' ? totalCredits : semestersCount;

    // Update circular gauge
    updateGauge(cgpa);
  }

  // --- Circular Gauge Animation ---
  // Stroke Circumference is 534
  function updateGauge(cgpa) {
    const maxCgpa = 10;
    const circumference = 534;
    const offset = circumference - (cgpa / maxCgpa) * circumference;
    
    // Add transitioning effects
    gaugeFill.style.strokeDashoffset = offset;
  }

  // --- Numerical Count Up/Down Animation ---
  function animateValue(obj, start, end, duration, decimals = 2, suffix = '') {
    if (start === end) {
      obj.textContent = end.toFixed(decimals) + suffix;
      return;
    }
    
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * (end - start) + start;
      obj.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Initial Calculation Run
  calculateResults();
});
