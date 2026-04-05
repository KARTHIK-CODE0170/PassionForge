# PassionForge - Complete Setup Guide

## What Was Built

This project has been transformed from a static frontend demo into a fully functional full-stack application with:

1. **Complete Authentication System**
   - User signup and login with Supabase Auth
   - Automatic profile creation
   - Session management
   - Protected routes

2. **Database Architecture**
   - 10 interconnected tables with proper relationships
   - Row Level Security (RLS) on all tables
   - Automatic triggers for count updates
   - Indexes for performance optimization

3. **Real-Time Features**
   - Post voting (upvote/downvote)
   - Comment system
   - Community membership
   - User following
   - Post saving

4. **Modern Build Setup**
   - Vite for fast development and production builds
   - ES6 modules throughout
   - Optimized asset bundling

## Architecture Overview

### Frontend Structure
```
Frontend/
├── html/
│   ├── landing.html          # Entry point - Login/Signup
│   ├── hobby_selection.html  # Onboarding step 2
│   └── index.html             # Main dashboard
├── css/                       # Styling for each page
└── javascript/
    ├── supabaseClient.js      # Singleton Supabase client
    ├── landing.js             # Auth logic
    ├── hobby_selection.js     # Hobby selection logic
    └── dashboard.js           # Main app logic (posts, voting, etc.)
```

### Database Tables

1. **profiles** - User profiles linked to auth.users
2. **hobbies** - Predefined hobbies (Music, Painting, etc.)
3. **user_hobbies** - User hobby selections
4. **communities** - User communities
5. **community_members** - Community memberships
6. **posts** - User posts
7. **post_votes** - Upvotes/downvotes
8. **comments** - Post comments
9. **saved_posts** - Saved posts by users
10. **follows** - User follow relationships

### Key Features

#### Authentication Flow
1. User signs up on landing page
2. Profile automatically created in database
3. Redirected to hobby selection
4. After selecting hobbies, redirected to dashboard
5. Session persists across page refreshes

#### Post Voting System
- Uses optimistic UI updates
- Database triggers automatically update vote counts
- Prevents duplicate votes
- Allows vote changes (up to down, or vice versa)

#### Community System
- Join/leave communities
- Member counts automatically updated via triggers
- Community data cached for performance

#### Social Features
- Follow/unfollow creators
- View trending creators
- Filter posts by category
- Save posts for later reading

## Testing the Application

### 1. Start Development Server

```bash
npm run dev
```

This will start Vite at http://localhost:5173

### 2. Create Your First Account

1. Navigate to http://localhost:5173/Frontend/html/landing.html
2. Click "Sign up" link
3. Enter:
   - Full Name: Your Name
   - Email: test@example.com
   - Password: password123
4. Click "Sign Up"

### 3. Select Your Hobbies

1. You'll be redirected to hobby selection
2. Click on at least one hobby (e.g., Music, Painting)
3. Click "Continue"
4. Click "Go to Dashboard"

### 4. Explore the Dashboard

You'll see:
- Empty feed (no posts yet since you're the first user)
- Left sidebar with your selected hobbies
- Communities you can join
- Right sidebar with challenges and opportunities

### 5. Create a Test Post (Manual Database Insert)

Since post creation UI isn't built yet, you can add a test post via Supabase SQL Editor:

```sql
INSERT INTO posts (author_id, title, content, category)
SELECT
  id,
  'My First Musical Journey',
  'I just started learning guitar and wanted to share my experience with the community...',
  'music'
FROM profiles
WHERE username = 'YOUR_USERNAME'
LIMIT 1;
```

### 6. Test Voting

1. Refresh the dashboard
2. You should see your post
3. Click the up arrow to upvote
4. Click again to remove the vote
5. Click the down arrow to downvote
6. Watch the vote count update in real-time

### 7. Test Comments

1. Click "Comments" button on a post
2. Type a comment
3. Click "Post Comment"
4. Comment count should increment

### 8. Test Communities

1. In the left sidebar, find "Communities"
2. Click "Join" on any community
3. Button should change to "Joined"
4. Community member count updates automatically

### 9. Test Following

1. Create a second user account (use incognito/private browser)
2. Log in with the first account
3. In right sidebar, find "Trending Creators"
4. Click "Follow" on any creator
5. Button changes to "Following"

### 10. Test Session Management

1. Close the browser
2. Reopen and navigate to the dashboard URL directly
3. You should be redirected to login if session expired
4. Or stay logged in if session is still valid

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution**: Make sure `.env` file exists with correct values:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### Issue: Can't see any posts
**Solution**: No posts exist yet. Either:
1. Create another user account and have them create a post
2. Manually insert a test post via SQL (see step 5 above)

### Issue: Voting doesn't work
**Solution**: Check browser console for errors. Make sure you're logged in.

### Issue: "Row Level Security" errors
**Solution**: All tables have RLS enabled. Make sure you're authenticated. Check that policies exist:
```sql
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

## Development Workflow

### Making Changes

1. **Frontend Changes**:
   - Edit files in `Frontend/`
   - Vite hot-reloads automatically
   - Check browser console for errors

2. **Database Changes**:
   - Create new migration via Supabase dashboard
   - Or use `mcp__supabase__apply_migration` tool
   - Always include RLS policies

3. **Build for Production**:
   ```bash
   npm run build
   ```
   - Output goes to `dist/` folder
   - Deploy this folder to your hosting

### Project Structure Best Practices

1. **Separation of Concerns**:
   - `supabaseClient.js` - Only Supabase setup
   - `landing.js` - Only auth logic
   - `dashboard.js` - Only dashboard logic

2. **Module Imports**:
   - Always use `type="module"` in script tags
   - Import from `supabaseClient.js` for consistency

3. **Error Handling**:
   - All async functions have try-catch blocks
   - User-friendly error messages via toast notifications

## Next Steps

### Recommended Improvements

1. **Post Creation UI**:
   - Add a modal for creating posts
   - Rich text editor for formatting
   - Category selection dropdown

2. **Image Uploads**:
   - Use Supabase Storage for images
   - Add image preview in posts
   - Optimize images before upload

3. **Real-time Updates**:
   - Use Supabase Realtime subscriptions
   - Update vote counts live
   - Show new posts without refresh

4. **Search Functionality**:
   - Full-text search on posts
   - Filter by multiple categories
   - Search users and communities

5. **Notifications**:
   - Notify when someone comments
   - Notify when someone follows you
   - Badge on notification icon

6. **Mobile Optimization**:
   - Better responsive breakpoints
   - Touch-friendly interactions
   - Mobile navigation menu

## Security Checklist

- [x] Row Level Security enabled on all tables
- [x] Authenticated-only policies for sensitive operations
- [x] User can only modify their own data
- [x] Password hashing via Supabase Auth
- [x] No sensitive data in frontend code
- [x] Environment variables for API keys
- [x] Input validation on forms
- [x] SQL injection prevention via parameterized queries

## Performance Checklist

- [x] Database indexes on foreign keys
- [x] Cached vote counts in posts table
- [x] Cached member counts in communities
- [x] Vite production build optimization
- [x] Lazy loading of components
- [x] Efficient SQL queries with `.select()` specific columns

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify database policies are correct
4. Ensure you're using latest dependencies

---

Built with Supabase, Vite, and Vanilla JavaScript
