'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';

interface PromptEnhanceButtonProps {
    prompt: string;
    onEnhanced: (enhancedPrompt: string) => void;
    mode?: 'image' | 'video';
    image?: string;
    disabled?: boolean;
    className?: string;
    tooltipText?: string;
    enhancingText?: string;
}

export function PromptEnhanceButton({
    prompt,
    onEnhanced,
    mode = 'image',
    image,
    disabled = false,
    className,
    tooltipText = 'Enhance Prompt',
    enhancingText = 'Enhancing...',
}: PromptEnhanceButtonProps) {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const { user, setIsShowSignModal } = useAppContext();

    const handleEnhance = async () => {
        const trimmed = prompt.trim();
        if (!trimmed || isEnhancing) return;
        if (!user) {
            setIsShowSignModal(true);
            return;
        }

        setIsEnhancing(true);
        try {
            const res = await fetch('/api/ai/prompt-enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: trimmed, mode, image }),
            });

            if (!res.ok) return;

            const result = await res.json();
            if (result.code === 0 && result.data?.text) {
                onEnhanced(result.data.text);
            }
        } catch (e) {
            console.error('[PromptEnhanceButton] error:', e);
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleEnhance}
                        disabled={disabled || isEnhancing || !prompt.trim()}
                        className={cn(
                            'h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-primary',
                            isEnhancing && 'text-primary',
                            className,
                        )}
                    >
                        {isEnhancing ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>{enhancingText}</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>{tooltipText}</span>
                            </>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
