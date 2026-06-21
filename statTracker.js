
let matches = [];

async function loadMatches() {

    const response = await fetch('matches.json');

    matches = await response.json();

    console.log(matches);
    document.getElementById('divisionSelect').addEventListener('change', populateRounds);

    document.getElementById('roundSelect').addEventListener('change', populateMatches);

    document.getElementById('matchSelect').addEventListener('change', loadSelectedMatch);

}

loadMatches();

function populateRounds() {
    console.log('matches:', matches);
    const division = parseInt(document.getElementById('divisionSelect').value);
    const roundSelect = document.getElementById('roundSelect');
    roundSelect.innerHTML = '<option value="" disabled selected hidden>Select Round</option>';

    const seen = new Set();
    matches
        .filter(m => m.division === division)
        .forEach(m => {
            if (!seen.has(m.round_number)) {
                seen.add(m.round_number);
                const option = document.createElement('option');
                option.value = m.round_number;
                option.textContent = `Round ${m.round_number}`;
                roundSelect.appendChild(option);
            }
        });
}

function populateMatches() {
    const division = parseInt(document.getElementById('divisionSelect').value);
    const round = parseInt(document.getElementById('roundSelect').value);
    const matchSelect = document.getElementById('matchSelect');
    matchSelect.innerHTML = '<option value="" disabled selected hidden>Select Match</option>';

    matches.forEach((match, index) => {
        if (match.division !== division || match.round_number !== round) return;
        if (!match.home_team || !match.away_team) return; // skip nulls

        const option = document.createElement('option');
        option.value = index; // use index as the value
        const time = new Date(match.datetime).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        option.textContent = `${match.home_team} vs ${match.away_team} (${time})`;
        matchSelect.appendChild(option);
    });
}

function loadSelectedMatch() {
    const matchSelect = document.getElementById('matchSelect');
    const index = matchSelect.value;
    if (index === '' || index === null) return;

    const match = matches[parseInt(index)];
    if (!match) return;

    // Home Team
    const homeSelect = document.querySelector('#homeSheet .team-select');
    if (homeSelect) {
        homeSelect.value = match.home_club;
        if (!homeSelect.value) {
            const opt = document.createElement('option');
            opt.value = match.home_club;
            opt.textContent = match.home_club;
            homeSelect.appendChild(opt);
            homeSelect.value = match.home_club;
        }
        homeSelect.dispatchEvent(new Event('change'));
    }

    // Away Team
    const awaySelect = document.querySelector('#awaySheet .team-select');
    if (awaySelect) {
        awaySelect.value = match.away_club;
        if (!awaySelect.value) {
            const opt = document.createElement('option');
            opt.value = match.away_club;
            opt.textContent = match.away_club;
            awaySelect.appendChild(opt);
            awaySelect.value = match.away_club;
        }
        awaySelect.dispatchEvent(new Event('change'));
    }
}

const stats = ['SA', 'SM', 'PA', 'PM', 'AST', 'REB', 'STK', 'TOV', 'GA'];

const teamStyles = {
    "Scaldis Tigers": { bg: "#FE5A1D", text: "#000000" },
    "Scaldis Tigers - Black": { bg: "#000000", text: "#FE5A1D" },
    "Adelaide Boomers": { bg: "#019e4d", text: "#590577" },
    "North Adelaide Roosters": { bg: "#ae2e2d", text: "#FFFFFF" },
    "Arista Marion": { bg: "#f7c407", text: "#da251e" },
    "Flinders Sharks": { bg: "#88bfff", text: "#FFFFFF" },
    "Flinders Sharks - Blue": { bg: "#326EBD", text: "#FFFFFF" },
    "Default": { bg: "#111111", text: "#FFFFFF" }
};

// const rosters ={
//     "Adelaide Boomers" {
//         "Chris Graves",
//         "Jess Phillips",

//     }
// }

let actionHistory = [];
let currentQuarter = 1;
let eventLog = [];

function getQuarterValue(el) {

    if (currentQuarter === 'total') {

        return (
            parseInt(el.dataset.q1) +
            parseInt(el.dataset.q2) +
            parseInt(el.dataset.q3) +
            parseInt(el.dataset.q4)
        );

    }

    return parseInt(
        el.dataset[`q${currentQuarter}`]
    );

}

function setQuarterValue(el, value) {

    if (currentQuarter === 'total') return;

    el.dataset[`q${currentQuarter}`] = value;

}

function refreshDisplayedStat(el) {

    el.innerText = getQuarterValue(el);

}

function addLogEntry(player, stat, change) {

    if (currentQuarter === 'total') return;

    const quarterLabel = `Q${currentQuarter}`;

    eventLog.push({
        quarter: quarterLabel,
        player,
        stat,
        change,
        timestamp: Date.now()
    });

}

function createTeamSheet(id, placeholder) {
    const container = document.getElementById(id);
    container.innerHTML = `
                <div class="team-header">
                    <select class="team-select">
                        <option value="" disabled selected hidden>Select Team</option>
                        <option value="Scaldis Tigers">Scaldis Tigers</option>
                        <option value="Scaldis Tigers - Black">Scaldis Tigers - Black</option>
                        <option value="Adelaide Boomers">Adelaide Boomers</option>
                        <option value="North Adelaide Roosters">North Adelaide Roosters</option>
                        <option value="Arista Marion">Arista Marion</option>
                        <option value="Flinders Sharks">Flinders Sharks</option>
                        <option value="Flinders Sharks - Blue">Flinders Sharks - Blue</option>
                    </select>
                </div>
                ${createDivision('First Attack')}
                ${createDivision('First Defence')}
                ${createDivision('Substitutes', true)}
                <div class="division-title">Team Totals</div>
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th></th><th>SA</th><th>SM</th><th>PA</th><th>PM</th>
                            <th>AST</th><th>REB</th><th>STK</th><th>TOV</th><th>GA</th>
                        </tr>
                    </thead>
                    <tfoot>
                        <tr class="totals-row">
                            <td>TOTAL</td>
                            <td class="total-sa">0</td><td class="total-sm">0</td>
                            <td class="total-pa">0</td><td class="total-pm">0</td>
                            <td class="total-ast">0</td><td class="total-reb">0</td>
                            <td class="total-stk">0</td><td class="total-tov">0</td>
                            <td class="total-ga">0</td>
                        </tr>
                        <tr class="totals-row percentage-row">
                            <td></td>
                            <td colspan="2" class="divisionFG">0%</td>
                            <td colspan="2" class="divisionPen">0%</td>
                            <td></td><td></td><td></td><td></td><td></td>
                        </tr>
                    </tfoot>
                </table>
            `;
    populatePlayers(container);
}

function createDivision(name, isSubstitutes = false) {
    return `
                <div class="division-title">
                    ${name}
                    ${isSubstitutes ? `<button class="add-sub-btn" onclick="addSubstitute(this)">+ Add Player</button>` : ''}
                </div>
                <div class="table-wrap">
                    <table class="stats-table">
                        <thead>
                            <tr>
                                <th>PLAYER</th><th>SA</th><th>SM</th><th>PA</th><th>PM</th>
                                <th>AST</th><th>REB</th><th>STK</th><th>TOV</th><th>GA</th>
                            </tr>
                        </thead>
                        <tbody class="players"></tbody>
                        <tfoot>
                            <tr class="totals-row">
                                <td>TOTAL</td>
                                <td class="total-sa">0</td><td class="total-sm">0</td>
                                <td class="total-pa">0</td><td class="total-pm">0</td>
                                <td class="total-ast">0</td><td class="total-reb">0</td>
                                <td class="total-stk">0</td><td class="total-tov">0</td>
                                <td class="total-ga">0</td>
                            </tr>
                            <tr class="totals-row percentage-row">
                                <td></td>
                                <td colspan="2" class="divisionFG">0%</td>
                                <td colspan="2" class="divisionPen">0%</td>
                                <td></td><td></td><td></td><td></td><td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
}

function populatePlayers(container) {
    const divisions = container.querySelectorAll('.players');
    divisions.forEach((body, index) => {
        if (index === 2) return;
        for (let i = 0; i < 4; i++) addPlayerRow(body, false);
    });
}

function addPlayerRow(body, isSubstitute = false) {
    const row = document.createElement('tr');
    let html = `
                <td class="player-cell">
                    <div class="player-row-top">
                        <input class="player-input" placeholder="Player">
                        ${isSubstitute ? `<button class="remove-player-btn" onclick="removePlayer(this)">×</button>` : ''}
                    </div>
                </td>
            `;
    stats.forEach(stat => {
        html += `
                    <td>
                        <div class="stat-control">
                            <button class="stat-btn minus">-</button>
                            <span class="stat-value"
                            data-q1="0"
                            data-q2="0"
                            data-q3="0"
                            data-q4="0">0</span>
                            <button class="stat-btn plus">+</button>
                        </div>
                    </td>
                `;
    });
    row.innerHTML = html;
    body.appendChild(row);
}

function addSubstitute(button) {
    const division = button.closest('.division-title').nextElementSibling;
    const tbody = division.querySelector('.players');
    addPlayerRow(tbody, true);
}

function removePlayer(button) {
    button.closest('tr').remove();
    updateAll();
}

function attachEvents() {
    document.addEventListener('click', e => {
        if (e.target.classList.contains('plus')) {
            if (currentQuarter === 'total') return;
            const control = e.target.parentElement;
            const value = control.querySelector('.stat-value');
            const row = control.closest('tr');
            const allValues = row.querySelectorAll('.stat-value');
            const clickedCell = control.closest('td');
            const cellIndex = clickedCell.cellIndex;
            const changes = [];
            const oldValue = getQuarterValue(value);
            setQuarterValue(value, oldValue + 1);
            refreshDisplayedStat(value);
            const player =
                row.querySelector('.player-input')?.value || 'Unnamed Player';

            const statName =
                stats[cellIndex - 1];

            addLogEntry(
                player,
                statName,
                '+1'
            );
            changes.push({ element: value, previous: oldValue });
            if (cellIndex === 2) {

                const shotAttemptValue = allValues[0];

                const previous = getQuarterValue(shotAttemptValue);

                setQuarterValue(
                    shotAttemptValue,
                    previous + 1
                );

                refreshDisplayedStat(shotAttemptValue);

                changes.push({
                    element: shotAttemptValue,
                    previous
                });

            }
            if (cellIndex === 4) {

                const penAttemptValue = allValues[2];

                const previous = getQuarterValue(penAttemptValue);

                setQuarterValue(
                    penAttemptValue,
                    previous + 1
                );

                refreshDisplayedStat(penAttemptValue);

                changes.push({
                    element: penAttemptValue,
                    previous
                });

            }
            actionHistory.push(changes);
            updateAll();
        }
        if (e.target.classList.contains('minus')) {

            if (currentQuarter === 'total') return;

            const control =
                e.target.parentElement;

            const value =
                control.querySelector('.stat-value');

            const row =
                control.closest('tr');

            const allValues =
                row.querySelectorAll('.stat-value');

            const clickedCell =
                control.closest('td');

            const cellIndex =
                clickedCell.cellIndex;

            let current = getQuarterValue(value);

            if (current > 0) {

                const changes = [];

                const previous = current;

                setQuarterValue(value, current - 1);

                refreshDisplayedStat(value);

                const player =
                    row.querySelector('.player-input')?.value || 'Unnamed Player';

                const statName =
                    stats[cellIndex - 1];

                addLogEntry(
                    player,
                    statName,
                    '-1'
                );

                changes.push({
                    element: value,
                    previous
                });

                // If decreasing SM, also decrease SA
                if (cellIndex === 2) {

                    const shotAttemptValue = allValues[0];

                    const previousSA =
                        getQuarterValue(shotAttemptValue);

                    if (previousSA > 0) {

                        setQuarterValue(
                            shotAttemptValue,
                            previousSA - 1
                        );

                        refreshDisplayedStat(shotAttemptValue);

                        changes.push({
                            element: shotAttemptValue,
                            previous: previousSA
                        });

                    }

                }

                // If decreasing PM, also decrease PA
                if (cellIndex === 4) {

                    const penAttemptValue = allValues[2];

                    const previousPA =
                        getQuarterValue(penAttemptValue);

                    if (previousPA > 0) {

                        setQuarterValue(
                            penAttemptValue,
                            previousPA - 1
                        );

                        refreshDisplayedStat(penAttemptValue);

                        changes.push({
                            element: penAttemptValue,
                            previous: previousPA
                        });

                    }

                }

                actionHistory.push(changes);

                updateAll();

            }

        }
    });
}

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undoLastAction();
    }
});

function attachTeamSelectors() {
    document.querySelectorAll('.team-select').forEach(select => {
        select.addEventListener('change', () => {
            const team = teamStyles[select.value] || teamStyles.Default;
            const header = select.closest('.team-header');
            header.style.background = team.bg;
            header.style.color = team.text;
            select.style.color = team.text;

            // Update team labels in score table
            const sheet = select.closest('.team-sheet');
            const isHome = sheet.id === 'homeSheet';
            const label = document.getElementById(isHome ? 'homeTeamLabel' : 'awayTeamLabel');
            label.innerText = select.value || (isHome ? 'Home' : 'Away');
        });
    });
}

function attachQuarterButtons() {

    document.querySelectorAll('.quarter-btn').forEach(btn => {

        btn.addEventListener('click', () => {

            document.querySelectorAll('.quarter-btn')
                .forEach(b => b.classList.remove('active'));

            btn.classList.add('active');

            currentQuarter =
                btn.dataset.quarter === 'total'
                    ? 'total'
                    : parseInt(btn.dataset.quarter);

            document.querySelectorAll('.stat-value')
                .forEach(refreshDisplayedStat);

            updateAll();

        });

    });

}

function updateAll() {
    document.querySelectorAll('.team-sheet').forEach(sheet => {
        let teamGoals = 0, teamShots = 0, teamPens = 0, teamPM = 0;
        let teamAst = 0, teamReb = 0, teamStk = 0, teamTov = 0, teamGa = 0;

        sheet.querySelectorAll('.table-wrap').forEach(tableWrap => {
            const rows = tableWrap.querySelectorAll('tbody tr');
            let totals = { sa: 0, sm: 0, ast: 0, pa: 0, pm: 0, reb: 0, stk: 0, tov: 0, ga: 0 };
            rows.forEach(row => {
                const values = row.querySelectorAll('.stat-value');
                totals.sa += getQuarterValue(values[0]);
                totals.sm += getQuarterValue(values[1]);
                totals.pa += getQuarterValue(values[2]);
                totals.pm += getQuarterValue(values[3]);
                totals.ast += getQuarterValue(values[4]);
                totals.reb += getQuarterValue(values[5]);
                totals.stk += getQuarterValue(values[6]);
                totals.tov += getQuarterValue(values[7]);
                totals.ga += getQuarterValue(values[8]);
            });
            teamGoals += totals.sm; teamShots += totals.sa;
            teamPens += totals.pa; teamPM += totals.pm;
            teamAst += totals.ast; teamReb += totals.reb;
            teamStk += totals.stk; teamTov += totals.tov;
            teamGa += totals.ga;

            tableWrap.querySelector('.total-sa').innerText = totals.sa;
            tableWrap.querySelector('.total-sm').innerText = totals.sm;
            tableWrap.querySelector('.total-pa').innerText = totals.pa;
            tableWrap.querySelector('.total-pm').innerText = totals.pm;
            tableWrap.querySelector('.total-ast').innerText = totals.ast;
            tableWrap.querySelector('.total-reb').innerText = totals.reb;
            tableWrap.querySelector('.total-stk').innerText = totals.stk;
            tableWrap.querySelector('.total-tov').innerText = totals.tov;
            tableWrap.querySelector('.total-ga').innerText = totals.ga;
            tableWrap.querySelector('.divisionFG').innerText = totals.sa > 0 ? ((totals.sm / totals.sa) * 100).toFixed(1) + '%' : '0%';
            tableWrap.querySelector('.divisionPen').innerText = totals.pa > 0 ? ((totals.pm / totals.pa) * 100).toFixed(1) + '%' : '0%';

            // Update score table for the quarter
            const isHome = sheet.id === 'homeSheet';
            const prefix = isHome ? 'home' : 'away';

            let q1 = 0, q2 = 0, q3 = 0, q4 = 0;

            sheet.querySelectorAll('.stat-value').forEach(stat => {
                const row = stat.closest('tr');
                const values = row.querySelectorAll('.stat-value');

                //SM column only
                if (stat === values[1]) { // SM
                    q1 += parseInt(stat.dataset.q1 || 0);
                    q2 += parseInt(stat.dataset.q2 || 0);
                    q3 += parseInt(stat.dataset.q3 || 0);
                    q4 += parseInt(stat.dataset.q4 || 0);

                }

                // PM column only
                if (stat === values[3]) { // PM
                    q1 += parseInt(stat.dataset.q1 || 0);
                    q2 += parseInt(stat.dataset.q2 || 0);
                    q3 += parseInt(stat.dataset.q3 || 0);
                    q4 += parseInt(stat.dataset.q4 || 0);
                }
            });

            document.getElementById(`${prefix}Q1`).innerText = q1;
            document.getElementById(`${prefix}Q2`).innerText = q2;
            document.getElementById(`${prefix}Q3`).innerText = q3;
            document.getElementById(`${prefix}Q4`).innerText = q4;
            document.getElementById(`${prefix}Total`).innerText = q1 + q2 + q3 + q4;
        });

        const allTables = sheet.querySelectorAll('.stats-table');
        const totalTable = allTables[allTables.length - 1];
        totalTable.querySelector('.total-sa').innerText = teamShots;
        totalTable.querySelector('.total-sm').innerText = teamGoals;
        totalTable.querySelector('.total-pa').innerText = teamPens;
        totalTable.querySelector('.total-pm').innerText = teamPM;
        totalTable.querySelector('.total-ast').innerText = teamAst;
        totalTable.querySelector('.total-reb').innerText = teamReb;
        totalTable.querySelector('.total-stk').innerText = teamStk;
        totalTable.querySelector('.total-tov').innerText = teamTov;
        totalTable.querySelector('.total-ga').innerText = teamGa;
        totalTable.querySelector('.divisionFG').innerText = teamShots > 0 ? ((teamGoals / teamShots) * 100).toFixed(1) + '%' : '0%';
        totalTable.querySelector('.divisionPen').innerText = teamPens > 0 ? ((teamPM / teamPens) * 100).toFixed(1) + '%' : '0%';
    });
}

function resetStats() {
    if (!confirm('Reset all stats?')) return;

    // Reset all stat values
    document.querySelectorAll('.stat-value').forEach(stat => {
        stat.dataset.q1 = 0;
        stat.dataset.q2 = 0;
        stat.dataset.q3 = 0;
        stat.dataset.q4 = 0;
        refreshDisplayedStat(stat);
    });

    // Clear all player names
    document.querySelectorAll('.player-input').forEach(input => {
        input.value = '';
    });

    // Clear substitute players
    document.querySelectorAll('.players').forEach((body, index) => {
        if (index % 3 === 2) body.innerHTML = '';
    });

    // Reset team selectors and colours
    document.querySelectorAll('.team-sheet').forEach(sheet => {
        const teamSelect = sheet.querySelector('.team-select');
        teamSelect.selectedIndex = 0;
        const header = sheet.querySelector('.team-header');
        header.style.background = teamStyles.Default.bg;
        header.style.color = teamStyles.Default.text;
        teamSelect.style.color = teamStyles.Default.text;
    });

    // Reset header fields
    document.getElementById('matchDate') && (document.getElementById('matchDate').value = '');
    document.getElementById('divisionSelect').selectedIndex = 0;
    document.getElementById('roundSelect').selectedIndex = 0;
    document.getElementById('matchSelect').selectedIndex = 0;

    // Reset all totals cells
    document.querySelectorAll('.totals-row td').forEach(td => {
        if (td.classList.contains('divisionFG') || td.classList.contains('divisionPen')) {
            td.innerText = '0%';
        } else if (td.innerText !== 'TOTAL' && td.innerText !== '') {
            td.innerText = '0';
        }
    });

    updateAll();
}

function undoLastAction() {

    if (actionHistory.length === 0) return;

    const lastAction = actionHistory.pop();

    lastAction.forEach(change => {

        const row =
            change.element.closest('tr');

        const player =
            row?.querySelector('.player-input')?.value
            || 'Unnamed Player';

        const cell =
            change.element.closest('td');

        const cellIndex =
            cell.cellIndex;

        const statName =
            stats[cellIndex - 1];

        const currentValue =
            getQuarterValue(change.element);

        setQuarterValue(
            change.element,
            change.previous
        );

        refreshDisplayedStat(change.element);

        const diff =
            change.previous - currentValue;

        addLogEntry(
            player,
            statName,
            `(UNDO ${diff > 0 ? '+' : ''}${diff})`
        );

    });

    updateAll();

}

function showKey() {
    const modal = document.getElementById('keyModal');
    modal.style.display = 'flex';
}

function hideKey() {
    const modal = document.getElementById('keyModal');
    modal.style.display = 'none';
}

function showLog() {

    const modal =
        document.getElementById('logModal');

    const content =
        document.getElementById('logContent');

    if (eventLog.length === 0) {

        content.innerHTML =
            '<div style="color:#666;">No events recorded.</div>';

    } else {

        content.innerHTML = eventLog
            .map(event => `
                <div style="
                    padding:6px 0;
                    border-bottom:1px solid #eee;
                ">
                    <strong>${event.quarter}</strong>
                    •
                    ${event.player}
                    •
                    ${event.stat}
                    ${event.change}
                </div>
            `)
            .join('');

    }

    modal.style.display = 'flex';

}

function hideLog() {

    document.getElementById('logModal').style.display = 'none';

}

function updateTrackingMode() {

    const mode =
        document.getElementById('trackingMode').value;

    const layout =
        document.querySelector('.match-layout');

    const home =
        document.getElementById('homeSheet');

    const away =
        document.getElementById('awaySheet');

    if (mode === 'both') {

        layout.classList.remove('single-team');

        home.style.display = '';
        away.style.display = '';

    }

    else if (mode === 'home') {

        layout.classList.add('single-team');

        home.style.display = '';
        away.style.display = 'none';

    }

    else if (mode === 'away') {

        layout.classList.add('single-team');

        home.style.display = 'none';
        away.style.display = '';

    }

}

function saveGame() {
    try {
        const data = {
            date: document.getElementById('matchDate')?.value || '',
            division: document.getElementById('divisionSelect')?.selectedIndex || 0,
            round: document.getElementById('roundSelect')?.selectedIndex || 0,
            match: document.getElementById('matchSelect')?.selectedIndex || 0,
            teams: []
        };

        document.querySelectorAll('.team-sheet').forEach(sheet => {
            const team = {
                selectedIndex: sheet.querySelector('.team-select').selectedIndex,
                divisions: []
            };

            sheet.querySelectorAll('.table-wrap').forEach(tableWrap => {
                const division = { players: [] };
                tableWrap.querySelectorAll('tbody tr').forEach(row => {
                    const playerInput = row.querySelector('.player-input');
                    if (!playerInput) return;
                    division.players.push({
                        name: playerInput.value,
                        stats: [...row.querySelectorAll('.stat-value')].map(s => ({
                            q1: s.dataset.q1,
                            q2: s.dataset.q2,
                            q3: s.dataset.q3,
                            q4: s.dataset.q4
                        })),
                        isSub: !!row.querySelector('.remove-player-btn')
                    });
                });
                team.divisions.push(division);
            });

            data.teams.push(team);
        });

        localStorage.setItem('korfballSave', JSON.stringify(data));
        alert('Game Saved');

    } catch (err) {
        alert('Save failed: ' + err.message);
        console.error(err);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('korfballSave');
        if (!saved) { alert('No saved game found.'); return; }

        const data = JSON.parse(saved);

        // Restore header fields
        document.getElementById('matchDate').value = data.date || '';
        document.getElementById('divisionSelect').selectedIndex = data.division || 0;
        document.getElementById('roundSelect').selectedIndex = data.round || 0;
        document.getElementById('matchSelect').selectedIndex = data.match || 0;

        // Restore each team
        document.querySelectorAll('.team-sheet').forEach((sheet, ti) => {
            const team = data.teams[ti];
            if (!team) return;

            // Restore team selection + colour
            const teamSelect = sheet.querySelector('.team-select');
            teamSelect.selectedIndex = team.selectedIndex;
            const teamName = teamSelect.options[teamSelect.selectedIndex]?.value || '';
            const style = teamStyles[teamName] || teamStyles.Default;
            const header = sheet.querySelector('.team-header');
            header.style.background = style.bg;
            header.style.color = style.text;
            teamSelect.style.color = style.text;

            // Restore each division
            sheet.querySelectorAll('.table-wrap').forEach((tableWrap, di) => {
                const division = team.divisions[di];
                if (!division) return;

                const tbody = tableWrap.querySelector('.players');
                tbody.innerHTML = '';

                division.players.forEach(playerData => {
                    addPlayerRow(tbody, playerData.isSub);
                    const row = tbody.lastElementChild;
                    const playerInput = row.querySelector('.player-input');

                    if (playerInput) playerInput.value = playerData.name;
                    row.querySelectorAll('.stat-value').forEach((el, si) => {
                        const stat = playerData.stats[si];
                        if (typeof stat === 'object') {
                            el.dataset.q1 = stat.q1 ?? 0;
                            el.dataset.q2 = stat.q2 ?? 0;
                            el.dataset.q3 = stat.q3 ?? 0;
                            el.dataset.q4 = stat.q4 ?? 0;
                        } else {
                            // backwards compatibility with old saves
                            el.dataset.q1 = stat ?? 0;
                            el.dataset.q2 = 0;
                            el.dataset.q3 = 0;
                            el.dataset.q4 = 0;
                        }
                        refreshDisplayedStat(el);
                    });
                });
            });
        });

        updateAll();

    } catch (err) {
        alert('Load failed: ' + err.message);
        console.error(err);
    }
}

function exportPDF() {
    // Verify libraries loaded
    if (typeof html2canvas === 'undefined') {
        alert('html2canvas not loaded. Check your internet connection.');
        return;
    }
    if (typeof window.jspdf === 'undefined') {
        alert('jsPDF not loaded. Check your internet connection.');
        return;
    }

    const original = document.querySelector('.page');

    // Snapshot all live values BEFORE cloning
    const liveInputValues = [...original.querySelectorAll('input')].map(i => i.value);
    const liveSelectIndices = [...original.querySelectorAll('select')].map(s => s.selectedIndex);
    // Snapshot team names separately before cloning
    const liveTeamNames = [...original.querySelectorAll('.team-select')].map(s => s.value || '');
    const liveStatValues = [...original.querySelectorAll('.stat-value')].map(s => ({
        q1: s.dataset.q1,
        q2: s.dataset.q2,
        q3: s.dataset.q3,
        q4: s.dataset.q4
    }));
    const liveTotalValues = [...original.querySelectorAll('.totals-row td')].map(td => td.innerText);

    const element = original.cloneNode(true);

    const temp = document.createElement('div');
    temp.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-9999;';
    document.body.appendChild(temp);
    temp.appendChild(element);

    // Remove interactive controls
    element.querySelectorAll('.footer, .stat-btn, .add-sub-btn, .remove-player-btn').forEach(el => el.remove());

    const naturalWidth = original.scrollWidth;
    element.style.cssText = `width:${naturalWidth}px;max-width:none;background:white;padding:10px;box-sizing:border-box;`;
    const naturalHeight = element.scrollHeight;  // ← element not original, after footer removed



    // Remove empty substitute rows
    element.querySelectorAll('.players').forEach((tbody, index) => {
        if (index % 3 === 2) {
            tbody.querySelectorAll('tr').forEach(row => {
                const name = row.querySelector('.player-input')?.value.trim() || '';
                const total = [...row.querySelectorAll('.stat-value')].reduce((s, el) => s + (parseInt(el.innerText) || 0), 0);
                if (name === '' && total === 0) row.remove();
            });
        }
    });

    // Restore snapshotted stat values into clone
    element.querySelectorAll('.stat-value').forEach((el, i) => {

        const stat = liveStatValues[i];

        if (!stat) return;

        el.dataset.q1 = stat.q1;
        el.dataset.q2 = stat.q2;
        el.dataset.q3 = stat.q3;
        el.dataset.q4 = stat.q4;

        refreshDisplayedStat(el);

    });

    // Restore totals rows
    element.querySelectorAll('.totals-row td').forEach((td, i) => {
        if (liveTotalValues[i] !== undefined) td.innerText = liveTotalValues[i];
    });

    // Convert game-detail selects → labeled spans
    const selectMappings = [
        { id: 'trackingMode', label: null },        // hide from PDF
        { id: 'divisionSelect', label: 'Division: ' },
        { id: 'roundSelect', label: 'Round: ' },
        { id: 'matchSelect', label: null },         // hide from PDF
    ];

    selectMappings.forEach(({ id, label }) => {
        const sel = element.querySelector(`#${id}`);
        if (!sel) return;
        if (label === null) {
            sel.remove();
            return;
        }
        const original = document.getElementById(id);
        const idx = original ? original.selectedIndex : sel.selectedIndex;
        const span = document.createElement('span');
        span.innerText = label + (sel.options[idx]?.text || '');
        span.style.fontWeight = 'bold';
        sel.replaceWith(span);
    });

    // Convert team selects → plain team name spans
        element.querySelectorAll('.team-select').forEach((sel, i) => {
        const span = document.createElement('span');
        span.innerText = liveTeamNames[i] || '';
        span.style.fontWeight = 'bold';
        span.style.color = 'inherit';
        sel.replaceWith(span);
    });

    // Remove any remaining selects
    element.querySelectorAll('select').forEach(sel => sel.remove());

    // Convert inputs → spans (none expected in index.html but just in case)
    element.querySelectorAll('input').forEach((input, i) => {
        const span = document.createElement('span');
        span.innerText = liveInputValues[i] ?? '';
        span.style.fontWeight = 'bold';
        input.replaceWith(span);
    });

    // Add separators between the game-details items
    element.querySelectorAll('.game-details').forEach(details => {
        const children = [...details.children];
        children.forEach((child, i) => {
            if (i < children.length - 1) {
                const sep = document.createElement('span');
                sep.innerText = ' | ';
                sep.style.fontWeight = 'normal';
                sep.style.color = '#666';
                child.after(sep);
            }
        });
    });

    element.style.paddingTop = '20px';
    element.style.paddingBottom = '20px';
    element.style.paddingLeft = '20px';
    element.style.paddingRight = '20px';


    // Capture then build a custom-sized PDF
    html2canvas(element, {
        scale: 5,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: naturalWidth,
        windowWidth: naturalWidth,
        scrollX: 0,
        scrollY: 0
    }).then(canvas => {
        document.body.removeChild(temp);

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // px → mm at 96 dpi
        const SCALE = 2; // Compensate for html2canvas scale
        const MARGIN = 25;
        const pxToMm = px => px * 25.4 / 96 * SCALE;
        const pdfW = pxToMm(naturalWidth) + MARGIN;
        const pdfH = pxToMm(naturalHeight) + MARGIN;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            unit: 'mm',
            format: [pdfW, pdfH],
            orientation: pdfW > pdfH ? 'landscape' : 'portrait'
        });

        pdf.addImage(imgData, 'JPEG', MARGIN / 2, MARGIN / 2, pdfW - MARGIN, pdfH - MARGIN);
        pdf.save(`Match_Statistics_${new Date().toISOString().slice(0, 10)}.pdf`);

    }).catch(err => {
        document.body.removeChild(temp);
        alert('Export failed: ' + err.message);
        console.error(err);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    createTeamSheet('homeSheet', 'Home Team');
    createTeamSheet('awaySheet', 'Away Team');
    attachTeamSelectors();
    attachQuarterButtons();
    attachEvents();

    document.getElementById('trackingMode')?.addEventListener('change', updateTrackingMode);

    document.getElementById('keyModal')?.addEventListener('click', function (e) {
        if (e.target === this) hideKey();
    });

    document.getElementById('logModal')?.addEventListener('click', function (e) {
        if (e.target === this) hideLog();
    });

    // Date input auto-format
    const matchDate = document.getElementById('matchDate');
    if (matchDate) {
        let deletingDate = false;
        matchDate.addEventListener('keydown', e => { deletingDate = e.key === 'Backspace'; });
        matchDate.addEventListener('input', e => {
            let numbers = e.target.value.replace(/\D/g, '');
            if (numbers.length > 8) numbers = numbers.slice(0, 8);
            if (deletingDate) {
                let raw = '';
                if (numbers.length <= 2) raw = numbers;
                else if (numbers.length <= 4) raw = numbers.slice(0, 2) + '/' + numbers.slice(2);
                else raw = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4);
                e.target.value = raw;
                return;
            }
            let formatted = '';
            if (numbers.length >= 1) { formatted += numbers.slice(0, 2); if (numbers.length >= 2) formatted += '/'; }
            if (numbers.length >= 3) { formatted += numbers.slice(2, 4); if (numbers.length >= 4) formatted += '/'; }
            if (numbers.length >= 5) formatted += numbers.slice(4, 8);
            e.target.value = formatted;
        });
    }

    updateTrackingMode();
    updateAll();
});