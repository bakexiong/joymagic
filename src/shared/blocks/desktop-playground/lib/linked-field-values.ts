import type { ImageUploaderValue } from "@/shared/blocks/common/image-uploader";
import type { FieldSchema } from "../types/playground-config";

function cloneReferenceImages(value: unknown): ImageUploaderValue[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.reduce<ImageUploaderValue[]>((acc, item, index) => {
    if (!item || typeof item !== "object") {
      return acc;
    }

    const typedItem = item as ImageUploaderValue;
    const url = typedItem.url || typedItem.preview;

    if (!url) {
      return acc;
    }

    acc.push({
      ...typedItem,
      id:
        typedItem.id ||
        `linked-reference-image-${Date.now()}-${index}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
      preview: typedItem.preview || url,
      url,
      status:
        typedItem.status === "uploading" || typedItem.status === "error"
          ? "uploaded"
          : (typedItem.status ?? "uploaded"),
    });

    return acc;
  }, []);

  return items.length > 0 ? items : undefined;
}

export function mergeLinkedFieldValues(
  currentValues: Record<string, any>,
  fieldKey: string,
  nextValue: string,
  field?: FieldSchema,
) {
  const nextValues: Record<string, any> = {
    ...currentValues,
    [fieldKey]: nextValue,
  };

  const linkedValues = field?.linkedValuesByOption?.[nextValue];
  if (!linkedValues || typeof linkedValues !== "object") {
    return nextValues;
  }

  Object.entries(linkedValues).forEach(([linkedKey, linkedValue]) => {
    if (linkedKey === "referenceImages") {
      const clonedReferenceImages = cloneReferenceImages(linkedValue);
      if (clonedReferenceImages) {
        nextValues.referenceImages = clonedReferenceImages;
      }
      return;
    }

    if (linkedValue !== undefined) {
      nextValues[linkedKey] = linkedValue;
    }
  });

  return nextValues;
}
