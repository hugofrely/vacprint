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
    } catch (error) {
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

      const blob = new Blob([formattedPdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = inputMode === 'search'
        ? `VAC-${icaoCode.toUpperCase()}-${mode}.pdf`
        : `vac-${mode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      setError('Erreur lors du traitement du PDF');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            VacPrint
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transformez vos cartes VAC d'aérodrome en livrets parfaitement formatés pour l'impression
          </p>
        </div>

        {/* Converter Tool - At the top */}
        <div className="max-w-2xl mx-auto mb-20">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Convertissez vos cartes VAC</h2>

            <div className="space-y-6">
              {/* Input Mode Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => {
                    setInputMode('search');
                    setError(null);
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    inputMode === 'search'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Rechercher par code
                </button>
                <button
                  onClick={() => {
                    setInputMode('upload');
                    setError(null);
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    inputMode === 'upload'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Importer un PDF
                </button>
              </div>

              {/* Search Mode */}
              {inputMode === 'search' ? (
                <div>
                  <label
                    htmlFor="icao-search"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Code OACI de l'aérodrome
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
                      placeholder="Ex: LFMA, LFMV, LFNH..."
                      maxLength={4}
                      className="block w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl
                        focus:border-blue-500 focus:outline-none text-lg font-mono uppercase
                        placeholder:text-gray-400 placeholder:normal-case placeholder:font-sans"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Recherche automatique sur le site du SIA
                  </p>
                </div>
              ) : (
                /* Upload Mode */
                <div>
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
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-3 file:px-6
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4
                      hover:border-blue-400 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mode d'impression
                </label>
                <div className="space-y-3">
                  <label className={`flex items-start cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    mode === 'booklet' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      value="booklet"
                      checked={mode === 'booklet'}
                      onChange={(e) => setMode(e.target.value as PrintMode)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Livret complet
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Imprimer recto-verso, plier → livret avec toutes les pages ordonnées
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    mode === 'cut' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      value="cut"
                      checked={mode === 'cut'}
                      onChange={(e) => setMode(e.target.value as PrintMode)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        Cartes individuelles (avec découpe)
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Imprimer recto-verso, plier, découper → cartes séparées (recto imprimé, verso vierge)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>{error}</div>
                </div>
              )}

              {/* Success Message for Upload */}
              {inputMode === 'upload' && file && (
                <div className="text-sm text-gray-700 bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Fichier sélectionné :</div>
                    <div className="text-gray-600">{file.name}</div>
                  </div>
                </div>
              )}

              {/* Success Message for Search */}
              {inputMode === 'search' && icaoCode && icaoCode.length === 4 && !error && (
                <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3">
                  <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Prêt à rechercher :</div>
                    <div className="text-gray-600">Carte VAC de {icaoCode}</div>
                  </div>
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={(inputMode === 'upload' && !file) || (inputMode === 'search' && !icaoCode) || processing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                  disabled:from-gray-400 disabled:to-gray-400
                  text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02]
                  disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Traitement en cours...
                  </span>
                ) : (
                  'Formater pour impression'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* How It Works - Moved below */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Comment ça fonctionne</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Booklet Mode */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Mode Livret</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Toutes les pages assemblées pour créer un livret que vous pouvez plier
              </p>

              {/* Visual illustration */}
              <div className="bg-blue-50 rounded-xl p-8 mb-6">
                <div className="space-y-6">
                  {/* Page spread visualization */}
                  <div className="flex items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-32 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">8</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">R</div>
                    </div>
                    <div className="relative">
                      <div className="w-24 h-32 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-lg flex items-center justify-center border-l-2 border-blue-700">
                        <span className="text-white font-bold text-2xl">1</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">R</div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-600" />
                    <div className="relative">
                      <div className="w-24 h-32 bg-gradient-to-br from-blue-300 to-blue-400 rounded-lg shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">2</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">V</div>
                    </div>
                    <div className="relative">
                      <div className="w-24 h-32 bg-gradient-to-br from-blue-300 to-blue-400 rounded-lg shadow-lg flex items-center justify-center border-l-2 border-blue-600">
                        <span className="text-white font-bold text-2xl">7</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">V</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 text-sm font-medium text-blue-700 bg-blue-100 px-4 py-2 rounded-full">
                      <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">R</span>
                      Recto
                      <span className="mx-2">•</span>
                      <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs">V</span>
                      Verso
                    </div>
                  </div>

                  {/* Folding illustration */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-blue-200">
                    <svg className="w-32 h-24" viewBox="0 0 120 80" fill="none">
                      <rect x="10" y="20" width="40" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2" rx="4"/>
                      <rect x="50" y="20" width="40" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" rx="4"/>
                      <line x1="50" y1="15" x2="50" y2="65" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2"/>
                      <path d="M 92 40 L 100 35 L 100 45 Z" fill="#3B82F6"/>
                    </svg>
                    <span className="text-sm font-medium text-blue-700">Pliez ici</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                {['Imprimez recto-verso', 'Pliez au milieu', 'Votre livret est prêt !'].map((step, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">{i + 1}</span>
                    </div>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cut Mode */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <Scissors className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Mode Découpe</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Pages alternées pour créer des cartes individuelles après découpe
              </p>

              {/* Visual illustration */}
              <div className="bg-indigo-50 rounded-xl p-8 mb-6">
                <div className="space-y-6">
                  {/* Alternating pages visualization */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-20 h-28 bg-gray-200 rounded-lg shadow flex items-center justify-center">
                        <span className="text-gray-400 text-xs">vide</span>
                      </div>
                      <div className="w-20 h-28 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg shadow-lg flex items-center justify-center border-l-2 border-indigo-700">
                        <span className="text-white font-bold text-xl">1</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-indigo-400" />
                      <div className="w-20 h-28 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">8</span>
                      </div>
                      <div className="w-20 h-28 bg-gray-200 rounded-lg shadow flex items-center justify-center border-l-2 border-gray-400">
                        <span className="text-gray-400 text-xs">vide</span>
                      </div>
                    </div>

                    <div className="text-center text-xs text-indigo-600 font-medium">
                      Pages alternées gauche/droite
                    </div>
                  </div>

                  {/* Cutting illustration */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-indigo-200">
                    <svg className="w-32 h-24" viewBox="0 0 120 80" fill="none">
                      <rect x="10" y="20" width="40" height="40" fill="#C7D2FE" stroke="#818CF8" strokeWidth="2" rx="4"/>
                      <rect x="50" y="20" width="40" height="40" fill="#C7D2FE" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 2" rx="4"/>
                      <line x1="50" y1="15" x2="50" y2="65" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 2"/>
                      <circle cx="50" cy="30" r="4" fill="#818CF8"/>
                      <circle cx="50" cy="50" r="4" fill="#818CF8"/>
                      <path d="M 45 30 L 50 25 L 55 30" stroke="#818CF8" strokeWidth="2" fill="none"/>
                      <path d="M 45 50 L 50 55 L 55 50" stroke="#818CF8" strokeWidth="2" fill="none"/>
                    </svg>
                    <Scissors className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                {['Imprimez recto-verso', 'Pliez au milieu', 'Découpez le long du pli', 'Cartes séparées !'].map((step, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
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
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Pourquoi VacPrint ?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Vos cartes VAC prêtes en 30 secondes pour votre vol
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Trouvez votre VAC direct</h3>
              <p className="text-gray-600 leading-relaxed">
                Tapez LFMA, LFMV ou n'importe quel code, on récupère la carte officielle du SIA automatiquement
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Faites un vrai livret</h3>
              <p className="text-gray-600 leading-relaxed">
                Imprimez recto-verso, pliez en deux, et vous avez un livret compact et bien organisé
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Vos PDFs restent chez vous</h3>
              <p className="text-gray-600 leading-relaxed">
                Tout se passe dans votre navigateur, on n'envoie rien nulle part. Pas besoin de s'inscrire
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Scissors className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Ou des cartes à découper</h3>
              <p className="text-gray-600 leading-relaxed">
                Besoin de cartes séparées pour votre kneeboard ? Le mode découpe fait ça nickel
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Ultra rapide et gratuit</h3>
              <p className="text-gray-600 leading-relaxed">
                En 30 secondes c'est prêt. Utilisez autant que vous voulez, c'est gratuit et le restera
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Imprimez et partez voler</h3>
              <p className="text-gray-600 leading-relaxed">
                Le PDF marche avec n'importe quelle imprimante. Recto-verso, pliez, c'est bon
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
