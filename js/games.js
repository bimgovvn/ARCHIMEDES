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
  },

  // ==========================================
  // 5. FRUITS & VEGETABLES MATCH GAME
  // ==========================================
  initFruitsGame(containerId, onComplete) {
    this.activeGame = "fruits";
    this.gameState = {
      score: 0,
      targetScore: 3,
      currentQuestion: null,
      options: [],
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card fruits-game" style="border-color: var(--primary-pink)">
        <h2 class="game-title" style="color: var(--primary-pink)">Chợ Quả Ngọt 🍓</h2>
        <p class="game-instruction">Nghe kỹ phát âm tiếng Anh và chọn loại quả tương ứng nhé!</p>
        
        <div class="game-score-bar">
          <div class="game-stars-progress">
            <span class="fruit-star-indicator">⭐</span>
            <span class="fruit-star-indicator">⭐</span>
            <span class="fruit-star-indicator">⭐</span>
          </div>
        </div>

        <div class="game-action-center">
          <button id="fruits-listen-btn" class="speak-btn pulse-button" style="background-color: var(--primary-pink); box-shadow: 0 5px 0 #b93d56;">
            🔊 Nghe Gọi Tên
          </button>
        </div>

        <div id="fruits-options" class="animals-grid"></div>
        <div id="fruits-feedback" class="game-feedback-text"></div>
      </div>
    `;

    document.getElementById("fruits-listen-btn").addEventListener("click", () => {
      if (this.gameState.currentQuestion) {
        AudioManager.speak(this.gameState.currentQuestion.word, false);
      }
    });

    this.nextFruitsQuestion();
  },

  nextFruitsQuestion() {
    document.getElementById("fruits-feedback").innerText = "";

    const stars = document.querySelectorAll(".fruit-star-indicator");
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

    const fruitsData = TOPICS_DATA.fruits.words;

    // Pick target
    const target = fruitsData[Math.floor(Math.random() * fruitsData.length)];
    this.gameState.currentQuestion = target;

    // Play English pronunciation automatically
    setTimeout(() => {
      AudioManager.speak(target.word, false);
    }, 450);

    // Get 3 options (1 target, 2 distractors)
    let options = [target];
    while (options.length < 3) {
      const r = fruitsData[Math.floor(Math.random() * fruitsData.length)];
      if (!options.some(o => o.word === r.word)) {
        options.push(r);
      }
    }
    options.sort(() => Math.random() - 0.5);
    this.gameState.options = options;

    // Render option cards
    const grid = document.getElementById("fruits-options");
    grid.innerHTML = "";

    options.forEach(opt => {
      const card = document.createElement("button");
      card.className = "animal-option-card";
      card.style.borderColor = "#FFCCD5";
      card.innerHTML = `
        <span class="animal-emoji">${opt.emoji}</span>
        <span class="animal-label-vi hidden-trans">${opt.vi}</span>
      `;

      const settings = AudioManager.getSettings();
      if (settings.showTranslation) {
        card.querySelector(".animal-label-vi").classList.remove("hidden-trans");
      }

      card.addEventListener("click", () => this.handleFruitSelect(opt, card));
      grid.appendChild(card);
    });
  },

  handleFruitSelect(selected, element) {
    const isCorrect = selected.word === this.gameState.currentQuestion.word;
    const cards = document.querySelectorAll(".animal-option-card");
    cards.forEach(c => c.style.pointerEvents = "none");

    if (isCorrect) {
      element.classList.add("correct-bounce");
      element.style.borderColor = "var(--primary-green)";
      element.style.backgroundColor = "var(--bg-light-green)";
      
      AudioManager.playCorrect();
      createConfetti(element);
      this.gameState.score++;

      const feedback = document.getElementById("fruits-feedback");
      feedback.innerHTML = `<span class="happy-msg">Giỏi quá! Đó là ${selected.vi} (${selected.word}) 🍓</span>`;

      // Speak english fruit name again
      setTimeout(() => {
        AudioManager.speak(selected.word, false);
      }, 500);

      setTimeout(() => {
        this.nextFruitsQuestion();
      }, 2200);
    } else {
      element.classList.add("incorrect-shake");
      element.style.borderColor = "var(--primary-pink)";
      element.style.backgroundColor = "var(--bg-light-pink)";
      AudioManager.playTap();

      const feedback = document.getElementById("fruits-feedback");
      feedback.innerHTML = `<span class="retry-msg">Chưa đúng rồi! Bé nghe lại phát âm nhé! 👂</span>`;

      setTimeout(() => {
        element.classList.remove("incorrect-shake");
        element.style.borderColor = "#FFCCD5";
        element.style.backgroundColor = "#FFFFFF";
        cards.forEach(c => c.style.pointerEvents = "auto");
        feedback.innerText = "";
      }, 1200);
    }
  },

  // ==========================================
  // CHALLENGE 1: TURTLE MATH MATCH GAME
  // ==========================================
  initTurtleMathGame(containerId, onComplete) {
    this.activeGame = "turtle_math";
    this.gameState = {
      selectedEquation: null,
      selectedEquationEl: null,
      connectedCount: 0,
      totalPairs: 4,
      onComplete: onComplete
    };

    const equations = [
      { id: "eq1", text: "2 + 1", result: 3 },
      { id: "eq2", text: "5 - 3", result: 2 },
      { id: "eq3", text: "3 + 2", result: 5 },
      { id: "eq4", text: "2 + 2", result: 4 }
    ];

    const turtles = [
      { result: 2, label: "🐢 Rùa số 2" },
      { result: 3, label: "🐢 Rùa số 3" },
      { result: 4, label: "🐢 Rùa số 4" },
      { result: 5, label: "🐢 Rùa số 5" }
    ];

    // Shuffle both lists for randomness
    equations.sort(() => Math.random() - 0.5);
    turtles.sort(() => Math.random() - 0.5);

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card math-game" style="border-color: var(--primary-blue)">
        <h2 class="game-title" style="color: var(--primary-blue)">Phép tính Rùa 🐢</h2>
        <p class="game-instruction">Chạm phép tính bên trái, sau đó chạm chú Rùa mang kết quả đúng bên phải!</p>
        
        <div class="math-match-container">
          <div class="equation-col" id="eq-column"></div>
          <div class="turtle-col" id="turtle-column"></div>
        </div>
        
        <div id="math-feedback" class="game-feedback-text"></div>
      </div>
    `;

    const eqCol = document.getElementById("eq-column");
    const turtleCol = document.getElementById("turtle-column");

    equations.forEach(eq => {
      const btn = document.createElement("button");
      btn.className = "equation-btn";
      btn.innerText = eq.text;
      btn.dataset.id = eq.id;
      btn.dataset.result = eq.result;
      
      btn.addEventListener("click", () => {
        AudioManager.playTap();
        // Remove selection from all equation buttons
        document.querySelectorAll(".equation-btn").forEach(b => b.classList.remove("selected"));
        
        this.gameState.selectedEquation = eq;
        this.gameState.selectedEquationEl = btn;
        btn.classList.add("selected");
      });
      eqCol.appendChild(btn);
    });

    turtles.forEach(t => {
      const btn = document.createElement("button");
      btn.className = "turtle-btn";
      btn.innerText = t.label;
      btn.dataset.result = t.result;

      btn.addEventListener("click", () => {
        if (!this.gameState.selectedEquation) {
          AudioManager.playTap();
          const feedback = document.getElementById("math-feedback");
          feedback.innerHTML = `<span class="retry-msg">Bé hãy chọn phép tính bên trái trước nhé! 👉</span>`;
          return;
        }

        const eq = this.gameState.selectedEquation;
        const eqEl = this.gameState.selectedEquationEl;

        const isCorrect = eq.result === t.result;

        if (isCorrect) {
          AudioManager.playCorrect();
          createConfetti(btn);

          // Mark as connected
          eqEl.classList.remove("selected");
          eqEl.classList.add("connected");
          btn.classList.add("connected");
          
          eqEl.innerText = `${eq.text} = ${eq.result} ✓`;
          btn.innerText = `🐢 Số ${t.result} ✓`;

          this.gameState.selectedEquation = null;
          this.gameState.selectedEquationEl = null;
          this.gameState.connectedCount++;

          const feedback = document.getElementById("math-feedback");
          feedback.innerHTML = `<span class="happy-msg">Chính xác! ${eq.text} = ${eq.result} 🎉</span>`;

          if (this.gameState.connectedCount >= this.gameState.totalPairs) {
            setTimeout(() => {
              this.completeGame();
            }, 1500);
          }
        } else {
          AudioManager.playTap();
          btn.classList.add("incorrect-shake");
          eqEl.classList.add("incorrect-shake");

          const feedback = document.getElementById("math-feedback");
          feedback.innerHTML = `<span class="retry-msg">Tính lại xem nào, ${eq.text} không bằng ${t.result} đâu bé yêu! 💪</span>`;

          setTimeout(() => {
            btn.classList.remove("incorrect-shake");
            eqEl.classList.remove("incorrect-shake");
          }, 1000);
        }
      });
      turtleCol.appendChild(btn);
    });
  },

  // ==========================================
  // CHALLENGE 2: SOUND HUNT GAME
  // ==========================================
  initSoundHuntGame(containerId, onComplete) {
    this.activeGame = "sound_hunt";
    
    // Choose either target letter "l" or "r"
    const targetLetter = Math.random() > 0.5 ? "l" : "r";
    
    const wordsPool = targetLetter === "l" ? [
      { word: "lá", correct: true },
      { word: "lò cò", correct: true },
      { word: "cò lả", correct: true },
      { word: "le le", correct: true },
      { word: "lác cờ", correct: true },
      { word: "đỏ", correct: false },
      { word: "nơ", correct: false },
      { word: "bố mẹ", correct: false },
      { word: "ca nô", correct: false }
    ] : [
      { word: "gà ri", correct: true },
      { word: "đi ra", correct: true },
      { word: "nở rộ", correct: true },
      { word: "rễ đa", correct: true },
      { word: "rò rỉ", correct: true },
      { word: "lọ sứ", correct: false },
      { word: "do dự", correct: false },
      { word: "tô đỏ", correct: false },
      { word: "kẻ ô", correct: false }
    ];

    // Shuffle pool
    wordsPool.sort(() => Math.random() - 0.5);

    const totalTargets = wordsPool.filter(w => w.correct).length;

    this.gameState = {
      targetLetter: targetLetter,
      words: wordsPool,
      foundCount: 0,
      totalTargets: totalTargets,
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card sound-game" style="border-color: var(--primary-green)">
        <h2 class="game-title" style="color: var(--primary-green)">Săn âm tìm chữ 🔍</h2>
        <p class="game-instruction">Hãy tìm tất cả các từ có chứa âm <strong style="font-size: 20px; color: var(--primary-pink);">'${targetLetter.toUpperCase()}'</strong> nhé!</p>
        
        <div style="font-size: 14px; font-weight: 800; margin-top: 8px;">
          Đã tìm được: <span id="hunt-found-count" class="badge-count" style="background-color: var(--bg-light-green); color: var(--primary-green);">0</span> / ${totalTargets} từ
        </div>

        <div id="sound-hunt-options" class="sound-hunt-grid"></div>
        <div id="hunt-feedback" class="game-feedback-text"></div>
      </div>
    `;

    const grid = document.getElementById("sound-hunt-options");
    wordsPool.forEach((item, idx) => {
      const card = document.createElement("button");
      card.className = "sound-option-card";
      card.innerText = item.word;

      card.addEventListener("click", () => {
        if (card.classList.contains("correct")) return;

        if (item.correct) {
          AudioManager.playCorrect();
          createConfetti(card);
          card.classList.add("correct");
          card.innerText = `${item.word} ✓`;

          this.gameState.foundCount++;
          document.getElementById("hunt-found-count").innerText = this.gameState.foundCount;

          const feedback = document.getElementById("hunt-feedback");
          feedback.innerHTML = `<span class="happy-msg">Đúng rồi! Từ "${item.word}" có chứa âm '${targetLetter}'! 🎉</span>`;

          if (this.gameState.foundCount >= this.gameState.totalTargets) {
            setTimeout(() => {
              this.completeGame();
            }, 1800);
          }
        } else {
          AudioManager.playTap();
          card.classList.add("incorrect-shake");

          const feedback = document.getElementById("hunt-feedback");
          feedback.innerHTML = `<span class="retry-msg">Từ "${item.word}" không chứa âm '${targetLetter}' rồi bé ơi! 🥺</span>`;

          setTimeout(() => {
            card.classList.remove("incorrect-shake");
          }, 1000);
        }
      });

      grid.appendChild(card);
    });
  },

  // ==========================================
  // CHALLENGE 3: SENTENCE BUILDER GAME
  // ==========================================
  initSentenceBuilderGame(containerId, onComplete) {
    this.activeGame = "sentence_builder";
    
    const correctOrder = ["Bà", "có", "su su,", "củ sả."];
    const initialPool = ["có", "Bà", "củ sả.", "su su,"];
    
    this.gameState = {
      correctOrder: correctOrder,
      placedWords: [],
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card sentence-game" style="border-color: var(--primary-pink)">
        <h2 class="game-title" style="color: var(--primary-pink)">Ghép câu hoàn chỉnh ✍️</h2>
        <p class="game-instruction">Chạm các khối từ dưới đây theo đúng thứ tự để tạo câu tiếng Việt có nghĩa nhé!</p>
        
        <div class="sentence-dropzone" id="sentence-zone">
          <span style="color: #A0AEC0; font-size: 14px; font-weight: 700;">Câu của bé sẽ hiện ở đây...</span>
        </div>

        <div class="sentence-word-pool" id="word-pool"></div>
        
        <div style="display: flex; gap: 10px; width: 100%; justify-content: center; margin-top: 10px;">
          <button id="btn-sentence-reset" class="secondary-btn" style="background-color: var(--primary-pink); color: white;">Làm lại 🧹</button>
        </div>
        <div id="sentence-feedback" class="game-feedback-text"></div>
      </div>
    `;

    const renderPool = () => {
      const poolContainer = document.getElementById("word-pool");
      poolContainer.innerHTML = "";

      initialPool.forEach((word, idx) => {
        const btn = document.createElement("button");
        btn.className = "sentence-word-btn";
        btn.innerText = word;
        btn.dataset.index = idx;

        const isUsed = this.gameState.placedWords.some(item => item.idx === idx);
        if (isUsed) {
          btn.classList.add("used");
        }

        btn.addEventListener("click", () => {
          AudioManager.playTap();
          this.gameState.placedWords.push({ word: word, idx: idx });
          
          btn.classList.add("used");
          updateDropzone();
          checkSentenceResult();
        });

        poolContainer.appendChild(btn);
      });
    };

    const updateDropzone = () => {
      const zone = document.getElementById("sentence-zone");
      zone.innerHTML = "";

      if (this.gameState.placedWords.length === 0) {
        zone.innerHTML = `<span style="color: #A0AEC0; font-size: 14px; font-weight: 700;">Câu của bé sẽ hiện ở đây...</span>`;
        return;
      }

      this.gameState.placedWords.forEach(item => {
        const bubble = document.createElement("span");
        bubble.className = "recipe-badge unlocked";
        bubble.style.fontSize = "16px";
        bubble.style.padding = "8px 14px";
        bubble.innerText = item.word;
        zone.appendChild(bubble);
      });
    };

    const checkSentenceResult = () => {
      if (this.gameState.placedWords.length < correctOrder.length) return;

      const userSentence = this.gameState.placedWords.map(item => item.word);
      
      // Check correct sequence
      const isCorrect = userSentence.every((w, i) => w === correctOrder[i]);

      const feedback = document.getElementById("sentence-feedback");
      if (isCorrect) {
        AudioManager.playCorrect();
        createConfetti(document.getElementById("sentence-zone"));

        feedback.innerHTML = `<span class="happy-msg">Tuyệt vời! Bé đã ghép đúng câu: "Bà có su su, củ sả." 🎉</span>`;
        
        setTimeout(() => {
          this.completeGame();
        }, 2200);
      } else {
        AudioManager.playTap();
        const zone = document.getElementById("sentence-zone");
        zone.classList.add("incorrect-shake");
        
        feedback.innerHTML = `<span class="retry-msg">Câu ghép chưa đúng nghĩa rồi bé ơi. Hãy nhấn nút làm lại nhé! 🧹</span>`;
        
        setTimeout(() => {
          zone.classList.remove("incorrect-shake");
        }, 1000);
      }
    };

    document.getElementById("btn-sentence-reset").addEventListener("click", () => {
      AudioManager.playTap();
      this.gameState.placedWords = [];
      document.getElementById("sentence-feedback").innerText = "";
      updateDropzone();
      renderPool();
    });

    renderPool();
  },

  // ==========================================
  // CHALLENGE 4: BALLOON POP GAME
  // ==========================================
  initBalloonPopGame(containerId, onComplete) {
    this.activeGame = "balloon_pop";
    
    // Choose to target even or odd numbers
    const targetType = Math.random() > 0.5 ? "even" : "odd";

    const numbers = [
      { val: 1, type: "odd" },
      { val: 2, type: "even" },
      { val: 3, type: "odd" },
      { val: 4, type: "even" },
      { val: 5, type: "odd" },
      { val: 6, type: "even" },
      { val: 7, type: "odd" },
      { val: 8, type: "even" }
    ];

    const targetCount = numbers.filter(n => n.type === targetType).length;

    this.gameState = {
      targetType: targetType,
      numbers: numbers,
      poppedCount: 0,
      totalTargets: targetCount,
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card balloons-game" style="border-color: var(--primary-yellow)">
        <h2 class="game-title" style="color: var(--primary-yellow); filter: brightness(0.8);">Bóng bay số học 🎈</h2>
        <p class="game-instruction">Hãy chạm nổ các bong bóng mang số <strong style="font-size: 20px; color: var(--primary-pink);">${targetType === "even" ? "CHẴN" : "LẺ"}</strong> nhé!</p>
        
        <div style="font-size: 14px; font-weight: 800; margin-top: 8px;">
          Đã nổ: <span id="balloons-popped-count" class="badge-count" style="background-color: var(--bg-light-yellow); color: var(--primary-yellow); filter: brightness(0.85);">0</span> / ${targetCount} bóng
        </div>

        <div id="balloons-list" class="balloons-container"></div>
        <div id="balloons-feedback" class="game-feedback-text"></div>
      </div>
    `;

    const balloonArea = document.getElementById("balloons-list");
    
    // Define cute colors for balloons
    const balloonColors = ["#FF6B8B", "#FFD166", "#06D6A0", "#118AB2", "#AF52DE", "#FF9500", "#52DEAF", "#AFDE52"];

    numbers.forEach((num, idx) => {
      const balloon = document.createElement("button");
      balloon.className = "balloon-item";
      balloon.innerText = num.val;
      balloon.style.backgroundColor = balloonColors[idx % balloonColors.length];
      balloon.style.color = "#FFFFFF";
      balloon.style.borderColor = balloonColors[idx % balloonColors.length];

      balloon.addEventListener("click", () => {
        if (balloon.classList.contains("popped")) return;

        const isCorrect = num.type === targetType;

        if (isCorrect) {
          AudioManager.playCorrect();
          createConfetti(balloon);
          balloon.classList.add("popped");

          this.gameState.poppedCount++;
          document.getElementById("balloons-popped-count").innerText = this.gameState.poppedCount;

          const feedback = document.getElementById("balloons-feedback");
          feedback.innerHTML = `<span class="happy-msg">Bùm! Đúng rồi, số ${num.val} là số ${targetType === "even" ? "chẵn" : "lẻ"}! 🎈</span>`;

          if (this.gameState.poppedCount >= this.gameState.totalTargets) {
            setTimeout(() => {
              this.completeGame();
            }, 1500);
          }
        } else {
          AudioManager.playTap();
          balloon.classList.add("incorrect-shake");

          const feedback = document.getElementById("balloons-feedback");
          feedback.innerHTML = `<span class="retry-msg">Ôi, số ${num.val} là số ${num.type === "even" ? "chẵn" : "lẻ"} mà bé ơi! 🥺</span>`;

          setTimeout(() => {
            balloon.classList.remove("incorrect-shake");
          }, 1000);
        }
      });

      balloonArea.appendChild(balloon);
    });
  },

  // ==========================================
  // CHALLENGE 5: STORY QUIZ GAME
  // ==========================================
  initStoryQuizGame(containerId, onComplete) {
    this.activeGame = "story_quiz";
    
    const questions = [
      {
        q: "1. Để được sang nhà bạn Khỉ chơi, Gấu con đã xin phép ai?",
        options: [
          { text: "A. Gấu mẹ", correct: true },
          { text: "B. Gấu bố", correct: false },
          { text: "C. Bác Voi", correct: false }
        ]
      },
      {
        q: "2. Gấu con đâm sầm vào Sóc làm đổ giỏ quả. Gấu con cần nói gì?",
        options: [
          { text: "A. Cháu cảm ơn Sóc!", correct: false },
          { text: "B. Tớ xin lỗi Sóc nhé!", correct: true },
          { text: "C. Chào buổi sáng bạn Sóc!", correct: false }
        ]
      },
      {
        q: "3. Khi bác Voi cứu Gấu con khỏi hố sâu, Gấu con đã nói gì?",
        options: [
          { text: "A. Cháu xin lỗi bác!", correct: false },
          { text: "B. Cháu cảm ơn bác Voi ạ!", correct: true },
          { text: "C. Chúc bác ngủ ngon!", correct: false }
        ]
      }
    ];

    this.gameState = {
      questions: questions,
      currentIdx: 0,
      onComplete: onComplete
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card quiz-game" style="border-color: var(--primary-pink)">
        <h2 class="game-title" style="color: var(--primary-pink)">Chuyện kể Gấu con 🐻</h2>
        <p class="game-instruction">Hãy trả lời 3 câu hỏi trắc nghiệm kiểm tra bài học của Gấu con nhé!</p>
        
        <div style="font-size: 14px; font-weight: 800; margin-top: 8px;">
          Tiến trình: <span id="quiz-progress-text" class="badge-count" style="background-color: var(--bg-light-pink); color: var(--primary-pink);">1 / 3</span> câu hỏi
        </div>

        <div id="quiz-question-box" style="margin-top: 16px; font-size: 16px; font-weight: 800; text-align: left; color: var(--text-dark);"></div>
        <div id="quiz-options" class="quiz-options-container"></div>
        <div id="quiz-feedback" class="game-feedback-text"></div>
      </div>
    `;

    this.renderQuizQuestion();
  },

  renderQuizQuestion() {
    document.getElementById("quiz-feedback").innerText = "";

    const idx = this.gameState.currentIdx;
    const qData = this.gameState.questions[idx];

    document.getElementById("quiz-progress-text").innerText = `${idx + 1} / 3`;
    document.getElementById("quiz-question-box").innerText = qData.q;

    const optionsContainer = document.getElementById("quiz-options");
    optionsContainer.innerHTML = "";

    qData.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "quiz-option-btn";
      btn.innerText = opt.text;

      btn.addEventListener("click", () => {
        // Disable other buttons during answer highlight
        document.querySelectorAll(".quiz-option-btn").forEach(b => b.style.pointerEvents = "none");

        if (opt.correct) {
          AudioManager.playCorrect();
          createConfetti(btn);
          btn.classList.add("correct");

          const feedback = document.getElementById("quiz-feedback");
          feedback.innerHTML = `<span class="happy-msg">Tuyệt vời! Bé đã trả lời đúng câu hỏi này! 🎉</span>`;

          setTimeout(() => {
            this.gameState.currentIdx++;
            if (this.gameState.currentIdx < this.gameState.questions.length) {
              this.renderQuizQuestion();
            } else {
              this.completeGame();
            }
          }, 2000);
        } else {
          AudioManager.playTap();
          btn.classList.add("incorrect");
          
          const feedback = document.getElementById("quiz-feedback");
          feedback.innerHTML = `<span class="retry-msg">Bé chọn lại xem nào, câu trả lời này chưa chính xác rồi! 💪</span>`;

          setTimeout(() => {
            btn.classList.remove("incorrect");
            document.querySelectorAll(".quiz-option-btn").forEach(b => b.style.pointerEvents = "auto");
          }, 1500);
        }
      });

      optionsContainer.appendChild(btn);
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
