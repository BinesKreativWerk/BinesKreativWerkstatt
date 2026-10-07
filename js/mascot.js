(() => {
  'use strict';
  const host = document.getElementById('bkw-dragon-mascot');
  if (!host) return;

  const messages = [
    'Hallo! 🐉 Schön, dass du da bist!',
    'Psst … ich passe hier ein bisschen auf. ❤️',
    'Schau dich ruhig um – vielleicht findest du deinen neuen Lieblingsdruck.',
    'Klick mich ruhig an. Ich bin freundlich! 😊',
    'Hast du etwas Schönes gefunden? Ich freu mich! 🐉❤️'
  ];
  let messageIndex = 0;

  host.innerHTML = `
    <div class="bkw-dragon-bubble" id="bkw-dragon-bubble" hidden>
      <strong>Dein kleiner Ladenwächter 🐉</strong>
      <span id="bkw-dragon-message"></span>
      <div class="bkw-dragon-actions">
        <button type="button" data-action="shop">Zum Shop</button>
        <button type="button" data-action="pet">Streicheln ❤️</button>
        <button type="button" data-action="close">Später</button>
      </div>
    </div>
    <button class="bkw-dragon-pet" id="bkw-dragon-pet" type="button" aria-label="Kleinen Comic-Drachen begrüßen">
      <span class="bkw-dragon-spark one">✦</span><span class="bkw-dragon-spark two">♥</span><span class="bkw-dragon-spark three">✦</span>
      <svg class="bkw-dragon-svg" viewBox="0 0 120 120" role="img" aria-label="Niedlicher kleiner roter Comic-Drache">
        <!-- Flügel -->
        <path d="M32 57C12 48 7 29 18 21c10 4 18 12 22 24M88 57c20-9 25-28 14-36-10 4-18 12-22 24" fill="#5d101d" stroke="#ff4c68" stroke-width="3" stroke-linejoin="round"/>
        <path d="M18 21l6 17 10-7M102 21l-6 17-10-7" fill="none" stroke="#ff7186" stroke-width="2" stroke-linecap="round"/>
        <!-- Hörner -->
        <path d="M42 27c-9-8-8-18 0-23 7 7 9 13 8 21M78 27c9-8 8-18 0-23-7 7-9 13-8 21" fill="#ffb1bd" stroke="#8d1830" stroke-width="3" stroke-linejoin="round"/>
        <!-- Kopf -->
        <path d="M25 50c0-24 14-35 35-35s35 11 35 35c0 23-13 40-35 40S25 73 25 50z" fill="#b91f3e" stroke="#ff5b74" stroke-width="3"/>
        <!-- Ohren -->
        <path d="M27 48C12 43 10 54 20 63l11-5M93 48c15-5 17 6 7 15l-11-5" fill="#8b1630" stroke="#ff5b74" stroke-width="3"/>
        <!-- Schnauze -->
        <ellipse cx="60" cy="65" rx="25" ry="19" fill="#ff8ca0" stroke="#8d1830" stroke-width="2"/>
        <!-- Augen -->
        <ellipse class="bkw-dragon-eye" cx="43" cy="47" rx="10" ry="13" fill="#fff" stroke="#40101b" stroke-width="3"/>
        <ellipse class="bkw-dragon-eye" cx="77" cy="47" rx="10" ry="13" fill="#fff" stroke="#40101b" stroke-width="3"/>
        <ellipse cx="44" cy="49" rx="4" ry="7" fill="#2b0710"/><ellipse cx="76" cy="49" rx="4" ry="7" fill="#2b0710"/>
        <circle cx="46" cy="46" r="2" fill="#fff"/><circle cx="78" cy="46" r="2" fill="#fff"/>
        <!-- Wangen -->
        <ellipse class="bkw-dragon-blush" cx="34" cy="62" rx="7" ry="4" fill="#ff4d72"/><ellipse class="bkw-dragon-blush" cx="86" cy="62" rx="7" ry="4" fill="#ff4d72"/>
        <!-- Nase und Lächeln -->
        <path d="M56 62c2-3 6-3 8 0-2 3-6 3-8 0z" fill="#6f1025"/>
        <path d="M49 70c5 8 17 8 22 0" fill="#fff" stroke="#6f1025" stroke-width="3" stroke-linecap="round"/>
        <path d="M57 77c2 2 4 2 6 0" fill="none" stroke="#e52d4f" stroke-width="2" stroke-linecap="round"/>
        <!-- Bauch -->
        <path d="M39 82c-5 9-4 20 5 25 8 4 24 4 32 0 9-5 10-16 5-25-6 5-12 8-21 8s-15-3-21-8z" fill="#d92b4c" stroke="#ff5b74" stroke-width="3"/>
        <path d="M51 92c6 3 12 3 18 0M49 99c7 3 15 3 22 0" fill="none" stroke="#ff8296" stroke-width="2" stroke-linecap="round"/>
        <!-- Arme -->
        <path d="M38 86c-12 1-14 9-6 13 5 2 9 0 12-4M82 86c12 1 14 9 6 13-5 2-9 0-12-4" fill="none" stroke="#ff5b74" stroke-width="5" stroke-linecap="round"/>
        <!-- Schwanz -->
        <path d="M79 103c18 8 29 1 25-9-2-5-8-5-10 0" fill="none" stroke="#ff5b74" stroke-width="7" stroke-linecap="round"/>
        <path d="M92 94l8-8 1 10" fill="#ffb1bd" stroke="#8d1830" stroke-width="2"/>
      </svg>
    </button>`;

  const bubble = document.getElementById('bkw-dragon-bubble');
  const pet = document.getElementById('bkw-dragon-pet');
  const message = document.getElementById('bkw-dragon-message');

  function happy() {
    pet.classList.remove('is-happy');
    void pet.offsetWidth;
    pet.classList.add('is-happy');
  }
  function showBubble(text = messages[messageIndex % messages.length]) {
    message.textContent = text;
    bubble.hidden = false;
    messageIndex += 1;
  }
  function hideBubble() { bubble.hidden = true; }

  pet.addEventListener('click', () => { happy(); showBubble(); });

  bubble.addEventListener('click', (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'shop') {
      hideBubble();
      const shop = document.getElementById('shop');
      if (shop) shop.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'pet') {
      happy();
      showBubble('Mmmh, das gefällt mir! 🐉❤️');
    } else {
      hideBubble();
    }
  });

  window.setTimeout(() => showBubble('Hallo! 🐉 Schön, dass du da bist!'), 1800);
})();
