import React, { useState } from 'react';
import { LoadingState } from '../types';
import Card from './common/Card';

interface ImagePromptsProps {
    prompts: string[];
    loadingState: LoadingState;
}

const ImagePrompts: React.FC<ImagePromptsProps> = ({ prompts, loadingState }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (loadingState === LoadingState.GENERATING_TEXT) {
         return (
            <Card className="p-6 text-center">
                <p className="text-lg text-gray-600 dark:text-gray-300">Esperando a que termine de generarse la lección...</p>
            </Card>
        );
    }

    if (prompts.length === 0) {
        return (
             <Card className="p-6 text-center">
                 <p className="text-lg text-gray-600 dark:text-gray-300">Los prompts para las imágenes aparecerán aquí cuando se genere una lección.</p>
             </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="p-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Prompts para Imágenes</h2>
                 <p className="text-gray-600 dark:text-gray-300 mb-6">Copia estos prompts y pégalos en tu generador de imágenes IA favorito (ej. DALL-E 3, Midjourney).</p>
            </Card>

            {prompts.map((prompt, index) => (
                <Card key={index} className="p-6">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-3">
                        {index === 0 && "1. Prompt: Contexto Real"}
                        {index === 1 && "2. Prompt: Desglose de Kanjis"}
                        {index === 2 && "3. Prompt: Ficha de Estudio Visual"}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 font-mono bg-gray-100 dark:bg-gray-700 p-3 rounded-md">{prompt}</p>
                    <button 
                        onClick={() => handleCopy(prompt, index)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors w-28 text-center"
                    >
                        {copiedIndex === index ? '¡Copiado!' : 'Copiar'}
                    </button>
                </Card>
            ))}
        </div>
    );
};

export default ImagePrompts;
