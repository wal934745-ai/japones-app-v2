import React, { useState, useRef } from 'react';
import { LoadingState, GroundingChunk } from '../types';
import Card from './common/Card';
import KanjiStrokeAnimation from './KanjiStrokeAnimation';

interface LessonDisplayProps {
  lesson: string;
  sources: GroundingChunk[];
  loadingState: LoadingState;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

function convertirLeccionATelegram(lesson: string): string {
  let output = lesson
    .replace(/### Mini Quiz Interactivo[\s\S]*?(?=(---|$))/g, '')
    .replace(/[\n\r]+\s+[\n\r]+/g, '\n\n')
    .replace(/###\s?/g, '')
    .replace(/^[\s\n]*[-]{2,}\s*$/gm, '')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();

  output = output.replace(/^Palabra a estudiar:/mi, '📕 **Palabra a Estudiar:**');
  output = output.replace(/^Significado y Contextos de Uso:/mi, '\n━━━━━━━━━━━━━━\n📖 **Significado y Contextos de Uso:**');
  output = output.replace(/^Significado:/mi, '\n━━━━━━━━━━━━━━\n📖 **Significado:**');
  output = output.replace(/^Ejemplos:/mi, '\n━━━━━━━━━━━━━━\n✍️ **Ejemplos:**');
  output = output.replace(/^Desglose de Kanjis:/mi, '\n━━━━━━━━━━━━━━\n🈶 **Desglose de Kanjis:**');
  output = output.replace(/^Dato Curioso:/mi, '\n━━━━━━━━━━━━━━\n💡 **Dato Curioso:**');
  output = output.replace(/^([A-ZÁÉÍÓÚÑ][^:\n]{5,80}):(?!\*)/gm, '\n━━━━━━━━━━━━━━\n**$1:**');
  output = output.replace(/^(• )?Kanji (\d+):/gmi, '• **Kanji $2:**');
  output = output.replace(/^(• )?Significado:/gmi, '• **Significado:**');
  output = output.replace(/^(• )?Otras palabras con (.+):/gmi, '• **Otras palabras con $2:**');
  output = output.replace(/^([*-])\s+(.)/gm, '• $2');
  output += '\n━━━━━━━━━━━━━━';

  return output;
}

// Extraer quizzes del texto de la lección
function extractQuizzes(lesson: string): QuizQuestion[] {
  const quizzes: QuizQuestion[] = [];
  const quizMatch = lesson.match(/### Mini Quiz Interactivo[\s\S]*?(?=(---|$))/);
  
  if (!quizMatch) return [];
  
  const quizText = quizMatch[0];
  const questionBlocks = quizText.split(/Pregunta \d+:/);
  
  for (let i = 1; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    
    const questionMatch = block.match(/(.+?)(?=🅰️|◆|A\))/s);
    if (!questionMatch) continue;
    
    const question = questionMatch[1].trim();
    
    const optionMatches = [
      block.match(/(?:🅰️|◆|A\))\s*(.+?)(?=\n|🅱️|◆|B\)|$)/s),
      block.match(/(?:🅱️|◆|B\))\s*(.+?)(?=\n|🅲️|◆|C\)|$)/s),
      block.match(/(?:🅲️|◆|C\))\s*(.+?)(?=\n|🅳️|◆|D\)|$)/s),
      block.match(/(?:🅳️|◆|D\))\s*(.+?)(?=\n|$)/s)
    ];
    
    const options = optionMatches
      .filter(m => m !== null)
      .map(m => m![1].trim().replace(/^[◆*]\s*/, ''));
    
    if (options.length < 2) continue;
    
    let correctIndex = options.length - 1;
    
    for (let j = 0; j < optionMatches.length; j++) {
      if (optionMatches[j] && optionMatches[j]![0].includes('✅')) {
        correctIndex = j;
        break;
      }
    }
    
    quizzes.push({ question, options, correctIndex });
  }
  
  return quizzes;
}

// Extraer kanjis de la sección "Desglose de Kanjis"
function extractKanjis(lesson: string): string[] {
  const kanjis: string[] = [];
  const kanjiMatch = lesson.match(/### Desglose de Kanjis:[\s\S]*?(?=(---|###|$))/);
  
  if (!kanjiMatch) return [];
  
  const kanjiText = kanjiMatch[0];
  const kanjiMatches = kanjiText.matchAll(/Kanji \d+:\s*([一-龯])/g);
  
  for (const match of kanjiMatches) {
    kanjis.push(match[1]);
  }
  
  return kanjis;
}

// Renderizar contenido sin el quiz
const renderMarkdown = (text: string) => {
  const textWithoutQuiz = text.replace(/### Mini Quiz Interactivo[\s\S]*?(?=(---|$))/g, '');
  
  const lines = textWithoutQuiz.trim().split('\n');
  const htmlElements: string[] = [];
  let inList = false;
  
  for (const line of lines) {
    let processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    if (processedLine.startsWith('### ')) {
      htmlElements.push(`<h3>${processedLine.substring(4)}</h3>`);
    } else if (processedLine.startsWith('> ')) {
      htmlElements.push(`<blockquote>${processedLine.substring(2)}</blockquote>`);
    } else if (processedLine.trim() === '---') {
      htmlElements.push('<hr>');
    } else if (processedLine.startsWith('* ')) {
      if (!inList) {
        htmlElements.push('<ul>');
        inList = true;
      }
      htmlElements.push(`<li>${processedLine.substring(2)}</li>`);
    } else {
      if (inList) {
        htmlElements.push('</ul>');
        inList = false;
      }
      if (processedLine.trim()) {
        htmlElements.push(`<p>${processedLine}</p>`);
      } else {
        htmlElements.push('<br>');
      }
    }
  }
  
  if (inList) htmlElements.push('</ul>');
  
  return { __html: htmlElements.join('') };
};

// Componente de Quiz Interactivo
const InteractiveQuiz: React.FC<{ quizzes: QuizQuestion[] }> = ({ quizzes }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    Array(quizzes.length).fill(null)
  );
  const [showResults, setShowResults] = useState<boolean[]>(
    Array(quizzes.length).fill(false)
  );

  const handleOptionClick = (quizIndex: number, optionIndex: number) => {
    const newSelected = [...selectedAnswers];
    newSelected[quizIndex] = optionIndex;
    setSelectedAnswers(newSelected);
    
    const newShowResults = [...showResults];
    newShowResults[quizIndex] = true;
    setShowResults(newShowResults);
  };

  if (quizzes.length === 0) return null;

  return (
    <div className="quiz-interactive-container">
      <h3 className="quiz-interactive-title">🎯 Mini Quiz Interactivo</h3>
      
      {quizzes.map((quiz, quizIndex) => {
        const selected = selectedAnswers[quizIndex];
        const showResult = showResults[quizIndex];
        const isCorrect = selected === quiz.correctIndex;
        
        return (
          <div key={quizIndex} className="quiz-question-card">
            <div className="quiz-question-text">
              <strong>Pregunta {quizIndex + 1}:</strong> {quiz.question}
            </div>
            
            <div className="quiz-options-grid">
              {quiz.options.map((option, optIndex) => {
                const isSelected = selected === optIndex;
                const isCorrectOption = optIndex === quiz.correctIndex;
                
                let className = 'quiz-option-interactive';
                
                if (showResult) {
                  if (isSelected && isCorrect) className += ' correct';
                  else if (isSelected && !isCorrect) className += ' incorrect';
                  else if (isCorrectOption) className += ' show-correct';
                }
                
                return (
                  <button
                    key={optIndex}
                    onClick={() => handleOptionClick(quizIndex, optIndex)}
                    className={className}
                    disabled={showResult}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + optIndex)}</span>
                    <span className="option-text">{option}</span>
                    {showResult && isCorrectOption && <span className="checkmark">✓</span>}
                    {showResult && isSelected && !isCorrect && <span className="crossmark">✗</span>}
                  </button>
                );
              })}
            </div>
            
            {showResult && (
              <div className={`quiz-result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? '🎉 ¡Correcto! ¡Bien hecho!' : '❌ Incorrecto. La respuesta correcta está marcada arriba.'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ========== COMPONENTE PRINCIPAL ==========
const LessonDisplay: React.FC<LessonDisplayProps> = ({ lesson, sources, loadingState }) => {
  const [copied, setCopied] = useState(false);
  const [copiedTelegram, setCopiedTelegram] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const quizzes = extractQuizzes(lesson);
  const kanjis = extractKanjis(lesson);

  const handleAudio = () => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      const textoLimpio = lesson
        .replace(/[━📕📖✍️🈶💡]/g, '')
        .replace(/[-]{10,}/g, '')
        .replace(/\*\*/g, '')
        .replace(/###/g, '')
        .trim();

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textoLimpio);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsPaused(false);
      } else {
        alert('Tu navegador no soporta síntesis de voz. Prueba con Chrome o Edge.');
      }
    }
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (loadingState === LoadingState.GENERATING_TEXT) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-600 mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Generando tu lección de japonés...</h3>
          <p className="text-gray-600 dark:text-gray-400">Esto puede tardar unos segundos. ¡Gracias por tu paciencia!</p>
        </div>
      </Card>
    );
  }

  if (!lesson) {
    return (
      <Card>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">Tu lección aparecerá aquí cuando se genere.</p>
      </Card>
    );
  }

  return (
    <Card>
      <style>{`
        /* Estilos del Quiz Interactivo */
        .quiz-interactive-container {
          margin: 2rem 0;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .quiz-interactive-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          text-align: center;
          margin-bottom: 2rem;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .quiz-question-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .dark .quiz-question-card {
          background: #2d3748;
        }
        
        .quiz-question-text {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: #1f2937 !important;
          font-weight: 600;
        }
        
        .dark .quiz-question-text {
          color: #f3f4f6 !important;
        }
        
        .quiz-options-grid {
          display: grid;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        
        .quiz-option-interactive {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          position: relative;
        }
        
        .dark .quiz-option-interactive {
          background: #374151;
          border-color: #4b5563;
        }
        
        .quiz-option-interactive:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-color: #667eea;
        }
        
        .quiz-option-interactive:disabled {
          cursor: not-allowed;
        }
        
        .option-letter {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 700;
          border-radius: 50%;
          font-size: 0.9rem;
        }
        
        .option-text {
          flex: 1;
          color: #1f2937 !important;
          font-size: 1rem;
          font-weight: 500;
        }
        
        .dark .option-text {
          color: #f3f4f6 !important;
        }
        
        .checkmark, .crossmark {
          position: absolute;
          right: 1rem;
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .checkmark {
          color: #10b981;
        }
        
        .crossmark {
          color: #ef4444;
        }
        
        .quiz-option-interactive.correct {
          background: rgba(16, 185, 129, 0.15);
          border-color: #10b981;
          border-width: 3px;
        }
        
        .quiz-option-interactive.incorrect {
          background: rgba(239, 68, 68, 0.15);
          border-color: #ef4444;
          border-width: 3px;
        }
        
        .quiz-option-interactive.show-correct {
          background: rgba(16, 185, 129, 0.1);
          border-color: #10b981;
        }
        
        .quiz-result-message {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
        }
        
        .quiz-result-message.correct {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .quiz-result-message.incorrect {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        /* Sección de animaciones de Kanjis */
        .kanji-animations-section {
          margin: 3rem 0 2rem 0;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          border-radius: 16px;
        }

        .kanji-section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-text);
          text-align: center;
          margin-bottom: 2rem;
        }

        .kanji-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2rem;
          justify-items: center;
        }

        @media (max-width: 768px) {
          .kanji-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(lesson)} />
      
      <InteractiveQuiz quizzes={quizzes} />

      {kanjis.length > 0 && (
        <div className="kanji-animations-section">
          <h3 className="kanji-section-title">📝 Orden de Trazos de Kanjis</h3>
          <div className="kanji-grid">
            {kanjis.map((kanji, index) => (
              <KanjiStrokeAnimation 
                key={index} 
                kanji={kanji} 
                size={180}
                strokeColor="#667eea"
                autoPlay={false}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-700 flex flex-col items-center gap-3">
        <button
          onClick={() => {
            navigator.clipboard.writeText(lesson);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="px-6 py-3 rounded-md font-medium flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white transition-colors w-full max-w-md"
        >
          {copied ? "¡Copiado!" : "Copiar Lección"}
        </button>

        <button
          onClick={() => {
            const telegramText = convertirLeccionATelegram(lesson);
            navigator.clipboard.writeText(telegramText);
            setCopiedTelegram(true);
            setTimeout(() => setCopiedTelegram(false), 1200);
          }}
          className="px-6 py-3 rounded-md font-medium flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors w-full max-w-md"
        >
          {copiedTelegram ? "¡Copiado para Telegram!" : "Copiar para Telegram"}
        </button>

        <div className="flex gap-2 w-full max-w-md">
          <button
            onClick={handleAudio}
            className={`flex-1 px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 ${
              isPaused 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : isPlaying 
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-green-500 hover:bg-green-600'
            } text-white transition-colors`}
          >
            {isPaused ? "▶️ Reanudar" : isPlaying ? "⏸️ Pausar" : "🔊 Escuchar"}
          </button>
          
          {(isPlaying || isPaused) && (
            <button
              onClick={stopAudio}
              className="flex-1 px-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              ⏹️ Detener
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LessonDisplay;
