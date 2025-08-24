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
  const [hairstyle, setHairstyle] = useState<string>("default");
  const [beardstyle,setBeardstyle]=useState<string>("default");
  const [loading, setLoading] = useState<boolean>(false);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [haircolor, setHaircolor] = useState("default"); // ← Hair color state

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
      let haircut:string;
 
if (hairstyle === "default") {
  haircut = "Do not change the hair. Keep the hairstyle exactly as it is.";
} else {
  haircut = `Change only the hair to: ${hairstyle}. Keep the person's face, skin, eyes, expression, and all other features exactly the same. Do not alter anything else.`;
}

let beardcut: string;
if (beardstyle === "default") {
  beardcut = "Do not change the beard. Keep the existing beard exactly as it is.";
} else {
  beardcut = `Change only the beard to: ${beardstyle}. Keep the face, and skin exactly the same. Do not alter anything else.`;
}

let haircolorcut: string;
if (haircolor === "default") {
  haircolorcut = " ";
} else {
  haircolorcut = `Change only the hair color to: ${haircolor}. Keep the hairstyle, face, skin, eyes,and  expression . Do not alter anything else.`;
}

const prompt = haircut + "\n" + beardcut + "\n" + haircolorcut;

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
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],  // ← Must include BOTH
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
    <option value="default">No change</option>

    {/* Men Hairstyles */}
    <optgroup label="Men">
      <option value="Bald head, 0–2 mm length, completely shaved, clean and bold appearance;">Bald </option>
      <option value="Short fade, top 1–2 inches (25–50 mm), sides 0–1 inch (0–25 mm), sharp and modern look;">Short Fade</option>
      <option value="Long hair, 6–12 inches (150–300 mm), flowing and versatile, rugged look;">Long Hair</option>
      <option value="Crew cut, top 1–2 inches (25–50 mm), sides 0–1 inch (0–25 mm), classic and clean;">Crew Cut</option>
      <option value="Undercut, sides 0–1 inch (0–25 mm), top 2–6 inches (50–150 mm), edgy contrast;">Undercut</option>
      <option value="Man bun, 6–12 inches (150–300 mm), hair pulled back, often with shaved sides, bohemian look;">Man Bun</option>
      <option value="Buzz cut, uniform 1.5–12 mm, simple and low-maintenance;">Buzz Cut</option>
      <option value="Pompadour, top 4–6 inches (100–150 mm), sides 1–2 inches (25–50 mm), voluminous retro style;">Pompadour</option>
      <option value="Side part, top 2–4 inches (50–100 mm), neat and formal;">Side Part</option>
      <option value="Quiff, front 3–5 inches (75–125 mm), styled upwards and back, voluminous;">Quiff</option>
    </optgroup>

    {/* Women Hairstyles */}
    <optgroup label="Women">
      <option value="Bob Cut, chin-length, straight or slightly wavy, classic and elegant;">Bob Cut</option>
      <option value="Layered Cut, medium length, layered for volume and texture;">Layered Cut</option>
      <option value="Pixie Cut, short, cropped, chic and edgy;">Pixie Cut</option>
      <option value="Long Waves, long, soft waves, voluminous and flowing;">Long Waves</option>
      <option value="Ponytail, hair pulled back into high or low ponytail, practical yet stylish;">Ponytail</option>
    </optgroup>
  </select>
</div>

                  
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Choose Beard Style
  </label>
  <select
    value={beardstyle}
    onChange={(e) => setBeardstyle(e.target.value)}
    className="w-full p-3 border border-gray-300 text-zinc-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  >
    <option value="default">No change</option>
<option value="clean shave — Completely smooth face with no facial hair, projecting a fresh, youthful, and formal look; famously sported by actors like Daniel Craig in James Bond appearances.">Clean Shave</option>

<option value="stubble — Short, evenly trimmed facial hair (approx. 2–5 mm), offering a rugged yet neat aesthetic; epitomized by Ryan Gosling’s designer stubble.">Stubble</option>

<option value="goatee — A precise and distinctive beard style where facial hair is grown only on the chin, forming a small, concentrated patch that highlights the center of the face. The cheeks, jawline, and sideburns are completely shaved so the skin is fully visible, leaving no stubble or extended beard growth. The chin hair is kept short to medium in length, without braids or long strands. Unlike a circle beard or Van Dyke, the mustache remains either absent or completely disconnected from the chin beard, leaving a clear gap above the lips and around the corners of the mouth. This creates a sharp contrast between the visible skin and the deliberate chin hair, emphasizing the jaw and adding definition to the lower face. Culturally, the goatee is often associated with artistic, intellectual, and occasionally rebellious personalities, offering a blend of sophistication and edginess. Iconic example: Johnny Depp, who frequently sports a short disconnected goatee in both his public appearances and films, most famously in his portrayal of Captain Jack Sparrow in the 'Pirates of the Caribbean' series.">Goatee</option>

<option value="full beard — Thick, dense coverage across jawline, cheeks, and chin, projecting maturity and masculinity; showcased by Jason Momoa with his signature rugged, unkempt full beard.">Full Beard</option>

<option value="van dyke — Pointed chin beard paired with a detached mustache, with cheeks clean-shaven; a bold, artistic look often associated with Johnny Depp.">Van Dyke</option>

<option value="anchor — A stylized beard shaped like an anchor: jawline beard connected to a pointed chin beard and mustache, offering a sharp, modern appearance; famously worn by Robert Downey Jr. as Tony Stark.">Anchor</option>

<option value="circle beard — Rounded goatee merged with a mustache, forming a neat circle around the mouth; refined style seen on Idris Elba in well-groomed roles.">Circle Beard</option>

<option value="mutton chops — Thick sideburns extending down the cheeks and connecting to a mustache, with chin completely shaved to the skin (no hair); evoking vintage boldness, occasionally seen in retro character portrayals. Example: Micah Bell (RDR2)">Mutton Chops</option>

<option value="balbo — Separated chin beard and mustache without cheek or jaw hair; sharp, precise, and fashion-forward, popularized by Christian Bale in various stylized roles.">Balbo</option>

<option value="extended goatee — Wider goatee extending along the jawline with chin beard connected to short side patches; David Beckham has sported this to frame his strong jaw.">Extended Goatee</option>


  </select>
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Choose Hair Color
  </label>
  <select
    value={haircolor}
    onChange={(e) => setHaircolor(e.target.value)}
    className="w-full p-3 border border-gray-300 text-zinc-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
  >
    <option value="default">No change</option>
    <option value="black, dark and natural">Black</option>
    <option value="brown, medium warm tone">Brown</option>
    <option value="blonde, light and bright">Blonde</option>
    <option value="red, vibrant coppery tone">Red</option>
    <option value="gray, silver and matured look">Gray</option>
    <option value="white, pure white tone">White</option>
    <option value="auburn, reddish-brown mix">Auburn</option>
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