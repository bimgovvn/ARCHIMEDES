// COLOR ME Vocabulary Data
const TOPICS_DATA = {
  greetings: {
    id: "greetings",
    titleVi: "Chào hỏi",
    titleEn: "Greetings",
    emoji: "👋",
    badgeId: "wave",
    badgeEmoji: "👋",
    badgeName: "Huy hiệu Vẫy Tay",
    words: [
      { word: "Hello", vi: "Xin chào", emoji: "👋", context: "Hello, children!", contextVi: "Xin chào các bé!" },
      { word: "Hi", vi: "Chào bé", emoji: "😊", context: "Hi, friend!", contextVi: "Chào bạn!" },
      { word: "Good morning", vi: "Chào buổi sáng", emoji: "☀️", context: "Good morning, teacher!", contextVi: "Chào buổi sáng cô giáo!" },
      { word: "Good afternoon", vi: "Chào buổi chiều", emoji: "🌤️", context: "Good afternoon, mom!", contextVi: "Chào buổi chiều mẹ!" },
      { word: "Goodbye", vi: "Tạm biệt", emoji: "👋", context: "Goodbye, see you again!", contextVi: "Tạm biệt, hẹn gặp lại!" },
      { word: "See you!", vi: "Hẹn gặp lại!", emoji: "✨", context: "See you tomorrow!", contextVi: "Hẹn gặp lại ngày mai!" }
    ]
  },
  feelings: {
    id: "feelings",
    titleVi: "Cảm xúc",
    titleEn: "Feelings",
    emoji: "😊",
    badgeId: "heart",
    badgeEmoji: "❤️",
    badgeName: "Huy hiệu Trái Tim",
    words: [
      { word: "Happy", vi: "Vui vẻ", emoji: "😊", context: "I feel HAPPY today!", contextVi: "Hôm nay tớ cảm thấy VUI VẺ!" },
      { word: "Sad", vi: "Buồn bã", emoji: "😢", context: "I feel SAD today!", contextVi: "Hôm nay tớ cảm thấy BUỒN BÃ!" },
      { word: "Angry", vi: "Tức giận", emoji: "😡", context: "I feel ANGRY today!", contextVi: "Hôm nay tớ cảm thấy TỨC GIẬN!" },
      { word: "Scared", vi: "Sợ hãi", emoji: "😨", context: "I feel SCARED today!", contextVi: "Hôm nay tớ cảm thấy SỢ HÃI!" },
      { word: "Shocked", vi: "Ngạc nhiên", emoji: "😲", context: "I feel SHOCKED today!", contextVi: "Hôm nay tớ cảm thấy NGẠC NHIÊN!" },
      { word: "Proud", vi: "Tự hào", emoji: "😎", context: "I feel PROUD today!", contextVi: "Hôm nay tớ cảm thấy TỰ HÀO!" }
    ]
  },
  colors: {
    id: "colors",
    titleVi: "Màu sắc",
    titleEn: "Colors",
    emoji: "🎨",
    badgeId: "rainbow",
    badgeEmoji: "🌈",
    badgeName: "Huy hiệu Cầu Vồng",
    words: [
      { word: "Red", vi: "Màu đỏ", emoji: "🔴", color: "#FF3B30", primary: true },
      { word: "Blue", vi: "Màu xanh dương", emoji: "🔵", color: "#007AFF", primary: true },
      { word: "Yellow", vi: "Màu vàng", emoji: "🟡", color: "#FFCC00", primary: true },
      { word: "Green", vi: "Màu xanh lá", emoji: "🟢", color: "#34C759", primary: false },
      { word: "Orange", vi: "Màu cam", emoji: "🟠", color: "#FF9500", primary: false },
      { word: "Purple", vi: "Màu tím", emoji: "🟣", color: "#AF52DE", primary: false }
    ],
    mixing: [
      { color1: "Red", color2: "Blue", result: "Purple", emoji: "🟣" },
      { color1: "Red", color2: "Yellow", result: "Orange", emoji: "🟠" },
      { color1: "Blue", color2: "Yellow", result: "Green", emoji: "🟢" }
    ]
  },
  shapes: {
    id: "shapes",
    titleVi: "Hình khối",
    titleEn: "Shapes",
    emoji: "🔺",
    badgeId: "pizza",
    badgeEmoji: "🍕",
    badgeName: "Huy hiệu Pizza",
    words: [
      { word: "Square", vi: "Hình vuông", emoji: "🟩", sides: 4 },
      { word: "Rectangle", vi: "Hình chữ nhật", emoji: "▮", sides: 4 },
      { word: "Triangle", vi: "Hình tam giác", emoji: "🔺", sides: 3 },
      { word: "Circle", vi: "Hình tròn", emoji: "🔴", sides: 0 },
      { word: "Oval", vi: "Hình bầu dục", emoji: "🥚", sides: 0 },
      { word: "Hexagon", vi: "Hình lục giác", emoji: "⬡", sides: 6 }
    ]
  },
  animals: {
    id: "animals",
    titleVi: "Động vật",
    titleEn: "Animals",
    emoji: "🐧",
    badgeId: "penguin",
    badgeEmoji: "🐧",
    badgeName: "Huy hiệu Cánh Cụt",
    words: [
      { word: "Dog", vi: "Con chó", emoji: "🐶", soundType: "bark" },
      { word: "Cat", vi: "Con mèo", emoji: "🐱", soundType: "meow" },
      { word: "Penguin", vi: "Chim cánh cụt", emoji: "🐧", soundType: "penguin" },
      { word: "Bird", vi: "Con chim", emoji: "🐦", soundType: "tweet" },
      { word: "Fish", vi: "Con cá", emoji: "🐠", soundType: "bubble" },
      { word: "Rabbit", vi: "Con thỏ", emoji: "🐰", soundType: "squeak" }
    ]
  },
  fruits: {
    id: "fruits",
    titleVi: "Trái cây",
    titleEn: "Fruits",
    emoji: "🍓",
    badgeId: "market_helper",
    badgeEmoji: "🛒",
    badgeName: "Market Helper",
    words: [
      { word: "Strawberry", vi: "Dâu tây", emoji: "🍓", colorHint: "Red — Đỏ", colorId: "red", context: "This is a strawberry. It is red!", contextVi: "Đây là quả dâu tây. Nó màu đỏ!" },
      { word: "Banana", vi: "Chuối", emoji: "🍌", colorHint: "Yellow — Vàng", colorId: "yellow", context: "This is a banana. It is yellow!", contextVi: "Đây là quả chuối. Nó màu vàng!" },
      { word: "Apple", vi: "Táo", emoji: "🍎", colorHint: "Red or Green — Đỏ/Xanh", colorId: "red", context: "This is an apple. It is red or green!", contextVi: "Đây là quả táo. Nó màu đỏ hoặc xanh lá!" },
      { word: "Orange", vi: "Cam", emoji: "🍊", colorHint: "Orange — Cam", colorId: "orange", context: "This is an orange. It is orange!", contextVi: "Đây là quả cam. Nó màu cam!" },
      { word: "Grape", vi: "Nho", emoji: "🍇", colorHint: "Purple — Tím", colorId: "purple", context: "This is a grape. It is purple!", contextVi: "Đây là quả nho. Nó màu tím!" },
      { word: "Watermelon", vi: "Dưa hấu", emoji: "🍉", colorHint: "Green outside, Red inside — Xanh vỏ đỏ lòng", colorId: "green", context: "This is a watermelon. It is green outside, red inside!", contextVi: "Đây là quả dưa hấu. Nó vỏ xanh lòng đỏ!" },
      { word: "Mango", vi: "Xoài", emoji: "🥭", colorHint: "Yellow — Vàng", colorId: "yellow", context: "This is a mango. It is yellow!", contextVi: "Đây là quả xoài. Nó màu vàng!" }
    ]
  },
  science: {
    id: "science",
    titleVi: "Khoa học",
    titleEn: "Life Cycle",
    emoji: "🔬",
    badgeId: "green_thumb",
    badgeEmoji: "🌱",
    badgeName: "Green Thumb",
    words: [
      { word: "Seed", vi: "Hạt giống", emoji: "🌱", context: "A tiny seed is planted in the ground.", contextVi: "Một hạt nhỏ được gieo xuống đất." },
      { word: "Sprout", vi: "Cây non", emoji: "🌿", context: "The seed grows into a little plant.", contextVi: "Hạt nảy mầm thành cây non." },
      { word: "Flower", vi: "Hoa", emoji: "🌼", context: "The plant grows a beautiful flower.", contextVi: "Cây ra hoa trắng xinh." },
      { word: "Fruit", vi: "Quả dâu tây", emoji: "🍓", context: "The flower becomes a ripe, red strawberry!", contextVi: "Hoa kết thành quả dâu tây đỏ mọng!" }
    ]
  },
  cooking: {
    id: "cooking",
    titleVi: "Nấu ăn",
    titleEn: "Yogurt Recipe",
    emoji: "🍳",
    badgeId: "little_chef",
    badgeEmoji: "🍧",
    badgeName: "Little Chef",
    words: [
      { word: "Step 1", vi: "Chọn trái cây", emoji: "🍓" },
      { word: "Step 2", vi: "Múc sữa chua", emoji: "🥄" },
      { word: "Step 3", vi: "Trang trí cốc", emoji: "🎨" },
      { word: "Step 4", vi: "Thưởng thức", emoji: "😋" }
    ]
  },
  locked: {
    id: "locked",
    titleVi: "Sắp ra mắt!",
    titleEn: "Coming Soon!",
    emoji: "🔒",
    badgeId: "locked_badge",
    badgeEmoji: "🔒",
    badgeName: "Locked Badge",
    words: []
  },
  poem: {
    id: "poem",
    titleVi: "Bài thơ Bạn mới",
    titleEn: "Poem",
    emoji: "📖",
    badgeId: "book",
    badgeEmoji: "📚",
    badgeName: "Huy hiệu Sách Học",
    author: "Nguyệt Mai",
    words: [
      { line: "Bạn mới đến trường", translation: "New friend goes to school" },
      { line: "Hãy còn nhút nhát", translation: "Still feeling a bit shy" },
      { line: "Em dạy bạn hát", translation: "I teach my friend to sing" },
      { line: "Rủ bạn cùng chơi", translation: "Invite my friend to play" },
      { line: "Cô thấy cô cười", translation: "Teacher sees and smiles" },
      { line: "Cô khen đoàn kết", translation: "She praises our team spirit" }
    ]
  }
};

// Metadata for interactive challenges based on worksheets
const CHALLENGES_DATA = [
  {
    id: "turtle_math",
    title: "Thử thách 1: Phép tính Rùa 🐢",
    description: "Nối các phép tính cộng trừ thú vị với các chú rùa mang số kết quả đúng.",
    emoji: "🐢",
    difficulty: "Dễ",
    reward: "3 sao ⭐"
  },
  {
    id: "sound_hunt",
    title: "Thử thách 2: Săn âm tìm chữ 🔍",
    description: "Nhận biết âm tiếng Việt: Tìm tất cả các từ có chứa âm 'l' hoặc 'r' ẩn giấu.",
    emoji: "🔍",
    difficulty: "Dễ",
    reward: "3 sao ⭐"
  },
  {
    id: "sentence_builder",
    title: "Thử thách 3: Ghép câu hoàn chỉnh ✍️",
    description: "Sắp xếp các khối từ bị xáo trộn để tạo thành một câu có nghĩa.",
    emoji: "✍️",
    difficulty: "Trung bình",
    reward: "3 sao ⭐"
  },
  {
    id: "balloon_pop",
    title: "Thử thách 4: Bóng bay Chẵn/Lẻ 🎈",
    description: "Phân biệt số Chẵn và số Lẻ bằng cách chạm nổ những chiếc bóng bay sắc màu.",
    emoji: "🎈",
    difficulty: "Dễ",
    reward: "3 sao ⭐"
  },
  {
    id: "story_quiz",
    title: "Thử thách 5: Chuyện kể Gấu con 🐻",
    description: "Tìm hiểu câu chuyện Gấu con cứu hộ và làm quen với lời Cảm ơn, Xin lỗi.",
    emoji: "🐻",
    difficulty: "Trung bình",
    reward: "3 sao ⭐"
  }
];

