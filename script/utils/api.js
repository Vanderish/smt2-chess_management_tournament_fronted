const BASE_URL = 'https://betournament.onrender.com'; 

// crud participnants
export async function getParticipants(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/participants/${id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const participants = await response.json();
        if (Array.isArray(participants)) return participants;
        if (Array.isArray(participants?.data)) return participants.data;
        if (Array.isArray(participants?.participants)) return participants.participants;
        return participants || [];
    } catch (error) {
        console.error('Error fetching participants:', error);
        return null;
    }
}
export async function addParticipant(participantData, tournament_id, token) {
    try {
        const response = await fetch(`${BASE_URL}/api/participants/${tournament_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(participantData)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const newParticipant = await response.json();
        return newParticipant;
    } catch (error) {
        console.error('Error adding participant:', error);
        return null;
    }
}
export async function deleteParticipant(id, token) {
    try {
        const response = await fetch(`${BASE_URL}/api/participants/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting participant:', error);
        return null;
    }
}
export async function updateParticipant(id, participantData, token) {
    try {
        const response = await fetch(`${BASE_URL}/api/participants/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(participantData)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const updatedParticipant = await response.json();
        return updatedParticipant;
    } catch (error) {
        console.error('Error updating participant:', error);
        return null;
    }
}

// crud tournaments
export async function getAllTournaments() {
    try {
        const response = await fetch(`${BASE_URL}/api/tournaments`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const tournaments = await response.json();
        return tournaments;
    } catch (error) {
        console.error('Error fetching all tournaments:', error);
        return null;
    }
}
export async function getTournamentDetails(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/tournaments/${id}`, {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const tournamentDetails = await response.json();
        return tournamentDetails;
    } catch (error) {
        console.error('Error fetching tournament details:', error);
        return null;
    }
}
export async function createTournament(tournamentData, token) {
    try {
        const response = await fetch(`${BASE_URL}/api/tournaments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(tournamentData)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const newTournament = await response.json();
        return newTournament;
    } catch (error) {
        console.error('Error creating tournament:', error);
        return null;
    }
}
export async function generateBracket(id, token) {
    try {
        const response = await fetch(`${BASE_URL}/api/tournaments/generate-bracket/${id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const bracketResult = await response.json();
        return bracketResult;
    } catch (error) {
        console.error('Error generating bracket:', error);
        return null;
    }
}
export async function getStats() {
    try {
        const response = await fetch(`${BASE_URL}/api/tournaments/stats`, {
            method: 'GET'
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}
export async function deleteTournament(id, token) {
    try {
        const response = await fetch(`${BASE_URL}/api/tournaments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting tournament:', error);
        return null;
    }
}

// crud matches
export async function getMatchesByTournament(tournamentId) {
    try {
        const response = await fetch(`${BASE_URL}/api/matches/tournament/${tournamentId}`, {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const matches = await response.json();
        return matches;
    } catch (error) {
        console.error('Error fetching matches by tournament:', error);
        return null;
    }
}
export async function getMatchDetails(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/matches/${id}`, {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const matchDetails = await response.json();
        return matchDetails;
    } catch (error) {
        console.error('Error fetching match details:', error);
        return null;
    }
}
export async function updateMatchResult(id, matchData, token) {
    try {
        const response = await fetch(`${BASE_URL}/api/matches/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(matchData)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const updatedMatch = await response.json();
        return updatedMatch;
    } catch (error) {
        console.error('Error updating match result:', error);
        return null;
    }
}

// qr
export async function getRoomQRCode(roomId, token) {
    try {
        const response = await fetch(`${BASE_URL}/api/participants/qr/${roomId}`, {
            method: 'GET',
            headers: {
                // Wajib ngirim token karena ini khusus panitia
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal mengambil QR Code');
        }

        const data = await response.json();
        return data; 
        // Nanti di frontend kamu tinggal panggil: data.qr_image
    } catch (error) {
        console.error('Error fetching QR Code:', error);
        return null;
    }
}

// auth
export async function register(username, password) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error during registration:', error);
        return null;
    }
}
// jwt login
export async function login(username, password) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem('tokenTurnamen', data.token);
        return data;
    } else {
        console.log(data.error);
        return null;
    }
}