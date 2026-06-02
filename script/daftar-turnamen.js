import { getTournamentDetails, addParticipant } from './utils/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    let tournamentId = null;

    const urlParams = new URLSearchParams(window.location.search);
    tournamentId = urlParams.get('id');

    if (!tournamentId && window.location.hash) {
        tournamentId = window.location.hash.substring(1);
    }

    if (!tournamentId) {
        const pathMatch = window.location.pathname.match(/\/daftar-turnamen\/(\d+)/);
        if (pathMatch) {
            tournamentId = pathMatch[1];
        }
    }

    if (!tournamentId) {
        if (window.showSnackbar) window.showSnackbar('Tournament ID tidak ditemukan di URL!', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    try {
        const tournament = await getTournamentDetails(tournamentId);

        if (!tournament) {
            if (window.showSnackbar) window.showSnackbar('Tournament tidak ditemukan!', 'error');
            setTimeout(() => {
                window.location.href = 'tournaments.html';
            }, 1500);
            return;
        }

        // Render tournament information
        document.getElementById('tournament-name').textContent = tournament.nama_turnamen || 'Tournament';
        document.getElementById('tournament-category').textContent = tournament.jenis_lomba || '-';

        // Handle form submission
        const registrationForm = document.getElementById('registration-form');
        const submitBtn = document.getElementById('submit-btn');

        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Mendaftarkan...';

                // Collect form data
                const teamData = {
                    tournament_id: tournamentId,
                    nama_peserta: document.getElementById('team-name').value.trim()
                };

                // Validate required fields
                if (!teamData.nama_peserta) {
                    if (window.showSnackbar) window.showSnackbar('Nama tim harus diisi!', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Daftar Tim';
                    return;
                }

                const token = localStorage.getItem('tokenTurnamen');
                const result = await addParticipant(teamData, tournamentId, token);

                if (result) {
                    if (window.showSnackbar) window.showSnackbar('Tim berhasil didaftarkan! Terima kasih.', 'success');
                    
                    registrationForm.reset();
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Daftar Tim';
                } else {
                    if (window.showSnackbar) window.showSnackbar('Gagal mendaftarkan tim. Coba lagi.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Daftar Tim';
                }
            } catch (error) {
                console.error('Registration error:', error);
                if (window.showSnackbar) window.showSnackbar('Terjadi kesalahan saat mendaftar.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Daftar Tim';
            }
        });

    } catch (error) {
        console.error('Error loading tournament:', error);
        if (window.showSnackbar) window.showSnackbar('Terjadi kesalahan koneksi server.', 'error');
    }
});
