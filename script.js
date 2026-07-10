/* TIMER */
let currentTime = 25 * 60;
let currentMode = 25;
let isPomodoroSession = true;
let timer;

const timerDisplay = document.getElementById("timer");

function updateDisplay(){
    let m = Math.floor(currentTime / 60);
    let s = currentTime % 60;

    timerDisplay.textContent =
        `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function startTimer(){
    clearInterval(timer);

    timer = setInterval(() => {
        if(currentTime > 0){
            currentTime--;
            updateDisplay();
        } else {
            clearInterval(timer);
            playRing(5);
            showTimesUp(5000);
            showFlappyTimesUp();
            if(isPomodoroSession){
                addPondFrog();
                addPondFlower();
                recordPomodoro();
            }
        }
    },1000);
}

function showTimesUp(duration){
    const el = document.getElementById("timesUp");
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), duration);
}

function showFlappyTimesUp(){
    const flappyOpen = document.getElementById("flappyOverlay")?.classList.contains("show");
    if(!flappyOpen) return;

    // Game stops
    flappyFrozenByTimer = true;
    cancelAnimationFrame(flappyAnimId);

    // Then the sign comes
    const sign = document.getElementById("flappyTimesUp");
    sign.classList.add("show");

    // Then it closes itself
    setTimeout(() => {
        sign.classList.remove("show");
        closeFlappy();
        flappyFrozenByTimer = false;
    }, 3000);
}

const ringAudio = new Audio("ring.mp3");
ringAudio.volume = 1.0;
ringAudio.preload = "auto";

function playRing(seconds){
    // Pause the study music so we can hear the frog croak
    const musicWasPlaying = !playerAudio.paused && playerAudio.src && !playerAudio.ended;
    if(musicWasPlaying){
        playerAudio.pause();
        const playBtn = document.getElementById("playerPlayBtn");
        if(playBtn) playBtn.textContent = "▶";
    }

    ringAudio.currentTime = 0;
    const p = ringAudio.play();
    if(p && p.catch){
        p.catch(err => console.warn("Ring couldn't play:", err));
    }
    setTimeout(() => {
        ringAudio.pause();
        ringAudio.currentTime = 0;
        // Resume study music after the ring
        if(musicWasPlaying){
            const resume = playerAudio.play();
            if(resume && resume.catch) resume.catch(() => {});
            const playBtn = document.getElementById("playerPlayBtn");
            if(playBtn) playBtn.textContent = "⏸";
        }
    }, seconds * 1000);
}

function pauseTimer(){
    clearInterval(timer);
}

function resetTimer(){
    clearInterval(timer);
    currentTime = currentMode * 60;
    updateDisplay();
}

function setFiveSeconds(){
    clearInterval(timer);
    currentTime = 5;
    isPomodoroSession = false;
    updateDisplay();
}

/* KEYPAD */
let keypadValue = "";

function openKeypad(){
    keypadValue = "";
    updateKeypadDisplay();
    document.getElementById("keypadOverlay").classList.add("show");
}

function closeKeypad(){
    document.getElementById("keypadOverlay").classList.remove("show");
}

function keypadInput(d){
    if(keypadValue.length >= 4) return;
    keypadValue += d;
    updateKeypadDisplay();
}

function keypadBackspace(){
    keypadValue = keypadValue.slice(0, -1);
    updateKeypadDisplay();
}

function keypadClear(){
    keypadValue = "";
    updateKeypadDisplay();
}

function updateKeypadDisplay(){
    const minutes = parseInt(keypadValue) || 0;
    const display = document.getElementById("keypadDisplay");

    if(minutes >= 60){
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        display.textContent = m === 0 ? `${h} hr` : `${h} hr ${m} min`;
    } else {
        display.textContent = `${minutes} min`;
    }
}

function setCustomTime(){
    const minutes = parseInt(keypadValue) || 0;
    if(minutes <= 0) return;

    clearInterval(timer);
    currentMode = minutes;
    currentTime = minutes * 60;
    isPomodoroSession = false;
    updateDisplay();

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    closeKeypad();
}

/* MODES */
function switchMode(minutes, button){
    clearInterval(timer);

    currentMode = minutes;
    currentTime = minutes * 60;
    isPomodoroSession = (minutes === 25);

    updateDisplay();

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    button.classList.add("active");
}

/* TODO */
function addTodo(){
    const input = document.getElementById("todoInput");
    const text = input.value.trim();
    if(!text) return;

    const li = document.createElement("li");

    li.innerHTML = `
        <div class="task-left">
            <input type="checkbox">
            <span>${text}</span>
        </div>
        <div class="sparkle">${getTheme().todoSparkle}</div>
    `;

    li.querySelector("input").addEventListener("change", () => {
        li.classList.toggle("checked");
    });

    document.getElementById("todoList").appendChild(li);

    input.value = "";
}

function clearCompleted(){
    document.querySelectorAll("#todoList li.checked").forEach(li => li.remove());
}

updateDisplay();

/* MINI GAMES MENU */
function openGamesMenu(){ document.getElementById("gamesOverlay").classList.add("show"); }
function closeGamesMenu(){ document.getElementById("gamesOverlay").classList.remove("show"); }

/* MEMORY MATCH */
const MEMORY_SETS = {
    frog: ["🐸","🪷","🌸","🦋","💗","🌷","✨","🐌"],
    bear: ["🐻‍❄️","❄️","🧸","⭐","💙","🌲","🌨️","🩵"]
};

let memoryCards = [];
let memoryFlipped = [];
let memoryMoves = 0;
let memoryMatched = 0;
let memoryLock = false;

function startMemory(){
    closeGamesMenu();
    document.getElementById("memoryOverlay").classList.add("show");
    document.getElementById("memoryWin").style.display = "none";
    memoryMoves = 0;
    memoryMatched = 0;
    memoryFlipped = [];
    memoryLock = false;

    const pool = MEMORY_SETS[currentTheme] || MEMORY_SETS.frog;
    memoryCards = [...pool, ...pool]
        .map(e => ({ emoji: e, flipped: false, matched: false }))
        .sort(() => Math.random() - 0.5);

    document.getElementById("memoryMoves").textContent = 0;
    document.getElementById("memoryMatched").textContent = 0;
    renderMemory();
}

function renderMemory(){
    const grid = document.getElementById("memoryGrid");
    grid.innerHTML = "";
    memoryCards.forEach((c, i) => {
        const el = document.createElement("div");
        el.className = "memory-card";
        if(c.flipped) el.classList.add("flipped");
        if(c.matched) el.classList.add("matched");
        el.textContent = (c.flipped || c.matched) ? c.emoji : "❓";
        el.onclick = () => flipMemoryCard(i);
        grid.appendChild(el);
    });
}

function flipMemoryCard(idx){
    if(memoryLock) return;
    const c = memoryCards[idx];
    if(c.flipped || c.matched) return;
    c.flipped = true;
    memoryFlipped.push(idx);
    renderMemory();

    if(memoryFlipped.length === 2){
        memoryMoves++;
        document.getElementById("memoryMoves").textContent = memoryMoves;
        const [a, b] = memoryFlipped;
        if(memoryCards[a].emoji === memoryCards[b].emoji){
            memoryCards[a].matched = true;
            memoryCards[b].matched = true;
            memoryMatched++;
            document.getElementById("memoryMatched").textContent = memoryMatched;
            memoryFlipped = [];
            renderMemory();
            if(memoryMatched === 8){
                document.getElementById("memoryWin").textContent = `🎉 You won in ${memoryMoves} moves! 🎉`;
                document.getElementById("memoryWin").style.display = "block";
            }
        } else {
            memoryLock = true;
            setTimeout(() => {
                memoryCards[a].flipped = false;
                memoryCards[b].flipped = false;
                memoryFlipped = [];
                memoryLock = false;
                renderMemory();
            }, 800);
        }
    }
}

function closeMemory(){ document.getElementById("memoryOverlay").classList.remove("show"); }

/* CATCH THE FLY */
let catchflyScore = 0;
let catchflyTimeLeft = 30;
let catchflyInterval = null;
let catchflyTimer = null;

function startCatchFly(){
    closeGamesMenu();
    document.getElementById("catchflyOverlay").classList.add("show");
    document.getElementById("catchflyWin").style.display = "none";
    catchflyScore = 0;
    catchflyTimeLeft = 30;
    document.getElementById("catchflyScore").textContent = 0;
    document.getElementById("catchflyTime").textContent = 30;
    const arena = document.getElementById("catchflyArena");
    arena.innerHTML = "";

    if(catchflyInterval) clearInterval(catchflyInterval);
    if(catchflyTimer)    clearInterval(catchflyTimer);

    catchflyInterval = setInterval(spawnCatchflyTarget, 800);
    catchflyTimer = setInterval(() => {
        catchflyTimeLeft--;
        document.getElementById("catchflyTime").textContent = catchflyTimeLeft;
        if(catchflyTimeLeft <= 0) endCatchFly();
    }, 1000);
}

function spawnCatchflyTarget(){
    const arena = document.getElementById("catchflyArena");
    if(!arena) return;
    const fly = document.createElement("div");
    fly.className = "catchfly-target";
    fly.textContent = currentTheme === "bear" ? "❄️" : "🪰";
    fly.style.left = (10 + Math.random() * 80) + "%";
    fly.style.top  = (10 + Math.random() * 80) + "%";
    fly.onclick = () => {
        fly.classList.add("caught");
        catchflyScore++;
        document.getElementById("catchflyScore").textContent = catchflyScore;
        setTimeout(() => fly.remove(), 300);
    };
    arena.appendChild(fly);
    setTimeout(() => fly.remove(), 1400);
}

function endCatchFly(){
    if(catchflyInterval) clearInterval(catchflyInterval);
    if(catchflyTimer)    clearInterval(catchflyTimer);
    catchflyInterval = null;
    catchflyTimer = null;
    document.getElementById("catchflyArena").innerHTML = "";
    const win = document.getElementById("catchflyWin");
    win.textContent = getTheme().catchFlyEndMsg(catchflyScore);
    win.style.display = "block";
}

function closeCatchFly(){
    if(catchflyInterval) clearInterval(catchflyInterval);
    if(catchflyTimer)    clearInterval(catchflyTimer);
    catchflyInterval = null;
    catchflyTimer = null;
    document.getElementById("catchflyOverlay").classList.remove("show");
}

/* FLUTTERING FLY (every 5 minutes) */
function spawnFly(){
    const fly = document.createElement("div");
    fly.className = "fly";
    fly.textContent = getTheme().flyEmoji;

    const y = window.innerHeight * 0.2 + Math.random() * window.innerHeight * 0.5;
    fly.style.top = y + "px";

    fly.classList.add(Math.random() > 0.5 ? "fly-right" : "fly-left");

    document.body.appendChild(fly);
    fly.addEventListener("animationend", () => fly.remove());
}

setInterval(spawnFly, 5 * 60 * 1000);

/* PROFILE SYSTEM */
const PROFILE_KEYS = [
    "pondFrogs", "pondCoins", "ownedSongs", "ownedBackgrounds",
    "themeActiveBgs", "currentTheme", "frogNames",
    "currentStreak", "bestStreak", "lastLoginDate",
    "totalFocusMinutes", "totalPomodoros", "totalFrogsCollected",
    "unlockedAchievements", "flappyHighScore", "pondGarden"
];

const AVATAR_CHOICES = ["🐸","🐻‍❄️","🐱","🐰","🦊","🐼","🦋","🌸","🪷","💗","✨","🌷"];

function getProfiles(){
    return JSON.parse(localStorage.getItem("pf_profiles") || "{}");
}

function saveProfiles(p){
    localStorage.setItem("pf_profiles", JSON.stringify(p));
}

function getActiveUser(){
    return localStorage.getItem("pf_activeUser");
}

function snapshotToProfile(username){
    if(!username) return;
    const profiles = getProfiles();
    if(!profiles[username]) return;
    profiles[username].data = {};
    PROFILE_KEYS.forEach(k => {
        const v = localStorage.getItem(k);
        if(v !== null) profiles[username].data[k] = v;
    });
    saveProfiles(profiles);
}

function loadProfileData(username){
    const profiles = getProfiles();
    const profile = profiles[username];
    if(!profile) return;
    PROFILE_KEYS.forEach(k => localStorage.removeItem(k));
    Object.entries(profile.data || {}).forEach(([k, v]) => localStorage.setItem(k, v));
}

function renderProfileList(){
    const profiles = getProfiles();
    const list = document.getElementById("profileList");
    const names = Object.keys(profiles);
    if(names.length === 0){
        list.innerHTML = '<div style="font-size:13px;color:#7b5ea7;font-style:italic;padding:8px;">No profiles yet — create one below!</div>';
        return;
    }
    list.innerHTML = names.map(n => {
        const p = profiles[n];
        return `<div class="profile-card" onclick="attemptLogin('${n.replace(/'/g, "\\'")}')">
            <div class="profile-card-avatar">${p.avatar}</div>
            <div class="profile-card-info">
                <div class="profile-card-name">${n}</div>
                <div class="profile-card-meta">Joined ${p.joinDate}</div>
            </div>
            ${p.password ? '<div class="profile-card-lock">🔒</div>' : ''}
        </div>`;
    }).join("");
}

function showWelcomeScreen(){
    document.getElementById("welcomeOverlay").classList.add("show");
    document.getElementById("profileBtn").classList.remove("show");
    renderProfileList();
}

function hideWelcomeScreen(){
    document.getElementById("welcomeOverlay").classList.remove("show");
}

function openSignup(){
    document.getElementById("signupOverlay").classList.add("show");
    const grid = document.getElementById("avatarGrid");
    grid.innerHTML = AVATAR_CHOICES.map((a, i) =>
        `<div class="avatar-option ${i === 0 ? 'selected' : ''}" data-avatar="${a}" onclick="selectAvatar(this)">${a}</div>`
    ).join("");
    document.getElementById("signupName").value = "";
    document.getElementById("signupPass").value = "";
}

function closeSignup(){ document.getElementById("signupOverlay").classList.remove("show"); }

function selectAvatar(el){
    document.querySelectorAll(".avatar-option").forEach(o => o.classList.remove("selected"));
    el.classList.add("selected");
}

function createProfile(){
    const name = document.getElementById("signupName").value.trim();
    const pass = document.getElementById("signupPass").value;
    const sel  = document.querySelector(".avatar-option.selected");
    if(!name){ alert("Please enter a name!"); return; }
    if(!pass){ alert("A password is required!"); return; }
    const profiles = getProfiles();
    if(profiles[name]){ alert("That name is taken — try another!"); return; }
    const today = new Date().toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
    profiles[name] = {
        avatar:   sel ? sel.dataset.avatar : "🐸",
        password: pass,
        joinDate: today,
        data:     {}
    };
    saveProfiles(profiles);
    closeSignup();
    attemptLogin(name);
}

let pendingLoginUser = null;

function attemptLogin(username){
    const profiles = getProfiles();
    const profile = profiles[username];
    if(!profile) return;
    if(profile.password){
        pendingLoginUser = username;
        document.getElementById("loginTitle").textContent = `🔒 Enter password for ${username}`;
        document.getElementById("loginPass").value = "";
        document.getElementById("loginError").textContent = "";
        document.getElementById("loginOverlay").classList.add("show");
    } else {
        doLogin(username);
    }
}

function closeLogin(){ document.getElementById("loginOverlay").classList.remove("show"); }

function confirmLogin(){
    const profiles = getProfiles();
    const pass = document.getElementById("loginPass").value;
    const profile = profiles[pendingLoginUser];
    if(!profile){ closeLogin(); return; }
    if(pass !== profile.password){
        document.getElementById("loginError").textContent = "Wrong password — try again!";
        return;
    }
    closeLogin();
    doLogin(pendingLoginUser);
}

function doLogin(username){
    const prev = getActiveUser();
    if(prev && prev !== username) snapshotToProfile(prev);
    loadProfileData(username);
    localStorage.setItem("pf_activeUser", username);
    location.reload();
}

function logoutProfile(){
    const user = getActiveUser();
    if(!user) return;
    const profiles = getProfiles();
    const profile = profiles[user];
    if(!profile) return;

    // Legacy: profile without a password — make them set one first
    if(!profile.password){
        const newPass = prompt(`⚠️ Your profile has no password!\nSet one now so you can log back in:`);
        if(!newPass || !newPass.trim()) return;
        profile.password = newPass.trim();
        saveProfiles(profiles);
    }

    // Confirm with password
    const entered = prompt(`Enter password for ${user} to log out:`);
    if(entered === null) return;
    if(entered !== profile.password){
        alert("Wrong password! Cannot log out.");
        return;
    }

    snapshotToProfile(user);
    localStorage.removeItem("pf_activeUser");
    PROFILE_KEYS.forEach(k => localStorage.removeItem(k));
    location.reload();
}

function openProfile(){
    document.getElementById("profileOverlay").classList.add("show");
    renderProfileModal();
}

function closeProfile(){ document.getElementById("profileOverlay").classList.remove("show"); }

function renderProfileModal(){
    const user = getActiveUser();
    if(!user) return;
    const profiles = getProfiles();
    const profile = profiles[user];
    if(!profile) return;
    document.getElementById("profileBigAvatar").textContent = profile.avatar;
    document.getElementById("profileName").textContent = user;
    document.getElementById("profileSince").textContent = `Member since ${profile.joinDate}`;
    const hrs  = Math.floor(totalFocusMinutes / 60);
    const mins = totalFocusMinutes % 60;
    const focusStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
    document.getElementById("profileStats").innerHTML = `
        <div class="stats-row"><span>💛 Coins</span><b>${pondCoins}</b></div>
        <div class="stats-row"><span>🐸 Critters</span><b>${pondFrogs}</b></div>
        <div class="stats-row"><span>🔥 Current streak</span><b>${currentStreak} day${currentStreak === 1 ? "" : "s"}</b></div>
        <div class="stats-row"><span>⏱️ Focus time</span><b>${focusStr}</b></div>
        <div class="stats-row"><span>🏆 Achievements</span><b>${unlockedAchievements.length}/${ACHIEVEMENTS.length}</b></div>
    `;
}

function changeAvatar(){
    const user = getActiveUser();
    if(!user) return;
    const profiles = getProfiles();
    const current  = profiles[user].avatar;
    const choices  = AVATAR_CHOICES.join(" ");
    const newAv = prompt(`Pick a new avatar! Type one of these:\n\n${choices}`, current);
    if(newAv && AVATAR_CHOICES.includes(newAv.trim())){
        profiles[user].avatar = newAv.trim();
        saveProfiles(profiles);
        document.getElementById("profileBtnAvatar").textContent = newAv.trim();
        renderProfileModal();
    }
}

function showProfileButton(){
    const user = getActiveUser();
    if(!user) return;
    const profile = getProfiles()[user];
    if(!profile) return;
    const btn = document.getElementById("profileBtn");
    btn.classList.add("show");
    document.getElementById("profileBtnAvatar").textContent = profile.avatar;
    document.getElementById("profileBtnName").textContent = user;
}

// Auto-snapshot every 30s so unsaved progress doesn't get lost
setInterval(() => {
    const user = getActiveUser();
    if(user) snapshotToProfile(user);
}, 30000);

// Final save on close
window.addEventListener("beforeunload", () => {
    const user = getActiveUser();
    if(user) snapshotToProfile(user);
});

/* QUOTES, NAMES, STREAK, STATS, ACHIEVEMENTS */
const QUOTES = [
    "🌸 You can do hard things — one tiny step at a time.",
    "✨ Small progress is still progress!",
    "🐸 Be like a frog — patient, calm, and ready to leap.",
    "💗 Done is better than perfect.",
    "🌷 Slow and steady wins the race.",
    "🪷 Bloom where you are planted.",
    "🌟 Believe in yourself — your future self is cheering you on.",
    "☀️ A focused mind is a peaceful mind.",
    "🍀 Tiny habits build a beautiful life.",
    "🌙 Rest is part of the work.",
    "🦋 You are growing, even when it doesn't feel like it.",
    "💫 Be gentle with yourself — you're doing your best.",
    "🌻 Today is a good day to try.",
    "🎀 Hard work + a little fun = magic.",
    "🍓 You're stronger than you think!",
    "🐻‍❄️ Take a deep breath. You've got this.",
    "❄️ Calm mind, kind heart, strong work.",
    "🌈 Every pomodoro is a step closer to your dreams.",
    "🌼 Don't compare yourself to others — bloom on your own time.",
    "🪐 Even the moon goes through phases.",
    "🌊 Let things flow. You don't have to force it.",
    "💌 Your effort matters — even when no one sees it.",
    "🎶 Make today a little softer than yesterday.",
    "🦄 You're capable of magical things.",
    "🌳 Roots take time. Keep growing.",
    "💎 You're rare and worth the effort.",
    "🍂 It's okay to slow down sometimes.",
    "🌷 Be the energy you want to attract.",
    "🐝 Stay focused — bloom like flowers, work like bees.",
    "🌱 Tiny seeds become forests."
];

function showQuoteOfDay(){
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    document.getElementById("quoteBanner").textContent = QUOTES[dayOfYear % QUOTES.length];
}

/* NAMES */
let frogNames = JSON.parse(localStorage.getItem("frogNames") || '{"frog":"Lilypad","bear":"Snowball"}');

function getCreatureName(){
    return frogNames[currentTheme] || (currentTheme === "bear" ? "Snowball" : "Lilypad");
}

function renameCreature(){
    const newName = prompt(`What's your ${currentTheme === "bear" ? "bear" : "frog"}'s new name?`, getCreatureName());
    if(newName && newName.trim()){
        frogNames[currentTheme] = newName.trim().slice(0, 20);
        localStorage.setItem("frogNames", JSON.stringify(frogNames));
        applyTheme(currentTheme);
    }
}

/* STREAK + DAILY LOGIN */
let lastLoginDate = localStorage.getItem("lastLoginDate") || "";
let currentStreak = parseInt(localStorage.getItem("currentStreak") || "0");
let bestStreak   = parseInt(localStorage.getItem("bestStreak")   || "0");

function todayKey(){
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
}

function checkDailyLogin(){
    const today = todayKey();
    if(today === lastLoginDate){
        document.getElementById("streakCount").textContent = currentStreak;
        return;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.getFullYear() + "-" + (yesterday.getMonth()+1) + "-" + yesterday.getDate();

    if(lastLoginDate === yKey) currentStreak++;
    else                       currentStreak = 1;

    if(currentStreak > bestStreak) bestStreak = currentStreak;

    pondCoins++;
    lastLoginDate = today;

    localStorage.setItem("currentStreak", currentStreak);
    localStorage.setItem("bestStreak",    bestStreak);
    localStorage.setItem("pondCoins",     pondCoins);
    localStorage.setItem("lastLoginDate", today);

    document.getElementById("streakCount").textContent = currentStreak;
    updateCoinDisplay(true);
    showDailyToast(`🔥 ${currentStreak} day streak!`, `Daily login bonus: +1 💛`);
    checkAchievements();
}

function showDailyToast(title, sub){
    const toast = document.createElement("div");
    toast.className = "daily-toast";
    toast.innerHTML = `
        <div class="daily-toast-title">${title}</div>
        <div class="daily-toast-sub">${sub}</div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => toast.classList.remove("show"), 3500);
    setTimeout(() => toast.remove(), 4000);
}

/* LIFETIME STATS */
let totalFocusMinutes    = parseInt(localStorage.getItem("totalFocusMinutes")    || "0");
let totalPomodoros       = parseInt(localStorage.getItem("totalPomodoros")       || "0");
let totalFrogsCollected  = parseInt(localStorage.getItem("totalFrogsCollected")  || "0");

function recordPomodoro(){
    totalPomodoros++;
    totalFocusMinutes += 25;
    totalFrogsCollected++;
    localStorage.setItem("totalPomodoros",      totalPomodoros);
    localStorage.setItem("totalFocusMinutes",   totalFocusMinutes);
    localStorage.setItem("totalFrogsCollected", totalFrogsCollected);
    checkAchievements();
}

/* ACHIEVEMENTS */
const ACHIEVEMENTS = [
    { id: "first-pomo",    icon: "🎉", name: "First Pomodoro!",       desc: "Complete your very first 25-min pomodoro" },
    { id: "ten-pomos",     icon: "🌟", name: "Tenacious",             desc: "Complete 10 pomodoros" },
    { id: "fifty-pomos",   icon: "💯", name: "Half-century",          desc: "Complete 50 pomodoros" },
    { id: "hundred-pomos", icon: "🏆", name: "Pomodoro Pro",          desc: "Complete 100 pomodoros" },
    { id: "pond-master",   icon: "👑", name: "Pond Master",           desc: "Collect 100 frogs in your pond" },
    { id: "three-streak",  icon: "✨", name: "Three Days Strong",     desc: "3-day login streak" },
    { id: "week-streak",   icon: "🔥", name: "Week Warrior",          desc: "7-day login streak" },
    { id: "month-streak",  icon: "🌙", name: "Month-long Champion",   desc: "30-day login streak" },
    { id: "coin-collector",icon: "💰", name: "Coin Collector",        desc: "Have 25 coins at once" },
    { id: "music-lover",   icon: "🎶", name: "Music Lover",           desc: "Own any song" }
];

let unlockedAchievements = JSON.parse(localStorage.getItem("unlockedAchievements") || "[]");

function unlock(id){ return !unlockedAchievements.includes(id); }

function checkAchievements(){
    const queue = [];
    if(unlock("first-pomo")    && totalPomodoros      >= 1)   queue.push("first-pomo");
    if(unlock("ten-pomos")     && totalPomodoros      >= 10)  queue.push("ten-pomos");
    if(unlock("fifty-pomos")   && totalPomodoros      >= 50)  queue.push("fifty-pomos");
    if(unlock("hundred-pomos") && totalPomodoros      >= 100) queue.push("hundred-pomos");
    if(unlock("pond-master")   && pondFrogs           >= 100) queue.push("pond-master");
    if(unlock("three-streak")  && currentStreak       >= 3)   queue.push("three-streak");
    if(unlock("week-streak")   && currentStreak       >= 7)   queue.push("week-streak");
    if(unlock("month-streak")  && currentStreak       >= 30)  queue.push("month-streak");
    if(unlock("coin-collector")&& pondCoins           >= 25)  queue.push("coin-collector");
    if(unlock("music-lover")   && ownedSongs.length   >= 1)   queue.push("music-lover");

    queue.forEach((id, i) => {
        unlockedAchievements.push(id);
        setTimeout(() => showAchievementToast(ACHIEVEMENTS.find(a => a.id === id)), i * 4200);
    });
    if(queue.length) localStorage.setItem("unlockedAchievements", JSON.stringify(unlockedAchievements));
}

function showAchievementToast(ach){
    const toast = document.createElement("div");
    toast.className = "ach-toast";
    toast.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-name">Achievement Unlocked!</div>
        <div class="ach-desc"><b>${ach.name}</b> — ${ach.desc}</div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => toast.classList.remove("show"), 3800);
    setTimeout(() => toast.remove(), 4300);
}

/* STATS MODAL */
function openStats(){
    document.getElementById("statsOverlay").classList.add("show");
    renderStats();
}
function closeStats(){ document.getElementById("statsOverlay").classList.remove("show"); }

function renderStats(){
    const hrs = Math.floor(totalFocusMinutes / 60);
    const mins = totalFocusMinutes % 60;
    const focusStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;

    const unlocked = unlockedAchievements.length;
    const total = ACHIEVEMENTS.length;

    const badges = ACHIEVEMENTS.map(a => {
        const isUnlocked = unlockedAchievements.includes(a.id);
        return `<div class="ach-badge ${isUnlocked ? "unlocked" : ""}" title="${isUnlocked ? a.name + ' — ' + a.desc : '🔒 Locked: ' + a.desc}">${isUnlocked ? a.icon : "🔒"}</div>`;
    }).join("");

    document.getElementById("statsContent").innerHTML = `
        <div class="stats-card">
            <h4>🔥 STREAK</h4>
            <div class="stats-row"><span>Current streak</span><b>${currentStreak} day${currentStreak === 1 ? "" : "s"}</b></div>
            <div class="stats-row"><span>Best ever</span><b>${bestStreak} day${bestStreak === 1 ? "" : "s"}</b></div>
        </div>
        <div class="stats-card">
            <h4>⏱️ FOCUS</h4>
            <div class="stats-row"><span>Total focus time</span><b>${focusStr}</b></div>
            <div class="stats-row"><span>Pomodoros completed</span><b>${totalPomodoros}</b></div>
            <div class="stats-row"><span>Frogs/bears collected</span><b>${totalFrogsCollected}</b></div>
        </div>
        <div class="stats-card">
            <h4>🏆 ACHIEVEMENTS · ${unlocked}/${total}</h4>
            <div class="ach-grid">${badges}</div>
        </div>
    `;
}

/* THEME SYSTEM */
const THEMES = {
    frog: {
        name: "Pomofrog",
        mainEmoji: "🐸",
        learnBtnIcon: "🐸",
        learnBtnText: "Learn About the Frog",
        learnTitle: "🪷 Meet Lilypad 🪷",
        flappyBtnText: "Flappy Frog",
        flappyTitle: "🐸 Flappy Frog 🐸",
        flappyCreature: "🐸",
        pondTitle: "🪷 Your Pond 🪷",
        pondCountEmoji: "🐸",
        pondCountWord: "frogs in your pond!",
        pondHint: "5 frogs = 1 coin 💛 · Complete a Pomodoro to add a frog!",
        pondCreature: "🐸",
        pondDecorations: [
            { top: "22%", left: "30%", emoji: "🪷" },
            { top: "50%", left: "72%", emoji: "🌸", delay: 0.5 },
            { top: "78%", left: "42%", emoji: "🪷", delay: 1 },
            { top: "38%", left: "55%", emoji: "🌸", delay: 1.5, size: "20px" }
        ],
        cashLabel: "Cash Out Your Frogs!",
        flyEmoji: "🪰",
        defaultBg: "background.png",
        signText: "Pomofrog",
        signHeart: "💗",
        switchIcon: "🐻‍❄️",
        welcomeBig: "WELCOME TO POMOFROG!",
        welcomeSub: "you can switch anytime",
        todoTitle: "✨ Froggy To-Do ✨",
        todoSparkle: "✨",
        pondBtnIcon: "🪷",
        pondBtnText: "Check Your Pond",
        adjustIcon: "🪷",
        keypadTitle: "🪷 Set Your Time 🪷",
        keypadSetText: "Set Timer 🌸",
        adminTitle: "✨ Aliya's Remote ✨",
        adminFrogLabel: "🐸 Frogs",
        adminPresetFrog: "+5 🐸",
        adminFlyBtn: "🪰 Activate the Fly",
        pageTitle: "Froggy Pomodoro",
        catchFlyBtnHTML: '🪰 Catch the Fly<span>Click flies fast to score!</span>',
        catchFlyTitle: "🪰 Catch the Fly 🪰",
        catchFlyEndMsg: (n) => `🎉 You caught ${n} flies! 🎉`,
        memoryBtnHTML: '🧠 Memory Match<span>Match pairs of cute frog cards</span>',
        tapMessages: [
            "Ribbit! I could do well with a few flies... 🪰",
            "RIBBIT! Keep working while I catch some flies <em>*stomach rumbles*</em> 😋",
            "Psst — try <b>Flappy Frog</b>! Grab ⭐ for 2× points and 🛡️ for shield!",
            "Check your <b>Pond</b> 🪷 — click a frog to make it hop, click the water for ripples!",
            "Every pomodoro grows a flower 🌷 in your garden! Come check it out!",
            "Play <b>Memory Match</b> 🧠 or <b>Catch the Fly</b> 🪰 in Mini Games!",
            "Unlock <b>achievements</b> 🏆 by focusing more — tap 📊 to see your stats!",
            "🔥 Log in every day for a streak bonus — 1 free coin per day!",
            "Read a <b>daily quote</b> ✨ up top to stay inspired!"
        ]
    },
    bear: {
        name: "Pomobear",
        mainEmoji: "🐻‍❄️",
        learnBtnIcon: "🐻‍❄️",
        learnBtnText: "Learn About the Bear",
        learnTitle: "❄️ Meet Snowball ❄️",
        flappyBtnText: "Flappy Bear",
        flappyTitle: "🐻‍❄️ Flappy Bear 🐻‍❄️",
        flappyCreature: "🐻‍❄️",
        pondTitle: "❄️ Your Snowy Den ❄️",
        pondCountEmoji: "🐻‍❄️",
        pondCountWord: "bears in the snow!",
        pondHint: "5 bears = 1 coin 💛 · Complete a Pomodoro to add a bear!",
        pondCreature: "🐻‍❄️",
        pondDecorations: [
            { top: "22%", left: "30%", emoji: "❄️" },
            { top: "50%", left: "72%", emoji: "🧸", delay: 0.5 },
            { top: "78%", left: "42%", emoji: "❄️", delay: 1 },
            { top: "38%", left: "55%", emoji: "❄️", delay: 1.5, size: "20px" }
        ],
        cashLabel: "Cash Out Your Bears!",
        flyEmoji: "❄️",
        defaultBg: "bg-bear-theme.png",
        signText: "Pomobear",
        signHeart: "🧸",
        switchIcon: "🐸",
        welcomeBig: "WELCOME TO POMOBEAR!",
        welcomeSub: "you can switch anytime",
        todoTitle: "❄️ Bear To-Do ❄️",
        todoSparkle: "❄️",
        pondBtnIcon: "❄️",
        pondBtnText: "Check Your Den",
        adjustIcon: "🧸",
        keypadTitle: "❄️ Set Your Time ❄️",
        keypadSetText: "Set Timer ❄️",
        adminTitle: "❄️ Aliya's Remote ❄️",
        adminFrogLabel: "🐻‍❄️ Bears",
        adminPresetFrog: "+5 🐻‍❄️",
        adminFlyBtn: "❄️ Spawn Snowflake",
        pageTitle: "Bear Pomodoro",
        catchFlyBtnHTML: '❄️ Catch the Snowflake<span>Click snowflakes fast to score!</span>',
        catchFlyTitle: "❄️ Catch the Snowflake ❄️",
        catchFlyEndMsg: (n) => `🎉 You caught ${n} snowflakes! 🎉`,
        memoryBtnHTML: '🧠 Memory Match<span>Match pairs of cute bear cards</span>',
        tapMessages: [
            "Brr! I could really go for some salmon... 🐟",
            "GROAR! Keep working while I find some fish <em>*stomach rumbles*</em> 😋",
            "Psst — try <b>Flappy Bear</b>! Grab ⭐ for 2× points and 🛡️ for shield!",
            "Check your <b>Snowy Den</b> ❄️ — click a bear to make it hop, click the ice for ripples!",
            "Every pomodoro grows a snowflake ❄️ in your garden! Come check it out!",
            "Play <b>Memory Match</b> 🧠 or <b>Catch the Snowflake</b> ❄️ in Mini Games!",
            "Unlock <b>achievements</b> 🏆 by focusing more — tap 📊 to see your stats!",
            "🔥 Log in every day for a streak bonus — 1 free coin per day!",
            "Read a <b>daily quote</b> ✨ up top to stay inspired!"
        ]
    }
};

const LEARN_CONTENT = {
    frog: `
        <p>Meet <b>Lilypad the Frog</b> 🐸, your cheerful study buddy in <b>Pomofrog™</b>!</p>

        <h3>⏱️ Timer Modes</h3>
        <ul class="learn-list">
            <li><b>Pomodoro (25 min)</b> – stay focused! Only this mode grows your pond.</li>
            <li><b>Short Break (5 min)</b> – stretch and recharge.</li>
            <li><b>Long Break (15 min)</b> – snack, bathroom, or relax.</li>
            <li>💗 <b>Heart</b> – quick 5-second timer.</li>
            <li>🪷 <b>Lotus</b> – pick your own custom minutes.</li>
        </ul>

        <h3>📝 Froggy To-Do</h3>
        <p>Add tasks, check them off, and use <b>🧹 Clear Finished</b> to tidy up.</p>

        <h3>🎮 Flappy Frog + Power-ups!</h3>
        <p>Tap or press <b>Space</b> to flap between pipes. Grab shiny power-ups floating in the sky:</p>
        <ul class="learn-list">
            <li>⭐ <b>Star</b> – DOUBLE POINTS for 5 seconds!</li>
            <li>🛡️ <b>Shield</b> – invincibility, crash through pipes for 3 seconds!</li>
        </ul>
        <p>Your best score is saved forever as your 🏆 <b>High Score</b>!</p>

        <h3>🎮 Mini Games</h3>
        <ul class="learn-list">
            <li>🧠 <b>Memory Match</b> – flip cute frog cards to find matching pairs. Fewer moves = better!</li>
            <li>🪰 <b>Catch the Fly</b> – click flies as fast as you can in 30 seconds. Race your own best!</li>
        </ul>

        <h3>🪷 Interactive Pond</h3>
        <ul class="learn-list">
            <li>👆 <b>Click a frog</b> in your pond — it hops for you!</li>
            <li>💧 <b>Click the water</b> — a pretty ripple appears!</li>
            <li>🌷 Every pomodoro also plants a <b>flower in your garden</b> — watch it grow over time!</li>
        </ul>

        <h3>🐸 Grow Your Pond + Cash Out</h3>
        <p>Every 25-min Pomodoro adds a frog 🐸 and a flower 🌷 to your pond. Tap <b>Cash Out Your Frogs</b> — every <b>5 frogs = 1 coin</b> 💛! Spend coins in the <b>Music 🎵</b> and <b>Background 🖼️</b> shops.</p>

        <h3>🏆 Achievements + Stats</h3>
        <p>Tap 📊 up top to see your stats! Earn <b>10 achievements</b> like:</p>
        <ul class="learn-list">
            <li>🎉 <b>First Pomodoro</b> – complete your very first one</li>
            <li>🌟 <b>Tenacious</b> – 10 pomodoros / 💯 <b>Half-century</b> – 50 / 🏆 <b>Pro</b> – 100</li>
            <li>👑 <b>Pond Master</b> – 100 frogs in your pond</li>
            <li>✨ <b>Three Days Strong</b>, 🔥 <b>Week Warrior</b>, 🌙 <b>Month-long Champion</b> – login streaks!</li>
            <li>💰 <b>Coin Collector</b> – 25 coins at once</li>
            <li>🎶 <b>Music Lover</b> – own any song</li>
        </ul>

        <h3>🔥 Daily Streak + Bonus</h3>
        <p>Log in every day for a <b>+1 coin bonus</b> and a growing streak counter 🔥 (top-right). Miss a day and it resets!</p>

        <h3>✨ Daily Quote</h3>
        <p>Every day, a new inspirational quote appears at the top of the app to keep you cozy and motivated!</p>

        <h3>👤 Your Profile</h3>
        <p>Multiple people can share Pomofrog with their own profile (avatar + password). Your frogs, coins, songs, streak, and scores are saved separately per profile!</p>

        <p class="learn-outro">Have fun collecting frogs, catching flies, growing flowers, and earning coins with <b>Pomofrog™</b>! 💗🐸🌸</p>
    `,
    bear: `
        <p>Meet <b>Snowball the Polar Bear</b> 🐻‍❄️, your cozy study buddy in <b>Pomobear™</b>!</p>

        <h3>⏱️ Timer Modes</h3>
        <ul class="learn-list">
            <li><b>Pomodoro (25 min)</b> – stay focused! Only this mode grows your snowy den.</li>
            <li><b>Short Break (5 min)</b> – stretch and recharge.</li>
            <li><b>Long Break (15 min)</b> – snack, bathroom, or hibernate.</li>
            <li>💗 <b>Heart</b> – quick 5-second timer.</li>
            <li>🧸 <b>Lotus</b> – pick your own custom minutes.</li>
        </ul>

        <h3>📝 Bear's To-Do</h3>
        <p>Add tasks, check them off, and use <b>🧹 Clear Finished</b> to tidy up.</p>

        <h3>🎮 Flappy Bear + Power-ups!</h3>
        <p>Tap or press <b>Space</b> to flap between pipes. Grab shiny power-ups floating in the sky:</p>
        <ul class="learn-list">
            <li>⭐ <b>Star</b> – DOUBLE POINTS for 5 seconds!</li>
            <li>🛡️ <b>Shield</b> – invincibility, crash through pipes for 3 seconds!</li>
        </ul>
        <p>Your best score is saved forever as your 🏆 <b>High Score</b>!</p>

        <h3>🎮 Mini Games</h3>
        <ul class="learn-list">
            <li>🧠 <b>Memory Match</b> – flip cute bear cards to find matching pairs. Fewer moves = better!</li>
            <li>❄️ <b>Catch the Snowflake</b> – click snowflakes as fast as you can in 30 seconds. Race your own best!</li>
        </ul>

        <h3>❄️ Interactive Snowy Den</h3>
        <ul class="learn-list">
            <li>👆 <b>Click a bear</b> in your den — it hops for you!</li>
            <li>💧 <b>Click the ice</b> — a pretty ripple appears!</li>
            <li>❄️ Every pomodoro also plants a <b>snowflake in your garden</b> — watch it grow over time!</li>
        </ul>

        <h3>🐻‍❄️ Grow Your Den + Cash Out</h3>
        <p>Every 25-min Pomodoro adds a bear 🐻‍❄️ and a snowflake ❄️ to your den. Tap <b>Cash Out Your Bears</b> — every <b>5 bears = 1 coin</b> 💛! Spend coins in the <b>Music 🎵</b> and <b>Background 🖼️</b> shops.</p>

        <h3>🏆 Achievements + Stats</h3>
        <p>Tap 📊 up top to see your stats! Earn <b>10 achievements</b> like:</p>
        <ul class="learn-list">
            <li>🎉 <b>First Pomodoro</b> – complete your very first one</li>
            <li>🌟 <b>Tenacious</b> – 10 pomodoros / 💯 <b>Half-century</b> – 50 / 🏆 <b>Pro</b> – 100</li>
            <li>👑 <b>Den Master</b> – 100 bears in your den</li>
            <li>✨ <b>Three Days Strong</b>, 🔥 <b>Week Warrior</b>, 🌙 <b>Month-long Champion</b> – login streaks!</li>
            <li>💰 <b>Coin Collector</b> – 25 coins at once</li>
            <li>🎶 <b>Music Lover</b> – own any song</li>
        </ul>

        <h3>🔥 Daily Streak + Bonus</h3>
        <p>Log in every day for a <b>+1 coin bonus</b> and a growing streak counter 🔥 (top-right). Miss a day and it resets!</p>

        <h3>✨ Daily Quote</h3>
        <p>Every day, a new inspirational quote appears at the top of the app to keep you cozy and motivated!</p>

        <h3>👤 Your Profile</h3>
        <p>Multiple people can share Pomobear with their own profile (avatar + password). Your bears, coins, songs, streak, and scores are saved separately per profile!</p>

        <p class="learn-outro">Have fun collecting bears, catching snowflakes, growing frost flowers, and earning coins with <b>Pomobear™</b>! 💙🐻‍❄️❄️</p>
    `
};

let currentTheme = localStorage.getItem("currentTheme") || "frog";

function getTheme(){ return THEMES[currentTheme]; }

function applyTheme(themeId){
    const theme = THEMES[themeId];
    if(!theme) return;
    currentTheme = themeId;
    localStorage.setItem("currentTheme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);

    // Main creature emoji (preserve speech bubble child)
    const mainFrog = document.querySelector(".container > .frog");
    if(mainFrog){
        mainFrog.firstChild.textContent = "\n        " + theme.mainEmoji + "\n        ";
    }

    // Sidebar buttons
    const learnBtn = document.querySelector(".learn-btn");
    if(learnBtn){
        learnBtn.querySelector(".learn-frog").textContent = theme.learnBtnIcon;
        learnBtn.querySelectorAll("span")[1].textContent = theme.learnBtnText;
    }
    const flappyBtn = document.querySelector(".flappy-btn");
    if(flappyBtn){
        flappyBtn.querySelector(".flappy-frog").textContent = theme.mainEmoji;
        flappyBtn.querySelectorAll("span")[1].textContent = theme.flappyBtnText;
    }
    const themeBtn = document.querySelector(".theme-btn");
    if(themeBtn){
        themeBtn.querySelector(".theme-icon").textContent = theme.switchIcon;
    }

    // Learn modal
    const creatureNameEl = document.getElementById("creatureName");
    if(creatureNameEl) creatureNameEl.textContent = getCreatureName();
    const learnText = document.querySelector(".learn-text");
    if(learnText){
        const name = getCreatureName();
        learnText.innerHTML = LEARN_CONTENT[themeId]
            .replace(/Lilypad/g,  themeId === "frog" ? name : "Lilypad")
            .replace(/Snowball/g, themeId === "bear" ? name : "Snowball");
    }

    // Flappy modal title
    const flappyTitleEl = document.querySelector(".flappy-title");
    if(flappyTitleEl) flappyTitleEl.textContent = theme.flappyTitle;

    // Pond title + hint + button
    const pondTitle = document.querySelector(".pond-title");
    const pondHint = document.querySelector(".pond-hint");
    if(pondTitle) pondTitle.textContent = theme.pondTitle;
    if(pondHint) pondHint.innerHTML = theme.pondHint;
    const cashBtn = document.querySelector(".cash-btn");
    if(cashBtn) cashBtn.innerHTML = `💰 ${theme.cashLabel}`;
    const pondBtn = document.querySelector(".pond-btn");
    if(pondBtn){
        pondBtn.querySelector(".pond-icon").textContent = theme.pondBtnIcon;
        pondBtn.querySelectorAll("span")[1].textContent = theme.pondBtnText;
    }

    // Todo title + existing sparkles
    const todoTitle = document.querySelector(".todo-title");
    if(todoTitle) todoTitle.textContent = theme.todoTitle;
    document.querySelectorAll("#todoList .sparkle").forEach(s => s.textContent = theme.todoSparkle);

    // Adjust Timer button icon
    const lotusIcon = document.querySelector(".lotus-btn .lotus");
    if(lotusIcon) lotusIcon.textContent = theme.adjustIcon;

    // Keypad title + button
    const keypadTitle = document.querySelector(".keypad-title");
    if(keypadTitle) keypadTitle.textContent = theme.keypadTitle;
    const keypadSet = document.querySelector(".keypad-set");
    if(keypadSet) keypadSet.textContent = theme.keypadSetText;

    // Admin remote labels
    const adminTitle = document.querySelector(".admin-title");
    if(adminTitle) adminTitle.textContent = theme.adminTitle;
    const adminFrogLbl = document.getElementById("adminFrogLabel");
    if(adminFrogLbl) adminFrogLbl.textContent = theme.adminFrogLabel;
    const adminPresetBtn = document.getElementById("adminPresetFrogs");
    if(adminPresetBtn) adminPresetBtn.textContent = theme.adminPresetFrog;
    const adminFlyBtn = document.querySelector(".admin-fly-btn");
    if(adminFlyBtn) adminFlyBtn.textContent = theme.adminFlyBtn;

    // Mini-games menu labels
    const catchflyChoice = document.getElementById("catchflyGameChoice");
    if(catchflyChoice) catchflyChoice.innerHTML = theme.catchFlyBtnHTML;
    const memoryChoice = document.getElementById("memoryGameChoice");
    if(memoryChoice) memoryChoice.innerHTML = theme.memoryBtnHTML;
    const catchflyTitleEl = document.getElementById("catchflyTitle");
    if(catchflyTitleEl) catchflyTitleEl.textContent = theme.catchFlyTitle;

    // Page title
    document.title = theme.pageTitle;

    // Bottom sign
    const sign = document.querySelector(".pomofrog-sign");
    if(sign){
        const letters = theme.signText.split("");
        sign.innerHTML =
            `<span class="sign-heart">${theme.signHeart}</span>` +
            letters.map(l => `<span class="letter">${l}</span>`).join("") +
            `<span class="sign-heart">${theme.signHeart}</span>`;
    }

    // Background — apply the theme's saved active background
    activeBackground = themeActiveBgs[themeId] || (themeId === "bear" ? "bear-default" : "default");
    const bgObj = BACKGROUNDS.find(b => b.id === activeBackground);
    document.documentElement.style.setProperty("--bg-image", `url("${bgObj ? bgObj.file : theme.defaultBg}")`);

    // Re-render pond if open
    if(document.getElementById("pondOverlay")?.classList.contains("show")){
        renderPond();
    }
    // Update pond count emoji label even when closed
    const pondCountEl = document.querySelector(".pond-count");
    if(pondCountEl){
        pondCountEl.innerHTML = `${theme.pondCountEmoji} <span id="pondCount">${pondFrogs}</span> ${theme.pondCountWord}`;
    }
}

function showThemeWelcome(theme){
    const w = document.getElementById("themeWelcome");
    document.getElementById("themeWelcomeBig").textContent = theme.welcomeBig;
    document.getElementById("themeWelcomeSub").textContent = theme.welcomeSub;
    w.classList.add("show");
    setTimeout(() => w.classList.remove("show"), 2000);
}

function switchTheme(){
    const newTheme = currentTheme === "frog" ? "bear" : "frog";
    applyTheme(newTheme);
    showThemeWelcome(THEMES[newTheme]);
}

/* FROG TAP */
let frogTapCount = 0;
let frogSpeechTimer = null;

function frogTap(){
    const taps = getTheme().tapMessages;
    const bubble = document.getElementById("frogSpeech");
    bubble.innerHTML = taps[frogTapCount % taps.length];
    bubble.classList.add("show");
    frogTapCount++;

    clearTimeout(frogSpeechTimer);
    frogSpeechTimer = setTimeout(() => {
        bubble.classList.remove("show");
    }, 3000);
}

/* POND + COINS */
let pondFrogs = parseInt(localStorage.getItem("pondFrogs") || "0");
let pondCoins = parseInt(localStorage.getItem("pondCoins") || "0");

function updateCoinDisplay(animate){
    document.getElementById("coinCount").textContent = pondCoins;
    if(animate){
        const c = document.querySelector(".coin");
        c.classList.remove("coin-pop");
        void c.offsetWidth;
        c.classList.add("coin-pop");
    }
}

function openPond(){
    document.getElementById("pondOverlay").classList.add("show");
    renderPond();
}

function closePond(){
    document.getElementById("pondOverlay").classList.remove("show");
}

function addPondFrog(){
    pondFrogs++;
    localStorage.setItem("pondFrogs", pondFrogs);
}

function cashOutFrogs(){
    const earned = Math.floor(pondFrogs / 5);
    if(earned <= 0) return;
    pondFrogs -= earned * 5;
    pondCoins += earned;
    localStorage.setItem("pondFrogs", pondFrogs);
    localStorage.setItem("pondCoins", pondCoins);
    renderPond();
    updateCoinDisplay(true);
}

function playPondCroak(){
    if(!boopCtx){
        const AC = window.AudioContext || window.webkitAudioContext;
        boopCtx = new AC();
    }
    const ctx = boopCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const isBear = currentTheme === "bear";
    osc.type = "square";
    osc.frequency.setValueAtTime(isBear ? 250 : 180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isBear ? 200 : 130, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
}

function renderPond(){
    const theme = getTheme();
    document.getElementById("pondCount").textContent = pondFrogs;

    const pond = document.getElementById("pond");
    pond.innerHTML = theme.pondDecorations.map(d => {
        let style = `top:${d.top};left:${d.left};`;
        if(d.delay) style += `animation-delay:${d.delay}s;`;
        if(d.size)  style += `font-size:${d.size};`;
        return `<div class="pond-lotus" style="${style}">${d.emoji}</div>`;
    }).join("");

    // Water click → ripple
    pond.onclick = (e) => {
        if(e.target !== pond) return;
        const rect = pond.getBoundingClientRect();
        const ripple = document.createElement("div");
        ripple.className = "pond-ripple";
        ripple.style.left = (e.clientX - rect.left) + "px";
        ripple.style.top  = (e.clientY - rect.top)  + "px";
        pond.appendChild(ripple);
        setTimeout(() => ripple.remove(), 900);
    };

    const spots = [
        [22,55],[68,42],[45,70],[80,60],[18,75],[55,30],
        [38,85],[72,72],[28,45],[60,55],[88,40],[35,60],
        [50,80],[20,35],[78,82],[42,45],[65,28],[15,55]
    ];

    for(let i = 0; i < pondFrogs; i++){
        const frog = document.createElement("div");
        frog.className = "pond-frog";
        const [x, y] = spots[i % spots.length];
        const wrap = Math.floor(i / spots.length);
        frog.style.left = `${Math.min(92, Math.max(8, x + wrap * 4))}%`;
        frog.style.top  = `${Math.min(88, Math.max(20, y + wrap * 3))}%`;
        frog.style.animationDelay = (i * 0.2) + "s";
        frog.textContent = getTheme().pondCreature;
        frog.onclick = (e) => {
            e.stopPropagation();
            frog.classList.remove("jumping");
            void frog.offsetWidth;
            frog.classList.add("jumping");
        };
        pond.appendChild(frog);
    }

    renderGarden();
}

/* GARDEN */
const FLOWERS = ["🌷","🌸","🌺","🌻","🌼","🌹","💐","🪻"];
const BEAR_FLOWERS = ["❄️","🌨️","⭐","💠","🩵","🤍"];
let pondGarden = JSON.parse(localStorage.getItem("pondGarden") || "[]");

function addPondFlower(){
    const pool = currentTheme === "bear" ? BEAR_FLOWERS : FLOWERS;
    pondGarden.push(pool[Math.floor(Math.random() * pool.length)]);
    localStorage.setItem("pondGarden", JSON.stringify(pondGarden));
}

function renderGarden(){
    const plot = document.getElementById("gardenPlot");
    if(!plot) return;
    if(pondGarden.length === 0){
        plot.innerHTML = '<div class="garden-empty">Complete a Pomodoro to plant your first flower! 🌱</div>';
        return;
    }
    plot.innerHTML = pondGarden.map(f => `<span>${f}</span>`).join("");
}

/* LEARN ABOUT THE FROG */
function openLearn(){
    document.getElementById("learnOverlay").classList.add("show");
}

function closeLearn(){
    document.getElementById("learnOverlay").classList.remove("show");
}

/* MUSIC SHOP */
const SONGS = [
    { id: "marsh",   name: "The Marsh Song",            icon: "🪷", price: 1, file: "marsh-song.mp3",       theme: "frog" },
    { id: "arctic",  name: "Arctic Stillness",          icon: "❄️", price: 1, file: "arctic-stillness.mp3", theme: "bear" },
    { id: "lofi",    name: "Chill Lofi Jazz for Study", icon: "☕", price: 0, file: "chill-lofi-jazz.mp3", theme: "all" },
    { id: "slow808", name: "Slow 808 for Focus",        icon: "🎧", price: 3, file: "slow-808.mp3",         theme: "all" },
    { id: "calmhop", name: "Calm Hop for Concentration", icon: "🎵", price: 2, file: "calm-hop.mp3",         theme: "all" }
];

let ownedSongs = JSON.parse(localStorage.getItem("ownedSongs") || "[]");

function buySong(id){
    const s = SONGS.find(x => x.id === id);
    if(!s || pondCoins < s.price) return;
    pondCoins -= s.price;
    ownedSongs.push(id);
    localStorage.setItem("pondCoins", pondCoins);
    localStorage.setItem("ownedSongs", JSON.stringify(ownedSongs));
    updateCoinDisplay(true);
    renderMusicShop();
}

function playSong(id){
    openPlayer(id);
    closeMusic();
}

/* FLOATING MUSIC PLAYER */
const playerAudio = new Audio();
let isLooping = false;

function openPlayer(id){
    const s = SONGS.find(x => x.id === id);
    if(!s) return;

    document.getElementById("playerTitle").textContent = s.name;
    document.getElementById("playerIcon").textContent = s.icon;
    document.getElementById("playerError").style.display = "none";
    document.getElementById("playerBar").style.width = "0%";
    document.getElementById("playerTime").textContent = "0:00";

    playerAudio.src = s.file;
    playerAudio.loop = isLooping;
    playerAudio.currentTime = 0;
    const p = playerAudio.play();
    if(p && p.catch){
        p.catch(() => {
            document.getElementById("playerError").style.display = "block";
            document.getElementById("playerPlayBtn").textContent = "▶";
        });
    }

    document.getElementById("playerPlayBtn").textContent = "⏸";
    document.getElementById("musicPlayer").classList.add("show");
}

function closePlayer(){
    playerAudio.pause();
    playerAudio.currentTime = 0;
    playerAudio.loop = false;
    isLooping = false;
    const loopBtn = document.getElementById("playerLoopBtn");
    if(loopBtn) loopBtn.classList.remove("active");
    const playBtn = document.getElementById("playerPlayBtn");
    if(playBtn) playBtn.textContent = "▶";
    const bar = document.getElementById("playerBar");
    if(bar) bar.style.width = "0%";
    document.getElementById("musicPlayer").classList.remove("show");
}

function togglePlay(){
    if(playerAudio.paused){
        playerAudio.play();
        document.getElementById("playerPlayBtn").textContent = "⏸";
    } else {
        playerAudio.pause();
        document.getElementById("playerPlayBtn").textContent = "▶";
    }
}

function restartSong(){
    playerAudio.currentTime = 0;
    playerAudio.play();
    document.getElementById("playerPlayBtn").textContent = "⏸";
}

function toggleLoop(){
    isLooping = !isLooping;
    playerAudio.loop = isLooping;
    document.getElementById("playerLoopBtn").classList.toggle("active", isLooping);
}

playerAudio.addEventListener("timeupdate", () => {
    if(!playerAudio.duration) return;
    const pct = (playerAudio.currentTime / playerAudio.duration) * 100;
    document.getElementById("playerBar").style.width = pct + "%";
    const m = Math.floor(playerAudio.currentTime / 60);
    const s = Math.floor(playerAudio.currentTime % 60);
    document.getElementById("playerTime").textContent = `${m}:${String(s).padStart(2,'0')}`;
});

playerAudio.addEventListener("ended", () => {
    if(!isLooping){
        document.getElementById("playerPlayBtn").textContent = "▶";
        document.getElementById("playerBar").style.width = "0%";
    }
});

playerAudio.addEventListener("error", () => {
    document.getElementById("playerError").style.display = "block";
    document.getElementById("playerPlayBtn").textContent = "▶";
});

/* PLAYER DRAGGING */
let playerDragOffset = null;

function startPlayerDrag(clientX, clientY){
    const player = document.getElementById("musicPlayer");
    const rect = player.getBoundingClientRect();
    playerDragOffset = { x: clientX - rect.left, y: clientY - rect.top };
    player.style.right = "auto";
    player.style.bottom = "auto";
}

function movePlayerDrag(clientX, clientY){
    if(!playerDragOffset) return;
    const player = document.getElementById("musicPlayer");
    let x = clientX - playerDragOffset.x;
    let y = clientY - playerDragOffset.y;
    x = Math.max(0, Math.min(window.innerWidth  - player.offsetWidth,  x));
    y = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, y));
    player.style.left = x + "px";
    player.style.top  = y + "px";
}

function endPlayerDrag(){ playerDragOffset = null; }

document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("playerHeader");
    if(!header) return;

    header.addEventListener("mousedown", e => {
        if(e.target.classList.contains("player-close")) return;
        startPlayerDrag(e.clientX, e.clientY);
        e.preventDefault();
    });
    document.addEventListener("mousemove", e => movePlayerDrag(e.clientX, e.clientY));
    document.addEventListener("mouseup", endPlayerDrag);

    header.addEventListener("touchstart", e => {
        if(e.target.classList.contains("player-close")) return;
        const t = e.touches[0];
        startPlayerDrag(t.clientX, t.clientY);
    });
    document.addEventListener("touchmove", e => {
        if(!playerDragOffset) return;
        const t = e.touches[0];
        movePlayerDrag(t.clientX, t.clientY);
        e.preventDefault();
    }, { passive:false });
    document.addEventListener("touchend", endPlayerDrag);
});

function renderMusicShop(){
    const grid = document.getElementById("musicGrid");
    grid.innerHTML = "";
    SONGS.filter(s => s.theme === currentTheme || s.theme === "all").forEach(s => {
        const owned = ownedSongs.includes(s.id);

        const card = document.createElement("div");
        card.className = "music-card" + (owned ? " owned" : "");

        card.innerHTML = `
            <div class="music-thumb">${s.icon}</div>
            <div class="music-info">
                <div class="music-name">${s.name}</div>
                <div class="music-meta">${owned ? "Owned · plays on Suno 🎶" : (s.price === 0 ? "FREE · cozy study tune" : `${s.price} 💛 · cozy study tune`)}</div>
            </div>
        `;

        const action = document.createElement("button");
        action.className = "music-action";
        if(owned){
            action.classList.add("play");
            action.textContent = "▶ Play";
            action.onclick = () => playSong(s.id);
        } else if(s.price === 0){
            action.classList.add("apply");
            action.textContent = "🎁 Get Free!";
            action.onclick = () => buySong(s.id);
        } else {
            action.classList.add("buy");
            if(pondCoins < s.price) action.classList.add("disabled");
            action.innerHTML = `Buy · ${s.price} 💛`;
            action.onclick = () => buySong(s.id);
        }
        card.appendChild(action);

        grid.appendChild(card);
    });
}

function openMusic(){
    document.getElementById("musicOverlay").classList.add("show");
    renderMusicShop();
}

function closeMusic(){
    document.getElementById("musicOverlay").classList.remove("show");
}

/* BACKGROUND SHOP */
const BACKGROUNDS = [
    { id: "default",      name: "Lotus Pond",       file: "background.png",    price: 0, theme: "frog" },
    { id: "shop1",        name: "Hidden Waterfall", file: "bg-shop-1.png",     price: 1, theme: "frog" },
    { id: "shop2",        name: "Enchanted Forest", file: "bg-shop-2.png",     price: 2, theme: "frog" },
    { id: "shop3",        name: "Spring Meadow",    file: "bg-shop-3.png",     price: 3, theme: "frog" },
    { id: "shop4",        name: "Misty Marsh",      file: "bg-shop-4.png",     price: 4, theme: "frog" },
    { id: "bear-default", name: "Snowy Forest",     file: "bg-bear-theme.png", price: 0, theme: "bear" },
    { id: "bear1",        name: "Icy Sea",          file: "bg-bear-1.png",     price: 5, theme: "bear" },
    { id: "bear2",        name: "Northern Lights",  file: "bg-bear-2.png",     price: 6, theme: "bear" }
];

let ownedBackgrounds = JSON.parse(localStorage.getItem("ownedBackgrounds") || '["default","bear-default"]');
if(!ownedBackgrounds.includes("default")) ownedBackgrounds.push("default");
if(!ownedBackgrounds.includes("bear-default")) ownedBackgrounds.push("bear-default");
localStorage.setItem("ownedBackgrounds", JSON.stringify(ownedBackgrounds));

let themeActiveBgs = JSON.parse(localStorage.getItem("themeActiveBgs") || '{}');
if(!themeActiveBgs.frog) themeActiveBgs.frog = "default";
if(!themeActiveBgs.bear) themeActiveBgs.bear = "bear-default";
let activeBackground = themeActiveBgs[currentTheme];

function applyBackground(id){
    const bg = BACKGROUNDS.find(b => b.id === id);
    if(!bg) return;
    document.documentElement.style.setProperty("--bg-image", `url("${bg.file}")`);
    activeBackground = id;
    themeActiveBgs[currentTheme] = id;
    localStorage.setItem("themeActiveBgs", JSON.stringify(themeActiveBgs));
}

function buyBackground(id){
    const bg = BACKGROUNDS.find(b => b.id === id);
    if(!bg) return;
    if(pondCoins < bg.price) return;
    pondCoins -= bg.price;
    ownedBackgrounds.push(id);
    localStorage.setItem("pondCoins", pondCoins);
    localStorage.setItem("ownedBackgrounds", JSON.stringify(ownedBackgrounds));
    updateCoinDisplay(true);
    applyBackground(id);
    renderBgShop();
}

function renderBgShop(){
    const grid = document.getElementById("bgGrid");
    grid.innerHTML = "";
    BACKGROUNDS.filter(b => b.theme === currentTheme).forEach(bg => {
        const owned = ownedBackgrounds.includes(bg.id);
        const equipped = activeBackground === bg.id;

        const card = document.createElement("div");
        card.className = "bg-card" + (equipped ? " equipped" : "");

        const thumb = document.createElement("div");
        thumb.className = "bg-thumb";
        thumb.style.backgroundImage = `url("${bg.file}")`;
        card.appendChild(thumb);

        const name = document.createElement("div");
        name.className = "bg-name";
        name.textContent = bg.name;
        card.appendChild(name);

        const action = document.createElement("button");
        action.className = "bg-action";
        if(equipped){
            action.classList.add("equipped-tag");
            action.textContent = "✓ Equipped";
        } else if(owned){
            action.classList.add("apply");
            action.textContent = "Apply";
            action.onclick = () => { applyBackground(bg.id); renderBgShop(); };
        } else {
            action.classList.add("buy");
            if(pondCoins < bg.price) action.classList.add("disabled");
            action.innerHTML = `Buy · ${bg.price} 💛`;
            action.onclick = () => buyBackground(bg.id);
        }
        card.appendChild(action);

        grid.appendChild(card);
    });
}

function openBgShop(){
    document.getElementById("bgOverlay").classList.add("show");
    renderBgShop();
}

window.addEventListener("DOMContentLoaded", () => {
    if(!getActiveUser()){
        showWelcomeScreen();
        return;
    }
    showProfileButton();
    updateCoinDisplay(false);
    applyTheme(currentTheme);
    showQuoteOfDay();
    checkDailyLogin();
    if(localStorage.getItem("adminUnlocked") === "1") showAdminPanel();
});

/* SECRET ADMIN REMOTE */
const ADMIN_CODE = "aliya is boss";
let adminBuffer = "";

document.addEventListener("keydown", e => {
    if(e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const k = e.key.toLowerCase();
    if(k.length !== 1) return;
    adminBuffer = (adminBuffer + k).slice(-20);
    if(adminBuffer.endsWith(ADMIN_CODE)){
        localStorage.setItem("adminUnlocked", "1");
        showAdminPanel();
    }
});

function showAdminPanel(){
    document.getElementById("adminRemote").classList.add("show");
    updateAdminPanel();
}

function hideAdminPanel(){
    document.getElementById("adminRemote").classList.remove("show");
    localStorage.removeItem("adminUnlocked");
}

function updateAdminPanel(){
    const f = document.getElementById("adminFrogVal");
    const c = document.getElementById("adminCoinVal");
    if(f) f.textContent = pondFrogs;
    if(c) c.textContent = pondCoins;
}

function adminChange(type, delta){
    if(type === "frogs"){
        pondFrogs = Math.max(0, pondFrogs + delta);
        localStorage.setItem("pondFrogs", pondFrogs);
        if(document.getElementById("pondOverlay").classList.contains("show")){
            renderPond();
        }
    } else if(type === "coins"){
        pondCoins = Math.max(0, pondCoins + delta);
        localStorage.setItem("pondCoins", pondCoins);
        updateCoinDisplay(delta > 0);
    }
    updateAdminPanel();
}

function adminReset(){
    if(!confirm("Reset all frogs and coins to 0?")) return;
    pondFrogs = 0;
    pondCoins = 0;
    localStorage.setItem("pondFrogs", 0);
    localStorage.setItem("pondCoins", 0);
    updateCoinDisplay(false);
    updateAdminPanel();
    if(document.getElementById("pondOverlay").classList.contains("show")){
        renderPond();
    }
}

function closeBgShop(){
    document.getElementById("bgOverlay").classList.remove("show");
}

/* FLAPPY FROG GAME */
let flappyCanvas, flappyCtx;
let flappyState = "ready";
let flappyFrog = { x: 60, y: 200, vy: 0 };
let flappyPipes = [];
let flappyScore = 0;
let flappyHighScore = parseInt(localStorage.getItem("flappyHighScore") || "0");
let flappyFrame = 0;
let flappyAnimId;
let flappyFrozenByTimer = false;
let flappyPowerups = [];
let flappyActiveEffect = null;

const POWERUP_TYPES = [
    { type: "star",   emoji: "⭐",  duration: 300, color: "#ffe66d" },
    { type: "shield", emoji: "🛡️", duration: 180, color: "#a8dadc" }
];

const FLAPPY_GRAVITY = 0.30;
const FLAPPY_JUMP = -7;
const FLAPPY_PIPE_W = 50;
const FLAPPY_PIPE_GAP = 160;
const FLAPPY_PIPE_SPEED = 1.9;
const FLAPPY_PIPE_INTERVAL = 130;
const FLAPPY_W = 280;
const FLAPPY_H = 400;

function openFlappy(){
    document.getElementById("flappyOverlay").classList.add("show");
    if(!flappyCanvas){
        flappyCanvas = document.getElementById("flappyCanvas");
        const dpr = window.devicePixelRatio || 1;
        flappyCanvas.width  = FLAPPY_W * dpr;
        flappyCanvas.height = FLAPPY_H * dpr;
        flappyCanvas.style.width  = FLAPPY_W + "px";
        flappyCanvas.style.height = FLAPPY_H + "px";
        flappyCtx = flappyCanvas.getContext("2d");
        flappyCtx.scale(dpr, dpr);
        flappyCanvas.addEventListener("click", flappyJump);
    }
    document.getElementById("flappyHighScore").textContent = flappyHighScore;
    resetFlappy();
    cancelAnimationFrame(flappyAnimId);
    flappyLoop();
}

function closeFlappy(){
    document.getElementById("flappyOverlay").classList.remove("show");
    cancelAnimationFrame(flappyAnimId);
}

function resetFlappy(){
    flappyFrog = { x: 60, y: 200, vy: 0 };
    flappyPipes = [];
    flappyScore = 0;
    flappyFrame = 0;
    flappyState = "ready";
    flappyPowerups = [];
    flappyActiveEffect = null;
    document.getElementById("flappyScore").textContent = 0;
}

function spawnPowerup(){
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    const y = 80 + Math.random() * (FLAPPY_H - 160);
    flappyPowerups.push({ x: FLAPPY_W + 20, y, ...type });
}

function activatePowerup(p){
    flappyActiveEffect = { type: p.type, emoji: p.emoji, color: p.color, endFrame: flappyFrame + p.duration };
    playBoop();
}

let boopCtx = null;
// Soft pentatonic scale (always sounds pretty together) — C, D, E, G, A
const FLAP_NOTES = [523.25, 587.33, 659.25, 783.99, 880.00];
let flapNoteIdx = 0;

function playBoop(){
    if(!boopCtx){
        const AC = window.AudioContext || window.webkitAudioContext;
        boopCtx = new AC();
    }
    const ctx = boopCtx;
    const now = ctx.currentTime;
    const duration = 0.55;

    // --- Soft wind whoosh (filtered noise that sweeps) ---
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < bufferSize; i++){
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const wind = ctx.createBiquadFilter();
    wind.type = "bandpass";
    wind.Q.value = 1.2;
    wind.frequency.setValueAtTime(500, now);
    wind.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.45);
    wind.frequency.exponentialRampToValueAtTime(600, now + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.07, now + 0.12);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(wind).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    // --- Soft flower note (sine, pentatonic so each tap harmonises) ---
    const note = FLAP_NOTES[flapNoteIdx % FLAP_NOTES.length];
    flapNoteIdx++;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = note;

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.09, now + 0.08);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(oscGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
}

function flappyJump(){
    if(flappyFrozenByTimer) return;
    playBoop();
    if(flappyState === "gameover"){
        resetFlappy();
        flappyState = "playing";
        flappyFrog.vy = FLAPPY_JUMP;
        return;
    }
    if(flappyState === "ready"){
        flappyState = "playing";
    }
    flappyFrog.vy = FLAPPY_JUMP;
}

document.addEventListener("keydown", e => {
    if(e.code === "Space" && document.getElementById("flappyOverlay").classList.contains("show")){
        e.preventDefault();
        flappyJump();
    }
});

function triggerFlappyGameOver(){
    if(flappyState === "gameover") return;
    flappyState = "gameover";
    if(flappyScore > flappyHighScore){
        flappyHighScore = flappyScore;
        localStorage.setItem("flappyHighScore", flappyHighScore);
        const el = document.getElementById("flappyHighScore");
        el.textContent = flappyHighScore;
        el.parentElement.classList.add("new-best");
        setTimeout(() => el.parentElement.classList.remove("new-best"), 700);
    }
}

function spawnPipe(){
    const minTop = 40;
    const maxTop = FLAPPY_H - FLAPPY_PIPE_GAP - 40;
    const topH = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
    flappyPipes.push({ x: FLAPPY_W, topH, passed: false });
}

function flappyLoop(){
    flappyCtx.clearRect(0, 0, FLAPPY_W, FLAPPY_H);

    flappyCtx.fillStyle = "rgba(255,255,255,0.6)";
    flappyCtx.beginPath();
    flappyCtx.arc(60 - (flappyFrame * 0.3) % 320, 60, 18, 0, Math.PI * 2);
    flappyCtx.arc(180 - (flappyFrame * 0.3) % 320, 90, 22, 0, Math.PI * 2);
    flappyCtx.fill();

    if(flappyState === "playing"){
        // Expire effect
        if(flappyActiveEffect && flappyFrame > flappyActiveEffect.endFrame){
            flappyActiveEffect = null;
        }
        const isShield= flappyActiveEffect?.type === "shield";
        const isStar  = flappyActiveEffect?.type === "star";
        const pipeSpeedNow = FLAPPY_PIPE_SPEED;

        flappyFrog.vy += FLAPPY_GRAVITY;
        flappyFrog.y += flappyFrog.vy;

        flappyFrame++;
        if(flappyFrame % FLAPPY_PIPE_INTERVAL === 0) spawnPipe();
        // Spawn a powerup ~1 in every 3 pipes
        if(flappyFrame % FLAPPY_PIPE_INTERVAL === 40 && Math.random() < 0.5) spawnPowerup();

        flappyPipes.forEach(p => p.x -= pipeSpeedNow);
        flappyPipes = flappyPipes.filter(p => p.x + FLAPPY_PIPE_W > 0);
        flappyPowerups.forEach(p => p.x -= pipeSpeedNow);
        flappyPowerups = flappyPowerups.filter(p => p.x + 20 > 0);

        flappyPipes.forEach(p => {
            if(!p.passed && p.x + FLAPPY_PIPE_W < flappyFrog.x){
                p.passed = true;
                flappyScore += isStar ? 2 : 1;
                document.getElementById("flappyScore").textContent = flappyScore;
            }
        });

        // Power-up collection
        flappyPowerups.forEach(p => {
            const dx = p.x - flappyFrog.x;
            const dy = p.y - flappyFrog.y;
            if(!p.collected && Math.sqrt(dx*dx + dy*dy) < 26){
                p.collected = true;
                activatePowerup(p);
            }
        });
        flappyPowerups = flappyPowerups.filter(p => !p.collected);

        if(flappyFrog.y > FLAPPY_H - 20 || flappyFrog.y < -10){
            triggerFlappyGameOver();
        }

        const fr = { x: flappyFrog.x - 15, y: flappyFrog.y - 15, w: 30, h: 30 };
        flappyPipes.forEach(p => {
            if(fr.x + fr.w > p.x && fr.x < p.x + FLAPPY_PIPE_W){
                if(fr.y < p.topH || fr.y + fr.h > p.topH + FLAPPY_PIPE_GAP){
                    if(!isShield) triggerFlappyGameOver();
                }
            }
        });
    }

    const pipeColor    = currentTheme === "bear" ? "#6fb3c4" : "#ff8fab";
    const pipeCapColor = currentTheme === "bear" ? "#a8dadc" : "#ffafcc";
    flappyPipes.forEach(p => {
        flappyCtx.fillStyle = pipeColor;
        flappyCtx.fillRect(p.x, 0, FLAPPY_PIPE_W, p.topH);
        flappyCtx.fillRect(p.x, p.topH + FLAPPY_PIPE_GAP, FLAPPY_PIPE_W, FLAPPY_H - p.topH - FLAPPY_PIPE_GAP);

        flappyCtx.fillStyle = pipeCapColor;
        flappyCtx.fillRect(p.x - 4, p.topH - 14, FLAPPY_PIPE_W + 8, 14);
        flappyCtx.fillRect(p.x - 4, p.topH + FLAPPY_PIPE_GAP, FLAPPY_PIPE_W + 8, 14);
    });

    // Draw powerups
    flappyCtx.font = "28px serif";
    flappyCtx.textAlign = "center";
    flappyCtx.textBaseline = "middle";
    flappyPowerups.forEach(p => {
        // Glow behind
        flappyCtx.beginPath();
        flappyCtx.fillStyle = p.color + "80";
        flappyCtx.arc(p.x, p.y, 22 + Math.sin(flappyFrame * 0.15) * 3, 0, Math.PI * 2);
        flappyCtx.fill();
        flappyCtx.fillStyle = "black";
        flappyCtx.fillText(p.emoji, p.x, p.y);
    });

    // Draw creature (with shield glow if active)
    flappyCtx.font = "34px serif";
    flappyCtx.textAlign = "center";
    flappyCtx.textBaseline = "middle";
    const tilt = Math.max(-0.4, Math.min(0.8, flappyFrog.vy * 0.08));

    if(flappyActiveEffect?.type === "shield"){
        flappyCtx.beginPath();
        flappyCtx.fillStyle = "rgba(168,218,220,0.5)";
        flappyCtx.arc(flappyFrog.x, flappyFrog.y, 28, 0, Math.PI * 2);
        flappyCtx.fill();
    }

    flappyCtx.save();
    flappyCtx.translate(flappyFrog.x, flappyFrog.y);
    flappyCtx.rotate(tilt);
    flappyCtx.fillText(getTheme().flappyCreature, 0, 0);
    flappyCtx.restore();

    // Active effect banner
    if(flappyActiveEffect){
        const remaining = Math.max(0, flappyActiveEffect.endFrame - flappyFrame);
        const secs = (remaining / 60).toFixed(1);
        flappyCtx.fillStyle = flappyActiveEffect.color + "dd";
        flappyCtx.fillRect(10, 10, 108, 24);
        flappyCtx.fillStyle = "white";
        flappyCtx.font = "bold 13px Trebuchet MS";
        flappyCtx.textAlign = "center";
        flappyCtx.fillText(`${flappyActiveEffect.emoji} ${secs}s`, 64, 22);
    }

    if(flappyState === "ready"){
        flappyCtx.fillStyle = currentTheme === "bear" ? "rgba(26,77,94,0.9)" : "rgba(53,94,59,0.85)";
        flappyCtx.font = "bold 20px Trebuchet MS";
        flappyCtx.textAlign = "center";
        const readyEmoji = currentTheme === "bear" ? "❄️" : "🪷";
        flappyCtx.fillText(`Click to start! ${readyEmoji}`, FLAPPY_W/2, FLAPPY_H/2 + 80);
    }

    if(flappyState === "gameover"){
        const boxH = flappyScore === flappyHighScore && flappyScore > 0 ? 150 : 130;
        flappyCtx.fillStyle = currentTheme === "bear" ? "rgba(74,142,176,0.94)" : "rgba(255,143,171,0.92)";
        flappyCtx.fillRect(30, FLAPPY_H/2 - boxH/2, FLAPPY_W - 60, boxH);
        flappyCtx.fillStyle = "white";
        flappyCtx.font = "bold 24px Trebuchet MS";
        flappyCtx.textAlign = "center";

        let y = FLAPPY_H/2 - boxH/2 + 32;
        flappyCtx.fillText("Game Over!", FLAPPY_W/2, y);
        y += 28;
        flappyCtx.font = "16px Trebuchet MS";
        flappyCtx.fillText(`Score: ${flappyScore}`, FLAPPY_W/2, y);
        y += 22;
        if(flappyScore === flappyHighScore && flappyScore > 0){
            flappyCtx.fillStyle = "#fff8b0";
            flappyCtx.font = "bold 15px Trebuchet MS";
            const sparkle = currentTheme === "bear" ? "❄️" : "✨";
            flappyCtx.fillText(`${sparkle} NEW BEST! ${sparkle}`, FLAPPY_W/2, y);
            y += 22;
            flappyCtx.fillStyle = "white";
            flappyCtx.font = "16px Trebuchet MS";
        } else {
            flappyCtx.fillText(`Best: ${flappyHighScore}`, FLAPPY_W/2, y);
            y += 22;
        }
        flappyCtx.fillText("Click to try again 💗", FLAPPY_W/2, y);
    }

    flappyAnimId = requestAnimationFrame(flappyLoop);
}
