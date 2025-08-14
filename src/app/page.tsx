'use client'
import { useState } from "react";
import { Upload, Scissors, Loader2, Download } from "lucide-react";

// Define interfaces for API response types
interface InlineData {
  mime_type?: string;
  mimeType?: string;
  data: string;
}

interface ContentPart {
  inline_data?: InlineData;
  inlineData?: InlineData;
  text?: string;
}

interface ContentItem {
  role: string;
  parts: ContentPart[];
}

interface Candidate {
  content: {
    parts: ContentPart[];
  };
}

interface APIResponse {
  candidates?: Candidate[];
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [hairstyle, setHairstyle] = useState<string>("clean shave");
  const [loading, setLoading] = useState<boolean>(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

  // Convert file to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1]; // remove prefix
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError("");
    setOutputImage(null);
    
    // Create preview
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload a photo");
      return;
    }

    if (!API_KEY) {
      setError("Please set your Gemini API key");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setOutputImage(null);

      const base64Image = await fileToBase64(file);

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inline_data: {
                      mime_type: file.type,
                      data: base64Image,
                    },
                  },
                  {
                    text: `Change the hairstyle to ${hairstyle}. Keep the person's face and features the same, only modify the hair.`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: APIResponse = await res.json();

      // Fixed response parsing with proper types
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: ContentPart) => p.inline_data?.data || p.inlineData?.data);
      
      if (imagePart) {
        // Handle both possible response formats
        const imageData = imagePart.inline_data?.data || imagePart.inlineData?.data;
        const mimeType = imagePart.inline_data?.mime_type || imagePart.inlineData?.mimeType || "image/png";
        setOutputImage(`data:${mimeType};base64,${imageData}`);
      } else {
        throw new Error("No image returned by API");
      }
    } catch (err: unknown) {
      console.error("Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Error generating image. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (outputImage) {
      const link = document.createElement("a");
      link.href = outputImage;
      link.download = `hairstyle-${hairstyle}-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Scissors className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Hairstyle Changer
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your look with AI-powered hairstyle changes. Upload your photo and see how different hairstyles would look on you.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload and Controls */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl text-gray-800 font-semibold mb-4 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-blue-600" />
                  Upload & Style
                </h2>
                
                <div className="space-y-6">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Your Photo
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-2 border-dashed border-gray-300 rounded-lg p-4"
                      />
                    </div>
                  </div>

                  {/* Preview Image */}
                  {previewImage && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Photo
                      </label>
                      <div className="relative w-full max-w-md mx-auto">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hairstyle Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Hairstyle
                    </label>
                    <select
                      value={hairstyle}
                      onChange={(e) => setHairstyle(e.target.value)}
                      className="w-full p-3 border border-gray-300 text-zinc-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="clean shave">Clean Shave</option>
                      <option value="short fade">Short Fade</option>
                      <option value="long hair">Long Hair</option>
                      <option value="crew cut">Crew Cut</option>
                      <option value="undercut">Undercut</option>
                      <option value="man bun">Man Bun</option>
                      <option value="buzz cut">Buzz Cut</option>
                      <option value="pompadour">Pompadour</option>
                      <option value="side part">Side Part</option>
                      <option value="quiff">Quiff</option>
                    </select>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !file}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating New Look...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-5 h-5" />
                        Transform Hairstyle
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              {outputImage && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <span>✨</span>
                      Your New Look
                    </h2>
                    <button
                      onClick={downloadImage}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  
                  <div className="relative">
                    <img
                      src={outputImage}
                      alt="Generated hairstyle"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                      {hairstyle.charAt(0).toUpperCase() + hairstyle.slice(1)}
                    </div>
                  </div>
                </div>
              )}

              {!outputImage && !loading && (
                <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                  <Scissors className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    Ready to Transform?
                  </h3>
                  <p className="text-gray-500">
                    Upload a photo and select a hairstyle to see the magic happen!
                  </p>
                </div>
              )}

              {loading && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    Creating Your New Look
                  </h3>
                  <p className="text-gray-500">
                    Our AI is working its magic... This may take a moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-12 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-zinc-800  mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-medium mb-2 text-gray-500">Upload Photo</h4>
              <p className="text-sm text-gray-600">
                Choose a clear, front-facing photo of yourself
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12  bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-medium text-gray-500 mb-2">Select Style</h4>
              <p className="text-sm text-gray-600">
                Pick from our variety of hairstyle options
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-medium mb-2 text-gray-500">Get Results</h4>
              <p className="text-sm text-gray-600">
                See your transformation and download the result
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}