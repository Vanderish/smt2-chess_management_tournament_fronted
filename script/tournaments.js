import { getAllTournaments, getStats, createTournament } from './utils/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const tournamentList = document.getElementById('tournament-list');
    const btnCreate = document.getElementById('btn-create');
    const modal = document.getElementById('tournamentModal');
    const closeModalBtn = document.querySelector('.close-btn');
    const modalForm = document.getElementById('modal-form');
    const filterContainer = document.getElementById('filter-container');
    const modalCategorySelect = document.getElementById('modal-category');
    const searchInput = document.getElementById('search-input');

    let allTournamentsData = [];
    let currentUserId = null;
    let searchTerm = '';
    let filterExpanded = false;
    let activeFilter = 'all';
    const token = localStorage.getItem('tokenTurnamen');

    const filterDefinitions = [
        { label: 'Semua Turnamen', value: 'all' },
        { label: 'Turnamen Saya', value: 'mine' }
    ];

    initPage();

    async function initPage() {
        parseToken();
        setupAuthUi();
        setupEventListeners();
        renderFilterButtons();
        await loadTournaments();
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

    function setupAuthUi() {
        if (btnCreate) {
            btnCreate.style.display = token ? 'block' : 'none';
        }
    }

    function setupEventListeners() {
        if (filterContainer) {
            filterContainer.addEventListener('click', handleFilterClick);
        }
        if (searchInput) {
            searchInput.addEventListener('input', handleSearchInput);
        }
        if (btnCreate) {
            btnCreate.addEventListener('click', handleCreateClick);
        }
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        window.addEventListener('click', handleWindowClick);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('storage', handleStorageEvent);
        if (modalForm) {
            modalForm.addEventListener('submit', handleModalSubmit);
        }
    }

    function handleFilterClick(event) {
        const button = event.target.closest('.filter-btn');
        if (!button) return;

        const action = button.dataset.action;
        if (action === 'more') {
            filterExpanded = true;
            renderFilterButtons();
            return;
        }
        if (action === 'close') {
            filterExpanded = false;
            renderFilterButtons();
            return;
        }

        const filterType = button.dataset.filter;
        if (!filterType) return;
        setActiveFilter(filterType);
    }

    function handleSearchInput(event) {
        searchTerm = event.target.value || '';
        renderTournamentCards(getFilteredTournaments());
    }

    function handleCreateClick() {
        const currentToken = localStorage.getItem('tokenTurnamen');
        if (!currentToken) {
            if (window.showSnackbar) window.showSnackbar('Sesi Anda telah habis, silakan login kembali!', 'error');
            window.location.href = 'login.html';
            return;
        }
        if (modal) modal.style.display = 'flex';
    }

    function closeModal() {
        if (modal) modal.style.display = 'none';
    }

    function handleWindowClick(event) {
        if (event.target === modal) {
            closeModal();
        }
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            loadTournaments();
        }
    }

    function handleWindowFocus() {
        loadTournaments();
    }

    function handleStorageEvent(event) {
        if (event && event.key === 'tournaments_update') {
            loadTournaments();
        }
    }

    function getCategoryFilters() {
        if (!modalCategorySelect) return [];
        return [...modalCategorySelect.options]
            .filter(option => option.value && !option.disabled)
            .map(option => ({ label: option.text, value: option.value }));
    }

    function getFilters() {
        const currentFilters = [
            { label: 'Semua Turnamen', value: 'all' }
        ];
        if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
            currentFilters.push({ label: 'Turnamen Saya', value: 'mine' });
        }
        return [...currentFilters, ...getCategoryFilters()];
    }

    function applyFilter(filterType) {
        if (filterType === 'mine') {
            return allTournamentsData.filter(t => t.user_id === currentUserId);
        }
        if (filterType === 'all') {
            return allTournamentsData;
        }
        return allTournamentsData.filter(t => t.jenis_lomba === filterType);
    }

    function getFilteredTournaments() {
        const filteredByType = applyFilter(activeFilter);
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) return filteredByType;

        return filteredByType.filter(tourney => {
            const name = (tourney.nama_turnamen || '').toLowerCase();
            const category = (tourney.jenis_lomba || '').toLowerCase();
            return name.includes(normalizedSearch) || category.includes(normalizedSearch);
        });
    }

    function setActiveFilter(filterType) {
        activeFilter = filterType;
        renderFilterButtons();
        renderTournamentCards(getFilteredTournaments());
    }

    function renderFilterButtons() {
        if (!filterContainer) return;

        const filters = getFilters();
        const shouldShowMore = !filterExpanded && filters.length > 4;
        const visibleFilters = shouldShowMore ? filters.slice(0, 3) : filters;

        const buttonsHtml = visibleFilters.map(filter => {
            const activeClass = filter.value === activeFilter ? ' active' : '';
            return `<button type="button" class="filter-btn${activeClass}" data-filter="${filter.value}">${filter.label}</button>`;
        }).join('');

        let extraButtonHtml = '';
        if (shouldShowMore) {
            extraButtonHtml = `<button type="button" class="filter-btn filter-more-btn" data-action="more">Lainnya<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 9L12 13L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
        } else if (filterExpanded && filters.length > 4) {
            extraButtonHtml = `<button type="button" class="filter-btn filter-close-btn" data-action="close" aria-label="Tutup filter"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
        }

        filterContainer.innerHTML = buttonsHtml + extraButtonHtml;
    }

    function renderTournamentCards(data) {
        if (!tournamentList) return;

        tournamentList.innerHTML = '';
        if (!data || data.length === 0) {
            tournamentList.innerHTML = '<p style="color: #aaa;">Belum ada turnamen saat ini.</p>';
            return;
        }

        data.forEach(tourney => {
            const statusClass = tourney.status === 'berjalan' ? 'ongoing' : tourney.status === 'selesai' ? 'finished' : 'waiting';
            const statusText = tourney.status === 'berjalan' ? 'Ongoing' : tourney.status === 'selesai' ? 'Finished' : 'Upcoming';
            const namaTurnamen = tourney.nama_turnamen || 'Turnamen Tanpa Nama';
            const kategori = tourney.jenis_lomba || 'Game';
            const totalPeserta = tourney.total_peserta || 0;

            const cardHTML = `
                <div class="tournament-card">
                    <span class="category">${kategori}</span>
                    <h2>${namaTurnamen}</h2>
                    <p>Total Peserta : ${totalPeserta}</p>
                    <div class="status ${statusClass}">${statusText}</div>
                    <button onclick="window.location.href='detail.html?id=${tourney.id}'">View Details</button>
                </div>
            `;
            tournamentList.innerHTML += cardHTML;
        });
    }

    async function loadTournaments() {
        try {
            const data = await getAllTournaments();
            allTournamentsData = data || [];
            renderTournamentCards(getFilteredTournaments());
        } catch (error) {
            console.error('Load tournaments error:', error);
            if (tournamentList) {
                tournamentList.innerHTML = '<p style="color: #ff4d4d;">Gagal memuat data.</p>';
            }
        }
    }

    async function handleModalSubmit(event) {
        event.preventDefault();
        const nameInputElement = document.getElementById('modal-name');
        const categoryInputElement = document.getElementById('modal-category');
        if (!nameInputElement || !categoryInputElement) return;

        const nameInput = nameInputElement.value.trim();
        const categoryInput = categoryInputElement.value;
        const currentToken = localStorage.getItem('tokenTurnamen');

        if (!currentToken) {
            if (window.showSnackbar) window.showSnackbar('Anda belum login atau sesi telah habis!', 'error');
            window.location.href = 'login.html';
            return;
        }

        const submitBtn = modalForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn?.innerText || 'Menyimpan...';
        if (submitBtn) {
            submitBtn.innerText = 'Menyimpan...';
            submitBtn.disabled = true;
        }

        const tournamentData = {
            nama_turnamen: nameInput,
            jenis_lomba: categoryInput
        };

        const result = await createTournament(tournamentData, currentToken);

        if (submitBtn) {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }

        if (result) {
            modalForm.reset();
            closeModal();
            if (window.showSnackbar) window.showSnackbar(`Turnamen Baru "${nameInput}" Berhasil Dibuat!`, 'success');
            window.location.reload();
        } else {
            if (window.showSnackbar) window.showSnackbar('Gagal membuat turnamen. Pastikan koneksi aman dan Anda adalah Panitia.', 'error');
        }
    }
});
