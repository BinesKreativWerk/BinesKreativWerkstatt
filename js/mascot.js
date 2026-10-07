(() => {
  'use strict';
  const host = document.getElementById('bkw-dragon-mascot');
  if (!host) return;

  const messages = [
    'Hallo! 🐉 Schön, dass du da bist!',
    'Ich bin dein kleiner Ladenwächter und passe gut auf. ❤️',
    'Riechst du das? Das sind frisch gedruckte 3D-Kunstwerke!',
    'Klick mich ruhig an – ich kann sogar mit dem Schwanz wedeln!',
    'Schau dich in Ruhe um. Vielleicht finde ich etwas für dich. 🐉'
  ];
  let messageIndex = 0;

  host.innerHTML = `
    <div class="bkw-dragon-bubble" id="bkw-dragon-bubble" hidden>
      <strong>Dein kleiner Drachen-Ladenwächter 🐉</strong>
      <span id="bkw-dragon-message"></span>
      <div class="bkw-dragon-actions">
        <button type="button" data-action="shop">Zum Shop</button>
        <button type="button" data-action="pet">Streicheln ❤️</button>
        <button type="button" data-action="close">Später</button>
      </div>
    </div>

    <button class="bkw-dragon-pet" id="bkw-dragon-pet" type="button" aria-label="Kleinen Drachen begrüßen">
      <span class="bkw-dragon-spark one">✦</span>
      <span class="bkw-dragon-spark two">♥</span>
      <span class="bkw-dragon-spark three">✦</span>
      <svg class="bkw-dragon-svg" viewBox="0 0 240 190" role="img" aria-label="Kleiner roter Drache mit Flügeln, vier Beinen und langem Schwanz">
        <defs>
          <radialGradient id="dragonSkin" cx="40%" cy="25%" r="80%">
            <stop offset="0" stop-color="#ff786e"/>
            <stop offset=".42" stop-color="#b71f32"/>
            <stop offset="1" stop-color="#3d0810"/>
          </radialGradient>
          <linearGradient id="dragonBelly" x1="0" y1="0" x2="0" y2="1">
            <stop stop-color="#ffe5c9"/><stop offset="1" stop-color="#b96555"/>
          </linearGradient>
          <linearGradient id="dragonWing" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="#ff735f"/><stop offset=".5" stop-color="#9d1428"/><stop offset="1" stop-color="#33060d"/>
          </linearGradient>
          <linearGradient id="dragonHorn" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="#f7d7bc"/><stop offset="1" stop-color="#77423f"/>
          </linearGradient>
          <radialGradient id="eyeIris">
            <stop stop-color="#ffd9a8"/><stop offset=".35" stop-color="#ff594d"/><stop offset=".78" stop-color="#650816"/><stop offset="1" stop-color="#100205"/>
          </radialGradient>
          <filter id="dragonShadow" x="-40%" y="-50%" width="180%" height="220%">
            <feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#000" flood-opacity=".52"/>
          </filter>
        </defs>

        <!-- ground shadow -->
        <ellipse cx="117" cy="174" rx="91" ry="9" fill="#000" opacity=".34"/>

        <!-- long dragon tail -->
        <path class="dragon-tail" d="M151 139 C188 163 225 159 223 133 C222 119 206 116 199 127" fill="none" stroke="#430911" stroke-width="23" stroke-linecap="round"/>
        <path class="dragon-tail" d="M151 136 C188 158 218 155 218 134 C217 124 207 123 201 130" fill="none" stroke="url(#dragonSkin)" stroke-width="17" stroke-linecap="round"/>
        <path d="M201 119l18-15-1 22z" fill="#ed625e" stroke="#4d0913" stroke-width="3"/>

        <!-- back wings -->
        <path class="wing left" d="M91 81 C62 74 39 53 43 25 C68 28 91 43 104 66 L100 82z" fill="url(#dragonWing)" stroke="#35060d" stroke-width="4"/>
        <path class="wing right" d="M139 81 C167 73 190 52 186 25 C161 28 139 43 126 66 L130 82z" fill="url(#dragonWing)" stroke="#35060d" stroke-width="4"/>
        <path d="M49 31l46 39M181 31l-46 39M58 48l34 23M172 48l-34 23" stroke="#ff9a7d" stroke-width="2.4" opacity=".65"/>

        <!-- four legs behind -->
        <g class="dragon-legs-back">
          <path d="M83 120 C77 135 76 154 81 165 L96 165 C99 151 99 136 103 121z" fill="url(#dragonSkin)" stroke="#4a0912" stroke-width="4"/>
          <path d="M134 120 C140 135 141 154 136 165 L121 165 C118 151 118 136 114 121z" fill="url(#dragonSkin)" stroke="#4a0912" stroke-width="4"/>
          <path d="M76 162l-5 7 10-3 6 4 4-7M141 162l5 7-10-3-6 4-4-7" fill="#7b1725" stroke="#430911" stroke-width="2"/>
        </g>

        <!-- body, clearly animal-like -->
        <path d="M61 91 C58 105 59 137 76 151 C91 163 139 163 154 151 C171 137 172 105 159 91 C142 75 78 75 61 91z" fill="url(#dragonSkin)" stroke="#430811" stroke-width="4" filter="url(#dragonShadow)"/>

        <!-- belly scales -->
        <path d="M91 98 C82 111 83 139 94 151 C102 158 114 158 122 151 C133 139 134 111 125 98 C117 90 99 90 91 98z" fill="url(#dragonBelly)" stroke="#742e32" stroke-width="2.5"/>
        <g fill="none" stroke="#9f4d45" stroke-width="1.6" opacity=".72">
          <path d="M91 110h34M90 120h36M91 130h34M94 140h28M99 149h18"/>
        </g>

        <!-- front legs -->
        <g class="dragon-legs-front">
          <path d="M69 112 C62 129 61 151 68 168 C72 175 87 175 91 168 C93 153 91 132 88 113z" fill="url(#dragonSkin)" stroke="#430811" stroke-width="4"/>
          <path d="M136 113 C149 132 151 153 147 168 C143 175 128 175 124 168 C122 153 125 132 128 113z" fill="url(#dragonSkin)" stroke="#430811" stroke-width="4"/>
          <path d="M65 165l-7 8 12-3 6 5 4-8M150 165l7 8-12-3-6 5-4-8" fill="#8e1828" stroke="#430811" stroke-width="2"/>
        </g>

        <!-- neck and head -->
        <path d="M65 88 C48 74 46 50 57 34 C68 18 92 11 117 16 C143 20 160 38 159 61 C158 83 145 99 125 108 C101 118 77 108 65 88z" fill="url(#dragonSkin)" stroke="#430811" stroke-width="4" filter="url(#dragonShadow)"/>

        <!-- horns -->
        <path d="M75 38 C58 29 56 12 67 4 C78 16 82 27 82 39z" fill="url(#dragonHorn)" stroke="#4d1c20" stroke-width="3"/>
        <path d="M132 39 C149 29 151 12 140 4 C129 16 125 27 125 39z" fill="url(#dragonHorn)" stroke="#4d1c20" stroke-width="3"/>
        <path d="M64 18l13 9M146 18l-13 9" stroke="#fff0dd" stroke-width="2" opacity=".55"/>

        <!-- forehead scales -->
        <g fill="#ff9a84" opacity=".45">
          <path d="M93 28l5-8 5 8-5 6z"/><path d="M108 28l5-8 5 8-5 6z"/>
          <path d="M84 40l5-7 5 7-5 5z"/><path d="M117 40l5-7 5 7-5 5z"/>
        </g>

        <!-- ears -->
        <path d="M58 58 C35 45 29 62 43 76 L62 72z" fill="#a51b31" stroke="#520b15" stroke-width="3"/>
        <path d="M158 58 C181 45 187 62 173 76 L154 72z" fill="#a51b31" stroke="#520b15" stroke-width="3"/>

        <!-- dragon eyes -->
        <g class="dragon-eyes">
          <ellipse class="bkw-dragon-eye" cx="82" cy="57" rx="15" ry="18" fill="#fff8ef" stroke="#2b050a" stroke-width="4"/>
          <ellipse class="bkw-dragon-eye" cx="135" cy="57" rx="15" ry="18" fill="#fff8ef" stroke="#2b050a" stroke-width="4"/>
          <ellipse cx="82" cy="59" rx="9" ry="13" fill="url(#eyeIris)"/>
          <ellipse cx="135" cy="59" rx="9" ry="13" fill="url(#eyeIris)"/>
          <ellipse cx="82" cy="61" rx="2.8" ry="9" fill="#100205"/><ellipse cx="135" cy="61" rx="2.8" ry="9" fill="#100205"/>
          <circle cx="85" cy="53" r="3.2" fill="#fff"/><circle cx="138" cy="53" r="3.2" fill="#fff"/>
        </g>

        <!-- long muzzle / snout -->
        <path d="M78 76 C82 66 95 63 108 66 C121 63 134 66 139 76 C145 89 136 101 122 105 C110 109 98 109 86 105 C72 101 65 89 78 76z" fill="url(#dragonBelly)" stroke="#6b1c20" stroke-width="2.5"/>
        <!-- nostrils -->
        <ellipse cx="91" cy="82" rx="4" ry="2.8" fill="#4c0d15"/>
        <ellipse cx="126" cy="82" rx="4" ry="2.8" fill="#4c0d15"/>
        <!-- mouth + tiny fangs -->
        <path d="M84 92 C95 101 116 101 130 91" fill="none" stroke="#4c0b12" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M92 97l3 7 4-5M119 97l-3 7-4-5" fill="#fff1dc" stroke="#642027" stroke-width="1.2"/>

        <!-- cheek scales -->
        <g fill="#ff8977" opacity=".35">
          <circle cx="68" cy="76" r="3"/><circle cx="72" cy="84" r="2.5"/><circle cx="151" cy="76" r="3"/><circle cx="147" cy="84" r="2.5"/>
          <circle cx="62" cy="94" r="2.5"/><circle cx="156" cy="94" r="2.5"/>
        </g>

        <!-- heart collar -->
        <path d="M73 103 Q107 116 145 103" fill="none" stroke="#211014" stroke-width="3"/>
        <path d="M105 108v12" stroke="#dca9a0" stroke-width="2"/>
        <path d="M105 125 C98 118 88 126 105 137 C122 126 112 118 105 125z" fill="#ff4d61" stroke="#5d1019" stroke-width="2"/>
      </svg>
    </button>`;

  const bubble = host.querySelector('#bkw-dragon-bubble');
  const pet = host.querySelector('#bkw-dragon-pet');
  const message = host.querySelector('#bkw-dragon-message');

  const showBubble = (index = messageIndex) => {
    messageIndex = (index + messages.length) % messages.length;
    message.textContent = messages[messageIndex];
    bubble.hidden = false;
  };

  const hideBubble = () => { bubble.hidden = true; };

  const openShop = () => {
    const target = document.querySelector('#shop, #produkte, .products, [data-shop-section]');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.location.href = 'shop.html';
  };

  pet.addEventListener('click', () => {
    pet.classList.remove('is-happy');
    void pet.offsetWidth;
    pet.classList.add('is-happy');
    showBubble(messageIndex + 1);
  });

  bubble.addEventListener('click', (event) => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    if (action === 'shop') openShop();
    if (action === 'pet') {
      pet.classList.remove('is-happy');
      void pet.offsetWidth;
      pet.classList.add('is-happy');
      showBubble(messageIndex + 1);
    }
    if (action === 'close') hideBubble();
  });

  // Erste Begrüßung mit kleiner Verzögerung, damit die Seite zuerst sauber lädt.
  window.setTimeout(() => showBubble(0), 1100);

  // Gelegentlich neue Nachricht, aber nicht aufdringlich.
  window.setInterval(() => {
    if (!bubble.hidden) showBubble(messageIndex + 1);
  }, 18000);
})();
