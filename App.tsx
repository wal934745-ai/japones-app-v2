import React, { useState, useCallback } from 'react';
import LessonDisplay from './components/LessonDisplay';
import ImagePrompts from './components/ImagePrompts';
import TabButton from './components/common/TabButton';
import Card from './components/common/Card';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { XIcon } from './components/icons/XIcon';
import { LoadingState, GroundingChunk } from './types';
import { generateLesson } from './services/geminiService';
import TelegramQuizButton from './components/TelegramQuizButton';

type Tab = 'lesson' | 'prompts';
type LessonMode = 'detailed' | 'summary';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('lesson');
  const [lessonMode, setLessonMode] = useState<LessonMode>('detailed');
  
  const [word, setWord] = useState('');
  const [lesson, setLesson] = useState('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [loadingState, setLoadingState] = useState(LoadingState.IDLE);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!word.trim()) {
      setError('Por favor, introduce una palabra en japonés.');
      return;
    }
    setError('');
    setLesson('');
    setPrompts([]);
    setSources([]);
    setLoadingState(LoadingState.GENERATING_TEXT);
    setActiveTab('lesson');

    try {
      const { lesson: lessonText, prompts: imagePrompts, sources: groundingSources } = await generateLesson(word, lessonMode);
      setLesson(lessonText);
      setPrompts(imagePrompts);
      setSources(groundingSources);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
      setLoadingState(LoadingState.ERROR);
    }
  }, [word, lessonMode]);

  const handleClear = useCallback(() => {
    setWord('');
    setLesson('');
    setPrompts([]);
    setSources([]);
    setLoadingState(LoadingState.IDLE);
    setError('');
  }, []);

  const isLoading = loadingState === LoadingState.GENERATING_TEXT;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-2 text-violet-600 dark:text-violet-400">
          Nihongo Sensei AI
        </h1>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">Generador de Lecciones de Japonés</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Introduce una palabra en japonés para obtener una lección divertida y memorable, además de prompts listos para usar en DALL-E 3 o tu generador de imágenes favorito.
          </p>

          {/* Selector de modo de lección */}
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Tipo de lección:</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lessonMode"
                  value="detailed"
                  checked={lessonMode === 'detailed'}
                  onChange={() => setLessonMode('detailed')}
                  disabled={isLoading}
                  className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm">📖 Versión Detallada</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lessonMode"
                  value="summary"
                  checked={lessonMode === 'summary'}
                  onChange={() => setLessonMode('summary')}
                  disabled={isLoading}
                  className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm">⚡ Versión Resumida</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
              placeholder="ej. 猫 (neko), 挨拶 (aisatsu)"
              className="flex-grow w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={isLoading}
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors flex items-center gap-2"
            >
              <SparklesIcon />
              Generar Lección
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors flex items-center gap-2"
              title="Limpiar todo"
            >
              <XIcon />
              Limpiar
            </button>
          </div>

          {error && <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>}
        </Card>

        {loadingState !== LoadingState.IDLE && (
          <div className="mt-6">
            <div className="flex gap-2 mb-4">
              <TabButton active={activeTab === 'lesson'} onClick={() => setActiveTab('lesson')}>
                Lección
              </TabButton>
              <TabButton active={activeTab === 'prompts'} onClick={() => setActiveTab('prompts')}>
                Prompts de Imagen
              </TabButton>
            </div>

            {activeTab === 'lesson' && (
              <>
                <LessonDisplay lesson={lesson} sources={sources} loadingState={loadingState} />
                <TelegramQuizButton lesson={lesson} />
              </>
            )}
            {activeTab === 'prompts' && <ImagePrompts prompts={prompts} loadingState={loadingState} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
