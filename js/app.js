// COLOR ME Application Coordinator
const App = {
  state: {
    stars: 0,
    // Format: { "topicId_word_mode": true }
    practicedItems: {},
    unlockedBadges: {}, // Format: { "wave": true, "heart": true ... }
    unlockedStickers: 0
  },

  currentTopic: null,
  currentMode: null,
  currentWordIndex: 0,

  // Parent settings
  settings: {
    volume: 0.8,
    speed: "normal",
    showTranslation: true,
    muted: false
  },

  init() {
    this.loadState();
    this.setupEventListeners();
    this.renderHome();
    this.renderBadges();
    this.initSettingsUI();
    this.updateGreetingBanner();
    this.navigateTo("view-home");
  },

  loadState() {
    const savedState = localStorage.getItem("colorme_state");
    if (savedState) {
      try {
        this.state = JSON.parse(savedState);
      } catch (e) {
        console.error("Failed to parse saved state:", e);
      }
    }

    const savedSettings = localStorage.getItem("colorme_settings");
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (e) {
        console.error("Failed to parse saved settings:", e);
      }
    } else {
      this.saveSettings();
    }
  },

  saveState() {
    localStorage.setItem("colorme_state", JSON.stringify(this.state));
    this.renderHome();
    this.renderBadges();
  },

  saveSettings() {
    localStorage.setItem("colorme_settings", JSON.stringify(this.settings));
    // Sync with AudioManager
    if (AudioManager) {
      AudioManager.loadVoices();
    }
  },

  setupEventListeners() {
    // Nav bar listeners
    document.getElementById("nav-home").addEventListener("click", () => {
      AudioManager.playTap();
      this.navigateTo("view-home");
    });
    document.getElementById("nav-badges").addEventListener("click", () => {
      AudioManager.playTap();
      this.navigateTo("view-badges");
    });
    document.getElementById("nav-settings").addEventListener("click", () => {
      AudioManager.playTap();
      this.navigateTo("view-settings");
    });

    // Back buttons
    document.querySelectorAll(".back-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        AudioManager.playTap();
        AudioManager.stopSpeaking();
        
        // Router go back
        const currentActive = document.querySelector(".app-content > div:not(.hidden-view)");
        if (currentActive.id === "view-topic-select") {
          this.navigateTo("view-home");
        } else if (currentActive.id === "view-practice" || currentActive.id === "view-game") {
          this.navigateTo("view-topic-select");
        } else {
          this.navigateTo("view-home");
        }
      });
    });
  },

  navigateTo(viewId) {
    // Hide all views
    document.querySelectorAll(".app-content > div").forEach(view => {
      view.classList.add("hidden-view");
    });

    // Show destination
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove("hidden-view");
    }

    // Update bottom nav active state
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.classList.remove("active");
    });

    if (viewId === "view-home") {
      document.getElementById("nav-home").classList.add("active");
      this.updateGreetingBanner();
      this.renderHome();
    } else if (viewId === "view-badges") {
      document.getElementById("nav-badges").classList.add("active");
      this.renderBadges();
    } else if (viewId === "view-settings") {
      document.getElementById("nav-settings").classList.add("active");
    }
  },

  updateGreetingBanner() {
    const banner = document.getElementById("greeting-banner-text");
    if (!banner) return;

    const hour = new Date().getHours();
    let text = "Xin chào bé! Hôm nay học gì? 🌟";

    if (hour >= 5 && hour < 12) {
      text = "Chào buổi sáng bé yêu! Học gì hôm nay nhỉ? ☀️";
    } else if (hour >= 12 && hour < 18) {
      text = "Chào buổi chiều bé yêu! Cùng học tiếng Anh nào! 🌤️";
    } else {
      text = "Chào buổi tối bé yêu! Cùng ôn bài trước khi ngủ nhé! 🌙";
    }

    banner.innerText = text;
    document.getElementById("home-star-count").innerText = this.state.stars || 0;
  },

  renderHome() {
    const grid = document.getElementById("topics-grid-container");
    if (!grid) return;
    grid.innerHTML = "";

    // Load achievements status
    const topicKeys = Object.keys(TOPICS_DATA);
    topicKeys.forEach(key => {
      const topic = TOPICS_DATA[key];
      const card = document.createElement("button");
      card.className = `topic-card topic-card-${topic.id}`;
      
      // Calculate progress
      const stats = this.getTopicProgress(topic.id);
      
      card.innerHTML = `
        <div class="topic-emoji">${topic.emoji}</div>
        <div class="topic-name-en">${topic.titleEn}</div>
        <div class="topic-name-vi">${topic.titleVi}</div>
        <div class="topic-progress-mini">
          <span class="topic-stars-count">⭐ ${stats.starsCount}</span>
          <div class="progress-mini-bar">
            <div class="progress-mini-fill" style="width: ${stats.percentage}%"></div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        AudioManager.playTap();
        this.selectTopic(topic.id);
      });

      grid.appendChild(card);
    });

    // Render badge silhouettes in Home page header
    const silhouettes = document.getElementById("badge-silhouettes-bar");
    if (silhouettes) {
      silhouettes.innerHTML = "";
      topicKeys.forEach(key => {
        const topic = TOPICS_DATA[key];
        const unlocked = this.state.unlockedBadges[topic.badgeId];
        const sil = document.createElement("div");
        sil.className = "home-header-badge-spot" + (unlocked ? " unlocked" : "");
        sil.innerHTML = unlocked ? topic.badgeEmoji : "🔒";
        sil.title = topic.badgeName;
        silhouettes.appendChild(sil);
      });
    }
  },

  getTopicProgress(topicId) {
    const topic = TOPICS_DATA[topicId];
    if (!topic) return { percentage: 0, starsCount: 0 };

    const totalWords = topic.words.length;
    let uniqueWordsPracticed = 0;
    let totalStarsEarned = 0;

    topic.words.forEach(w => {
      const wordVal = topicId === "poem" ? w.line : w.word;
      
      // Check if practiced in read, listen, or speak modes
      const readKey = `${topicId}_${wordVal}_read`;
      const listenKey = `${topicId}_${wordVal}_listen`;
      const speakKey = `${topicId}_${wordVal}_speak`;

      const hasRead = this.state.practicedItems[readKey] ? 1 : 0;
      const hasListen = this.state.practicedItems[listenKey] ? 1 : 0;
      const hasSpeak = this.state.practicedItems[speakKey] ? 1 : 0;

      const sum = hasRead + hasListen + hasSpeak;
      totalStarsEarned += sum;
      if (sum > 0) {
        uniqueWordsPracticed++;
      }
    });

    const percentage = totalWords > 0 ? (uniqueWordsPracticed / totalWords) * 100 : 0;
    return {
      percentage: Math.round(percentage),
      starsCount: totalStarsEarned
    };
  },

  selectTopic(topicId) {
    this.currentTopic = TOPICS_DATA[topicId];
    
    // Set titles
    document.getElementById("topic-select-title-vi").innerText = this.currentTopic.titleVi;
    document.getElementById("topic-select-title-en").innerText = this.currentTopic.titleEn;

    // Render mode buttons
    const container = document.getElementById("modes-list-container");
    container.innerHTML = "";

    const modes = [
      { id: "read", title: "📖 READ (Đọc mẫu)", desc: "Xem hình ảnh và nghĩa từ vựng" },
      { id: "listen", title: "🔊 LISTEN (Nghe nói)", desc: "Nghe phát âm chuẩn bản xứ" },
      { id: "speak", title: "🎤 SPEAK (Bé nói)", desc: "Ghi âm giọng nói và nhận sao" }
    ];

    modes.forEach(mode => {
      const card = document.createElement("button");
      card.className = "mode-card";
      
      // Check if this mode is fully completed for this topic
      const isModeDone = this.isTopicModeCompleted(topicId, mode.id);
      if (isModeDone) {
        card.classList.add("completed");
      }

      card.innerHTML = `
        <div class="mode-card-icon">${mode.id === "read" ? "📖" : mode.id === "listen" ? "🔊" : "🎤"}</div>
        <div class="mode-card-info">
          <div class="mode-card-title">${mode.title}</div>
          <div class="mode-card-desc">${mode.desc}</div>
        </div>
        <div class="mode-card-check">✓</div>
      `;

      card.addEventListener("click", () => {
        AudioManager.playTap();
        this.startLearningMode(mode.id);
      });
      container.appendChild(card);
    });

    // Render specialized activity mode for Feelings, Colors, Shapes, Animals
    if (topicId !== "greetings" && topicId !== "poem") {
      const actCard = document.createElement("button");
      actCard.className = "mode-card mode-card-activity";
      
      let actTitle = "";
      let actDesc = "";
      if (topicId === "feelings") {
        actTitle = "🎮 Trò Chơi Cảm Xúc";
        actDesc = "Chọn khuôn mặt phù hợp với tiếng nói";
      } else if (topicId === "colors") {
        actTitle = "🎮 Phù Thủy Màu Sắc";
        actDesc = "Pha trộn các màu vẽ kỳ diệu";
      } else if (topicId === "shapes") {
        actTitle = "🎮 Săn Hình Tam Giác";
        actDesc = "Tìm các hình tam giác trên pizza";
      } else if (topicId === "animals") {
        actTitle = "🎮 Tiếng Ai Kêu Đó?";
        actDesc = "Nghe tiếng kêu đoán con vật";
      }

      actCard.innerHTML = `
        <div class="mode-card-icon">🎮</div>
        <div class="mode-card-info">
          <div class="mode-card-title">${actTitle}</div>
          <div class="mode-card-desc">${actDesc}</div>
        </div>
        <div class="mode-card-check" style="color:var(--primary-yellow)">★</div>
      `;

      actCard.addEventListener("click", () => {
        AudioManager.playTap();
        this.startMiniGame(topicId);
      });
      container.appendChild(actCard);
    }

    this.navigateTo("view-topic-select");
  },

  isTopicModeCompleted(topicId, modeId) {
    const topic = TOPICS_DATA[topicId];
    if (!topic) return false;
    return topic.words.every(w => {
      const val = topicId === "poem" ? w.line : w.word;
      return this.state.practicedItems[`${topicId}_${val}_${modeId}`] === true;
    });
  },

  startLearningMode(modeId) {
    this.currentMode = modeId;
    this.currentWordIndex = 0;
    
    // Check if it is a poem topic
    if (this.currentTopic.id === "poem") {
      this.initPoemMode();
      return;
    }

    // Show normal vocabulary practice UI
    document.getElementById("normal-learning-layout").classList.remove("hidden-view");
    document.getElementById("poem-learning-layout").classList.add("hidden-view");
    
    this.renderWordSlide();
    this.navigateTo("view-practice");
  },

  renderWordSlide() {
    const words = this.currentTopic.words;
    const current = words[this.currentWordIndex];
    
    // Update progress header
    const progressPct = ((this.currentWordIndex + 1) / words.length) * 100;
    document.getElementById("learning-progress-fill").style.width = `${progressPct}%`;
    document.getElementById("learning-progress-text").innerText = `${this.currentWordIndex + 1}/${words.length}`;

    // Render flashcard front and back contents
    const flashcard = document.getElementById("interactive-flashcard");
    const front = flashcard.querySelector(".flashcard-front");
    const back = flashcard.querySelector(".flashcard-back");

    // Clear any previous flip state
    flashcard.classList.remove("flipped");

    // Check show translations parent controls toggle
    const hideTransClass = this.settings.showTranslation ? "" : "hidden-trans";

    // Set Front card content (English display card)
    front.innerHTML = `
      <div class="flashcard-emoji">${current.emoji || "✨"}</div>
      <div class="flashcard-word-en">${current.word}</div>
      <div class="flashcard-word-vi ${hideTransClass}" style="opacity: 0.6; font-size: 16px;">(Xem dịch bên sau)</div>
      <div class="card-hint-tap">Chạm để lật bài học 🔄</div>
    `;

    // Set Back card content (Vietnamese interpretation)
    back.innerHTML = `
      <div class="flashcard-emoji">${current.emoji || "✨"}</div>
      <div class="flashcard-word-vi">${current.vi}</div>
      ${current.context ? `<div class="flashcard-sentence">"${current.context}"</div>` : ""}
      ${current.contextVi && this.settings.showTranslation ? `<div class="flashcard-sentence" style="font-weight:600; font-size:13px; color:#718096; margin-top:2px;">"${current.contextVi}"</div>` : ""}
      <div class="card-hint-tap">Chạm để quay lại 🔄</div>
    `;

    // Reset components visibility by mode
    const listenControls = document.getElementById("listen-controls-panel");
    const speakControls = document.getElementById("speak-controls-panel");
    const feedbackModal = document.getElementById("speaking-feedback-popup");

    listenControls.style.display = "none";
    speakControls.style.display = "none";
    feedbackModal.style.display = "none";

    // Standard card flip action
    // Remove previous listeners by cloning
    const newCard = flashcard.cloneNode(true);
    flashcard.parentNode.replaceChild(newCard, flashcard);
    newCard.addEventListener("click", () => {
      AudioManager.playTap();
      newCard.classList.toggle("flipped");
      // Add practice trigger upon flip if in READ mode
      if (this.currentMode === "read") {
        this.markItemPracticed(this.currentTopic.id, current.word, "read");
      }
    });

    if (this.currentMode === "read") {
      // Auto voice on READ mode open
      setTimeout(() => {
        AudioManager.speak(current.word, false);
      }, 500);
      
      // Auto-save read progress on slide view
      this.markItemPracticed(this.currentTopic.id, current.word, "read");
    } 
    else if (this.currentMode === "listen") {
      listenControls.style.display = "flex";
      
      // Wire listener repeat / turtle speed buttons
      document.getElementById("btn-listen-repeat").onclick = (e) => {
        e.stopPropagation();
        AudioManager.playTap();
        AudioManager.speak(current.word, false);
      };

      document.getElementById("btn-listen-slow").onclick = (e) => {
        e.stopPropagation();
        AudioManager.playTap();
        AudioManager.speak(current.word, false, "slow");
      };

      // Auto play speech + sentence
      setTimeout(() => {
        AudioManager.speak(current.word, false, "normal", () => {
          if (current.context) {
            setTimeout(() => {
              AudioManager.speak(current.context, false);
            }, 600);
          }
        });
      }, 500);

      this.markItemPracticed(this.currentTopic.id, current.word, "listen");
    } 
    else if (this.currentMode === "speak") {
      speakControls.style.display = "flex";
      const micBtn = document.getElementById("btn-speak-record");
      const recordStatus = document.getElementById("record-status-label");
      
      recordStatus.innerText = "Chạm Micro để đọc mẫu 🎤";
      micBtn.className = "record-btn-large";

      micBtn.onclick = (e) => {
        e.stopPropagation();
        if (AudioManager.isRecording) {
          // Stop recording
          micBtn.classList.remove("recording");
          recordStatus.innerText = "Đang xử lý...";
          
          AudioManager.stopRecording((audioUrl) => {
            recordStatus.innerText = "Đã lưu giọng nói của bé! 🎧";
            
            // Show Feedback popup
            const evaluation = AudioManager.evaluateVoiceSample();
            feedbackModal.style.display = "block";
            
            // Render stars
            const starsContainer = document.getElementById("feedback-stars-container");
            starsContainer.innerHTML = "";
            for (let s = 1; s <= 3; s++) {
              const starEl = document.createElement("span");
              starEl.className = "feedback-star" + (s <= evaluation.stars ? " active" : "");
              starEl.innerText = "⭐";
              starsContainer.appendChild(starEl);
            }

            document.getElementById("feedback-msg-text").innerText = evaluation.text;

            // Wire audio replay
            document.getElementById("btn-feedback-replay").onclick = (ev) => {
              ev.stopPropagation();
              AudioManager.playRecording();
            };

            // Play correct chime / star sound
            if (evaluation.stars === 3) {
              AudioManager.playCorrect();
              createConfetti(micBtn);
            } else {
              AudioManager.playStar();
            }

            // Save speak progress
            this.markItemPracticed(this.currentTopic.id, current.word, "speak");
          });
        } else {
          // Start recording
          micBtn.classList.add("recording");
          recordStatus.innerText = "Bé hãy nói đi... 🎙️";
          
          // Stop speaking TTS if running
          AudioManager.stopSpeaking();

          AudioManager.startRecording(null, (err) => {
            micBtn.classList.remove("recording");
            recordStatus.innerText = "Lỗi kết nối micro 😢";
          });
        }
      };

      // Play guiding audio
      setTimeout(() => {
        AudioManager.speak(current.word, false);
      }, 500);
    }

    this.updateCardNavArrows();
  },

  updateCardNavArrows() {
    const prevBtn = document.getElementById("btn-card-prev");
    const nextBtn = document.getElementById("btn-card-next");

    prevBtn.disabled = this.currentWordIndex === 0;

    prevBtn.onclick = () => {
      AudioManager.playTap();
      AudioManager.stopSpeaking();
      if (this.currentWordIndex > 0) {
        this.currentWordIndex--;
        this.renderWordSlide();
      }
    };

    const words = this.currentTopic.words;
    if (this.currentWordIndex === words.length - 1) {
      // Last slide, replace "Next" with "Hoàn thành"
      nextBtn.innerHTML = "✓ Xong";
      nextBtn.style.backgroundColor = "var(--primary-green)";
      nextBtn.style.color = "#FFFFFF";
      
      nextBtn.onclick = () => {
        AudioManager.playTap();
        AudioManager.stopSpeaking();
        this.completeModeCelebration();
      };
    } else {
      nextBtn.innerHTML = "➜";
      nextBtn.style.backgroundColor = "";
      nextBtn.style.color = "";
      
      nextBtn.onclick = () => {
        AudioManager.playTap();
        AudioManager.stopSpeaking();
        if (this.currentWordIndex < words.length - 1) {
          this.currentWordIndex++;
          this.renderWordSlide();
        }
      };
    }
  },

  markItemPracticed(topicId, word, modeId) {
    const key = `${topicId}_${word}_${modeId}`;
    if (!this.state.practicedItems[key]) {
      this.state.practicedItems[key] = true;
      this.state.stars = (this.state.stars || 0) + 1;
      
      // Earned sticker logic (every 3 stars = 1 sticker)
      if (this.state.stars % 3 === 0) {
        this.state.unlockedStickers = (this.state.unlockedStickers || 0) + 1;
      }

      this.saveState();
      
      // Check for Badge Unlocks
      this.checkTopicBadgeUnlocks(topicId);
    }
  },

  checkTopicBadgeUnlocks(topicId) {
    const topic = TOPICS_DATA[topicId];
    if (!topic) return;

    // Check if badge is already unlocked
    if (this.state.unlockedBadges[topic.badgeId]) return;

    // A badge is unlocked when all words in a topic have been practiced at least once in ANY mode
    const allPracticed = topic.words.every(w => {
      const val = topicId === "poem" ? w.line : w.word;
      return (
        this.state.practicedItems[`${topicId}_${val}_read`] ||
        this.state.practicedItems[`${topicId}_${val}_listen`] ||
        this.state.practicedItems[`${topicId}_${val}_speak`]
      );
    });

    if (allPracticed) {
      this.state.unlockedBadges[topic.badgeId] = true;
      this.saveState();
      
      // Postpone a nice full screen badge animation!
      setTimeout(() => {
        this.triggerBadgeUnlockOverlay(topic);
      }, 1000);
    }
  },

  triggerBadgeUnlockOverlay(topic) {
    AudioManager.playCorrect();
    
    const overlay = document.createElement("div");
    overlay.className = "badge-overlay-fullscreen";
    overlay.innerHTML = `
      <div class="badge-modal-body">
        <h1 class="badge-modal-sparkles">✨🏆✨</h1>
        <h2 class="badge-modal-title">BÉ NHẬN HUY HIỆU!</h2>
        <div class="badge-modal-badge-emoji">${topic.badgeEmoji}</div>
        <h3 class="badge-modal-badge-name">${topic.badgeName}</h3>
        <p class="badge-modal-message">Chúc mừng bé đã chăm chỉ luyện tập hết chủ đề <strong>${topic.titleVi}</strong>!</p>
        <button id="badge-modal-close-btn" class="main-action-btn">Cảm ơn bé yêu! 🥰</button>
      </div>
    `;

    document.body.appendChild(overlay);
    createConfetti(overlay.querySelector(".badge-modal-badge-emoji"), null, 40);

    // Apply inline style to badge overlay for simple loading
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(7, 59, 76, 0.95)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "1000";

    const modalBody = overlay.querySelector(".badge-modal-body");
    modalBody.style.backgroundColor = "#FFFFFF";
    modalBody.style.borderRadius = "36px";
    modalBody.style.padding = "30px 20px";
    modalBody.style.width = "85%";
    modalBody.style.maxWidth = "360px";
    modalBody.style.textAlign = "center";
    modalBody.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)";
    modalBody.style.animation = "pop-up-effect 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards";

    overlay.querySelector(".badge-modal-badge-emoji").style.fontSize = "80px";
    overlay.querySelector(".badge-modal-badge-emoji").style.margin = "16px 0";
    
    overlay.querySelector(".badge-modal-title").style.color = "var(--primary-pink)";
    overlay.querySelector(".badge-modal-title").style.fontWeight = "900";
    overlay.querySelector(".badge-modal-title").style.fontSize = "24px";
    
    overlay.querySelector(".badge-modal-badge-name").style.color = "var(--primary-blue)";
    overlay.querySelector(".badge-modal-badge-name").style.fontWeight = "800";
    overlay.querySelector(".badge-modal-badge-name").style.marginBottom = "10px";

    overlay.querySelector(".badge-modal-message").style.fontSize = "14px";
    overlay.querySelector(".badge-modal-message").style.color = "#4A5568";
    overlay.querySelector(".badge-modal-message").style.marginBottom = "20px";

    document.getElementById("badge-modal-close-btn").onclick = () => {
      AudioManager.playTap();
      overlay.remove();
      this.renderHome();
    };
  },

  completeModeCelebration() {
    // Navigate back to topic selection and trigger completion confirmation visual
    this.selectTopic(this.currentTopic.id);
    
    // Flash congratulations on topic grid
    const modeCards = document.querySelectorAll(".mode-card");
    const completedIdx = this.currentMode === "read" ? 0 : this.currentMode === "listen" ? 1 : 2;
    if (modeCards[completedIdx]) {
      createConfetti(modeCards[completedIdx], null, 25);
    }
  },

  // ==========================================
  // POEM READ ALONG & RECORD WORKFLOW
  // ==========================================
  initPoemMode() {
    document.getElementById("normal-learning-layout").classList.add("hidden-view");
    const poemLayout = document.getElementById("poem-learning-layout");
    poemLayout.classList.remove("hidden-view");

    poemLayout.innerHTML = `
      <div class="poem-view-container">
        <h2 class="game-title" style="text-align:center;">Bài Thơ: Bạn Mới 📖</h2>
        
        <div class="poem-box">
          <div id="poem-lines-container"></div>
          <div class="poem-author">Tác giả: ${this.currentTopic.author}</div>
        </div>

        <div class="poem-read-instructions">
          ${this.currentMode === "speak" ? "Nhấn Micro để tự đọc và ghi âm bài thơ" : "Nhấn nghe để học đọc theo từng dòng thơ!"}
        </div>

        <div class="learning-controls-panel">
          ${this.currentMode === "speak" ? `
            <div class="speaking-mic-container">
              <button id="btn-poem-record" class="record-btn-large">🎙️</button>
              <div id="poem-record-status" class="recording-status-lbl">Chạm để ghi âm bài thơ 🎤</div>
              
              <div id="poem-feedback-popup" class="speaking-feedback-modal">
                <div id="poem-feedback-stars" class="feedback-stars-row"></div>
                <div id="poem-feedback-msg" class="feedback-text-message"></div>
                <div class="playback-controls">
                  <button id="btn-poem-replay" class="playback-btn">▶ Nghe Lại Giọng Bé</button>
                </div>
              </div>
            </div>
          ` : `
            <div class="audio-mode-buttons">
              <button id="btn-poem-play" class="audio-control-circle-btn btn-listen">🔊</button>
              <button id="btn-poem-slow" class="audio-control-circle-btn btn-slow">🐢</button>
            </div>
          `}
        </div>

        <div class="card-navigation-footer">
          <button id="btn-poem-done" class="mode-done-complete-btn">✓ Hoàn thành bài thơ</button>
        </div>
      </div>
    `;

    // Render poem lines
    const linesContainer = document.getElementById("poem-lines-container");
    linesContainer.innerHTML = "";
    this.currentTopic.words.forEach((w, idx) => {
      const lineEl = document.createElement("div");
      lineEl.className = "poem-line";
      lineEl.id = `poem-line-${idx}`;
      lineEl.innerText = w.line;
      linesContainer.appendChild(lineEl);
    });

    // Wire up events
    if (this.currentMode === "speak") {
      const recBtn = document.getElementById("btn-poem-record");
      const recStatus = document.getElementById("poem-record-status");
      const feedPopup = document.getElementById("poem-feedback-popup");

      recBtn.onclick = () => {
        if (AudioManager.isRecording) {
          recBtn.classList.remove("recording");
          recStatus.innerText = "Đang xử lý...";
          
          AudioManager.stopRecording((url) => {
            recStatus.innerText = "Đã lưu giọng đọc bài thơ của bé! 📚";
            feedPopup.style.display = "block";
            
            const evalResult = AudioManager.evaluateVoiceSample();
            const stars = document.getElementById("poem-feedback-stars");
            stars.innerHTML = "";
            for (let s = 1; s <= 3; s++) {
              const starEl = document.createElement("span");
              starEl.className = "feedback-star" + (s <= evalResult.stars ? " active" : "");
              starEl.innerText = "⭐";
              stars.appendChild(starEl);
            }
            document.getElementById("poem-feedback-msg").innerText = evalResult.text;

            document.getElementById("btn-poem-replay").onclick = () => {
              AudioManager.playRecording();
            };

            if (evalResult.stars === 3) {
              AudioManager.playCorrect();
              createConfetti(recBtn);
            } else {
              AudioManager.playStar();
            }

            // Mark entire poem lines as practiced in speak mode
            this.currentTopic.words.forEach(w => {
              this.markItemPracticed("poem", w.line, "speak");
            });
          });
        } else {
          recBtn.classList.add("recording");
          recStatus.innerText = "Bé đọc thơ đi nào... 🎙️";
          
          // Stop TTS
          AudioManager.stopSpeaking();

          AudioManager.startRecording(null, () => {
            recBtn.classList.remove("recording");
            recStatus.innerText = "Lỗi kết nối micro 😢";
          });
        }
      };
    } else {
      // READ / LISTEN poem lines
      const playBtn = document.getElementById("btn-poem-play");
      const slowBtn = document.getElementById("btn-poem-slow");

      const playPoemSequence = (isSlow = false) => {
        let lineIdx = 0;
        
        const speakNextLine = () => {
          // Clear active highlighting
          document.querySelectorAll(".poem-line").forEach(l => l.classList.remove("active-line"));
          
          if (lineIdx < this.currentTopic.words.length) {
            const lineData = this.currentTopic.words[lineIdx];
            const lineEl = document.getElementById(`poem-line-${lineIdx}`);
            lineEl.classList.add("active-line");

            // Speak Vietnamese lines
            AudioManager.speak(lineData.line, true, isSlow ? "slow" : "normal", () => {
              // Mark practiced
              this.markItemPracticed("poem", lineData.line, this.currentMode);
              lineIdx++;
              // Delay slightly before next line
              setTimeout(speakNextLine, 800);
            });
          } else {
            // Completed poem read
            document.querySelectorAll(".poem-line").forEach(l => l.classList.remove("active-line"));
          }
        };

        speakNextLine();
      };

      playBtn.onclick = () => {
        AudioManager.playTap();
        playPoemSequence(false);
      };

      slowBtn.onclick = () => {
        AudioManager.playTap();
        playPoemSequence(true);
      };

      // Auto start reading
      setTimeout(() => {
        playPoemSequence(false);
      }, 800);
    }

    document.getElementById("btn-poem-done").onclick = () => {
      AudioManager.playTap();
      AudioManager.stopSpeaking();
      this.completeModeCelebration();
    };

    this.navigateTo("view-practice");
  },

  // ==========================================
  // MINI-GAMES LAUNCHER
  // ==========================================
  startMiniGame(topicId) {
    const gameContainerId = "game-interactive-surface";
    const onComplete = () => {
      // Give full marks for all speak modes on success!
      const topic = TOPICS_DATA[topicId];
      topic.words.forEach(w => {
        this.markItemPracticed(topicId, w.word, "speak");
      });
      // Return to topic view
      this.selectTopic(topicId);
    };

    if (topicId === "feelings") {
      MiniGames.initFeelingsGame(gameContainerId, onComplete);
    } else if (topicId === "colors") {
      MiniGames.initColorsGame(gameContainerId, onComplete);
    } else if (topicId === "shapes") {
      MiniGames.initShapesGame(gameContainerId, onComplete);
    } else if (topicId === "animals") {
      MiniGames.initAnimalsGame(gameContainerId, onComplete);
    }

    this.navigateTo("view-game");
  },

  // ==========================================
  // ACHIEVEMENTS / STICKERS SCREEN
  // ==========================================
  renderBadges() {
    const album = document.getElementById("badges-grid-album");
    if (!album) return;
    album.innerHTML = "";

    // Show sticker counts
    const stickersEarned = this.state.unlockedStickers || 0;
    document.getElementById("stickers-earned-count").innerText = stickersEarned;

    // Load badges status
    Object.keys(TOPICS_DATA).forEach(key => {
      const topic = TOPICS_DATA[key];
      const isUnlocked = this.state.unlockedBadges[topic.badgeId];

      const item = document.createElement("div");
      item.className = "album-badge-item" + (isUnlocked ? " unlocked" : "");
      
      item.innerHTML = `
        <div class="badge-sticker-frame">
          ${isUnlocked ? topic.badgeEmoji : '<span class="badge-sticker-lock-icon">🔒</span>'}
        </div>
        <div class="badge-sticker-name">${topic.badgeName}</div>
      `;

      album.appendChild(item);
    });
  },

  // ==========================================
  // SETTINGS CONTROLLER
  // ==========================================
  initSettingsUI() {
    const volSlider = document.getElementById("slider-volume");
    const transToggle = document.getElementById("toggle-translation");
    const speedToggle = document.getElementById("toggle-playback-speed");
    const resetBtn = document.getElementById("btn-reset-progress");

    // Load settings values into UI
    volSlider.value = Math.round(this.settings.volume * 100);
    transToggle.checked = this.settings.showTranslation;
    speedToggle.checked = this.settings.speed === "slow";

    volSlider.addEventListener("input", (e) => {
      this.settings.volume = e.target.value / 100;
      this.saveSettings();
    });

    transToggle.addEventListener("change", (e) => {
      AudioManager.playTap();
      this.settings.showTranslation = e.target.checked;
      this.saveSettings();
    });

    speedToggle.addEventListener("change", (e) => {
      AudioManager.playTap();
      this.settings.speed = e.target.checked ? "slow" : "normal";
      this.saveSettings();
    });

    resetBtn.onclick = () => {
      AudioManager.playTap();
      this.triggerResetConfirmation();
    };
  },

  triggerResetConfirmation() {
    const modal = document.createElement("div");
    modal.className = "confirm-modal-overlay";
    modal.innerHTML = `
      <div class="confirm-modal-body">
        <h3 style="margin-bottom:12px; color:var(--primary-pink); font-size: 20px; font-weight:900;">XÓA TIẾN TRÌNH HỌC?</h3>
        <p style="font-size:14px; color:#4A5568; line-height:1.5; margin-bottom:20px;">
          Bố mẹ có chắc chắn muốn xóa toàn bộ số sao và huy hiệu bé đã đạt được không? Hành động này không thể hoàn tác đâu nhé! 🥺
        </p>
        <div style="display:flex; justify-content:space-around; gap:12px;">
          <button id="btn-confirm-yes" class="secondary-btn" style="background-color:var(--primary-pink); color:#FFFFFF; flex:1; padding: 12px 0; font-weight:900;">Đồng ý xóa 💥</button>
          <button id="btn-confirm-no" class="main-action-btn" style="flex:1; margin-top:0; font-size:14px; padding: 12px 0;">Giữ lại nhé! 💖</button>
        </div>
      </div>
    `;

    // Overlay styles
    modal.style.position = "absolute";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(7, 59, 76, 0.8)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000";

    const body = modal.querySelector(".confirm-modal-body");
    body.style.backgroundColor = "#FFFFFF";
    body.style.borderRadius = "28px";
    body.style.padding = "24px";
    body.style.width = "85%";
    body.style.maxWidth = "340px";
    body.style.textAlign = "center";
    body.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
    body.style.animation = "pop-up-effect 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

    document.body.appendChild(modal);

    document.getElementById("btn-confirm-no").onclick = () => {
      AudioManager.playTap();
      modal.remove();
    };

    document.getElementById("btn-confirm-yes").onclick = () => {
      AudioManager.playTap();
      
      // Clear local storage progress
      this.state = {
        stars: 0,
        practicedItems: {},
        unlockedBadges: {},
        unlockedStickers: 0
      };
      this.saveState();
      
      // Reset sliders UI
      document.getElementById("slider-volume").value = 80;
      document.getElementById("toggle-translation").checked = true;
      document.getElementById("toggle-playback-speed").checked = false;
      this.settings = {
        volume: 0.8,
        speed: "normal",
        showTranslation: true,
        muted: false
      };
      this.saveSettings();
      this.initSettingsUI();

      modal.remove();

      // Show temporary toast message
      const toast = document.createElement("div");
      toast.innerText = "Đã làm sạch tiến trình học tập! 🧼";
      toast.style.position = "absolute";
      toast.style.bottom = "100px";
      toast.style.left = "50%";
      toast.style.transform = "translateX(-50%)";
      toast.style.backgroundColor = "var(--text-dark)";
      toast.style.color = "#FFFFFF";
      toast.style.padding = "10px 20px";
      toast.style.borderRadius = "20px";
      toast.style.fontSize = "13px";
      toast.style.fontWeight = "800";
      toast.style.zIndex = "999";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);

      this.navigateTo("view-home");
    };
  }
};

// Start app
window.onload = () => {
  App.init();
};
