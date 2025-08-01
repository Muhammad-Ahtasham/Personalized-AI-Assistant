# Notes Feature

A comprehensive note-taking system integrated into the Personalized Study Assistant.

## Features

### 📝 Rich Text Editor
- **Bold, Italic, Underline**: Basic text formatting
- **Headings**: H1 and H2 headings for better organization
- **Lists**: Bullet points and numbered lists
- **Quotes**: Blockquote formatting
- **Code**: Inline code formatting

### 🏷️ Tag System
- Add multiple tags to notes (e.g., "JavaScript", "React", "Study Notes")
- Filter notes by tags
- Tag suggestions based on existing tags

### ⭐ Pin & Star
- **Pin Notes**: Keep important notes at the top
- **Star Notes**: Mark favorite notes for quick access
- Visual indicators for pinned and starred notes

### 💾 Manual Save & Version History
- **Manual Save**: Save button to explicitly save changes to database
- **Unsaved Changes Indicator**: Visual indicator when changes haven't been saved
- **Version History**: Every save creates a new version
- **Restore Versions**: Revert to any previous version
- **Version Timeline**: View all versions with timestamps

### 🔍 Search & Filter
- **Full-text Search**: Search through titles, content, and tags
- **Tag Filtering**: Filter notes by specific tags
- **Sort Options**: Sort by last modified, creation date, or title
- **Sort Order**: Ascending or descending order

### 📱 Responsive Design
- **Mobile-friendly**: Works on all device sizes
- **Three-column Layout**: Notes list, editor, and sidebar
- **Collapsible Sections**: Optimized for smaller screens

## Usage

### Creating Notes
1. Click "New Note" button
2. Start typing in the rich text editor
3. Add tags separated by commas
4. Click "Save" button to save changes to database

### Editing Notes
1. Select a note from the list
2. Click the edit button (pencil icon)
3. Use the toolbar for formatting
4. Click "Save" button to save changes to database
5. Use "Cancel" to discard unsaved changes

### Managing Notes
- **Pin**: Click the pin icon to pin/unpin
- **Star**: Click the star icon to star/unstar
- **Delete**: Click the trash icon to delete
- **Version History**: Click the clock icon to view versions

### Version History
1. Click the clock icon on any note
2. View all previous versions with timestamps
3. Click "Restore" to revert to that version
4. A new version is created before restoration

## API Endpoints

### Notes
- `GET /api/notes` - List all notes
- `POST /api/notes` - Create new note
- `GET /api/notes/[id]` - Get specific note
- `PATCH /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

### Versions
- `GET /api/notes/[id]/versions` - Get version history
- `POST /api/notes/versions/[id]/restore` - Restore version

## Database Schema

### Note Model
```prisma
model Note {
  id          String       @id @default(cuid())
  title       String
  content     String
  tags        String[]     @default([])
  isPinned    Boolean      @default(false)
  isStarred   Boolean      @default(false)
  user        User         @relation(fields: [userId], references: [id])
  userId      String
  versions    NoteVersion[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

### NoteVersion Model
```prisma
model NoteVersion {
  id        String   @id @default(cuid())
  noteId    String
  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
  title     String
  content   String
  tags      String[] @default([])
  createdAt DateTime @default(now())
}
```

## Security Features

- **User Authentication**: All notes are tied to authenticated users
- **Authorization**: Users can only access their own notes
- **Input Sanitization**: Rich text content is properly sanitized
- **Cascade Deletion**: Versions are automatically deleted when notes are deleted

## Performance Optimizations

- **Manual Save Control**: Only saves when user explicitly requests
- **Lazy Loading**: Rich text editor loads only when needed
- **Efficient Queries**: Optimized database queries with proper indexing
- **Client-side Filtering**: Fast search and filtering without server requests
- **Unsaved Changes Tracking**: Prevents data loss with user warnings

## Future Enhancements

- **Collaborative Editing**: Real-time collaboration on notes
- **Export Options**: PDF, Markdown, and plain text export
- **Note Templates**: Pre-built templates for different types of notes
- **Advanced Search**: Full-text search with filters
- **Note Categories**: Organize notes into folders/categories
- **Rich Media**: Support for images, videos, and attachments 