import React, { useEffect, useRef, useState } from 'react';
// import { Viewer, createWorldTerrain, ScreenSpaceEventHandler, ScreenSpaceEventType, Color } from 'cesium';
// import 'cesium/Build/Cesium/Widgets/widgets.css';
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
  // const viewerRef = useRef<Viewer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<'idle' | 'running' | 'success'>('idle');

  useEffect(() => {
    // Mock Ready
    setIsReady(true);
  }, []);

  const handleRunN8N = () => {
      setN8nStatus('running');
      setTimeout(() => setN8nStatus('success'), 2000);
  };

  return (
    <div className="relative w-full h-full group bg-gray-900">
       <div className="absolute inset-0 flex items-center justify-center text-white">
           <div className="text-center">
             <h2 className="text-2xl font-bold mb-2">Digital Twin Loading...</h2>
             <p className="text-gray-400">Cesium Viewer is currently disabled for debugging.</p>
           </div>
       </div>

       {/* Lens Dock (HUD) */}
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
                <Badge variant="default" className="text-[9px] bg-emerald-500/20 text-emerald-300 border-0">LIVE</Badge>
             </div>
          </Card>
       </div>
    </div>
  );
};

export default VegetationMap3D;
