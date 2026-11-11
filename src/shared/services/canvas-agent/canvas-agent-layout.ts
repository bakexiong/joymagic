export type CanvasAgentLayoutItem = {
  tempId: string;
  position: {
    x: number;
    y: number;
  };
};

export function buildCanvasAgentLayout(input: {
  workflowTempId: string;
  textTempId?: string;
  inputTempIds?: string[];
  baseX?: number;
  baseY?: number;
}) {
  const baseX = input.baseX ?? 320;
  const baseY = input.baseY ?? 220;
  const inputTempIds = input.inputTempIds ?? [];

  const items: CanvasAgentLayoutItem[] = [
    {
      tempId: input.workflowTempId,
      position: {
        x: baseX + (input.textTempId ? 48 : 0),
        y: baseY + (inputTempIds.length > 0 ? 46 : 0),
      },
    },
  ];

  if (input.textTempId) {
    items.push({
      tempId: input.textTempId,
      position: { x: baseX - 286, y: baseY },
    });
  }

  inputTempIds.forEach((tempId, index) => {
    items.push({
      tempId,
      position: {
        x: baseX - 286,
        y: baseY + (input.textTempId ? 132 : 0) + index * 92,
      },
    });
  });

  return items;
}
