import {
    getTournamentDetails,
    getParticipants,
    deleteParticipant,
    deleteTournament,
    generateBracket,
    getRoomQRCode,
    getMatchesByTournament,
    addParticipant,
    updateMatchResult
} from './utils/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id');
    const token = localStorage.getItem('tokenTurnamen');

    const statusEl = document.getElementById('detail-status');
    const detailContainer = document.querySelector('.detail-container');
    const bracketHeader = document.getElementById('bracket-header');
    const bracketContainer = document.getElementById('bracket-container');
    const btnStartTournament = document.getElementById('btn-start-tournament');
    const btnBack = document.getElementById('btn-back');
    const btnDelete = document.getElementById('btn-delete-room');
    const btnGenerateQr = document.getElementById('btn-generate-qr');
    const qrBox = document.getElementById('qr-box');
    const formAddParticipant = document.getElementById('form-add-participant');
    const inputParticipantName = document.getElementById('input-participant-name');
    const participantSection = document.getElementById('add-participant-card');
    const registeredTeamsCard = document.querySelector('.teams-card');
    const registrationTeamsCard = document.getElementById('teams-card-registration');

    let currentTournament = null;
    let currentStatus = '';
    let teamsList = [];
    let currentUserId = null;
    const participantNameMap = new Map();

    initPage();

    async function initPage() {
        parseToken();
        if (!tournamentId) {
            showErrorAndRedirect('Data turnamen tidak ditemukan!');
            return;
        }

        try {
            currentTournament = await getTournamentDetails(tournamentId);
            if (!currentTournament) {
                showErrorAndRedirect('Turnamen tidak ditemukan!');
                return;
            }

            currentStatus = currentTournament.status || '';
            renderTournamentInfo();
            applyStatusClasses(currentStatus);
            updateAdminControlsVisibility();
            await refreshTeamsList();
            renderTeamsIntoContainer('detail-teams');
            renderTeamsIntoContainer('detail-teams-registration');
            setupFormHandlers();
            setupButtonHandlers();

            if (!isRegistrationStatus()) {
                await loadMatchesAndRender();
                await refreshTournamentDetails();
            }
        } catch (error) {
            handlePageError(error);
        }
    }

    function parseToken() {
        if (!token) return;
        try {
            const payloadBase64 = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            currentUserId = decodedPayload.id;
        } catch (error) {
            console.error('Token parsing error:', error);
        }
    }

    function showErrorAndRedirect(message) {
        if (window.showSnackbar) window.showSnackbar(message, 'error');
        window.location.href = 'tournaments.html';
    }

    function handlePageError(error) {
        console.error('Detail page error:', error);
        const message = error?.message ? `Koneksi server gagal: ${error.message}` : 'Koneksi server gagal.';
        if (window.showSnackbar) window.showSnackbar(message, 'error');
    }

    function renderTournamentInfo() {
        document.getElementById('detail-name').textContent = currentTournament.nama_turnamen || '-';
        document.getElementById('detail-category').textContent = currentTournament.jenis_lomba || '-';
        updateStatusColor(statusEl, currentStatus);
    }

    function updateStatusColor(element, status) {
        if (!element) return;
        const normalized = (status || '').toLowerCase();
        element.classList.remove('waiting', 'ongoing', 'finished');

        if (normalized.includes('berjalan') || normalized.includes('ongoing')) {
            element.classList.add('ongoing');
            element.textContent = 'Ongoing';
        } else if (normalized.includes('selesai') || normalized.includes('finished')) {
            element.classList.add('finished');
            element.textContent = 'Selesai';
        } else {
            element.classList.add('waiting');
            element.textContent = 'Pendaftaran';
        }
    }

    function applyStatusClasses(statusValue) {
        if (!detailContainer) return;
        detailContainer.classList.remove('status-pendaftaran', 'status-berjalan', 'status-selesai');
        const normalized = (statusValue || '').toLowerCase();

        if (normalized.includes('pendaftaran')) {
            detailContainer.classList.add('status-pendaftaran');
        } else if (normalized.includes('selesai')) {
            detailContainer.classList.add('status-selesai');
        } else {
            detailContainer.classList.add('status-berjalan');
        }
    }

    function isRegistrationStatus() {
        return currentStatus.toLowerCase().includes('pendaftaran');
    }

    function canDeleteParticipant() {
        return Boolean(token) && isRegistrationStatus() && currentUserId === currentTournament.user_id;
    }

    function updateAdminControlsVisibility() {
        if (btnStartTournament) {
            btnStartTournament.classList.toggle('hidden', !(token && isRegistrationStatus() && currentUserId === currentTournament.user_id));
        }
        if (btnDelete) {
            btnDelete.classList.toggle('hidden', !token);
        }
        if (btnGenerateQr) {
            btnGenerateQr.classList.toggle('hidden', !(token && currentUserId === currentTournament.user_id));
        }
        updateParticipantSectionVisibility();
    }

    function updateParticipantSectionVisibility() {
        if (participantSection) {
            if (token && isRegistrationStatus() && currentUserId === currentTournament.user_id) {
                participantSection.classList.remove('hidden');
            } else {
                participantSection.classList.add('hidden');
            }
        }
    }

    async function refreshTeamsList() {
        let fetchedList = await getParticipants(tournamentId);
        if (!Array.isArray(fetchedList) || fetchedList.length === 0) {
            fetchedList = currentTournament.peserta || [];
        }
        teamsList = fetchedList;

        participantNameMap.clear();
        teamsList.forEach((team) => {
            const teamId = team?.id || team?.participant_id || team?.id_peserta || team?.participantId;
            if (teamId) {
                participantNameMap.set(String(teamId), team?.nama_peserta || team?.name || `Tim ${teamId}`);
            }
        });

        const detailSlotsEl = document.getElementById('detail-slots');
        if (detailSlotsEl) {
            detailSlotsEl.textContent = teamsList.length;
        }
    }

    async function refreshTournamentDetails() {
        try {
            const refreshed = await getTournamentDetails(tournamentId);
            if (refreshed) {
                currentStatus = refreshed.status || currentStatus;
                updateStatusColor(statusEl, currentStatus);
                applyStatusClasses(currentStatus);
                updateAdminControlsVisibility();
            }
        } catch (error) {
            console.error('Error refreshing tournament details:', error);
        }
    }

    function renderTeamsIntoContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        if (teamsList.length === 0) {
            container.innerHTML = '<li class="no-data">Belum ada peserta terdaftar.</li>';
            return;
        }

        teamsList.forEach((team, index) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const teamName = team?.nama_peserta || team?.name || '-';
            const teamId = team?.id || team?.participant_id || team?.id_peserta || null;

            const textWrapper = document.createElement('span');
            textWrapper.className = 'participant-text';
            textWrapper.textContent = `#${index + 1} : ${teamName}`;
            li.appendChild(textWrapper);

            if (canDeleteParticipant() && teamId) {
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'btn-delete-participant';
                deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="25px" viewBox="0 -960 960 960" width="25px" fill="#FF4D4D"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
                deleteButton.addEventListener('click', async () => {
                    deleteButton.disabled = true;
                    const result = await deleteParticipant(teamId, token);
                    if (result) {
                        await refreshTeamsList();
                        renderTeamsIntoContainer('detail-teams');
                        renderTeamsIntoContainer('detail-teams-registration');
                        if (window.showSnackbar) window.showSnackbar('Peserta dihapus.', 'success');
                    } else {
                        deleteButton.disabled = false;
                        if (window.showSnackbar) window.showSnackbar('Gagal menghapus.', 'error');
                    }
                });
                li.appendChild(deleteButton);
            }

            container.appendChild(li);
        });
    }

    async function loadMatchesAndRender() {
        try {
            const matches = await getMatchesByTournament(tournamentId);
            renderBracket(matches);
        } catch (error) {
            console.error('Load matches error:', error);
            if (bracketContainer) {
                bracketContainer.innerHTML = '<div class="no-data">Gagal memuat bagan.</div>';
            }
        }
    }

    function createTeamSlot(teamId, matchObj) {
        const slotContainer = document.createElement('div');
        slotContainer.className = 'slot-team';

        const teamNameEl = document.createElement('span');
        let teamName = teamId ? participantNameMap.get(String(teamId)) : null;

        if (teamName === 'BYE' || !teamName) {
            slotContainer.classList.add('bye-player');
            teamNameEl.textContent = 'BYE';
            slotContainer.appendChild(teamNameEl);
            return slotContainer;
        }

        teamNameEl.textContent = teamName;
        slotContainer.appendChild(teamNameEl);

        const isWinner = String(matchObj.pemenang_id) === String(teamId);
        if (isWinner) {
            slotContainer.classList.add('winner-slot');
            const winnerBadge = document.createElement('span');
            winnerBadge.className = 'winner-badge';
            winnerBadge.textContent = 'Pemenang';
            slotContainer.appendChild(winnerBadge);
        }

        if (token && !matchObj.pemenang_id) {
            const btnWin = document.createElement('button');
            btnWin.className = 'btn-win-match';
            btnWin.innerHTML = '✓';
            btnWin.title = 'Pilih sebagai pemenang';

            btnWin.onclick = async () => {
                btnWin.disabled = true;
                btnWin.innerHTML = '...';
                try {
                    const result = await updateMatchResult(matchObj.id, { pemenang_id: teamId }, token);
                    if (result) {
                        if (window.showSnackbar) window.showSnackbar('Pemenang berhasil disimpan!', 'success');
                        await loadMatchesAndRender();
                        await refreshTournamentDetails();
                    } else {
                        if (window.showSnackbar) window.showSnackbar('Gagal menyimpan pemenang.', 'error');
                        btnWin.disabled = false;
                        btnWin.innerHTML = '✓';
                    }
                } catch (error) {
                    console.error(error);
                    if (window.showSnackbar) window.showSnackbar('Terjadi kesalahan server.', 'error');
                    btnWin.disabled = false;
                    btnWin.innerHTML = '✓';
                }
            };
            slotContainer.appendChild(btnWin);
        }

        return slotContainer;
    }

    function renderBracket(matches) {
        if (!bracketContainer || !bracketHeader) return;

        bracketContainer.innerHTML = '';
        if (!Array.isArray(matches) || matches.length === 0) {
            bracketHeader.textContent = 'Bagan Pertandingan';
            bracketContainer.innerHTML = '<div class="no-data">Belum ada bagan pertandingan.</div>';
            return;
        }

        const rounds = [...new Set(matches.map(match => Number(match.babak)))].sort((a, b) => a - b);
        const totalRounds = rounds.length;
        const finalMatch = matches.find(m => Number(m.babak) === totalRounds);

        if (finalMatch && finalMatch.pemenang_id) {
            const juara1Id = finalMatch.pemenang_id;
            const juara2Id = finalMatch.pemain1_id === juara1Id ? finalMatch.pemain2_id : finalMatch.pemain1_id;

            document.getElementById('juara-1-name').textContent = participantNameMap.get(String(juara1Id)) || 'TBD';
            document.getElementById('juara-2-name').textContent = participantNameMap.get(String(juara2Id)) || 'TBD';
            applyStatusClasses('selesai');
            if (statusEl) {
                updateStatusColor(statusEl, 'selesai');
            }
            return;
        }

        let activeRound = rounds[0];
        for (const round of rounds) {
            const matchesInRound = matches.filter(m => Number(m.babak) === round);
            const hasUnfinished = matchesInRound.some(m => !m.pemenang_id);
            if (hasUnfinished) {
                activeRound = round;
                break;
            }
            activeRound = round;
        }

        const roundTitle = activeRound === totalRounds ? 'Final' : activeRound === totalRounds - 1 ? 'Semifinal' : activeRound === totalRounds - 2 ? 'Perempat Final' : `Babak ${activeRound}`;
        bracketHeader.textContent = `Sedang Berlangsung: ${roundTitle}`;

        const activeMatches = matches.filter(match => Number(match.babak) === activeRound);
        const roundEl = document.createElement('div');
        roundEl.className = 'active-round-grid';

        activeMatches.forEach((match) => {
            const matchup = document.createElement('div');
            matchup.className = 'matchup';
            matchup.appendChild(createTeamSlot(match.pemain1_id, match));
            matchup.appendChild(createTeamSlot(match.pemain2_id, match));
            roundEl.appendChild(matchup);
        });

        bracketContainer.appendChild(roundEl);
    }

    function setupFormHandlers() {
        if (!formAddParticipant || !inputParticipantName) return;
        formAddParticipant.addEventListener('submit', async (event) => {
            event.preventDefault();
            const newParticipantName = inputParticipantName.value.trim();
            if (!newParticipantName) return;

            const btnSubmitAdd = formAddParticipant.querySelector('.btn-add');
            const originalText = btnSubmitAdd?.textContent || 'Tambah';
            if (btnSubmitAdd) {
                btnSubmitAdd.disabled = true;
                btnSubmitAdd.textContent = '...';
            }

            try {
                const result = await addParticipant({ nama_peserta: newParticipantName }, tournamentId);
                if (result) {
                    inputParticipantName.value = '';
                    await refreshTeamsList();
                    renderTeamsIntoContainer('detail-teams');
                    renderTeamsIntoContainer('detail-teams-registration');
                    if (window.showSnackbar) window.showSnackbar('Peserta ditambahkan!', 'success');
                } else {
                    if (window.showSnackbar) window.showSnackbar('Gagal menambah peserta.', 'error');
                }
            } catch (error) {
                if (window.showSnackbar) window.showSnackbar('Terjadi kesalahan.', 'error');
            } finally {
                if (btnSubmitAdd) {
                    btnSubmitAdd.disabled = false;
                    btnSubmitAdd.textContent = originalText;
                }
            }
        });
    }

    function setupButtonHandlers() {
        if (btnStartTournament) {
            btnStartTournament.addEventListener('click', handleStartTournament);
        }
        if (btnBack) {
            btnBack.addEventListener('click', () => window.history.back());
        }
        if (btnDelete) {
            bindDeleteButton();
        }
        if (btnGenerateQr) {
            bindGenerateQrButton();
        }
    }

    async function handleStartTournament() {
        if (!token) {
            if (window.showSnackbar) window.showSnackbar('Silakan login.', 'error');
            return;
        }

        btnStartTournament.disabled = true;
        btnStartTournament.textContent = 'Memulai...';

        try {
            const result = await generateBracket(tournamentId, token);
            if (result) {
                const refreshed = await getTournamentDetails(tournamentId);
                if (refreshed) {
                    currentStatus = refreshed.status || currentStatus;
                    if (statusEl) {
                        updateStatusColor(statusEl, currentStatus);
                    }
                    applyStatusClasses(currentStatus);
                }
                await loadMatchesAndRender();
                updateAdminControlsVisibility();
                try {
                    localStorage.setItem('tournaments_update', Date.now().toString());
                } catch (e) {
                    // ignore
                }
                if (window.showSnackbar) window.showSnackbar('Lomba dimulai!', 'success');
            } else {
                if (window.showSnackbar) window.showSnackbar('Gagal memulai.', 'error');
            }
        } catch (error) {
            if (window.showSnackbar) window.showSnackbar('Terjadi kesalahan.', 'error');
        } finally {
            btnStartTournament.disabled = false;
            btnStartTournament.textContent = 'Mulai Lomba';
            updateAdminControlsVisibility();
        }
    }

    function bindDeleteButton() {
        let deleteConfirmed = false;
        let deleteTimeout;

        if (!btnDelete) return;
        if (token && currentUserId === currentTournament.user_id) btnDelete.style.display = 'block';

        btnDelete.addEventListener('click', async () => {
            if (!token) {
                if (window.showSnackbar) window.showSnackbar('Silakan login.', 'error');
                return;
            }

            if (!deleteConfirmed) {
                deleteConfirmed = true;
                btnDelete.textContent = 'Confirm Delete';
                if (window.showSnackbar) window.showSnackbar('Tekan lagi untuk konfirmasi.', 'info');
                deleteTimeout = setTimeout(() => {
                    deleteConfirmed = false;
                    btnDelete.textContent = 'Delete Room';
                }, 5000);
                return;
            }

            clearTimeout(deleteTimeout);
            btnDelete.disabled = true;
            btnDelete.textContent = 'Deleting...';

            const result = await deleteTournament(tournamentId, token);
            if (result) {
                if (window.showSnackbar) window.showSnackbar('Room dihapus.', 'success');
                setTimeout(() => { window.location.href = 'tournaments.html'; }, 800);
            } else {
                btnDelete.disabled = false;
                btnDelete.textContent = 'Delete Room';
                deleteConfirmed = false;
                if (window.showSnackbar) window.showSnackbar('Gagal menghapus.', 'error');
            }
        });
    }

    function bindGenerateQrButton() {
        if (!btnGenerateQr || !qrBox) return;
        if (token) btnGenerateQr.style.display = 'block';

        btnGenerateQr.addEventListener('click', async () => {
            if (!token) {
                if (window.showSnackbar) window.showSnackbar('Silakan login.', 'error');
                return;
            }

            btnGenerateQr.disabled = true;
            btnGenerateQr.textContent = 'Loading...';

            const qrData = await getRoomQRCode(tournamentId, token);
            if (qrData?.qr_image) {
                document.getElementById('qr-image').src = qrData.qr_image;
                qrBox.style.display = 'flex';
            } else {
                if (window.showSnackbar) window.showSnackbar('Gagal memuat QR Code.', 'error');
            }

            btnGenerateQr.disabled = false;
            btnGenerateQr.textContent = 'Generate QR Code';
        });
    }
});