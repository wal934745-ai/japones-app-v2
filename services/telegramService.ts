// services/telegramService.ts

interface QuizData {
  question: string;
  options: string[];
  correct_option_id: number;
  explanation?: string;
}

interface TelegramResponse {
  status: string;
  message?: string;
  result?: any;
}

const TELEGRAM_BOT_URL = 'https://instable-briggs-vocalic.ngrok-free.dev';

export const sendQuizToTelegram = async (quiz: QuizData): Promise<TelegramResponse> => {
  try {
    const response = await fetch(`${TELEGRAM_BOT_URL}/send-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error sending quiz to Telegram:', error);
    throw error;
  }
};

export const testBotConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${TELEGRAM_BOT_URL}/test`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Bot connection failed:', error);
    return false;
  }
};

// ========== FUNCIÓN ORIGINAL (1 quiz) ==========
export const extractQuizFromLesson = (lesson: string): QuizData | null => {
  try {
    const quizMatch = lesson.match(/### Mini Quiz Interactivo[\s\S]*?(?=(---|$))/);
    if (!quizMatch) {
      console.error('No se encontró sección "Mini Quiz Interactivo"');
      return null;
    }

    const quizText = quizMatch[0];
    const questionBlocks = quizText.split(/Pregunta \d+:/);
    
    if (questionBlocks.length < 2) return null;
    
    const block = questionBlocks[1];
    const questionMatch = block.match(/(.+?)(?=🅰️)/s);
    if (!questionMatch) return null;
    
    const question = questionMatch[1].trim();
    
    const optionA = block.match(/🅰️\s*(.+?)(?=\n|🅱️|$)/s);
    const optionB = block.match(/🅱️\s*(.+?)(?=\n|🅲️|$)/s);
    const optionC = block.match(/🅲️\s*(.+?)(?=\n|🅳️|$)/s);
    const optionD = block.match(/🅳️\s*(.+?)(?=\n|$)/s);

    if (!optionA || !optionB || !optionC || !optionD) {
      console.error('No se pudieron extraer las 4 opciones');
      return null;
    }

    const options = [
      optionA[1].trim(),
      optionB[1].trim(),
      optionC[1].trim(),
      optionD[1].trim()
    ];

    return {
      question: question,
      options: options,
      correct_option_id: 3, // Por defecto opción D
      explanation: `✅ ¡Correcto!`
    };
  } catch (error) {
    console.error('Error extrayendo quiz:', error);
    return null;
  }
};

// ========== NUEVA FUNCIÓN (3 quizzes) ==========
export const extractMultipleQuizzesFromLesson = (lesson: string): QuizData[] => {
  const quizzes: QuizData[] = [];

  try {
    // Buscar la sección completa del Mini Quiz
    const quizMatch = lesson.match(/### Mini Quiz Interactivo[\s\S]*?(?=(---|$))/);
    if (!quizMatch) {
      console.error('No se encontró sección "Mini Quiz Interactivo"');
      return [];
    }

    const quizText = quizMatch[0];
    
    // Dividir por "Pregunta 1:", "Pregunta 2:", "Pregunta 3:"
    const questionBlocks = quizText.split(/Pregunta \d+:/);
    
    // questionBlocks[0] = texto antes de "Pregunta 1:"
    // questionBlocks[1] = contenido de Pregunta 1
    // questionBlocks[2] = contenido de Pregunta 2
    // questionBlocks[3] = contenido de Pregunta 3
    
    console.log(`📋 Bloques encontrados: ${questionBlocks.length - 1}`);

    // Procesar hasta 3 preguntas (índices 1, 2, 3)
    for (let i = 1; i <= Math.min(3, questionBlocks.length - 1); i++) {
      const block = questionBlocks[i];
      
      // Extraer pregunta (texto antes del primer emoji)
      const questionMatch = block.match(/(.+?)(?=🅰️)/s);
      if (!questionMatch) {
        console.warn(`⚠️ No se pudo extraer la pregunta ${i}`);
        continue;
      }
      
      const question = questionMatch[1].trim();
      
      // Extraer opciones
      const optionA = block.match(/🅰️\s*(.+?)(?=\n|🅱️|$)/s);
      const optionB = block.match(/🅱️\s*(.+?)(?=\n|🅲️|$)/s);
      const optionC = block.match(/🅲️\s*(.+?)(?=\n|🅳️|$)/s);
      const optionD = block.match(/🅳️\s*(.+?)(?=\n|$)/s);

      if (!optionA || !optionB || !optionC || !optionD) {
        console.warn(`⚠️ Opciones incompletas en pregunta ${i}`);
        continue;
      }

      const options = [
        optionA[1].trim(),
        optionB[1].trim(),
        optionC[1].trim(),
        optionD[1].trim()
      ];

      // Extraer respuesta correcta (buscar "✅" o "Respuesta correcta:")
      let correctIndex = 3; // Por defecto D
      
      const correctMatch = block.match(/✅\s*([🅰️🅱️🅲️🅳️])/);
      if (correctMatch) {
        const correctEmoji = correctMatch[1];
        if (correctEmoji === '🅰️') correctIndex = 0;
        else if (correctEmoji === '🅱️') correctIndex = 1;
        else if (correctEmoji === '🅲️') correctIndex = 2;
        else if (correctEmoji === '🅳️') correctIndex = 3;
      }

      quizzes.push({
        question: question,
        options: options,
        correct_option_id: correctIndex,
        explanation: `✅ ¡Correcto! Pregunta ${i} de 3`
      });

      console.log(`✅ Quiz ${i} extraído exitosamente`);
    }

  } catch (error) {
    console.error('❌ Error extrayendo quizzes:', error);
  }

  console.log(`📊 Total de quizzes extraídos: ${quizzes.length}`);
  return quizzes;
};
