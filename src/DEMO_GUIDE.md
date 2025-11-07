# 🎮 BlockBallot Demo Guide

## Quick Demo Instructions

### 1️⃣ Create Your First Account

1. Click **"Sign Up"**
2. Enter your details:
   - Name: `Demo Admin`
   - Email: `admin@example.com`
   - Password: `password123`
3. Complete 2FA verification (OTP will be shown on screen in dev mode)
4. You're now logged in!

### 2️⃣ Create a Test Election

1. Click **"New Election"** on the dashboard
2. Fill in election details:
   ```
   Title: Student Council Election 2024
   Description: Annual election for student council positions
   Start Date: [Today's date]
   End Date: [Tomorrow's date]
   ```

3. Add a position:
   ```
   Position Name: President
   Ballot Type: Single Choice
   ```

4. Add candidates:
   ```
   Candidate 1:
   - Name: Alice Johnson
   - Description: Former VP, 3 years experience

   Candidate 2:
   - Name: Bob Smith
   - Description: Current treasurer, innovative ideas
   
   Candidate 3:
   - Name: Carol Williams
   - Description: Student advocate, community builder
   ```

5. Click **"Create Election"**

### 3️⃣ Set Up Voter Eligibility

1. You'll be taken to the Admin Panel
2. Go to **"Voter Eligibility"** tab
3. Paste these test emails (one per line):
   ```
   voter1@example.com
   voter2@example.com
   voter3@example.com
   student@test.com
   ```
4. Click **"Upload Voter List"**

### 4️⃣ Share the Election

1. Go to **"Share"** tab
2. Copy the **Election Code** (e.g., `ABC1234`)
3. You can also copy the direct link

### 5️⃣ Test Voting Flow

**Option A: Test as Another User**
1. Open an incognito/private browser window
2. Sign up with a new account using one of the eligible emails:
   - Email: `voter1@example.com`
   - Password: `password123`
3. Complete 2FA
4. Enter the election code on the dashboard
5. Cast your vote
6. Receive a receipt!

**Option B: Test Access Requests**
1. Sign up with an email NOT on the eligibility list
2. Enter the election code
3. Click **"Request Access"**
4. Switch back to admin account
5. Go to **"Access Requests"** tab
6. Approve or deny the request

### 6️⃣ View Results

1. As the admin, click **"View Results"**
2. See live vote counts and charts
3. Export results as JSON

## 🎯 Test Scenarios

### Scenario 1: Multiple Positions Election
Create an election with multiple positions:
- President (Single Choice)
- Vice President (Single Choice)
- Board Members (Multiple Choice - select up to 3)
- Project Priority (Ranked Choice)

### Scenario 2: Access Request Workflow
1. Create election with 2 pre-approved voters
2. Have 3 additional users request access
3. Approve 2, deny 1
4. Test that denied user cannot vote

### Scenario 3: Time-Based Restrictions
1. Create an election that starts in 1 hour
2. Try to vote before it starts (should be blocked)
3. Create an election that ended yesterday
4. Try to vote (should be blocked, can view results)

### Scenario 4: Multiple Elections
1. Create 3 different elections with different dates
2. Mark some as active, some as upcoming, some as ended
3. Test dashboard shows correct status badges
4. Test filtering and searching

## 🧪 Test Data Sets

### Small School Election
```
Positions: President, Secretary, Treasurer
Candidates per position: 3-4
Eligible voters: 20-30
```

### Club Committee Election
```
Positions: Chair, Vice Chair, Board Members (multiple choice)
Candidates: 8 total
Eligible voters: 50
```

### Community Vote
```
Position: Project Selection (ranked choice)
Options: 5 different community projects
Eligible voters: 100
```

## 🐛 Testing Checklist

- [ ] User can register and complete 2FA
- [ ] User can create an election
- [ ] Admin can upload voter eligibility list
- [ ] Admin can approve/deny access requests
- [ ] Eligible voter can cast a vote
- [ ] User cannot vote twice
- [ ] Non-eligible user is blocked from voting
- [ ] Voting is blocked before election starts
- [ ] Voting is blocked after election ends
- [ ] Results show correct vote counts
- [ ] Charts display properly
- [ ] Receipt is generated after voting
- [ ] Election code search works
- [ ] Direct link navigation works
- [ ] Admin can export results

## 🎨 UI Testing

- [ ] Mobile responsive design
- [ ] All buttons clickable
- [ ] Forms validate properly
- [ ] Error messages display clearly
- [ ] Success messages appear
- [ ] Loading states show
- [ ] Navigation works smoothly
- [ ] Logout works correctly

## 🔐 Security Testing

- [ ] Cannot access election without authentication
- [ ] Cannot vote without eligibility
- [ ] Cannot view admin panel without being creator
- [ ] Cannot modify another user's election
- [ ] 2FA is required for login
- [ ] Session persists on page reload
- [ ] Logout clears session

## 📊 Sample Voter Emails

For quick testing, use these email patterns:
```
admin@example.com
voter1@example.com
voter2@example.com
voter3@example.com
student1@test.com
student2@test.com
member1@demo.com
member2@demo.com
user@sample.org
```

All can use the same password: `password123`

## 💡 Pro Tips

1. **Multiple Browser Profiles**: Use different browser profiles to test multiple user accounts simultaneously
2. **Incognito Windows**: Great for quick testing without logging out
3. **Browser DevTools**: Open console to see detailed error messages
4. **Local Storage**: Check Application > Local Storage to see stored tokens and user data
5. **Network Tab**: Monitor API calls to debug issues

## 🚀 Advanced Testing

### Load Testing (Manual)
1. Create an election
2. Add 50+ emails to eligibility list
3. Create multiple browser sessions
4. Vote simultaneously
5. Check if results aggregate correctly

### Edge Cases
- Vote with exactly 1 second until election ends
- Request access multiple times
- Create election with 10+ positions
- Add 100+ voters to eligibility list
- Create election with 20+ candidates
- Test very long candidate descriptions

## 📝 Notes

- OTP codes are displayed in the UI during development
- All timestamps are in local timezone
- Results update in real-time
- Ballots are stored anonymously
- Each vote generates a unique receipt hash

---

Happy Testing! 🎉
