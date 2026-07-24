const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BrightMind API',
      version: '1.0.0',
      description: `
## BrightMind — Accessible Learning Platform API

A comprehensive REST API for an autism and accessibility-focused learning platform.
Designed for **blind, visually impaired, and autistic learners**.

### 🔐 Authentication
Use \`POST /api/auth/login\` to get a JWT Bearer token.
Include it in requests as: \`Authorization: Bearer <token>\`

**Demo accounts:**
| Email | Password | Role |
|-------|----------|------|
| alex@brightmind.com | password123 | learner |
| admin@brightmind.com | admin123 | admin |

### ♿ Accessibility Features Supported
- 🔊 Text-to-Speech (TTS)
- 👁️ Eye Tracking (blink-to-click / dwell-to-click)
- 🎤 Voice Commands
- ◑ High Contrast Mode
- 🔡 Adjustable Font Size
- ⌨️ Full Keyboard Navigation

### 🚦 Rate Limiting
\`100 requests / 15 minutes\` per IP address.
      `,
      contact: {
        name: 'BrightMind Support',
        email: 'support@brightmind.com',
        url: 'https://brightmind.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      { url: 'http://localhost:5000', description: '🖥️ Development server' },
      { url: 'http://localhost:3000', description: '🐳 Docker (via Nginx proxy)' }
    ],
    tags: [
      { name: 'Auth',          description: '🔐 Authentication & authorization' },
      { name: 'Users',         description: '👤 User profiles & accessibility settings' },
      { name: 'Lessons',       description: '📚 Audio and interactive lessons' },
      { name: 'Activities',    description: '🎮 Interactive exercises & session tracking' },
      { name: 'Progress',      description: '📊 Learning progress & statistics' },
      { name: 'Eye Tracking',  description: '👁️ Eye tracker calibration & session logs' },
      { name: 'Achievements',  description: '🏆 Gamification & achievement system' },
      { name: 'Health',        description: '💓 API health & diagnostics' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from POST /api/auth/login'
        }
      },
      schemas: {
        // Auth
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          example: { email: 'alex@brightmind.com', password: 'password123' },
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', minLength: 2, example: 'Alex Johnson' },
            email:    { type: 'string', format: 'email', example: 'newuser@brightmind.com' },
            password: { type: 'string', minLength: 6, example: 'mypassword123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success:   { type: 'boolean', example: true },
            token:     { type: 'string',  description: 'JWT Bearer token (expires in 7d)' },
            expiresIn: { type: 'string',  example: '7d' },
            user:      { $ref: '#/components/schemas/UserPublic' }
          }
        },
        // User
        UserPublic: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: 'u-001' },
            name:      { type: 'string', example: 'Alex Johnson' },
            email:     { type: 'string', example: 'alex@brightmind.com' },
            role:      { type: 'string', enum: ['learner', 'admin'] },
            profile:   { $ref: '#/components/schemas/UserProfile' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            avatar:        { type: 'string', example: '🧑‍🎓' },
            level:         { type: 'integer', example: 1 },
            xp:            { type: 'integer', example: 340 },
            streak:        { type: 'integer', example: 7, description: 'Current daily streak' },
            accessibility: { $ref: '#/components/schemas/AccessibilitySettings' }
          }
        },
        AccessibilitySettings: {
          type: 'object',
          description: 'Persisted accessibility preferences',
          properties: {
            ttsEnabled:    { type: 'boolean', description: 'Text-to-speech on/off', example: true },
            highContrast:  { type: 'boolean', description: 'High contrast visual mode', example: false },
            fontSize:      { type: 'string',  enum: ['normal', 'large', 'xlarge'], example: 'normal' },
            voiceCommands: { type: 'boolean', description: 'Voice navigation commands', example: false },
            eyeTracking:   { type: 'boolean', description: 'Eye gaze navigation', example: false },
            clickMode:     { type: 'string',  enum: ['blink', 'dwell'], description: 'Eye tracker click method', example: 'blink' }
          }
        },
        UpdateAccessibilityRequest: {
          type: 'object',
          properties: {
            ttsEnabled:    { type: 'boolean' },
            highContrast:  { type: 'boolean' },
            fontSize:      { type: 'string', enum: ['normal', 'large', 'xlarge'] },
            voiceCommands: { type: 'boolean' },
            eyeTracking:   { type: 'boolean' },
            clickMode:     { type: 'string', enum: ['blink', 'dwell'] }
          }
        },
        // Lesson
        Lesson: {
          type: 'object',
          properties: {
            id:           { type: 'string', example: 'l-001' },
            title:        { type: 'string', example: 'Identifying Sounds Around Us' },
            description:  { type: 'string' },
            category:     { type: 'string', enum: ['audio', 'interactive', 'story'] },
            difficulty:   { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            duration:     { type: 'integer', description: 'Duration in minutes', example: 12 },
            xpReward:     { type: 'integer', example: 30 },
            icon:         { type: 'string', example: '🎵' },
            audioEnabled: { type: 'boolean' },
            tags:         { type: 'array', items: { type: 'string' } },
            content:      { type: 'string' },
            objectives:   { type: 'array', items: { type: 'string' } },
            createdAt:    { type: 'string', format: 'date-time' },
            updatedAt:    { type: 'string', format: 'date-time' }
          }
        },
        LessonCreate: {
          type: 'object',
          required: ['title', 'description', 'category', 'difficulty', 'duration'],
          properties: {
            title:        { type: 'string' },
            description:  { type: 'string' },
            category:     { type: 'string', enum: ['audio', 'interactive', 'story'] },
            difficulty:   { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            duration:     { type: 'integer' },
            xpReward:     { type: 'integer', default: 20 },
            icon:         { type: 'string' },
            audioEnabled: { type: 'boolean', default: true },
            tags:         { type: 'array', items: { type: 'string' } },
            content:      { type: 'string' },
            objectives:   { type: 'array', items: { type: 'string' } }
          }
        },
        // Activity
        Activity: {
          type: 'object',
          properties: {
            id:                    { type: 'string', example: 'a-001' },
            title:                 { type: 'string', example: 'Sound Matching Game' },
            description:           { type: 'string' },
            type:                  { type: 'string', enum: ['sound-match', 'letter-touch', 'count-along', 'story-time'] },
            difficulty:            { type: 'string', enum: ['easy', 'medium', 'hard'] },
            xpReward:              { type: 'integer' },
            duration:              { type: 'integer', description: 'Estimated minutes' },
            rounds:                { type: 'integer' },
            accessibilityFeatures: { type: 'array', items: { type: 'string' } }
          }
        },
        ActivitySessionCreate: {
          type: 'object',
          required: ['activityId', 'score', 'maxScore', 'rounds', 'duration'],
          properties: {
            activityId: { type: 'string', example: 'a-001' },
            score:      { type: 'integer', minimum: 0, example: 40 },
            maxScore:   { type: 'integer', minimum: 1, example: 50 },
            rounds:     { type: 'integer', example: 5 },
            duration:   { type: 'integer', description: 'Seconds taken', example: 312 }
          }
        },
        ActivitySession: {
          type: 'object',
          properties: {
            id:          { type: 'string' },
            userId:      { type: 'string' },
            activityId:  { type: 'string' },
            score:       { type: 'integer' },
            maxScore:    { type: 'integer' },
            accuracy:    { type: 'number', description: 'Percentage 0-100', example: 80 },
            rounds:      { type: 'integer' },
            duration:    { type: 'integer', description: 'Seconds' },
            completedAt: { type: 'string', format: 'date-time' }
          }
        },
        // Progress
        Progress: {
          type: 'object',
          properties: {
            id:              { type: 'string' },
            userId:          { type: 'string' },
            lessonId:        { type: 'string' },
            status:          { type: 'string', enum: ['not-started', 'in-progress', 'completed'] },
            percentComplete: { type: 'integer', minimum: 0, maximum: 100 },
            timeSpentSec:    { type: 'integer', description: 'Total seconds spent on lesson' },
            lastAccessedAt:  { type: 'string', format: 'date-time' },
            completedAt:     { type: 'string', format: 'date-time', nullable: true }
          }
        },
        ProgressUpdate: {
          type: 'object',
          required: ['lessonId'],
          properties: {
            lessonId:        { type: 'string', example: 'l-001' },
            percentComplete: { type: 'integer', minimum: 0, maximum: 100, example: 75 },
            timeSpentSec:    { type: 'integer', description: 'Additional seconds spent', example: 180 }
          }
        },
        ProgressSummary: {
          type: 'object',
          properties: {
            totalLessons:     { type: 'integer' },
            completedLessons: { type: 'integer' },
            inProgressLessons:{ type: 'integer' },
            totalXP:          { type: 'integer' },
            streak:           { type: 'integer' },
            overallPercent:   { type: 'number', description: 'Overall curriculum completion 0-100' },
            subjectBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  completed: { type: 'integer' },
                  total: { type: 'integer' },
                  percent: { type: 'number' }
                }
              }
            }
          }
        },
        // Eye Tracking
        EyeTrackingSession: {
          type: 'object',
          properties: {
            id:                { type: 'string' },
            userId:            { type: 'string' },
            calibrationPoints: { type: 'integer', description: 'Number of calibration points used', example: 5 },
            accuracy:          { type: 'number', description: 'Calibration accuracy 0.0–1.0', example: 0.92 },
            clickMode:         { type: 'string', enum: ['blink', 'dwell'] },
            durationSec:       { type: 'integer', description: 'Session length in seconds' },
            clickCount:        { type: 'integer', description: 'Number of gaze clicks performed' },
            createdAt:         { type: 'string', format: 'date-time' }
          }
        },
        EyeTrackingSessionCreate: {
          type: 'object',
          required: ['clickMode'],
          properties: {
            calibrationPoints: { type: 'integer', example: 5 },
            accuracy:          { type: 'number', minimum: 0, maximum: 1, example: 0.92 },
            clickMode:         { type: 'string', enum: ['blink', 'dwell'], example: 'blink' },
            durationSec:       { type: 'integer', example: 300 },
            clickCount:        { type: 'integer', example: 24 }
          }
        },
        // Achievement
        Achievement: {
          type: 'object',
          properties: {
            id:          { type: 'string' },
            userId:      { type: 'string' },
            type:        { type: 'string' },
            title:       { type: 'string' },
            description: { type: 'string' },
            icon:        { type: 'string' },
            unlockedAt:  { type: 'string', format: 'date-time' }
          }
        },
        AchievementDefinition: {
          type: 'object',
          properties: {
            type:        { type: 'string' },
            title:       { type: 'string' },
            description: { type: 'string' },
            icon:        { type: 'string' },
            xpBonus:     { type: 'integer' }
          }
        },
        // Common
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data:    { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error:   { type: 'string' },
            code:    { type: 'integer' },
            details: { type: 'array', items: { type: 'object' } }
          }
        },
        PaginatedList: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data:    { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page:  { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  },
  apis: [require('path').join(__dirname, '../routes/*.js')]
};

module.exports = swaggerJsdoc(options);
