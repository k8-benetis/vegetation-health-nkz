import React, { useEffect, useRef, useState } from 'react';
import { Viewer, createWorldTerrain, ScreenSpaceEventHandler, ScreenSpaceEventType, Color } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Card, Badge, Button } from '@nekazari/ui-kit';

// Digital Twin Lenses
export type MapLens = 'optical' | 'radar' | 'zoning' | 'carbon';

interface VegetationMap3DProps {
  parcelId?: string;
  parcelGeometry?: object; // GeoJSON
  activeDate?: Date;
  activeLens?: MapLens;
  onLensChange?: (lens: MapLens) => void;
}

const VegetationMap3D: React.FC<VegetationMap3DProps> = ({
  parcelId,
  activeLens = 'optical',
  onLensChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<'idle' | 'running' | 'success'>('idle');

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Initialize Cesium Viewer
    try {
        const viewer = new Viewer(containerRef.current, {
          terrainProvider: undefined,
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          vrButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          navigationInstructionsInitiallyVisible: false,
          creditContainer: document.createElement('div'),
        });

        viewer.scene.globe.depthTestAgainstTerrain = true;
        
        viewerRef.current = viewer;
        setIsReady(true);
    } catch (e) {
        console.error("Cesium init failed", e);
    }

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Effect: Handle Lens Switching
  useEffect(() => {
    if (!viewerRef.current || !isReady) return;
    
    const scene = viewerRef.current.scene;
    scene.fog.enabled = true;
    scene.fog.density = 0.0001;
    scene.backgroundColor = Color.BLACK;
    
    if (activeLens === 'radar') {
        scene.fog.density = 0.0008;
        scene.backgroundColor = Color.fromCssColorString('#0f172a');
    } else if (activeLens === 'carbon') {
         scene.fog.density = 0.0002;
         scene.backgroundColor = Color.fromCssColorString('#052e16');
    }
  }, [activeLens, isReady]);

  const handleRunN8N = () => {
      setN8nStatus('running');
      setTimeout(() => setN8nStatus('success'), 2000);
  };

  return (
    <div className="relative w-full h-full group">
       <div ref={containerRef} className="absolute inset-0 w-full h-full" />
       
       <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 pointer-events-none z-50">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex gap-2 pointer-events-auto shadow-2xl ring-1 ring-white/10">
             {(['optical', 'radar', 'zoning', 'carbon'] as MapLens[]).map((lens) => (
                <button
                  key={lens}
                  onClick={() => onLensChange?.(lens)}
                  className={`
                     px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 tracking-wider uppercase
                     ${activeLens === lens 
                        ? 'bg-white text-black shadow-lg scale-105 ring-2 ring-emerald-400' 
                        : 'text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105'}
                  `}
                >
                  {lens}
                </button>
             ))}
          </div>
       </div>

       <div className="absolute top-4 right-4 pointer-events-none z-50 flex flex-col gap-4">
          <Card className="pointer-events-auto bg-black/80 backdrop-blur-md border-white/10 text-white w-72 p-4 shadow-2xl ring-1 ring-white/5">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Scientific Workbench</h3>
                <Badge variant="secondary" className="text-[9px] bg-emerald-500/20 text-emerald-300 border-0">LIVE</Badge>
             </div>
             <div className="space-y-3 text-xs text-gray-400 font-mono">
               <div className="flex justify-between items-center border-b border-white/5 pb-2">
                 <span>Sensor</span> <span className="text-white">Sentinel-1/2 Combination</span>
               </div>
               <div className="flex justify-between items-center border-b border-white/5 pb-2">
                 <span>Resolution</span> <span className="text-white">10m Ground Sample</span>
               </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                 <span>Pipeline</span> <span className="text-white">F5-SAR + F6-VRA</span>
               </div>
             </div>
             <div className="mt-4 grid grid-cols-2 gap-2">
                 <button className="col-span-1 bg-white/5 hover:bg-white/10 text-emerald-300 py-2 rounded text-[10px] font-bold uppercase transition-colors border border-white/5">
                    Formula Studio
                 </button>
                 <button className="col-span-1 bg-white/5 hover:bg-white/10 text-blue-300 py-2 rounded text-[10px] font-bold uppercase transition-colors border border-white/5">
                    Data Foundry
                 </button>
             </div>
          </Card>

          <Card className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border-indigo-500/30 text-white w-72 p-4 shadow-2xl ring-1 ring-indigo-500/20">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Intelligence Hub</h3>
                <div className={`h-2 w-2 rounded-full ${n8nStatus === 'running' ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
             </div>
             <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                Connect output flow to external automation via N8N.
             </p>
             <button 
                onClick={handleRunN8N}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2"
             >
                {n8nStatus === 'running' ? 'Executing Workflow...' : 'Automate with N8N'}
             </button>
          </Card>
       </div>
    </div>
  );
};

export default VegetationMap3D;
