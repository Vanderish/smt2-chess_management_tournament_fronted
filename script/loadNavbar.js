async function loadNavbar() {
    try {
        // Ambil file nav.html 
        const response = await fetch('partials/nav.html'); 
        const html = await response.text();
        
        // Suntikkan ke dalam div #navbar-container
        document.getElementById('navbar-container').innerHTML = html;

        // Ambil token untuk cek kondisi
        const token = localStorage.getItem('tokenTurnamen');
        
        // Tangkap elemen-elemen tombolnya
        const loginBtn = document.getElementById('nav-login');
        const registerBtn = document.getElementById('nav-register');
        const logoutBtn = document.getElementById('nav-logout');

        if (token) {
            // KALAU UDAH LOGIN:
            if(loginBtn) loginBtn.style.display = 'none';
            if(registerBtn) registerBtn.style.display = 'none';
            if(logoutBtn) logoutBtn.style.display = 'block';
        } else {
            // KALAU BELUM LOGIN:
            if(loginBtn) loginBtn.style.display = 'block';
            if(registerBtn) registerBtn.style.display = 'block';
            if(logoutBtn) logoutBtn.style.display = 'none';
        }

        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('nav-links');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
            });
        }
    } catch (error) {
        console.error('Gagal memuat navbar:', error);
    }
}

function logout(event) {
    event.preventDefault();
    localStorage.removeItem('tokenTurnamen');
    window.location.href = 'login.html';
}

// Pastikan dipanggil pakai ini biar aman dari error nyuntik angin!
document.addEventListener('DOMContentLoaded', loadNavbar);