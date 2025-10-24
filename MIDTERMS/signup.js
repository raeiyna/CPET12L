const togglePassword = document.getElementById('togglePassword');
const toggleConfirm = document.getElementById('toggleConfirm');
const pwd = document.getElementById('password');
const cpwd = document.getElementById('confirmPassword');

togglePassword.addEventListener('click', () => {
  const type = pwd.type === 'password' ? 'text' : 'password';
  pwd.type = type;
  togglePassword.src = type === 'password'
    ? 'images/eye-open.png'
    : 'images/eye-close.png';
});

toggleConfirm.addEventListener('click', () => {
  const type = cpwd.type === 'password' ? 'text' : 'password';
  cpwd.type = type;
  toggleConfirm.src = type === 'password'
    ? 'images/eye-open.png'
    : 'images/eye-close.png';
});
