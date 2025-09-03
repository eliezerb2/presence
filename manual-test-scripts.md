# Manual Test Scripts

## Kiosk Interface Testing

### Test 1: Student Search
1. Navigate to kiosk interface (http://localhost/kiosk)
2. Enter student number "001" in search field
3. Verify "יוסף כהן" appears in results
4. Enter nickname "יוסי123" in search field
5. Verify same student appears
6. Enter partial name "יוס" in search field
7. Verify student appears in results

### Test 2: Check-in Process
1. Search for student "יוסף כהן"
2. Click "כניסה" button
3. Verify success message appears
4. Search field should clear automatically
5. Repeat check-in for same student
6. Verify system handles duplicate check-in

### Test 3: Check-out Process
1. Search for student who already checked in
2. Click "יציאה" button
3. Verify success message appears
4. Check manager interface to confirm status change

## Manager Interface Testing

### Test 4: Daily Attendance View
1. Navigate to manager interface (http://localhost/manager)
2. Verify today's attendance list displays
3. Check that all students appear with correct statuses
4. Verify locked/unlocked indicators show correctly

### Test 5: Override Functionality
1. Select student with "לא דיווח" status
2. Change status to "נוכח" using dropdown
3. Verify status updates immediately
4. Check that override lock icon appears
5. Try to change locked record - should still work for manager

### Test 6: Date Navigation
1. Change date picker to previous day
2. Verify attendance data updates
3. Return to today's date
4. Verify current data displays

## Admin Interface Testing

### Test 7: Student Management
1. Navigate to admin interface
2. Add new student with all required fields
3. Verify student appears in list
4. Edit student nickname
5. Verify changes save correctly
6. Test duplicate student number validation

### Test 8: Settings Management
1. Access settings page
2. Change lateness threshold from 3 to 5
3. Save changes
4. Verify new threshold applies to monthly calculations

## Automation Testing

### Test 9: Late Arrival Automation
1. Set system time to 10:15 AM on school day
2. Ensure some students have "לא דיווח" status
3. Wait for automation to run
4. Verify students marked as "נוכח" with "איחור" sub-status

### Test 10: End of Day Automation
1. Set system time to 4:00 PM
2. Ensure some students have "נוכח" status without check-out
3. Wait for automation to run
4. Verify students marked as "יצא" with "נסגר אוטומטית"

## Load Testing

### Test 11: Concurrent Kiosk Usage
1. Open multiple browser tabs to kiosk interface
2. Perform simultaneous searches from different tabs
3. Verify all searches return correct results
4. Perform simultaneous check-ins for different students
5. Verify all check-ins process correctly

### Test 12: Manager Bulk Operations
1. Open attendance view with 50+ students
2. Perform multiple rapid status changes
3. Verify all changes save correctly
4. Check audit log for all changes

## Error Handling Testing

### Test 13: Network Interruption
1. Disconnect network during kiosk operation
2. Attempt student search
3. Verify appropriate error message displays
4. Reconnect network
5. Verify system recovers automatically

### Test 14: Invalid Data Entry
1. Try to create student with duplicate student number
2. Verify validation error appears
3. Try to create student with empty required fields
4. Verify all validation messages display correctly

## Performance Testing

### Test 15: Large Dataset Performance
1. Import 1000+ student records
2. Perform search operations
3. Verify response time under 2 seconds
4. Load daily attendance for all students
5. Verify page loads within acceptable time

### Test 16: Monthly Report Generation
1. Generate monthly attendance report for all students
2. Verify CSV export completes successfully
3. Check file contains all expected data
4. Verify large reports don't timeout