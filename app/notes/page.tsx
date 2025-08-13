'use client';

import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '../../hooks/useAuth';
import {
  Plus,
  Search,
  Pin,
  Star,
  Tag,
  Edit,
  Trash2,
  Save,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  NotebookText,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('../../components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg"></div>,
});

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NoteVersion {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export default function NotesPage() {
  const { isAuthenticated } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localNote, setLocalNote] = useState<Note | null>(null);

  // Load notes on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadNotes();
    }
  }, [isAuthenticated]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notes');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewNote = async () => {
    if (hasUnsavedChanges) {
      if (
        confirm('You have unsaved changes. Do you want to save them before creating a new note?')
      ) {
        await saveNote();
      } else {
        setHasUnsavedChanges(false);
      }
    }

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
          tags: [],
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes((prev) => [newNote, ...prev]);
        setSelectedNote(newNote);
        setLocalNote(newNote);
        setIsEditing(true);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = useCallback(
    async (noteId: string, updates: Partial<Note>) => {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const updatedNote = await response.json();
          setNotes((prev) => prev.map((note) => (note.id === noteId ? updatedNote : note)));
          if (selectedNote?.id === noteId) {
            setSelectedNote(updatedNote);
          }
          return updatedNote;
        }
      } catch (error) {
        console.error('Error updating note:', error);
      }
    },
    [selectedNote]
  );

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const togglePin = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      await updateNote(noteId, { isPinned: !note.isPinned });
    }
  };

  const toggleStar = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      await updateNote(noteId, { isStarred: !note.isStarred });
    }
  };

  const loadVersions = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions);
        setShowVersions(true);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const restoreVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/notes/versions/${versionId}/restore`, {
        method: 'POST',
      });
      if (response.ok) {
        const restoredNote = await response.json();
        setNotes((prev) => prev.map((note) => (note.id === restoredNote.id ? restoredNote : note)));
        setSelectedNote(restoredNote);
        setShowVersions(false);
      }
    } catch (error) {
      console.error('Error restoring version:', error);
    }
  };

  // Manual save functionality
  const handleContentChange = useCallback(
    (content: string) => {
      if (!selectedNote) return;

      setLocalNote((prev) => (prev ? { ...prev, content } : null));
      setHasUnsavedChanges(true);
    },
    [selectedNote]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!selectedNote) return;

      setLocalNote((prev) => (prev ? { ...prev, title } : null));
      setHasUnsavedChanges(true);
    },
    [selectedNote]
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      if (!selectedNote) return;

      setLocalNote((prev) => (prev ? { ...prev, tags } : null));
      setHasUnsavedChanges(true);
    },
    [selectedNote]
  );

  const saveNote = async () => {
    if (!selectedNote || !localNote) return;

    try {
      const updatedNote = await updateNote(selectedNote.id, {
        title: localNote.title,
        content: localNote.content,
        tags: localNote.tags,
      });

      if (updatedNote) {
        setSelectedNote(updatedNote);
        setLocalNote(updatedNote);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  // Update local note when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setLocalNote(selectedNote);
      setHasUnsavedChanges(false);
    }
  }, [selectedNote]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Filter and sort notes
  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => note.tags.includes(tag));

      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)));

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Notes</h1>
          <p className="text-muted-foreground">Please sign in to access your notes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notes</h1>
        <button
          onClick={createNewNote}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
        >
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          New Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground sm:w-[18px] sm:h-[18px]"
              size={16}
            />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            />
          </div>

          {/* Tags Filter */}
          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
              <Tag size={14} className="sm:w-4 sm:h-4" />
              Tags
            </h3>
            <div className="space-y-1">
              {allTags.map((tag) => (
                <label key={tag} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags((prev) => [...prev, tag]);
                      } else {
                        setSelectedTags((prev) => prev.filter((t) => t !== tag));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm sm:text-base">
              <Filter size={14} className="sm:w-4 sm:h-4" />
              Sort By
            </h3>
            <div className="space-y-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'updatedAt' | 'createdAt' | 'title')}
                className="w-full p-2 border border-border rounded-lg bg-background text-sm sm:text-base"
              >
                <option value="updatedAt">Last Modified</option>
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="flex items-center gap-2 w-full p-2 border border-border rounded-lg bg-background hover:bg-muted transition-colors text-sm sm:text-base"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc size={14} className="sm:w-4 sm:h-4" />
                ) : (
                  <SortDesc size={14} className="sm:w-4 sm:h-4" />
                )}
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold text-foreground mb-3 text-sm sm:text-base">
            All Notes ({filteredNotes.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 sm:h-16 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8">
                <NotebookText className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No notes found.</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedNote?.id === note.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {note.isPinned && (
                          <Pin size={12} className="text-yellow-accent flex-shrink-0" />
                        )}
                        {note.isStarred && (
                          <Star size={12} className="text-yellow-accent flex-shrink-0" />
                        )}
                        <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                          {note.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {note.content}
                      </p>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-muted text-xs rounded-full text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="px-2 py-1 bg-muted text-xs rounded-full text-muted-foreground">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => loadVersions(selectedNote.id)}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Clock size={18} />
                  </button>
                  <button
                    onClick={() => deleteNote(selectedNote.id)}
                    className="p-2 hover:bg-muted rounded-lg text-destructive"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePin(selectedNote.id)}
                    className={`p-2 rounded-lg ${selectedNote.isPinned ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  >
                    <Pin size={18} />
                  </button>
                  <button
                    onClick={() => toggleStar(selectedNote.id)}
                    className={`p-2 rounded-lg ${selectedNote.isStarred ? 'bg-yellow-500/10 text-yellow-500' : 'hover:bg-muted'}`}
                  >
                    <Star size={18} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={localNote?.title || ''}
                    onChange={(e) => {
                      handleTitleChange(e.target.value);
                    }}
                    className="w-full p-3 text-xl font-semibold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Note title..."
                  />

                  <RichTextEditor
                    content={localNote?.content || ''}
                    onChange={handleContentChange}
                    placeholder="Start writing your note..."
                  />

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                    <input
                      type="text"
                      value={localNote?.tags.join(', ') || ''}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(',')
                          .map((tag) => tag.trim())
                          .filter((tag) => tag);
                        handleTagsChange(tags);
                      }}
                      className="w-full p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter tags separated by commas..."
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      {hasUnsavedChanges && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          Unsaved changes
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setLocalNote(selectedNote);
                          setHasUnsavedChanges(false);
                        }}
                        className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveNote}
                        disabled={!hasUnsavedChanges}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          hasUnsavedChanges
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        <Save size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">{selectedNote.title}</h2>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                  />
                  {selectedNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedNote.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Version History */}
              {showVersions && (
                <div className="mt-6 p-4 border border-border rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-foreground mb-3">Version History</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-2 bg-background rounded"
                      >
                        <div>
                          <p className="font-medium text-foreground">{version.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => restoreVersion(version.id)}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <NotebookText size={48} className="mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No note selected</h3>
                <p className="text-sm">
                  Select a note from the list or create a new one to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
