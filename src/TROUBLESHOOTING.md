# 🔧 BlockBallot Troubleshooting Guide

## Common Issues & Solutions

### Authentication Issues

#### Problem: "Invalid credentials" error during login
**Solutions:**
- Double-check your email and password
- Email addresses are case-insensitive
- Try resetting your password (feature coming soon)
- Make sure you're using the account you registered with

#### Problem: OTP code not working
**Solutions:**
- OTP codes expire after 5 minutes - request a new one
- Make sure you're entering all 6 digits
- Try clicking "Resend code"
- In development mode, the OTP is displayed on screen

#### Problem: "Already registered" error
**Solutions:**
- You may have already created an account with this email
- Try logging in instead of signing up
- Use the "forgot password" feature (coming soon)

### Election Creation Issues

#### Problem: Can't create election
**Solutions:**
- Make sure you're logged in
- Ensure end date is after start date
- Add at least one position
- Add at least one candidate per position
- All required fields must be filled

#### Problem: Election code not working
**Solutions:**
- Election codes are exactly 7 characters
- Codes are case-insensitive
- Make sure you copied the full code
- Check if the election was actually created

### Voting Issues

#### Problem: "Not eligible to vote" message
**Solutions:**
- You must be on the pre-approved voter list
- Your email must match the one used for registration
- Request access from the election admin
- Wait for admin to approve your access request

#### Problem: Can't find election by code
**Solutions:**
- Verify the code is correct (7 characters)
- Ask the admin to confirm the code
- Try using the direct link instead
- Check if you're logged in

#### Problem: "Already voted" message
**Solutions:**
- You can only vote once per election
- This is by design for security
- If you believe this is an error, contact the election admin

#### Problem: Vote button disabled
**Solutions:**
- Make sure you've selected a candidate for ALL positions
- Check that the election is currently active
- Verify the election hasn't ended
- Ensure you're eligible to vote

### Access Request Issues

#### Problem: Access request not appearing for admin
**Solutions:**
- Refresh the admin panel
- Go to "Access Requests" tab
- Check if request was already approved/denied
- Make sure you're viewing the correct election

#### Problem: Can't request access
**Solutions:**
- You must be logged in
- Check if you already submitted a request
- Verify you're not already on the eligibility list
- Make sure the election exists

### Results & Analytics Issues

#### Problem: Results not showing
**Solutions:**
- Results are only visible to:
  - Admin during the election
  - Everyone after election ends
- Make sure the election has received votes
- Try refreshing the page

#### Problem: Charts not displaying
**Solutions:**
- Wait a few seconds for charts to load
- Check that there are votes to display
- Try refreshing the browser
- Check browser console for errors

### Admin Panel Issues

#### Problem: Can't access admin panel
**Solutions:**
- Only election creators can access admin panel
- Make sure you created this election
- Verify you're logged in with the correct account
- Try navigating from the dashboard

#### Problem: Can't upload voter list
**Solutions:**
- Format: one email per line or comma-separated
- Emails must include @ symbol
- Remove any extra spaces
- Maximum recommended: 500 voters

#### Problem: Changes not saving
**Solutions:**
- Check your internet connection
- Look for error messages
- Try refreshing and repeating action
- Check browser console for errors

## Technical Issues

### Page Not Loading

**Solutions:**
1. Refresh the browser (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Try incognito/private mode
4. Check internet connection
5. Try a different browser

### API Errors

**Solutions:**
1. Check browser console (F12 > Console tab)
2. Look for detailed error messages
3. Verify Supabase connection
4. Check if server is running
5. Wait a moment and try again

### Session/Login Issues

**Solutions:**
1. Clear browser cookies
2. Log out and log back in
3. Clear local storage:
   - F12 > Application > Local Storage
   - Delete all BlockBallot items
4. Try a different browser

## Error Messages Explained

### "Unauthorized"
- You're not logged in or session expired
- Solution: Log in again

### "Election not found"
- Invalid election ID or code
- Solution: Verify the code/link

### "Failed to load elections"
- Network or server issue
- Solution: Refresh page, check connection

### "Access token missing"
- Session issue
- Solution: Log out and log back in

### "Invalid OTP"
- Wrong code or expired
- Solution: Request new OTP

### "Election has not started yet"
- Trying to vote before start time
- Solution: Wait until election opens

### "Election has ended"
- Trying to vote after closing time
- Solution: View results instead

## Browser Compatibility

### Recommended Browsers
✅ Chrome/Edge (v90+)
✅ Firefox (v88+)
✅ Safari (v14+)

### Known Issues
- Older browsers may have styling issues
- IE11 is not supported
- Some mobile browsers may have layout quirks

## Performance Tips

### Slow Loading
1. Check internet speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Disable browser extensions temporarily
5. Try a different network

### Memory Issues
1. Close other applications
2. Restart browser
3. Use incognito mode
4. Try a different device

## Data Issues

### Lost Data
- All data is stored in Supabase
- Clearing cookies won't delete elections
- Log in again to access your data

### Duplicate Elections
- Each election has a unique ID
- Codes may differ even for similar elections
- Check election title and dates to identify

## Security Concerns

### Suspicious Activity
- Change your password immediately
- Log out of all sessions
- Contact support (if available)

### Privacy Questions
- Ballots are stored anonymously
- Vote choices are not linked to voter identity
- Only ballot receipt is provided

## Still Having Issues?

### Debug Checklist
- [ ] Clear browser cache
- [ ] Try incognito/private mode
- [ ] Check browser console (F12)
- [ ] Verify login credentials
- [ ] Test with different browser
- [ ] Check internet connection
- [ ] Wait 5 minutes and retry

### Getting Help
1. Check the README.md for setup instructions
2. Review the DEMO_GUIDE.md for usage examples
3. Open browser console and note error messages
4. Take screenshots of issues
5. Document steps to reproduce

### Reporting Bugs
When reporting issues, include:
- Browser name and version
- Operating system
- Steps to reproduce
- Error messages (from console)
- Screenshots if applicable

## Development Mode Features

### Visible OTP Codes
- In development, OTP codes are shown in the UI
- This is for testing without email service
- Production would hide these

### Console Logging
- Check browser console for detailed logs
- Helpful for debugging
- Shows API responses and errors

### Test Data
- Use test emails (voter1@example.com, etc.)
- Use simple passwords for testing
- Create demo elections freely

---

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Can't login | Clear cache, check credentials |
| OTP expired | Click "Resend code" |
| Not eligible | Request access or check email |
| Can't vote | Check if already voted |
| Results hidden | Wait for election to end |
| Admin locked | Verify you created election |
| Slow loading | Refresh, check connection |
| Session lost | Log in again |

---

**Remember:** This is a demonstration platform. For critical issues in production environments, consult with technical support and security professionals.
