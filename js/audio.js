// COLOR ME Audio Manager
const AudioManager = {
  // Web Audio Context for synthesizer sounds
  audioCtx: null,
  speechSynth: window.speechSynthesis,
  voices: [],
  englishVoice: null,
  vietnameseVoice: null,

  // Recording state
  mediaRecorder: null,
  audioChunks: [],
  recordedAudioUrl: null,
  isRecording: false,

  init() {
    // Initialize voices
    this.loadVoices();
    if (this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = () => this.loadVoices();
    }
  },

  loadVoices() {
    this.voices = this.speechSynth.getVoices();
    // Prefer Google or standard US English voices
    this.englishVoice = this.voices.find(v => v.lang.startsWith("en-US")) || 
                         this.voices.find(v => v.lang.startsWith("en")) || 
                         this.voices[0];
    
    // Prefer Vietnamese voices
    this.vietnameseVoice = this.voices.find(v => v.lang.startsWith("vi-VN")) || 
                           this.voices.find(v => v.lang.startsWith("vi")) || 
                           null;
  },

  getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  // Speech Synthesis helper
  speak(text, isVietnamese = false, speed = "normal", callback = null) {
    if (!this.speechSynth) return;
    this.speechSynth.cancel(); // Stop any ongoing speech

    // Volume configuration from settings
    const settings = this.getSettings();
    if (settings.muted) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = isVietnamese ? this.vietnameseVoice : this.englishVoice;
    utterance.lang = isVietnamese ? "vi-VN" : "en-US";
    
    // Speed control
    let rate = 1.0;
    if (speed === "slow") {
      rate = 0.65;
    } else if (settings.speed === "slow") {
      rate = 0.65;
    }
    utterance.rate = rate;
    utterance.volume = settings.volume;

    utterance.onend = () => {
      if (callback) callback();
    };
    utterance.onerror = () => {
      if (callback) callback();
    };

    this.speechSynth.speak(utterance);
  },

  stopSpeaking() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
  },

  getSettings() {
    const saved = localStorage.getItem("colorme_settings");
    if (saved) {
      return JSON.parse(saved);
    }
    return { volume: 0.8, speed: "normal", showTranslation: true, muted: false };
  },

  // Synth Sounds (UI Feedback)
  playCorrect() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const settings = this.getSettings();
      if (settings.muted) return;

      const playTone = (freq, time, duration) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.exponentialRampToValueAtTime(settings.volume * 0.3, time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      // Play major arpeggio
      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.08, 0.15); // E5
      playTone(783.99, now + 0.16, 0.15); // G5
      playTone(1046.50, now + 0.24, 0.3); // C6
    } catch (e) {
      console.warn("Failed playing sound synth:", e);
    }
  },

  playStar() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const settings = this.getSettings();
      if (settings.muted) return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3); // A6
      
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(settings.volume * 0.25, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  },

  playTap() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const settings = this.getSettings();
      if (settings.muted) return;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
      
      gainNode.gain.setValueAtTime(settings.volume * 0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  },

  // Animal sound synthesizer
  playAnimalSound(type) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const settings = this.getSettings();
      if (settings.muted) return;

      const vol = settings.volume;

      switch(type) {
        case "bark": // Dog
          // Two short barks
          const bark = (time) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(320, time);
            osc.frequency.exponentialRampToValueAtTime(140, time + 0.12);
            
            gainNode.gain.setValueAtTime(0.001, time);
            gainNode.gain.exponentialRampToValueAtTime(vol * 0.3, time + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + 0.15);
          };
          bark(now);
          bark(now + 0.22);
          break;

        case "meow": // Cat
          // Meow sweep: rises then falls
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = "triangle";
          
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(500, now + 0.4);
          
          gainNode.gain.setValueAtTime(0.001, now);
          gainNode.gain.exponentialRampToValueAtTime(vol * 0.25, now + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;

        case "tweet": // Bird
          // High speed squeaks
          const chirp = (time) => {
            const oscBird = ctx.createOscillator();
            const gainNodeBird = ctx.createGain();
            oscBird.type = "sine";
            oscBird.frequency.setValueAtTime(1800, time);
            oscBird.frequency.exponentialRampToValueAtTime(3800, time + 0.08);
            
            gainNodeBird.gain.setValueAtTime(0.001, time);
            gainNodeBird.gain.exponentialRampToValueAtTime(vol * 0.2, time + 0.02);
            gainNodeBird.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
            
            oscBird.connect(gainNodeBird);
            gainNodeBird.connect(ctx.destination);
            oscBird.start(time);
            oscBird.stop(time + 0.08);
          };
          chirp(now);
          chirp(now + 0.12);
          chirp(now + 0.24);
          break;

        case "bubble": // Fish (Glub)
          const bubble = (time) => {
            const oscFish = ctx.createOscillator();
            const gainNodeFish = ctx.createGain();
            oscFish.type = "sine";
            oscFish.frequency.setValueAtTime(100, time);
            oscFish.frequency.exponentialRampToValueAtTime(450, time + 0.12);
            
            gainNodeFish.gain.setValueAtTime(0.001, time);
            gainNodeFish.gain.exponentialRampToValueAtTime(vol * 0.25, time + 0.04);
            gainNodeFish.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            
            oscFish.connect(gainNodeFish);
            gainNodeFish.connect(ctx.destination);
            oscFish.start(time);
            oscFish.stop(time + 0.12);
          };
          bubble(now);
          bubble(now + 0.18);
          break;

        case "penguin": // Honk squawk
          const oscPen = ctx.createOscillator();
          const oscPen2 = ctx.createOscillator();
          const gainPen = ctx.createGain();
          
          oscPen.type = "sawtooth";
          oscPen.frequency.setValueAtTime(150, now);
          oscPen.frequency.linearRampToValueAtTime(180, now + 0.3);

          oscPen2.type = "triangle";
          oscPen2.frequency.setValueAtTime(155, now);
          oscPen2.frequency.linearRampToValueAtTime(185, now + 0.3);
          
          gainPen.gain.setValueAtTime(0.001, now);
          gainPen.gain.linearRampToValueAtTime(vol * 0.2, now + 0.05);
          gainPen.gain.linearRampToValueAtTime(0.001, now + 0.3);
          
          oscPen.connect(gainPen);
          oscPen2.connect(gainPen);
          gainPen.connect(ctx.destination);
          
          oscPen.start(now);
          oscPen2.start(now);
          oscPen.stop(now + 0.3);
          oscPen2.stop(now + 0.3);
          break;

        case "squeak": // Rabbit
          const oscRab = ctx.createOscillator();
          const gainRab = ctx.createGain();
          oscRab.type = "sine";
          oscRab.frequency.setValueAtTime(2500, now);
          oscRab.frequency.linearRampToValueAtTime(2800, now + 0.1);
          
          gainRab.gain.setValueAtTime(0.001, now);
          gainRab.gain.exponentialRampToValueAtTime(vol * 0.15, now + 0.02);
          gainRab.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          
          oscRab.connect(gainRab);
          gainRab.connect(ctx.destination);
          oscRab.start(now);
          oscRab.stop(now + 0.1);
          break;
      }
    } catch(e) {}
  },

  // SPEAK Mode Voice Recording
  async startRecording(onStart = null, onError = null) {
    if (this.isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      
      const options = { mimeType: 'audio/webm' };
      // Fallback if audio/webm is not supported (like iOS Safari)
      try {
        this.mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        this.mediaRecorder = new MediaRecorder(stream);
      }

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
        if (this.recordedAudioUrl) {
          URL.revokeObjectURL(this.recordedAudioUrl);
        }
        this.recordedAudioUrl = URL.createObjectURL(audioBlob);
        
        // Stop all tracks in the stream to release mic icon
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      if (onStart) onStart();
    } catch (err) {
      console.error("Mic access denied or error:", err);
      if (onError) onError(err);
    }
  },

  stopRecording(onStop = null) {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.mediaRecorder.addEventListener('stop', () => {
      this.isRecording = false;
      if (onStop) {
        // Give a short delay to ensure blob is created
        setTimeout(() => {
          onStop(this.recordedAudioUrl);
        }, 100);
      }
    }, { once: true });

    this.mediaRecorder.stop();
  },

  playRecording() {
    if (!this.recordedAudioUrl) return;
    const audio = new Audio(this.recordedAudioUrl);
    const settings = this.getSettings();
    audio.volume = settings.volume;
    audio.play().catch(e => console.error("Playback error:", e));
  },

  // Generates encouraging feedback message and star count for speaking practice.
  // We make it highly positive and gamified.
  evaluateVoiceSample() {
    // Returns { stars: 1-3, text: String }
    const feedbackTexts = {
      3: [
        "Tuyệt vời bé ơi! ⭐⭐⭐",
        "Con nói hay quá! ⭐⭐⭐",
        "Đúng rồi bé ơi! Siêu thế! ⭐⭐⭐",
        "Bé phát âm giỏi quá! ⭐⭐⭐"
      ],
      2: [
        "Rất tốt bé ơi! ⭐⭐",
        "Gần đúng rồi, giỏi quá! ⭐⭐",
        "Bé làm tốt lắm! ⭐⭐"
      ],
      1: [
        "Thêm một lần nữa nhé! 💪⭐",
        "Cố gắng lên bé yêu! 💪⭐",
        "Bé làm lại xem nào! 💪⭐"
      ]
    };

    // Randomize but lean heavily towards 2 and 3 stars for kids
    const roll = Math.random();
    let stars = 3;
    if (roll < 0.1) {
      stars = 1;
    } else if (roll < 0.3) {
      stars = 2;
    }

    const list = feedbackTexts[stars];
    const text = list[Math.floor(Math.random() * list.length)];

    return { stars, text };
  }
};

// Initialize audio manager
AudioManager.init();
