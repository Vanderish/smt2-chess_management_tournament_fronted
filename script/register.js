import { register } from './utils/api.js';

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const submitBtn = registerForm.querySelector('.btn-register');
  const btnCancel = document.getElementById('btn-cancel');
  
  const passwordInput = document.getElementById('register-password');
  const togglePassword = document.getElementById('toggle-password');

  togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    if (isPassword) {
      togglePassword.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5b8cff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-off-icon">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>`;
    } else {
      togglePassword.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>`;
    }
  });

  btnCancel.addEventListener('click', () => {
    window.location.href = 'index.html'; 
  });


  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const usernameValue = document.getElementById('username').value;
    const passwordValue = passwordInput.value;

    submitBtn.disabled = true;
    submitBtn.style.backgroundColor = '#444';
    submitBtn.style.cursor = 'not-allowed';
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = 'Loading...';

    try {
      const data = await register(usernameValue, passwordValue);
      
      if (data) {
        if (window.showSnackbar) {
          window.showSnackbar('Registrasi akun Panitia berhasil! Silakan login untuk mengelola turnamen.', 'success');
          setTimeout(() => window.location.href = 'login.html', 900);
        } else {
          window.location.href = 'login.html';
        }
      } else {
        resetBtnState(submitBtn, originalBtnText);
      }
    } catch (error) {
        console.error('Error saat register:', error);
        if (error.message.includes('Failed to fetch')) {
          if (window.showSnackbar) window.showSnackbar('Terjadi kesalahan koneksi. Pastikan server/backend sudah menyala.', 'error');
        } else {
          if (window.showSnackbar) window.showSnackbar(error.message || 'Registrasi gagal, silakan periksa kembali data Anda.', 'error');
        }
        resetBtnState(submitBtn, originalBtnText);
    }
  });

  function resetBtnState(btn, text) {
    btn.disabled = false;
    btn.style.backgroundColor = '#5b8cff';
    btn.style.cursor = 'pointer';
    btn.innerText = text;
  }
});