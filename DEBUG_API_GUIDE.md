## Task Timer Completion - API Debug Guide

### Overview
The task timer completion system has been enhanced with retry logic and better error handling. Use these debug endpoints to verify the fix is working.

### Debug Endpoints

#### 1. Check Specific Task Status
**Endpoint**: `GET /api/debug/task/:taskId`

**Headers**:
```
Authorization: Bearer {token}
```

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/debug/task/42
```

**Response**:
```json
{
  "task": {
    "id": 42,
    "title": "Complete Math Assignment",
    "completed": true,
    "focusMinutes": 25,
    "goalId": 5,
    "userId": 3,
    "createdAt": "2026-05-20T10:00:00Z",
    "completedAt": "2026-05-26T10:30:00Z",
    "completionCounted": false
  },
  "status": "completed",
  "completedAt": "2026-05-26T10:30:00Z",
  "focusMinutes": 25,
  "goal": {
    "id": 5,
    "title": "Learn Mathematics",
    "progress": 85
  }
}
```

#### 2. Get All Tasks Summary
**Endpoint**: `GET /api/debug/tasks/status`

**Headers**:
```
Authorization: Bearer {token}
```

**Example Request**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/debug/tasks/status
```

**Response**:
```json
{
  "total": 15,
  "completed": 12,
  "pending": 3,
  "tasks": [
    {
      "id": 42,
      "title": "Complete Math Assignment",
      "completed": true,
      "completedAt": "2026-05-26T10:30:00Z",
      "focusMinutes": 25,
      "createdAt": "2026-05-20T10:00:00Z",
      "goal": {
        "id": 5,
        "title": "Learn Mathematics"
      }
    },
    {
      "id": 41,
      "title": "Read Chapter 3",
      "completed": false,
      "completedAt": null,
      "focusMinutes": 15,
      "createdAt": "2026-05-20T09:00:00Z",
      "goal": {
        "id": 5,
        "title": "Learn Mathematics"
      }
    }
    // ... more tasks
  ]
}
```

### Monitoring Task Completion

#### Check if Timer Completion Works

**Steps**:
1. Get task ID from `/api/debug/tasks/status`
2. Note the `completed` status and `completedAt` timestamp
3. Start the timer for that task
4. Wait for timer to complete
5. Call `/api/debug/task/:taskId` again
6. Verify `completed` is now `true` and `completedAt` is updated

#### Verify Retry Logic

**Browser Console**:
1. Open DevTools → Console tab
2. Start a timer for a task
3. When timer completes, look for logs like:
   ```
   ✓ Task 42 marked complete (attempt 1/3)
   ```
   or
   ```
   Attempt 1/3 failed: 500 Internal Server Error
   Wait 500ms...
   ✓ Task 42 marked complete (attempt 2/3)
   ```

#### Check No Duplicate XP

**Steps**:
1. Get current user XP: `GET /api/users/profile` (check `xp` field)
2. Complete a task via timer
3. Check user XP again - should increase by exactly 10
4. Manually mark task incomplete then complete
5. Verify XP doesn't increase again

### Common Issues & Solutions

#### Issue: Task not marking complete
**Check**:
- Timer actually completed (check browser console for log)
- Network requests succeeded (DevTools Network tab)
- API returned 200 status code
- Task existed before timer completion

**Debug**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/debug/task/42
```

Check `status` field is `"completed"`

#### Issue: XP awarded multiple times
**Expected**: Only +10 XP on first completion

**Debug**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/debug/tasks/status
```

Look for tasks with same ID completed multiple times. If count is 1, XP is correct.

#### Issue: Task shows completed but not in Goals UI
**Cause**: UI cache or event not fired

**Solution**:
1. Refresh Goals page
2. Check browser console for: `taskCompleted` event fired
3. Verify `completedAt` timestamp is recent in debug endpoint

### Retry Logic Details

**Configuration**:
- Max retries: 3
- Backoff strategy: Exponential (500ms × attempt)
  - Attempt 1: immediate
  - Attempt 2: wait 500ms
  - Attempt 3: wait 1000ms

**Flow**:
```
Timer completes → PATCH /api/tasks/{id}
  ↓ (if fails)
Wait 500ms → PATCH /api/tasks/{id}
  ↓ (if fails)
Wait 1000ms → PATCH /api/tasks/{id}
  ↓ (if fails)
Log error, task marked as failed
```

### Performance Monitoring

#### Check Completion Rate
```bash
# Get all tasks
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/debug/tasks/status

# Calculate completion rate
completed_tasks / total_tasks * 100
```

#### Check Timer Reliability
Monitor the browser console for:
- Successful completions: `✓ Task X marked complete`
- Retry attempts: `Attempt N/3 failed`
- Final failures: `✗ Failed to mark task`

### API Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Task found, status retrieved |
| 404 | Task not found for user |
| 401 | Unauthorized (invalid token) |
| 500 | Server error (check logs) |

### Testing Curl Commands

```bash
# Test with local development server
TOKEN="your_jwt_token"
TASK_ID=42

# Check single task
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/debug/task/$TASK_ID

# Get all tasks summary
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/debug/tasks/status
```

### Integration with Goals Page

**Event Fired on Completion**:
```javascript
window.dispatchEvent(new CustomEvent("taskCompleted", {
  detail: { 
    taskId: 42,
    goalId: 5
  }
}));
```

**Goals Page Listens For**:
```javascript
window.addEventListener("taskCompleted", (event) => {
  // Refresh goal data, show notification, etc.
  const { taskId, goalId } = event.detail;
  console.log(`Task ${taskId} completed in Goal ${goalId}`);
});
```

### Troubleshooting Checklist

- [ ] Task appears completed in debug endpoint
- [ ] `completedAt` timestamp is recent
- [ ] XP awarded exactly once (+10)
- [ ] Notification shown in browser
- [ ] Goals page updated (or manually refresh)
- [ ] No duplicate logs in console
- [ ] Retry logic worked if network failed

---

**For more information, see**: `TASK_TIMER_FIX.md`
