
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { connectLive } from '../services/geminiService';
import { decode, decodeAudioData, encode } from '../utils/audio';
import { MicIcon } from './icons/MicIcon';
import { StopIcon } from './icons/StopIcon';
import { LiveServerMessage, Blob } from '@google/genai';
import Card from './common/Card';

// Define a local LiveSession interface to match the expected session object structure
interface LiveSession {
    close: () => void;
    sendRealtimeInput: (input: { media: Blob }) => void;
}

const LiveChat: React.FC = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [status, setStatus] = useState('Idle. Press Start to talk.');
    const [error, setError] = useState<string>('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                session.close();
            });
            sessionPromiseRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsSessionActive(false);
        setStatus('Session ended. Press Start to talk again.');
    }, []);

    const startSession = useCallback(async () => {
        setError('');
        setStatus('Initializing session...');
        setIsSessionActive(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = connectLive({
                onopen: () => {
                    setStatus('Connection open. You can start speaking now.');
                    const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        
                        if (sessionPromiseRef.current) {
                             sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        setStatus('Receiving response...');
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                        const source = outputAudioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContextRef.current.destination);
                        source.addEventListener('ended', () => {
                            sourcesRef.current.delete(source);
                            if (sourcesRef.current.size === 0) {
                                setStatus('Ready for your next question.');
                            }
                        });
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                    if (message.serverContent?.interrupted) {
                         sourcesRef.current.forEach(source => source.stop());
                         sourcesRef.current.clear();
                         nextStartTimeRef.current = 0;
                         setStatus('Interrupted. Ready for input.');
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setError('A connection error occurred.');
                    stopSession();
                },
                onclose: () => {
                    stopSession();
                },
            });

        } catch (err) {
            console.error('Error starting session:', err);
            setError(err instanceof Error ? err.message : 'Failed to get microphone access.');
            stopSession();
        }
    }, [stopSession]);
    
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);


    return (
        <Card className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Live Conversation with AI</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Have a real-time voice chat with a Japanese language tutor. Ask questions, practice pronunciation, and get instant feedback.</p>
            
            <div className="flex justify-center items-center my-8">
                <div className={`relative w-32 h-32 flex items-center justify-center rounded-full ${isSessionActive ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-200 dark:bg-gray-700'}`}>
                   {isSessionActive && <div className="absolute inset-0 rounded-full bg-green-400 animate-ping"></div>}
                    <button
                        onClick={isSessionActive ? stopSession : startSession}
                        className={`z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform hover:scale-105 ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-700'}`}
                    >
                        {isSessionActive ? <StopIcon className="w-10 h-10" /> : <MicIcon className="w-10 h-10" />}
                    </button>
                </div>
            </div>

            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 min-h-[2.25rem]">{status}</p>
            {error && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
        </Card>
    );
};

export default LiveChat;
