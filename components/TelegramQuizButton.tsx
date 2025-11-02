// components/TelegramQuizButton.tsx

import { useState } from 'react';
import { sendQuizToTelegram, extractMultipleQuizzesFromLesson } from '@/services/telegramService';

const TelegramQuizButton = ({ lesson }: { lesson: string }) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendQuiz = async () => {
    if (!lesson) {
      setMessage('❌ No hay lección para enviar');
      return;
    }

    setSending(true);
    setMessage('⏳ Extrayendo quizzes de la lección...');

    try {
      const quizzes = extractMultipleQuizzesFromLesson(lesson);

      if (quizzes.length === 0) {
        setMessage('❌ No se pudieron extraer quizzes de esta lección');
        setSending(false);
        return;
      }

      setMessage(`📤 Enviando ${quizzes.length} quizzes al grupo...`);

      // Envía cada quiz con un pequeño delay
      for (let i = 0; i < quizzes.length; i++) {
        await sendQuizToTelegram(quizzes[i]);
        
        // Espera 2 segundos entre cada quiz (excepto el último)
        if (i < quizzes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 6000));
        }
      }

      setMessage(`✅ ${quizzes.length} quizzes enviados al grupo "日本語 Japanese Study"!`);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error de conexión'}`);
    } finally {
      setSending(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (!lesson) return null;

  return (
    <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border-2 border-blue-200 dark:border-blue-900">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            📋 Enviar Quiz a Telegram
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Comparte esta lección con tu grupo de estudio
          </p>
        </div>

        <button
          onClick={handleSendQuiz}
          disabled={sending}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <span className="inline-block animate-spin">⏳</span>
              Enviando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>📤</span>
              Enviar 3 Quizzes al Grupo
            </span>
          )}
        </button>

        {message && (
          <div
            className={`px-4 py-3 rounded-lg font-medium text-center ${
              message.startsWith('✅')
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : message.startsWith('⏳') || message.startsWith('📤')
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>📍 Grupo: "日本語 Japanese Study"</p>
          <p>🤖 Bot: @examen_jap_bot</p>
        </div>
      </div>
    </div>
  );
};

export default TelegramQuizButton;
