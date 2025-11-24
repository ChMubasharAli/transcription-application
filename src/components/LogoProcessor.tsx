import { useEffect, useState } from 'react';
import { removeBackground, loadImage } from '@/lib/background-removal';
import prepSmartLogo from '@/assets/prep-smart-logo.png';

interface LogoProcessorProps {
  onLogoReady: (logoUrl: string) => void;
}

const LogoProcessor = ({ onLogoReady }: LogoProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processLogo = async () => {
      try {
        setIsProcessing(true);
        
        // Fetch the logo image
        const response = await fetch(prepSmartLogo);
        const blob = await response.blob();
        
        // Load as HTMLImageElement
        const imageElement = await loadImage(blob);
        
        // Remove background
        const processedBlob = await removeBackground(imageElement);
        
        // Create object URL for the processed image
        const processedImageUrl = URL.createObjectURL(processedBlob);
        
        onLogoReady(processedImageUrl);
      } catch (error) {
        console.error('Failed to process logo:', error);
        // Fallback to original logo
        onLogoReady(prepSmartLogo);
      } finally {
        setIsProcessing(false);
      }
    };

    processLogo();
  }, [onLogoReady]);

  if (isProcessing) {
    return (
      <div className="h-8 w-20 bg-primary/20 rounded animate-pulse">
        <span className="sr-only">Processing logo...</span>
      </div>
    );
  }

  return null;
};

export default LogoProcessor;