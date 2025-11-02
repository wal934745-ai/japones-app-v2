import React, { useEffect, useRef, useState } from 'react';

interface KanjiStrokeAnimationProps {
  kanji: string;
  size?: number;
  strokeColor?: string;
  autoPlay?: boolean;
}

const KanjiStrokeAnimation: React.FC<KanjiStrokeAnimationProps> = ({
  kanji,
  size = 200,
  strokeColor = '#667eea',
  autoPlay = true
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [svgData, setSvgData] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Obtener código Unicode del kanji en hexadecimal
  const getUnicodeHex = (char: string) => {
    return char.charCodeAt(0).toString(16).padStart(5, '0');
  };

  // Cargar datos del SVG desde KanjiVG
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    
    const unicodeHex = getUnicodeHex(kanji);
    const url = `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${unicodeHex}.svg`;

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Kanji no encontrado');
        return response.text();
      })
      .then(svgText => {
        setSvgData(svgText);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error cargando SVG del kanji:', err);
        setError(true);
        setIsLoading(false);
      });
  }, [kanji]);

  // Dibujar en canvas con animación
  const drawStrokesOnCanvas = () => {
    if (!canvasRef.current || !svgData || isAnimating) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsAnimating(true);

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Parsear SVG para extraer paths
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
    const paths = svgDoc.querySelectorAll('path');

    if (paths.length === 0) {
      console.warn('No se encontraron paths en el SVG');
      setIsAnimating(false);
      return;
    }

    // Configurar canvas
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Animar cada trazo
    let currentStroke = 0;

    const animateNextStroke = () => {
      if (currentStroke >= paths.length) {
        setIsAnimating(false);
        return;
      }

      const path = paths[currentStroke];
      const pathData = path.getAttribute('d');
      if (!pathData) {
        currentStroke++;
        setTimeout(animateNextStroke, 100);
        return;
      }

      // Crear path 2D
      const path2D = new Path2D(pathData);
      
      // Simular animación dibujando el trazo
      ctx.stroke(path2D);

      currentStroke++;
      setTimeout(animateNextStroke, 600); // Delay entre trazos
    };

    animateNextStroke();
  };

  // Auto-play al cargar
  useEffect(() => {
    if (svgData && autoPlay && !isLoading && !error) {
      setTimeout(drawStrokesOnCanvas, 500);
    }
  }, [svgData, autoPlay, isLoading, error]);

  if (isLoading) {
    return (
      <div className="kanji-stroke-container loading">
        <div className="spinner"></div>
        <p>Cargando kanji...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kanji-stroke-container error">
        <div className="error-icon">❌</div>
        <p>No se pudo cargar el kanji {kanji}</p>
      </div>
    );
  }

  return (
    <div className="kanji-stroke-container" ref={containerRef}>
      <div className="kanji-card">
        <div className="kanji-display">{kanji}</div>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="kanji-canvas"
        />
      </div>
      
      <button
        onClick={drawStrokesOnCanvas}
        disabled={isAnimating}
        className="replay-button"
      >
        {isAnimating ? '⏳ Animando...' : '🔄 Ver trazos'}
      </button>

      <style>{`
        .kanji-stroke-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          min-width: 240px;
        }

        .dark .kanji-stroke-container {
          background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        }

        .kanji-stroke-container.loading,
        .kanji-stroke-container.error {
          min-height: 200px;
          justify-content: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(102, 126, 234, 0.2);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 3rem;
        }

        .kanji-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          position: relative;
        }

        .dark .kanji-card {
          background: #374151;
        }

        .kanji-display {
          position: absolute;
          top: 1rem;
          left: 1rem;
          font-size: 2rem;
          font-weight: 700;
          color: rgba(102, 126, 234, 0.3);
          z-index: 0;
        }

        .kanji-canvas {
          display: block;
          max-width: 100%;
          height: auto;
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 8px;
          background: white;
          position: relative;
          z-index: 1;
        }

        .dark .kanji-canvas {
          background: #f9fafb;
        }

        .replay-button {
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .replay-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .replay-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .replay-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default KanjiStrokeAnimation;
