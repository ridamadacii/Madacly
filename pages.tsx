
import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileCompressor } from './hooks/useFileCompressor';
import { CompressedFileResult, formatBytes } from './utils';
import { FileIcon, DownloadIcon, TrashIcon } from './components';

// --- HOME PAGE ---
export const HomePage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [compressedResults, setCompressedResults] = useState<CompressedFileResult[]>([]);
  const [quality, setQuality] = useState(80);
  const { compressFiles, isLoadingFfmpeg, isCompressing, progress, currentFile } = useFileCompressor();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'video/mp4': [], 'video/quicktime': ['.mov'] },
  });
  
  const handleCompress = async () => {
    if (files.length === 0) return;
    const results = await compressFiles(files, quality);
    setCompressedResults(prev => [...prev, ...results]);
    setFiles([]);
  };
  
  const handleDownload = (result: CompressedFileResult) => {
    const url = URL.createObjectURL(result.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalOriginalSize = useMemo(() => compressedResults.reduce((acc, r) => acc + r.originalSize, 0), [compressedResults]);
  const totalCompressedSize = useMemo(() => compressedResults.reduce((acc, r) => acc + r.compressedSize, 0), [compressedResults]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">Image & Video Compressor</h1>
        <p className="mt-4 text-lg text-slate-600">Compress your images and videos easily, without losing quality.</p>
      </div>

      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-md">
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors duration-200 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
          <input {...getInputProps()} />
          <FileIcon className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-4 text-slate-600">
            {isDragActive ? 'Drop the files here...' : "Drag 'n' drop some files here, or click to select files"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Supports: JPG, PNG, WEBP, MP4, MOV</p>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-lg">Files to compress:</h3>
            <ul className="mt-2 space-y-2">
              {files.map((file, index) => (
                <li key={index} className="text-sm text-slate-700 bg-slate-100 p-2 rounded">{file.name} ({formatBytes(file.size)})</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6">
          <label htmlFor="quality" className="block font-medium text-gray-700">Compression Quality: <span className="font-bold text-blue-600">{quality}%</span></label>
          <input
            type="range"
            id="quality"
            min="50"
            max="100"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
          />
        </div>

        <div className="mt-6">
          <button
            onClick={handleCompress}
            disabled={files.length === 0 || isCompressing || isLoadingFfmpeg}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isCompressing ? 'Compressing...' : isLoadingFfmpeg ? 'Initializing Compressor...' : `Compress ${files.length} File(s)`}
          </button>
        </div>
      </div>
      
      {isCompressing && (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
          <p className="text-center font-semibold mb-2">{currentFile}</p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-center text-sm mt-2">{progress}%</p>
        </div>
      )}

      {compressedResults.length > 0 && (
        <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Compression Results</h2>
            <button onClick={() => setCompressedResults([])} className="text-sm text-red-500 hover:text-red-700 flex items-center space-x-1">
              <TrashIcon className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
          <div className="space-y-4">
            {compressedResults.map((result) => (
              <div key={result.id} className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 mb-4 sm:mb-0">
                  <p className="font-semibold text-slate-800 truncate">{result.fileName}</p>
                  <div className="flex items-center space-x-2 text-sm text-slate-500 mt-1">
                    <span>{formatBytes(result.originalSize)}</span>
                    <span className="text-blue-500 font-medium">&rarr;</span>
                    <span className="font-semibold text-green-600">{formatBytes(result.compressedSize)}</span>
                    <span className="text-xs bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full">
                      - {(((result.originalSize - result.compressedSize) / result.originalSize) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(result)}
                  className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <DownloadIcon className="w-5 h-5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t pt-4 text-center">
            <h3 className="font-semibold text-lg">Total Savings</h3>
            <p className="text-slate-600">{formatBytes(totalOriginalSize)} &rarr; <span className="font-bold text-green-600">{formatBytes(totalCompressedSize)}</span></p>
            <p className="text-xl font-bold text-blue-600 mt-1">You saved {formatBytes(totalOriginalSize - totalCompressedSize)}!</p>
          </div>
        </div>
      )}
    </div>
  );
};


// --- STATIC PAGES ---
const PageCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-slate-900 border-b pb-4">{title}</h1>
        <div className="prose prose-slate max-w-none">
            {children}
        </div>
    </div>
);

export const AboutPage: React.FC = () => (
    <PageCard title="About Madacly">
        <p>Madacly was created with a simple mission: to provide a fast, free, and secure way for everyone to compress their image and video files. We believe that you shouldn't have to compromise on quality or privacy to reduce file sizes.</p>
        <p>Our key feature is that <strong>everything happens directly in your browser</strong>. Unlike other services, we don't upload your files to a server for processing. This means:</p>
        <ul>
            <li><strong>Ultimate Privacy:</strong> Your files never leave your computer. We have zero access to your data.</li>
            <li><strong>Blazing Speed:</strong> By leveraging your computer's processing power, we avoid slow upload and download times.</li>
            <li><strong>No Hidden Costs:</strong> Madacly is completely free to use, with no limits or watermarks.</li>
        </ul>
        <p>We use cutting-edge, open-source technologies like <code>browser-image-compression</code> and <code>ffmpeg.wasm</code> to bring powerful compression tools straight to your fingertips. Whether you're a developer, designer, or just someone looking to send a smaller video to a friend, Madacly is here to help.</p>
        <p>Thank you for using Madacly!</p>
    </PageCard>
);

export const PrivacyPolicyPage: React.FC = () => (
    <PageCard title="Privacy Policy">
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        <p>At Madacly, your privacy is our top priority. Our privacy policy is simple and transparent because our service is designed from the ground up to protect your data.</p>
        
        <h3>1. No Data Collection</h3>
        <p>We do not collect, store, or transmit any personal information or files from our users. All file compression operations are performed locally on your device using your web browser's capabilities.</p>

        <h3>2. Your Files Stay Yours</h3>
        <p>The images and videos you select for compression are never uploaded to our servers or any third-party service. They remain on your computer throughout the entire process. Once you close your browser tab, all processed data is gone.</p>

        <h3>3. Cookies and Tracking</h3>
        <p>Madacly does not use cookies or any tracking technologies to monitor your activity on our website. We have no interest in who you are, only in providing a useful tool.</p>

        <h3>4. Security</h3>
        <p>Since your files are not transmitted over the internet to our service, the risk of interception is eliminated. The security of your data is in your hands, on your own device.</p>
        
        <p>If you have any questions about our commitment to privacy, please feel free to contact us.</p>
    </PageCard>
);

export const ContactPage: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000); // Reset after 5 seconds
    };

    return (
        <PageCard title="Contact Us">
            <p className="mb-6">Have a question or feedback? We'd love to hear from you. Please fill out the form below.</p>
            {submitted ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Message Sent! </strong>
                    <span className="block sm:inline">Thank you for your feedback.</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" name="name" id="name" required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="email" required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                        <textarea id="message" name="message" rows={4} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                    </div>
                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Send Message
                        </button>
                    </div>
                </form>
            )}
        </PageCard>
    );
};
