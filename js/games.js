// COLOR ME Mini-Games Controller
const MiniGames = {
  activeGame: null,
  gameState: {},

  // ==========================================
  // 1. FEELINGS MATCH GAME
  // ==========================================
  initFeelingsGame(containerId, onComplete) {
    this.activeGame = "feelings";
    this.gameState = {
      score: 0,
      targetScore: 3,
      currentQuestion: null,
      options: [],
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card feelings-game">
        <h2 class="game-title">Trò chơi Cảm xúc 😊</h2>
        <p class="game-instruction">Nghe kỹ và chọn hình ảnh cảm xúc đúng nhé!</p>
        
        <div class="game-score-bar">
          <div class="game-stars-progress">
            <span class="game-star-indicator">⭐</span>
            <span class="game-star-indicator">⭐</span>
            <span class="game-star-indicator">⭐</span>
          </div>
        </div>

        <div class="game-action-center">
          <button id="feelings-listen-btn" class="speak-btn pulse-button">
            🔊 Nghe Cảm Xúc
          </button>
        </div>

        <div id="feelings-options" class="feelings-grid"></div>
        <div id="feelings-feedback" class="game-feedback-text"></div>
      </div>
    `;

    document.getElementById("feelings-listen-btn").addEventListener("click", () => {
      if (this.gameState.currentQuestion) {
        AudioManager.speak(this.gameState.currentQuestion.word, false);
      }
    });

    this.nextFeelingsQuestion();
  },

  nextFeelingsQuestion() {
    // Clear feedback
    document.getElementById("feelings-feedback").innerText = "";
    
    // Update progress stars
    const stars = document.querySelectorAll(".game-star-indicator");
    stars.forEach((star, idx) => {
      if (idx < this.gameState.score) {
        star.classList.add("earned");
        star.style.opacity = "1";
      } else {
        star.classList.remove("earned");
        star.style.opacity = "0.3";
      }
    });

    if (this.gameState.score >= this.gameState.targetScore) {
      this.completeGame();
      return;
    }

    const feelingsData = TOPICS_DATA.feelings.words;
    
    // Choose target
    const target = feelingsData[Math.floor(Math.random() * feelingsData.length)];
    this.gameState.currentQuestion = target;

    // Speak automatically
    setTimeout(() => {
      AudioManager.speak(target.word, false);
    }, 400);

    // Create options (3 distractors + 1 target)
    let options = [target];
    while (options.length < 3) {
      const randomOpt = feelingsData[Math.floor(Math.random() * feelingsData.length)];
      if (!options.some(o => o.word === randomOpt.word)) {
        options.push(randomOpt);
      }
    }
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    this.gameState.options = options;

    // Render options
    const optionsContainer = document.getElementById("feelings-options");
    optionsContainer.innerHTML = "";
    
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "feeling-option-card";
      btn.innerHTML = `
        <span class="feeling-emoji">${opt.emoji}</span>
        <span class="feeling-label-vi hidden-trans">${opt.vi}</span>
      `;
      
      // Respect Parent Setting for Translations
      const settings = AudioManager.getSettings();
      if (settings.showTranslation) {
        btn.querySelector(".feeling-label-vi").classList.remove("hidden-trans");
      }

      btn.addEventListener("click", () => this.handleFeelingSelect(opt, btn));
      optionsContainer.appendChild(btn);
    });
  },

  handleFeelingSelect(selected, buttonEl) {
    const isCorrect = selected.word === this.gameState.currentQuestion.word;
    
    // Remove click from all option cards to prevent double-tap
    const buttons = document.querySelectorAll(".feeling-option-card");
    buttons.forEach(b => b.style.pointerEvents = "none");

    if (isCorrect) {
      buttonEl.classList.add("correct-bounce");
      AudioManager.playCorrect();
      this.gameState.score++;
      
      const feedback = document.getElementById("feelings-feedback");
      feedback.innerHTML = `<span class="happy-msg">Tuyệt vời bé ơi! 🎉 Đã tìm thấy "${selected.word}" (${selected.vi})</span>`;
      
      // Explode small confetti
      createConfetti(buttonEl);

      setTimeout(() => {
        this.nextFeelingsQuestion();
      }, 1800);
    } else {
      buttonEl.classList.add("incorrect-shake");
      AudioManager.playTap(); // Play quick wobble tap sound
      
      const feedback = document.getElementById("feelings-feedback");
      feedback.innerHTML = `<span class="retry-msg">Thử lại một lần nữa xem bé yêu! 💪</span>`;

      setTimeout(() => {
        buttonEl.classList.remove("incorrect-shake");
        // Re-enable clicks
        buttons.forEach(b => b.style.pointerEvents = "auto");
        feedback.innerHTML = "";
      }, 1000);
    }
  },

  // ==========================================
  // 2. MAGIC COLORS MIXING GAME
  // ==========================================
  initColorsGame(containerId, onComplete) {
    this.activeGame = "colors";
    this.gameState = {
      color1: null,
      color2: null,
      discoveredCombinations: new Set(),
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card colors-game">
        <h2 class="game-title">Phù thủy Màu sắc 🎨</h2>
        <p class="game-instruction">Pha trộn hai màu cơ bản để khám phá màu mới kì diệu!</p>

        <div class="mixing-recipe-progress">
          <div class="recipe-badge" id="recipe-purple">🔴 + 🔵 = 🟣</div>
          <div class="recipe-badge" id="recipe-orange">🔴 + 🟡 = 🟠</div>
          <div class="recipe-badge" id="recipe-green">🔵 + 🟡 = 🟢</div>
        </div>

        <div class="mixing-stage">
          <!-- Mixing Pot SVG -->
          <div class="mixing-pot-wrapper">
            <svg id="paint-pot-svg" viewBox="0 0 200 200" width="160" height="160">
              <path d="M40 70 L50 170 C52 180, 148 180, 150 170 L160 70 Z" fill="#EAEAEA" stroke="#CCCCCC" stroke-width="6"/>
              <ellipse cx="100" cy="70" rx="60" ry="15" fill="#DDDDDD" stroke="#CCCCCC" stroke-width="4"/>
              <!-- Mixed Liquid layer -->
              <ellipse id="mixed-paint-surface" cx="100" cy="110" rx="52" ry="12" fill="transparent"/>
              <path id="mixed-paint-body" d="M44 110 L50 170 C52 178, 148 178, 150 170 L156 110 Z" fill="transparent"/>
              <!-- Paint splatter overlay -->
              <path id="paint-splash" d="M100 110" fill="transparent" class="splash-anim"/>
            </svg>
            <div id="pot-glow-indicator" class="pot-glow"></div>
            <div id="mix-result-bubble" class="result-bubble"></div>
          </div>
        </div>

        <div class="palette-colors-picker">
          <h4 class="palette-section-title">Chọn màu pha trộn:</h4>
          <div class="primary-color-buttons">
            <button id="color-select-Red" class="primary-color-btn color-red" data-color="Red">
              <span class="color-splash-dot" style="background:#FF3B30"></span> Đỏ (Red)
            </button>
            <button id="color-select-Blue" class="primary-color-btn color-blue" data-color="Blue">
              <span class="color-splash-dot" style="background:#007AFF"></span> Xanh dương (Blue)
            </button>
            <button id="color-select-Yellow" class="primary-color-btn color-yellow" data-color="Yellow">
              <span class="color-splash-dot" style="background:#FFCC00"></span> Vàng (Yellow)
            </button>
          </div>
        </div>

        <div class="mixing-feedback-controls">
          <div id="colors-mix-text" class="colors-mix-label">Bé hãy nhấn vào 2 màu để bắt đầu!</div>
          <button id="reset-pot-btn" class="secondary-btn" style="margin-top: 10px; display: none;">Làm sạch lọ 🧹</button>
        </div>
      </div>
    `;

    // Add click listeners to primary colors
    const colorBtns = document.querySelectorAll(".primary-color-btn");
    colorBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const colorName = btn.getAttribute("data-color");
        this.selectColorForPot(colorName, btn);
      });
    });

    document.getElementById("reset-pot-btn").addEventListener("click", () => {
      this.resetPaintPot();
    });

    this.updateRecipeProgress();
  },

  updateRecipeProgress() {
    const purpleBadge = document.getElementById("recipe-purple");
    const orangeBadge = document.getElementById("recipe-orange");
    const greenBadge = document.getElementById("recipe-green");

    if (this.gameState.discoveredCombinations.has("Purple")) purpleBadge.classList.add("unlocked");
    if (this.gameState.discoveredCombinations.has("Orange")) orangeBadge.classList.add("unlocked");
    if (this.gameState.discoveredCombinations.has("Green")) greenBadge.classList.add("unlocked");

    if (this.gameState.discoveredCombinations.size >= 3) {
      setTimeout(() => {
        this.completeGame();
      }, 2500);
    }
  },

  selectColorForPot(colorName, buttonEl) {
    AudioManager.playTap();
    
    // Limit selection
    if (this.gameState.color1 && this.gameState.color2) return;

    if (!this.gameState.color1) {
      this.gameState.color1 = colorName;
      buttonEl.classList.add("color-active");
      document.getElementById("colors-mix-text").innerText = `Đã chọn: ${colorName}. Chọn thêm 1 màu nữa!`;
      this.visualizePaintDrip(colorName);
    } else if (this.gameState.color1 === colorName) {
      // Unselect if same color tapped again
      this.gameState.color1 = null;
      buttonEl.classList.remove("color-active");
      document.getElementById("colors-mix-text").innerText = "Bé hãy nhấn chọn 2 màu!";
      this.resetPaintPotVisualsOnly();
    } else {
      this.gameState.color2 = colorName;
      buttonEl.classList.add("color-active");
      document.getElementById("colors-mix-text").innerText = `Đã chọn: ${this.gameState.color1} + ${this.gameState.color2}...`;
      this.visualizePaintDrip(colorName);
      
      // Perform the mix
      setTimeout(() => {
        this.triggerColorsMixing();
      }, 1000);
    }
  },

  visualizePaintDrip(colorName) {
    const colData = TOPICS_DATA.colors.words.find(w => w.word === colorName);
    const pot = document.getElementById("paint-pot-svg");
    
    // Create an animated drip falling down
    const drip = document.createElementNS("http://www.w3.org/2000/svg", "path");
    drip.setAttribute("d", "M100 20 Q105 35 100 50 T100 110");
    drip.setAttribute("stroke", colData.color);
    drip.setAttribute("stroke-width", "8");
    drip.setAttribute("stroke-linecap", "round");
    drip.setAttribute("fill", "none");
    drip.setAttribute("class", "drip-path-anim");
    pot.appendChild(drip);

    setTimeout(() => {
      drip.remove();
      // Light up surface
      const surface = document.getElementById("mixed-paint-surface");
      const body = document.getElementById("mixed-paint-body");
      
      let baseColor = colData.color;
      if (this.gameState.color2) {
        // Blended mix
        baseColor = "url(#blend-gradient)";
      }

      surface.setAttribute("fill", baseColor);
      body.setAttribute("fill", baseColor);
    }, 600);
  },

  triggerColorsMixing() {
    const c1 = this.gameState.color1;
    const c2 = this.gameState.color2;

    const mix = TOPICS_DATA.colors.mixing.find(m => 
      (m.color1 === c1 && m.color2 === c2) || (m.color1 === c2 && m.color2 === c1)
    );

    const mixText = document.getElementById("colors-mix-text");
    const resultBubble = document.getElementById("mix-result-bubble");
    const glow = document.getElementById("pot-glow-indicator");
    const resetBtn = document.getElementById("reset-pot-btn");

    if (mix) {
      const resultData = TOPICS_DATA.colors.words.find(w => w.word === mix.result);
      
      // Setup gradient for mixed paint
      const pot = document.getElementById("paint-pot-svg");
      let defs = pot.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        pot.insertBefore(defs, pot.firstChild);
      }
      defs.innerHTML = `
        <linearGradient id="blend-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${TOPICS_DATA.colors.words.find(w=>w.word===c1).color}" />
          <stop offset="100%" stop-color="${TOPICS_DATA.colors.words.find(w=>w.word===c2).color}" />
        </linearGradient>
      `;

      // Visual splash effect
      const splash = document.getElementById("paint-splash");
      splash.setAttribute("d", "M80 110 C 70 80, 50 90, 60 110 C 40 120, 60 130, 80 120 C 90 140, 110 140, 120 120 C 140 130, 150 110, 130 100 C 120 70, 100 80, 80 110 Z");
      splash.setAttribute("fill", resultData.color);
      splash.style.display = "block";
      splash.classList.add("paint-splash-explode");

      glow.style.boxShadow = `0 0 35px 15px ${resultData.color}`;
      glow.style.opacity = "0.7";

      AudioManager.playCorrect();
      
      // Add combination to discovered set
      this.gameState.discoveredCombinations.add(mix.result);
      this.updateRecipeProgress();

      setTimeout(() => {
        // Show mixing result bubble
        resultBubble.innerHTML = `<span class="large-mix-emoji">${mix.emoji}</span><br><strong>${mix.result}</strong><br><small>${resultData.vi}</small>`;
        resultBubble.classList.add("pop-in-bubble");
        resultBubble.style.backgroundColor = resultData.color;

        // Speak color mix
        AudioManager.speak(`${c1} and ${c2} make ${mix.result}!`, false, "normal", () => {
          setTimeout(() => {
            AudioManager.speak(mix.result, false);
          }, 400);
        });

        mixText.innerHTML = `<strong style="color: ${resultData.color}">${c1} + ${c2} = ${mix.result} (${resultData.vi})</strong>`;
        resetBtn.style.display = "inline-block";
        
        // Custom confetti from pot
        createConfetti(document.querySelector(".mixing-pot-wrapper"), resultData.color);
      }, 800);

    } else {
      // Not a valid combination (shouldn't happen with primary colors, but clean up just in case)
      mixText.innerText = "Hết màu mất rồi! Hãy làm sạch lọ và trộn lại nhé.";
      resetBtn.style.display = "inline-block";
    }
  },

  resetPaintPotVisualsOnly() {
    const surface = document.getElementById("mixed-paint-surface");
    const body = document.getElementById("mixed-paint-body");
    const splash = document.getElementById("paint-splash");
    const resultBubble = document.getElementById("mix-result-bubble");
    const glow = document.getElementById("pot-glow-indicator");

    surface.setAttribute("fill", "transparent");
    body.setAttribute("fill", "transparent");
    splash.setAttribute("d", "M100 110");
    splash.style.display = "none";
    splash.classList.remove("paint-splash-explode");
    
    resultBubble.classList.remove("pop-in-bubble");
    resultBubble.innerHTML = "";
    glow.style.opacity = "0";
  },

  resetPaintPot() {
    AudioManager.playTap();
    this.gameState.color1 = null;
    this.gameState.color2 = null;

    // Reset buttons UI
    const colorBtns = document.querySelectorAll(".primary-color-btn");
    colorBtns.forEach(btn => btn.classList.remove("color-active"));

    document.getElementById("colors-mix-text").innerText = "Bé hãy nhấn chọn 2 màu!";
    document.getElementById("reset-pot-btn").style.display = "none";

    this.resetPaintPotVisualsOnly();
  },

  // ==========================================
  // 3. PIZZA SHAPE HUNT GAME
  // ==========================================
  initShapesGame(containerId, onComplete) {
    this.activeGame = "shapes";
    this.gameState = {
      trianglesFound: 0,
      totalTriangles: 5,
      shapesClicked: new Set(),
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card shapes-game">
        <h2 class="game-title">Săn hình Tam giác 🍕</h2>
        <p class="game-instruction">Bé hãy tìm và chạm vào tất cả các lát topping hình <strong>TAM GIÁC (Triangle 🔺)</strong> ẩn trên chiếc bánh pizza!</p>

        <div class="game-score-bar">
          <div class="shapes-count-display">
            Tìm được: <span id="shapes-found-count" class="badge-count">0</span> / 5 🔺
          </div>
        </div>

        <div class="pizza-stage">
          <div class="pizza-container" id="pizza-click-stage">
            <!-- Large interactive pizza SVG -->
            <svg viewBox="0 0 300 300" width="280" height="280" style="display:block; margin:0 auto;">
              <!-- Crust -->
              <circle cx="150" cy="150" r="130" fill="#E28743" stroke="#C45A11" stroke-width="6"/>
              <!-- Cheese -->
              <circle cx="150" cy="150" r="115" fill="#FFC93C" stroke="#E28743" stroke-width="2"/>
              
              <!-- Pizza Slices lines (visual) -->
              <line x1="150" y1="20" x2="150" y2="280" stroke="#E28743" stroke-width="2" stroke-dasharray="4,4"/>
              <line x1="20" y1="150" x2="280" y2="150" stroke="#E28743" stroke-width="2" stroke-dasharray="4,4"/>
              <line x1="58" y1="58" x2="242" y2="242" stroke="#E28743" stroke-width="2" stroke-dasharray="4,4"/>
              <line x1="58" y1="242" x2="242" y2="58" stroke="#E28743" stroke-width="2" stroke-dasharray="4,4"/>

              <!-- Toppings: TRIANGLES (Target - Pepperoni Triangles) - Total 5 -->
              <!-- SVG path representing tiny triangles with unique touch handlers -->
              <g id="triangle-0" class="pizza-topping target-shape" data-id="0" style="cursor:pointer;">
                <polygon points="120,80 140,80 130,60" fill="#D32F2F" stroke="#B71C1C" stroke-width="2"/>
                <circle cx="130" cy="74" r="2" fill="#FFE082"/>
              </g>
              <g id="triangle-1" class="pizza-topping target-shape" data-id="1" style="cursor:pointer;">
                <polygon points="180,110 200,120 185,130" fill="#D32F2F" stroke="#B71C1C" stroke-width="2"/>
                <circle cx="188" cy="120" r="2" fill="#FFE082"/>
              </g>
              <g id="triangle-2" class="pizza-topping target-shape" data-id="2" style="cursor:pointer;">
                <polygon points="100,180 120,200 95,200" fill="#D32F2F" stroke="#B71C1C" stroke-width="2"/>
                <circle cx="108" cy="193" r="2" fill="#FFE082"/>
              </g>
              <g id="triangle-3" class="pizza-topping target-shape" data-id="3" style="cursor:pointer;">
                <polygon points="160,200 170,225 150,220" fill="#D32F2F" stroke="#B71C1C" stroke-width="2"/>
                <circle cx="160" cy="215" r="2" fill="#FFE082"/>
              </g>
              <g id="triangle-4" class="pizza-topping target-shape" data-id="4" style="cursor:pointer;">
                <polygon points="70,110 90,95 85,115" fill="#D32F2F" stroke="#B71C1C" stroke-width="2"/>
                <circle cx="82" cy="107" r="2" fill="#FFE082"/>
              </g>

              <!-- Toppings: CIRCLES (Olives) -->
              <circle class="pizza-topping decoy-shape" cx="150" cy="100" r="8" fill="#37474F" stroke="#212121" stroke-width="2"/>
              <circle class="pizza-topping decoy-shape" cx="210" cy="170" r="8" fill="#37474F" stroke="#212121" stroke-width="2"/>
              <circle class="pizza-topping decoy-shape" cx="90" cy="150" r="8" fill="#37474F" stroke="#212121" stroke-width="2"/>

              <!-- Toppings: SQUARES (Pineapples / Ham Squares) -->
              <rect class="pizza-topping decoy-shape" x="150" y="145" width="14" height="14" rx="2" fill="#FFB300" stroke="#FF8F00" stroke-width="2"/>
              <rect class="pizza-topping decoy-shape" x="200" y="80" width="14" height="14" rx="2" fill="#FFB300" stroke="#FF8F00" stroke-width="2"/>
              <rect class="pizza-topping decoy-shape" x="120" y="220" width="14" height="14" rx="2" fill="#FFB300" stroke="#FF8F00" stroke-width="2"/>
              <rect class="pizza-topping decoy-shape" x="70" y="180" width="14" height="14" rx="2" fill="#FFB300" stroke="#FF8F00" stroke-width="2"/>

              <!-- Toppings: RECTANGLES (Green Bell Pepper strips) -->
              <rect class="pizza-topping decoy-shape" x="100" y="120" width="6" height="18" rx="2" transform="rotate(30 100 120)" fill="#2E7D32" stroke="#1B5E20" stroke-width="1.5"/>
              <rect class="pizza-topping decoy-shape" x="180" y="160" width="6" height="18" rx="2" transform="rotate(-40 180 160)" fill="#2E7D32" stroke="#1B5E20" stroke-width="1.5"/>
              
              <!-- Toppings: OVALS (Mushrooms) -->
              <g class="pizza-topping decoy-shape">
                <ellipse cx="140" cy="170" rx="10" ry="7" fill="#D7CCC8" stroke="#8D6E63" stroke-width="1.5"/>
                <rect x="137" y="174" width="6" height="8" fill="#8D6E63"/>
              </g>
              <g class="pizza-topping decoy-shape">
                <ellipse cx="110" cy="95" rx="10" ry="7" fill="#D7CCC8" stroke="#8D6E63" stroke-width="1.5" transform="rotate(45 110 95)"/>
                <rect x="107" y="99" width="6" height="8" fill="#8D6E63" transform="rotate(45 110 95)"/>
              </g>
            </svg>
          </div>
        </div>

        <div id="shapes-feedback" class="game-feedback-text"></div>
      </div>
    `;

    // Hook up target triangles click
    const targets = document.querySelectorAll(".target-shape");
    targets.forEach(el => {
      el.addEventListener("click", (evt) => {
        const id = el.getAttribute("data-id");
        this.clickTargetShape(id, el, evt);
      });
    });

    // Hook up decoy shapes click
    const decoys = document.querySelectorAll(".decoy-shape");
    decoys.forEach(el => {
      el.addEventListener("click", () => {
        this.clickDecoyShape(el);
      });
    });

    // Speak initial cue
    setTimeout(() => {
      AudioManager.speak("Triangle", false);
    }, 500);
  },

  clickTargetShape(id, element, event) {
    if (this.gameState.shapesClicked.has(id)) return;
    this.gameState.shapesClicked.add(id);

    this.gameState.trianglesFound++;
    document.getElementById("shapes-found-count").innerText = this.gameState.trianglesFound;

    // Visual effect on found element
    element.classList.add("shape-found-glow");
    
    // Play sound
    AudioManager.playCorrect();
    createConfetti(element);

    // Speak target name
    AudioManager.speak("Triangle", false);

    const feedback = document.getElementById("shapes-feedback");
    feedback.innerHTML = `<span class="happy-msg">Tuyệt quá! Tìm thấy 1 hình tam giác (Triangle) rồi! 🔺</span>`;

    if (this.gameState.trianglesFound >= this.gameState.totalTriangles) {
      setTimeout(() => {
        this.completeGame();
      }, 1500);
    } else {
      setTimeout(() => {
        feedback.innerText = "";
      }, 1500);
    }
  },

  clickDecoyShape(element) {
    AudioManager.playTap();
    
    // Shake decoy
    element.classList.add("incorrect-shake");
    setTimeout(() => {
      element.classList.remove("incorrect-shake");
    }, 800);

    const feedback = document.getElementById("shapes-feedback");
    feedback.innerHTML = `<span class="retry-msg">Đó chưa phải hình tam giác rồi, bé tìm lại xem nào! 🍕</span>`;
    
    setTimeout(() => {
      if (feedback.innerHTML.includes("tìm lại xem")) {
        feedback.innerText = "";
      }
    }, 2000);
  },

  // ==========================================
  // 4. ANIMAL SOUND MATCHING GAME
  // ==========================================
  initAnimalsGame(containerId, onComplete) {
    this.activeGame = "animals";
    this.gameState = {
      score: 0,
      targetScore: 3,
      currentQuestion: null,
      options: [],
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card animals-game">
        <h2 class="game-title">Tiếng ai kêu đó? 🐧</h2>
        <p class="game-instruction">Nghe âm thanh và đoán xem đó là con vật nào nhé!</p>

        <div class="game-score-bar">
          <div class="game-stars-progress">
            <span class="animal-star-indicator">⭐</span>
            <span class="animal-star-indicator">⭐</span>
            <span class="animal-star-indicator">⭐</span>
          </div>
        </div>

        <div class="game-action-center">
          <button id="animals-listen-btn" class="speak-btn pulse-button">
            🔊 Nghe Tiếng Kêu
          </button>
        </div>

        <div id="animals-options" class="animals-grid"></div>
        <div id="animals-feedback" class="game-feedback-text"></div>
      </div>
    `;

    document.getElementById("animals-listen-btn").addEventListener("click", () => {
      if (this.gameState.currentQuestion) {
        AudioManager.playAnimalSound(this.gameState.currentQuestion.soundType);
      }
    });

    this.nextAnimalsQuestion();
  },

  nextAnimalsQuestion() {
    document.getElementById("animals-feedback").innerText = "";

    const stars = document.querySelectorAll(".animal-star-indicator");
    stars.forEach((star, idx) => {
      if (idx < this.gameState.score) {
        star.classList.add("earned");
        star.style.opacity = "1";
      } else {
        star.classList.remove("earned");
        star.style.opacity = "0.3";
      }
    });

    if (this.gameState.score >= this.gameState.targetScore) {
      this.completeGame();
      return;
    }

    const animalsData = TOPICS_DATA.animals.words;

    // Pick target
    const target = animalsData[Math.floor(Math.random() * animalsData.length)];
    this.gameState.currentQuestion = target;

    // Play animal sound automatically after brief delay
    setTimeout(() => {
      AudioManager.playAnimalSound(target.soundType);
    }, 450);

    // Get 3 options (1 target, 2 distractors)
    let options = [target];
    while (options.length < 3) {
      const r = animalsData[Math.floor(Math.random() * animalsData.length)];
      if (!options.some(o => o.word === r.word)) {
        options.push(r);
      }
    }
    options.sort(() => Math.random() - 0.5);
    this.gameState.options = options;

    // Render option cards
    const grid = document.getElementById("animals-options");
    grid.innerHTML = "";

    options.forEach(opt => {
      const card = document.createElement("button");
      card.className = "animal-option-card";
      card.innerHTML = `
        <span class="animal-emoji">${opt.emoji}</span>
        <span class="animal-label-vi hidden-trans">${opt.vi}</span>
      `;

      const settings = AudioManager.getSettings();
      if (settings.showTranslation) {
        card.querySelector(".animal-label-vi").classList.remove("hidden-trans");
      }

      card.addEventListener("click", () => this.handleAnimalSelect(opt, card));
      grid.appendChild(card);
    });
  },

  handleAnimalSelect(selected, element) {
    const isCorrect = selected.word === this.gameState.currentQuestion.word;
    const cards = document.querySelectorAll(".animal-option-card");
    cards.forEach(c => c.style.pointerEvents = "none");

    if (isCorrect) {
      element.classList.add("correct-bounce");
      AudioManager.playCorrect();
      createConfetti(element);
      this.gameState.score++;

      const feedback = document.getElementById("animals-feedback");
      feedback.innerHTML = `<span class="happy-msg">Chính xác! Đó là ${selected.vi} (${selected.word}) 🐾</span>`;

      // Speak english animal name
      setTimeout(() => {
        AudioManager.speak(selected.word, false);
      }, 500);

      setTimeout(() => {
        this.nextAnimalsQuestion();
      }, 2200);
    } else {
      element.classList.add("incorrect-shake");
      AudioManager.playTap();

      const feedback = document.getElementById("animals-feedback");
      feedback.innerHTML = `<span class="retry-msg">Gần trúng rồi! Nghe lại tiếng kêu xem sao nhé! 👂</span>`;

      setTimeout(() => {
        element.classList.remove("incorrect-shake");
        cards.forEach(c => c.style.pointerEvents = "auto");
        feedback.innerText = "";
      }, 1200);
    }
  },

  // ==========================================
  // GAME COMPLETION HELPER
  // ==========================================
  completeGame() {
    const active = this.activeGame;
    // Play celebratory chime
    AudioManager.playCorrect();
    
    // Add big confetti trigger on container
    const card = document.querySelector(".game-card");
    createConfetti(card, null, 40);

    card.innerHTML = `
      <div class="game-victory-screen animate-victory">
        <h2 class="victory-emoji">✨🏆✨</h2>
        <h3 class="victory-title">Bé Thật Tuyệt Vời!</h3>
        <p class="victory-message">Con đã hoàn thành xuất sắc trò chơi này!</p>
        <div class="victory-stars">⭐ ⭐ ⭐</div>
        <button id="victory-continue-btn" class="main-action-btn">
          Nhận thưởng và quay về 🌟
        </button>
      </div>
    `;

    document.getElementById("victory-continue-btn").addEventListener("click", () => {
      AudioManager.playTap();
      if (this.gameState.onComplete) {
        this.gameState.onComplete();
      }
    });
  }
};

// Simple confetti generator using purely JS and CSS transitions for lightweight offline usage
function createConfetti(targetEl, customColor = null, count = 15) {
  const container = document.createElement("div");
  container.className = "confetti-explosion-container";
  document.body.appendChild(container);

  // Position container near the target element
  const rect = targetEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2 + window.scrollY;

  const colors = customColor ? [customColor] : ["#FF6B8B", "#FFD166", "#06D6A0", "#118AB2", "#AF52DE"];

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "confetti-particle";
    
    const size = Math.random() * 8 + 6;
    const col = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = col;
    particle.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;

    // Explode angles
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 30;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - (Math.random() * 50); // blow upwards slightly

    particle.style.setProperty("--tx", `${destX}px`);
    particle.style.setProperty("--ty", `${destY}px`);
    particle.style.setProperty("--rot", `${Math.random() * 360}deg`);

    container.appendChild(particle);
  }

  // Remove elements after animation completes
  setTimeout(() => {
    container.remove();
  }, 1200);
}
