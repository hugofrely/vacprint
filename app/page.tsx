'use client';

import { useState } from 'react';
import { formatPDFForBooklet, PrintMode } from '@/lib/pdfFormatter';
import { FileText, BookOpen, Scissors, ArrowRight, Check, Search, Upload } from 'lucide-react';

type InputMode = 'upload' | 'search';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<PrintMode>('booklet');
  const [inputMode, setInputMode] = useState<InputMode>('search');
  const [icaoCode, setIcaoCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const fetchVACFromSIA = async (): Promise<ArrayBuffer | null> => {
    if (!icaoCode) return null;

    try {
      const response = await fetch(`/api/fetch-vac?code=${icaoCode.toUpperCase()}`);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error);
        return null;
      }

      return await response.arrayBuffer();
    } catch {
      setError('Erreur lors de la récupération de la carte VAC');
      return null;
    }
  };

  const handleProcess = async () => {
    setError(null);
    setProcessing(true);

    try {
      let arrayBuffer: ArrayBuffer | null = null;

      if (inputMode === 'upload') {
        if (!file) {
          setError('Veuillez sélectionner un fichier');
          setProcessing(false);
          return;
        }
        arrayBuffer = await file.arrayBuffer();
      } else {
        if (!icaoCode || icaoCode.length !== 4) {
          setError('Veuillez entrer un code OACI valide (ex: LFMA)');
          setProcessing(false);
          return;
        }
        arrayBuffer = await fetchVACFromSIA();
      }

      if (!arrayBuffer) {
        setProcessing(false);
        return;
      }

      const formattedPdf = await formatPDFForBooklet(arrayBuffer, mode);

      const blob = new Blob([new Uint8Array(formattedPdf)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = inputMode === 'search'
        ? `VAC-${icaoCode.toUpperCase()}-${mode}.pdf`
        : `vac-${mode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors du traitement du PDF');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline focus:outline-3 focus:outline-blue-600 focus:outline-offset-2"
      >
        Aller au contenu principal
      </a>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 sm:pb-8">
        <header className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl mb-4 sm:mb-6" aria-hidden="true">
            <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            VacPrint
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Transformez vos cartes VAC d&apos;aérodrome en livrets parfaitement formatés pour l&apos;impression
          </p>
        </header>

        {/* Converter Tool - At the top */}
        <section id="main-content" aria-labelledby="converter-title" className="max-w-2xl mx-auto mb-12 sm:mb-20">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
            <h2 id="converter-title" className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-gray-900">Convertissez vos cartes VAC</h2>

            <div className="space-y-6">
              {/* Input Mode Toggle */}
              <div role="tablist" aria-label="Mode de saisie" className="flex gap-1 sm:gap-2 p-1 bg-gray-100 rounded-lg sm:rounded-xl">
                <button
                  role="tab"
                  aria-selected={inputMode === 'search'}
                  aria-controls="search-panel"
                  id="search-tab"
                  onClick={() => {
                    setInputMode('search');
                    setError(null);
                  }}
                  className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-1 sm:gap-2 focus:outline focus:outline-3 focus:outline-blue-600 focus:outline-offset-2 ${
                    inputMode === 'search'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden xs:inline">Rechercher par code</span>
                  <span className="xs:hidden">Rechercher</span>
                </button>
                <button
                  role="tab"
                  aria-selected={inputMode === 'upload'}
                  aria-controls="upload-panel"
                  id="upload-tab"
                  onClick={() => {
                    setInputMode('upload');
                    setError(null);
                  }}
                  className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-1 sm:gap-2 focus:outline focus:outline-3 focus:outline-blue-600 focus:outline-offset-2 ${
                    inputMode === 'upload'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden xs:inline">Importer un PDF</span>
                  <span className="xs:hidden">Importer</span>
                </button>
              </div>

              {/* Search Mode */}
              {inputMode === 'search' ? (
                <div role="tabpanel" id="search-panel" aria-labelledby="search-tab">
                  <label
                    htmlFor="icao-search"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Code OACI de l&apos;aérodrome
                  </label>
                  <div className="relative">
                    <input
                      id="icao-search"
                      type="text"
                      value={icaoCode}
                      onChange={(e) => {
                        setIcaoCode(e.target.value.toUpperCase());
                        setError(null);
                      }}
                      placeholder="Ex: LFMA, LFMV..."
                      maxLength={4}
                      aria-describedby="icao-help"
                      aria-invalid={error ? 'true' : 'false'}
                      className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-12 border-2 border-gray-300 rounded-lg sm:rounded-xl
                        focus:border-blue-500 focus:outline focus:outline-3 focus:outline-blue-600 focus:outline-offset-2 text-base sm:text-lg font-mono uppercase
                        placeholder:text-gray-400 placeholder:normal-case placeholder:font-sans"
                    />
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                  </div>
                  <p id="icao-help" className="mt-2 text-xs sm:text-sm text-gray-600">
                    Recherche automatique sur le site du SIA
                  </p>
                </div>
              ) : (
                /* Upload Mode */
                <div role="tabpanel" id="upload-panel" aria-labelledby="upload-tab">
                  <label
                    htmlFor="pdf-upload"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Importez votre carte VAC (PDF)
                  </label>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    aria-describedby="upload-help"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-3 file:px-6
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      focus:outline focus:outline-3 focus:outline-blue-600 focus:outline-offset-2
                      cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4
                      hover:border-blue-400 transition-colors"
                  />
                  <p id="upload-help" className="mt-2 text-sm text-gray-600 sr-only">
                    Sélectionnez un fichier PDF de carte VAC depuis votre ordinateur
                  </p>
                </div>
              )}

              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-3">
                  Mode d&apos;impression
                </legend>
                <div className="space-y-2 sm:space-y-3" role="radiogroup" aria-required="true">
                  <label className={`flex items-start cursor-pointer p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all focus-within:outline focus-within:outline-3 focus-within:outline-blue-600 focus-within:outline-offset-2 ${
                    mode === 'booklet' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      value="booklet"
                      checked={mode === 'booklet'}
                      onChange={(e) => setMode(e.target.value as PrintMode)}
                      className="mt-1 mr-2 sm:mr-3"
                      aria-describedby="booklet-desc"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <BookOpen className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span>Livret complet</span>
                      </div>
                      <div id="booklet-desc" className="text-xs sm:text-sm text-gray-600 mt-1">
                        Imprimer recto-verso, plier → livret ordonné
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start cursor-pointer p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all focus-within:outline focus-within:outline-3 focus-within:outline-blue-600 focus-within:outline-offset-2 ${
                    mode === 'cut' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      value="cut"
                      checked={mode === 'cut'}
                      onChange={(e) => setMode(e.target.value as PrintMode)}
                      className="mt-1 mr-2 sm:mr-3"
                      aria-describedby="cut-desc"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <Scissors className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span>Cartes individuelles</span>
                      </div>
                      <div id="cut-desc" className="text-xs sm:text-sm text-gray-600 mt-1">
                        Imprimer, plier, découper → cartes séparées
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Error Message */}
              {error && (
                <div role="alert" aria-live="assertive" className="text-sm text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>{error}</div>
                </div>
              )}

              {/* Success Message for Upload */}
              {inputMode === 'upload' && file && (
                <div role="status" aria-live="polite" className="text-sm text-gray-700 bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-semibold">Fichier sélectionné :</div>
                    <div className="text-gray-600">{file.name}</div>
                  </div>
                </div>
              )}

              {/* Success Message for Search */}
              {inputMode === 'search' && icaoCode && icaoCode.length === 4 && !error && (
                <div role="status" aria-live="polite" className="text-sm text-gray-700 bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3">
                  <Search className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-semibold">Prêt à rechercher :</div>
                    <div className="text-gray-600">Carte VAC de {icaoCode}</div>
                  </div>
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={(inputMode === 'upload' && !file) || (inputMode === 'search' && !icaoCode) || processing}
                aria-busy={processing}
                aria-live="polite"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                  disabled:from-gray-400 disabled:to-gray-400
                  text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02]
                  disabled:cursor-not-allowed disabled:transform-none shadow-lg
                  focus:outline focus:outline-3 focus:outline-blue-600 focus:outline-offset-2"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Traitement en cours...</span>
                  </span>
                ) : (
                  'Formater pour impression'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* How It Works - Moved below */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900 px-4">Comment ça fonctionne</h2>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto px-4">
            {/* Booklet Mode */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8 border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Mode Livret</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Toutes les pages assemblées pour créer un livret que vous pouvez plier
              </p>

              {/* Visual illustration */}
              <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-6 md:p-8 mb-4 sm:mb-6">
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  {/* Page spread visualization */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-4">
                    <div className="relative">
                      <div className="w-12 h-16 sm:w-16 sm:h-20 md:w-24 md:h-32 bg-gradient-to-br from-blue-400 to-blue-500 rounded shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-base sm:text-lg md:text-2xl">8</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] sm:text-[10px] md:text-xs font-bold">R</div>
                    </div>
                    <div className="relative">
                      <div className="w-12 h-16 sm:w-16 sm:h-20 md:w-24 md:h-32 bg-gradient-to-br from-blue-400 to-blue-500 rounded shadow-lg flex items-center justify-center border-l-2 border-blue-700">
                        <span className="text-white font-bold text-base sm:text-lg md:text-2xl">1</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] sm:text-[10px] md:text-xs font-bold">R</div>
                    </div>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-blue-600 flex-shrink-0" />
                    <div className="relative">
                      <div className="w-12 h-16 sm:w-16 sm:h-20 md:w-24 md:h-32 bg-gradient-to-br from-blue-300 to-blue-400 rounded shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-base sm:text-lg md:text-2xl">2</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[8px] sm:text-[10px] md:text-xs font-bold">V</div>
                    </div>
                    <div className="relative">
                      <div className="w-12 h-16 sm:w-16 sm:h-20 md:w-24 md:h-32 bg-gradient-to-br from-blue-300 to-blue-400 rounded shadow-lg flex items-center justify-center border-l-2 border-blue-600">
                        <span className="text-white font-bold text-base sm:text-lg md:text-2xl">7</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[8px] sm:text-[10px] md:text-xs font-bold">V</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] sm:text-xs">R</span>
                      <span className="hidden xs:inline">Recto</span>
                      <span className="xs:hidden">R</span>
                      <span className="mx-1 sm:mx-2">•</span>
                      <span className="w-4 h-4 sm:w-5 sm:h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[8px] sm:text-xs">V</span>
                      <span className="hidden xs:inline">Verso</span>
                      <span className="xs:hidden">V</span>
                    </div>
                  </div>

                  {/* Folding illustration */}
                  <div className="flex items-center justify-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-blue-200">
                    <svg className="w-20 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24" viewBox="0 0 120 80" fill="none">
                      <rect x="10" y="20" width="40" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2" rx="4"/>
                      <rect x="50" y="20" width="40" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" rx="4"/>
                      <line x1="50" y1="15" x2="50" y2="65" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2"/>
                      <path d="M 92 40 L 100 35 L 100 45 Z" fill="#3B82F6"/>
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-blue-700">Pliez ici</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 sm:space-y-3">
                {['Imprimez recto-verso', 'Pliez au milieu', 'Votre livret est prêt !'].map((step, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">{i + 1}</span>
                    </div>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cut Mode */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8 border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Mode Découpe</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Pages alternées pour créer des cartes individuelles après découpe
              </p>

              {/* Visual illustration */}
              <div className="bg-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-6 md:p-8 mb-4 sm:mb-6">
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  {/* Alternating pages visualization */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
                      <div className="w-10 h-16 sm:w-14 sm:h-20 md:w-20 md:h-28 bg-gray-200 rounded shadow flex items-center justify-center">
                        <span className="text-gray-400 text-[8px] sm:text-[10px] md:text-xs">vide</span>
                      </div>
                      <div className="w-10 h-16 sm:w-14 sm:h-20 md:w-20 md:h-28 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded shadow-lg flex items-center justify-center border-l-2 border-indigo-700">
                        <span className="text-white font-bold text-base sm:text-lg md:text-xl">1</span>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-indigo-400 flex-shrink-0" />
                      <div className="w-10 h-16 sm:w-14 sm:h-20 md:w-20 md:h-28 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-base sm:text-lg md:text-xl">8</span>
                      </div>
                      <div className="w-10 h-16 sm:w-14 sm:h-20 md:w-20 md:h-28 bg-gray-200 rounded shadow flex items-center justify-center border-l-2 border-gray-400">
                        <span className="text-gray-400 text-[8px] sm:text-[10px] md:text-xs">vide</span>
                      </div>
                    </div>

                    <div className="text-center text-[10px] sm:text-xs text-indigo-600 font-medium">
                      Pages alternées gauche/droite
                    </div>
                  </div>

                  {/* Cutting illustration */}
                  <div className="flex items-center justify-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-indigo-200">
                    <svg className="w-20 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24" viewBox="0 0 120 80" fill="none">
                      <rect x="10" y="20" width="40" height="40" fill="#C7D2FE" stroke="#818CF8" strokeWidth="2" rx="4"/>
                      <rect x="50" y="20" width="40" height="40" fill="#C7D2FE" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 2" rx="4"/>
                      <line x1="50" y1="15" x2="50" y2="65" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 2"/>
                      <circle cx="50" cy="30" r="4" fill="#818CF8"/>
                      <circle cx="50" cy="50" r="4" fill="#818CF8"/>
                      <path d="M 45 30 L 50 25 L 55 30" stroke="#818CF8" strokeWidth="2" fill="none"/>
                      <path d="M 45 50 L 50 55 L 55 50" stroke="#818CF8" strokeWidth="2" fill="none"/>
                    </svg>
                    <Scissors className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              <ul className="space-y-2 sm:space-y-3">
                {['Imprimez recto-verso', 'Pliez au milieu', 'Découpez le long du pli', 'Cartes séparées !'].map((step, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-bold text-sm">{i + 1}</span>
                    </div>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-12 sm:py-16 lg:py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">Pourquoi VacPrint ?</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Vos cartes VAC prêtes en 30 secondes pour votre vol
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Search className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">Trouvez votre VAC direct</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Tapez LFMA, LFMV ou n&apos;importe quel code, on récupère la carte officielle du SIA automatiquement
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">Faites un vrai livret</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Imprimez recto-verso, pliez en deux, et vous avez un livret compact et bien organisé
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">Vos PDFs restent chez vous</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Tout se passe dans votre navigateur, on n&apos;envoie rien nulle part. Pas besoin de s&apos;inscrire
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Scissors className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">Ou des cartes à découper</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Besoin de cartes séparées pour votre kneeboard ? Le mode découpe fait ça nickel
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">Ultra rapide et gratuit</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                En 30 secondes c&apos;est prêt. Utilisez autant que vous voulez, c&apos;est gratuit et le restera
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">Imprimez et partez voler</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Le PDF marche avec n&apos;importe quelle imprimante. Recto-verso, pliez, c&apos;est bon
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 lg:mt-20 pb-8 sm:pb-12 text-center px-4" role="contentinfo">
          <p className="text-sm sm:text-base text-gray-600">
            Développé par <span className="font-semibold text-gray-900">Hugo Frely</span> avec amour et passion <span aria-label="coeur">❤️</span>
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            <a
              href="https://github.com/hugofrely/vacprint"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors focus:outline focus:outline-3 focus:outline-blue-600 focus:outline-offset-2 rounded"
              aria-label="Voir le code source sur GitHub (ouverture dans un nouvel onglet)"
            >
              Code source sur GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
