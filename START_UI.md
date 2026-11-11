# 🎨 Start Frontend & Test UI/UX

## Quick Start (2 Terminals)

### Terminal 1: Start Backend Services
```bash
cd ~/Desktop/travel-plan
./start-backend.sh
```

Wait until you see "Backend Ready" message.

### Terminal 2: Start Frontend
```bash
cd ~/Desktop/travel-plan
./start-frontend.sh
```

React will open automatically at **http://localhost:3000**

## 🎯 Login & Test

**URL**: http://localhost:3000
**Email**: admin@travel.com
**Password**: Admin@123

## ✨ UI Features to Test

### 1. Login Page
- ✅ Responsive design
- ✅ Form validation
- ✅ Error messages
- ✅ Material-UI styling

### 2. Dashboard Layout
- ✅ Sidebar navigation
- ✅ Top app bar with user info
- ✅ Logout button
- ✅ Responsive menu

### 3. Users Management
- ✅ View all users in table
- ✅ Add new user (click "Add User" button)
- ✅ Edit user (click edit icon)
- ✅ Delete user (click delete icon)
- ✅ Form validation
- ✅ Success/error notifications

### 4. Travels Management
- ✅ View all travel packages
- ✅ Add new travel (with dates, price, duration)
- ✅ Edit travel details
- ✅ Delete travel
- ✅ Date pickers
- ✅ Status dropdown

### 5. Payment Methods
- ✅ View payment methods
- ✅ Add new method (Stripe/PayPal)
- ✅ Edit configuration
- ✅ Delete method
- ✅ Active/Inactive toggle

### 6. Responsive Design
- ✅ Resize browser window
- ✅ Test on different screen sizes
- ✅ Mobile-friendly layout

## 🧪 Test Scenarios

### Scenario 1: Create a User
1. Navigate to "Users"
2. Click "Add User"
3. Fill in:
   - Email: test@example.com
   - Password: Test@1234
   - First Name: Test
   - Last Name: User
   - Role: User
4. Click "Save"
5. Verify user appears in table

### Scenario 2: Create a Travel Package
1. Navigate to "Travels"
2. Click "Add Travel"
3. Fill in:
   - Title: European Adventure
   - Description: 10-day tour
   - Price: 2500
   - Duration: 10 days
   - Start Date: Future date
   - End Date: Future date + 10 days
   - Max Participants: 20
4. Click "Save"
5. Verify travel appears in table

### Scenario 3: Edit & Delete
1. Click edit icon on any item
2. Modify details
3. Save and verify changes
4. Click delete icon
5. Confirm deletion
6. Verify item removed

### Scenario 4: Test Validation
1. Try to create user with invalid email
2. Try to create travel with negative price
3. Try to submit empty forms
4. Verify error messages appear

## 🎨 UI/UX Features

**Material-UI Components:**
- Tables with sorting
- Modal dialogs
- Form inputs with validation
- Date pickers
- Dropdowns/Select boxes
- Icon buttons
- Toast notifications
- Loading states

**Responsive Design:**
- Sidebar collapses on mobile
- Tables scroll horizontally
- Forms stack vertically
- Touch-friendly buttons

**User Experience:**
- Instant feedback on actions
- Confirmation dialogs for delete
- Success/error notifications
- Loading indicators
- Keyboard navigation
- Accessible forms

## 🔧 Troubleshooting

**Backend not starting?**
```bash
# Check if ports are available
lsof -i :3000
lsof -i :3001

# View logs
tail -f logs/*.log
```

**Frontend not loading?**
```bash
# Check if React is running
ps aux | grep react-scripts

# Restart frontend
pkill -f react-scripts
./start-frontend.sh
```

**Can't login?**
```bash
# Verify database
sudo docker exec travel-plan-postgres-1 psql -U travel_admin -d travel_db -c "SELECT email FROM users;"
```

## 🛑 Stop Services

```bash
# Stop backend
pkill -f 'node src/index.js'

# Stop frontend
pkill -f react-scripts

# Stop databases
sudo docker compose -f docker-compose-simple.yml down
```

## 📸 Screenshots to Capture

1. Login page
2. Dashboard with sidebar
3. Users table
4. Add user dialog
5. Travels table
6. Add travel dialog
7. Payment methods
8. Mobile responsive view

## ✅ UI/UX Checklist

- [ ] Login page loads correctly
- [ ] Can login with admin credentials
- [ ] Dashboard layout is clean
- [ ] Sidebar navigation works
- [ ] Can view all users
- [ ] Can create new user
- [ ] Can edit existing user
- [ ] Can delete user
- [ ] Can view all travels
- [ ] Can create new travel
- [ ] Can edit travel
- [ ] Can delete travel
- [ ] Can view payment methods
- [ ] Can manage payment methods
- [ ] Forms validate input
- [ ] Error messages display
- [ ] Success notifications show
- [ ] Responsive on mobile
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Logout works correctly

## 🎉 Enjoy Testing Your UI!

The admin dashboard is fully functional with:
- Beautiful Material-UI design
- Responsive layout
- Complete CRUD operations
- Real-time validation
- Professional UX

**Have fun testing!** 🚀
