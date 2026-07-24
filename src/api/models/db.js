/**
 * In-memory database with seed data
 * Replace with MongoDB/PostgreSQL in production
 */

const bcrypt = require('bcryptjs');

// ── Users ────────────────────────────────────────────────────────────────────
const users = [
  {
    id: 'u-001',
    name: 'Alex Johnson',
    email: 'alex@brightmind.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'learner',
    profile: {
      avatar: '🧑‍🎓',
      level: 1,
      xp: 340,
      streak: 7,
      accessibility: {
        ttsEnabled: true,
        highContrast: false,
        fontSize: 'normal',
        voiceCommands: false,
        eyeTracking: false,
        clickMode: 'blink'
      }
    },
    createdAt: new Date('2026-01-15').toISOString()
  },
  {
    id: 'u-002',
    name: 'Admin User',
    email: 'admin@brightmind.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    profile: {
      avatar: '👨‍💼',
      level: 10,
      xp: 9999,
      streak: 30,
      accessibility: {
        ttsEnabled: false,
        highContrast: false,
        fontSize: 'normal',
        voiceCommands: false,
        eyeTracking: false,
        clickMode: 'blink'
      }
    },
    createdAt: new Date('2026-01-01').toISOString()
  }
];

// ── Lessons ──────────────────────────────────────────────────────────────────
const lessons = [
  {
    id: 'l-001',
    title: 'Identifying Sounds Around Us',
    description: 'Learn to identify everyday sounds — birds, rain, traffic, and more.',
    category: 'audio',
    difficulty: 'beginner',
    duration: 12,
    xpReward: 30,
    icon: '🎵',
    audioEnabled: true,
    tags: ['sounds', 'listening', 'environment'],
    content: 'This lesson explores the sounds that surround us every day. Being aware of sounds helps us understand our environment.',
    objectives: ['Identify 5 nature sounds', 'Identify 5 home sounds', 'Practice active listening'],
    createdAt: new Date('2026-01-10').toISOString(),
    updatedAt: new Date('2026-01-10').toISOString()
  },
  {
    id: 'l-002',
    title: 'The Alphabet Song',
    description: 'Learn the 26 letters of the alphabet through music and repetition.',
    category: 'audio',
    difficulty: 'beginner',
    duration: 5,
    xpReward: 15,
    icon: '🔤',
    audioEnabled: true,
    tags: ['alphabet', 'literacy', 'letters'],
    content: 'The English alphabet has 26 letters. Every word you read or write is made from these letters.',
    objectives: ['Learn all 26 letters', 'Distinguish vowels and consonants', 'Sing the alphabet song'],
    createdAt: new Date('2026-01-10').toISOString(),
    updatedAt: new Date('2026-01-10').toISOString()
  },
  {
    id: 'l-003',
    title: 'Colors and Feelings',
    description: 'Discover how colors connect to emotions and feelings.',
    category: 'interactive',
    difficulty: 'beginner',
    duration: 10,
    xpReward: 25,
    icon: '🌈',
    audioEnabled: true,
    tags: ['colors', 'emotions', 'feelings'],
    content: 'Colors are not just what we see — they make us feel things too!',
    objectives: ['Connect 5 colors with emotions', 'Express current mood with a color', 'Learn color names'],
    createdAt: new Date('2026-01-12').toISOString(),
    updatedAt: new Date('2026-01-12').toISOString()
  },
  {
    id: 'l-004',
    title: 'Counting 1 to 10',
    description: 'Count from 1 to 10 with fun sounds and examples.',
    category: 'audio',
    difficulty: 'beginner',
    duration: 7,
    xpReward: 20,
    icon: '🔢',
    audioEnabled: true,
    tags: ['numbers', 'counting', 'math'],
    content: 'Numbers help us count things, measure, and tell time.',
    objectives: ['Count from 1 to 10', 'Identify numbers in real life', 'Practice finger counting'],
    createdAt: new Date('2026-01-14').toISOString(),
    updatedAt: new Date('2026-01-14').toISOString()
  },
  {
    id: 'l-005',
    title: 'Animals and Their Sounds',
    description: 'Learn about animals and the sounds they make.',
    category: 'audio',
    difficulty: 'beginner',
    duration: 8,
    xpReward: 20,
    icon: '🐾',
    audioEnabled: true,
    tags: ['animals', 'sounds', 'nature'],
    content: 'Every animal has its own special sound.',
    objectives: ['Learn 6 animal sounds', 'Match animals to sounds', 'Fun animal facts'],
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date('2026-01-15').toISOString()
  },
  {
    id: 'l-006',
    title: 'The Kind Princess',
    description: 'A gentle audio story about kindness and friendship.',
    category: 'story',
    difficulty: 'beginner',
    duration: 10,
    xpReward: 35,
    icon: '📖',
    audioEnabled: true,
    tags: ['story', 'kindness', 'social'],
    content: 'Once upon a time, in a bright and happy kingdom, there lived a princess named Luna.',
    objectives: ['Listen to a full story', 'Answer comprehension questions', 'Discuss the moral'],
    createdAt: new Date('2026-01-16').toISOString(),
    updatedAt: new Date('2026-01-16').toISOString()
  }
];

// ── Activities ───────────────────────────────────────────────────────────────
const activities = [
  {
    id: 'a-001',
    title: 'Sound Matching Game',
    description: 'Listen to a sound and match it to the correct picture.',
    type: 'sound-match',
    difficulty: 'easy',
    xpReward: 20,
    icon: '🔊',
    duration: 5,
    rounds: 5,
    accessibilityFeatures: ['audio-prompts', 'keyboard-nav', 'eye-tracking', 'tts'],
    createdAt: new Date('2026-01-10').toISOString()
  },
  {
    id: 'a-002',
    title: 'Letter Recognition',
    description: 'Hear a letter and identify the correct one from options.',
    type: 'letter-touch',
    difficulty: 'easy',
    xpReward: 25,
    icon: '🔤',
    duration: 7,
    rounds: 5,
    accessibilityFeatures: ['audio-prompts', 'keyboard-nav', 'eye-tracking', 'tts'],
    createdAt: new Date('2026-01-10').toISOString()
  },
  {
    id: 'a-003',
    title: 'Count Along',
    description: 'Count objects with audio cues and number descriptions.',
    type: 'count-along',
    difficulty: 'medium',
    xpReward: 30,
    icon: '🔢',
    duration: 8,
    rounds: 5,
    accessibilityFeatures: ['audio-prompts', 'keyboard-nav', 'eye-tracking', 'tts'],
    createdAt: new Date('2026-01-12').toISOString()
  },
  {
    id: 'a-004',
    title: 'Story Time',
    description: 'Listen to an audio story and answer comprehension questions.',
    type: 'story-time',
    difficulty: 'medium',
    xpReward: 40,
    icon: '📖',
    duration: 12,
    rounds: 3,
    accessibilityFeatures: ['audio-story', 'tts', 'keyboard-nav'],
    createdAt: new Date('2026-01-14').toISOString()
  }
];

// ── Progress Records ─────────────────────────────────────────────────────────
const progress = [
  { id: 'p-001', userId: 'u-001', lessonId: 'l-001', status: 'in-progress', percentComplete: 60, timeSpentSec: 432, lastAccessedAt: new Date().toISOString(), completedAt: null },
  { id: 'p-002', userId: 'u-001', lessonId: 'l-002', status: 'completed',   percentComplete: 100, timeSpentSec: 320, lastAccessedAt: new Date('2026-07-20').toISOString(), completedAt: new Date('2026-07-20').toISOString() },
  { id: 'p-003', userId: 'u-001', lessonId: 'l-005', status: 'completed',   percentComplete: 100, timeSpentSec: 480, lastAccessedAt: new Date('2026-07-22').toISOString(), completedAt: new Date('2026-07-22').toISOString() }
];

// ── Activity Sessions ─────────────────────────────────────────────────────────
const activitySessions = [
  { id: 's-001', userId: 'u-001', activityId: 'a-001', score: 40, maxScore: 50, accuracy: 80, rounds: 5, duration: 312, completedAt: new Date('2026-07-21').toISOString() },
  { id: 's-002', userId: 'u-001', activityId: 'a-002', score: 30, maxScore: 50, accuracy: 60, rounds: 5, duration: 290, completedAt: new Date('2026-07-23').toISOString() }
];

// ── Eye Tracking Sessions ────────────────────────────────────────────────────
const eyeTrackingSessions = [];

// ── Achievements ─────────────────────────────────────────────────────────────
const achievements = [
  { id: 'ach-001', userId: 'u-001', type: 'first-lesson',   title: 'First Lesson',  description: 'Completed your first lesson',   icon: '🌟', unlockedAt: new Date('2026-07-20').toISOString() },
  { id: 'ach-002', userId: 'u-001', type: 'streak-3',       title: '3-Day Streak',  description: 'Learned for 3 days in a row',   icon: '🔥', unlockedAt: new Date('2026-07-21').toISOString() },
  { id: 'ach-003', userId: 'u-001', type: 'sound-explorer', title: 'Sound Explorer', description: 'Completed 5 audio lessons',     icon: '🎵', unlockedAt: new Date('2026-07-23').toISOString() }
];

// ── All achievement definitions ──────────────────────────────────────────────
const achievementDefinitions = [
  { type: 'first-lesson',   title: 'First Lesson',   description: 'Complete your very first lesson',   icon: '🌟', xpBonus: 50  },
  { type: 'streak-3',       title: '3-Day Streak',   description: 'Learn for 3 consecutive days',      icon: '🔥', xpBonus: 30  },
  { type: 'streak-7',       title: 'Week Warrior',   description: 'Learn for 7 consecutive days',      icon: '💪', xpBonus: 100 },
  { type: 'streak-30',      title: 'Month Master',   description: 'Learn for 30 consecutive days',     icon: '🏆', xpBonus: 500 },
  { type: 'sound-explorer', title: 'Sound Explorer', description: 'Complete 5 audio lessons',          icon: '🎵', xpBonus: 75  },
  { type: 'fast-learner',   title: 'Fast Learner',   description: 'Complete 3 lessons in one day',     icon: '⚡', xpBonus: 60  },
  { type: 'eye-tracker',    title: 'Eye Tracker',    description: 'Use eye tracking for first time',   icon: '👁️', xpBonus: 25  },
  { type: 'perfect-score',  title: 'Perfect Score',  description: 'Get 100% on any activity',          icon: '💯', xpBonus: 50  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────
let idCounter = 1000;
const generateId = (prefix) => `${prefix}-${++idCounter}`;

module.exports = {
  users,
  lessons,
  activities,
  progress,
  activitySessions,
  eyeTrackingSessions,
  achievements,
  achievementDefinitions,
  findById:     (col, id)          => col.find(i => i.id === id),
  findByField:  (col, field, val)  => col.find(i => i[field] === val),
  filterBy:     (col, field, val)  => col.filter(i => i[field] === val),
  filterByFn:   (col, fn)          => col.filter(fn),
  generateId,
};
