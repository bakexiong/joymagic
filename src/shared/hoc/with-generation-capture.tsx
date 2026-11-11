'use client';

import { ComponentType, useEffect, useRef } from 'react';

interface GenerationResult {
  url: string;
  type: 'image' | 'video';
  prompt: string;
  parameters: Record<string, any>;
}

interface WithGenerationCaptureProps {
  onGenerationComplete?: (result: GenerationResult) => void;
}

/**
 * 高阶组件：通过监听 DOM 和网络请求来捕获生成结果
 * 不修改原组件，通过拦截 fetch 请求来获取生成结果
 */
export function withGenerationCapture<P extends object>(
  Component: ComponentType<P>,
  componentName: string
): ComponentType<P & WithGenerationCaptureProps> {
  return function WithGenerationCaptureWrapper(props: P & WithGenerationCaptureProps) {
    const { onGenerationComplete, ...restProps } = props;
    const capturedDataRef = useRef<{
      prompt?: string;
      parameters?: Record<string, any>;
    }>({});

    useEffect(() => {
      if (!onGenerationComplete) {
        console.log(`[withGenerationCapture] ${componentName} - No callback provided`);
        return;
      }

      console.log(`[withGenerationCapture] Monitoring ${componentName}`);

      // 拦截 fetch 请求
      const originalFetch = window.fetch;

      console.log(`[withGenerationCapture] Original fetch:`, typeof originalFetch);
      console.log(`[withGenerationCapture] Is already wrapped?`, originalFetch.name === 'fetch');

      window.fetch = async function(...args) {
        const [url, options] = args;
        const urlString = typeof url === 'string' ? url : url.toString();

        console.log(`[withGenerationCapture] ${componentName} - Fetch intercepted: ${urlString}`);

        // 捕获生成请求的参数
        if (urlString.includes('/api/ai/') && urlString.includes('/generate')) {
          try {
            const body = options?.body;
            if (body && typeof body === 'string') {
              const requestData = JSON.parse(body);
              console.log('[withGenerationCapture] Captured request:', requestData);

              // 保存请求参数
              const { prompt, ...otherParams } = requestData;
              capturedDataRef.current = {
                prompt: prompt,
                parameters: otherParams, // 所有除了 prompt 之外的参数
              };
              console.log('[withGenerationCapture] Saved to ref:', capturedDataRef.current);
            }
          } catch (e) {
            console.error('[withGenerationCapture] Failed to parse request:', e);
          }
        }

        // 执行原始请求
        const response = await originalFetch.apply(this, args);

        console.log(`[withGenerationCapture] ${componentName} - Response received for: ${urlString}`);
        console.log(`[withGenerationCapture] ${componentName} - Response status:`, response.status);

        // 捕获生成请求的响应（同步模式）
        if (urlString.includes('/api/ai/') && urlString.includes('/generate')) {
          console.log(`[withGenerationCapture] ${componentName} - This is a generate request, parsing response...`);
          try {
            const clonedResponse = response.clone();
            const result = await clonedResponse.json();

            console.log(`[withGenerationCapture] ${componentName} - Generate response:`, result);

            if (result.code === 0 && result.data) {
              const output = result.data.output || (result.data.outputs && result.data.outputs[0]);

              console.log('[withGenerationCapture] Generate output:', output);
              console.log('[withGenerationCapture] Output type:', typeof output);
              console.log('[withGenerationCapture] Output length:', output?.length);
              console.log('[withGenerationCapture] Output preview:', output?.substring(0, 100));
              console.log('[withGenerationCapture] Captured data:', capturedDataRef.current);

              if (output && capturedDataRef.current.prompt) {
                console.log('[withGenerationCapture] Generation completed (sync mode):', output);

                // 判断类型（简单判断：视频文件通常是 mp4）
                const type: 'image' | 'video' = output.includes('.mp4') ? 'video' : 'image';

                const resultData: GenerationResult = {
                  url: output,
                  type,
                  prompt: capturedDataRef.current.prompt,
                  parameters: capturedDataRef.current.parameters || {},
                };

                console.log('[withGenerationCapture] Calling onGenerationComplete with:', resultData);
                onGenerationComplete(resultData);

                // 清空缓存
                capturedDataRef.current = {};
              } else {
                console.warn('[withGenerationCapture] Missing output or prompt:', {
                  output,
                  prompt: capturedDataRef.current.prompt
                });
              }
            }
          } catch (e) {
            console.error('[withGenerationCapture] Failed to parse generate response:', e);
          }
        }

        // 捕获状态查询的响应（异步模式）
        if (urlString.includes('/api/ai/status')) {
          try {
            const clonedResponse = response.clone();
            const result = await clonedResponse.json();

            console.log('[withGenerationCapture] Status response:', result);

            if (result.code === 0 && result.data?.status === 'completed') {
              const output = result.data.output || (result.data.outputs && result.data.outputs[0]);

              console.log('[withGenerationCapture] Completed! Output:', output);
              console.log('[withGenerationCapture] Output type:', typeof output);
              console.log('[withGenerationCapture] Output length:', output?.length);
              console.log('[withGenerationCapture] Output preview:', output?.substring(0, 100));
              console.log('[withGenerationCapture] Captured data:', capturedDataRef.current);

              if (output && capturedDataRef.current.prompt) {
                console.log('[withGenerationCapture] Generation completed:', output);

                // 判断类型（简单判断：视频文件通常是 mp4）
                const type: 'image' | 'video' = output.includes('.mp4') ? 'video' : 'image';

                const resultData: GenerationResult = {
                  url: output,
                  type,
                  prompt: capturedDataRef.current.prompt,
                  parameters: capturedDataRef.current.parameters || {},
                };

                console.log('[withGenerationCapture] Calling onGenerationComplete with:', resultData);
                onGenerationComplete(resultData);

                // 清空缓存
                capturedDataRef.current = {};
              } else {
                console.warn('[withGenerationCapture] Missing output or prompt:', {
                  output,
                  prompt: capturedDataRef.current.prompt
                });
              }
            }
          } catch (e) {
            console.error('[withGenerationCapture] Failed to parse status response:', e);
          }
        }

        return response;
      };

      // 清理函数：恢复原始 fetch
      return () => {
        console.log(`[withGenerationCapture] Cleanup ${componentName}`);
        window.fetch = originalFetch;
      };
    }, [onGenerationComplete, componentName]);

    return <Component {...(restProps as P)} />;
  };
}
