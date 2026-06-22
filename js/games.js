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
  },

  // ==========================================
  // 6. FRUITS MARKET GAME
  // ==========================================
  initFruitsGame(containerId, onComplete) {
    this.activeGame = "fruits";
    this.gameState = {
      score: 0,
      targetScore: 7,
      currentQuestion: null,
      options: [],
      onComplete: onComplete,
      basketFruits: []
    };

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="game-card fruits-market-game" style="border-color: var(--primary-pink); padding: 16px;">
        <h2 class="game-title" style="color: var(--primary-pink)">Chợ Quả Ngọt 🛒</h2>
        <p class="game-instruction">Nghe yêu cầu và chọn quả xếp vào giỏ hàng nhé!</p>
        
        <div class="game-score-bar">
          <div id="fruits-stars-progress" class="game-stars-progress"></div>
        </div>

        <div class="game-action-center" style="margin: 8px 0;">
          <button id="fruits-listen-btn" class="speak-btn pulse-button" style="background-color: var(--primary-pink); box-shadow: 0 5px 0 #d94b6c, var(--shadow-playful);">
            🔊 Nghe Yêu Cầu
          </button>
        </div>

        <div class="market-shelves" style="width: 100%; display: flex; flex-direction: column; gap: 12px; margin: 12px 0;">
          <div id="fruits-options" class="feelings-grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;"></div>
        </div>

        <div class="market-basket-section" style="width: 100%; display: flex; flex-direction: column; align-items: center; margin-top: 10px;">
          <div style="font-size: 13px; font-weight: 800; color: #718096; margin-bottom: 4px;">Giỏ hàng của bé:</div>
          <div id="market-basket" style="font-size: 32px; min-height: 50px; width: 80%; background-color: #FFF0E6; border: 3px dashed #FFD8A8; border-radius: 18px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px;">
            🛒 (Giỏ trống)
          </div>
        </div>

        <div id="fruits-feedback" class="game-feedback-text" style="min-height: 24px; font-size: 14px; font-weight: 800;"></div>
      </div>
    `;

    // Render initial stars
    const progressContainer = document.getElementById("fruits-stars-progress");
    progressContainer.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const star = document.createElement("span");
      star.className = "game-star-indicator";
      star.innerText = "⭐";
      progressContainer.appendChild(star);
    }

    document.getElementById("fruits-listen-btn").addEventListener("click", () => {
      if (this.gameState.currentQuestion) {
        AudioManager.speak(`Give me the ${this.gameState.currentQuestion.word}`, false);
      }
    });

    this.nextFruitsQuestion();
  },

  nextFruitsQuestion() {
    document.getElementById("fruits-feedback").innerText = "";
    
    const stars = document.querySelectorAll("#fruits-stars-progress .game-star-indicator");
    stars.forEach((star, idx) => {
      if (idx < this.gameState.score) {
        star.classList.add("earned");
        star.style.opacity = "1";
      } else {
        star.classList.remove("earned");
        star.style.opacity = "0.3";
      }
    });

    const basket = document.getElementById("market-basket");
    if (this.gameState.basketFruits.length > 0) {
      basket.innerHTML = `🛒 ` + this.gameState.basketFruits.map(f => `<span style="display:inline-block; animation: pop-up-effect 0.3s ease;">${f}</span>`).join(" ");
    } else {
      basket.innerText = "🛒 (Giỏ trống)";
    }

    if (this.gameState.score >= this.gameState.targetScore) {
      const topic = TOPICS_DATA.fruits;
      topic.words.forEach(w => {
        App.markItemPracticed("fruits", w.word, "speak");
      });
      App.saveState();
      
      AudioManager.playCorrect();
      
      const feedback = document.getElementById("fruits-feedback");
      feedback.innerHTML = `<span class="happy-msg" style="color:var(--primary-green);">Tuyệt vời! Bé đã hoàn thành trò chơi Chợ Quả Ngọt! 🛒🥳</span>`;
      
      setTimeout(() => {
        this.gameState.onComplete();
      }, 2500);
      return;
    }

    const fruitsData = TOPICS_DATA.fruits.words;
    const target = fruitsData[this.gameState.score];
    this.gameState.currentQuestion = target;

    setTimeout(() => {
      AudioManager.speak(`Give me the ${target.word}`, false);
    }, 400);

    let options = [target];
    while (options.length < 4) {
      const randomOpt = fruitsData[Math.floor(Math.random() * fruitsData.length)];
      if (!options.some(o => o.word === randomOpt.word)) {
        options.push(randomOpt);
      }
    }
    options.sort(() => Math.random() - 0.5);
    this.gameState.options = options;

    const optionsContainer = document.getElementById("fruits-options");
    optionsContainer.innerHTML = "";
    
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "feeling-option-card";
      btn.style.padding = "10px 4px";
      btn.innerHTML = `
        <span class="feeling-emoji" style="font-size: 32px; margin-bottom: 2px;">${opt.emoji}</span>
        <span class="feeling-label-vi" style="font-size: 11px;">${opt.word}</span>
      `;
      
      btn.addEventListener("click", () => this.handleFruitSelect(opt, btn));
      optionsContainer.appendChild(btn);
    });
  },

  handleFruitSelect(selected, buttonEl) {
    const isCorrect = selected.word === this.gameState.currentQuestion.word;
    
    const buttons = document.querySelectorAll("#fruits-options .feeling-option-card");
    buttons.forEach(b => b.style.pointerEvents = "none");

    if (isCorrect) {
      buttonEl.classList.add("correct-bounce");
      AudioManager.playCorrect();
      this.gameState.score++;
      this.gameState.basketFruits.push(selected.emoji);
      
      const feedback = document.getElementById("fruits-feedback");
      feedback.innerHTML = `<span class="happy-msg" style="color:var(--primary-green);">Tuyệt vời! Bé chọn đúng quả ${selected.vi} rồi! 🍉</span>`;
      
      createConfetti(buttonEl);

      setTimeout(() => {
        this.nextFruitsQuestion();
      }, 1800);
    } else {
      buttonEl.classList.add("incorrect-shake");
      AudioManager.playTap();
      
      const feedback = document.getElementById("fruits-feedback");
      feedback.innerHTML = `<span class="retry-msg" style="color:var(--primary-pink);">Bé tìm lại quả ${this.gameState.currentQuestion.vi} xem nào! 💪</span>`;

      AudioManager.speak(`Give me the ${this.gameState.currentQuestion.word}`, false);

      setTimeout(() => {
        buttonEl.classList.remove("incorrect-shake");
        buttons.forEach(b => b.style.pointerEvents = "auto");
        feedback.innerHTML = "";
      }, 1500);
    }
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


// ==========================================
// 7. STRAWBERRY LIFE CYCLE (SCIENCE) CONTROLLER
// ==========================================
const ScienceController = {
  containerId: null,
  onComplete: null,
  activeTab: "learn", // "learn" or "game"
  currentLearnStage: 0,
  shuffledStages: [],
  selectedPoolItem: null,
  placedSlots: [null, null, null, null],

  stages: [
    { word: "Seed", vi: "Hạt giống", emoji: "🌱", desc: "A tiny seed is planted in the ground.", descVi: "Một hạt nhỏ được gieo xuống đất.", step: 1 },
    { word: "Sprout", vi: "Cây non", emoji: "🌿", desc: "The seed grows into a little plant.", descVi: "Hạt nảy mầm thành cây non.", step: 2 },
    { word: "Flower", vi: "Hoa dâu tây", emoji: "🌼", desc: "The plant grows a beautiful flower.", descVi: "Cây ra hoa trắng xinh.", step: 3 },
    { word: "Fruit", vi: "Quả dâu tây", emoji: "🍓", desc: "The flower becomes a ripe, red strawberry!", descVi: "Hoa kết thành quả dâu tây đỏ mọng!", step: 4 }
  ],

  init(containerId, onComplete) {
    this.containerId = containerId;
    this.onComplete = onComplete;
    this.activeTab = "learn";
    this.currentLearnStage = 0;
    this.placedSlots = [null, null, null, null];
    this.selectedPoolItem = null;

    this.render();
  },

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="width:100%; display:flex; flex-direction:column; gap:16px;">
        <!-- Mode Switcher Tabs -->
        <div style="display:flex; justify-content:center; gap:12px; margin-bottom:4px;">
          <button id="sci-tab-learn" class="playback-btn" style="flex:1; border-radius:18px; padding:12px; font-weight:900; background-color:${this.activeTab === "learn" ? "var(--primary-green)" : "white"}; color:${this.activeTab === "learn" ? "white" : "var(--primary-green)"}; border-color:var(--primary-green);">
            📖 Học vòng đời
          </button>
          <button id="sci-tab-game" class="playback-btn" style="flex:1; border-radius:18px; padding:12px; font-weight:900; background-color:${this.activeTab === "game" ? "var(--primary-green)" : "white"}; color:${this.activeTab === "game" ? "white" : "var(--primary-green)"}; border-color:var(--primary-green);">
            🧩 Sắp xếp thẻ
          </button>
        </div>

        <div id="science-content-area" style="width: 100%;"></div>
      </div>
    `;

    document.getElementById("sci-tab-learn").onclick = () => {
      AudioManager.playTap();
      this.activeTab = "learn";
      this.render();
    };

    document.getElementById("sci-tab-game").onclick = () => {
      AudioManager.playTap();
      this.activeTab = "game";
      this.initGameMode();
      this.render();
    };

    if (this.activeTab === "learn") {
      this.renderLearnMode();
    } else {
      this.renderGameMode();
    }
  },

  renderLearnMode() {
    const area = document.getElementById("science-content-area");
    const stage = this.stages[this.currentLearnStage];

    area.innerHTML = `
      <div class="science-timeline">
        <!-- Stage flashcard -->
        <div class="science-stage-card">
          <div style="position:absolute; top:12px; left:16px; font-size:12px; font-weight:900; color:var(--primary-green); background-color:#E6FAF4; padding:4px 10px; border-radius:12px;">
            Giai đoạn ${stage.step}/4
          </div>
          
          <div class="science-stage-img" style="font-size:72px; animation: pop-up-effect 0.5s ease;">${stage.emoji}</div>
          <div class="science-stage-title-en">${stage.word}</div>
          <div class="science-stage-title-vi">${stage.vi}</div>
          
          <div class="science-stage-desc" style="margin-top:12px;">
            <div style="font-weight:700; color:var(--text-dark); font-size:14px;">"${stage.desc}"</div>
            <div style="font-weight:600; color:#4A5568; font-size:12px; margin-top:4px;">"${stage.descVi}"</div>
          </div>

          <div style="display:flex; justify-content:center; gap:12px; margin-top:16px; width:100%;">
            <button id="sci-btn-listen" class="playback-btn" style="background-color:var(--bg-light-blue); border-color:var(--primary-blue); color:var(--primary-blue); padding:10px 18px; border-radius:20px; font-weight:800;">
              🔊 Nghe câu ví dụ
            </button>
            <button id="sci-btn-goto-fruits" class="playback-btn" style="background-color:#FFF5F5; border-color:var(--primary-pink); color:var(--primary-pink); padding:10px 18px; border-radius:20px; font-weight:800;">
              🍓 Xem Fruits
            </button>
          </div>
        </div>

        <!-- Mini slider dots -->
        <div style="display:flex; justify-content:center; gap:8px;">
          ${this.stages.map((s, idx) => `
            <div style="width:12px; height:12px; border-radius:50%; background-color:${idx === this.currentLearnStage ? "var(--primary-green)" : "#CBD5E0"}; transition:all 0.3s ease; cursor:pointer;" onclick="ScienceController.changeLearnStage(${idx})"></div>
          `).join("")}
        </div>

        <!-- Slider nav controls -->
        <div class="card-navigation-footer" style="padding-top:10px;">
          <button id="sci-btn-prev" class="nav-arrow-btn" ${this.currentLearnStage === 0 ? "disabled" : ""}>◀</button>
          <button id="sci-btn-next" class="nav-arrow-btn" style="background-color:${this.currentLearnStage === 3 ? "var(--primary-green)" : ""}; color:${this.currentLearnStage === 3 ? "white" : ""};">${this.currentLearnStage === 3 ? "✓ Xong" : "▶"}</button>
        </div>
      </div>
    `;

    document.getElementById("sci-btn-listen").onclick = () => {
      AudioManager.playTap();
      AudioManager.speak(stage.word, false, "normal", () => {
        setTimeout(() => {
          AudioManager.speak(stage.desc, false);
        }, 600);
      });
    };

    document.getElementById("sci-btn-goto-fruits").onclick = () => {
      AudioManager.playTap();
      App.navigateToFruit("Strawberry");
    };

    document.getElementById("sci-btn-prev").onclick = () => {
      if (this.currentLearnStage > 0) {
        AudioManager.playTap();
        this.currentLearnStage--;
        this.renderLearnMode();
      }
    };

    document.getElementById("sci-btn-next").onclick = () => {
      AudioManager.playTap();
      if (this.currentLearnStage < 3) {
        this.currentLearnStage++;
        this.renderLearnMode();
      } else {
        this.activeTab = "game";
        this.initGameMode();
        this.render();
      }
    };

    setTimeout(() => {
      AudioManager.speak(stage.word, false);
    }, 500);
  },

  changeLearnStage(idx) {
    AudioManager.playTap();
    this.currentLearnStage = idx;
    this.renderLearnMode();
  },

  initGameMode() {
    this.placedSlots = [null, null, null, null];
    this.selectedPoolItem = null;
    this.shuffledStages = [...this.stages].sort(() => Math.random() - 0.5);
  },

  renderGameMode() {
    const area = document.getElementById("science-content-area");

    area.innerHTML = `
      <div class="science-timeline" style="gap:12px;">
        <p class="game-instruction" style="margin-bottom:0;">Chạm thẻ bên dưới rồi chạm ô trống tương ứng từ 1 đến 4 trên trục thời gian nhé!</p>
        
        <!-- Timeline targets -->
        <div class="science-dropzone-row">
          ${[0, 1, 2, 3].map(idx => {
            const placed = this.placedSlots[idx];
            return `
              <div class="science-slot ${placed ? "filled" : ""}" id="sci-slot-${idx}" onclick="ScienceController.handleSlotClick(${idx})">
                <span class="science-slot-number">${idx + 1}</span>
                ${placed ? `
                  <div style="font-size:36px; margin-top:2px;">${placed.emoji}</div>
                  <div style="font-size:10px; font-weight:800; color:var(--text-dark);">${placed.word}</div>
                ` : `<span style="font-size:10px;">Chờ xếp...</span>`}
              </div>
            `;
          }).join("")}
        </div>

        <!-- Shuffled cards pool -->
        <div class="science-shuffled-pool">
          ${this.shuffledStages.map((stage, idx) => {
            const isUsed = this.placedSlots.some(p => p && p.word === stage.word);
            const isSelected = this.selectedPoolItem && this.selectedPoolItem.idx === idx;
            return `
              <div class="science-pool-item ${isUsed ? "used" : ""} ${isSelected ? "selected" : ""}" 
                   style="${isSelected ? "border-color:var(--primary-green); background-color:#E6FAF4; transform:scale(1.05);" : ""}"
                   onclick="ScienceController.handlePoolClick(${idx}, '${stage.word}')">
                <div style="font-size:32px;">${stage.emoji}</div>
                <div style="font-size:10px; font-weight:900; color:#4A5568; margin-top:2px;">${stage.word}</div>
              </div>
            `;
          }).join("")}
        </div>

        <!-- Hint center -->
        <div style="display:flex; justify-content:center; gap:12px; margin-top:8px; width:100%;">
          <button id="sci-game-hint" class="playback-btn" style="background-color:var(--bg-light-yellow); border-color:var(--primary-yellow); color:var(--primary-yellow); padding:10px 20px; border-radius:20px; font-weight:800; font-size:13px;">
            💡 Phát âm gợi ý
          </button>
        </div>

        <div id="sci-game-feedback" class="game-feedback-text" style="min-height:24px; font-size:14px; font-weight:800;"></div>
      </div>
    `;

    document.getElementById("sci-game-hint").onclick = () => {
      AudioManager.playTap();
      if (this.selectedPoolItem) {
        const item = this.shuffledStages[this.selectedPoolItem.idx];
        AudioManager.speak(item.word, false);
      } else {
        const unplaced = this.shuffledStages.filter(s => !this.placedSlots.some(p => p && p.word === s.word));
        if (unplaced.length > 0) {
          AudioManager.speak(unplaced[0].word, false);
        }
      }
    };
  },

  handlePoolClick(idx, word) {
    AudioManager.playTap();
    const stage = this.shuffledStages[idx];
    const isUsed = this.placedSlots.some(p => p && p.word === stage.word);
    if (isUsed) return;

    this.selectedPoolItem = { idx, word };
    AudioManager.speak(stage.word, false);
    this.renderGameMode();
  },

  handleSlotClick(slotIdx) {
    if (!this.selectedPoolItem) {
      if (this.placedSlots[slotIdx]) {
        AudioManager.playTap();
        this.placedSlots[slotIdx] = null;
        this.renderGameMode();
      }
      return;
    }

    AudioManager.playTap();
    const stage = this.shuffledStages[this.selectedPoolItem.idx];
    
    if (stage.step === slotIdx + 1) {
      this.placedSlots[slotIdx] = stage;
      this.selectedPoolItem = null;
      
      const feedback = document.getElementById("sci-game-feedback");
      feedback.innerHTML = `<span class="happy-msg" style="color:var(--primary-green);">Tuyệt vời! Giai đoạn ${slotIdx + 1} chính xác! 🎉</span>`;
      
      createConfetti(document.getElementById(`sci-slot-${slotIdx}`));
      
      const won = this.placedSlots.every((p, idx) => p && p.step === idx + 1);
      if (won) {
        feedback.innerHTML = `<span class="happy-msg" style="color:var(--primary-green);">Chúc mừng! Bé đã hoàn thành Vòng đời Dâu Tây! 🍓🌱</span>`;
        this.showGrowthAnimation();
      } else {
        setTimeout(() => this.renderGameMode(), 1200);
      }
    } else {
      const el = document.getElementById(`sci-slot-${slotIdx}`);
      el.classList.add("incorrect-shake");
      AudioManager.playTap();
      
      const feedback = document.getElementById("sci-game-feedback");
      feedback.innerHTML = `<span class="retry-msg" style="color:var(--primary-pink);">Giai đoạn này không phải số ${slotIdx + 1} rồi, chọn lại đi bé! 💪</span>`;
      
      setTimeout(() => {
        el.classList.remove("incorrect-shake");
        feedback.innerHTML = "";
      }, 1500);
    }
  },

  showGrowthAnimation() {
    const area = document.getElementById("science-content-area");
    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:16px; padding:20px 0;">
        <h2 style="color:var(--primary-green); font-weight:900;">Dâu tây lớn lên rồi!</h2>
        <div id="plant-growing" style="font-size:100px; line-height:1; transition:all 1s ease; animation: bounce-effect 1.5s infinite;">🌱</div>
        <p style="font-weight:700; color:#4A5568;">Nhìn xem, hạt mầm đã mọc thành quả mọng chín đỏ rồi! 🍓</p>
      </div>
    `;

    const plant = document.getElementById("plant-growing");
    
    setTimeout(() => {
      plant.innerText = "🌿";
      AudioManager.playStar();
    }, 1000);

    setTimeout(() => {
      plant.innerText = "🌼";
      AudioManager.playStar();
    }, 2000);

    setTimeout(() => {
      plant.innerText = "🍓";
      AudioManager.playCorrect();
      createConfetti(plant, null, 30);
    }, 3000);

    setTimeout(() => {
      App.state.unlockedBadges["green_thumb"] = true;
      this.stages.forEach(s => {
        App.markItemPracticed("science", s.word, "speak");
      });
      App.saveState();
      App.navigateTo("view-home");
      App.checkTopicBadgeUnlocks("science");
    }, 5000);
  }
};


// ==========================================
// 8. FRUIT YOGURT RECIPE (COOKING) CONTROLLER
// ==========================================
const CookingController = {
  containerId: null,
  onComplete: null,
  currentStep: 1, // 1, 2, 3, 4
  selectedFruits: [],
  scoopsCount: 0,
  decoratedFruits: [],

  fruitsPool: [
    { word: "Strawberry", vi: "Dâu tây", emoji: "🍓" },
    { word: "Banana", vi: "Chuối", emoji: "🍌" },
    { word: "Apple", vi: "Táo", emoji: "🍎" },
    { word: "Mango", vi: "Xoài", emoji: "🥭" }
  ],

  init(containerId, onComplete) {
    this.containerId = containerId;
    this.onComplete = onComplete;
    this.currentStep = 1;
    this.selectedFruits = [];
    this.scoopsCount = 0;
    this.decoratedFruits = [];

    this.render();
  },

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="width:100%; display:flex; flex-direction:column; gap:16px;">
        <!-- Step progress indicators -->
        <div style="display:flex; justify-content:space-around; align-items:center; padding:10px; background-color:#FFF9E6; border-radius:18px; border:2px solid #FFEAA7;">
          ${[1, 2, 3, 4].map(s => `
            <div style="display:flex; flex-direction:column; align-items:center;">
              <div style="width:28px; height:28px; border-radius:50%; background-color:${this.currentStep === s ? "var(--primary-yellow)" : this.currentStep > s ? "var(--primary-green)" : "#CBD5E0"}; color:white; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; transition:all 0.3s ease;">
                ${this.currentStep > s ? "✓" : s}
              </div>
              <span style="font-size:10px; font-weight:800; color:#718096; margin-top:2px;">B. ${s}</span>
            </div>
          `).join('<div style="flex:1; height:3px; background-color:#E2E8F0; margin:0 6px;"></div>')}
        </div>

        <div id="cooking-workspace" class="cooking-stage-box"></div>
      </div>
    `;

    this.renderWorkspace();
  },

  renderWorkspace() {
    const workspace = document.getElementById("cooking-workspace");
    if (!workspace) return;

    if (this.currentStep === 1) {
      workspace.innerHTML = `
        <h3 style="color:var(--text-dark); font-weight:900; font-size:18px;">Bước 1: Chọn quả tươi ngon 🍓🍌</h3>
        <p class="game-instruction" style="margin-top:4px;">Chạm chọn 2 đến 3 loại quả để làm cốc sữa chua hoa quả nhé!</p>
        
        <div class="cooking-tray">
          ${this.fruitsPool.map(fruit => {
            const isSel = this.selectedFruits.includes(fruit.word);
            return `
              <div class="cooking-tray-item ${isSel ? "selected" : ""}" onclick="CookingController.toggleFruit('${fruit.word}')">
                <div style="font-size:36px;">${fruit.emoji}</div>
                <div style="font-size:11px; margin-top:4px; font-weight:800;">${fruit.word}</div>
                ${isSel ? `<div class="cooking-check-badge">✓</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>

        <div style="min-height:48px; margin-top:12px;">
          ${this.selectedFruits.length >= 2 ? `
            <button id="btn-cook-step1-next" class="mode-done-complete-btn" style="background-color:var(--primary-yellow); box-shadow:0 6px 0px #d9a42b; color:var(--text-dark); max-width:200px; margin:0 auto;">
              Tiếp theo ➜
            </button>
          ` : `<div style="font-size:12px; font-weight:800; color:#A0AEC0;">Chọn ít nhất 2 loại quả nhé!</div>`}
        </div>
      `;

      const nextBtn = document.getElementById("btn-cook-step1-next");
      if (nextBtn) {
        nextBtn.onclick = () => {
          AudioManager.playTap();
          this.currentStep = 2;
          this.render();
        };
      }
    } 
    else if (this.currentStep === 2) {
      workspace.innerHTML = `
        <h3 style="color:var(--text-dark); font-weight:900; font-size:18px;">Bước 2: Múc sữa chua vào cốc 🥄</h3>
        <p class="game-instruction" style="margin-top:4px;">Chạm chiếc thìa để múc sữa chua đổ đầy cốc (cần múc 3 lần)!</p>
        
        <div class="yogurt-cup-wrapper">
          <svg class="yogurt-cup-svg" viewBox="0 0 100 120" width="120" height="140">
            <path d="M20 20 L30 110 Q50 115 70 110 L80 20 Z" fill="none" stroke="#A0AEC0" stroke-width="4"/>
            ${this.scoopsCount >= 1 ? `<path d="M29 100 Q50 102 71 100 L73 80 Q50 82 27 80 Z" fill="#F7FAFC" opacity="0.9"/>` : ""}
            ${this.scoopsCount >= 2 ? `<path d="M27 80 Q50 82 73 80 L76 50 Q50 52 24 50 Z" fill="#F7FAFC" opacity="0.95"/>` : ""}
            ${this.scoopsCount >= 3 ? `<path d="M24 50 Q50 52 76 50 L78 30 Q50 32 22 30 Z" fill="#F7FAFC"/>` : ""}
          </svg>
          
          <div id="scoop-spoon-el" class="scoop-spoon" style="position:absolute; top: -10px; right: 10px;" onclick="CookingController.handleScoop()">🥄</div>
        </div>

        <div style="font-size:14px; font-weight:900; color:var(--primary-blue)">
          Số lần múc: <span style="font-size:20px; color:var(--primary-pink);">${this.scoopsCount}</span> / 3
        </div>

        <div style="min-height:48px; margin-top:12px; width: 100%;">
          ${this.scoopsCount >= 3 ? `
            <button id="btn-cook-step2-next" class="mode-done-complete-btn" style="background-color:var(--primary-yellow); box-shadow:0 6px 0px #d9a42b; color:var(--text-dark); max-width:200px; margin:0 auto;">
              Tiếp theo ➜
            </button>
          ` : ""}
        </div>
      `;

      const nextBtn = document.getElementById("btn-cook-step2-next");
      if (nextBtn) {
        nextBtn.onclick = () => {
          AudioManager.playTap();
          this.currentStep = 3;
          this.render();
        };
      }
    } 
    else if (this.currentStep === 3) {
      const remainingFruits = this.selectedFruits.filter(f => !this.decoratedFruits.includes(f));
      
      workspace.innerHTML = `
        <h3 style="color:var(--text-dark); font-weight:900; font-size:18px;">Bước 3: Trang trí cốc sữa chua 🎨</h3>
        <p class="game-instruction" style="margin-top:4px;">Chạm vào các loại quả đã chọn để xếp chúng lên mặt sữa chua!</p>

        <div class="yogurt-cup-wrapper">
          <svg class="yogurt-cup-svg" viewBox="0 0 100 120" width="120" height="140">
            <path d="M20 20 L30 110 Q50 115 70 110 L80 20 Z" fill="none" stroke="#A0AEC0" stroke-width="4"/>
            <path d="M29 100 L30 110 Q50 115 70 110 L71 100 Z" fill="#F7FAFC"/>
            <path d="M24 50 L29 100 Q50 102 71 100 L76 50 Z" fill="#F7FAFC" opacity="0.95"/>
            <path d="M22 30 L24 50 Q50 52 76 50 L78 30 Z" fill="#F7FAFC"/>
          </svg>
          
          <div style="position:absolute; top:25px; left:0; right:0; display:flex; justify-content:center; gap:4px; font-size:24px; pointer-events:none;">
            ${this.decoratedFruits.map(f => {
              const emoji = this.fruitsPool.find(fp => fp.word === f).emoji;
              return `<span style="animation: bounce-effect 0.4s ease;">${emoji}</span>`;
            }).join("")}
          </div>
        </div>

        <div class="cooking-tray" style="grid-template-columns: repeat(${this.selectedFruits.length}, 1fr); max-width:260px;">
          ${this.selectedFruits.map(fruitName => {
            const fruit = this.fruitsPool.find(f => f.word === fruitName);
            const isPlaced = this.decoratedFruits.includes(fruitName);
            return `
              <div class="cooking-tray-item ${isPlaced ? "selected" : ""}" style="${isPlaced ? "opacity:0.4; pointer-events:none;" : ""}" onclick="CookingController.decorateFruit('${fruitName}')">
                <div style="font-size:36px;">${fruit.emoji}</div>
                <div style="font-size:11px; margin-top:4px; font-weight:800;">${fruit.word}</div>
                ${isPlaced ? `<div class="cooking-check-badge">✓</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>

        <div style="min-height:48px; margin-top:12px; width:100%;">
          ${remainingFruits.length === 0 ? `
            <button id="btn-cook-step3-next" class="mode-done-complete-btn" style="background-color:var(--primary-yellow); box-shadow:0 6px 0px #d9a42b; color:var(--text-dark); max-width:200px; margin:0 auto;">
              Tiếp theo ➜
            </button>
          ` : `<div style="font-size:12px; font-weight:800; color:#A0AEC0;">Hãy trang trí hết số quả nhé!</div>`}
        </div>
      `;

      const nextBtn = document.getElementById("btn-cook-step3-next");
      if (nextBtn) {
        nextBtn.onclick = () => {
          AudioManager.playTap();
          this.currentStep = 4;
          this.render();
        };
      }
    } 
    else if (this.currentStep === 4) {
      workspace.innerHTML = `
        <h3 style="color:var(--primary-pink); font-weight:900; font-size:22px;">Sữa chua hoa quả ngon tuyệt! 🍧</h3>
        <p class="game-instruction" style="color:var(--primary-green); font-size:15px; font-weight:800; margin-top:4px;">Bé đã làm xong món tráng miệng bổ dưỡng rồi! 😋</p>
        
        <div class="yogurt-cup-wrapper" style="animation: bounce-effect 1.5s infinite;">
          <svg class="yogurt-cup-svg" viewBox="0 0 100 120" width="120" height="140">
            <path d="M20 20 L30 110 Q50 115 70 110 L80 20 Z" fill="none" stroke="#A0AEC0" stroke-width="4"/>
            <path d="M29 100 L30 110 Q50 115 70 110 L71 100 Z" fill="#F7FAFC"/>
            <path d="M24 50 L29 100 Q50 102 71 100 L76 50 Z" fill="#F7FAFC" opacity="0.95"/>
            <path d="M22 30 L24 50 Q50 52 76 50 L78 30 Z" fill="#F7FAFC"/>
          </svg>
          <div style="position:absolute; top:25px; left:0; right:0; display:flex; justify-content:center; gap:4px; font-size:24px;">
            ${this.decoratedFruits.map(f => {
              const emoji = this.fruitsPool.find(fp => fp.word === f).emoji;
              return `<span>${emoji}</span>`;
            }).join("")}
          </div>
        </div>

        <div style="background-color:#EBF8FF; border:1px dashed #90CDF4; border-radius:18px; padding:12px; margin-top:8px; width:100%;">
          <div style="font-size:13px; font-weight:900; color:#2B6CB0; margin-bottom:4px;">💡 Lời khuyên sức khỏe:</div>
          <div style="font-size:14px; font-weight:800; color:var(--text-dark);">"Trái cây giúp bé khỏe mạnh và vui vẻ! 💪"</div>
        </div>

        <button id="btn-cook-finish" class="mode-done-complete-btn" style="margin-top:16px; width:80%;">
          ✓ Nhận Huy Hiệu Đầu Bếp!
        </button>
      `;

      setTimeout(() => {
        AudioManager.playCorrect();
        createConfetti(workspace, null, 30);
      }, 300);

      document.getElementById("btn-cook-finish").onclick = () => {
        AudioManager.playTap();
        
        App.state.unlockedBadges["little_chef"] = true;
        TOPICS_DATA.cooking.words.forEach(w => {
          App.markItemPracticed("cooking", w.word, "speak");
        });
        App.saveState();
        App.navigateTo("view-home");
        
        App.checkTopicBadgeUnlocks("cooking");
      };
    }
  },

  toggleFruit(fruitWord) {
    AudioManager.playTap();
    if (this.selectedFruits.includes(fruitWord)) {
      this.selectedFruits = this.selectedFruits.filter(f => f !== fruitWord);
    } else {
      if (this.selectedFruits.length < 3) {
        this.selectedFruits.push(fruitWord);
      } else {
        App.showToast("Bé chỉ chọn tối đa 3 loại quả thôi nhé! 😉");
      }
    }
    this.renderWorkspace();
  },

  handleScoop() {
    if (this.scoopsCount >= 3) return;

    AudioManager.playTap();
    const spoon = document.getElementById("scoop-spoon-el");
    spoon.classList.add("animating");
    
    setTimeout(() => {
      AudioManager.playStar();
    }, 300);

    spoon.addEventListener("animationend", () => {
      spoon.classList.remove("animating");
      this.scoopsCount++;
      this.renderWorkspace();
    }, { once: true });
  },

  decorateFruit(fruitWord) {
    if (this.decoratedFruits.includes(fruitWord)) return;

    AudioManager.playTap();
    this.decoratedFruits.push(fruitWord);
    AudioManager.playStar();
    this.renderWorkspace();
  }
};
