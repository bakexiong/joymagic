import { v4 as uuidv4 } from 'uuid';

import { NSFW_BLOCKED_ERROR_CODE } from '@/shared/lib/api-error';
import { checkOutputsForNsfw, getPornScore, isPornDetected } from '@/shared/lib/nsfw-output-check';
import { shouldSkipNsfwCheck } from '@/shared/lib/nsfw-policy';
import { respData, respErr } from '@/shared/lib/resp';
import { getAllConfigsDirectly } from '@/shared/models/config';
import { getSignUser } from '@/shared/models/user';
import { createWorkbenchUpload } from '@/shared/models/workbench-upload';
import { getStorageService } from '@/shared/services/storage';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const signUser = await getSignUser();
    const configs = await getAllConfigsDirectly();
    const sceneId = String(formData.get('sceneId') || '');
    const sceneLabel = String(formData.get('sceneLabel') || '');
    const modelUrl = String(formData.get('modelUrl') || '');
    const modelLabel = String(formData.get('modelLabel') || '');

    console.log('[API] Received files:', files.length);
    files.forEach((file, i) => {
      console.log(`[API] File ${i}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
      });
    });

    if (!files || files.length === 0) {
      return respErr('No files provided');
    }

    const uploadResults = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return respErr(`File ${file.name} is not an image`);
      }

      // Generate unique key
      const ext = file.name.split('.').pop();
      const key = `uploads/${Date.now()}-${uuidv4()}.${ext}`;

      const storageService = await getStorageService();

      // Use streaming upload to avoid loading entire file into memory
      // File.stream() returns a ReadableStream that can be consumed incrementally
      const fileStream = file.stream();

      // Upload to storage using stream (memory efficient)
      const result = await storageService.uploadFile({
        body: fileStream,
        key: key,
        contentType: file.type,
        contentLength: file.size, // Required for streaming uploads
        disposition: 'inline',
      });

      if (!result.success) {
        console.error('[API] Upload failed:', result.error);
        return respErr(result.error || 'Upload failed');
      }

      const persistedUrl = result.url;
      if (!persistedUrl) {
        console.error('[API] Upload succeeded but no URL was returned');
        return respErr('Upload failed');
      }

      if (!(await shouldSkipNsfwCheck({
        userId: signUser?.id,
        email: signUser?.email,
        whitelistValue: configs.nsfw_whitelist_emails,
      }))) {
        const nsfwResult = await checkOutputsForNsfw([persistedUrl], 'image');
        if (isPornDetected(nsfwResult)) {
          console.warn('[API] NSFW upload blocked:', {
            filename: file.name,
            mediaType: 'image',
            sceneId,
            modelUrl,
            pornScore: getPornScore(nsfwResult),
          });
          return Response.json({
            code: -1,
            message: NSFW_BLOCKED_ERROR_CODE,
            errorCode: NSFW_BLOCKED_ERROR_CODE,
            data: {
              errorCode: NSFW_BLOCKED_ERROR_CODE,
            },
          });
        }
      }

      console.log('[API] Upload success:', persistedUrl);

      uploadResults.push({
        url: persistedUrl,
        key: result.key,
        filename: file.name,
      });

      if (signUser?.id) {
        await createWorkbenchUpload({
          userId: signUser.id,
          mediaType: 'image',
          sceneId,
          sceneLabel,
          modelUrl,
          modelLabel,
          filename: file.name,
          storageKey: result.key,
          url: persistedUrl,
          mimeType: file.type,
          fileSize: file.size,
        });
      }
    }

    console.log(
      '[API] All uploads complete. Returning URLs:',
      uploadResults.map((r) => r.url)
    );

    return respData({
      urls: uploadResults.map((r) => r.url),
      results: uploadResults,
    });
  } catch (e) {
    console.error('upload image failed:', e);
    return respErr('upload image failed');
  }
}
