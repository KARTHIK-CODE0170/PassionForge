# PassionForge

A creative social platform for hobby enthusiasts to connect, share, and grow their passions.

## Features

- User authentication with email/password
- Personalized hobby selection during onboarding
- Create and share posts with the community
- Vote on posts and engage with comments
- Join communities based on interests
- Follow other creators
- Track your progress with credits and streaks
- Discover opportunities like workshops, competitions, and auditions

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Build Tool**: Vite
- **Backend**: Supabase (Authentication, Database, RLS)
- **Database**: PostgreSQL (via Supabase)

## Project Structure

```
PassionForge/
├── Frontend/
│   ├── html/
│   │   ├── landing.html          # Login/Signup page
│   │   ├── hobby_selection.html  # Hobby selection onboarding
│   │   └── index.html             # Main dashboard
│   ├── css/
│   │   ├── styles.css             # Main dashboard styles
│   │   └── hobby_selection.css   # Hobby selection styles
│   └── javascript/
│       ├── supabaseClient.js      # Supabase client singleton
│       ├── landing.js             # Authentication logic
│       ├── hobby_selection.js     # Hobby selection logic
│       └── dashboard.js           # Main dashboard logic
├── Img sources/
│   └── PassionForge_logo.png
├── .env                           # Environment variables
├── vite.config.js                 # Vite configuration
└── package.json                   # Dependencies

```

## Database Schema

### Tables

- **profiles**: User profile information with username, display name, avatar, credits, and streak tracking
- **hobbies**: Available hobbies/interests (Music, Painting, Dance, Writing, Photography, etc.)
- **user_hobbies**: Junction table linking users to their selected hobbies
- **communities**: User communities organized by categories
- **community_members**: Community membership tracking
- **posts**: User-created posts with voting and comment counts
- **post_votes**: Upvote/downvote tracking for posts
- **comments**: Comments on posts
- **saved_posts**: Saved posts by users
- **follows**: User follow relationships

All tables have Row Level Security (RLS) enabled with appropriate policies for secure data access.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. The `.env` file is already configured with Supabase credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to the URL shown (typically http://localhost:5173/Frontend/html/landing.html)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage Flow

1. **Landing Page**: New users sign up with email and password. Existing users log in.
2. **Hobby Selection**: New users select their interests from a list of hobbies.
3. **Dashboard**:
   - View posts from the community filtered by interests
   - Vote on posts and add comments
   - Join communities related to hobbies
   - Follow other creators
   - Track personal credits and streaks
   - Discover upcoming opportunities

## Key Features Implemented

### Authentication
- Email/password signup and login via Supabase Auth
- Automatic profile creation on signup
- Session management with automatic redirects
- Protected routes requiring authentication

### Posts & Engagement
- Real-time post voting (upvote/downvote)
- Comment on posts
- Save posts for later
- Filter posts by category
- Vote counts automatically updated via database triggers

### Social Features
- Join/leave communities with automatic member count updates
- Follow/unfollow other creators
- View trending creators
- Community-based content discovery

### Personalization
- Hobby-based feed customization
- User avatar with gradient backgrounds
- Credits system for engagement
- Streak tracking for daily challenges

## Database Security

All tables use Row Level Security (RLS):
- Users can only modify their own data
- Votes, comments, and follows are authenticated-only
- Public read access for posts and profiles
- Community data is readable by all authenticated users

## Performance Optimizations

- Database indexes on frequently queried columns
- Cached vote counts and member counts
- Efficient queries using Supabase's PostgreSQL features
- Lazy loading of components
- Vite build optimization for production

## Future Enhancements

- Post creation UI
- Image uploads for posts
- Real-time notifications
- Direct messaging
- Advanced search functionality
- Mobile responsive improvements
- Dark/light theme toggle
