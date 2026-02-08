import { DiscordSDK } from "@discord/embedded-app-sdk";
import "./style.css";

// Will eventually store the authenticated user's access_token
let auth;
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
	console.log("Discord SDK is authenticated");
});

async function setupDiscordSdk() {
	await discordSdk.ready();
	console.log("Discord SDK is ready");

	// Authorize with Discord Client
	const { code } = await discordSdk.commands.authorize({
		client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
		response_type: "code",
		state: "",
		prompt: "none",
		scope: ["identify", "guilds", "applications.commands"],
	});

	// Retrieve an access_token from your activity's server
	const response = await fetch("/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ code }),
	});
	const { access_token } = await response.json();

	// Authenticate with Discord client (using the access_token)
	auth = await discordSdk.commands.authenticate({
		access_token,
	});

	if (auth == null) {
		throw new Error("Authenticate command failed");
	}
}

import starImg from "/assets/star.png";
import rarityRarePng from "/assets/rarity_rare.png";
import raritySuperRarePng from "/assets/rarity_super_rare.png";
import rarityEpicPng from "/assets/rarity_epic.png";
import rarityMythicPng from "/assets/rarity_mythic.png";
import rarityLegendaryPng from "/assets/rarity_legendary.png";

// Character assets
import shellyImg from "/assets/characters/shelly.png";
import nitaImg from "/assets/characters/nita.png";
import coltImg from "/assets/characters/colt.png";
import brockImg from "/assets/characters/brock.png";
import jackyImg from "/assets/characters/jacky.png";
import jessieImg from "/assets/characters/jessie.png";
import piperImg from "/assets/characters/piper.png";
import pamImg from "/assets/characters/pam.png";
import barleyImg from "/assets/characters/barley.png";
import crowImg from "/assets/characters/crow.png";
import spikeImg from "/assets/characters/spike.png";
import leonImg from "/assets/characters/leon.png";
import sandyImg from "/assets/characters/sandy.png";
import beaImg from "/assets/characters/bea.png";
import amberImg from "/assets/characters/amber.png";

const rarityImages = {
	rare: rarityRarePng,
	super_rare: raritySuperRarePng,
	epic: rarityEpicPng,
	mythic: rarityMythicPng,
	legendary: rarityLegendaryPng,
};

const characterImages = {
	Shelly: shellyImg,
	Nita: nitaImg,
	Colt: coltImg,
	Brock: brockImg,
	Jacky: jackyImg,
	Jessie: jessieImg,
	Piper: piperImg,
	Pam: pamImg,
	Barley: barleyImg,
	Crow: crowImg,
	Spike: spikeImg,
	Leon: leonImg,
	Sandy: sandyImg,
	Bea: beaImg,
	Amber: amberImg,
};

// Render the simulator UI into #app
const appRoot = document.querySelector("#app");
appRoot.innerHTML = `
	<div id="mainContainer" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;position:relative;">
		<div id="rarityDisplay" style="padding:1rem;margin-bottom:1rem;">
			<img id="rarityImg" src="${rarityImages.rare}" alt="Rare" style="height:40px;"/>
		</div>
		<div id="starContainer" style="flex:1;display:flex;align-items:center;justify-content:center;position:relative;">
			<img id="starDrop" src="${starImg}" alt="Star Drop" class="star-drop" />
			<div id="readyText" class="ready-text" style="display:none; margin-top:1rem;"> CLICK! CLICK!</div>
		</div>
		<div id="progressBar" style="display:flex;gap:2rem;margin-bottom:4rem;justify-content:center;"></div>
	</div>
	<div id="rewardOverlay" class="reward-overlay" style="display:none;"></div>
	<div id="lightOverlay" class="light-overlay" style="display:none;"></div>
`;

// Rarity definitions
const RARITIES = [
	{
		key: "rare",
		label: "Rare",
		baseWeight: 50,
		color: "#3cb580",
		textColor: "#fff",
	},
	{
		key: "super_rare",
		label: "Super Rare",
		baseWeight: 28,
		color: "#1557D3",
		textColor: "#fff",
	},
	{
		key: "epic",
		label: "Epic",
		baseWeight: 15,
		color: "#C753EA",
		textColor: "#fff",
	},
	{
		key: "mythic",
		label: "Mythic",
		baseWeight: 5,
		color: "#B62223",
		textColor: "#fff",
	},
	{
		key: "legendary",
		label: "Legendary",
		baseWeight: 2,
		color: "#FFDB1B",
		textColor: "#111",
	},
];

// Character rewards per rarity
const CHARACTERS = {
	rare: ["Shelly", "Nita", "Colt"],
	super_rare: ["Brock", "Jacky", "Jessie"],
	epic: ["Piper", "Pam", "Barley"],
	mythic: ["Crow", "Spike", "Leon"],
	legendary: ["Sandy", "Bea", "Amber"],
};

let currentRarity = "rare";
let clickCount = 0;
let isOpened = false;
let pityCounter = 0;
let isReadyToOpen = false;
let isAnimating = false; // Spam resistance flag
let lastRewardCharacter = null;

function playSound(type = "click") {
	const audioContext = new (window.AudioContext || window.webkitAudioContext)();
	const now = audioContext.currentTime;

	if (type === "click") {
		const osc = audioContext.createOscillator();
		const gain = audioContext.createGain();
		osc.connect(gain);
		gain.connect(audioContext.destination);
		osc.frequency.value = 600;
		gain.gain.setValueAtTime(0.1, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
		osc.start(now);
		osc.stop(now + 0.1);
	} else if (type === "upgrade") {
		const osc = audioContext.createOscillator();
		const gain = audioContext.createGain();
		osc.connect(gain);
		gain.connect(audioContext.destination);
		osc.frequency.setValueAtTime(800, now);
		osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
		gain.gain.setValueAtTime(0.1, now);
		gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
		osc.start(now);
		osc.stop(now + 0.2);
	} else if (type === "legendary") {
		const notes = [800, 1000, 1200];
		notes.forEach((freq) => {
			const osc = audioContext.createOscillator();
			const gain = audioContext.createGain();
			osc.connect(gain);
			gain.connect(audioContext.destination);
			osc.frequency.value = freq;
			gain.gain.setValueAtTime(0.08, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
			osc.start(now);
			osc.stop(now + 0.4);
		});
	}
}

function playRewardSound(rarity) {
	// Try to play audio file, fallback to synth if unavailable
	const audio = new Audio(`/assets/audio/${rarity}.mp3`);
	audio.volume = 0.3;
	audio.play().catch(() => {
		// Fallback: play upgrade sound
		playSound("upgrade");
	});
}

function updateRarityDisplay() {
	const img = document.getElementById("rarityImg");
	img.src = rarityImages[currentRarity];
}

function getUpgradeOdds() {
	const rarityIndex = RARITIES.findIndex((r) => r.key === currentRarity);
	if (rarityIndex >= RARITIES.length - 1) return 0;
	const baseBump = 20 + pityCounter * 15;
	return Math.min(baseBump, 95);
}

function pickNewRarity() {
	const currentIdx = RARITIES.findIndex((r) => r.key === currentRarity);
	if (currentIdx >= RARITIES.length - 1) return currentRarity;
	const upgradeChance = getUpgradeOdds();
	if (Math.random() * 100 < upgradeChance) {
		const jump = Math.floor(Math.random() * (RARITIES.length - currentIdx));
		return RARITIES[currentIdx + jump].key;
	}
	return currentRarity;
}

function updateProgressBar() {
	const bar = document.getElementById("progressBar");
	bar.innerHTML = "";
	for (let i = 0; i < 4; i++) {
		const circle = document.createElement("div");
		circle.className = "progress-circle";
		if (i < clickCount) {
			const rarityColor = RARITIES.find((r) => r.key === currentRarity).color;
			circle.style.background = rarityColor;
			circle.style.boxShadow = `0 0 12px ${rarityColor}`;
		} else {
			circle.style.background = "#444";
			circle.style.boxShadow = "none";
		}
		bar.appendChild(circle);
	}
}

function updateBackground() {
	const rarityColor = RARITIES.find((r) => r.key === currentRarity).color;
	document.body.style.backgroundColor = rarityColor;
	document.body.style.transition = "background-color 300ms ease";
}

function showReward(rarity) {
	const overlay = document.getElementById("rewardOverlay");
	const charPool = CHARACTERS[rarity] || CHARACTERS.rare;
	const character = charPool[Math.floor(Math.random() * charPool.length)];
	lastRewardCharacter = character;

	const charImg = characterImages[character] || "";

	overlay.innerHTML = `
		<div class="reward-panel" style="background: ${RARITIES.find((r) => r.key === rarity).color};">
			<div class="reward-title">${rarity.toUpperCase()}</div>
			${charImg ? `<img src="${charImg}" alt="${character}" class="reward-image" />` : ""}
			<div class="reward-character">${character}</div>
			<div class="reward-hint">(Click to continue)</div>
		</div>
	`;
	overlay.style.display = "flex";
}

function playOpeningAnimation() {
	isAnimating = true;
	const star = document.getElementById("starDrop");
	const lightOverlay = document.getElementById("lightOverlay");

	// Calculate opening duration based on rarity (rare=1s, super_rare=1.5s, epic=2s, mythic=2.5s, legendary=3s)
	const rarityIndex = RARITIES.findIndex((r) => r.key === currentRarity);
	const openingDuration = 1000 + rarityIndex * 500; // 1000ms + 500ms per level
	const animationDuration = openingDuration / 1000; // Convert to seconds for CSS

	// Play rarity-specific sound
	playRewardSound(currentRarity);

	// Light overlay flash
	lightOverlay.style.display = "block";
	lightOverlay.style.opacity = "0.8";

	// Zoom out and zoom in animation
	star.style.animation = "none";
	setTimeout(() => {
		star.style.animation = `openingSequence ${animationDuration}s ease-out forwards`;
	}, 10);

	// Flash light overlay
	setTimeout(() => {
		lightOverlay.style.transition = "opacity 400ms ease-out";
		lightOverlay.style.opacity = "0";
	}, Math.min(200, openingDuration * 0.2));

	// Show reward after animation
	setTimeout(() => {
		star.style.opacity = "0.2";
		showReward(currentRarity);
		lightOverlay.style.display = "none";
		lightOverlay.style.transition = "none";
		isAnimating = false;
	}, openingDuration);
}

function resetDrop() {
	currentRarity = "rare";
	clickCount = 0;
	pityCounter = 0;
	isOpened = false;
	isReadyToOpen = false;
	updateProgressBar();
	updateRarityDisplay();
	updateBackground();
	const star = document.getElementById("starDrop");
	star.style.opacity = "1";
	star.style.animation = "none";
	star.style.transform = ""; // Reset scale
	document.getElementById("rewardOverlay").style.display = "none";
	document.getElementById("readyText").style.display = "none";
}

function handleClick() {
	// Spam resistance: don't allow clicks during animation
	if (isAnimating) return;

	if (isOpened) {
		resetDrop();
		return;
	}

	// If ready to open, trigger opening animation
	if (isReadyToOpen) {
		isReadyToOpen = false;
		playOpeningAnimation();
		isOpened = true;
		document.getElementById("readyText").style.display = "none";
		return;
	}

	playSound("click");

	const star = document.getElementById("starDrop");
	
	// Spin animation on every click
	star.style.animation = "none";
	setTimeout(() => {
		star.style.animation = "spin 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards";
	}, 10);

	clickCount++;
	pityCounter++;
	
	// Progressive scale: 5% larger per click (scale = 1 + clickCount * 0.05)
	const newScale = 1 + clickCount * 0.05;
	star.style.transform = `scale(${newScale})`;
	star.style.transition = "transform 300ms ease-out";
	
	setTimeout(() => {
		star.style.transition = "";
	}, 300);

	// Try to upgrade
	const newRarity = pickNewRarity();
	if (newRarity !== currentRarity) {
		currentRarity = newRarity;
		pityCounter = 0;
		playSound("upgrade");
	}

	updateProgressBar();
	updateRarityDisplay();
	updateBackground();

	// Check if drop is ready to open
	if (clickCount >= 4 || currentRarity === "legendary") {
		isReadyToOpen = true;
		document.getElementById("readyText").style.display = "block";
		star.style.animation = "pulseReady 0.6s ease-in-out infinite";
	}
}

// Attach click handler to entire document
document.addEventListener("click", handleClick);

// Initialize
updateProgressBar();
updateRarityDisplay();
updateBackground();
