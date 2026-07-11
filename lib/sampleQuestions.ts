/**
 * Sample question pool for dev/testing convenience.
 * Used by Blitz, Pill Pack, and Time Machine creation forms.
 * No backend involvement — purely frontend test data.
 */

export interface SampleQuestion {
  question: string;
  format: "multiple_choice" | "type_answer";
  options: string[];
  correct_answer: string;
}

export interface SamplePrediction {
  question: string;
  category: string;
}

export type SampleCategory =
  | "General Knowledge"
  | "Sports"
  | "Entertainment"
  | "Geography"
  | "History"
  | "Science"
  | "Mixed";

export const SAMPLE_CATEGORIES: SampleCategory[] = [
  "Mixed",
  "General Knowledge",
  "Sports",
  "Entertainment",
  "Geography",
  "History",
  "Science",
];

// ── Per-category Q&A pools (Blitz / Pill Packs) ───────────────────────────────

const GENERAL: SampleQuestion[] = [
  { question: "What is the largest ocean on Earth?", format: "multiple_choice", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct_answer: "Pacific" },
  { question: "How many sides does a hexagon have?", format: "type_answer", options: [], correct_answer: "6" },
  { question: "Which language is most spoken in the world?", format: "multiple_choice", options: ["English", "Spanish", "Mandarin", "Hindi"], correct_answer: "Mandarin" },
  { question: "What is 15% of 200?", format: "type_answer", options: [], correct_answer: "30" },
  { question: "How many minutes are in a full day?", format: "type_answer", options: [], correct_answer: "1440" },
  { question: "What colour are the stars on the US flag?", format: "multiple_choice", options: ["Gold", "Silver", "White", "Blue"], correct_answer: "White" },
  { question: "What is the square root of 256?", format: "type_answer", options: [], correct_answer: "16" },
  { question: "How many bones are in the adult human body?", format: "multiple_choice", options: ["196", "206", "216", "186"], correct_answer: "206" },
  { question: "What is 9 × 9?", format: "type_answer", options: [], correct_answer: "81" },
  { question: "What is the currency of Japan?", format: "multiple_choice", options: ["Won", "Yuan", "Yen", "Ringgit"], correct_answer: "Yen" },
];

const SPORTS: SampleQuestion[] = [
  { question: "How many players are on a standard football (soccer) team?", format: "type_answer", options: [], correct_answer: "11" },
  { question: "Which country has won the most FIFA World Cups?", format: "multiple_choice", options: ["Germany", "Argentina", "Brazil", "Italy"], correct_answer: "Brazil" },
  { question: "In basketball, how many points is a free throw worth?", format: "type_answer", options: [], correct_answer: "1" },
  { question: "Which sport uses a shuttlecock?", format: "multiple_choice", options: ["Tennis", "Squash", "Badminton", "Volleyball"], correct_answer: "Badminton" },
  { question: "How many players are on each side in a rugby union match?", format: "type_answer", options: [], correct_answer: "15" },
  { question: "In which country did the modern Olympic Games originate?", format: "multiple_choice", options: ["Rome", "Greece", "France", "England"], correct_answer: "Greece" },
  { question: "How many rounds are in a standard boxing world championship fight?", format: "type_answer", options: [], correct_answer: "12" },
  { question: "What sport is played at Wimbledon?", format: "multiple_choice", options: ["Cricket", "Golf", "Tennis", "Polo"], correct_answer: "Tennis" },
  { question: "A standard marathon is approximately how many kilometres?", format: "multiple_choice", options: ["38km", "40km", "42km", "45km"], correct_answer: "42km" },
  { question: "How many holes are in a standard round of golf?", format: "type_answer", options: [], correct_answer: "18" },
];

const ENTERTAINMENT: SampleQuestion[] = [
  { question: "Who played Iron Man in the Marvel Cinematic Universe?", format: "multiple_choice", options: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"], correct_answer: "Robert Downey Jr." },
  { question: "What is the highest-grossing film of all time (unadjusted)?", format: "multiple_choice", options: ["Titanic", "Avatar", "Avengers: Endgame", "The Lion King"], correct_answer: "Avatar" },
  { question: "How many Harry Potter novels are there?", format: "type_answer", options: [], correct_answer: "7" },
  { question: "Which streaming platform produces 'Stranger Things'?", format: "multiple_choice", options: ["HBO", "Disney+", "Netflix", "Amazon Prime"], correct_answer: "Netflix" },
  { question: "Which Nigerian artist released the album 'More Love, Less Ego'?", format: "multiple_choice", options: ["Burna Boy", "Davido", "Wizkid", "Asake"], correct_answer: "Wizkid" },
  { question: "How many seasons does the TV show 'Breaking Bad' have?", format: "type_answer", options: [], correct_answer: "5" },
  { question: "What video game franchise features characters Mario and Luigi?", format: "multiple_choice", options: ["Sega", "Nintendo", "Sony", "Capcom"], correct_answer: "Nintendo" },
  { question: "Who wrote the play 'Romeo and Juliet'?", format: "multiple_choice", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Oscar Wilde"], correct_answer: "William Shakespeare" },
  { question: "In what year was the first iPhone released?", format: "type_answer", options: [], correct_answer: "2007" },
  { question: "Which artist has the most Grammy wins of all time?", format: "multiple_choice", options: ["Beyoncé", "Jay-Z", "Adele", "Taylor Swift"], correct_answer: "Beyoncé" },
];

const GEOGRAPHY: SampleQuestion[] = [
  { question: "What is the capital of Nigeria?", format: "type_answer", options: [], correct_answer: "Abuja" },
  { question: "What is the capital of France?", format: "type_answer", options: [], correct_answer: "Paris" },
  { question: "Which is the longest river in the world?", format: "multiple_choice", options: ["Amazon", "Mississippi", "Nile", "Yangtze"], correct_answer: "Nile" },
  { question: "What country has the largest land area?", format: "multiple_choice", options: ["USA", "Canada", "China", "Russia"], correct_answer: "Russia" },
  { question: "What is the capital of Australia?", format: "multiple_choice", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correct_answer: "Canberra" },
  { question: "How many countries are in Africa?", format: "type_answer", options: [], correct_answer: "54" },
  { question: "What is the smallest country in the world?", format: "multiple_choice", options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], correct_answer: "Vatican City" },
  { question: "Which country has the longest coastline?", format: "multiple_choice", options: ["USA", "Norway", "Australia", "Canada"], correct_answer: "Canada" },
  { question: "What is the capital of Japan?", format: "type_answer", options: [], correct_answer: "Tokyo" },
  { question: "Through how many countries does the Amazon River flow?", format: "multiple_choice", options: ["2", "3", "4", "5"], correct_answer: "3" },
];

const HISTORY: SampleQuestion[] = [
  { question: "In what year did World War II end?", format: "type_answer", options: [], correct_answer: "1945" },
  { question: "Who was the first President of the United States?", format: "multiple_choice", options: ["Abraham Lincoln", "Thomas Jefferson", "George Washington", "John Adams"], correct_answer: "George Washington" },
  { question: "In what year did Nigeria gain independence?", format: "type_answer", options: [], correct_answer: "1960" },
  { question: "Which empire built the Colosseum in Rome?", format: "multiple_choice", options: ["Greek", "Ottoman", "Roman", "Byzantine"], correct_answer: "Roman" },
  { question: "What year did the Berlin Wall fall?", format: "type_answer", options: [], correct_answer: "1989" },
  { question: "Who was the first woman to win a Nobel Prize?", format: "multiple_choice", options: ["Rosalind Franklin", "Marie Curie", "Dorothy Hodgkin", "Mother Teresa"], correct_answer: "Marie Curie" },
  { question: "In which year did the Titanic sink?", format: "type_answer", options: [], correct_answer: "1912" },
  { question: "Which ancient wonder of the world still stands today?", format: "multiple_choice", options: ["Colossus of Rhodes", "Hanging Gardens", "Great Pyramid of Giza", "Lighthouse of Alexandria"], correct_answer: "Great Pyramid of Giza" },
  { question: "What was the name of the first artificial satellite launched into space?", format: "type_answer", options: [], correct_answer: "Sputnik" },
  { question: "Who was the first person to walk on the moon?", format: "multiple_choice", options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "Michael Collins"], correct_answer: "Neil Armstrong" },
];

const SCIENCE: SampleQuestion[] = [
  { question: "What is the chemical symbol for water?", format: "multiple_choice", options: ["H2O", "CO2", "NaCl", "O2"], correct_answer: "H2O" },
  { question: "Which planet is known as the Red Planet?", format: "multiple_choice", options: ["Earth", "Mars", "Venus", "Jupiter"], correct_answer: "Mars" },
  { question: "What is the atomic number of carbon?", format: "type_answer", options: [], correct_answer: "6" },
  { question: "Which gas do plants absorb from the atmosphere?", format: "multiple_choice", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct_answer: "Carbon dioxide" },
  { question: "What is the speed of light in km/s (approximate)?", format: "multiple_choice", options: ["30,000", "150,000", "300,000", "1,000,000"], correct_answer: "300,000" },
  { question: "How many chromosomes does a normal human cell have?", format: "type_answer", options: [], correct_answer: "46" },
  { question: "What is the powerhouse of the cell?", format: "multiple_choice", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"], correct_answer: "Mitochondria" },
  { question: "What is the chemical symbol for gold?", format: "type_answer", options: [], correct_answer: "Au" },
  { question: "What is the largest planet in our solar system?", format: "type_answer", options: [], correct_answer: "Jupiter" },
  { question: "What force keeps planets in orbit around the sun?", format: "multiple_choice", options: ["Magnetism", "Friction", "Gravity", "Nuclear force"], correct_answer: "Gravity" },
];

// ── Per-category prediction pools (Time Machine) ──────────────────────────────
// Phrased as predictive questions players answer before an event.

const PREDICTIONS_BY_CATEGORY: Record<Exclude<SampleCategory, "Mixed">, SamplePrediction[]> = {
  "Sports": [
    { question: "Will the Super Eagles win their next AFCON qualifying match?", category: "Sports" },
    { question: "Which team will score first in the next Premier League El Clasico?", category: "Sports" },
    { question: "Will Manchester City finish in the top 4 this season?", category: "Sports" },
    { question: "How many goals will be scored in the next Nigeria vs Ghana match?", category: "Sports" },
    { question: "Will Novak Djokovic win the next Grand Slam he enters?", category: "Sports" },
    { question: "Will the next boxing heavyweight title fight go to a decision?", category: "Sports" },
    { question: "Which team will win the next UEFA Champions League final?", category: "Sports" },
    { question: "Will the next F1 race be won by a non-Red Bull driver?", category: "Sports" },
  ],
  "Entertainment": [
    { question: "Will Burna Boy win a Grammy at the next ceremony?", category: "Entertainment" },
    { question: "Which film will gross the most at the box office this weekend?", category: "Entertainment" },
    { question: "Will the next season of Squid Game outperform Season 1 in viewership?", category: "Entertainment" },
    { question: "Will Wizkid release a new album before the end of this year?", category: "Entertainment" },
    { question: "Will the next Marvel film score above 80% on Rotten Tomatoes?", category: "Entertainment" },
    { question: "Will the next Big Brother Nigeria eviction be unanimous?", category: "Entertainment" },
    { question: "Which Nigerian artist will top the Apple Music chart this Friday?", category: "Entertainment" },
    { question: "Will the next Nollywood blockbuster debut in cinemas this month?", category: "Entertainment" },
  ],
  "General Knowledge": [
    { question: "Will the Nigerian naira strengthen against the dollar this week?", category: "General Knowledge" },
    { question: "Will Nigeria's inflation rate drop below 25% by next month?", category: "General Knowledge" },
    { question: "Will the next federal budget pass before the constitutional deadline?", category: "General Knowledge" },
    { question: "Will fuel prices increase in the next government price review?", category: "General Knowledge" },
    { question: "Will Nigeria's electricity grid experience a national blackout this month?", category: "General Knowledge" },
    { question: "Will the CBN hold interest rates at the next MPC meeting?", category: "General Knowledge" },
    { question: "Will the Lagos traffic index improve or worsen this quarter?", category: "General Knowledge" },
    { question: "Will average data costs in Nigeria drop this year?", category: "General Knowledge" },
  ],
  "Geography": [
    { question: "Will Lagos surpass Cairo as Africa's most populated city by 2030?", category: "Geography" },
    { question: "Will any new country join the African Union this year?", category: "Geography" },
    { question: "Will the next UN climate summit produce a binding agreement?", category: "Geography" },
    { question: "Will a West African nation host the next FIFA World Cup?", category: "Geography" },
    { question: "Will sea levels visibly affect a major coastal African city this year?", category: "Geography" },
    { question: "Will ECOWAS expand its membership this decade?", category: "Geography" },
    { question: "Will the Congo Basin forest cover shrink further by next year's report?", category: "Geography" },
    { question: "Will a new trans-African highway project be announced this year?", category: "Geography" },
  ],
  "History": [
    { question: "Will historians declare the 2020s a turning point for democracy globally?", category: "History" },
    { question: "Will a major African nation hold a disputed election this year?", category: "History" },
    { question: "Will any colonial-era artifacts be returned to Nigeria this year?", category: "History" },
    { question: "Will a new constitution be passed in any West African country this year?", category: "History" },
    { question: "Will any country officially apologise for the transatlantic slave trade this decade?", category: "History" },
    { question: "Will the Nigerian government formally memorialise the Biafra war this year?", category: "History" },
    { question: "Will UNESCO add a new Nigerian site to its World Heritage List?", category: "History" },
    { question: "Will a coup attempt occur in West Africa this year?", category: "History" },
  ],
  "Science": [
    { question: "Will a new COVID variant trigger travel bans before year end?", category: "Science" },
    { question: "Will any country announce a working nuclear fusion reactor this year?", category: "Science" },
    { question: "Will NASA launch the next crewed moon mission on schedule?", category: "Science" },
    { question: "Will a major tech company announce a general-purpose AI model this quarter?", category: "Science" },
    { question: "Will Nigeria's tech startup funding exceed $1 billion this year?", category: "Science" },
    { question: "Will solar energy overtake coal globally by next year's IEA report?", category: "Science" },
    { question: "Will a breakthrough malaria vaccine be approved this year?", category: "Science" },
    { question: "Will Elon Musk's Starship successfully orbit Earth this year?", category: "Science" },
  ],
};

// ── Combined maps ─────────────────────────────────────────────────────────────

const POOL_BY_CATEGORY: Record<Exclude<SampleCategory, "Mixed">, SampleQuestion[]> = {
  "General Knowledge": GENERAL,
  "Sports": SPORTS,
  "Entertainment": ENTERTAINMENT,
  "Geography": GEOGRAPHY,
  "History": HISTORY,
  "Science": SCIENCE,
};

const ALL_QUESTIONS: SampleQuestion[] = Object.values(POOL_BY_CATEGORY).flat();
const ALL_PREDICTIONS: SamplePrediction[] = Object.values(PREDICTIONS_BY_CATEGORY).flat();

// ── Pill fee/prize variance per category ──────────────────────────────────────
// [entry_fee, prize] pairs — varied so generated pills feel different

const PILL_PRICING: Record<Exclude<SampleCategory, "Mixed">, Array<[number, number]>> = {
  "General Knowledge": [[200, 600], [300, 900], [200, 500], [400, 1200], [250, 750]],
  "Sports":            [[300, 1000], [500, 1500], [200, 700], [400, 1200], [300, 900]],
  "Entertainment":     [[200, 500], [300, 800], [400, 1000], [200, 600], [500, 1500]],
  "Geography":         [[200, 600], [300, 800], [500, 1500], [200, 500], [400, 1200]],
  "History":           [[400, 1200], [300, 900], [500, 1500], [200, 700], [300, 1000]],
  "Science":           [[500, 1500], [400, 1200], [300, 900], [600, 2000], [400, 1000]],
};

const TIMERS = [20, 25, 30, 30, 30, 45, 60];

// ── Generators ────────────────────────────────────────────────────────────────

/**
 * Generate exactly `count` Q&A questions for Blitz / Pill Pack use.
 * Mixed: shuffles all categories. Single category: sequential, cycles if N > pool.
 * If N > single-category pool, fills overflow from Mixed.
 */
export function generateSampleQuestions(
  count: number,
  category: SampleCategory = "Mixed",
  offset = 0,
): SampleQuestion[] {
  if (count <= 0) return [];

  if (category === "Mixed") {
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
    return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
  }

  const pool = POOL_BY_CATEGORY[category];

  if (count <= pool.length) {
    return Array.from({ length: count }, (_, i) => pool[(offset + i) % pool.length]);
  }

  const fromCategory = pool.map((q) => ({ ...q }));
  const needed = count - fromCategory.length;
  const shuffledAll = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  const overflow = Array.from({ length: needed }, (_, i) => shuffledAll[i % shuffledAll.length]);
  return [...fromCategory, ...overflow];
}

/**
 * Generate pill data with varied entry_fee / prize / timer values.
 * Returns SampleQuestion extended with pill-specific fields.
 */
export function generateSamplePills(
  count: number,
  category: SampleCategory = "Mixed",
): Array<SampleQuestion & { entry_fee: number; prize: number; timer: number }> {
  const questions = generateSampleQuestions(count, category);
  const pricingPool = category === "Mixed"
    ? Object.values(PILL_PRICING).flat()
    : PILL_PRICING[category as Exclude<SampleCategory, "Mixed">];

  return questions.map((q, i) => {
    const [entry_fee, prize] = pricingPool[i % pricingPool.length];
    const timer = TIMERS[i % TIMERS.length];
    return { ...q, entry_fee, prize, timer };
  });
}

/**
 * Pick one prediction question for Time Machine use.
 * Returns question text + a suggested category string.
 * Also returns randomized entry_fee / prize_per_winner / max_slots.
 */
export function generateSamplePrediction(category: SampleCategory = "Mixed"): {
  question: string;
  category: string;
  entry_fee: number;
  prize_per_winner: number;
  max_slots: number;
} {
  let pool: SamplePrediction[];
  if (category === "Mixed") {
    pool = [...ALL_PREDICTIONS].sort(() => Math.random() - 0.5);
  } else {
    pool = PREDICTIONS_BY_CATEGORY[category as Exclude<SampleCategory, "Mixed">];
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];

  // Randomize numbers within sensible ranges
  const entryOptions = [200, 300, 500, 500, 500, 1000];
  const prizeMultipliers = [3, 4, 5, 6, 8];
  const slotOptions = [20, 30, 50, 50, 100, 200];

  const entry_fee = entryOptions[Math.floor(Math.random() * entryOptions.length)];
  const mult = prizeMultipliers[Math.floor(Math.random() * prizeMultipliers.length)];
  const max_slots = slotOptions[Math.floor(Math.random() * slotOptions.length)];

  return {
    question: pick.question,
    category: category === "Mixed" ? pick.category : category,
    entry_fee,
    prize_per_winner: entry_fee * mult,
    max_slots,
  };
}
