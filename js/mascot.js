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
    <button class="bkw-dragon-pet" id="bkw-dragon-pet" type="button" aria-label="Kleinen Drachen begrüßen">
      <span class="bkw-dragon-spark one">✦</span><span class="bkw-dragon-spark two">♥</span><span class="bkw-dragon-spark three">✦</span>
      <svg class="bkw-dragon-svg" viewBox="0 0 180 180" role="img" aria-label="Niedlicher kleiner detailreicher roter Drache">
        <defs>
          <radialGradient id="dragonSkin" cx="42%" cy="28%" r="80%"><stop offset="0" stop-color="#ff7b75"/><stop offset=".42" stop-color="#b51f32"/><stop offset="1" stop-color="#4a0b14"/></radialGradient>
          <linearGradient id="dragonBelly" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe0c6"/><stop offset=".55" stop-color="#e9a184"/><stop offset="1" stop-color="#9b4c48"/></linearGradient>
          <linearGradient id="dragonWing" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff765f"/><stop offset=".5" stop-color="#9d1428"/><stop offset="1" stop-color="#36070e"/></linearGradient>
          <linearGradient id="dragonHorn" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5d6bd"/><stop offset=".5" stop-color="#b27a70"/><stop offset="1" stop-color="#5c3030"/></linearGradient>
          <radialGradient id="eyeIris"><stop stop-color="#fff5d6"/><stop offset=".35" stop-color="#ff6a52"/><stop offset=".75" stop-color="#6e0919"/><stop offset="1" stop-color="#160309"/></radialGradient>
          <filter id="dragonShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#000" flood-opacity=".5"/></filter>
          <filter id="softGlow"><feGaussianBlur stdDeviation="2.2"/></filter>
        </defs>
        <ellipse cx="91" cy="166" rx="61" ry="9" fill="#000" opacity=".34" filter="url(#softGlow)"/>
        <!-- tail behind body -->
        <path d="M116 137 C153 157 174 146 166 124 C162 113 148 116 147 128" fill="none" stroke="#4b0912" stroke-width="17" stroke-linecap="round"/>
        <path d="M116 134 C151 153 168 143 162 125" fill="none" stroke="url(#dragonSkin)" stroke-width="12" stroke-linecap="round"/>
        <path d="M151 116l13-12 1 17z" fill="#ef6e65" stroke="#5b0d18" stroke-width="3"/>
        <!-- wings -->
        <path class="wing left" d="M54 75 C28 70 12 51 20 30 C40 35 55 48 63 64 L57 75z" fill="url(#dragonWing)" stroke="#3c0710" stroke-width="4"/>
        <path class="wing right" d="M126 75 C152 70 168 51 160 30 C140 35 125 48 117 64 L123 75z" fill="url(#dragonWing)" stroke="#3c0710" stroke-width="4"/>
        <path d="M25 36l27 29M156 36l-27 29M31 51l22 13M149 51l-22 13" stroke="#ff9a7d" stroke-width="2.5" opacity=".65"/>
        <!-- horns -->
        <path d="M62 43 C48 30 49 13 61 5 C70 18 72 30 69 42z" fill="url(#dragonHorn)" stroke="#4b1d22" stroke-width="3"/>
        <path d="M118 43 C132 30 131 13 119 5 C110 18 108 30 111 42z" fill="url(#dragonHorn)" stroke="#4b1d22" stroke-width="3"/>
        <path d="M55 22l10 7M125 22l-10 7" stroke="#ffe8d7" stroke-width="2" opacity=".55"/>
        <!-- body -->
        <path d="M52 96 C42 111 42 146 56 157 C70 168 110 168 124 157 C138 146 138 111 128 96 C117 84 63 84 52 96z" fill="url(#dragonSkin)" stroke="#4b0913" stroke-width="4" filter="url(#dragonShadow)"/>
        <!-- head -->
        <path d="M37 67 C35 35 57 19 90 19 C123 19 145 35 143 67 C141 98 120 117 90 117 C60 117 39 98 37 67z" fill="url(#dragonSkin)" stroke="#4b0913" stroke-width="4" filter="url(#dragonShadow)"/>
        <!-- cheek plates -->
        <path d="M41 75c-14-8-22 4-12 15 7 7 16 4 22-3M139 75c14-8 22 4 12 15-7 7-16 4-22-3" fill="#8e1728" stroke="#5a0b15" stroke-width="3"/>
        <!-- small scales -->
        <g fill="#ff8a78" opacity=".34">
          <circle cx="54" cy="53" r="3"/><circle cx="63" cy="37" r="2.5"/><circle cx="74" cy="29" r="2.2"/><circle cx="106" cy="29" r="2.2"/><circle cx="118" cy="38" r="2.5"/><circle cx="127" cy="53" r="3"/>
          <circle cx="48" cy="87" r="2.5"/><circle cx="132" cy="87" r="2.5"/><circle cx="56" cy="101" r="2"/><circle cx="124" cy="101" r="2"/>
        </g>
        <!-- ears -->
        <path d="M41 60 C19 48 13 65 29 78 L47 71zM139 60c22-12 28 5 12 18l-18-7z" fill="#a51b31" stroke="#5b0d17" stroke-width="3"/>
        <path d="M30 64l12 7M150 64l-12 7" stroke="#ff9a87" stroke-width="2"/>
        <!-- eyes -->
        <g class="dragon-eye-wrap">
          <ellipse class="bkw-dragon-eye" cx="65" cy="65" rx="17" ry="21" fill="#fff8ef" stroke="#30060c" stroke-width="4"/>
          <ellipse class="bkw-dragon-eye" cx="115" cy="65" rx="17" ry="21" fill="#fff8ef" stroke="#30060c" stroke-width="4"/>
          <ellipse cx="66" cy="67" rx="11" ry="15" fill="url(#eyeIris)"/>
          <ellipse cx="114" cy="67" rx="11" ry="15" fill="url(#eyeIris)"/>
          <ellipse cx="66" cy="69" rx="3.2" ry="10" fill="#120207"/><ellipse cx="114" cy="69" rx="3.2" ry="10" fill="#120207"/>
          <circle cx="70" cy="60" r="3.7" fill="#fff"/><circle cx="118" cy="60" r="3.7" fill="#fff"/>
        </g>
        <!-- muzzle -->
        <ellipse cx="90" cy="87" rx="31" ry="25" fill="url(#dragonBelly)" stroke="#6b1c20" stroke-width="2.5"/>
        <path d="M84 84c3-4 9-4 12 0-3 4-9 4-12 0z" fill="#59151c"/>
        <path d="M76 94 C83 105 97 105 104 94" fill="#fff4e8" stroke="#5a1118" stroke-width="3" stroke-linecap="round"/>
        <path d="M84 102c4 3 8 3 12 0" fill="none" stroke="#e75d63" stroke-width="2.5" stroke-linecap="round"/>
        <!-- blush -->
        <ellipse cx="51" cy="88" rx="10" ry="5" fill="#ff6d72" opacity=".5"/><ellipse cx="129" cy="88" rx="10" ry="5" fill="#ff6d72" opacity=".5"/>
        <!-- belly -->
        <path d="M66 108 C59 121 60 147 72 155 C81 161 99 161 108 155 C120 147 121 121 114 108 C102 116 78 116 66 108z" fill="url(#dragonBelly)" stroke="#7d3735" stroke-width="2.5"/>
        <path d="M72 124c12 5 24 5 36 0M70 135c13 5 27 5 40 0M72 146c12 5 24 5 36 0" fill="none" stroke="#b66a59" stroke-width="2" opacity=".65"/>
        <!-- arms -->
        <path d="M62 112 C44 112 38 124 49 132 C56 137 63 131 68 125M118 112c18 0 24 12 13 20-7 5-14-1-19-7" fill="none" stroke="#a91c31" stroke-width="9" stroke-linecap="round"/>
        <path d="M49 132l-5 5M55 133l-2 6M131 132l5 5M125 133l2 6" stroke="#ffd0bd" stroke-width="2" stroke-linecap="round"/>
        <!-- claws -->
        <path d="M61 151l-3 7M68 153l-2 7M119 151l3 7M112 153l2 7" stroke="#f2c8b2" stroke-width="3" stroke-linecap="round"/>
        <!-- heart pendant -->
        <path d="M90 115v8" stroke="#2b090d" stroke-width="2"/><path d="M90 129 C78 121 82 115 88 119 C90 114 98 118 98 123 C98 126 94 129 90 132 C86 129 82 126 82 123" fill="#ff304e" stroke="#ffd0c2" stroke-width="2"/>
        <!-- tiny forehead ridge -->
        <path d="M90 22l-4 12 4-3 4 3z" fill="#ffb08e" stroke="#65121d" stroke-width="2"/>
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
    } else hideBubble();
  });

  window.setTimeout(() => showBubble('Hallo! 🐉 Schön, dass du da bist!'), 1800);
})();
