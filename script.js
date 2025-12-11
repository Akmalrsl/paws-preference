const TOTAL_CATS = 15; //cats in 1 session

const cardStackEl = document.getElementById("card-stack");
const statusTextEl = document.getElementById("status-text");
const likeBtn = document.getElementById("like-btn");
const dislikeBtn = document.getElementById("dislike-btn");

const summarySection = document.getElementById("summary-section");
const cardSection = document.getElementById("card-section");
const summaryTextEl = document.getElementById("summary-text");
const likedGridEl = document.getElementById("liked-grid");
const restartBtn = document.getElementById("restart-btn");

let cats = []; //{ id, url }
let currentIndex = 0; //index in cats[]
let likedCats = [];

//swipe gestures
let isDragging = false;
let dragStartX = 0;
let currentX = 0;
let currentCard = null;
const SWIPE_THRESHOLD = 80; // px

//fetch cats images from Cataas
async function loadCats() {
    statusTextEl.textContent = "Loading cats…";

    const results = [];
    for (let i = 0; i < TOTAL_CATS; i++) {
        try {
            const res = await fetch("https://cataas.com/cat?json=true");
            const data = await res.json();

            const imageUrl = `https://cataas.com/cat/${data.id}`;

            results.push({ id: data.id, url: imageUrl });
        } catch (err) {
            console.error("Failed to fetch cat:", err);
        }
    }

    if (results.length === 0) {
        statusTextEl.textContent =
            "Oops, we couldn't load any cats. Please try refreshing the page.";
        return;
    }

    cats = results;
    currentIndex = 0;
    likedCats = [];

    renderCards();
    statusTextEl.textContent = "Swipe a cat or use the buttons!";
}

function renderCards() {
    cardStackEl.innerHTML = "";

    for (let i = currentIndex; i < cats.length; i++) {  //render from last to first so top card appears last
        const cat = cats[i];
        const card = document.createElement("div");
        card.className = "cat-card";
        card.dataset.index = i;

        const img = document.createElement("img");
        img.src = cat.url;
        img.alt = "Cute cat";

        const likeLabel = document.createElement("div");
        likeLabel.className = "card-label card-label--like";
        likeLabel.textContent = "LIKE";

        const nopeLabel = document.createElement("div");
        nopeLabel.className = "card-label card-label--nope";
        nopeLabel.textContent = "NOPE";

        card.appendChild(img);
        card.appendChild(likeLabel);
        card.appendChild(nopeLabel);

        if (i === currentIndex) {
            attachSwipeHandlers(card);
            currentCard = card;
        }

        cardStackEl.appendChild(card);
    }

    if (currentIndex >= cats.length) { //no cards left
        showSummary();
    }
}


function attachSwipeHandlers(card) {
    card.addEventListener("pointerdown", onPointerDown); //clean previous cards (show new ones only)
    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerup", onPointerUp);
    card.addEventListener("pointercancel", onPointerUp);
}

function onPointerDown(e) {
    if (!currentCard || e.button !== 0) return; //left click / primary touch only

    isDragging = true;
    dragStartX = e.clientX;
    currentX = e.clientX;

    currentCard.style.transition = "none"; //disable while dragging
}

function onPointerMove(e) {
    if (!isDragging || !currentCard) return;

    currentX = e.clientX;
    const deltaX = currentX - dragStartX;

    const rotation = deltaX * 0.05; //move the card for rotation
    currentCard.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

    updateCardLabels(deltaX);
}

function onPointerUp() {
    if (!isDragging || !currentCard) return;

    isDragging = false;
    const deltaX = currentX - dragStartX;

    //re-enable transitions
    currentCard.style.transition = "transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease";

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        const liked = deltaX > 0;
        animateSwipeAndNext(liked, deltaX);
    } else {
        resetCardPosition(); //snap back to center
    }
}

function updateCardLabels(deltaX) {
    if (!currentCard) return;
    const likeLabel = currentCard.querySelector(".card-label--like");
    const nopeLabel = currentCard.querySelector(".card-label--nope");
    const maxOpacity = 1;

    if (deltaX > 0) {
        const opacity = Math.min(deltaX / 100, maxOpacity);
        likeLabel.style.opacity = opacity;
        nopeLabel.style.opacity = 0;
    } else if (deltaX < 0) {
        const opacity = Math.min(-deltaX / 100, maxOpacity);
        nopeLabel.style.opacity = opacity;
        likeLabel.style.opacity = 0;
    } else {
        likeLabel.style.opacity = 0;
        nopeLabel.style.opacity = 0;
    }
}

function resetCardLabels() {
    if (!currentCard) return;
    const likeLabel = currentCard.querySelector(".card-label--like");
    const nopeLabel = currentCard.querySelector(".card-label--nope");
    likeLabel.style.opacity = 0;
    nopeLabel.style.opacity = 0;
}

function resetCardPosition() {
    if (!currentCard) return;
    currentCard.style.transform = "translateX(0px) rotate(0deg)";
    resetCardLabels();
}

//animate off-screen and then move to the next card
function animateSwipeAndNext(liked, deltaX) {
    if (!currentCard) return;

    const direction = deltaX > 0 ? 1 : -1;

    currentCard.style.transform = `translateX(${direction * 300}px) rotate(${direction * 20}deg)`;
    currentCard.style.opacity = "0";

    const swipedCard = currentCard;

    setTimeout(() => {
        //save 'liked' choices
        if (liked) {
            likedCats.push(cats[currentIndex]);
        }

        currentIndex++; //move to next card
        swipedCard.remove();
        renderCards();
    }, 250);
}

//buttons for desktop (cannot swipe)
dislikeBtn.addEventListener("click", () => {
    if (!currentCard) return;
    animateSwipeAndNext(false, -100);
});

likeBtn.addEventListener("click", () => {
    if (!currentCard) return;
    animateSwipeAndNext(true, 100);
});


function showSummary() {
    cardSection.classList.add("hidden"); //show summary
    summarySection.classList.remove("hidden");

    const total = cats.length;
    const likedCount = likedCats.length;

    summaryTextEl.textContent =
        likedCount === 0
            ? "You didn't like any cats this time. Tough crowd! 😼"
            : `You liked ${likedCount} out of ${total} cats. Here are your favourites:`;

    likedGridEl.innerHTML = "";

    if (likedCount > 0) {
        likedCats.forEach((cat) => {
            const img = document.createElement("img");
            img.src = cat.url;
            img.alt = "Liked cat";
            likedGridEl.appendChild(img);
        });
    }
}

restartBtn.addEventListener("click", () => { //restart
    summarySection.classList.add("hidden");
    cardSection.classList.remove("hidden");
    likedCats = [];
    currentIndex = 0;
    renderCards();
    statusTextEl.textContent = "Swipe a cat or use the buttons!";
});

loadCats();