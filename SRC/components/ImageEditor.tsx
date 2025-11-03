
import React, { useState, useCallback, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/file';
import Card from './common/Card';
import { SparklesIcon } from './icons/SparklesIcon';

const ImageEditor: React.FC = () => {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
    const [editedImageUrl, setEditedImageUrl] = useState<string>('');
    const [prompt, setPrompt] = useState<string>('Add a retro, vintage filter.');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setEditedImageUrl('');
            setError('');
        }
    };

    const handleEdit = useCallback(async () => {
        if (!originalFile) {
            setError('Please upload an image first.');
            return;
        }
        if (!prompt.trim()) {
            setError('Please enter an editing prompt.');
            return;
        }

        setLoading(true);
        setError('');
        setEditedImageUrl('');

        try {
            const base64Image = await fileToBase64(originalFile);
            const mimeType = originalFile.type;
            const url = await editImage(base64Image, mimeType, prompt);
            setEditedImageUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [originalFile, prompt]);

    return (
        <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">AI Image Editor</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Upload an image and describe your desired changes. From adding objects to changing styles, Gemini can help.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    {originalImageUrl ? (
                        <img src={originalImageUrl} alt="Original" className="max-h-64 rounded-md shadow-md" />
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="mt-2">Upload an image to start</p>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        {originalImageUrl ? 'Change Image' : 'Select Image'}
                    </button>
                </div>

                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    {loading ? (
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
                    ) : editedImageUrl ? (
                        <img src={editedImageUrl} alt="Edited" className="max-h-64 rounded-md shadow-md" />
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                           <SparklesIcon className="mx-auto h-12 w-12" />
                            <p className="mt-2">Your edited image will appear here</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Make the sky look like a vibrant sunset"
                    className="w-full h-24 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    disabled={loading}
                />
                <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-center px-6 py-3 bg-violet-600 text-white font-semibold rounded-md shadow-md hover:bg-violet-700 disabled:bg-violet-400 disabled:cursor-not-allowed transition-colors"
                    disabled={loading || !originalFile}
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {loading ? 'Editing...' : 'Apply Edit'}
                </button>
            </div>
            {error && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
        </Card>
    );
};

export default ImageEditor;
