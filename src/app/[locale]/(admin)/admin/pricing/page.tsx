'use client';

import { Fragment, useEffect, useState } from 'react';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, DollarSign, Plus, X, ChevronDown, ChevronRight, Pencil, Trash2, Upload } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/components/ui/dialog';

interface ParamCombination {
    key: string;
    params: Record<string, any>;
    costPrice: number;
    profitMargin: number;
    sellingPrice: number;
    credits: number;
    apiEndpoint?: string;
    requestParams?: any[];
    responseMapping?: any;
    statusQueryEndpoint?: string;
    statusQueryParams?: any[];
    statusQueryResponseMapping?: any;
    webhookConfig?: any;
    minDuration?: number;
    minDurationCredits?: number;
    creditsPerSecond?: number;
}

interface StepBasedPricingConfig {
    paramName: string;
    stepSize: number;
    costPerStep: number;
    minSteps?: number;
}

interface PricingInfo {
    pricing: {
        creditUnitPrice: number;
        defaultProfitMargin: number;
        currency: string;
        defaultProvider?: string;
        scenarioDefaultProviders?: Record<string, string>;
    };
    providers: Array<{
        name: string;
        description?: string;
        resultMode?: 'sync' | 'async';
        scenarios: Array<{
            name: string;
            costPrice: number;
            profitMargin: number;
            sellingPrice: number;
            credits: number;
            description?: string;
            type?: string;
            calculator?: string;
            mediaType?: 'image' | 'video' | 'music' | 'text' | 'speech';
            normalizeSizeToX?: boolean;
            stepBasedPricing?: StepBasedPricingConfig;
            paramCombinations?: ParamCombination[];
        }>;
    }>;
}

export default function PricingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
    const [editedPricing, setEditedPricing] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<string>('global');
    const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
    const [newProviderName, setNewProviderName] = useState('');
    const [newProviderKey, setNewProviderKey] = useState('');
    const [newProviderDescription, setNewProviderDescription] = useState('');
    const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());
    // 存储输入框的临时输入值（允许中间状态如 "0." 或 "-"）
    const [costPriceInputs, setCostPriceInputs] = useState<Map<string, string>>(new Map());
    const [showAddScenarioDialog, setShowAddScenarioDialog] = useState(false);
    const [newScenarioName, setNewScenarioName] = useState('');
    const [newScenarioType, setNewScenarioType] = useState<'fixed' | 'dynamic'>('fixed');
    const [newScenarioDescription, setNewScenarioDescription] = useState('');
    const [newScenarioUrl, setNewScenarioUrl] = useState('');
    const [newScenarioCredits, setNewScenarioCredits] = useState<number>(2);
    const [newScenarioCalculator, setNewScenarioCalculator] = useState('');
    const [newScenarioParams, setNewScenarioParams] = useState<Array<{
        name: string;
        type: 'string' | 'number' | 'boolean';
        default: string | number | boolean;
        validValues?: string[];
        min?: number;
        max?: number;
    }>>([]);
    // Tier-based 配置
    const [tierParamName, setTierParamName] = useState<string>('num_images');
    const [tierValues, setTierValues] = useState<number[]>([5, 10, 15, 30]);
    const [newTierValue, setNewTierValue] = useState<string>('');
    const [stepBasedParamName, setStepBasedParamName] = useState<string>('duration');
    const [stepBasedStepSize, setStepBasedStepSize] = useState<number>(5);
    const [stepBasedCostPerStep, setStepBasedCostPerStep] = useState<number>(0.01);
    const [stepBasedMinSteps, setStepBasedMinSteps] = useState<number>(1);

    // 场景编辑
    const [showEditScenarioDialog, setShowEditScenarioDialog] = useState(false);
    const [editingScenarioName, setEditingScenarioName] = useState<string>('');
    const [editScenarioType, setEditScenarioType] = useState<'fixed' | 'dynamic'>('fixed');
    const [editScenarioDescription, setEditScenarioDescription] = useState('');
    const [editScenarioUrl, setEditScenarioUrl] = useState('');
    const [editScenarioCalculator, setEditScenarioCalculator] = useState('');
    const [editScenarioParamsJson, setEditScenarioParamsJson] = useState<string>('');
    const [editScenarioSaveTaskToDb, setEditScenarioSaveTaskToDb] = useState<boolean>(true);
    const [editScenarioMediaType, setEditScenarioMediaType] = useState<'image' | 'video' | 'music' | 'text' | 'speech'>('image');
    const [loadingScenarioDetail, setLoadingScenarioDetail] = useState(false);

    // Provider 配置编辑
    const [showProviderConfigDialog, setShowProviderConfigDialog] = useState(false);
    const [editingProviderName, setEditingProviderName] = useState<string>('');
    const [providerResultMode, setProviderResultMode] = useState<'sync' | 'async'>('async');
    const [providerBaseUrl, setProviderBaseUrl] = useState<string>('');
    const [providerApiEndpoint, setProviderApiEndpoint] = useState<string>('');
    const [providerApiKey, setProviderApiKey] = useState<string>('');
    const [providerTimeout, setProviderTimeout] = useState<number>(30000);
    const [providerDefaultHeadersJson, setProviderDefaultHeadersJson] = useState<string>('');
    const [providerRequestParamsJson, setProviderRequestParamsJson] = useState<string>('');
    const [providerResponseMappingJson, setProviderResponseMappingJson] = useState<string>('');
    // Provider 级别的 status 配置
    const [providerStatusQueryEndpoint, setProviderStatusQueryEndpoint] = useState<string>('');
    const [providerStatusQueryParamsJson, setProviderStatusQueryParamsJson] = useState<string>('');
    const [providerStatusQueryResponseMappingJson, setProviderStatusQueryResponseMappingJson] = useState<string>('');
    const [providerWebhookConfigJson, setProviderWebhookConfigJson] = useState<string>('');

    // 场景 API 配置编辑
    const [showScenarioApiConfigDialog, setShowScenarioApiConfigDialog] = useState(false);
    const [editingScenarioApiName, setEditingScenarioApiName] = useState<string>('');
    const [editingScenarioApiProvider, setEditingScenarioApiProvider] = useState<string>('');
    const [scenarioApiEndpoint, setScenarioApiEndpoint] = useState<string>('');
    const [scenarioRequestParamsJson, setScenarioRequestParamsJson] = useState<string>('');
    const [scenarioResponseMappingJson, setScenarioResponseMappingJson] = useState<string>('');
    // 场景级别的 status 配置
    const [scenarioStatusQueryEndpoint, setScenarioStatusQueryEndpoint] = useState<string>('');
    const [scenarioStatusQueryParamsJson, setScenarioStatusQueryParamsJson] = useState<string>('');
    const [scenarioStatusQueryResponseMappingJson, setScenarioStatusQueryResponseMappingJson] = useState<string>('');
    const [scenarioWebhookConfigJson, setScenarioWebhookConfigJson] = useState<string>('');
    // 场景级别最小时长计算配置
    const [scenarioMinDuration, setScenarioMinDuration] = useState<number | undefined>(undefined);
    const [scenarioMinDurationCredits, setScenarioMinDurationCredits] = useState<number | undefined>(undefined);
    const [scenarioCreditsPerSecond, setScenarioCreditsPerSecond] = useState<number | undefined>(undefined);
    // 场景级别尺寸归一化配置
    const [scenarioNormalizeSizeToX, setScenarioNormalizeSizeToX] = useState<boolean>(false);
    // 场景级别请求体模板
    const [scenarioRequestBodyTemplateJson, setScenarioRequestBodyTemplateJson] = useState<string>('');

    // 参数组合 API 配置编辑
    const [showParamCombApiConfigDialog, setShowParamCombApiConfigDialog] = useState(false);
    const [editingParamCombProvider, setEditingParamCombProvider] = useState<string>('');
    const [editingParamCombScenario, setEditingParamCombScenario] = useState<string>('');
    const [editingParamCombKey, setEditingParamCombKey] = useState<string>('');
    const [paramCombApiEndpoint, setParamCombApiEndpoint] = useState<string>('');
    const [paramCombRequestParamsJson, setParamCombRequestParamsJson] = useState<string>('');
    const [paramCombResponseMappingJson, setParamCombResponseMappingJson] = useState<string>('');
    const [paramCombStatusQueryEndpoint, setParamCombStatusQueryEndpoint] = useState<string>('');
    const [paramCombStatusQueryParamsJson, setParamCombStatusQueryParamsJson] = useState<string>('');
    const [paramCombStatusQueryResponseMappingJson, setParamCombStatusQueryResponseMappingJson] = useState<string>('');
    const [paramCombWebhookConfigJson, setParamCombWebhookConfigJson] = useState<string>('');
    // 参数组合最小时长计算配置
    const [paramCombMinDuration, setParamCombMinDuration] = useState<number | undefined>(undefined);
    const [paramCombMinDurationCredits, setParamCombMinDurationCredits] = useState<number | undefined>(undefined);
    const [paramCombCreditsPerSecond, setParamCombCreditsPerSecond] = useState<number | undefined>(undefined);

    // Provider API 配置导入
    const [showImportProviderConfigDialog, setShowImportProviderConfigDialog] = useState(false);
    const [importingProviderName, setImportingProviderName] = useState<string>('');
    const [importFile, setImportFile] = useState<File | null>(null);

    useEffect(() => {
        loadPricingInfo();
    }, []);

    // 保证当前选中的 tab 始终是有效值（删除 provider 后也能自动回退）
    useEffect(() => {
        if (!editedPricing) return;
        const providerNames = (editedPricing.providers || []).map((p: any) => p.name);
        const validTabs = new Set(['global', ...providerNames]);
        if (!validTabs.has(activeTab)) {
            setActiveTab('global');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editedPricing]);

    const loadPricingInfo = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/pricing');
            const result = await response.json();

            if (result.code === 0) {
                setPricingInfo(result.data);
                setEditedPricing(result.data);
            } else {
                toast.error(result.message || 'Failed to load pricing info');
            }
        } catch (error: any) {
            console.error('Failed to load pricing info:', error);
            toast.error('Failed to load pricing info');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // 调试日志：打印要保存的数据结构
            console.log('[PricingPage] Saving config:', {
                providers: editedPricing.providers?.map((p: any) => ({
                    name: p.name,
                    hasApiKey: !!p.apiKey,
                    hasBaseUrl: !!p.baseUrl,
                    scenariosCount: p.scenarios?.length || 0,
                    firstScenario: p.scenarios?.[0] ? {
                        name: p.scenarios[0].name,
                        hasApiEndpoint: !!p.scenarios[0].apiEndpoint,
                        hasRequestParams: !!p.scenarios[0].requestParams,
                    } : null,
                })),
            });

            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editedPricing),
            });

            const result = await response.json();

            if (result.code === 0) {
                toast.success('Pricing configuration saved successfully');
                await loadPricingInfo();
            } else {
                toast.error(result.message || 'Failed to save pricing configuration');
            }
        } catch (error: any) {
            console.error('Failed to save pricing config:', error);
            toast.error('Failed to save pricing configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleAddProvider = async () => {
        if (!newProviderName.trim() || !newProviderKey.trim()) {
            toast.error('Provider name and key are required');
            return;
        }

        try {
            setSaving(true);
            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pricing: editedPricing.pricing,
                    providers: editedPricing.providers,
                    newProvider: {
                        name: newProviderName.trim(),
                        providerKey: newProviderKey.trim(),
                        description: newProviderDescription.trim() || undefined,
                    },
                }),
            });

            const result = await response.json();

            if (result.code === 0) {
                toast.success('Provider added successfully');
                setShowAddProviderDialog(false);
                setNewProviderName('');
                setNewProviderKey('');
                setNewProviderDescription('');
                await loadPricingInfo();
            } else {
                toast.error(result.message || 'Failed to add provider');
            }
        } catch (error: any) {
            console.error('Failed to add provider:', error);
            toast.error('Failed to add provider');
        } finally {
            setSaving(false);
        }
    };

    const handleAddScenario = async () => {
        if (!newScenarioName.trim()) {
            toast.error('场景名称是必需的');
            return;
        }

        if (newScenarioType === 'fixed' && !newScenarioCredits) {
            toast.error('固定类型场景需要设置积分值');
            return;
        }

        // 验证动态场景的参数配置
        if (newScenarioType === 'dynamic' && newScenarioCalculator === 'tier-based') {
            // 验证 tier-based 配置
            if (!tierParamName.trim()) {
                toast.error('层级参数名称不能为空');
                return;
            }
            if (tierValues.length === 0) {
                toast.error('层级列表至少需要一个值');
                return;
            }
            // 验证层级值都是正数
            if (tierValues.some(v => v <= 0)) {
                toast.error('层级值必须是正数');
                return;
            }
        } else if (newScenarioType === 'dynamic' && newScenarioCalculator === 'step-based') {
            if (!stepBasedParamName.trim()) {
                toast.error('步长计费参数名称不能为空');
                return;
            }
            if (!Number.isFinite(stepBasedStepSize) || stepBasedStepSize <= 0) {
                toast.error('步长必须大于 0');
                return;
            }
            if (!Number.isFinite(stepBasedCostPerStep) || stepBasedCostPerStep <= 0) {
                toast.error('每步成本必须大于 0');
                return;
            }
            if (!Number.isFinite(stepBasedMinSteps) || stepBasedMinSteps < 0) {
                toast.error('最少计费步数不能小于 0');
                return;
            }
        } else if (newScenarioType === 'dynamic' && newScenarioParams.length > 0) {
            for (let i = 0; i < newScenarioParams.length; i++) {
                const param = newScenarioParams[i];
                if (!param.name.trim()) {
                    toast.error(`参数 ${i + 1} 的名称不能为空`);
                    return;
                }
                if (param.type === 'string' && param.default === '') {
                    toast.error(`参数 "${param.name}" 的默认值不能为空`);
                    return;
                }
            }
        }

        try {
            setSaving(true);
            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pricing: editedPricing.pricing,
                    providers: editedPricing.providers,
                    newScenario: {
                        name: newScenarioName.trim().toLowerCase().replace(/\s+/g, '-'),
                        type: newScenarioType,
                        description: newScenarioDescription.trim() || undefined,
                        url: newScenarioUrl.trim() || undefined,
                        credits: newScenarioType === 'fixed' ? newScenarioCredits : undefined,
                        calculator: newScenarioType === 'dynamic' && newScenarioCalculator ? newScenarioCalculator : undefined,
                        stepBasedPricing:
                            newScenarioType === 'dynamic' && newScenarioCalculator === 'step-based'
                                ? {
                                    paramName: stepBasedParamName.trim(),
                                    stepSize: stepBasedStepSize,
                                    costPerStep: stepBasedCostPerStep,
                                    minSteps: stepBasedMinSteps,
                                }
                                : undefined,
                        params: newScenarioType === 'dynamic' && newScenarioCalculator === 'tier-based'
                            ? {
                                tiers: {
                                    paramName: tierParamName,
                                    tiers: tierValues,
                                }
                            }
                            : newScenarioType === 'dynamic' && newScenarioCalculator === 'step-based'
                            ? {
                                [stepBasedParamName.trim()]: {
                                    type: 'number',
                                    default: stepBasedStepSize,
                                    min: 0,
                                },
                            }
                            : newScenarioType === 'dynamic' && newScenarioParams.length > 0
                            ? newScenarioParams.reduce((acc, param) => {
                                const paramConfig: any = {
                                    type: param.type,
                                    default: param.default,
                                };
                                if (param.type === 'string' && param.validValues && param.validValues.length > 0) {
                                    paramConfig.validValues = param.validValues;
                                }
                                if (param.type === 'number') {
                                    if (param.min !== undefined) paramConfig.min = param.min;
                                    if (param.max !== undefined) paramConfig.max = param.max;
                                }
                                acc[param.name] = paramConfig;
                                return acc;
                            }, {} as Record<string, any>)
                            : undefined,
                    },
                }),
            });

            const result = await response.json();

            if (result.code === 0) {
                toast.success('场景添加成功，已同步到所有 Provider');
                setShowAddScenarioDialog(false);
                setNewScenarioName('');
                setNewScenarioType('fixed');
                setNewScenarioDescription('');
                setNewScenarioUrl('');
                setNewScenarioCredits(2);
                setNewScenarioCalculator('');
                setNewScenarioParams([]);
                // 重置 tier-based 配置
                setTierParamName('num_images');
                setTierValues([5, 10, 15, 30]);
                setNewTierValue('');
                setStepBasedParamName('duration');
                setStepBasedStepSize(5);
                setStepBasedCostPerStep(0.01);
                setStepBasedMinSteps(1);
                await loadPricingInfo();
            } else {
                toast.error(result.message || '添加场景失败');
            }
        } catch (error: any) {
            console.error('Failed to add scenario:', error);
            toast.error('添加场景失败');
        } finally {
            setSaving(false);
        }
    };

    const openEditScenario = async (scenarioName: string) => {
        try {
            setLoadingScenarioDetail(true);
            setEditingScenarioName(scenarioName);
            setShowEditScenarioDialog(true);

            const resp = await fetch(`/api/admin/pricing?scenario=${encodeURIComponent(scenarioName)}`);
            const result = await resp.json();
            if (result.code !== 0) {
                toast.error(result.message || '加载场景详情失败');
                return;
            }

            const scenario = result.data?.scenario;
            setEditScenarioType(scenario?.type === 'dynamic' ? 'dynamic' : 'fixed');
            setEditScenarioDescription(scenario?.description || '');
            setEditScenarioUrl(scenario?.url || '');
            setEditScenarioCalculator(scenario?.calculator || '');
            setEditScenarioParamsJson(
                scenario?.params ? JSON.stringify(scenario.params, null, 2) : ''
            );
            setEditScenarioSaveTaskToDb(scenario?.saveTaskToDb !== undefined ? scenario.saveTaskToDb : true);
            setEditScenarioMediaType(scenario?.mediaType || 'image');
        } catch (e: any) {
            console.error('Failed to load scenario detail:', e);
            toast.error('加载场景详情失败');
        } finally {
            setLoadingScenarioDetail(false);
        }
    };

    const handleUpdateScenario = async () => {
        if (!editingScenarioName) return;

        if (!editScenarioType) {
            toast.error('场景类型是必需的');
            return;
        }

        let parsedParams: any = undefined;
        if (editScenarioType === 'dynamic' && editScenarioParamsJson.trim()) {
            try {
                parsedParams = JSON.parse(editScenarioParamsJson);
            } catch {
                toast.error('参数 JSON 格式错误，请检查后再保存');
                return;
            }
        }

        try {
            setSaving(true);
            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pricing: editedPricing.pricing,
                    providers: editedPricing.providers,
                    updateScenario: {
                        name: editingScenarioName,
                        type: editScenarioType,
                        description: editScenarioDescription.trim() || undefined,
                        url: editScenarioUrl.trim() || undefined,
                        calculator:
                            editScenarioType === 'dynamic' && editScenarioCalculator
                                ? editScenarioCalculator
                                : undefined,
                        params: editScenarioType === 'dynamic' ? parsedParams : undefined,
                        saveTaskToDb: editScenarioSaveTaskToDb,
                        mediaType: editScenarioMediaType,
                    },
                }),
            });

            const result = await response.json();
            if (result.code === 0) {
                toast.success('场景更新成功');
                setShowEditScenarioDialog(false);
                await loadPricingInfo();
            } else {
                toast.error(result.message || '场景更新失败');
            }
        } catch (e: any) {
            console.error('Failed to update scenario:', e);
            toast.error('场景更新失败');
        } finally {
            setSaving(false);
        }
    };

    const addScenarioParam = () => {
        setNewScenarioParams([...newScenarioParams, {
            name: '',
            type: 'string',
            default: '',
            validValues: [],
        }]);
    };

    const updateScenarioParam = (index: number, field: string, value: any) => {
        const updated = [...newScenarioParams];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };
        setNewScenarioParams(updated);
    };

    const removeScenarioParam = (index: number) => {
        setNewScenarioParams(newScenarioParams.filter((_, i) => i !== index));
    };

    const addValidValue = (paramIndex: number, value: string) => {
        if (!value.trim()) return;
        const updated = [...newScenarioParams];
        const param = updated[paramIndex];
        const validValues = param.validValues || [];
        if (!validValues.includes(value.trim())) {
            updated[paramIndex] = {
                ...param,
                validValues: [...validValues, value.trim()],
            };
            setNewScenarioParams(updated);
        }
    };

    const removeValidValue = (paramIndex: number, valueIndex: number) => {
        const updated = [...newScenarioParams];
        const param = updated[paramIndex];
        if (param.validValues) {
            updated[paramIndex] = {
                ...param,
                validValues: param.validValues.filter((_, i) => i !== valueIndex),
            };
            setNewScenarioParams(updated);
        }
    };

    // Tier-based 配置处理函数
    const addTierValue = () => {
        const value = parseFloat(newTierValue);
        if (isNaN(value) || value <= 0) {
            toast.error('层级值必须是正数');
            return;
        }
        if (tierValues.includes(value)) {
            toast.error('层级值已存在');
            return;
        }
        setTierValues([...tierValues, value].sort((a, b) => a - b));
        setNewTierValue('');
    };

    const removeTierValue = (value: number) => {
        setTierValues(tierValues.filter(v => v !== value));
    };


    // 根据计算器类型获取默认参数模板
    const getCalculatorDefaultParams = (calculatorType: string): Array<{
        name: string;
        type: 'string' | 'number' | 'boolean';
        default: string | number | boolean;
        validValues?: string[];
        min?: number;
        max?: number;
    }> => {
        switch (calculatorType) {
            case 'gpt-image-1':
                return [
                    {
                        name: 'size',
                        type: 'string',
                        default: '1024*1536',
                        validValues: ['1024*1024', '1024*1536', '1536*1024'],
                    },
                    {
                        name: 'quality',
                        type: 'string',
                        default: 'medium',
                        validValues: ['low', 'medium', 'high'],
                    },
                ];
            case 'per-layer':
                return [
                    {
                        name: 'num_layers',
                        type: 'number',
                        default: 8,
                        min: 1,
                        max: 8,
                    },
                ];
            case 'duration-based':
                return [
                    {
                        name: 'duration',
                        type: 'number',
                        default: 8,
                        min: 1,
                        max: 60,
                    },
                    {
                        name: 'generate_audio',
                        type: 'boolean',
                        default: false,
                    },
                ];
            case 'duration-block':
                return [
                    {
                        name: 'duration',
                        type: 'number',
                        default: 5,
                        min: 1,
                        max: 60,
                    },
                ];
            case 'duration-block-resolved':
                return [
                    {
                        name: 'duration',
                        type: 'number',
                        default: 10,
                        min: 5,
                        max: 30,
                    },
                    {
                        name: 'size',
                        type: 'string',
                        default: '1280*720',
                        validValues: ['1280*720', '1920*1080'],
                    },
                ];
            case 'step-based':
                return [
                    {
                        name: 'duration',
                        type: 'number',
                        default: 5,
                        min: 0,
                        max: 300,
                    },
                ];
            case 'seedance-duration':
                return [
                    {
                        name: 'duration',
                        type: 'number',
                        default: 5,
                        min: 5,
                        max: 12,
                    },
                    {
                        name: 'resolution',
                        type: 'string',
                        default: 'fast 720p',
                        validValues: ['fast 720p', 'fast 1080p', '720p', '480p'],
                    },
                    {
                        name: 'generate_audio',
                        type: 'boolean',
                        default: false,
                    },
                ];
            case 'tier-based':
                return [
                    {
                        name: 'tiers',
                        type: 'string',
                        default: JSON.stringify({
                            paramName: 'num_images',
                            tiers: [5, 10, 15, 30],
                        }),
                    },
                ];
            default:
                return [];
        }
    };

    // 处理计算器类型变化
    const handleCalculatorChange = (calculatorType: string) => {
        setNewScenarioCalculator(calculatorType);
        if (calculatorType === 'tier-based') {
            // 重置 tier-based 配置为默认值
            setTierParamName('num_images');
            setTierValues([5, 10, 15, 30]);
            setNewTierValue('');
            setNewScenarioParams([]);
        } else if (calculatorType === 'step-based') {
            setStepBasedParamName('duration');
            setStepBasedStepSize(5);
            setStepBasedCostPerStep(0.01);
            setStepBasedMinSteps(1);
            setNewScenarioParams(getCalculatorDefaultParams(calculatorType));
        } else if (calculatorType) {
            const defaultParams = getCalculatorDefaultParams(calculatorType);
            setNewScenarioParams(defaultParams);
        } else {
            setNewScenarioParams([]);
        }
    };

    const handleDeleteProvider = async (providerName: string) => {
        if (!editedPricing) return;

        if (!confirm(`确定要删除 Provider "${providerName}" 吗？`)) {
            return;
        }

        try {
            setSaving(true);
            if (activeTab === providerName) {
                setActiveTab('global');
            }

            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deleteProvider: { name: providerName },
                }),
            });
            const result = await response.json();

            if (result.code === 0) {
                toast.success('Provider 删除成功');
                await loadPricingInfo();
            } else {
                toast.error(result.message || 'Provider 删除失败');
            }
        } catch (e: any) {
            console.error('Failed to delete provider:', e);
            toast.error('Provider 删除失败');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteScenario = async (scenarioName: string) => {
        try {
            if (!confirm(`确定要删除场景 "${scenarioName}" 吗？此操作将从数据库和所有 Provider 中删除该场景。`)) {
                return;
            }

            setSaving(true);
            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deleteScenario: { name: scenarioName },
                }),
            });

            const result = await response.json();

            if (result.code === 0) {
                toast.success(`场景 "${scenarioName}" 删除成功`);
                await loadPricingInfo();
            } else {
                toast.error(result.message || '删除场景失败');
            }
        } catch (e: any) {
            console.error('Failed to delete scenario:', e);
            toast.error('删除场景失败');
        } finally {
            setSaving(false);
        }
    };

    const updatePricing = (field: string, value: number) => {
        if (!editedPricing) return;

        const updatedPricing = {
            ...editedPricing.pricing,
            [field]: value,
        };

        // 如果修改的是默认利润率，自动更新所有场景的利润率
        if (field === 'defaultProfitMargin') {
            const updatedProviders = editedPricing.providers.map((provider: any) => ({
                ...provider,
                scenarios: provider.scenarios.map((scenario: any) => ({
                    ...scenario,
                    profitMargin: value, // 使用新的默认利润率
                })),
            }));

            setEditedPricing({
                ...editedPricing,
                pricing: updatedPricing,
                providers: updatedProviders,
            });
        } else {
            setEditedPricing({
                ...editedPricing,
                pricing: updatedPricing,
            });
        }
    };

    const updateScenarioCost = (providerName: string, scenarioName: string, costPrice: number) => {
        if (!editedPricing) return;
        const updatedProviders = editedPricing.providers.map((provider: any) => {
            if (provider.name === providerName) {
                return {
                    ...provider,
                    scenarios: provider.scenarios.map((scenario: any) => {
                        if (scenario.name === scenarioName) {
                            return {
                                ...scenario,
                                costPrice,
                            };
                        }
                        return scenario;
                    }),
                };
            }
            return provider;
        });
        setEditedPricing({
            ...editedPricing,
            providers: updatedProviders,
        });
    };

    const updateScenarioMargin = (providerName: string, scenarioName: string, profitMargin: number) => {
        if (!editedPricing) return;
        const updatedProviders = editedPricing.providers.map((provider: any) => {
            if (provider.name === providerName) {
                return {
                    ...provider,
                    scenarios: provider.scenarios.map((scenario: any) => {
                        if (scenario.name === scenarioName) {
                            return {
                                ...scenario,
                                profitMargin,
                            };
                        }
                        return scenario;
                    }),
                };
            }
            return provider;
        });
        setEditedPricing({
            ...editedPricing,
            providers: updatedProviders,
        });
    };

    const updateScenarioStepBasedPricing = (
        providerName: string,
        scenarioName: string,
        updates: Partial<StepBasedPricingConfig>
    ) => {
        if (!editedPricing) return;
        const updatedProviders = editedPricing.providers.map((provider: any) => {
            if (provider.name === providerName) {
                return {
                    ...provider,
                    scenarios: provider.scenarios.map((scenario: any) => {
                        if (scenario.name === scenarioName) {
                            const nextStepPricing = {
                                ...(scenario.stepBasedPricing || {}),
                                ...updates,
                            };
                            return {
                                ...scenario,
                                stepBasedPricing: nextStepPricing,
                                costPrice:
                                    typeof nextStepPricing.costPerStep === 'number'
                                        ? nextStepPricing.costPerStep
                                        : scenario.costPrice,
                            };
                        }
                        return scenario;
                    }),
                };
            }
            return provider;
        });
        setEditedPricing({
            ...editedPricing,
            providers: updatedProviders,
        });
    };

    const updateParamCombinationCost = (
        providerName: string,
        scenarioName: string,
        paramKey: string,
        costPrice: number
    ) => {
        if (!editedPricing) return;
        const updatedProviders = editedPricing.providers.map((provider: any) => {
            if (provider.name === providerName) {
                return {
                    ...provider,
                    scenarios: provider.scenarios.map((scenario: any) => {
                        if (scenario.name === scenarioName) {
                            const updatedParamCombinations = scenario.paramCombinations?.map((param: any) => {
                                if (param.key === paramKey) {
                                    return {
                                        ...param,
                                        costPrice,
                                    };
                                }
                                return param;
                            }) || [];

                            return {
                                ...scenario,
                                paramCombinations: updatedParamCombinations,
                            };
                        }
                        return scenario;
                    }),
                };
            }
            return provider;
        });
        setEditedPricing({
            ...editedPricing,
            providers: updatedProviders,
        });
    };

    const updateParamCombinationMargin = (
        providerName: string,
        scenarioName: string,
        paramKey: string,
        profitMargin: number
    ) => {
        if (!editedPricing) return;
        const updatedProviders = editedPricing.providers.map((provider: any) => {
            if (provider.name === providerName) {
                return {
                    ...provider,
                    scenarios: provider.scenarios.map((scenario: any) => {
                        if (scenario.name === scenarioName) {
                            const updatedParamCombinations = scenario.paramCombinations?.map((param: any) => {
                                if (param.key === paramKey) {
                                    return {
                                        ...param,
                                        profitMargin,
                                    };
                                }
                                return param;
                            }) || [];

                            return {
                                ...scenario,
                                paramCombinations: updatedParamCombinations,
                            };
                        }
                        return scenario;
                    }),
                };
            }
            return provider;
        });
        setEditedPricing({
            ...editedPricing,
            providers: updatedProviders,
        });
    };

    const saveParamCombApiConfig = () => {
        if (!editedPricing || !editingParamCombProvider || !editingParamCombScenario || !editingParamCombKey) return;

        let requestParams: any[] = [];
        let responseMapping: any = null;
        let statusQueryParams: any[] = [];
        let statusQueryResponseMapping: any = null;
        let webhookConfig: any = null;

        try {
            if (paramCombRequestParamsJson.trim()) {
                requestParams = JSON.parse(paramCombRequestParamsJson);
            }
        } catch (e) {
            toast.error('请求参数配置 JSON 格式错误');
            return;
        }

        try {
            if (paramCombResponseMappingJson.trim()) {
                responseMapping = JSON.parse(paramCombResponseMappingJson);
            }
        } catch (e) {
            toast.error('响应映射配置 JSON 格式错误');
            return;
        }

        try {
            if (paramCombStatusQueryParamsJson.trim()) {
                statusQueryParams = JSON.parse(paramCombStatusQueryParamsJson);
            }
        } catch (e) {
            toast.error('Status 查询参数配置 JSON 格式错误');
            return;
        }

        try {
            if (paramCombStatusQueryResponseMappingJson.trim()) {
                statusQueryResponseMapping = JSON.parse(paramCombStatusQueryResponseMappingJson);
            }
        } catch (e) {
            toast.error('Status 查询响应映射配置 JSON 格式错误');
            return;
        }

        try {
            if (paramCombWebhookConfigJson.trim()) {
                webhookConfig = JSON.parse(paramCombWebhookConfigJson);
            }
        } catch (e) {
            toast.error('Webhook 配置 JSON 格式错误');
            return;
        }

        const updatedProviders = editedPricing.providers.map((provider: any) => {
            if (provider.name === editingParamCombProvider) {
                return {
                    ...provider,
                    scenarios: provider.scenarios.map((scenario: any) => {
                        if (scenario.name === editingParamCombScenario) {
                            const updatedParamCombinations = scenario.paramCombinations?.map((param: any) => {
                                if (param.key === editingParamCombKey) {
                                    return {
                                        ...param,
                                        apiEndpoint: paramCombApiEndpoint || undefined,
                                        requestParams: requestParams.length > 0 ? requestParams : undefined,
                                        responseMapping: responseMapping || undefined,
                                        statusQueryEndpoint: paramCombStatusQueryEndpoint || undefined,
                                        statusQueryParams: statusQueryParams.length > 0 ? statusQueryParams : undefined,
                                        statusQueryResponseMapping: statusQueryResponseMapping || undefined,
                                        webhookConfig: webhookConfig || undefined,
                                        minDuration: paramCombMinDuration,
                                        minDurationCredits: paramCombMinDurationCredits,
                                        creditsPerSecond: paramCombCreditsPerSecond,
                                    };
                                }
                                return param;
                            }) || [];

                            return {
                                ...scenario,
                                paramCombinations: updatedParamCombinations,
                            };
                        }
                        return scenario;
                    }),
                };
            }
            return provider;
        });

        setEditedPricing({
            ...editedPricing,
            providers: updatedProviders,
        });

        setShowParamCombApiConfigDialog(false);
        toast.success('参数组合 API 配置已更新（请点击保存按钮保存到服务器）');
    };

    const saveProviderConfig = () => {
        if (!editedPricing || !editingProviderName) return;

        let defaultHeaders: Record<string, string> | null = null;
        let requestParams: any[] = [];
        let responseMapping: any = null;
        let statusQueryParams: any[] = [];
        let statusQueryResponseMapping: any = null;
        let webhookConfig: any = null;

        try {
            if (providerDefaultHeadersJson.trim()) {
                defaultHeaders = JSON.parse(providerDefaultHeadersJson);
            }
        } catch (e) {
            toast.error('默认请求头配置 JSON 格式错误');
            return;
        }

        try {
            if (providerRequestParamsJson.trim()) {
                requestParams = JSON.parse(providerRequestParamsJson);
            }
        } catch (e) {
            toast.error('Provider 请求参数配置 JSON 格式错误');
            return;
        }

        try {
            if (providerResponseMappingJson.trim()) {
                responseMapping = JSON.parse(providerResponseMappingJson);
            }
        } catch (e) {
            toast.error('Provider 响应映射配置 JSON 格式错误');
            return;
        }

        try {
            if (providerStatusQueryParamsJson.trim()) {
                statusQueryParams = JSON.parse(providerStatusQueryParamsJson);
            }
        } catch (e) {
            toast.error('Status 查询参数配置 JSON 格式错误');
            return;
        }

        try {
            if (providerStatusQueryResponseMappingJson.trim()) {
                statusQueryResponseMapping = JSON.parse(providerStatusQueryResponseMappingJson);
            }
        } catch (e) {
            toast.error('Status 查询响应映射配置 JSON 格式错误');
            return;
        }

        try {
            if (providerWebhookConfigJson.trim()) {
                webhookConfig = JSON.parse(providerWebhookConfigJson);
            }
        } catch (e) {
            toast.error('Webhook 配置 JSON 格式错误');
            return;
        }

        const updatedProviders = editedPricing.providers.map((provider: any) => {
            if (provider.name === editingProviderName) {
                return {
                    ...provider,
                    resultMode: providerResultMode,
                    baseUrl: providerBaseUrl || undefined,
                    apiEndpoint: providerApiEndpoint || undefined,
                    apiKey: providerApiKey || undefined,
                    timeout: providerTimeout || undefined,
                    defaultHeaders: defaultHeaders || undefined,
                    requestParams: requestParams.length > 0 ? requestParams : undefined,
                    responseMapping: responseMapping || undefined,
                    statusQueryEndpoint: providerStatusQueryEndpoint || undefined,
                    statusQueryParams: statusQueryParams.length > 0 ? statusQueryParams : undefined,
                    statusQueryResponseMapping: statusQueryResponseMapping || undefined,
                    webhookConfig: webhookConfig || undefined,
                };
            }
            return provider;
        });

        setEditedPricing({
            ...editedPricing,
            providers: updatedProviders,
        });

        setShowProviderConfigDialog(false);
        toast.success('Provider 配置已更新（请点击保存按钮保存到服务器）');
    };

    const saveScenarioApiConfig = () => {
        if (!editedPricing || !editingScenarioApiName || !editingScenarioApiProvider) return;

        let requestParams: any[] = [];
        let responseMapping: any = null;
        let statusQueryParams: any[] = [];
        let statusQueryResponseMapping: any = null;
        let requestBodyTemplate: any = null;
        let webhookConfig: any = null;

        try {
            if (scenarioRequestParamsJson.trim()) {
                requestParams = JSON.parse(scenarioRequestParamsJson);
            }
        } catch (e) {
            toast.error('请求参数配置 JSON 格式错误');
            return;
        }

        try {
            if (scenarioRequestBodyTemplateJson.trim()) {
                requestBodyTemplate = JSON.parse(scenarioRequestBodyTemplateJson);
            }
        } catch (e) {
            toast.error('请求体模板 JSON 格式错误');
            return;
        }

        try {
            if (scenarioResponseMappingJson.trim()) {
                responseMapping = JSON.parse(scenarioResponseMappingJson);
            }
        } catch (e) {
            toast.error('响应映射配置 JSON 格式错误');
            return;
        }

        try {
            if (scenarioStatusQueryParamsJson.trim()) {
                statusQueryParams = JSON.parse(scenarioStatusQueryParamsJson);
            }
        } catch (e) {
            toast.error('Status 查询参数配置 JSON 格式错误');
            return;
        }

        try {
            if (scenarioStatusQueryResponseMappingJson.trim()) {
                statusQueryResponseMapping = JSON.parse(scenarioStatusQueryResponseMappingJson);
            }
        } catch (e) {
            toast.error('Status 查询响应映射配置 JSON 格式错误');
            return;
        }

        try {
            if (scenarioWebhookConfigJson.trim()) {
                webhookConfig = JSON.parse(scenarioWebhookConfigJson);
            }
        } catch (e) {
            toast.error('Webhook 配置 JSON 格式错误');
            return;
        }

        const updatedProviders = editedPricing.providers.map((provider: any) => {
            if (provider.name === editingScenarioApiProvider) {
                return {
                    ...provider,
                    scenarios: provider.scenarios.map((scenario: any) => {
                        if (scenario.name === editingScenarioApiName) {
                            return {
                                ...scenario,
                                apiEndpoint: scenarioApiEndpoint || undefined,
                                requestParams: requestParams.length > 0 ? requestParams : undefined,
                                responseMapping: responseMapping || undefined,
                                statusQueryEndpoint: scenarioStatusQueryEndpoint || undefined,
                                statusQueryParams: statusQueryParams.length > 0 ? statusQueryParams : undefined,
                                statusQueryResponseMapping: statusQueryResponseMapping || undefined,
                                webhookConfig: webhookConfig || undefined,
                                minDuration: scenarioMinDuration,
                                minDurationCredits: scenarioMinDurationCredits,
                                creditsPerSecond: scenarioCreditsPerSecond,
                                normalizeSizeToX: scenarioNormalizeSizeToX || undefined,
                                requestBodyTemplate: requestBodyTemplate || undefined,
                            };
                        }
                        return scenario;
                    }),
                };
            }
            return provider;
        });

        setEditedPricing({
            ...editedPricing,
            providers: updatedProviders,
        });

        setShowScenarioApiConfigDialog(false);
        toast.success('场景 API 配置已更新（请点击保存按钮保存到服务器）');
    };

    const handleImportProviderConfig = async () => {
        if (!importFile || !importingProviderName || !editedPricing) {
            toast.error('请选择要导入的文件');
            return;
        }

        try {
            const fileContent = await importFile.text();
            const importedConfig = JSON.parse(fileContent);

            // 验证导入的配置格式
            if (!importedConfig || typeof importedConfig !== 'object') {
                toast.error('无效的配置文件格式');
                return;
            }

            // 更新 provider 配置
            const updatedProviders = editedPricing.providers.map((provider: any) => {
                if (provider.name === importingProviderName) {
                    // 先复制所有现有字段
                    const updatedProvider: any = {
                        ...provider,
                    };

                    // 调试日志：打印导入前的状态
                    console.log('[Import] Before import:', {
                        providerName: provider.name,
                        hasApiKey: !!provider.apiKey,
                        hasBaseUrl: !!provider.baseUrl,
                        scenariosCount: provider.scenarios?.length || 0,
                    });

                    // 调试日志：打印导入的配置
                    console.log('[Import] Imported config:', {
                        hasBaseUrl: !!importedConfig.baseUrl,
                        hasApiKey: !!importedConfig.apiKey,
                        hasScenarios: !!importedConfig.scenarios,
                        scenariosCount: importedConfig.scenarios ? Object.keys(importedConfig.scenarios).length : 0,
                    });

                    // 更新基础配置（包括所有 provider 级别的 API 配置）
                    if (importedConfig.baseUrl !== undefined) {
                        updatedProvider.baseUrl = importedConfig.baseUrl;
                    }
                    if (importedConfig.apiEndpoint !== undefined) {
                        updatedProvider.apiEndpoint = importedConfig.apiEndpoint;
                    }
                    if (importedConfig.apiKey !== undefined) {
                        updatedProvider.apiKey = importedConfig.apiKey;
                    }
                    if (importedConfig.timeout !== undefined) {
                        updatedProvider.timeout = importedConfig.timeout;
                    }
                    if (importedConfig.defaultHeaders !== undefined) {
                        updatedProvider.defaultHeaders = importedConfig.defaultHeaders;
                    }
                    // Provider 级别的状态查询配置
                    if (importedConfig.statusQueryEndpoint !== undefined) {
                        updatedProvider.statusQueryEndpoint = importedConfig.statusQueryEndpoint;
                    }
                    if (importedConfig.statusQueryParams !== undefined) {
                        updatedProvider.statusQueryParams = importedConfig.statusQueryParams;
                    }
                    if (importedConfig.statusQueryResponseMapping !== undefined) {
                        updatedProvider.statusQueryResponseMapping = importedConfig.statusQueryResponseMapping;
                    }
                    if (importedConfig.webhookConfig !== undefined) {
                        updatedProvider.webhookConfig = importedConfig.webhookConfig;
                    }

                    // 更新场景配置
                    if (importedConfig.scenarios) {
                        // 如果 provider.scenarios 是数组（从 API 返回的格式），需要先转换为对象
                        let existingScenarios: Record<string, any> = {};
                        if (Array.isArray(provider.scenarios)) {
                            // 从数组格式转换为对象格式
                            provider.scenarios.forEach((scenario: any) => {
                                if (scenario.name) {
                                    existingScenarios[scenario.name] = scenario;
                                }
                            });
                        } else if (typeof provider.scenarios === 'object' && provider.scenarios !== null) {
                            existingScenarios = { ...provider.scenarios };
                        }

                        // 处理导入的 scenarios（可能是对象或数组）
                        if (Array.isArray(importedConfig.scenarios)) {
                            // 如果是数组，转换为对象
                            importedConfig.scenarios.forEach((scenario: any) => {
                                if (scenario.name && existingScenarios[scenario.name]) {
                                    existingScenarios[scenario.name] = {
                                        ...existingScenarios[scenario.name],
                                        ...scenario,
                                        name: undefined, // 移除 name，因为它是 key
                                    };
                                }
                            });
                        } else if (typeof importedConfig.scenarios === 'object') {
                            // 如果是对象，直接合并
                            Object.entries(importedConfig.scenarios).forEach(([scenarioName, scenarioConfig]: [string, any]) => {
                                if (existingScenarios[scenarioName]) {
                                    existingScenarios[scenarioName] = {
                                        ...existingScenarios[scenarioName],
                                        ...scenarioConfig,
                                    };
                                }
                            });
                        }

                        // 将对象格式转换回数组格式（前端代码期望数组格式）
                        updatedProvider.scenarios = Object.entries(existingScenarios).map(([scenarioName, scenarioConfig]: [string, any]) => ({
                            name: scenarioName,
                            ...scenarioConfig,
                        }));
                    }

                    // 调试日志：打印导入后的状态
                    console.log('[Import] After import:', {
                        providerName: updatedProvider.name,
                        hasApiKey: !!updatedProvider.apiKey,
                        hasBaseUrl: !!updatedProvider.baseUrl,
                        scenariosCount: updatedProvider.scenarios?.length || 0,
                        firstScenario: updatedProvider.scenarios?.[0] ? {
                            name: updatedProvider.scenarios[0].name,
                            hasApiEndpoint: !!updatedProvider.scenarios[0].apiEndpoint,
                            hasRequestParams: !!updatedProvider.scenarios[0].requestParams,
                        } : null,
                    });

                    return updatedProvider;
                }
                return provider;
            });

            setEditedPricing({
                ...editedPricing,
                providers: updatedProviders,
            });

            setShowImportProviderConfigDialog(false);
            setImportFile(null);
            toast.success(`Provider "${importingProviderName}" 的 API 配置已导入（请点击保存按钮保存到服务器）`);
        } catch (e: any) {
            console.error('Failed to import provider config:', e);
            toast.error(`导入失败: ${e.message || '配置文件格式错误'}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!pricingInfo || !editedPricing) {
        return <div>No pricing information available</div>;
    }

    const crumbs = [
        { title: 'Admin', url: '/admin' },
        { title: 'Pricing Configuration', is_active: true },
    ];

    // 获取所有场景列表（用于全局场景管理显示）
    const getAllScenarios = () => {
        const scenarioMap = new Map<string, any>();
        editedPricing.providers.forEach((provider: any) => {
            provider.scenarios.forEach((scenario: any) => {
                if (!scenarioMap.has(scenario.name)) {
                    scenarioMap.set(scenario.name, {
                        ...scenario,
                        providers: [provider.name],
                    });
                } else {
                    const existing = scenarioMap.get(scenario.name);
                    if (!existing.providers.includes(provider.name)) {
                        existing.providers.push(provider.name);
                    }
                }
            });
        });
        return Array.from(scenarioMap.values());
    };

    return (
        <>
            <Header crumbs={crumbs} />
            <Main>
                <MainHeader
                    title="积分价格配置"
                    description="配置每个 Provider 的场景价格和积分单价，系统会自动计算需要消耗的积分以保证利润率"
                />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full flex-wrap">
                        <TabsTrigger value="global">全局配置</TabsTrigger>
                        {editedPricing.providers.map((provider: any) => (
                            <TabsTrigger key={provider.name} value={provider.name}>
                                {provider.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* 第一个Tab：全局配置和场景管理 */}
                    <TabsContent value="global" className="space-y-6 mt-6">
                        {/* 全局价格配置 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    全局价格配置
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="creditUnitPrice">积分单价 (USD)</Label>
                                        <Input
                                            id="creditUnitPrice"
                                            type="number"
                                            step="0.0001"
                                            min="0.0001"
                                            value={editedPricing.pricing.creditUnitPrice}
                                            onChange={(e) => updatePricing('creditUnitPrice', parseFloat(e.target.value) || 0)}
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            每个积分折合的价格（USD）
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultProfitMargin">默认利润率 (%)</Label>
                                        <Input
                                            id="defaultProfitMargin"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="99"
                                            value={(editedPricing.pricing.defaultProfitMargin ?? 0) * 100}
                                            onChange={(e) => {
                                                const raw = parseFloat(e.target.value);
                                                const percent = isNaN(raw) ? 0 : Math.max(0, Math.min(99, raw));
                                                updatePricing('defaultProfitMargin', percent / 100);
                                            }}
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            默认利润率（0-99，如 30 表示 30%），用于计算售价
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultProvider">默认 Provider</Label>
                                        <Select
                                            value={
                                                editedPricing.pricing.defaultProvider ??
                                                editedPricing.providers[0]?.name ??
                                                ''
                                            }
                                            onValueChange={(value) =>
                                                setEditedPricing({
                                                    ...editedPricing,
                                                    pricing: {
                                                        ...editedPricing.pricing,
                                                        defaultProvider: value,
                                                    },
                                                })
                                            }
                                        >
                                            <SelectTrigger
                                                id="defaultProvider"
                                                className="w-full bg-background border border-border"
                                            >
                                                <SelectValue placeholder="选择默认 Provider" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border border-border shadow-lg">
                                                {editedPricing.providers.map((provider: any) => (
                                                    <SelectItem key={provider.name} value={provider.name}>
                                                        {provider.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-muted-foreground text-xs">
                                            系统调用场景时默认使用的 Provider，可在下方为单个场景单独指定默认 Provider。
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 场景管理 */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>场景管理</CardTitle>
                                    <div className="flex gap-2">
                                        <Dialog open={showAddProviderDialog} onOpenChange={setShowAddProviderDialog}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    添加 Provider
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>添加新的 Provider</DialogTitle>
                                                    <DialogDescription>
                                                        添加新的 Provider 后，系统会自动为所有场景创建默认价格配置
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="providerName">Provider 名称</Label>
                                                        <Input
                                                            id="providerName"
                                                            value={newProviderName}
                                                            onChange={(e) => setNewProviderName(e.target.value)}
                                                            placeholder="例如: OpenAI"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="providerKey">Provider Key (唯一标识)</Label>
                                                        <Input
                                                            id="providerKey"
                                                            value={newProviderKey}
                                                            onChange={(e) => setNewProviderKey(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                                            placeholder="例如: openai"
                                                        />
                                                        <p className="text-muted-foreground text-xs">
                                                            只能包含小写字母、数字和连字符
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="providerDescription">描述 (可选)</Label>
                                                        <Input
                                                            id="providerDescription"
                                                            value={newProviderDescription}
                                                            onChange={(e) => setNewProviderDescription(e.target.value)}
                                                            placeholder="例如: OpenAI AI Provider"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowAddProviderDialog(false);
                                                            setNewProviderName('');
                                                            setNewProviderKey('');
                                                            setNewProviderDescription('');
                                                        }}
                                                    >
                                                        取消
                                                    </Button>
                                                    <Button onClick={handleAddProvider} disabled={saving}>
                                                        {saving ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                添加中...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                添加
                                                            </>
                                                        )}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <Dialog modal={false} open={showAddScenarioDialog} onOpenChange={setShowAddScenarioDialog}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    添加场景
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle>添加新场景</DialogTitle>
                                                    <DialogDescription>
                                                        添加新场景后，系统会自动为所有 Provider 创建默认价格配置
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="scenarioName">场景名称 *</Label>
                                                        <Input
                                                            id="scenarioName"
                                                            value={newScenarioName}
                                                            onChange={(e) => setNewScenarioName(e.target.value)}
                                                            placeholder="例如: new-image-generator"
                                                        />
                                                        <p className="text-muted-foreground text-xs">
                                                            只能包含小写字母、数字和连字符，会自动转换
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="scenarioType">场景类型 *</Label>
                                                        <Select value={newScenarioType} onValueChange={(value: 'fixed' | 'dynamic') => setNewScenarioType(value)}>
                                                            <SelectTrigger id="scenarioType">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent portal={false}>
                                                                <SelectItem value="fixed">固定积分 (Fixed)</SelectItem>
                                                                <SelectItem value="dynamic">动态积分 (Dynamic)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="scenarioDescription">描述 (可选)</Label>
                                                        <Input
                                                            id="scenarioDescription"
                                                            value={newScenarioDescription}
                                                            onChange={(e) => setNewScenarioDescription(e.target.value)}
                                                            placeholder="例如: 新的图片生成器"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="scenarioUrl">API URL (可选)</Label>
                                                        <Input
                                                            id="scenarioUrl"
                                                            value={newScenarioUrl}
                                                            onChange={(e) => setNewScenarioUrl(e.target.value)}
                                                            placeholder="例如: /api/ai/new-image-generator"
                                                        />
                                                    </div>
                                                    {newScenarioType === 'fixed' && (
                                                        <div className="space-y-2">
                                                            <Label htmlFor="scenarioCredits">积分值 *</Label>
                                                            <Input
                                                                id="scenarioCredits"
                                                                type="number"
                                                                min="1"
                                                                value={newScenarioCredits}
                                                                onChange={(e) => setNewScenarioCredits(parseInt(e.target.value) || 2)}
                                                            />
                                                        </div>
                                                    )}
                                                    {newScenarioType === 'dynamic' && (
                                                        <>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="scenarioCalculator">计算器类型 (可选)</Label>
                                                                <Select value={newScenarioCalculator} onValueChange={handleCalculatorChange}>
                                                                    <SelectTrigger id="scenarioCalculator">
                                                                        <SelectValue placeholder="选择计算器类型" />
                                                                    </SelectTrigger>
                                                                    <SelectContent portal={false}>
                                                                        <SelectItem value="gpt-image-1">GPT Image 1</SelectItem>
                                                                        <SelectItem value="per-layer">按层数计算 (Per Layer)</SelectItem>
                                                                        <SelectItem value="duration-based">基于时长 (Duration Based)</SelectItem>
                                                                        <SelectItem value="duration-block">时长块 (Duration Block)</SelectItem>
                                                                        <SelectItem value="duration-block-resolved">时长块和分辨率 (Duration Block Resolved)</SelectItem>
                                                                        <SelectItem value="step-based">按步长计费 (Step Based)</SelectItem>
                                                                        <SelectItem value="seedance-duration">Seedance 时长 (Seedance Duration)</SelectItem>
                                                                        <SelectItem value="tier-based">层级计费 (Tier Based)</SelectItem>
                                                                        <SelectItem value="param-combination-pricing">参数组合定价 (Param Combination Pricing)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <p className="text-muted-foreground text-xs">
                                                                    动态场景需要指定计算器类型，用于计算积分消耗
                                                                </p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label>参数配置</Label>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={addScenarioParam}
                                                                    >
                                                                        <Plus className="mr-2 h-4 w-4" />
                                                                        添加参数
                                                                    </Button>
                                                                </div>
                                                                {newScenarioParams.length > 0 && (
                                                                    <div className="space-y-3 border rounded-lg p-3">
                                                                        {newScenarioParams.map((param, index) => (
                                                                            <div key={index} className="space-y-2 border-b pb-3 last:border-b-0">
                                                                                <div className="flex items-start gap-2">
                                                                                    <div className="flex-1 space-y-2">
                                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                            <div className="space-y-1">
                                                                                                <Label className="text-xs">参数名称 *</Label>
                                                                                                <Input
                                                                                                    placeholder="例如: size"
                                                                                                    value={param.name}
                                                                                                    onChange={(e) => updateScenarioParam(index, 'name', e.target.value)}
                                                                                                    className="h-8"
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <Label className="text-xs">参数类型 *</Label>
                                                                                                <Select
                                                                                                    value={param.type}
                                                                                                    onValueChange={(value: 'string' | 'number' | 'boolean') => {
                                                                                                        const updated = { ...param, type: value };
                                                                                                        if (value === 'number') {
                                                                                                            updated.default = 0;
                                                                                                            updated.validValues = undefined;
                                                                                                        } else if (value === 'boolean') {
                                                                                                            updated.default = false;
                                                                                                            updated.validValues = undefined;
                                                                                                        } else {
                                                                                                            updated.default = '';
                                                                                                            updated.validValues = [];
                                                                                                        }
                                                                                                        updateScenarioParam(index, 'type', value);
                                                                                                        updateScenarioParam(index, 'default', updated.default);
                                                                                                        if (updated.validValues === undefined) {
                                                                                                            const params = [...newScenarioParams];
                                                                                                            params[index] = updated;
                                                                                                            setNewScenarioParams(params);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <SelectTrigger className="h-8">
                                                                                                        <SelectValue />
                                                                                                    </SelectTrigger>
                                                                                                    <SelectContent portal={false}>
                                                                                                        <SelectItem value="string">字符串</SelectItem>
                                                                                                        <SelectItem value="number">数字</SelectItem>
                                                                                                        <SelectItem value="boolean">布尔值</SelectItem>
                                                                                                    </SelectContent>
                                                                                                </Select>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="space-y-1">
                                                                                            <Label className="text-xs">默认值 *</Label>
                                                                                            {param.type === 'boolean' ? (
                                                                                                <Select
                                                                                                    value={String(param.default)}
                                                                                                    onValueChange={(value) => updateScenarioParam(index, 'default', value === 'true')}
                                                                                                >
                                                                                                    <SelectTrigger className="h-8">
                                                                                                        <SelectValue />
                                                                                                    </SelectTrigger>
                                                                                                    <SelectContent portal={false}>
                                                                                                        <SelectItem value="true">true</SelectItem>
                                                                                                        <SelectItem value="false">false</SelectItem>
                                                                                                    </SelectContent>
                                                                                                </Select>
                                                                                            ) : param.type === 'number' ? (
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    value={typeof param.default === 'number' ? param.default : 0}
                                                                                                    onChange={(e) => updateScenarioParam(index, 'default', parseFloat(e.target.value) || 0)}
                                                                                                    className="h-8"
                                                                                                />
                                                                                            ) : (
                                                                                                <Input
                                                                                                    placeholder="默认值"
                                                                                                    value={typeof param.default === 'string' ? param.default : ''}
                                                                                                    onChange={(e) => updateScenarioParam(index, 'default', e.target.value)}
                                                                                                    className="h-8"
                                                                                                />
                                                                                            )}
                                                                                        </div>
                                                                                        {param.type === 'string' && (
                                                                                            <div className="space-y-1">
                                                                                                <Label className="text-xs">有效值列表 (可选)</Label>
                                                                                                <div className="flex gap-2">
                                                                                                    <Input
                                                                                                        placeholder="输入有效值后按回车"
                                                                                                        className="h-8"
                                                                                                        onKeyDown={(e) => {
                                                                                                            if (e.key === 'Enter') {
                                                                                                                e.preventDefault();
                                                                                                                addValidValue(index, e.currentTarget.value);
                                                                                                                e.currentTarget.value = '';
                                                                                                            }
                                                                                                        }}
                                                                                                    />
                                                                                                </div>
                                                                                                {param.validValues && param.validValues.length > 0 && (
                                                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                                                        {param.validValues.map((value, valueIndex) => (
                                                                                                            <span
                                                                                                                key={valueIndex}
                                                                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                                                                                                            >
                                                                                                                {value}
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() => removeValidValue(index, valueIndex)}
                                                                                                                    className="hover:text-destructive"
                                                                                                                >
                                                                                                                    <X className="h-3 w-3" />
                                                                                                                </button>
                                                                                                            </span>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                        {param.type === 'number' && (
                                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                                <div className="space-y-1">
                                                                                                    <Label className="text-xs">最小值</Label>
                                                                                                    <Input
                                                                                                        type="number"
                                                                                                        value={param.min ?? ''}
                                                                                                        onChange={(e) => updateScenarioParam(index, 'min', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                                                                        className="h-8"
                                                                                                        placeholder="min"
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="space-y-1">
                                                                                                    <Label className="text-xs">最大值</Label>
                                                                                                    <Input
                                                                                                        type="number"
                                                                                                        value={param.max ?? ''}
                                                                                                        onChange={(e) => updateScenarioParam(index, 'max', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                                                                        className="h-8"
                                                                                                        placeholder="max"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => removeScenarioParam(index)}
                                                                                        className="text-destructive hover:text-destructive"
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Tier-based 配置界面 */}
                                                            {newScenarioCalculator === 'tier-based' && (
                                                                <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="tierParamName">层级参数名称 *</Label>
                                                                        <Input
                                                                            id="tierParamName"
                                                                            value={tierParamName}
                                                                            onChange={(e) => setTierParamName(e.target.value)}
                                                                            placeholder="例如: num_images, duration"
                                                                            className="h-9"
                                                                        />
                                                                        <p className="text-muted-foreground text-xs">
                                                                            指定需要按层级计费的参数名称
                                                                        </p>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>层级列表 *</Label>
                                                                        <div className="flex gap-2">
                                                                            <Input
                                                                                type="number"
                                                                                value={newTierValue}
                                                                                onChange={(e) => setNewTierValue(e.target.value)}
                                                                                placeholder="输入层级值"
                                                                                className="h-9"
                                                                                onKeyPress={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        e.preventDefault();
                                                                                        addTierValue();
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={addTierValue}
                                                                            >
                                                                                <Plus className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                        {tierValues.length > 0 && (
                                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                                {tierValues.map((value) => (
                                                                                    <div
                                                                                        key={value}
                                                                                        className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm"
                                                                                    >
                                                                                        <span>{value}</span>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                                                                                            onClick={() => removeTierValue(value)}
                                                                                        >
                                                                                            <X className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        <p className="text-muted-foreground text-xs">
                                                                            添加层级值（如 5, 10, 15, 30），系统会自动向上取整到最近的层级
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {newScenarioCalculator === 'step-based' && (
                                                                <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                                                                    <div className="grid gap-4 md:grid-cols-2">
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="stepBasedParamName">计费参数名称 *</Label>
                                                                            <Input
                                                                                id="stepBasedParamName"
                                                                                value={stepBasedParamName}
                                                                                onChange={(e) => setStepBasedParamName(e.target.value)}
                                                                                placeholder="例如: duration"
                                                                                className="h-9"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="stepBasedStepSize">步长 *</Label>
                                                                            <Input
                                                                                id="stepBasedStepSize"
                                                                                type="number"
                                                                                min="0.0001"
                                                                                step="1"
                                                                                value={stepBasedStepSize}
                                                                                onChange={(e) => setStepBasedStepSize(parseFloat(e.target.value) || 0)}
                                                                                className="h-9"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="stepBasedCostPerStep">每步成本 (USD) *</Label>
                                                                            <Input
                                                                                id="stepBasedCostPerStep"
                                                                                type="number"
                                                                                min="0.0001"
                                                                                step="0.0001"
                                                                                value={stepBasedCostPerStep}
                                                                                onChange={(e) => setStepBasedCostPerStep(parseFloat(e.target.value) || 0)}
                                                                                className="h-9"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label htmlFor="stepBasedMinSteps">最少计费步数</Label>
                                                                            <Input
                                                                                id="stepBasedMinSteps"
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                value={stepBasedMinSteps}
                                                                                onChange={(e) => setStepBasedMinSteps(parseInt(e.target.value) || 0)}
                                                                                className="h-9"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-muted-foreground text-xs">
                                                                        系统会按 `ceil(参数值 / 步长)` 向上取整计费，并至少按最少计费步数收费。
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowAddScenarioDialog(false);
                                                            setNewScenarioName('');
                                                            setNewScenarioType('fixed');
                                                            setNewScenarioDescription('');
                                                            setNewScenarioUrl('');
                                                            setNewScenarioCredits(2);
                                                            setNewScenarioCalculator('');
                                                            setNewScenarioParams([]);
                                                            // 重置 tier-based 配置
                                                            setTierParamName('num_images');
                                                            setTierValues([5, 10, 15, 30]);
                                                            setNewTierValue('');
                                                            setStepBasedParamName('duration');
                                                            setStepBasedStepSize(5);
                                                            setStepBasedCostPerStep(0.01);
                                                            setStepBasedMinSteps(1);
                                                        }}
                                                    >
                                                        取消
                                                    </Button>
                                                    <Button onClick={handleAddScenario} disabled={saving}>
                                                        {saving ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                添加中...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                添加
                                                            </>
                                                        )}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>场景名称</TableHead>
                                            <TableHead>类型</TableHead>
                                            <TableHead>媒体类型</TableHead>
                                            <TableHead>描述</TableHead>
                                            <TableHead>当前 Provider</TableHead>
                                            <TableHead className="w-24">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getAllScenarios().map((scenario: any) => {
                                            const availableProviders: string[] = scenario.providers || [];
                                            const scenarioDefaultProvider =
                                                editedPricing.pricing.scenarioDefaultProviders?.[scenario.name] ??
                                                editedPricing.pricing.defaultProvider ??
                                                availableProviders[0] ??
                                                '';

                                            return (
                                                <TableRow key={scenario.name}>
                                                    <TableCell className="font-medium">{scenario.name}</TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`px-2 py-1 rounded text-xs ${scenario.type === 'fixed'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                                }`}
                                                        >
                                                            {scenario.type === 'fixed' ? '固定' : '动态'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                                            {scenario.mediaType || 'image'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {scenario.description || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={scenarioDefaultProvider}
                                                            onValueChange={(value) => {
                                                                setEditedPricing((prev: any) => {
                                                                    const current = prev ?? editedPricing;
                                                                    const currentScenarioDefaults =
                                                                        current.pricing.scenarioDefaultProviders || {};
                                                                    return {
                                                                        ...current,
                                                                        pricing: {
                                                                            ...current.pricing,
                                                                            scenarioDefaultProviders: {
                                                                                ...currentScenarioDefaults,
                                                                                [scenario.name]: value,
                                                                            },
                                                                        },
                                                                    };
                                                                });
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-48 bg-background border border-border">
                                                                <SelectValue placeholder="选择 Provider" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-background border border-border shadow-lg">
                                                                {availableProviders.map((providerName: string) => (
                                                                    <SelectItem
                                                                        key={providerName}
                                                                        value={providerName}
                                                                    >
                                                                        {providerName}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditScenario(scenario.name)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteScenario(scenario.name)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* 编辑场景弹窗 */}
                        <Dialog modal={false} open={showEditScenarioDialog} onOpenChange={setShowEditScenarioDialog}>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>编辑场景</DialogTitle>
                                    <DialogDescription>
                                        修改场景的 costs 配置（类型/积分/url/参数等）。保存后会同步到系统配置。
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label>场景名称</Label>
                                        <Input value={editingScenarioName} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editScenarioType">场景类型 *</Label>
                                        <Select
                                            value={editScenarioType}
                                            onValueChange={(value: 'fixed' | 'dynamic') => setEditScenarioType(value)}
                                            disabled={loadingScenarioDetail}
                                        >
                                            <SelectTrigger id="editScenarioType">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent portal={false} className="bg-background border border-border shadow-lg z-[1000]">
                                                <SelectItem value="fixed">固定积分 (Fixed)</SelectItem>
                                                <SelectItem value="dynamic">动态积分 (Dynamic)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editScenarioDescription">描述 (可选)</Label>
                                        <Input
                                            id="editScenarioDescription"
                                            value={editScenarioDescription}
                                            onChange={(e) => setEditScenarioDescription(e.target.value)}
                                            disabled={loadingScenarioDetail}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editScenarioUrl">API URL (可选)</Label>
                                        <Input
                                            id="editScenarioUrl"
                                            value={editScenarioUrl}
                                            onChange={(e) => setEditScenarioUrl(e.target.value)}
                                            disabled={loadingScenarioDetail}
                                            placeholder="例如: /api/ai/xxx"
                                        />
                                    </div>

                                    {editScenarioType === 'dynamic' && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="editScenarioCalculator">计算器类型 (可选)</Label>
                                                <Select
                                                    value={editScenarioCalculator}
                                                    onValueChange={setEditScenarioCalculator}
                                                    disabled={loadingScenarioDetail}
                                                >
                                                    <SelectTrigger id="editScenarioCalculator">
                                                        <SelectValue placeholder="选择计算器类型" />
                                                    </SelectTrigger>
                                                    <SelectContent portal={false} className="bg-background border border-border shadow-lg z-[1000]">
                                                        <SelectItem value="gpt-image-1">GPT Image 1</SelectItem>
                                                        <SelectItem value="per-layer">按层数计算 (Per Layer)</SelectItem>
                                                        <SelectItem value="duration-based">基于时长 (Duration Based)</SelectItem>
                                                        <SelectItem value="duration-block">时长块 (Duration Block)</SelectItem>
                                                        <SelectItem value="duration-block-resolved">时长块和分辨率 (Duration Block Resolved)</SelectItem>
                                                        <SelectItem value="step-based">按步长计费 (Step Based)</SelectItem>
                                                        <SelectItem value="seedance-duration">Seedance 时长 (Seedance Duration)</SelectItem>
                                                        <SelectItem value="tier-based">层级计费 (Tier Based)</SelectItem>
                                                        <SelectItem value="param-combination-pricing">参数组合定价 (Param Combination Pricing)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="editScenarioParams">参数 (JSON，可选)</Label>
                                                <Textarea
                                                    id="editScenarioParams"
                                                    value={editScenarioParamsJson}
                                                    onChange={(e) => setEditScenarioParamsJson(e.target.value)}
                                                    disabled={loadingScenarioDetail}
                                                    className="font-mono text-xs"
                                                    placeholder='例如: { "size": { "type": "string", "default": "1024*1024" } }'
                                                />
                                                <p className="text-muted-foreground text-xs">
                                                    为避免丢失复杂规则，这里使用 JSON 直接编辑（留空表示不设置 params）。
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="editScenarioMediaType">媒体类型</Label>
                                        <Select
                                            value={editScenarioMediaType}
                                            onValueChange={(value: 'image' | 'video' | 'music' | 'text' | 'speech') => setEditScenarioMediaType(value)}
                                            disabled={loadingScenarioDetail}
                                        >
                                            <SelectTrigger id="editScenarioMediaType">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent portal={false} className="bg-background border border-border shadow-lg z-[1000]">
                                                <SelectItem value="image">图片 (Image)</SelectItem>
                                                <SelectItem value="video">视频 (Video)</SelectItem>
                                                <SelectItem value="music">音乐 (Music)</SelectItem>
                                                <SelectItem value="text">文本 (Text)</SelectItem>
                                                <SelectItem value="speech">语音 (Speech)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1 flex-1">
                                                <Label htmlFor="editScenarioSaveTaskToDb" className="text-base font-medium">
                                                    保存 Task 信息到数据库
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    是否将任务信息保存到数据库（默认开启）
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 ml-4">
                                                <span className={`text-sm font-medium ${editScenarioSaveTaskToDb ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {editScenarioSaveTaskToDb ? '已开启' : '已关闭'}
                                                </span>
                                                <Switch
                                                    id="editScenarioSaveTaskToDb"
                                                    checked={editScenarioSaveTaskToDb}
                                                    onCheckedChange={setEditScenarioSaveTaskToDb}
                                                    disabled={loadingScenarioDetail}
                                                    className="scale-125"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowEditScenarioDialog(false)}
                                        disabled={saving}
                                    >
                                        取消
                                    </Button>
                                    <Button onClick={handleUpdateScenario} disabled={saving || loadingScenarioDetail}>
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                保存中...
                                            </>
                                        ) : (
                                            '保存'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    {/* Provider Tabs */}
                    {editedPricing.providers.map((provider: any) => (
                        <TabsContent key={provider.name} value={provider.name} className="mt-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{provider.name}</CardTitle>
                                            {provider.description && (
                                                <p className="text-muted-foreground text-sm">{provider.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingProviderName(provider.name);
                                                    setProviderResultMode((provider as any).resultMode || 'async');
                                                    setProviderBaseUrl((provider as any).baseUrl || '');
                                                    setProviderApiEndpoint((provider as any).apiEndpoint || '');
                                                    setProviderApiKey((provider as any).apiKey || '');
                                                    setProviderTimeout((provider as any).timeout || 30000);
                                                    setProviderDefaultHeadersJson(
                                                        (provider as any).defaultHeaders
                                                            ? JSON.stringify((provider as any).defaultHeaders, null, 2)
                                                            : ''
                                                    );
                                                    setProviderRequestParamsJson(
                                                        (provider as any).requestParams
                                                            ? JSON.stringify((provider as any).requestParams, null, 2)
                                                            : ''
                                                    );
                                                    setProviderResponseMappingJson(
                                                        (provider as any).responseMapping
                                                            ? JSON.stringify((provider as any).responseMapping, null, 2)
                                                            : ''
                                                    );
                                                    setProviderStatusQueryEndpoint((provider as any).statusQueryEndpoint || '');
                                                    setProviderStatusQueryParamsJson(
                                                        (provider as any).statusQueryParams
                                                            ? JSON.stringify((provider as any).statusQueryParams, null, 2)
                                                            : ''
                                                    );
                                                    setProviderStatusQueryResponseMappingJson(
                                                        (provider as any).statusQueryResponseMapping
                                                            ? JSON.stringify((provider as any).statusQueryResponseMapping, null, 2)
                                                            : ''
                                                    );
                                                    setProviderWebhookConfigJson(
                                                        (provider as any).webhookConfig
                                                            ? JSON.stringify((provider as any).webhookConfig, null, 2)
                                                            : ''
                                                    );
                                                    setShowProviderConfigDialog(true);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4 mr-1" />
                                                配置
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setImportingProviderName(provider.name);
                                                    setImportFile(null);
                                                    setShowImportProviderConfigDialog(true);
                                                }}
                                            >
                                                <Upload className="h-4 w-4 mr-1" />
                                                导入
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteProvider(provider.name)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>场景名称</TableHead>
                                                <TableHead>媒体类型</TableHead>
                                                <TableHead>成本价格 (USD)</TableHead>
                                                <TableHead>利润率 (%)</TableHead>
                                                <TableHead>售价 (USD)</TableHead>
                                                <TableHead>消耗积分</TableHead>
                                                <TableHead>API Endpoint</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {provider.scenarios.map((scenario: any) => {
                                                const scenarioKey = `${provider.name}-${scenario.name}`;
                                                const isExpanded = expandedScenarios.has(scenarioKey);
                                                const hasParamCombinations =
                                                    scenario.paramCombinations && scenario.paramCombinations.length > 0;
                                                // 检查是否为按秒计费的场景（duration-based 或 seedance-duration）
                                                const isPerSecondScenario = scenario.calculator === 'duration-based' || scenario.calculator === 'seedance-duration';
                                                // 检查是否为 tier-based 场景
                                                // 如果有 tierPricing 字段，也认为是 tier-based 场景（兼容旧数据）
                                                const isTierBased = scenario.calculator === 'tier-based' || (scenario.tierPricing && Object.keys(scenario.tierPricing).length > 0);
                                                const isStepBased =
                                                    scenario.calculator === 'step-based' ||
                                                    Boolean(scenario.stepBasedPricing);
                                                // 只要是 tier-based 场景就隐藏主行的价格配置，即使 tierPricing 为空
                                                const hasTierPricing = isTierBased;

                                                return (
                                                    <Fragment key={scenarioKey}>
                                                        <TableRow>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    {(hasParamCombinations || isTierBased || isStepBased) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                const newExpanded = new Set(expandedScenarios);
                                                                                if (isExpanded) {
                                                                                    newExpanded.delete(scenarioKey);
                                                                                } else {
                                                                                    newExpanded.add(scenarioKey);
                                                                                }
                                                                                setExpandedScenarios(newExpanded);
                                                                            }}
                                                                            className="p-1 hover:bg-muted rounded"
                                                                        >
                                                                            {isExpanded ? (
                                                                                <ChevronDown className="h-4 w-4" />
                                                                            ) : (
                                                                                <ChevronRight className="h-4 w-4" />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            {scenario.name}
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 px-2 text-xs"
                                                                                onClick={() => {
                                                                                    setEditingScenarioApiName(scenario.name);
                                                                                    setEditingScenarioApiProvider(provider.name);
                                                                                    setScenarioApiEndpoint((scenario as any).apiEndpoint || '');
                                                                                    setScenarioRequestParamsJson(
                                                                                        (scenario as any).requestParams
                                                                                            ? JSON.stringify((scenario as any).requestParams, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setScenarioResponseMappingJson(
                                                                                        (scenario as any).responseMapping
                                                                                            ? JSON.stringify((scenario as any).responseMapping, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setScenarioStatusQueryEndpoint((scenario as any).statusQueryEndpoint || '');
                                                                                    setScenarioStatusQueryParamsJson(
                                                                                        (scenario as any).statusQueryParams
                                                                                            ? JSON.stringify((scenario as any).statusQueryParams, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setScenarioStatusQueryResponseMappingJson(
                                                                                        (scenario as any).statusQueryResponseMapping
                                                                                            ? JSON.stringify((scenario as any).statusQueryResponseMapping, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setScenarioWebhookConfigJson(
                                                                                        (scenario as any).webhookConfig
                                                                                            ? JSON.stringify((scenario as any).webhookConfig, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setScenarioMinDuration((scenario as any).minDuration);
                                                                                    setScenarioMinDurationCredits((scenario as any).minDurationCredits);
                                                                                    setScenarioCreditsPerSecond((scenario as any).creditsPerSecond);
                                                                                    setScenarioNormalizeSizeToX(Boolean((scenario as any).normalizeSizeToX));
                                                                                    setScenarioRequestBodyTemplateJson(
                                                                                        (scenario as any).requestBodyTemplate
                                                                                            ? JSON.stringify((scenario as any).requestBodyTemplate, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setShowScenarioApiConfigDialog(true);
                                                                                }}
                                                                            >
                                                                                API 配置
                                                                            </Button>
                                                                        </div>
                                                                        {scenario.description && (
                                                                            <p className="text-muted-foreground text-xs">
                                                                                {scenario.description}
                                                                            </p>
                                                                        )}
                                                                        {isTierBased && (
                                                                            <p className="text-muted-foreground text-xs mt-1">
                                                                                层级计费 - {scenario.tierPricing ? Object.keys(scenario.tierPricing).length : 0} 个层级
                                                                            </p>
                                                                        )}
                                                                        {hasParamCombinations && (
                                                                            <p className="text-muted-foreground text-xs mt-1">
                                                                                动态场景 - {scenario.paramCombinations.length} 种参数组合
                                                                            </p>
                                                                        )}
                                                                        {isStepBased && scenario.stepBasedPricing && (
                                                                            <p className="text-muted-foreground text-xs mt-1">
                                                                                步长计费 - 参数 {scenario.stepBasedPricing.paramName}，步长 {scenario.stepBasedPricing.stepSize}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                                                    {(scenario as any).mediaType || 'image'}
                                                                </span>
                                                            </TableCell>
                                                            {hasTierPricing ? (
                                                                <>
                                                                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                                                                        层级定价配置请在下方层级列表中设置
                                                                    </TableCell>
                                                                </>
                                                            ) : isStepBased ? (
                                                                <>
                                                                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                                                                        步长计费配置请在下方步长配置中设置
                                                                    </TableCell>
                                                                </>
                                                            ) : hasParamCombinations ? (
                                                                <>
                                                                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                                                                        价格配置请在下方参数组合中设置
                                                                    </TableCell>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-1">
                                                                            <Input
                                                                                type="text"
                                                                                value={costPriceInputs.get(`${provider.name}-${scenario.name}`) ?? (scenario.costPrice != null ? String(scenario.costPrice) : '')}
                                                                                className="w-24 no-spinner"
                                                                                style={{
                                                                                    WebkitAppearance: 'textfield',
                                                                                    MozAppearance: 'textfield',
                                                                                    appearance: 'textfield',
                                                                                }}
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value;
                                                                                    const inputKey = `${provider.name}-${scenario.name}`;
                                                                                    // 允许所有数字输入，包括中间状态（如 "0." 或 "-"）
                                                                                    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                                                                        // 更新临时输入值
                                                                                        setCostPriceInputs(prev => {
                                                                                            const newMap = new Map(prev);
                                                                                            newMap.set(inputKey, val);
                                                                                            return newMap;
                                                                                        });
                                                                                        // 如果是有效数字，同时更新实际值
                                                                                        if (val !== '' && val !== '.' && val !== '-') {
                                                                                            const num = parseFloat(val);
                                                                                            if (!isNaN(num) && num >= 0) {
                                                                                                updateScenarioCost(provider.name, scenario.name, num);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    const inputKey = `${provider.name}-${scenario.name}`;
                                                                                    const val = e.target.value.trim();
                                                                                    // 清除临时输入值
                                                                                    setCostPriceInputs(prev => {
                                                                                        const newMap = new Map(prev);
                                                                                        newMap.delete(inputKey);
                                                                                        return newMap;
                                                                                    });
                                                                                    // 验证并更新最终值
                                                                                    if (val === '' || val === '.' || val === '-') {
                                                                                        updateScenarioCost(provider.name, scenario.name, 0);
                                                                                    } else {
                                                                                        const num = parseFloat(val);
                                                                                        if (isNaN(num) || num < 0) {
                                                                                            updateScenarioCost(provider.name, scenario.name, 0);
                                                                                        } else {
                                                                                            updateScenarioCost(provider.name, scenario.name, num);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                placeholder="默认价格"
                                                                            />
                                                                            {isPerSecondScenario && (
                                                                                <span className="text-xs text-muted-foreground">/s</span>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.1"
                                                                            min="0"
                                                                            max="99"
                                                                            value={(scenario.profitMargin ?? 0) * 100}
                                                                            onChange={(e) => {
                                                                                const raw = parseFloat(e.target.value);
                                                                                const percent = isNaN(raw) ? 0 : Math.max(0, Math.min(99, raw));
                                                                                updateScenarioMargin(
                                                                                    provider.name,
                                                                                    scenario.name,
                                                                                    percent / 100
                                                                                );
                                                                            }}
                                                                            className="w-24"
                                                                            placeholder="默认利润率 (%)"
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-1">
                                                                            {(
                                                                                scenario.costPrice / (1 - scenario.profitMargin)
                                                                            ).toFixed(4)}
                                                                            {isPerSecondScenario && (
                                                                                <span className="text-xs text-muted-foreground">/s</span>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {Math.ceil(
                                                                            (scenario.costPrice / (1 - scenario.profitMargin)) /
                                                                            editedPricing.pricing.creditUnitPrice
                                                                        )}
                                                                    </TableCell>
                                                                </>
                                                            )}
                                                        </TableRow>
                                                        {isExpanded &&
                                                            hasParamCombinations &&
                                                            !isTierBased &&
                                                            !isStepBased &&
                                                            scenario.paramCombinations.map((paramComb: any) => {
                                                                // 检查是否为按 layer 计费的场景（如 qwen-image-layered）
                                                                const isPerLayerScenario = scenario.name === 'qwen-image-layered' || paramComb.params?.num_layers !== undefined;
                                                                const numLayers = paramComb.params?.num_layers || 1;
                                                                // 检查是否为按秒计费的场景（duration-based 且有 generate_audio，或 seedance-duration）
                                                                const isPerSecondScenario =
                                                                    (scenario.calculator === 'duration-based' && paramComb.params?.generate_audio !== undefined) ||
                                                                    scenario.calculator === 'seedance-duration';
                                                                // 检查是否为按5秒块计费的场景（duration-block-resolved）
                                                                const isPer5SecondsScenario = scenario.calculator === 'duration-block-resolved';

                                                                // 对于按 layer 计费的场景，costPrice 是单 layer 成本，需要乘以 num_layers 计算总成本
                                                                // 对于按秒计费的场景，costPrice 是每秒成本
                                                                const totalCost = isPerLayerScenario ? paramComb.costPrice * numLayers : paramComb.costPrice;
                                                                const totalSellingPrice = totalCost / (1 - paramComb.profitMargin);
                                                                const totalCredits = Math.ceil(totalSellingPrice / editedPricing.pricing.creditUnitPrice);
                                                                // 对于按秒计费的场景，计算每秒积分
                                                                const creditsPerSecond = isPerSecondScenario ? Math.ceil((paramComb.costPrice / (1 - paramComb.profitMargin)) / editedPricing.pricing.creditUnitPrice) : null;

                                                                return (
                                                                    <TableRow
                                                                        key={`${scenario.name}-${paramComb.key}`}
                                                                        className="bg-muted/30"
                                                                    >
                                                                        <TableCell className="pl-12">
                                                                            <div className="text-sm">
                                                                                {Object.entries(paramComb.params).map(
                                                                                    ([key, value]) => (
                                                                                        <span key={key} className="mr-2">
                                                                                            <span className="text-muted-foreground">
                                                                                                {key}:
                                                                                            </span>{' '}
                                                                                            <span className="font-medium">
                                                                                                {String(value)}
                                                                                            </span>
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                                {isPerLayerScenario && (
                                                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                                                        (单 layer 成本)
                                                                                    </span>
                                                                                )}
                                                                                {isPerSecondScenario && (
                                                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                                                        (每秒成本)
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="space-y-1">
                                                                                <div className="flex items-center gap-1">
                                                                                    <Input
                                                                                        type="text"
                                                                                        value={costPriceInputs.get(`${provider.name}-${scenario.name}-${paramComb.key}`) ?? (paramComb.costPrice != null ? String(paramComb.costPrice) : '')}
                                                                                        className="w-24 no-spinner"
                                                                                        style={{
                                                                                            WebkitAppearance: 'textfield',
                                                                                            MozAppearance: 'textfield',
                                                                                            appearance: 'textfield',
                                                                                        }}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value;
                                                                                            const inputKey = `${provider.name}-${scenario.name}-${paramComb.key}`;
                                                                                            // 允许所有数字输入，包括中间状态（如 "0." 或 "-"）
                                                                                            if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                                                                                // 更新临时输入值
                                                                                                setCostPriceInputs(prev => {
                                                                                                    const newMap = new Map(prev);
                                                                                                    newMap.set(inputKey, val);
                                                                                                    return newMap;
                                                                                                });
                                                                                                // 如果是有效数字，同时更新实际值
                                                                                                if (val !== '' && val !== '.' && val !== '-') {
                                                                                                    const num = parseFloat(val);
                                                                                                    if (!isNaN(num) && num >= 0) {
                                                                                                        updateParamCombinationCost(provider.name, scenario.name, paramComb.key, num);
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                        onBlur={(e) => {
                                                                                            const inputKey = `${provider.name}-${scenario.name}-${paramComb.key}`;
                                                                                            const val = e.target.value.trim();
                                                                                            // 清除临时输入值
                                                                                            setCostPriceInputs(prev => {
                                                                                                const newMap = new Map(prev);
                                                                                                newMap.delete(inputKey);
                                                                                                return newMap;
                                                                                            });
                                                                                            // 验证并更新最终值
                                                                                            if (val === '' || val === '.' || val === '-') {
                                                                                                updateParamCombinationCost(provider.name, scenario.name, paramComb.key, 0);
                                                                                            } else {
                                                                                                const num = parseFloat(val);
                                                                                                if (isNaN(num) || num < 0) {
                                                                                                    updateParamCombinationCost(provider.name, scenario.name, paramComb.key, 0);
                                                                                                } else {
                                                                                                    updateParamCombinationCost(provider.name, scenario.name, paramComb.key, num);
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                        placeholder={isPerLayerScenario ? "单 layer 成本" : isPerSecondScenario ? "每秒成本" : isPer5SecondsScenario ? "每5秒成本" : "成本价格"}
                                                                                    />
                                                                                    {isPerSecondScenario && (
                                                                                        <span className="text-xs text-muted-foreground">/s</span>
                                                                                    )}
                                                                                    {isPer5SecondsScenario && (
                                                                                        <span className="text-xs text-muted-foreground">/5s</span>
                                                                                    )}
                                                                                </div>
                                                                                {isPerLayerScenario && (
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        总成本: {(totalCost).toFixed(4)} (×{numLayers})
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.1"
                                                                                min="0"
                                                                                max="99"
                                                                                value={(paramComb.profitMargin ?? 0) * 100}
                                                                                onChange={(e) => {
                                                                                    const raw = parseFloat(e.target.value);
                                                                                    const percent = isNaN(raw) ? 0 : Math.max(0, Math.min(99, raw));
                                                                                    updateParamCombinationMargin(
                                                                                        provider.name,
                                                                                        scenario.name,
                                                                                        paramComb.key,
                                                                                        percent / 100
                                                                                    );
                                                                                }}
                                                                                className="w-24"
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-1">
                                                                                {totalSellingPrice.toFixed(4)}
                                                                                {isPerSecondScenario && (
                                                                                    <span className="text-xs text-muted-foreground">/s</span>
                                                                                )}
                                                                                {isPer5SecondsScenario && (
                                                                                    <span className="text-xs text-muted-foreground">/5s</span>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {isPerSecondScenario ? (
                                                                                <div className="flex items-center gap-1">
                                                                                    {creditsPerSecond}
                                                                                    <span className="text-xs text-muted-foreground">/s</span>
                                                                                </div>
                                                                            ) : isPer5SecondsScenario ? (
                                                                                <div className="flex items-center gap-1">
                                                                                    {totalCredits}
                                                                                    <span className="text-xs text-muted-foreground">/5s</span>
                                                                                </div>
                                                                            ) : (
                                                                                totalCredits
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-7 px-2 text-xs"
                                                                                onClick={() => {
                                                                                    setEditingParamCombProvider(provider.name);
                                                                                    setEditingParamCombScenario(scenario.name);
                                                                                    setEditingParamCombKey(paramComb.key);
                                                                                    setParamCombApiEndpoint(paramComb.apiEndpoint || '');
                                                                                    setParamCombRequestParamsJson(
                                                                                        paramComb.requestParams
                                                                                            ? JSON.stringify(paramComb.requestParams, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setParamCombResponseMappingJson(
                                                                                        paramComb.responseMapping
                                                                                            ? JSON.stringify(paramComb.responseMapping, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setParamCombStatusQueryEndpoint(paramComb.statusQueryEndpoint || '');
                                                                                    setParamCombStatusQueryParamsJson(
                                                                                        paramComb.statusQueryParams
                                                                                            ? JSON.stringify(paramComb.statusQueryParams, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setParamCombStatusQueryResponseMappingJson(
                                                                                        paramComb.statusQueryResponseMapping
                                                                                            ? JSON.stringify(paramComb.statusQueryResponseMapping, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setParamCombWebhookConfigJson(
                                                                                        paramComb.webhookConfig
                                                                                            ? JSON.stringify(paramComb.webhookConfig, null, 2)
                                                                                            : ''
                                                                                    );
                                                                                    setParamCombMinDuration(paramComb.minDuration);
                                                                                    setParamCombMinDurationCredits(paramComb.minDurationCredits);
                                                                                    setParamCombCreditsPerSecond(paramComb.creditsPerSecond);
                                                                                    setShowParamCombApiConfigDialog(true);
                                                                                }}
                                                                            >
                                                                                API 配置
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        {isExpanded && isStepBased && scenario.stepBasedPricing && (() => {
                                                            const stepPricing = scenario.stepBasedPricing as StepBasedPricingConfig;
                                                            const sellingPrice =
                                                                stepPricing.costPerStep / (1 - scenario.profitMargin);
                                                            const credits = Math.ceil(
                                                                sellingPrice / editedPricing.pricing.creditUnitPrice
                                                            );

                                                            return (
                                                                <TableRow className="bg-muted/30">
                                                                    <TableCell className="pl-12">
                                                                        <div className="space-y-1 text-sm">
                                                                            <div>
                                                                                <span className="text-muted-foreground">参数名:</span>{' '}
                                                                                <span className="font-medium">{stepPricing.paramName}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-muted-foreground">规则:</span>{' '}
                                                                                按 `ceil({stepPricing.paramName} / {stepPricing.stepSize})` 向上取整
                                                                                {stepPricing.minSteps !== undefined ? `，至少 ${stepPricing.minSteps} 步` : ''}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                                                            step-based
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <div className="space-y-2 min-w-[220px]">
                                                                            <div className="space-y-1">
                                                                                <Label className="text-xs">每步成本 (USD)</Label>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="0.0001"
                                                                                    step="0.0001"
                                                                                    value={stepPricing.costPerStep}
                                                                                    onChange={(e) => updateScenarioStepBasedPricing(provider.name, scenario.name, {
                                                                                        costPerStep: parseFloat(e.target.value) || 0,
                                                                                    })}
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">步长</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min="0.0001"
                                                                                        step="1"
                                                                                        value={stepPricing.stepSize}
                                                                                        onChange={(e) => updateScenarioStepBasedPricing(provider.name, scenario.name, {
                                                                                            stepSize: parseFloat(e.target.value) || 0,
                                                                                        })}
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">最少步数</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="1"
                                                                                        value={stepPricing.minSteps ?? 0}
                                                                                        onChange={(e) => updateScenarioStepBasedPricing(provider.name, scenario.name, {
                                                                                            minSteps: parseInt(e.target.value) || 0,
                                                                                        })}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <Label className="text-xs">计费参数名</Label>
                                                                                <Input
                                                                                    value={stepPricing.paramName}
                                                                                    onChange={(e) => updateScenarioStepBasedPricing(provider.name, scenario.name, {
                                                                                        paramName: e.target.value,
                                                                                    })}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.1"
                                                                            min="0"
                                                                            max="99"
                                                                            value={(scenario.profitMargin ?? 0) * 100}
                                                                            onChange={(e) => {
                                                                                const raw = parseFloat(e.target.value);
                                                                                const percent = isNaN(raw) ? 0 : Math.max(0, Math.min(99, raw));
                                                                                updateScenarioMargin(provider.name, scenario.name, percent / 100);
                                                                            }}
                                                                            className="w-24"
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>${sellingPrice.toFixed(4)}</TableCell>
                                                                    <TableCell>{credits}</TableCell>
                                                                    <TableCell className="text-sm text-muted-foreground">
                                                                        {(scenario as any).apiEndpoint || '-'}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })()}

                                                        {/* Tier-based 层级定价表格 */}
                                                        {isExpanded &&
                                                            isTierBased &&
                                                            scenario.tierPricing &&
                                                            Object.entries(scenario.tierPricing)
                                                                .sort(([a], [b]) => Number(a) - Number(b))
                                                                .map(([tier, tierConfig]: [string, any]) => {
                                                                    const tierNum = Number(tier);
                                                                    const tierKey = `${provider.name}-${scenario.name}-tier-${tier}`;
                                                                    const margin = tierConfig.profitMargin ?? editedPricing.pricing.defaultProfitMargin;
                                                                    const sellingPrice = tierConfig.costPrice / (1 - margin);
                                                                    const credits = Math.ceil(sellingPrice / editedPricing.pricing.creditUnitPrice);

                                                                    return (
                                                                        <TableRow key={tierKey} className="bg-muted/30">
                                                                            <TableCell className="pl-12">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary font-medium">
                                                                                        层级 {tier}
                                                                                    </span>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                                                                    {(scenario as any).mediaType || 'image'}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.001"
                                                                                    value={tierConfig.costPrice}
                                                                                    className="w-24"
                                                                                    onChange={(e) => {
                                                                                        const newCost = parseFloat(e.target.value) || 0;
                                                                                        if (!editedPricing) return;
                                                                                        const updatedProviders = editedPricing.providers.map((p: any) => {
                                                                                            if (p.name === provider.name) {
                                                                                                return {
                                                                                                    ...p,
                                                                                                    scenarios: p.scenarios.map((s: any) => {
                                                                                                        if (s.name === scenario.name) {
                                                                                                            return {
                                                                                                                ...s,
                                                                                                                tierPricing: {
                                                                                                                    ...s.tierPricing,
                                                                                                                    [tier]: {
                                                                                                                        ...s.tierPricing[tier],
                                                                                                                        costPrice: newCost,
                                                                                                                    },
                                                                                                                },
                                                                                                            };
                                                                                                        }
                                                                                                        return s;
                                                                                                    }),
                                                                                                };
                                                                                            }
                                                                                            return p;
                                                                                        });
                                                                                        setEditedPricing({
                                                                                            ...editedPricing,
                                                                                            providers: updatedProviders,
                                                                                        });
                                                                                    }}
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    value={(margin * 100).toFixed(0)}
                                                                                    className="w-20"
                                                                                    onChange={(e) => {
                                                                                        const newMargin = parseFloat(e.target.value) / 100 || 0;
                                                                                        if (!editedPricing) return;
                                                                                        const updatedProviders = editedPricing.providers.map((p: any) => {
                                                                                            if (p.name === provider.name) {
                                                                                                return {
                                                                                                    ...p,
                                                                                                    scenarios: p.scenarios.map((s: any) => {
                                                                                                        if (s.name === scenario.name) {
                                                                                                            return {
                                                                                                                ...s,
                                                                                                                tierPricing: {
                                                                                                                    ...s.tierPricing,
                                                                                                                    [tier]: {
                                                                                                                        ...s.tierPricing[tier],
                                                                                                                        profitMargin: newMargin,
                                                                                                                    },
                                                                                                                },
                                                                                                            };
                                                                                                        }
                                                                                                        return s;
                                                                                                    }),
                                                                                                };
                                                                                            }
                                                                                            return p;
                                                                                        });
                                                                                        setEditedPricing({
                                                                                            ...editedPricing,
                                                                                            providers: updatedProviders,
                                                                                        });
                                                                                    }}
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell className="text-sm">
                                                                                ${sellingPrice.toFixed(4)}
                                                                            </TableCell>
                                                                            <TableCell className="text-sm font-medium">
                                                                                {credits}
                                                                            </TableCell>
                                                                            <TableCell className="text-sm text-muted-foreground">
                                                                                {tierConfig.apiEndpoint || '-'}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                    </Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>

                {/* 保存按钮 */}
                <div className="flex justify-end mt-6">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>

                {/* 参数组合 API 配置对话框 */}
                <Dialog open={showParamCombApiConfigDialog} onOpenChange={setShowParamCombApiConfigDialog}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>配置参数组合 API: {editingParamCombKey}</DialogTitle>
                            <DialogDescription>
                                配置参数组合的 API 端点、请求参数映射和响应解析规则（覆盖场景级别的配置）
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="paramCombApiEndpoint">API Endpoint</Label>
                                <Input
                                    id="paramCombApiEndpoint"
                                    value={paramCombApiEndpoint}
                                    onChange={(e) => setParamCombApiEndpoint(e.target.value)}
                                    placeholder="/api/v3/..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    参数组合的 API 端点（覆盖场景的默认端点）
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paramCombRequestParams">请求参数映射 (JSON)</Label>
                                <Textarea
                                    id="paramCombRequestParams"
                                    value={paramCombRequestParamsJson}
                                    onChange={(e) => setParamCombRequestParamsJson(e.target.value)}
                                    placeholder='[{"name": "prompt", "source": "body", "value": "prompt", "type": "string", "required": true}]'
                                    className="font-mono text-sm"
                                    rows={8}
                                />
                                <p className="text-xs text-muted-foreground">
                                    请求参数映射配置（JSON 数组）。source 可选值：body, query, header, path, static
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paramCombResponseMapping">响应映射 (JSON)</Label>
                                <Textarea
                                    id="paramCombResponseMapping"
                                    value={paramCombResponseMappingJson}
                                    onChange={(e) => setParamCombResponseMappingJson(e.target.value)}
                                    placeholder='{"format": "json", "requestIdPath": "data.id", "outputPath": "data.outputs[0]", "errorPath": "error.message", "statusPath": "data.status", "successStatus": ["completed", "success"]}'
                                    className="font-mono text-sm"
                                    rows={8}
                                />
                                <p className="text-xs text-muted-foreground">
                                    响应解析配置（JSON 对象）。format 可选值：json, text, binary
                                </p>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold mb-4">最小时长积分计算配置</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="paramCombMinDuration">最小时长（秒）</Label>
                                        <Input
                                            id="paramCombMinDuration"
                                            type="number"
                                            value={paramCombMinDuration ?? ''}
                                            onChange={(e) => setParamCombMinDuration(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="5"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            小于此时长按最小时长计算积分（例如：5秒）
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paramCombMinDurationCredits">最小时长积分</Label>
                                        <Input
                                            id="paramCombMinDurationCredits"
                                            type="number"
                                            value={paramCombMinDurationCredits ?? ''}
                                            onChange={(e) => setParamCombMinDurationCredits(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="100"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            最小时长对应的积分（当视频时长 ≤ 最小时长时使用）
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paramCombCreditsPerSecond">每秒积分</Label>
                                        <Input
                                            id="paramCombCreditsPerSecond"
                                            type="number"
                                            value={paramCombCreditsPerSecond ?? ''}
                                            onChange={(e) => setParamCombCreditsPerSecond(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="20"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            超过最小时长后，每秒消耗的积分（当视频时长 &gt; 最小时长时使用）
                                        </p>
                                    </div>
                                    <div className="bg-muted p-3 rounded-md">
                                        <p className="text-xs text-muted-foreground">
                                            <strong>计算规则：</strong><br />
                                            • 如果视频时长 ≤ 最小时长，积分 = 最小时长积分<br />
                                            • 如果视频时长 &gt; 最小时长，积分 = 最小时长积分 + (视频时长 - 最小时长) × 每秒积分<br />
                                            <br />
                                            <strong>示例：</strong>最小时长=5秒，最小时长积分=100，每秒积分=20<br />
                                            • 3秒视频：积分 = 100<br />
                                            • 8秒视频：积分 = 100 + (8-5) × 20 = 160
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold mb-4">Status 查询配置（覆盖场景级别的配置）</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="paramCombStatusQueryEndpoint">Status 查询端点</Label>
                                        <Input
                                            id="paramCombStatusQueryEndpoint"
                                            value={paramCombStatusQueryEndpoint}
                                            onChange={(e) => setParamCombStatusQueryEndpoint(e.target.value)}
                                            placeholder={'/api/v3/predictions/{taskId}/result'}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Status 查询 API 端点（支持 {'{taskId}'} 或 :taskId 占位符）
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paramCombStatusQueryParams">Status 查询参数映射 (JSON)</Label>
                                        <Textarea
                                            id="paramCombStatusQueryParams"
                                            value={paramCombStatusQueryParamsJson}
                                            onChange={(e) => setParamCombStatusQueryParamsJson(e.target.value)}
                                            placeholder='[{"name": "taskId", "source": "query", "value": "taskId", "type": "string", "required": true}]'
                                            className="font-mono text-sm"
                                            rows={6}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Status 查询请求参数映射（JSON 数组）。source 可选值：query, header, path, static
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paramCombStatusQueryResponseMapping">Status 查询响应映射 (JSON)</Label>
                                        <Textarea
                                            id="paramCombStatusQueryResponseMapping"
                                            value={paramCombStatusQueryResponseMappingJson}
                                            onChange={(e) => setParamCombStatusQueryResponseMappingJson(e.target.value)}
                                            placeholder='{"format": "json", "statusPath": "data.data.status", "outputPath": "data.data.outputs[0]", "errorPath": "error.message", "successStatus": ["completed", "success"], "failureStatus": ["failed", "error"]}'
                                            className="font-mono text-sm"
                                            rows={6}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Status 查询响应解析配置（JSON 对象）。format 可选值：json, text, binary
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paramCombWebhookConfig">Webhook 配置 (JSON)</Label>
                                        <Textarea
                                            id="paramCombWebhookConfig"
                                            value={paramCombWebhookConfigJson}
                                            onChange={(e) => setParamCombWebhookConfigJson(e.target.value)}
                                            placeholder='{"enabled": true, "source": "query", "paramName": "webhook", "responseMapping": {"format": "json", "requestIdPath": "id", "statusPath": "status", "outputPath": "outputs[0]"}}'
                                            className="font-mono text-sm"
                                            rows={6}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            参数组合级 webhook 配置（JSON 对象）。source 可选值：body, query, header
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowParamCombApiConfigDialog(false)}>
                                取消
                            </Button>
                            <Button onClick={saveParamCombApiConfig}>
                                保存
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Provider 配置对话框 */}
                <Dialog modal={false} open={showProviderConfigDialog} onOpenChange={setShowProviderConfigDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>配置 Provider: {editingProviderName}</DialogTitle>
                            <DialogDescription>
                                配置 Provider 的 API 基础 URL、端点、API Key 等
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="providerBaseUrl">Base URL</Label>
                                <Input
                                    id="providerBaseUrl"
                                    value={providerBaseUrl}
                                    onChange={(e) => setProviderBaseUrl(e.target.value)}
                                    placeholder="https://api.wavespeed.ai"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Provider 的 API 基础 URL（如 https://api.wavespeed.ai）
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="providerApiEndpoint">API Endpoint</Label>
                                <Input
                                    id="providerApiEndpoint"
                                    value={providerApiEndpoint}
                                    onChange={(e) => setProviderApiEndpoint(e.target.value)}
                                    placeholder="/api/v3/..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    默认 API 端点（如果场景没有单独配置则使用此值）
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="providerApiKey">API Key</Label>
                                <Input
                                    id="providerApiKey"
                                    type="password"
                                    value={providerApiKey}
                                    onChange={(e) => setProviderApiKey(e.target.value)}
                                    placeholder="输入 API Key"
                                />
                                <p className="text-xs text-muted-foreground">
                                    直接输入 API Key 值（将直接存储在配置中，不会从环境变量读取）
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="providerTimeout">请求超时时间 (毫秒)</Label>
                                <Input
                                    id="providerTimeout"
                                    type="number"
                                    value={providerTimeout}
                                    onChange={(e) => setProviderTimeout(parseInt(e.target.value) || 30000)}
                                    placeholder="30000"
                                />
                                <p className="text-xs text-muted-foreground">
                                    API 请求的超时时间，默认 30000 毫秒（30 秒）
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="providerDefaultHeaders">默认请求头 (JSON)</Label>
                                <Textarea
                                    id="providerDefaultHeaders"
                                    value={providerDefaultHeadersJson}
                                    onChange={(e) => setProviderDefaultHeadersJson(e.target.value)}
                                    placeholder='{"Content-Type": "application/json", "X-Custom-Header": "value"}'
                                    className="font-mono text-sm"
                                    rows={6}
                                />
                                <p className="text-xs text-muted-foreground">
                                    所有 API 请求的默认请求头（JSON 对象）。这些 header 会被添加到所有请求中，除非被场景级别的配置覆盖
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="providerRequestParams">请求参数映射 (JSON)</Label>
                                <Textarea
                                    id="providerRequestParams"
                                    value={providerRequestParamsJson}
                                    onChange={(e) => setProviderRequestParamsJson(e.target.value)}
                                    placeholder='[{"name": "prompt", "source": "body", "value": "prompt", "type": "string", "required": true}]'
                                    className="font-mono text-sm"
                                    rows={6}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Provider 级别的请求参数映射（JSON 数组）。场景未配置 requestParams 时使用。
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="providerResponseMapping">响应映射 (JSON)</Label>
                                <Textarea
                                    id="providerResponseMapping"
                                    value={providerResponseMappingJson}
                                    onChange={(e) => setProviderResponseMappingJson(e.target.value)}
                                    placeholder='{"format": "json", "requestIdPath": "data.id", "outputPath": "data.outputs[0]", "errorPath": "error.message", "statusPath": "data.status", "successStatus": ["completed", "success"]}'
                                    className="font-mono text-sm"
                                    rows={6}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Provider 级别的主响应解析配置（JSON 对象）。同步模式下用于解析最终结果，异步模式下用于解析创建任务响应。
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>结果获取方式</Label>
                                <Select
                                    value={providerResultMode}
                                    onValueChange={(value) => setProviderResultMode(value as 'sync' | 'async')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择结果获取方式" />
                                    </SelectTrigger>
                                    <SelectContent portal={false}>
                                        <SelectItem value="async">异步（返回任务 ID，需通过 Status 查询轮询结果）</SelectItem>
                                        <SelectItem value="sync">同步（直接返回最终结果，不再调用 Status 查询接口）</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    当选择同步模式时，Provider 的生成接口会直接返回最终结果，下方的 Status 查询配置可以留空。
                                </p>
                            </div>

                            {providerResultMode !== 'sync' && (
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="text-sm font-semibold mb-4">Status 查询配置（通用，场景未配置时使用）</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="providerStatusQueryEndpoint">Status 查询端点</Label>
                                            <Input
                                                id="providerStatusQueryEndpoint"
                                                value={providerStatusQueryEndpoint}
                                                onChange={(e) => setProviderStatusQueryEndpoint(e.target.value)}
                                                placeholder={'/api/v3/predictions/{taskId}/result'}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Status 查询 API 端点（支持 {'{taskId}'} 或 :taskId 占位符）
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="providerStatusQueryParams">Status 查询参数映射 (JSON)</Label>
                                            <Textarea
                                                id="providerStatusQueryParams"
                                                value={providerStatusQueryParamsJson}
                                                onChange={(e) => setProviderStatusQueryParamsJson(e.target.value)}
                                                placeholder='[{"name": "taskId", "source": "query", "value": "taskId", "type": "string", "required": true}]'
                                                className="font-mono text-sm"
                                                rows={6}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Status 查询请求参数映射（JSON 数组）。source 可选值：query, header, path, static
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="providerStatusQueryResponseMapping">Status 查询响应映射 (JSON)</Label>
                                            <Textarea
                                                id="providerStatusQueryResponseMapping"
                                                value={providerStatusQueryResponseMappingJson}
                                                onChange={(e) => setProviderStatusQueryResponseMappingJson(e.target.value)}
                                                placeholder='{"format": "json", "statusPath": "data.data.status", "outputPath": "data.data.outputs[0]", "errorPath": "error.message", "successStatus": ["completed", "success"], "failureStatus": ["failed", "error"]}'
                                                className="font-mono text-sm"
                                                rows={6}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Status 查询响应解析配置（JSON 对象）。format 可选值：json, text, binary
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="providerWebhookConfig">Webhook 配置 (JSON)</Label>
                                            <Textarea
                                                id="providerWebhookConfig"
                                                value={providerWebhookConfigJson}
                                                onChange={(e) => setProviderWebhookConfigJson(e.target.value)}
                                                placeholder='{"enabled": true, "source": "query", "paramName": "webhook"}'
                                                className="font-mono text-sm"
                                                rows={6}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Provider 级 webhook 配置（JSON 对象）。场景未配置时使用，可选附带 responseMapping。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowProviderConfigDialog(false)}>
                                取消
                            </Button>
                            <Button onClick={saveProviderConfig}>
                                保存
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Provider API 配置导入对话框 */}
                <Dialog open={showImportProviderConfigDialog} onOpenChange={setShowImportProviderConfigDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>导入 Provider API 配置: {importingProviderName}</DialogTitle>
                            <DialogDescription>
                                选择 JSON 配置文件来导入 Provider 的 API 配置（baseUrl、apiKey、场景的 apiEndpoint、requestParams、responseMapping 等）
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="importFile">选择配置文件</Label>
                                <Input
                                    id="importFile"
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setImportFile(file);
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    配置文件应为 JSON 格式，包含 baseUrl、apiKey、scenarios 等字段
                                </p>
                                {importFile && (
                                    <p className="text-xs text-green-600">
                                        已选择: {importFile.name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>配置文件格式示例</Label>
                                <Textarea
                                    readOnly
                                    className="font-mono text-xs"
                                    rows={10}
                                    value={JSON.stringify({
                                        baseUrl: 'https://api.wavespeed.ai',
                                        apiKey: 'your-api-key',
                                        apiEndpoint: '/api/v3/default',
                                        timeout: 30000,
                                        webhookConfig: {
                                            enabled: true,
                                            source: 'query',
                                            paramName: 'webhook'
                                        },
                                        scenarios: {
                                            'scenario-name': {
                                                apiEndpoint: '/api/v3/scenario',
                                                requestParams: [
                                                    { name: 'prompt', source: 'body', value: 'prompt', type: 'string', required: true }
                                                ],
                                                responseMapping: {
                                                    format: 'json',
                                                    requestIdPath: 'data.id',
                                                    outputPath: 'data.outputs[0]'
                                                }
                                            }
                                        }
                                    }, null, 2)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowImportProviderConfigDialog(false);
                                setImportFile(null);
                            }}>
                                取消
                            </Button>
                            <Button onClick={handleImportProviderConfig} disabled={!importFile}>
                                导入
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 场景 API 配置对话框 */}
                <Dialog open={showScenarioApiConfigDialog} onOpenChange={setShowScenarioApiConfigDialog}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>配置场景 API: {editingScenarioApiName}</DialogTitle>
                            <DialogDescription>
                                配置场景的 API 端点、请求参数映射和响应解析规则
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="scenarioApiEndpoint">API Endpoint</Label>
                                <Input
                                    id="scenarioApiEndpoint"
                                    value={scenarioApiEndpoint}
                                    onChange={(e) => setScenarioApiEndpoint(e.target.value)}
                                    placeholder="/api/v3/..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    场景的 API 端点（覆盖 Provider 的默认端点）
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scenarioRequestParams">请求参数映射 (JSON)</Label>
                                <Textarea
                                    id="scenarioRequestParams"
                                    value={scenarioRequestParamsJson}
                                    onChange={(e) => setScenarioRequestParamsJson(e.target.value)}
                                    placeholder='[{"name": "prompt", "source": "body", "value": "prompt", "type": "string", "required": true}]'
                                    className="font-mono text-sm"
                                    rows={8}
                                />
                                <p className="text-xs text-muted-foreground">
                                    请求参数映射配置（JSON 数组）。source 可选值：body, query, header, path, static
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scenarioRequestBodyTemplate">请求体模板 (JSON)</Label>
                                <Textarea
                                    id="scenarioRequestBodyTemplate"
                                    value={scenarioRequestBodyTemplateJson}
                                    onChange={(e) => setScenarioRequestBodyTemplateJson(e.target.value)}
                                    placeholder={'{\n  "model": "model-name",\n  "input": {\n    "messages": [{\n      "role": "user",\n      "content": [\n        { "$spread": "images", "$wrap": "image" },\n        { "text": "{{prompt}}" }\n      ]\n    }]\n  },\n  "parameters": { "n": 1 }\n}'}
                                    className="font-mono text-sm"
                                    rows={10}
                                />
                                <p className="text-xs text-muted-foreground">
                                    请求体模板（JSON 对象）。配置后优先使用模板构建嵌套请求体。语法：{'"{{paramName}}"'} 替换参数值，{'{"$spread": "arrayParam", "$wrap": "key"}'} 展开数组
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scenarioResponseMapping">响应映射 (JSON)</Label>
                                <Textarea
                                    id="scenarioResponseMapping"
                                    value={scenarioResponseMappingJson}
                                    onChange={(e) => setScenarioResponseMappingJson(e.target.value)}
                                    placeholder='{"format": "json", "requestIdPath": "data.id", "outputPath": "data.outputs[0]", "errorPath": "error.message", "statusPath": "data.status", "successStatus": ["completed", "success"]}'
                                    className="font-mono text-sm"
                                    rows={8}
                                />
                                <p className="text-xs text-muted-foreground">
                                    响应解析配置（JSON 对象）。format 可选值：json, text, binary
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scenarioWebhookConfig">Webhook 配置 (JSON)</Label>
                                <Textarea
                                    id="scenarioWebhookConfig"
                                    value={scenarioWebhookConfigJson}
                                    onChange={(e) => setScenarioWebhookConfigJson(e.target.value)}
                                    placeholder='{"enabled": true, "source": "query", "paramName": "webhook", "responseMapping": {"format": "json", "requestIdPath": "id", "statusPath": "status", "outputPath": "outputs[0]"}}'
                                    className="font-mono text-sm"
                                    rows={6}
                                />
                                <p className="text-xs text-muted-foreground">
                                    场景级 webhook 配置（JSON 对象）。会覆盖 Provider 级 webhook 配置。
                                </p>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold mb-4">参数规范化配置</h3>
                                <div className="space-y-2">
                                    <label className="inline-flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={scenarioNormalizeSizeToX}
                                            onChange={(e) => setScenarioNormalizeSizeToX(e.target.checked)}
                                            className="h-4 w-4 rounded border border-input"
                                        />
                                        <span className="text-sm">
                                            启用尺寸参数归一化（例如：2048*2048 / 2048×2048 自动匹配到 2048x2048）
                                        </span>
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        仅影响参数组合匹配：当开启后，size / resolution 等尺寸参数会在匹配 paramCombinations 时将 "*" / "×" 统一转换为 "x"。
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold mb-4">最小时长积分计算配置</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="scenarioMinDuration">最小时长（秒）</Label>
                                        <Input
                                            id="scenarioMinDuration"
                                            type="number"
                                            value={scenarioMinDuration ?? ''}
                                            onChange={(e) => setScenarioMinDuration(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="5"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            小于此时长按最小时长计算积分（例如：5秒）
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scenarioMinDurationCredits">最小时长积分</Label>
                                        <Input
                                            id="scenarioMinDurationCredits"
                                            type="number"
                                            value={scenarioMinDurationCredits ?? ''}
                                            onChange={(e) => setScenarioMinDurationCredits(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="100"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            最小时长对应的积分（当视频时长 ≤ 最小时长时使用）
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scenarioCreditsPerSecond">每秒积分</Label>
                                        <Input
                                            id="scenarioCreditsPerSecond"
                                            type="number"
                                            value={scenarioCreditsPerSecond ?? ''}
                                            onChange={(e) => setScenarioCreditsPerSecond(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="20"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            超过最小时长后，每秒消耗的积分（当视频时长 &gt; 最小时长时使用）
                                        </p>
                                    </div>
                                    <div className="bg-muted p-3 rounded-md">
                                        <p className="text-xs text-muted-foreground">
                                            <strong>计算规则：</strong><br />
                                            • 如果视频时长 ≤ 最小时长，积分 = 最小时长积分<br />
                                            • 如果视频时长 &gt; 最小时长，积分 = 最小时长积分 + (视频时长 - 最小时长) × 每秒积分<br />
                                            <br />
                                            <strong>示例：</strong>最小时长=5秒，最小时长积分=100，每秒积分=20<br />
                                            • 3秒视频：积分 = 100<br />
                                            • 8秒视频：积分 = 100 + (8-5) × 20 = 160
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-semibold mb-4">Status 查询配置（场景级别，覆盖 Provider 通用配置）</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="scenarioStatusQueryEndpoint">Status 查询端点</Label>
                                        <Input
                                            id="scenarioStatusQueryEndpoint"
                                            value={scenarioStatusQueryEndpoint}
                                            onChange={(e) => setScenarioStatusQueryEndpoint(e.target.value)}
                                            placeholder={'/api/v3/predictions/{taskId}/result'}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Status 查询 API 端点（支持 {'{taskId}'} 或 :taskId 占位符，留空则使用 Provider 通用配置）
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scenarioStatusQueryParams">Status 查询参数映射 (JSON)</Label>
                                        <Textarea
                                            id="scenarioStatusQueryParams"
                                            value={scenarioStatusQueryParamsJson}
                                            onChange={(e) => setScenarioStatusQueryParamsJson(e.target.value)}
                                            placeholder='[{"name": "taskId", "source": "query", "value": "taskId", "type": "string", "required": true}]'
                                            className="font-mono text-sm"
                                            rows={6}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Status 查询请求参数映射（JSON 数组）。source 可选值：query, header, path, static
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="scenarioStatusQueryResponseMapping">Status 查询响应映射 (JSON)</Label>
                                        <Textarea
                                            id="scenarioStatusQueryResponseMapping"
                                            value={scenarioStatusQueryResponseMappingJson}
                                            onChange={(e) => setScenarioStatusQueryResponseMappingJson(e.target.value)}
                                            placeholder='{"format": "json", "statusPath": "data.data.status", "outputPath": "data.data.outputs[0]", "errorPath": "error.message", "successStatus": ["completed", "success"], "failureStatus": ["failed", "error"]}'
                                            className="font-mono text-sm"
                                            rows={6}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Status 查询响应解析配置（JSON 对象）。format 可选值：json, text, binary
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowScenarioApiConfigDialog(false)}>
                                取消
                            </Button>
                            <Button onClick={saveScenarioApiConfig}>
                                保存
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Main>
        </>
    );
}
