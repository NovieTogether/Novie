import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Modal, Card } from './ui.jsx'
import * as api from '../lib/api.js'

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB — keep data URLs manageable

export default function SharedMoments({ open, onClose }) {
  const { connections, showToast, awardXp } = useApp()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [photos, setPhotos] = useState([])
  const [view, setView] = useState('list') // list | detail | addAlbum | addPhoto | share
  const [albumTitle, setAlbumTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [photoDate, setPhotoDate] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [shareSelection, setShareSelection] = useState({})
  const fileInputRef = useRef(null)

  const loadAlbums = async () => {
    setLoading(true)
    const data = await api.getAlbums()
    setAlbums(data)
    setLoading(false)
  }

  useEffect(() => {
    if (open && loading) loadAlbums()
  }, [open])

  const resetState = () => {
    setSelectedAlbum(null)
    setPhotos([])
    setView('list')
    setAlbumTitle('')
    setCaption('')
    setPhotoDate('')
    setPendingImage(null)
    setShareSelection({})
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const createAlbum = async () => {
    if (!albumTitle.trim()) return
    const album = await api.addAlbum({ title: albumTitle.trim() })
    await awardXp(5, 'album', `Created album: ${albumTitle.trim()}`)
    showToast('Album created · +5 XP')
    setAlbumTitle('')
    await loadAlbums()
    if (album) openAlbum(album)
  }

  const openAlbum = async (album) => {
    setSelectedAlbum(album)
    setView('detail')
    const ph = await api.getAlbumPhotos(album.id)
    setPhotos(ph)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      showToast('Photo is too large (max 4MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPendingImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const savePhoto = async () => {
    if (!pendingImage || !selectedAlbum) return
    await api.addAlbumPhoto({
      album_id: selectedAlbum.id,
      image_data: pendingImage,
      caption: caption.trim(),
      photo_date: photoDate || null,
    })
    await awardXp(5, 'photo', 'Added a photo to album')
    showToast('Photo added · +5 XP')
    setPendingImage(null)
    setCaption('')
    setPhotoDate('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    const ph = await api.getAlbumPhotos(selectedAlbum.id)
    setPhotos(ph)
    setView('detail')
  }

  const removePhoto = async (id) => {
    await api.deleteAlbumPhoto(id)
    setPhotos(prev => prev.filter(p => p.id !== id))
    showToast('Photo deleted')
  }

  const removeAlbum = async (album) => {
    await api.deleteAlbum(album.id)
    showToast('Album deleted')
    setSelectedAlbum(null)
    setPhotos([])
    setView('list')
    await loadAlbums()
  }

  const openShare = (album) => {
    setSelectedAlbum(album)
    const current = {}
    ;(album.shared_with || []).forEach(connId => { current[connId] = true })
    setShareSelection(current)
    setView('share')
  }

  const toggleShare = (connId) => {
    setShareSelection(prev => ({ ...prev, [connId]: !prev[connId] }))
  }

  const saveSharing = async () => {
    if (!selectedAlbum) return
    const sharedWith = Object.keys(shareSelection).filter(id => shareSelection[id])
    await api.updateAlbum(selectedAlbum.id, { shared_with: sharedWith })
    showToast(sharedWith.length > 0 ? `Shared with ${sharedWith.length} connection${sharedWith.length === 1 ? '' : 's'}` : 'Album is now private')
    await loadAlbums()
    setView('detail')
  }

  const sharedConnectionNames = (album) => {
    const ids = album.shared_with || []
    return ids.map(id => connections.find(c => c.id === id)).filter(Boolean).map(c => c.name)
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <span className="kicker">SHARED MOMENTS</span>
      <h2>Photos with people who matter.</h2>
      <p className="muted" style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.5 }}>
        Create private photo albums. Share specific albums with specific connections — only after you choose to. Nothing is shared automatically.
      </p>

      {/* ALBUM LIST */}
      {view === 'list' && (
        <div style={{ marginTop: '16px' }}>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : albums.length === 0 ? (
            <Card>
              <p className="muted" style={{ margin: 0 }}>No albums yet. Create one to start collecting moments.</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {albums.map(a => {
                const sharedNames = sharedConnectionNames(a)
                return (
                  <Card key={a.id} style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '16px' }}>{a.title}</strong>
                        <div style={{ marginTop: '4px' }}>
                          {sharedNames.length > 0 ? (
                            <small style={{ color: 'var(--green)' }}>Shared with {sharedNames.join(', ')}</small>
                          ) : (
                            <small className="muted">Private</small>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="chip" onClick={() => openAlbum(a)}>Open</button>
                        <button className="chip" onClick={() => openShare(a)}>Share</button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
          <button className="primary" style={{ width: '100%', marginTop: '14px' }} onClick={() => setView('addAlbum')}>
            + Create album
          </button>
        </div>
      )}

      {/* ADD ALBUM */}
      {view === 'addAlbum' && (
        <div style={{ marginTop: '16px' }}>
          <div className="field">
            <label>Album title</label>
            <input
              value={albumTitle}
              onChange={e => setAlbumTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createAlbum()}
              placeholder="e.g. Summer 2026, Weekend hikes, Family dinner"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="primary" style={{ flex: 1 }} onClick={createAlbum}>Create album</button>
            <button className="secondary" onClick={() => setView('list')}>Cancel</button>
          </div>
        </div>
      )}

      {/* ALBUM DETAIL */}
      {view === 'detail' && selectedAlbum && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong style={{ fontSize: '18px' }}>{selectedAlbum.title}</strong>
            <button className="textBtn" onClick={() => setView('list')}>← Back</button>
          </div>

          {photos.length === 0 ? (
            <Card><p className="muted" style={{ margin: 0 }}>No photos yet. Add one to start this album.</p></Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {photos.map(p => (
                <Card key={p.id} style={{ padding: '12px' }}>
                  <img
                    src={p.image_data}
                    alt={p.caption || 'Photo'}
                    style={{ width: '100%', borderRadius: '12px', display: 'block' }}
                  />
                  {p.caption && <p style={{ fontSize: '13px', marginTop: '8px', color: 'var(--ink)' }}>{p.caption}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <small className="muted">{p.photo_date ? new Date(p.photo_date).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}</small>
                    <button className="textBtn" style={{ fontSize: '12px', color: '#a08570' }} onClick={() => removePhoto(p.id)}>Delete</button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="chips" style={{ marginTop: '14px', justifyContent: 'center' }}>
            <button className="chip" onClick={() => setView('addPhoto')}>+ Add photo</button>
            <button className="chip" onClick={() => openShare(selectedAlbum)}>Share with...</button>
            <button className="chip" style={{ color: '#a08570' }} onClick={() => removeAlbum(selectedAlbum)}>Delete album</button>
          </div>
        </div>
      )}

      {/* ADD PHOTO */}
      {view === 'addPhoto' && selectedAlbum && (
        <div style={{ marginTop: '16px' }}>
          <div className="field">
            <label>Choose a photo (max 4MB)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ width: '100%' }}
            />
          </div>
          {pendingImage && (
            <div style={{ marginTop: '10px' }}>
              <img src={pendingImage} alt="Preview" style={{ width: '100%', borderRadius: '12px' }} />
            </div>
          )}
          <div className="field" style={{ marginTop: '12px' }}>
            <label>Caption (optional)</label>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="What is happening in this moment?"
            />
          </div>
          <div className="field">
            <label>Date (optional)</label>
            <input
              type="date"
              value={photoDate}
              onChange={e => setPhotoDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="primary" style={{ flex: 1 }} onClick={savePhoto} disabled={!pendingImage}>
              Save photo · +5 XP
            </button>
            <button className="secondary" onClick={() => setView('detail')}>Cancel</button>
          </div>
        </div>
      )}

      {/* SHARE ALBUM */}
      {view === 'share' && selectedAlbum && (
        <div style={{ marginTop: '16px' }}>
          <strong style={{ fontSize: '15px' }}>Share "{selectedAlbum.title}" with:</strong>
          {connections.length === 0 ? (
            <Card style={{ marginTop: '12px' }}>
              <p className="muted" style={{ margin: 0 }}>You have no connections yet. Add someone in Connect to share albums with them.</p>
            </Card>
          ) : (
            <div className="toolList" style={{ marginTop: '12px' }}>
              {connections.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleShare(c.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{c.name} <small className="muted">{c.type}</small></span>
                  <span style={{
                    fontWeight: shareSelection[c.id] ? 800 : 400,
                    color: shareSelection[c.id] ? 'var(--green)' : 'var(--muted)',
                  }}>
                    {shareSelection[c.id] ? 'Shared' : 'Off'}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p className="muted" style={{ fontSize: '12px', marginTop: '12px', lineHeight: 1.5 }}>
            Sharing is a label you control. Your photos are never automatically visible to anyone. Revoking access is instant — just toggle off.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="primary" style={{ flex: 1 }} onClick={saveSharing}>Save sharing</button>
            <button className="secondary" onClick={() => setView('detail')}>Cancel</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
