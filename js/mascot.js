(() => {
  'use strict';
  const host = document.getElementById('bkw-dragon-mascot');
  if (!host) return;

  const messages = [
    'Hallo! 🐉 Schön, dass du da bist!',
    'Psst … ich passe hier ein bisschen auf. ❤️',
    'Schau dich ruhig um – vielleicht findest du deinen neuen Lieblingsdruck.',
    'Klick mich ruhig an. Ich bin freundlich! 😊'
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
    <button class="bkw-dragon-pet" id="bkw-dragon-pet" type="button" aria-label="Kleinen Drachen begrüßen">
      <svg class="bkw-dragon-svg" viewBox="0 0 100 100" role="img" aria-label="Kleiner roter Drache">
        <path d="M24 61C8 51 11 31 27 25c4-13 19-19 31-10 11-7 28 0 30 14 15 8 11 30-3 34-8 3-13 13-27 13-16 0-18-10-34-15z" fill="#8f102d" stroke="#ff4163" stroke-width="2.2"/>
        <path d="M29 31C15 15 8 27 17 39l12 5M70 30C85 14 94 27 84 40L72 44" fill="#18070b" stroke="#ff4163" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M38 18l4-11 7 9M56 16l7-10 3 12" fill="#a91435" stroke="#ff4163" stroke-width="2" stroke-linejoin="round"/>
        <circle class="bkw-dragon-eye" cx="39" cy="38" r="5.3" fill="#fff" stroke="#21050b" stroke-width="2"/>
        <circle class="bkw-dragon-eye" cx="63" cy="38" r="5.3" fill="#fff" stroke="#21050b" stroke-width="2"/>
        <circle cx="40" cy="39" r="2.2" fill="#ff3155"/><circle cx="62" cy="39" r="2.2" fill="#ff3155"/>
        <path d="M43 51c6 6 12 6 18 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        <path d="M28 58c-7 6-7 15 0 19M72 58c7 6 7 15 0 19" fill="none" stroke="#ff4163" stroke-width="3" stroke-linecap="round"/>
        <path d="M48 76c-5 7-3 13 6 14 10 1 14-7 10-12" fill="none" stroke="#ff4163" stroke-width="3" stroke-linecap="round"/>
        <path d="M48 56l4 4 4-4" fill="none" stroke="#ffbdc8" stroke-width="2"/>
      </svg>
    </button>`;

  const bubble = document.getElementById('bkw-dragon-bubble');
  const pet = document.getElementById('bkw-dragon-pet');
  const message = document.getElementById('bkw-dragon-message');

  function showBubble(text = messages[messageIndex % messages.length]) {
    message.textContent = text;
    bubble.hidden = false;
    messageIndex += 1;
  }
  function hideBubble() { bubble.hidden = true; }

  pet.addEventListener('click', () => {
    pet.classList.remove('is-happy');
    void pet.offsetWidth;
    pet.classList.add('is-happy');
    showBubble();
  });

  bubble.addEventListener('click', (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'shop') {
      hideBubble();
      const shop = document.getElementById('shop');
      if (shop) shop.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (action === 'pet') {
      pet.classList.remove('is-happy');
      void pet.offsetWidth;
      pet.classList.add('is-happy');
      showBubble('Mmmh, das gefällt mir! 🐉❤️');
    } else {
      hideBubble();
    }
  });

  window.setTimeout(() => showBubble('Hallo! 🐉 Schön, dass du da bist!'), 2200);
})();
