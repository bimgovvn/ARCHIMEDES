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
    titleVi: "Hoa quả & Rau củ",
    titleEn: "Fruits & Veggies",
    emoji: "🍓",
    badgeId: "fruit_basket",
    badgeEmoji: "🧺",
    badgeName: "Huy hiệu Giỏ Trái Cây",
    words: [
      { word: "Banana", vi: "Quả chuối", emoji: "🍌", context: "I like to eat a banana.", contextVi: "Tớ thích ăn một quả chuối." },
      { word: "Pear", vi: "Quả lê", emoji: "🍐", context: "This pear is sweet.", contextVi: "Quả lê này ngọt quá." },
      { word: "Tomato", vi: "Quả cà chua", emoji: "🍅", context: "A red tomato.", contextVi: "Một quả cà chua màu đỏ." },
      { word: "Carrot", vi: "Củ cà rốt", emoji: "🥕", context: "Rabbits love carrots.", contextVi: "Những chú thỏ yêu cà rốt." },
      { word: "Onion", vi: "Củ hành tây", emoji: "🧅", context: "Peeling an onion makes me cry.", contextVi: "Bóc hành tây làm tớ chảy nước mắt." },
      { word: "Orange", vi: "Quả cam", emoji: "🍊", context: "Orange juice is healthy.", contextVi: "Nước cam rất tốt cho sức khỏe." },
      { word: "Pineapple", vi: "Quả dứa", emoji: "🍍", context: "Pineapple is yellow and juicy.", contextVi: "Quả dứa màu vàng và mọng nước." },
      { word: "Potato", vi: "Củ khoai tây", emoji: "🥔", context: "Mashed potatoes are delicious.", contextVi: "Khoai tây nghiền ăn rất ngon." },
      { word: "Broccoli", vi: "Súp lơ xanh", emoji: "🥦", context: "Eat your broccoli, it is good!", contextVi: "Hãy ăn súp lơ xanh nhé, tốt lắm đấy!" },
      { word: "Strawberry", vi: "Quả dâu tây", emoji: "🍓", context: "Strawberries are bright red.", contextVi: "Những quả dâu tây có màu đỏ tươi." }
    ]
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

// Metadata for PDF worksheets in the docs folder
const WORKSHEETS_DATA = [
  {
    filename: "LET_S START 2022-PHIẾU TỰ LUYỆN SỐ 1.pdf",
    title: "Phiếu Tự Luyện Số 1",
    description: "Học chữ cái (a, u, e, i), đếm dâu tây, nối phép tính rùa, nhận biết hình khối.",
    emoji: "✏️",
    pages: 4,
    type: "vietnamese_math"
  },
  {
    filename: "LET_S START 2022-PHIẾU TỰ LUYỆN SỐ 2.pdf",
    title: "Phiếu Tự Luyện Số 2",
    description: "Tập đọc từ/câu, tô âm (m, n, h), tìm quy luật, so sánh số, phân biệt chẵn/lẻ.",
    emoji: "📖",
    pages: 4,
    type: "vietnamese_math"
  },
  {
    filename: "LET_S START 2022-PHIẾU TỰ LUYỆN SỐ 3.pdf",
    title: "Phiếu Tự Luyện Số 3",
    description: "Ghép chữ với tranh, gạch chân âm 'r', ghép câu tiếng Việt, làm toán xe ô tô.",
    emoji: "🧩",
    pages: 4,
    type: "vietnamese_math"
  },
  {
    filename: "Phiếu trải nghiệm 14_03.pdf",
    title: "Phiếu Trải Nghiệm 14/03",
    description: "Làm toán tia số, phép cộng thêm/được, ghép hình vuông, truyện Gấu con cảm ơn.",
    emoji: "🌟",
    pages: 5,
    type: "general"
  },
  {
    filename: "ARCH- SOI GUONG - CHIEU VAT.pdf",
    title: "Phiếu Soi Gương & Chiếu Vật",
    description: "Bài tập tư duy không gian: Nhìn vật qua gương soi và hướng chiếu ánh sáng.",
    emoji: "🪞",
    pages: 16,
    type: "spatial"
  },
  {
    filename: "Sudoku hình ảnh.pdf",
    title: "Trò chơi Sudoku Hình Ảnh",
    description: "51 trang giải đố Sudoku bằng hình ảnh ngộ nghĩnh kích thích trí não của bé.",
    emoji: "🦊",
    pages: 51,
    type: "puzzle"
  },
  {
    filename: "Top view worksheet.pdf",
    title: "Phiếu Góc Nhìn Từ Trên (Top View)",
    description: "Rèn luyện khả năng quan sát và hình dung vật thể từ góc nhìn phía trên cao.",
    emoji: "🚁",
    pages: 32,
    type: "spatial"
  },
  {
    filename: "Phiếu tự luyện số 1 2023.pdf",
    title: "Phiếu Tự Luyện 2023",
    description: "Đề bài tập ôn hè rèn luyện tư duy toán học và ngôn ngữ tổng hợp.",
    emoji: "🍀",
    pages: 2,
    type: "general"
  }
];

