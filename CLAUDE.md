# Quick Pointer - Scrum Story Pointing App

## Overview
A real-time collaborative scrum story pointing application built with Rails and Turbo Streams. All viewers see the same synchronized state regardless of location.

## Core Features

### 1. Single Page Application
- Title: "Quick Pointer"
- Real-time user presence count: "X people here"
- All state persisted on server
- Page refresh maintains current state

### 2. Jira Ticket URL Field
- Text input for pasting Jira URLs
- Auto-syncs across all viewers on any change (typing or pasting)
- External link button (square + arrow icon) to right of field
- Opens link in new tab

### 3. Voting System
- Fibonacci buttons: 1, 2, 3, 5, 8, 13
- Each user gets one vote (tracked by session)
- Clicking a button records vote (replacing previous if exists)
- Visual feedback on button selection:
  - Show which button current user has selected
  - Disable/enable state changes based on reveal state
- Votes hidden until "Reveal" clicked
- Anonymous voting (no user identification shown)

### 4. Vote Display Area
- Empty/hidden when votes not revealed
- Shows vote cards when "Reveal" clicked
- Each vote displays as a square card with number
- Cards are clickable for highlighting

### 5. Control Buttons
- "Reveal" button (green):
  - Shows all submitted votes as cards
  - Prevents further voting changes
- "Clear" button (red):
  - Resets all votes
  - Clears Jira URL
  - Resets highlighted card
  - Re-enables voting

### 6. Card Highlighting
- Clicking a revealed vote card highlights it
- Only one card highlighted at a time
- Highlight state synced across all viewers
- Visual indicator (border, background color change)

## Technical Implementation

### Storage
- **No Database**: Uses Rails' in-memory cache instead of persistent database
- **Cache-based Session Storage**: All session data stored temporarily in Rails cache
  - Expires after 24 hours
  - No permanent persistence needed
  - Perfect for ephemeral pointing sessions

### Controllers
- **PointingController**
  - index: main page
  - update_url: updates Jira URL
  - vote: records/updates user vote
  - reveal: reveals all votes
  - clear: resets session
  - highlight: updates highlighted card

### Channels
- **PresenceChannel**: ActionCable for user presence tracking
  - Track WebSocket connections
  - Broadcast user count updates

### Turbo Streams
- Broadcast updates for:
  - Jira URL changes
  - Vote count changes
  - Reveal/clear actions
  - Card highlighting
  - User presence count

### Session Management
- Use session[:user_id] to track individual users
- Generate UUID for new visitors
- Maintain votes by user_id in session data

### UX Considerations
1. **Voting feedback**: 
   - Highlight selected vote button for current user
   - Show subtle animation on vote selection
   - Disable vote buttons after reveal

2. **Real-time sync**:
   - Debounce URL field updates (300ms)
   - Instant vote updates
   - Smooth transitions for reveals

3. **Visual design**:
   - Clean, minimal interface
   - Clear visual hierarchy
   - Responsive layout
   - Accessible color contrast

### Cache Data Structure
```ruby
{
  jira_url: "",
  votes: {}, # Hash of user_id => vote_value
  revealed: false,
  highlighted_card: nil
}
```

### Routes
```ruby
root 'pointing#index'
post 'update_url', to: 'pointing#update_url'
post 'vote', to: 'pointing#vote'
post 'reveal', to: 'pointing#reveal'
post 'clear', to: 'pointing#clear'
post 'highlight', to: 'pointing#highlight'
```

## Development Steps
1. Create controller with cache-based storage
2. Set up routes
3. Build main view with Turbo Frame
4. Implement ActionCable presence
5. Add Turbo Stream broadcasting
6. Implement voting logic
7. Add reveal/clear functionality
8. Implement card highlighting
9. Style with Tailwind/CSS
10. Test multi-user scenarios

## Testing Considerations
- Test with multiple browser windows
- Verify state persistence on refresh
- Check WebSocket connection handling
- Test edge cases (simultaneous actions)