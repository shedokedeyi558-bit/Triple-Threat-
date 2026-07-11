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

// ── Per-category pools ────────────────────────────────────────────────────────

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

// ── Combined map ──────────────────────────────────────────────────────────────

const POOL_BY_CATEGORY: Record<Exclude<SampleCategory, "Mixed">, SampleQuestion[]> = {
  "General Knowledge": GENERAL,
  "Sports": SPORTS,
  "Entertainment": ENTERTAINMENT,
  "Geography": GEOGRAPHY,
  "History": HISTORY,
  "Science": SCIENCE,
};

const ALL_QUESTIONS: SampleQuestion[] = Object.values(POOL_BY_CATEGORY).flat();

// ── Generator ─────────────────────────────────────────────────────────────────

/**
 * Generate exactly `count` sample questions from the chosen category.
 *
 * - "Mixed": random sample across all categories.
 * - Single category: sequential from that category's pool, cycling if N > pool size.
 * - If N > single-category pool size, falls back to Mixed automatically for the overflow.
 */
export function generateSampleQuestions(
  count: number,
  category: SampleCategory = "Mixed",
  offset = 0,
): SampleQuestion[] {
  if (count <= 0) return [];

  if (category === "Mixed") {
    // Fisher-Yates shuffle of all questions, then cycle
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
    return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
  }

  const pool = POOL_BY_CATEGORY[category];

  if (count <= pool.length) {
    // Enough in this category — sequential from offset
    return Array.from({ length: count }, (_, i) => pool[(offset + i) % pool.length]);
  }

  // N exceeds single-category pool — use the category pool fully, then fill remainder from Mixed
  const fromCategory = pool.map((q) => ({ ...q }));
  const needed = count - fromCategory.length;
  const shuffledAll = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  const overflow = Array.from({ length: needed }, (_, i) => shuffledAll[i % shuffledAll.length]);
  return [...fromCategory, ...overflow];
}
