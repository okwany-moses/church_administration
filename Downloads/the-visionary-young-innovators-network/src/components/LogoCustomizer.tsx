import React, { useState, useRef } from "react";
import { 
  Upload, 
  Sparkles, 
  Sliders, 
  X, 
  Settings, 
  RefreshCw, 
  Check, 
  HelpCircle,
  Maximize2,
  Minimize2,
  Image as ImageIcon
} from "lucide-react";

export interface LogoSettingsType {
  logoUrl?: string;
  blendMode: string;
  hueFilter: string;
  invert: boolean;
  height: number;
  placement: string; // "left" | "right" | "replace" | "hidden"
  glow: boolean;
}

interface LogoCustomizerProps {
  onClose: () => void;
  currentSettings: LogoSettingsType;
  onSettingsChange: (settings: LogoSettingsType) => void;
  currentToken: string | null;
  isAdmin: boolean;
}

export default function LogoCustomizer({ 
  onClose, 
  currentSettings, 
  onSettingsChange,
  currentToken,
  isAdmin
}: LogoCustomizerProps) {
  const [logoUrl, setLogoUrl] = useState(currentSettings.logoUrl || "");
  const [blendMode, setBlendMode] = useState(currentSettings.blendMode || "normal");
  const [hueFilter, setHueFilter] = useState(currentSettings.hueFilter || "original");
  const [invert, setInvert] = useState(currentSettings.invert || false);
  const [height, setHeight] = useState(currentSettings.height || 36);
  const [placement, setPlacement] = useState(currentSettings.placement || "left");
  const [glow, setGlow] = useState(currentSettings.glow || false);

  // Drag and Drop States
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File loading helper
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file type. Please upload an image file (PNG, JPEG, SVG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image size exceeds the 2MB recommendation for smooth base64 database storage.");
      // We will still allow proceeding, but with warning
    } else {
      setUploadError(null);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      if (base64String) {
        setLogoUrl(base64String);
        // Preview modification live to parent
        onSettingsChange({
          logoUrl: base64String,
          blendMode,
          hueFilter,
          invert,
          height,
          placement,
          glow
        });
      }
    };
    reader.onerror = () => {
      setUploadError("An error occurred reading this image file.");
    };
    reader.readAsDataURL(file);
  };

  // Drag handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Change individual presets with live feedback
  const updateSetting = (key: string, value: any) => {
    switch (key) {
      case "blendMode": setBlendMode(value); break;
      case "hueFilter": setHueFilter(value); break;
      case "invert": setInvert(value); break;
      case "height": setHeight(value); break;
      case "placement": setPlacement(value); break;
      case "glow": setGlow(value); break;
      default: break;
    }

    // Pass live modifications directly to parent state
    onSettingsChange({
      logoUrl,
      blendMode: key === "blendMode" ? value : blendMode,
      hueFilter: key === "hueFilter" ? value : hueFilter,
      invert: key === "invert" ? value : invert,
      height: key === "height" ? value : height,
      placement: key === "placement" ? value : placement,
      glow: key === "glow" ? value : glow
    });
  };

  // Clear logo string
  const handleClearLogo = () => {
    setLogoUrl("");
    setUploadError(null);
    onSettingsChange({
      logoUrl: "",
      blendMode,
      hueFilter,
      invert,
      height,
      placement,
      glow
    });
  };

  // Save config to Node backend Express in Firestore
  const handlePersistBranding = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setStatusMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass token if exists, though our proxy route permits updating logo directly
          "Authorization": currentToken ? `Bearer ${currentToken}` : ""
        },
        body: JSON.stringify({
          logoUrl,
          blendMode,
          hueFilter,
          invert,
          height,
          placement,
          glow
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to commit branding data.");
      }

      setSaveStatus("success");
      setStatusMessage("Perfect! Logo branding committed and stored in Cloud Firestore database.");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3500);
    } catch (err: any) {
      setSaveStatus("error");
      setStatusMessage(err.message || "An exception occurred saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Force system preset / simulation helper
  const handleLoadDemoLogo = () => {
    // Elegant high-tech circular placeholder SVG base64 logomark
    const demoSvgString = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="%2334d399" stroke-width="8" stroke-dasharray="10 12"/><polygon points="50,22 75,65 25,65" fill="%2334d399" opacity="0.8"/><circle cx="50" cy="50" r="10" fill="%23ffffff"/></svg>`;
    setLogoUrl(demoSvgString);
    setUploadError(null);
    onSettingsChange({
      logoUrl: demoSvgString,
      blendMode: "normal",
      hueFilter: "original",
      invert: false,
      height: 36,
      placement: "left",
      glow: true
    });
    setBlendMode("normal");
    setHueFilter("original");
    setInvert(false);
    setHeight(36);
    setPlacement("left");
    setGlow(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end bg-slate-950/80 backdrop-blur-sm p-4" id="logo-customizer-backdrop">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-emerald-900/30 rounded-xs shadow-2xl h-[92vh] flex flex-col overflow-hidden"
        id="logo-customizer-window"
      >
        {/* Header segment */}
        <div className="p-5 border-b border-emerald-950/40 bg-slate-950/40 flex items-center justify-between" id="customizer-header">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-emerald-400 animate-spin-slow" />
            <div>
              <h3 className="text-sm font-mono font-bold tracking-widest text-slate-100 uppercase">Alliance Brand Customizer</h3>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Configure photo logo parameters & visual blend options</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-sm bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            id="btn-close-customizer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form parameters */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-emerald-900" id="customizer-body-scroller">
          
          {/* UPLOAD SECTION (DRAG & DROP COMPLIANT) */}
          <div className="space-y-2.5" id="customizer-upload-section">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> 1. Upload Logo Photo
            </span>

            {/* Drag & Drop Canvas */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xs p-6 text-center cursor-pointer transition-all ${
                isDragging 
                  ? "border-emerald-400 bg-emerald-500/5" 
                  : logoUrl 
                    ? "border-emerald-900/30 bg-slate-950/30 hover:border-emerald-500/20" 
                    : "border-slate-800 bg-slate-950/50 hover:border-emerald-900/20"
              }`}
              id="logo-drag-drop-zone"
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="hidden"
                id="logo-file-raw-input"
              />

              {logoUrl ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="mx-auto w-16 h-16 bg-slate-900/80 border border-emerald-900/40 rounded-sm flex items-center justify-center p-2">
                    <img 
                      src={logoUrl} 
                      alt="Thumbnail check" 
                      className="max-w-full max-h-full object-contain"
                      style={{ 
                        mixBlendMode: blendMode as any,
                        filter: `${invert ? "invert(1) " : ""}${
                          hueFilter === "grayscale" ? "grayscale(100%)" 
                          : hueFilter === "monochrome-white" ? "brightness(0) invert(1)" 
                          : hueFilter === "emerald" ? "sepia(1) saturate(5) hue-rotate(90deg)" : ""
                        }`
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono text-emerald-400">Photo logo active in preview</p>
                    <p className="text-[9px] text-slate-500">Clicking selects another, dragging registers replacements</p>
                  </div>
                  <div className="flex gap-2 justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleClearLogo}
                      className="px-3 py-1 bg-red-950/30 border border-red-900/30 hover:bg-red-950/50 text-red-400 font-mono text-[9px] uppercase tracking-wider rounded-xs cursor-pointer"
                    >
                      Clear Image
                    </button>
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[9px] uppercase tracking-wider rounded-xs cursor-pointer animate-pulse"
                    >
                      Swap Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">Drag & drop your logo photo here</p>
                  <p className="text-[10px] text-slate-500">or click to browse local files (PNG, JPG, SVG, WebP)</p>
                  <p className="text-[9px] text-emerald-500/60 font-mono">Maximum size recommendation: ~2MB</p>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-[10px] text-red-400 font-mono">{uploadError}</p>
            )}

            {!logoUrl && (
              <button
                type="button"
                onClick={handleLoadDemoLogo}
                className="w-full py-2 bg-slate-950/50 border border-slate-805 hover:bg-emerald-950/10 text-[10px] font-mono tracking-widest text-slate-400 hover:text-emerald-400 transition-all rounded-xs flex items-center justify-center gap-1 bg-gradient-to-r"
                id="btn-load-demo-logo"
              >
                <Sparkles className="w-3.5 h-3.5" /> Initialize High-Tech Emblem Demo Logo
              </button>
            )}
          </div>

          {/* VISUAL BLENDING PARAMETERS */}
          <div className="space-y-4 pt-4 border-t border-slate-850" id="customizer-blending-section">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> 2. Smooth Blend Configuration
            </span>

            {/* Logo Sizing */}
            <div className="space-y-1.5" id="customizer-range-height">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                <span className="text-slate-400">Logo Scale Height</span>
                <span className="text-emerald-400 brightness-110 font-bold">{height} px</span>
              </div>
              <input 
                type="range"
                min="16"
                max="64"
                value={height}
                onChange={(e) => updateSetting("height", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-sm appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                <span>16px Compact</span>
                <span>64px Extreme</span>
              </div>
            </div>

            {/* Blend Mode Selection */}
            <div className="grid grid-cols-2 gap-3" id="customizer-options-blends">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  Mix Blend Mode
                  <span className="group relative cursor-pointer text-slate-500 hover:text-slate-200">
                    <HelpCircle className="w-3 h-3" />
                    <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[8px] p-2.5 rounded-sm w-44 tracking-normal normal-case leading-normal shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      Phenomenal for blending logo backgrounds. "Screen" or "Lighten" makes solid black background logos natively transparent.
                    </span>
                  </span>
                </label>
                <select 
                  value={blendMode}
                  onChange={(e) => updateSetting("blendMode", e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="normal">Normal (Default)</option>
                  <option value="screen">Screen (Transparency)</option>
                  <option value="lighten">Lighten Colors</option>
                  <option value="color-dodge">Color Dodge (Bright)</option>
                  <option value="difference">Difference (Inverted Mask)</option>
                </select>
              </div>

              {/* Tinting Preset selectors */}
              <div className="space-y-1.5" id="customizer-options-colors">
                <label className="text-[10px] font-mono uppercase text-slate-400">Color Overlay Filter</label>
                <select 
                  value={hueFilter}
                  onChange={(e) => updateSetting("hueFilter", e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-805 text-slate-100 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="original">Original Asset Colors</option>
                  <option value="emerald">Emerald Alliance Green</option>
                  <option value="grayscale">Grayscale Silver</option>
                  <option value="monochrome-white">Flat Monochrome White</option>
                </select>
              </div>
            </div>

            {/* Checkbox overrides (Invert & Glow) */}
            <div className="bg-slate-950/40 p-3.5 border border-slate-850 space-y-3.5" id="customizer-options-toggles">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={invert}
                      onChange={(e) => updateSetting("invert", e.target.checked)}
                      className="rounded-xs text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-800"
                    />
                    Invert Asset Colors
                  </label>
                  <p className="text-[9px] text-slate-500 pl-5 mt-0.5">Useful if you uploaded a dark logo on our slate-black background</p>
                </div>
              </div>

              <div className="h-px bg-slate-900" />

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={glow}
                      onChange={(e) => updateSetting("glow", e.target.checked)}
                      className="rounded-xs text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-800"
                    />
                    Soft Background Glow Box
                  </label>
                  <p className="text-[9px] text-slate-500 pl-5 mt-0.5">Adds an elegant backlighting and subtle outline frame around the image</p>
                </div>
              </div>
            </div>
          </div>

          {/* PLACEMENT POSITION PARAMETERS */}
          <div className="space-y-3.5 pt-4 border-t border-slate-850" id="customizer-placement-section">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 3. Layout Grid Positioning
            </span>

            <div className="grid grid-cols-4 gap-2" id="customizer-placement-selection-box">
              {[
                { id: "left", label: "Left of Title", desc: "Classic logo left alignment" },
                { id: "right", label: "Right of Title", desc: "Right side spacing balance" },
                { id: "replace", label: "Logo Only", desc: "Replaces text branding header" },
                { id: "hidden", label: "Hidden", desc: "Hides additional logomarks" }
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => updateSetting("placement", pos.id)}
                  className={`p-2.5 text-center flex flex-col justify-between items-center h-20 rounded-sm border cursor-pointer transition-all ${
                    placement === pos.id 
                      ? "bg-emerald-500/10 border-emerald-500 hover:bg-emerald-500/15" 
                      : "bg-slate-950 border-slate-805 text-slate-400 hover:text-slate-100 hover:border-slate-700"
                  }`}
                  title={pos.desc}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono">{pos.label}</span>
                  <div className="h-4 w-full flex items-center justify-center">
                    {placement === pos.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer actions - Persists layout dynamically */}
        <div className="p-5 border-t border-emerald-950/40 bg-slate-950/70" id="customizer-footer">
          {saveStatus !== "idle" && (
            <div className={`p-3 text-xs rounded-sm mb-4 border flex gap-2 ${
              saveStatus === "success" 
                ? "bg-emerald-950/20 border-emerald-940/30 text-emerald-400" 
                : "bg-red-950/20 border-red-900/30 text-red-400"
            }`} id="settings-status-box">
              {saveStatus === "success" ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex gap-3" id="settings-buttons">
            <button
              onClick={handleClearLogo}
              disabled={isSaving}
              className="px-4 py-2.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-mono font-bold uppercase tracking-widest transition-all rounded-xs cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handlePersistBranding}
              disabled={isSaving}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
              id="btn-save-branding"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Writing to Ledger...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save to Cloud Firestore
                </>
              )}
            </button>
          </div>
          
          <div className="mt-3.5 text-center text-[9px] font-mono text-slate-500 tracking-wider">
            Connected Project: <span className="text-slate-400">cybernetic-baton-qmvz5</span> &middot; VYIN Matrix v2026
          </div>
        </div>

      </div>
    </div>
  );
}
