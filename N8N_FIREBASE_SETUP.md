# N8N Firebase Integration Setup

This guide explains how to modify your n8n workflow to save generated stories to Firebase instead of returning them as downloadable files.

## Current Workflow Structure

Your current n8n workflow:
1. Receives story generation request
2. Generates story content using AI
3. Returns story as a downloadable file

## New Workflow Structure

The new workflow should:
1. Receive story generation request with Firebase save instructions
2. Generate story content using AI
3. Save the story to Firebase Firestore
4. Update the generation status to 'completed'

## Required Modifications

### 1. Webhook Trigger Node
- Keep the existing webhook endpoint
- The request will now include additional parameters:
  - `saveToFirebase: true`
  - `generationId: string`
  - `userId: string`

### 2. Add Firebase Integration Node
You'll need to add a Firebase node to your n8n workflow:

1. **Install Firebase Admin SDK in n8n:**
   ```bash
   npm install firebase-admin
   ```

2. **Add Firebase credentials:**
   - Go to your Firebase project settings
   - Download the service account key JSON file
   - Add it as a credential in n8n

3. **Add Firebase Write Node:**
   - Add a "Firebase" node after your AI generation
   - Configure it to write to the `storyGenerations` collection
   - Use the `generationId` from the webhook as the document ID

### 3. Update the Workflow Logic

After generating the story content, your workflow should:

1. **Update Generation Status:**
   ```javascript
   // In a Code node or Function node
   const generationData = {
     status: 'completed',
     story: $json.storyContent, // Your generated story
     title: $json.title,
     genre: $json.genre,
     tone: $json.tone,
     updatedAt: new Date()
   };
   
   return {
     json: {
       ...$json,
       generationData
     }
   };
   ```

2. **Write to Firebase:**
   - Use the Firebase Write node
   - Collection: `storyGenerations`
   - Document ID: `{{ $json.generationId }}`
   - Data: `{{ $json.generationData }}`

### 4. Error Handling

Add error handling to update the generation status if something fails:

```javascript
// In case of error
const errorData = {
  status: 'failed',
  error: 'Story generation failed',
  updatedAt: new Date()
};
```

## Frontend Changes

The frontend has been updated to:
1. Create a generation tracking document in Firebase
2. Trigger the n8n workflow with Firebase save instructions
3. Poll for the completion status
4. Navigate to the generated story when complete

## Testing the Integration

1. **Test the webhook:**
   ```bash
   curl -X POST https://n8nromeo123987.app.n8n.cloud/webhook/ultimate-agentic-novel \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Story",
       "prompt": "A test story",
       "genre": "Fantasy",
       "tone": "Serious",
       "chapters": 1,
       "words": 1000,
       "saveToFirebase": true,
       "generationId": "test_gen_123",
       "userId": "test_user_123"
     }'
   ```

2. **Check Firebase:**
   - Verify the generation document is created
   - Check that the story is saved to the `stories` collection
   - Confirm the generation document is cleaned up

## Benefits

- **No file downloads:** Stories are saved directly to Firebase
- **Better UX:** Users can immediately view and edit their stories
- **Consistent data:** All stories are stored in the same format
- **Real-time updates:** Can show generation progress
- **Error handling:** Better error reporting and recovery

## Troubleshooting

1. **Firebase permissions:** Ensure your service account has write permissions
2. **Collection structure:** Verify the `storyGenerations` collection exists
3. **Polling timeouts:** Adjust the polling interval and max attempts in the frontend
4. **Error messages:** Check the generation document for detailed error information 