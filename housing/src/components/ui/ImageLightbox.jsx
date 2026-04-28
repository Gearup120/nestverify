import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

export default function ImageLightbox({ images, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  const [zoomed, setZoomed] = useState(false)

  const goNext = useCallback(() => {
    setCurrent(i => (i + 1) % images.length)
    setZoomed(false)
  }, [images.length])

  const goPrev = useCallback(() => {
    setCurrent(i => (i - 1 + images.length) % images.length)
    setZoomed(false)
  }, [images.length])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, goNext, goPrev])

  const img = images[current]

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center" onClick={onClose}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm text-white text-sm px-4 py-1.5 rounded-full">
        {current + 1} of {images.length}
      </div>

      {/* Zoom button */}
      <button
        onClick={(e) => { e.stopPropagation(); setZoomed(z => !z) }}
        className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
      </button>

      {/* Previous */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[85vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={img?.image}
          alt={`Image ${current + 1}`}
          className={`max-w-full max-h-[85vh] object-contain transition-transform duration-300 select-none ${
            zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setZoomed(z => !z)}
          draggable={false}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto px-4 py-2 bg-black/30 backdrop-blur-sm rounded-xl">
          {images.map((img, i) => (
            <img
              key={img.id || i}
              src={img.image}
              alt=""
              onClick={(e) => { e.stopPropagation(); setCurrent(i); setZoomed(false) }}
              className={`h-12 w-16 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${
                i === current
                  ? 'ring-2 ring-teal-400 opacity-100'
                  : 'opacity-50 hover:opacity-80'
              }`}
              draggable={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
