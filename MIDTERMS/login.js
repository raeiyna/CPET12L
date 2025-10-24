const toggle = document.getElementById('togglePassword');
const pwd = document.getElementById('password');

toggle.addEventListener('click', () => {
  const isPassword = pwd.getAttribute('type') === 'password';
  pwd.setAttribute('type', isPassword ? 'text' : 'password');
  toggle.src = isPassword ? 'images/eye-open.png' : 'images/eye-close.png'; 
  toggle.alt = isPassword ? 'Hide Password' : 'Show Password';
});

const slides = document.querySelectorAll('.slide');
const indicators = document.querySelectorAll('.indicator');
let current = 0;
const intervalMs = 4000;

function activate(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
  indicators.forEach((ind, i) => {
    ind.classList.toggle('active', i === index);
  });
  current = index;
}

let timer = setInterval(() => {
  const next = (current + 1) % slides.length;
  activate(next);
}, intervalMs);

indicators.forEach((ind, i) => {
  ind.addEventListener('click', () => {
    activate(i);
    clearInterval(timer);
    timer = setInterval(() => {
      const next = (current + 1) % slides.length;
      activate(next);
    }, intervalMs);
  });
});
