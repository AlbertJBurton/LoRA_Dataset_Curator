import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AnnotationType, ImageFile, ImageResult, ImageStatus, GeminiModel } from './types';
import { getScoreAndReason, getAnnotation, validateApiKey, validateLmStudioServer } from './services/geminiService';

//============== ICONS ==============//
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21 21H3" />
    </svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ExclamationCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
     <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
);


//============== UI COMPONENTS ==============//
const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ApiStatusIndicator: React.FC<{ isLoading: boolean; isValid: boolean | null; source: 'env' | 'user' | null; model: GeminiModel; lmStudioModels: string[] }> = ({ isLoading, isValid, source, model, lmStudioModels }) => {
    const isLmStudio = model === GeminiModel.LMStudio;
    
    if (isLoading) {
        const message = isLmStudio ? "Validating LM Studio Connection..." : "Validating API Key...";
        return <div className="flex items-center text-sm text-yellow-400 mt-2"><Spinner /> <span className="ml-2">{message}</span></div>;
    }
    if (isValid) {
        if (isLmStudio) {
            const firstModel = lmStudioModels.length > 0 ? lmStudioModels[0] : null;
            const modelsText = firstModel ? `Loaded Model: ${firstModel}` : 'No models loaded.';
            const message = `LM Studio Connection Successful. ${modelsText}`;
            return <div className="flex items-start text-sm text-green-400 mt-2"><CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" /> <span>{message}</span></div>;
        }
        const message = "API Connection Successful";
        return <div className="flex items-center text-sm text-green-400 mt-2"><CheckCircleIcon className="h-5 w-5 mr-2" /> {message}</div>;
    }
    if (isValid === false) {
        if (isLmStudio) {
            return <div className="flex items-center text-sm text-red-400 mt-2"><XCircleIcon className="h-5 w-5 mr-2" /> LM Studio connection failed. Please check URL and ensure server is running.</div>;
        }
        if (source === 'env') {
            return <div className="flex items-center text-sm text-red-400 mt-2"><XCircleIcon className="h-5 w-5 mr-2" /> Invalid API key in environment. Please enter a valid key below.</div>;
        }
        if (source === 'user') {
             return <div className="flex items-center text-sm text-red-400 mt-2"><XCircleIcon className="h-5 w-5 mr-2" /> Invalid API Key. Please check and re-enter.</div>;
        }
    }
    return null;
};

const RubricGuide: React.FC = () => (
    <div className="mt-3 text-xs text-gray-400 space-y-1 bg-gray-900/50 p-3 rounded-md border border-gray-700">
        <p><strong className="text-gray-300">1.0:</strong> - Excellent, clear subject</p>
        <p><strong className="text-gray-300">0.8:</strong> - Good, minor issues</p>
        <p><strong className="text-gray-300">0.6:</strong> - Average, usable but busy</p>
        <p><strong className="text-gray-300">0.4:</strong> - Mediocre, occluded/poor quality</p>
        <p><strong className="text-gray-300">0.0:</strong> - Bad, concept not present</p>
    </div>
);


interface SettingsPanelProps {
    apiKey: string;
    setApiKey: (value: string) => void;
    concept: string;
    setConcept: (value: string) => void;
    annotationType: AnnotationType;
    setAnnotationType: (value: AnnotationType) => void;
    geminiModel: GeminiModel;
    setGeminiModel: (value: GeminiModel) => void;
    lmStudioUrl: string;
    setLmStudioUrl: (value: string) => void;
    threshold: number;
    setThreshold: (value: number) => void;
    onAnalyze: () => void;
    isLoading: boolean;
    canAnalyze: boolean;
    apiKeySource: 'env' | 'user' | null;
    isApiValid: boolean | null;
    isApiLoading: boolean;
    lmStudioModels: string[];
}

const AVAILABLE_MODELS = [
    { id: GeminiModel.GeminiFlash, name: 'Gemini 2.5 Flash' },
    { id: GeminiModel.GeminiPro, name: 'Gemini 2.5 Pro' },
    { id: GeminiModel.LMStudio, name: 'LM Studio' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ apiKey, setApiKey, concept, setConcept, annotationType, setAnnotationType, geminiModel, setGeminiModel, lmStudioUrl, setLmStudioUrl, threshold, setThreshold, onAnalyze, isLoading, canAnalyze, apiKeySource, isApiValid, isApiLoading, lmStudioModels }) => (
    <div className="flex flex-col h-full">
        <div className="flex-grow space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">LoRA Dataset Curator</h1>
                <p className="text-sm text-gray-400 mt-1">Curate and tag your LoRA training images with AI.</p>
                <ApiStatusIndicator isLoading={isApiLoading} isValid={isApiValid} source={apiKeySource} model={geminiModel} lmStudioModels={lmStudioModels} />
            </div>
            <div className="space-y-6">
                 {apiKeySource === 'user' && geminiModel !== GeminiModel.LMStudio && (
                     <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key</label>
                        <input
                            type="password"
                            id="api-key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Gemini API key..."
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-md shadow-sm px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            autoComplete="off"
                        />
                    </div>
                )}
                 <div>
                    <label htmlFor="concept" className="block text-sm font-medium text-gray-300 mb-2">Define Your Concept</label>
                    <input
                        type="text"
                        id="concept"
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        placeholder="e.g., 'vintage school bus'"
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-md shadow-sm px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                </div>
                <div>
                    <label htmlFor="model-select" className="block text-sm font-medium text-gray-300 mb-2">Select Model</label>
                    <div className="relative">
                        <select
                            id="model-select"
                            value={geminiModel}
                            onChange={(e) => setGeminiModel(e.target.value as GeminiModel)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-md shadow-sm pl-4 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition appearance-none"
                        >
                            {AVAILABLE_MODELS.map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                           <ChevronDownIcon className="h-5 w-5"/>
                        </div>
                    </div>
                </div>

                {geminiModel === GeminiModel.LMStudio && (
                    <div>
                        <label htmlFor="lm-studio-url" className="block text-sm font-medium text-gray-300 mb-2">LM Studio Server URL</label>
                        <input
                            type="text"
                            id="lm-studio-url"
                            value={lmStudioUrl}
                            onChange={(e) => setLmStudioUrl(e.target.value)}
                            placeholder="http://localhost:1234"
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-md shadow-sm px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Annotation Type</label>
                    <div className="flex space-x-4">
                        {(Object.values(AnnotationType)).map((key) => (
                            <button
                                key={key}
                                onClick={() => setAnnotationType(key)}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition ${annotationType === key ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="threshold" className="block text-sm font-medium text-gray-300 mb-2">Set Acceptance Score</label>
                    <div className="flex items-center space-x-4">
                        <input
                            id="threshold"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={threshold}
                            onChange={(e) => setThreshold(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className="bg-gray-700 text-white text-sm font-mono py-1 px-3 rounded-md min-w-[50px] text-center">{threshold.toFixed(2)}</span>
                    </div>
                    <RubricGuide />
                </div>
            </div>
        </div>
        <div className="mt-8">
            <button
                onClick={onAnalyze}
                disabled={!canAnalyze || isLoading}
                className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
                {isLoading ? <Spinner /> : 'Analyze Images'}
            </button>
        </div>
    </div>
);

interface ImageUploadProps {
    onFilesSelected: (files: File[]) => void;
}
const ImageUpload: React.FC<ImageUploadProps> = ({ onFilesSelected }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onFilesSelected(Array.from(e.target.files));
        }
    };

    const handleDragEvent = (e: React.DragEvent<HTMLDivElement>, entering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(entering);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };

    return (
        <div 
            onDragEnter={(e) => handleDragEvent(e, true)}
            onDragLeave={(e) => handleDragEvent(e, false)}
            onDragOver={(e) => handleDragEvent(e, true)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center bg-white/5 transition-colors duration-300 ${isDragging ? 'border-indigo-400 bg-indigo-500/20' : 'border-gray-600 hover:bg-white/10'}`}>
            <label htmlFor="file-upload" className="cursor-pointer">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-300">
                    <span className="font-semibold text-indigo-400">Upload your images</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">JPG, PNG, WEBP supported</p>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            </label>
        </div>
    );
};

interface ImageCardProps {
    result: ImageResult;
}
const ImageCard: React.FC<ImageCardProps> = ({ result }) => {
    const isRejected = result.status === ImageStatus.Rejected || result.status === ImageStatus.Error;
    const getStatusInfo = () => {
        switch (result.status) {
            case ImageStatus.Accepted:
                return {
                    Icon: CheckCircleIcon,
                    color: "text-green-400",
                    bgColor: "bg-green-500/10",
                    borderColor: "border-green-500/50",
                    label: "Accepted"
                };
            case ImageStatus.Rejected:
                return {
                    Icon: XCircleIcon,
                    color: "text-red-400",
                    bgColor: "bg-red-500/10",
                    borderColor: "border-red-500/50",
                    label: "Rejected"
                };
            case ImageStatus.Error:
                 return {
                    Icon: ExclamationCircleIcon,
                    color: "text-yellow-400",
                    bgColor: "bg-yellow-500/10",
                    borderColor: "border-yellow-500/50",
                    label: "Error"
                };
            default:
                return { Icon: null, color: "", bgColor: "", label: "" };
        }
    };
    const { Icon, color, bgColor, borderColor, label } = getStatusInfo();

    return (
        <div className={`group relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 ${isRejected ? 'opacity-40' : ''} ${bgColor} border ${borderColor}`}>
            <img src={result.dataUrl} alt={result.file.name} className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/70 transition-all duration-300 p-4 flex flex-col justify-end">
                <div className="text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                    <div className="flex items-center justify-between">
                         {Icon && <Icon className={`h-6 w-6 ${color}`} />}
                        <span className="font-mono text-lg">{result.score?.toFixed(2)}</span>
                    </div>
                    <p className="text-xs font-semibold mt-2 uppercase tracking-wider">{label}</p>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-3">
                        {result.status === ImageStatus.Accepted ? result.annotation : result.reason}
                    </p>
                </div>
            </div>
        </div>
    );
};

interface ResultsDisplayProps {
    results: ImageResult[];
    onDownload: () => void;
    isLoading: boolean;
    onStop: () => void;
    progressMessage: string;
    onClearImages: () => void;
}
const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onDownload, isLoading, onStop, progressMessage, onClearImages }) => {
    const acceptedCount = useMemo(() => results.filter(r => r.status === ImageStatus.Accepted).length, [results]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Spinner />
                <p className="mt-4 text-lg font-semibold">Processing Images...</p>
                <p className="text-gray-400 mb-4">{progressMessage}</p>
                 <button
                    onClick={onStop}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
                >
                    Stop Processing
                </button>
            </div>
        );
    }

    if (results.length === 0) {
        return <div className="text-center text-gray-500 py-10">Results will be displayed here after analysis.</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Analysis Results</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onClearImages}
                        className="text-sm bg-red-500/20 hover:bg-red-500/40 text-red-300 font-semibold px-3 py-1 rounded-md transition">
                        Clear Images
                    </button>
                    <button
                        onClick={onDownload}
                        disabled={acceptedCount === 0}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
                    >
                        <DownloadIcon className="h-5 w-5" />
                        <span>Download Accepted ({acceptedCount})</span>
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {results.map(result => <ImageCard key={result.id} result={result} />)}
                </div>
            </div>
        </div>
    );
};

//============== MAIN APP COMPONENT ==============//
function App() {
    const [apiKey, setApiKey] = useState<string>('');
    const [concept, setConcept] = useState<string>('');
    const [annotationType, setAnnotationType] = useState<AnnotationType>(AnnotationType.Caption);
    const [geminiModel, setGeminiModel] = useState<GeminiModel>(GeminiModel.GeminiFlash);
    const [lmStudioUrl, setLmStudioUrl] = useState<string>('http://localhost:1234');
    const [threshold, setThreshold] = useState<number>(0.80);
    const [images, setImages] = useState<ImageFile[]>([]);
    const [results, setResults] = useState<ImageResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isStopping, setIsStopping] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>('');
    
    const [apiKeySource, setApiKeySource] = useState<'env' | 'user' | null>(null);
    const [isApiValid, setIsApiValid] = useState<boolean | null>(null);
    const [isApiLoading, setIsApiLoading] = useState<boolean>(true);
    const [lmStudioModels, setLmStudioModels] = useState<string[]>([]);

    useEffect(() => {
        // This effect runs once on mount to check for environment-provided keys for Gemini
        const initializeApiKey = async () => {
            if (geminiModel !== GeminiModel.LMStudio) {
                const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
                if (envKey) {
                    setApiKey(envKey);
                    setApiKeySource('env');
                } else {
                    setApiKeySource('user');
                    setIsApiValid(false); // No key in env, so invalid until user provides one
                }
            }
        };
        initializeApiKey();
    }, []);

    useEffect(() => {
        // This effect handles validation whenever the model or relevant credentials change.
        const validateConnection = async () => {
            setIsApiLoading(true);
            setIsApiValid(null);
            setLmStudioModels([]);

            if (geminiModel === GeminiModel.LMStudio) {
                const { isValid, models } = await validateLmStudioServer(lmStudioUrl);
                setIsApiValid(isValid);
                setLmStudioModels(models);
            } else {
                // Handle Gemini validation
                if (apiKeySource === 'env' && apiKey) {
                    const isValid = await validateApiKey(apiKey);
                    setIsApiValid(isValid);
                    if (!isValid) {
                        setApiKeySource('user'); // Fallback to user input if env key is bad
                        setApiKey(''); // Clear the bad key
                    }
                } else if (apiKeySource === 'user' && apiKey.trim()) {
                    const isValid = await validateApiKey(apiKey);
                    setIsApiValid(isValid);
                } else {
                     setIsApiValid(false); // No key to validate
                }
            }
            setIsApiLoading(false);
        };
        
        const handler = setTimeout(validateConnection, 500); // Debounce validation
        return () => clearTimeout(handler);

    }, [apiKey, apiKeySource, geminiModel, lmStudioUrl]);

    const handleFilesSelected = useCallback((files: File[]) => {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const validFiles = files.filter(file => imageMimeTypes.includes(file.type));
        
        const newImageFiles: ImageFile[] = validFiles.map(file => ({
            id: `${file.name}-${file.lastModified}`,
            file,
            dataUrl: URL.createObjectURL(file),
        }));
        setImages(prev => [...prev, ...newImageFiles]);
        setResults([]);
    }, []);
    
    const handleClearImages = () => {
        setImages([]);
        setResults([]);
    };

    const handleAnalyze = async () => {
        if (!canAnalyze) return;
        
        setIsLoading(true);
        setIsStopping(false);
        setResults([]);
        setProgressMessage('Starting analysis...');
        
        const newResults: ImageResult[] = [];

        for (let i = 0; i < images.length; i++) {
            if (isStopping) {
                setProgressMessage('Processing stopped by user.');
                break;
            }
            const image = images[i];
            setProgressMessage(`Scoring image ${i + 1} of ${images.length}: ${image.file.name}`);
            try {
                const { score, reason } = await getScoreAndReason(apiKey, image.file, concept, geminiModel, lmStudioUrl);
                
                if (score >= threshold) {
                    setProgressMessage(`Generating annotation for image ${i + 1} of ${images.length}...`);
                    const annotation = await getAnnotation(apiKey, image.file, concept, annotationType, geminiModel, lmStudioUrl);
                    newResults.push({ ...image, status: ImageStatus.Accepted, score, annotation, reason });
                } else {
                    newResults.push({ ...image, status: ImageStatus.Rejected, score, reason });
                }
            } catch (error) {
                console.error(`Failed to process image ${image.file.name}:`, error);
                newResults.push({ ...image, status: ImageStatus.Error, reason: (error as Error).message || 'API call failed.' });
            }
             setResults([...newResults]); // Update results incrementally
        }

        setIsLoading(false);
        if (!isStopping) {
            setProgressMessage('');
        }
        setIsStopping(false);
    };
    
    const handleStop = () => {
        setIsStopping(true);
    };

    const handleDownload = async () => {
        const acceptedImages = results.filter(r => r.status === ImageStatus.Accepted);
        if (acceptedImages.length === 0) return;
        
        const JSZip = (window as any).JSZip;
        if (!JSZip) {
            alert("JSZip library not found. Cannot create download.");
            return;
        }
        const zip = new JSZip();

        for (const imageResult of acceptedImages) {
            const imageName = imageResult.file.name;
            const txtName = `${imageName.substring(0, imageName.lastIndexOf('.'))}.txt`;
            zip.file(imageName, imageResult.file);
            zip.file(txtName, imageResult.annotation || '');
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lora_dataset.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const canAnalyze = useMemo(() => {
        return !!isApiValid && images.length > 0 && concept.trim().length > 0;
    }, [isApiValid, images.length, concept]);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-gray-900 overflow-hidden">
            <aside className="w-full lg:w-96 flex-shrink-0 bg-gray-800/70 backdrop-blur-sm shadow-2xl p-6 overflow-y-auto">
                <SettingsPanel 
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                    concept={concept}
                    setConcept={setConcept}
                    annotationType={annotationType}
                    setAnnotationType={setAnnotationType}
                    geminiModel={geminiModel}
                    setGeminiModel={setGeminiModel}
                    lmStudioUrl={lmStudioUrl}
                    setLmStudioUrl={setLmStudioUrl}
                    threshold={threshold}
                    setThreshold={setThreshold}
                    onAnalyze={handleAnalyze}
                    isLoading={isLoading}
                    canAnalyze={canAnalyze}
                    apiKeySource={apiKeySource}
                    isApiValid={isApiValid}
                    isApiLoading={isApiLoading}
                    lmStudioModels={lmStudioModels}
                />
            </aside>
            <main className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex-shrink-0 mb-6">
                    <ImageUpload onFilesSelected={handleFilesSelected} />
                </div>
                 {images.length > 0 && results.length === 0 && !isLoading && (
                    <div className="flex-grow overflow-y-auto pr-2">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Image Preview ({images.length})</h2>
                            <button onClick={handleClearImages} className="text-sm bg-red-500/20 hover:bg-red-500/40 text-red-300 font-semibold px-3 py-1 rounded-md transition">Clear Images</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
                            {images.map(image => (
                                <img key={image.id} src={image.dataUrl} alt={image.file.name} className="w-full h-32 object-cover rounded-md shadow-md" />
                            ))}
                        </div>
                    </div>
                 )}
                
                {(results.length > 0 || isLoading) && (
                    <div className="flex-grow overflow-hidden">
                         <ResultsDisplay 
                            results={results}
                            onDownload={handleDownload}
                            isLoading={isLoading}
                            onStop={handleStop}
                            progressMessage={progressMessage}
                            onClearImages={handleClearImages}
                         />
                    </div>
                )}

                 {images.length === 0 && !isLoading && (
                    <div className="flex items-center justify-center h-full text-center text-gray-500">
                       <p>Upload some images to get started.</p>
                    </div>
                 )}
            </main>
        </div>
    );
}

export default App;