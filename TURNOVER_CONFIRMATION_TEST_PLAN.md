# Turnover Confirmation System - Test Plan

## Overview
This document outlines the testing procedures for the new turnover confirmation system that allows OSA to confirm receipt of items that users have declared for turnover.

## Test Scenarios

### 1. User Report Creation with Turnover Declaration

**Test Steps:**
1. Create a new found item report
2. Select "turnover to OSA" as the found action
3. Submit the report

**Expected Results:**
- ✅ Report is created successfully
- ✅ `turnoverDetails` is populated with:
  - `turnoverStatus: "declared"`
  - `turnoverAction: "turnover to OSA"`
  - `turnoverDecisionAt: [timestamp]`
  - Original finder information
- ✅ Post appears in admin dashboard under "Turnover Management" view

### 2. Admin Dashboard Turnover Management View

**Test Steps:**
1. Login as admin/OSA
2. Navigate to admin dashboard
3. Click "Turnover Management" button

**Expected Results:**
- ✅ Only posts with turnover details are displayed
- ✅ Turnover statistics card shows correct count
- ✅ Posts show turnover status badges (yellow for "declared")
- ✅ Confirmation buttons are visible for "declared" items

### 3. OSA Confirmation Process - Confirm Receipt

**Test Steps:**
1. Find an item with "declared" status
2. Click "✓ Confirm Receipt" button
3. Review item details in modal
4. Add optional notes about item condition
5. Click "Confirm Receipt"

**Expected Results:**
- ✅ Modal opens with complete item and finder information
- ✅ Notes can be added and saved
- ✅ Status updates to "confirmed" (green badge)
- ✅ Confirmation details are saved:
  - `turnoverStatus: "confirmed"`
  - `confirmedBy: [admin user ID]`
  - `confirmedAt: [timestamp]`
  - `confirmationNotes: [notes if provided]`
- ✅ Success toast notification appears
- ✅ Confirmation buttons disappear (no longer "declared")

### 4. OSA Confirmation Process - Mark Not Received

**Test Steps:**
1. Find an item with "declared" status
2. Click "✗ Not Received" button
3. Review item details in modal
4. Add optional notes explaining why
5. Click "Mark Not Received"

**Expected Results:**
- ✅ Modal opens with complete item and finder information
- ✅ Notes can be added and saved
- ✅ Status updates to "not_received" (red badge)
- ✅ Confirmation details are saved:
  - `turnoverStatus: "not_received"`
  - `confirmedBy: [admin user ID]`
  - `confirmedAt: [timestamp]`
  - `confirmationNotes: [notes if provided]`
- ✅ Success toast notification appears
- ✅ Confirmation buttons disappear (no longer "declared")

### 5. Status Display and Information

**Test Steps:**
1. View items with different turnover statuses
2. Check status badges and information display

**Expected Results:**
- ✅ "declared" items: Yellow badge "Awaiting Confirmation"
- ✅ "confirmed" items: Green badge "Confirmed Received"
- ✅ "not_received" items: Red badge "Not Received"
- ✅ Confirmed items show confirmation date
- ✅ Items with notes display the notes
- ✅ Original finder information is always visible

### 6. Database Integration

**Test Steps:**
1. Perform turnover confirmations
2. Check Firestore database directly

**Expected Results:**
- ✅ All turnover details are properly stored in Firestore
- ✅ Timestamps are correctly formatted
- ✅ Nested object structure is maintained
- ✅ No data corruption or missing fields

### 7. Error Handling

**Test Steps:**
1. Test with network issues
2. Test with invalid data
3. Test concurrent operations

**Expected Results:**
- ✅ Proper error messages are displayed
- ✅ System remains stable
- ✅ No data corruption occurs
- ✅ User can retry operations

## Test Data Requirements

### Sample Test Posts
Create test posts with the following scenarios:
1. Found item with "turnover to OSA" - declared status
2. Found item with "turnover to Campus Security" - declared status
3. Found item with "keep" action (should not appear in turnover view)
4. Lost item (should not appear in turnover view)

### Admin User
- Ensure admin user has proper permissions
- Admin user ID should be used in `confirmedBy` field

## Success Criteria

The turnover confirmation system is considered successful if:

1. ✅ Users can declare turnover intent when creating reports
2. ✅ OSA can view all turnover items in dedicated dashboard section
3. ✅ OSA can confirm receipt or mark as not received
4. ✅ All status changes are properly tracked and displayed
5. ✅ Complete audit trail is maintained
6. ✅ System handles errors gracefully
7. ✅ No data corruption or loss occurs
8. ✅ User interface is intuitive and professional

## Rollback Plan

If issues are discovered:
1. The new fields are optional, so existing data remains unaffected
2. Can disable turnover confirmation buttons temporarily
3. Can revert to previous version if needed
4. Database changes are additive, not destructive

## Performance Considerations

- Turnover filtering should be efficient
- Modal operations should be responsive
- Database updates should complete quickly
- No impact on existing functionality

---

**Test Status:** Ready for execution
**Last Updated:** [Current Date]
**Tested By:** [Tester Name]
