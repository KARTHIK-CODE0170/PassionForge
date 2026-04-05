# PassionForge - Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Start Development Server

```bash
npm run dev
```

You'll see output like:
```
VITE v5.4.21  ready in 234 ms

➜  Local:   http://localhost:5173/Frontend/html/landing.html
➜  press h + enter to show help
```

## 3. Open in Browser

Navigate to: **http://localhost:5173/Frontend/html/landing.html**

## 4. Create Your First Account

1. Click "Sign up" at the bottom
2. Enter:
   - **Name**: John Doe
   - **Email**: john@example.com
   - **Password**: password123
3. Click "Sign Up"

## 5. Select Your Hobbies

1. Click on 2-3 hobbies you like (e.g., Music, Painting, Writing)
2. Click "Continue"
3. Click "Go to Dashboard"

## 6. Explore the Dashboard

You're now on the main page! Here you can:

- **Filter posts** by category in the left sidebar
- **Join communities** in the left sidebar
- **View challenges** and earn credits in the right sidebar
- **See opportunities** for workshops and competitions

## 7. Test with Multiple Users

Since this is a social platform, it's best with multiple users:

1. Open an **incognito/private browser window**
2. Go to the landing page again
3. Create a second account (e.g., jane@example.com)
4. Select different hobbies
5. Now you can:
   - Follow each other
   - Create posts (via SQL for now)
   - Vote on each other's posts
   - Comment on posts

## 8. Create a Test Post (Via Database)

Since the post creation UI isn't built yet, use Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Click "SQL Editor"
3. Run this query (replace YOUR_USER_ID):

```sql
-- Get your user ID first
SELECT id, username FROM profiles;

-- Then create a post
INSERT INTO posts (author_id, title, content, category)
VALUES (
  'YOUR_USER_ID_HERE',
  'My First Guitar Practice Session',
  'Just finished my first 30-minute practice session! The F chord is still tricky, but I managed to play a simple progression. Any tips for beginners?',
  'music'
);
```

4. Refresh your dashboard - you should see the post!

## 9. Test All Features

Now try:

- **Voting**: Click the up/down arrows on posts
- **Commenting**: Click "Comments" and write a comment
- **Saving**: Click "Save" to bookmark a post
- **Communities**: Click "Join" on a community
- **Following**: Click "Follow" on a creator
- **Filtering**: Click a hobby in the left sidebar to filter posts
- **Profile Menu**: Click your avatar in top-right

## 10. Build for Production

When ready to deploy:

```bash
npm run build
```

The optimized files will be in the `dist/` folder.

## Common Issues

### "Missing Supabase environment variables"
- Check that `.env` file exists
- Verify the values are correct

### Can't log in
- Check browser console for errors
- Verify Supabase project is running
- Try clearing browser cache

### Posts not showing
- Create some posts via SQL (see step 8)
- Or create multiple users to generate content

### Voting doesn't work
- Make sure you're logged in
- Check browser console for errors
- Verify you have posts in the database

## Next Steps

1. Read `SETUP_GUIDE.md` for detailed testing instructions
2. Read `IMPLEMENTATION_SUMMARY.md` for architecture details
3. Read `README.md` for full documentation

## Need Help?

Check the browser console (F12) for error messages. Most issues are logged there with helpful details.

---

Happy coding!
