'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const API = process.env.NEXT_PUBLIC_API_URL;
const token = () => localStorage.getItem('token') || '';

// Mockup Component for Live Preview
function MobileMockup({ primaryColor, secondaryColor, bgImage }: any) {
  return (
    <div className="w-[280px] h-[min(550px,80vh)] rounded-[32px] border-[6px] border-gray-900 bg-gray-50 shadow-2xl relative overflow-hidden shrink-0 mx-auto lg:mx-0">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundColor: '#f8f9fc' }}
      />
      
      {/* Notch / Status bar area */}
      <div className="absolute top-0 inset-x-0 h-6 bg-transparent z-20 flex justify-center pt-2">
        <div className="w-24 h-4 bg-gray-900 rounded-full" />
      </div>

      {/* App Content */}
      <div className="relative z-10 h-full flex flex-col pt-8">
        
        {/* Header Mock */}
        <div className="px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
          <div className="flex-1 px-3">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100 mt-1" />
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide">
          {/* Banner */}
          <div className="w-full h-32 rounded-xl shadow-sm bg-gradient-to-br from-gray-100 to-gray-200 flex items-end p-4">
            <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-md" style={{ backgroundColor: primaryColor }}>
              Shop Now
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-3 overflow-hidden">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center bg-white shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: `${secondaryColor}40` }} />
              </div>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-3 pb-20">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <div className="w-full h-24 bg-gray-100 rounded-lg mb-2" />
                <div className="h-3 w-full bg-gray-200 rounded mb-1" />
                <div className="h-3 w-1/2 bg-gray-200 rounded mb-3" />
                <button className="w-full py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: primaryColor }}>
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav Mock */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-b-[32px]">
          <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center gap-1 text-primary">
            <div className="w-5 h-5 rounded-md" style={{ backgroundColor: primaryColor }} />
          </div>
          <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 rounded-md bg-gray-300" />
          </div>
          <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 rounded-md bg-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableMockup({ primaryColor, secondaryColor, bgImage, onClose }: any) {
  const [position, setPosition] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 340 : 0, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, initialX: position.x, initialY: position.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: dragRef.current.initialX + (e.clientX - dragRef.current.startX), y: Math.max(0, dragRef.current.initialY + (e.clientY - dragRef.current.startY)) });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div style={{ left: position.x, top: position.y }} className="fixed z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.2)] rounded-[32px] bg-white border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
      <div onMouseDown={handleMouseDown} className="h-10 bg-gray-100 rounded-t-[32px] flex items-center justify-between px-6 cursor-grab active:cursor-grabbing select-none border-b border-gray-200">
        <span className="text-xs font-bold text-gray-500">Drag to move</span>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white flex items-center justify-center text-gray-600 transition-colors">&times;</button>
      </div>
      <div className="bg-gray-100 p-2 rounded-b-[32px]">
        <MobileMockup primaryColor={primaryColor} secondaryColor={secondaryColor} bgImage={bgImage} />
      </div>
    </div>
  );
}

export default function ThemeEditor({ initialTheme, initialBgImage, savedThemes = [], onSave }: any) {
  const [draft, setDraft] = useState({
    primaryColor: initialTheme?.primaryColor || '#4f46e5',
    secondaryColor: initialTheme?.secondaryColor || '#7c3aed',
    activeThemeName: initialTheme?.activeThemeName || 'default',
    backgroundImage: initialBgImage || '',
  });

  const [themesList, setThemesList] = useState(savedThemes);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Crop State
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 9 / 16, width, height),
      width, height
    );
    setCrop(crop);
  };

  const handleUploadCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    setUploadingImage(true);
    try {
      const canvas = document.createElement('canvas');
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2d context');

      const pixelRatio = window.devicePixelRatio;
      canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas empty')), 'image/webp', 0.9);
      });

      const formData = new FormData();
      formData.append('file', blob, 'bg.webp');
      
      const res = await fetch(`${API}/uploads?folder=settings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      setDraft(d => ({ ...d, backgroundImage: data.url }));
      setImgSrc(''); // Close modal
    } catch (e: any) {
      alert(e.message || 'Failed to crop/upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let updatedThemes = [...themesList];
    
    // Auto-save to library logic
    const name = draft.activeThemeName.trim();
    if (name) {
      const existingIdx = updatedThemes.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
      const newThemeData = {
        name,
        primaryColor: draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        backgroundImage: draft.backgroundImage
      };
      if (existingIdx >= 0) {
        updatedThemes[existingIdx] = newThemeData; // update existing
      } else {
        updatedThemes.push(newThemeData); // add new
      }
      setThemesList(updatedThemes);
    }

    await onSave({
      appTheme: {
        primaryColor: draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        activeThemeName: draft.activeThemeName,
      },
      backgroundImage: draft.backgroundImage,
      savedThemes: updatedThemes,
    });
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveToLibrary = () => {
    setLibraryError('');
    const name = draft.activeThemeName.trim();
    if (!name) {
      setLibraryError('Please enter an Active Theme Name first.');
      return;
    }
    const existingIdx = themesList.findIndex((t: any) => t.name.toLowerCase() === name.toLowerCase());
    const newTheme = {
      name,
      primaryColor: draft.primaryColor,
      secondaryColor: draft.secondaryColor,
      backgroundImage: draft.backgroundImage
    };
    let updated = [...themesList];
    if (existingIdx >= 0) {
      updated[existingIdx] = newTheme;
    } else {
      updated.push(newTheme);
    }
    setThemesList(updated);
    onSave({ savedThemes: updated });
  };

  const applyFromLibrary = (theme: any) => {
    setDraft({
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      activeThemeName: theme.name,
      backgroundImage: theme.backgroundImage || '',
    });
    setLibraryError('');
  };

  const removeFromLibrary = (themeName: string) => {
    if (!confirm(`Delete saved theme "${themeName}" from library?`)) return;
    const updated = themesList.filter((t: any) => t.name !== themeName);
    setThemesList(updated);
    onSave({ savedThemes: updated });
  };

  return (
    <div className="flex flex-col gap-6 py-2 max-w-4xl">
      {/* Editor Controls */}
      <div className="flex-1 space-y-6">
        
        {/* Saved Themes Library */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-gray-800">Saved Themes Library</label>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{themesList.length} saved</span>
          </div>
          
          {themesList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themesList.map((t: any, i: number) => (
                <div key={i} className="group relative border border-gray-200 rounded-xl p-3 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer bg-gray-50/50 hover:bg-white" onClick={() => applyFromLibrary(t)}>
                  <p className="text-sm font-bold text-gray-800 truncate pr-6">{t.name}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: t.primaryColor }} />
                    <div className="w-5 h-5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: t.secondaryColor }} />
                    {t.backgroundImage && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded ml-auto">IMG</span>}
                  </div>
                  
                  <button onClick={(e) => { e.stopPropagation(); removeFromLibrary(t.name); }} 
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Theme">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
              No saved themes yet. Save your current setup!
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <label className="text-xs font-bold text-gray-800 mb-1.5 block">Primary Color</label>
            <div className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
              <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0 shadow-sm" 
                value={draft.primaryColor} 
                onChange={e => setDraft(s => ({ ...s, primaryColor: e.target.value }))} 
              />
              <span className="text-sm font-bold text-gray-700 uppercase">{draft.primaryColor}</span>
            </div>
          </div>
          
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <label className="text-xs font-bold text-gray-800 mb-1.5 block">Secondary Color</label>
            <div className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
              <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0 shadow-sm" 
                value={draft.secondaryColor} 
                onChange={e => setDraft(s => ({ ...s, secondaryColor: e.target.value }))} 
              />
              <span className="text-sm font-bold text-gray-700 uppercase">{draft.secondaryColor}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-gray-800">Active Theme Name</label>
          </div>
          <input 
            className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-0 transition-colors bg-gray-50/50" 
            value={draft.activeThemeName} 
            onChange={e => { setDraft(s => ({ ...s, activeThemeName: e.target.value })); setLibraryError(''); }} 
            placeholder="e.g. Festival, Rainy, Default" 
          />
          <p className="text-[10px] text-gray-500 mt-1">Saves to library automatically.</p>
          {libraryError && <p className="text-[10px] text-red-600 font-medium mt-1">{libraryError}</p>}
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-xs font-bold text-gray-800 block">Background Image</label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {draft.backgroundImage ? (
              <div className="w-24 h-40 rounded-lg overflow-hidden border-2 border-gray-100 shrink-0 relative group shadow-sm">
                <img src={draft.backgroundImage} className="w-full h-full object-cover" alt="bg" />
                <button 
                  onClick={() => setDraft(d => ({ ...d, backgroundImage: '' }))}
                  className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold backdrop-blur-sm"
                >
                  <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Remove
                </button>
              </div>
            ) : (
              <div className="w-24 h-40 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                <span className="text-2xl text-gray-300">🖼️</span>
              </div>
            )}
            
            <div className="flex-1 space-y-3 w-full">
              <label className="flex items-center justify-center gap-2 w-full bg-white border border-indigo-100 text-indigo-700 px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-50 cursor-pointer shadow-sm transition-all active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
              </label>
              
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 text-[10px] text-blue-700 leading-relaxed">
                Portrait 9:16 recommended.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center gap-4">
          <button 
            onClick={() => setShowPreview(true)}
            className="text-indigo-600 bg-indigo-50 px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-100 transition-colors text-sm flex items-center gap-2"
          >
            📱 Show Preview
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || saveSuccess}
            className={`px-8 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2 ${
              saveSuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : saveSuccess ? (
              <><span>✅</span> Saved!</>
            ) : (
              <><span>💾</span> Save & Apply Theme</>
            )}
          </button>
        </div>

      </div>

      {/* Floating Preview Mockup */}
      {showPreview && (
        <DraggableMockup 
          primaryColor={draft.primaryColor}
          secondaryColor={draft.secondaryColor}
          bgImage={draft.backgroundImage}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Crop Modal */}
      {!!imgSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Crop Background Image</h2>
            <div className="flex-1 overflow-auto bg-gray-50 rounded-xl flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={9 / 16}
              >
                <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} className="max-h-[60vh] object-contain" />
              </ReactCrop>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setImgSrc('')}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadCrop}
                disabled={uploadingImage || !completedCrop?.width || !completedCrop?.height}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploadingImage ? 'Uploading...' : 'Crop & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
