'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bookmark, BookmarkCheck, Loader2, X, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/context/AuthContext'
import type { PromptCollection } from '@/types/database'

interface Props {
  jobSetId: string
}

export default function SavePromptButton({ jobSetId }: Props) {
  const { user, openAuth } = useAuth()
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [showPanel, setShowPanel] = useState(false)
  const [notes, setNotes] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [collections, setCollections] = useState<PromptCollection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [newCollectionName, setNewCollectionName] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  // Check if already saved
  useEffect(() => {
    if (!user) { setCheckingStatus(false); return }

    supabase
      .from('saved_prompts')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_set_id', jobSetId)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        if (data) { setSaved(true); setSavedId(data.id) }
        setCheckingStatus(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, jobSetId])

  // Load collections
  useEffect(() => {
    if (!user) return
    supabase
      .from('prompt_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }: { data: PromptCollection[] | null }) => setCollections(data ?? []))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleUnsave = useCallback(async () => {
    if (!savedId) return
    setLoading(true)
    await supabase.from('saved_prompts').delete().eq('id', savedId)
    setSaved(false)
    setSavedId(null)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedId])

  const handleSave = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      let collectionId = selectedCollection || null

      // Create new collection if requested
      if (newCollectionName.trim()) {
        const { data: newCol } = await supabase
          .from('prompt_collections')
          .insert({ user_id: user.id, name: newCollectionName.trim() })
          .select('id')
          .single()
        collectionId = newCol?.id ?? null
      }

      const tags = tagsInput.trim()
        ? tagsInput.split(',').map(t => t.trim()).filter(Boolean)
        : null

      const { data } = await supabase
        .from('saved_prompts')
        .insert({
          user_id: user.id,
          job_set_id: jobSetId,
          collection_id: collectionId,
          notes: notes.trim() || null,
          tags,
        })
        .select('id')
        .single()

      setSaved(true)
      setSavedId(data?.id ?? null)
      setShowPanel(false)
      setNotes('')
      setTagsInput('')
      setNewCollectionName('')
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, jobSetId, notes, tagsInput, selectedCollection, newCollectionName])

  if (!user) {
    return (
      <button
        onClick={() => openAuth('login')}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        Sign in to save
      </button>
    )
  }

  if (checkingStatus) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking…</span>
      </div>
    )
  }

  if (saved) {
    return (
      <button
        onClick={handleUnsave}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-red-900/20 hover:text-red-400 hover:border-red-700/40 transition-all duration-200"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkCheck className="w-4 h-4" />}
        {loading ? 'Removing…' : 'Saved'}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(p => !p)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        Save prompt
      </button>

      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1rem)] max-h-[80vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 p-4 z-20 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Save to library</p>
            <button onClick={() => setShowPanel(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Collection selector */}
          {collections.length > 0 && (
            <div className="mb-3">
              <label className="block text-xs text-zinc-500 mb-1">Collection (optional)</label>
              <select
                value={selectedCollection}
                onChange={e => setSelectedCollection(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="">No collection</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* New collection */}
          <div className="mb-3">
            <label className="block text-xs text-zinc-500 mb-1">New collection name</label>
            <input
              type="text"
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              placeholder="e.g. Golden Hour Portraits"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="mb-3">
            <label className="block text-xs text-zinc-500 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What do you like about this prompt?"
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-xs text-zinc-500 mb-1">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="golden hour, portrait, bokeh"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-950 font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving…' : 'Save to library'}
          </button>
        </div>
      )}
    </div>
  )
}
