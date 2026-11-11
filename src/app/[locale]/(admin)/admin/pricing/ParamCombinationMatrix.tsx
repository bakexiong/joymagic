/**
 * 参数组合定价矩阵表格组件
 * 用于 param-combination-pricing 计算器的价格配置
 */

import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

interface ParamCombinationMatrixProps {
    scenario: any;
    provider: any;
    creditUnitPrice: number;
    onUpdatePrice: (key: string, costPrice: number) => void;
}

export function ParamCombinationMatrix({
    scenario,
    provider,
    creditUnitPrice,
    onUpdatePrice,
}: ParamCombinationMatrixProps) {
    // 从场景配置中获取 UI 布局信息
    const uiLayout = scenario.uiLayout || { type: 'list' };

    // 如果没有参数组合，显示提示
    if (!scenario.paramCombinations || scenario.paramCombinations.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4 border rounded">
                暂无参数组合配置。请先在场景配置中定义参数。
            </div>
        );
    }

    // 矩阵表格模式
    if (uiLayout.type === 'matrix' && uiLayout.rows && uiLayout.columns) {
        return (
            <MatrixView
                scenario={scenario}
                uiLayout={uiLayout}
                creditUnitPrice={creditUnitPrice}
                onUpdatePrice={onUpdatePrice}
            />
        );
    }

    // 列表模式（默认）
    return (
        <ListView
            scenario={scenario}
            creditUnitPrice={creditUnitPrice}
            onUpdatePrice={onUpdatePrice}
        />
    );
}

/**
 * 矩阵表格视图
 */
function MatrixView({
    scenario,
    uiLayout,
    creditUnitPrice,
    onUpdatePrice,
}: {
    scenario: any;
    uiLayout: any;
    creditUnitPrice: number;
    onUpdatePrice: (key: string, costPrice: number) => void;
}) {
    const { rows: rowParam, columns: colParam, cells: cellParam } = uiLayout;

    // 从参数组合中提取行、列、单元格的值
    const rowValues = new Set<string>();
    const colValues = new Set<number>();
    const cellValues = new Set<boolean>();

    scenario.paramCombinations.forEach((combo: any) => {
        const params = combo.params;
        if (params[rowParam]) rowValues.add(params[rowParam]);
        if (params[colParam] !== undefined) colValues.add(params[colParam]);
        if (params[cellParam] !== undefined) cellValues.add(params[cellParam]);
    });

    const sortedRows = Array.from(rowValues).sort();
    const sortedCols = Array.from(colValues).sort((a, b) => a - b);
    const sortedCells = Array.from(cellValues).sort();

    // 查找参数组合
    const findCombination = (rowVal: string, colVal: number, cellVal: boolean) => {
        return scenario.paramCombinations.find((combo: any) => {
            const params = combo.params;
            return (
                params[rowParam] === rowVal &&
                params[colParam] === colVal &&
                params[cellParam] === cellVal
            );
        });
    };

    // 计算售价和积分
    const calculateSellingPrice = (costPrice: number, profitMargin: number) => {
        return costPrice / (1 - profitMargin);
    };

    const calculateCredits = (sellingPrice: number) => {
        return Math.ceil(sellingPrice / creditUnitPrice);
    };

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-32">{rowParam}</TableHead>
                        {sortedCols.map((colVal) => (
                            <TableHead key={colVal} className="text-center">
                                {colVal}{colParam === 'duration' ? '秒' : ''}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedRows.map((rowVal) => (
                        <TableRow key={rowVal}>
                            <TableCell className="font-medium">{rowVal}</TableCell>
                            {sortedCols.map((colVal) => (
                                <TableCell key={`${rowVal}-${colVal}`} className="p-2">
                                    <div className="space-y-2">
                                        {sortedCells.map((cellVal) => {
                                            const combo = findCombination(rowVal, colVal, cellVal);

                                            if (!combo) {
                                                return (
                                                    <div
                                                        key={`${cellVal}`}
                                                        className="text-center text-muted-foreground text-sm py-2"
                                                    >
                                                        —
                                                    </div>
                                                );
                                            }

                                            const sellingPrice = calculateSellingPrice(
                                                combo.costPrice,
                                                combo.profitMargin
                                            );
                                            const credits = calculateCredits(sellingPrice);

                                            return (
                                                <div
                                                    key={`${cellVal}`}
                                                    className="border rounded p-2 bg-muted/30 space-y-1"
                                                >
                                                    <div className="text-xs font-medium text-muted-foreground">
                                                        {cellParam === 'generate_audio'
                                                            ? cellVal
                                                                ? '有音频'
                                                                : '无音频'
                                                            : String(cellVal)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs">$</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={combo.costPrice}
                                                            onChange={(e) => {
                                                                const newPrice = parseFloat(e.target.value) || 0;
                                                                onUpdatePrice(combo.key, newPrice);
                                                            }}
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        售价: ${sellingPrice.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs font-medium text-primary">
                                                        {credits} 积分
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

/**
 * 列表视图
 */
function ListView({
    scenario,
    creditUnitPrice,
    onUpdatePrice,
}: {
    scenario: any;
    creditUnitPrice: number;
    onUpdatePrice: (key: string, costPrice: number) => void;
}) {
    const calculateSellingPrice = (costPrice: number, profitMargin: number) => {
        return costPrice / (1 - profitMargin);
    };

    const calculateCredits = (sellingPrice: number) => {
        return Math.ceil(sellingPrice / creditUnitPrice);
    };

    return (
        <div className="space-y-2">
            {scenario.paramCombinations.map((combo: any) => {
                const sellingPrice = calculateSellingPrice(combo.costPrice, combo.profitMargin);
                const credits = calculateCredits(sellingPrice);

                // 格式化参数显示
                const paramsDisplay = Object.entries(combo.params)
                    .map(([key, value]) => {
                        if (key === 'generate_audio') {
                            return `${key}: ${value ? '是' : '否'}`;
                        }
                        return `${key}: ${value}`;
                    })
                    .join(', ');

                return (
                    <div
                        key={combo.key}
                        className="border rounded p-3 bg-muted/30 grid grid-cols-5 gap-4 items-center"
                    >
                        <div className="col-span-2">
                            <div className="text-sm font-medium">{paramsDisplay}</div>
                            <div className="text-xs text-muted-foreground">{combo.key}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">成本价:</Label>
                            <div className="flex items-center gap-1">
                                <span className="text-xs">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={combo.costPrice}
                                    onChange={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0;
                                        onUpdatePrice(combo.key, newPrice);
                                    }}
                                    className="h-8 w-24 text-xs"
                                />
                            </div>
                        </div>
                        <div className="text-sm">
                            <div className="text-xs text-muted-foreground">售价</div>
                            <div className="font-medium">${sellingPrice.toFixed(2)}</div>
                        </div>
                        <div className="text-sm">
                            <div className="text-xs text-muted-foreground">积分</div>
                            <div className="font-medium text-primary">{credits}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
