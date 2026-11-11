'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Share2, X as Twitter, Facebook, Instagram, ExternalLink, AlertCircle } from 'lucide-react';
import { getUserGeoLocation } from '@/shared/lib/geo';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareComplete: () => void;
}

export function ShareDialog({ open, onOpenChange, onShareComplete }: ShareDialogProps) {
  const t = useTranslations('landing.share_dialog');
  const [copied, setCopied] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const shareUrl = t('share_url');
  const shareMessage = t('share_message');

  // Check if user is from restricted country
  useEffect(() => {
    const checkRestriction = async () => {
      try {
        const location = await getUserGeoLocation();
        if (location?.isRestricted) {
          setIsRestricted(true);
        }
      } catch (error) {
        console.error('Failed to check restriction:', error);
      } finally {
        setIsChecking(false);
      }
    };

    if (open) {
      checkRestriction();
    }
  }, [open]);

  const handleShare = (platform: 'twitter' | 'reddit' | 'facebook' | 'instagram') => {
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareMessage)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support web sharing, so copy to clipboard
        navigator.clipboard.writeText(`${shareMessage} ${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const handleContinue = () => {
    // Restricted users cannot continue even after sharing
    if (isRestricted) {
      return;
    }
    onShareComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Restriction Warning */}
          {isRestricted && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Service is temporarily unavailable due to high demand. Please try again later.</span>
              </p>
            </div>
          )}

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={() => handleShare('twitter')}
              disabled={isRestricted || isChecking}
            >
              <Twitter className="h-4 w-4" />
              {t('platforms.twitter')}
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-950"
              onClick={() => handleShare('reddit')}
              disabled={isRestricted || isChecking}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
              {t('platforms.reddit')}
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={() => handleShare('facebook')}
              disabled={isRestricted || isChecking}
            >
              <Facebook className="h-4 w-4" />
              {t('platforms.facebook')}
            </Button>

            <Button
              variant="outline"
              className={cn(
                "flex items-center justify-center gap-2 hover:bg-pink-50 dark:hover:bg-pink-950",
                copied && "bg-green-50 dark:bg-green-950"
              )}
              onClick={() => handleShare('instagram')}
              disabled={isRestricted || isChecking}
            >
              <Instagram className="h-4 w-4" />
              {copied ? '已复制!' : t('platforms.instagram')}
            </Button>
          </div>

          {/* Continue Button */}
          {!isRestricted && (
            <>
              <div className="pt-4 border-t">
                <Button
                  onClick={handleContinue}
                  className="w-full"
                  size="lg"
                  disabled={isChecking}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {isChecking ? 'Checking...' : t('share_button')}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {t('share_tip')}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}