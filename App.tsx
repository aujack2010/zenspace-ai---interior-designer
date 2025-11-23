import React, { useState, useRef } from 'react';
import { Upload, Wand2, Eraser, Download, RefreshCcw, AlertCircle, Image as ImageIcon, PlusSquare, Check, Layers, MousePointer2, Sparkles } from 'lucide-react';
import { DesignStyle, AppMode, ProcessingState, RoomType } from './types';
import { removeFurniture, transformRoomStyle, addFurniture } from './services/geminiService';
import { ComparisonSlider } from './components/ComparisonSlider';
import { StyleSelector } from './components/StyleSelector';
import { RoomSelector } from './components/RoomSelector';
import { ImageMasker, ImageMaskerRef } from './components/ImageMasker';

// Map room types to available furniture options
const ROOM_FURNITURE_OPTIONS: Record<RoomType, string[]> = {
  [RoomType.LivingRoom]: ['Sofa', 'Coffee Table', 'TV Stand', 'Rug', 'Floor Lamp', 'Armchair', 'Plants'],
  [RoomType.Bedroom]: ['Bed', 'Nightstand', 'Rug', 'Small Coffee Table', 'Small Sofa', 'Wardrobe', 'Dresser'],
  [RoomType.MediaRoom]: ['Sectional Sofa', 'Projector Screen', 'Sound System', 'Bean Bags', 'Blackout Curtains'],
  [RoomType.Kitchen]: ['Dining Table', 'Chairs', 'Kitchen Island', 'Bar Stools', 'Refrigerator'],
  [RoomType.KitchenLiving]: ['Sofa', 'Dining Table', 'Bar Stools', 'Rug', 'TV Unit'],
  [RoomType.Garage]: ['Workbench', 'Tool Cabinet', 'Shelving Unit', 'Car', 'Bicycle'],
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Changed to handle multiple result images
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  
  const [mode, setMode] = useState<AppMode>(AppMode.Upload);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>(DesignStyle.Modern);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>(RoomType.LivingRoom);
  
  // State for Remove Furniture
  const [keepItems, setKeepItems] = useState<string>('');
  const [isManualRemoval, setIsManualRemoval] = useState<boolean>(false);
  
  // State for Add Furniture
  const [selectedFurnitureItems, setSelectedFurnitureItems] = useState<string[]>([]);
  const [addFurniturePrompt, setAddFurniturePrompt] = useState<string>('');

  const [processing, setProcessing] = useState<ProcessingState>({
    isLoading: false,
    statusMessage: '',
    progress: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageMaskerRef = useRef<ImageMaskerRef>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setResultUrls([]);
      setSelectedResultIndex(0);
      setMode(AppMode.RemoveFurniture); // Default next step
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFurnitureToggle = (item: string) => {
    setSelectedFurnitureItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleRemoveFurniture = async () => {
    if (!file && !previewUrl) return;

    setProcessing({ isLoading: true, statusMessage: 'Processing room...', progress: 10 });
    try {
      let inputImage = '';
      
      if (isManualRemoval && imageMaskerRef.current) {
        // Get the image with red mask from the canvas
        inputImage = imageMaskerRef.current.getMaskedImage();
      } else if (file) {
        // Use original file
        inputImage = await convertToBase64(file);
      }

      setProcessing(prev => ({ ...prev, statusMessage: isManualRemoval ? 'Removing selected objects...' : 'AI is identifying furniture...', progress: 40 }));
      setTimeout(() => setProcessing(prev => ({ ...prev, progress: 60, statusMessage: 'Inpainting background...' })), 1000);

      const generatedImages = await removeFurniture(inputImage, keepItems, isManualRemoval);
      
      setResultUrls(generatedImages);
      setSelectedResultIndex(0);
      setMode(AppMode.Result);
    } catch (error) {
      alert("Failed to process image. Please try again.");
      console.error(error);
    } finally {
      setProcessing({ isLoading: false, statusMessage: '', progress: 0 });
    }
  };

  const handleAddFurniture = async () => {
    if (!file) return;
    if (selectedFurnitureItems.length === 0 && addFurniturePrompt.trim() === '') {
        alert("Please select at least one furniture item or provide a description.");
        return;
    }

    setProcessing({ isLoading: true, statusMessage: `Analyzing ${selectedRoomType} perspective...`, progress: 20 });
    try {
      const base64 = await convertToBase64(file);
      
      setProcessing(prev => ({ ...prev, statusMessage: 'Generating 3 furniture layout variations...', progress: 50 }));
      
      const generatedImages = await addFurniture(base64, selectedRoomType, selectedFurnitureItems, addFurniturePrompt);
      
      setResultUrls(generatedImages);
      setSelectedResultIndex(0);
      setMode(AppMode.Result);
    } catch (error) {
      alert("Failed to add furniture. Please try again.");
      console.error(error);
    } finally {
      setProcessing({ isLoading: false, statusMessage: '', progress: 0 });
    }
  };

  const handleStyleTransfer = async () => {
    if (!file) return;

    setProcessing({ isLoading: true, statusMessage: `Analyzing ${selectedRoomType} layout...`, progress: 20 });
    try {
      const base64 = await convertToBase64(file);
      
      setProcessing(prev => ({ ...prev, statusMessage: `Generating 3 ${selectedStyle} variations...`, progress: 50 }));
      
      const generatedImages = await transformRoomStyle(base64, selectedStyle, selectedRoomType);
      
      setResultUrls(generatedImages);
      setSelectedResultIndex(0);
      setMode(AppMode.Result);
    } catch (error) {
      alert("Failed to transform style. Please try again.");
      console.error(error);
    } finally {
      setProcessing({ isLoading: false, statusMessage: '', progress: 0 });
    }
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `zenspace-variation-${index + 1}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSelected = () => {
    if (resultUrls[selectedResultIndex]) {
      downloadImage(resultUrls[selectedResultIndex], selectedResultIndex);
    }
  };

  const handleDownloadAll = () => {
    resultUrls.forEach((url, index) => {
      // Add slight delay to prevent browser blocking multiple downloads
      setTimeout(() => {
        downloadImage(url, index);
      }, index * 500);
    });
  };

  const resetApp = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrls([]);
    setSelectedResultIndex(0);
    setMode(AppMode.Upload);
    setKeepItems('');
    setSelectedFurnitureItems([]);
    setAddFurniturePrompt('');
    setIsManualRemoval(false);
  };

  // Helper to determine if we have results
  const hasResults = resultUrls.length > 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wand2 size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">ZenSpace<span className="text-indigo-400">.AI</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
             {mode !== AppMode.Upload && (
              <button 
                onClick={resetApp}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Start Over"
              >
                <RefreshCcw size={20} />
              </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Viewport Area */}
        <div className="mb-8">
          {mode === AppMode.Upload ? (
            <div 
              className="border-2 border-dashed border-gray-700 rounded-2xl h-[400px] sm:h-[500px] flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/50 transition-colors cursor-pointer group"
              onClick={triggerFileInput}
            >
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                <Upload size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Interior Photo</h3>
              <p className="text-gray-400 text-center max-w-sm px-4">
                Supports JPG, PNG. Best results with well-lit, wide-angle shots.
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          ) : (
            <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-6">
              {/* Loading Overlay */}
              {processing.isLoading && (
                <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center h-[400px] sm:h-[600px]">
                  <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-semibold text-white animate-pulse">{processing.statusMessage}</p>
                </div>
              )}

              {/* Result, Manual Mask, or Static Preview */}
              {mode === AppMode.Result && previewUrl && hasResults ? (
                <div className="flex flex-col gap-4">
                  <ComparisonSlider beforeImage={previewUrl} afterImage={resultUrls[selectedResultIndex]} />
                  
                  {/* Multiple Results Thumbs */}
                  {resultUrls.length > 1 && (
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {resultUrls.map((url, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedResultIndex(idx)}
                          className={`relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedResultIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.02]' : 'border-gray-700 hover:border-gray-500 opacity-70 hover:opacity-100'}`}
                        >
                          <img src={url} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1 text-xs text-center font-medium">
                            Variation {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : mode === AppMode.RemoveFurniture && isManualRemoval && previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-700 shadow-2xl aspect-[4/3] bg-black max-h-[600px]">
                    <ImageMasker ref={imageMaskerRef} imageUrl={previewUrl} />
                </div>
              ) : previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-700 shadow-2xl aspect-[4/3] bg-black max-h-[600px]">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs text-gray-300 border border-gray-700">
                    ORIGINAL IMAGE
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Controls Area */}
        {mode !== AppMode.Upload && !processing.isLoading && (
          <div className="max-w-4xl mx-auto bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Workflow Toggle */}
              <div className="w-full md:w-1/3 space-y-4">
                 <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Choose Action</h3>
                 <div className="flex flex-col gap-3">
                   <button 
                    onClick={() => setMode(AppMode.RemoveFurniture)}
                    className={`flex items-center p-4 rounded-xl border transition-all ${mode === AppMode.RemoveFurniture || (mode === AppMode.Result && resultUrls.length === 1) ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:bg-gray-800'}`}
                   >
                     <div className={`p-2 rounded-lg mr-3 ${mode === AppMode.RemoveFurniture || (mode === AppMode.Result && resultUrls.length === 1) ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                       <Eraser size={20} />
                     </div>
                     <div className="text-left">
                       <div className="font-semibold">Clear Room</div>
                       <div className="text-xs text-gray-400">Remove furniture</div>
                     </div>
                   </button>

                   <button 
                    onClick={() => setMode(AppMode.AddFurniture)}
                    className={`flex items-center p-4 rounded-xl border transition-all ${mode === AppMode.AddFurniture ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:bg-gray-800'}`}
                   >
                     <div className={`p-2 rounded-lg mr-3 ${mode === AppMode.AddFurniture ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                       <PlusSquare size={20} />
                     </div>
                     <div className="text-left">
                       <div className="font-semibold">Add Furniture</div>
                       <div className="text-xs text-gray-400">Add items (3 Variations)</div>
                     </div>
                   </button>

                   <button 
                    onClick={() => setMode(AppMode.StyleTransfer)}
                    className={`flex items-center p-4 rounded-xl border transition-all ${mode === AppMode.StyleTransfer ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:bg-gray-800'}`}
                   >
                     <div className={`p-2 rounded-lg mr-3 ${mode === AppMode.StyleTransfer ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                       <ImageIcon size={20} />
                     </div>
                     <div className="text-left">
                       <div className="font-semibold">Restyle Room</div>
                       <div className="text-xs text-gray-400">Restyle (3 Variations)</div>
                     </div>
                   </button>
                 </div>
              </div>

              {/* Dynamic Options */}
              <div className="w-full md:w-2/3 border-l border-gray-700 md:pl-8">
                {mode === AppMode.RemoveFurniture || (mode === AppMode.Result && !hasResults) ? (
                   <div className="h-full flex flex-col justify-center">
                     <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-6">
                       <div className="flex items-start gap-3 mb-4">
                         <AlertCircle className="text-indigo-400 shrink-0 mt-1" size={20} />
                         <div>
                           <h4 className="font-medium text-white">Declutter Settings</h4>
                           <p className="text-sm text-gray-400 mt-1">
                             Choose how you want to remove objects from your room.
                           </p>
                         </div>
                       </div>
                       
                       {/* Mode Toggle: Auto vs Manual */}
                       <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-lg mb-6">
                          <button 
                            onClick={() => setIsManualRemoval(false)}
                            className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${!isManualRemoval ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                          >
                            <Sparkles size={16} />
                            Auto Detect
                          </button>
                          <button 
                            onClick={() => setIsManualRemoval(true)}
                            className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${isManualRemoval ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                          >
                            <MousePointer2 size={16} />
                            Manual Brush
                          </button>
                       </div>

                       {/* Conditional Inputs */}
                       {!isManualRemoval ? (
                          <div className="pt-2 border-t border-gray-700 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Keep specific items (Optional)
                            </label>
                            <input 
                              type="text" 
                              value={keepItems}
                              onChange={(e) => setKeepItems(e.target.value)}
                              placeholder="e.g. fireplace, ceiling fan, kitchen island..."
                              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              AI will remove everything else.
                            </p>
                          </div>
                       ) : (
                          <div className="pt-2 border-t border-gray-700 animate-in fade-in slide-in-from-top-2">
                             <p className="text-sm text-gray-300">
                               Use the brush on the image above to paint over the objects you want to remove. 
                             </p>
                             <div className="mt-3 flex gap-2">
                                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/30">Red Mask</span>
                                <span className="text-xs text-gray-500 py-1">= Area to remove</span>
                             </div>
                          </div>
                       )}
                     </div>
                     
                     <button 
                      onClick={handleRemoveFurniture}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                     >
                       Start Removal
                     </button>
                   </div>
                ) : mode === AppMode.AddFurniture ? (
                  <div className="space-y-4">
                    <RoomSelector selectedRoom={selectedRoomType} onSelect={(r) => {
                        setSelectedRoomType(r);
                        setSelectedFurnitureItems([]); // Clear selection on room change
                    }} />
                    
                    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                      <h4 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">Select Items to Add</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                        {ROOM_FURNITURE_OPTIONS[selectedRoomType].map((item) => (
                            <button
                                key={item}
                                onClick={() => handleFurnitureToggle(item)}
                                className={`text-sm px-3 py-2 rounded-lg border transition-all text-left flex items-center justify-between group ${selectedFurnitureItems.includes(item) 
                                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                {item}
                                {selectedFurnitureItems.includes(item) && <Check size={14} />}
                            </button>
                        ))}
                      </div>

                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Additional Details / Prompt
                      </label>
                      <textarea 
                        value={addFurniturePrompt}
                        onChange={(e) => setAddFurniturePrompt(e.target.value)}
                        placeholder="E.g. Place a cream colored rug under the bed, and add a modern floor lamp in the corner."
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[80px] resize-none"
                      />
                    </div>

                    <button 
                      onClick={handleAddFurniture}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Layers size={20} />
                      Generate 3 Variations
                    </button>
                  </div>
                ) : mode === AppMode.StyleTransfer ? (
                  <div className="space-y-2">
                    <RoomSelector selectedRoom={selectedRoomType} onSelect={setSelectedRoomType} />
                    <StyleSelector selectedStyle={selectedStyle} onSelect={setSelectedStyle} />
                    <div className="pt-4">
                      <button 
                        onClick={handleStyleTransfer}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Layers size={20} />
                        Generate 3 Variations
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Transformation Complete</h3>
                    <p className="text-gray-400 mb-6">Select a variation above to view details.</p>
                    
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button 
                        onClick={handleDownloadSelected}
                        className="py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium border border-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        Download Selected
                      </button>
                      <button 
                        onClick={handleDownloadAll}
                        className="py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                      >
                        <Layers size={18} />
                        Download All
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setMode(AppMode.RemoveFurniture)} 
                      className="mt-4 text-gray-500 hover:text-white text-sm underline decoration-gray-700 underline-offset-4"
                    >
                      Start New Design
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;