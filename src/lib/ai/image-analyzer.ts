/**
 * AI-powered image analysis service for real estate.
 * Performs property condition assessment, feature detection,
 * staging suggestions, and photo quality scoring.
 */

import { type AIProviderManager } from './provider';

// ─── Types ─────────────────────────────────────────────────────────

export interface ImageAnalysisRequest {
  imageUrl?: string;
  imageBase64?: string;
  analysisType: AnalysisType[];
  propertyContext?: PropertyContext;
  options?: AnalysisOptions;
}

export type AnalysisType =
  | 'condition_assessment'
  | 'feature_detection'
  | 'staging_suggestions'
  | 'photo_quality'
  | 'room_identification'
  | 'style_analysis'
  | 'damage_detection'
  | 'full_analysis';

export interface PropertyContext {
  propertyType?: string;
  estimatedAge?: number;
  location?: string;
  listingPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export interface AnalysisOptions {
  detailLevel?: 'basic' | 'standard' | 'detailed';
  includeConfidence?: boolean;
  includeRecommendations?: boolean;
  maxSuggestions?: number;
}

export interface ImageAnalysisResult {
  conditionAssessment?: ConditionAssessment;
  featureDetection?: FeatureDetectionResult;
  stagingSuggestions?: StagingSuggestion[];
  photoQuality?: PhotoQualityScore;
  roomIdentification?: RoomIdentificationResult;
  styleAnalysis?: StyleAnalysisResult;
  damageDetection?: DamageDetectionResult;
  processingTime: number;
  confidence: number;
}

export interface ConditionAssessment {
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  overallScore: number;
  categories: ConditionCategory[];
  estimatedAge: string;
  maintenanceLevel: string;
  renovationNeeded: boolean;
  estimatedRenovationCost?: { min: number; max: number };
  highlights: string[];
  concerns: string[];
  summary: string;
}

export interface ConditionCategory {
  name: string;
  score: number;
  condition: string;
  notes: string;
}

export interface FeatureDetectionResult {
  detectedFeatures: DetectedFeature[];
  roomType: string;
  squareFootageEstimate?: { min: number; max: number };
  ceilingHeight?: string;
  naturalLight: 'abundant' | 'adequate' | 'limited' | 'poor';
  overallImpression: string;
}

export interface DetectedFeature {
  feature: string;
  confidence: number;
  quality: 'premium' | 'standard' | 'basic';
  description: string;
  estimatedValue?: number;
}

export interface StagingSuggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestion: string;
  estimatedCost: string;
  expectedImpact: string;
  roi: 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface PhotoQualityScore {
  overallScore: number;
  technicalScore: number;
  compositionScore: number;
  lightingScore: number;
  clarityScore: number;
  dimensions: { width: number; height: number };
  issues: PhotoIssue[];
  recommendations: string[];
  mlsCompliant: boolean;
}

export interface PhotoIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  fix: string;
}

export interface RoomIdentificationResult {
  roomType: string;
  subType?: string;
  confidence: number;
  visibleFeatures: string[];
  style: string;
  colorPalette: string[];
  condition: string;
}

export interface StyleAnalysisResult {
  architecturalStyle: string;
  interiorDesignStyle: string;
  era: string;
  colorScheme: string[];
  materials: string[];
  uniqueFeatures: string[];
  targetBuyerProfile: string;
  marketAppeal: number;
}

export interface DamageDetectionResult {
  damages: DetectedDamage[];
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  estimatedRepairCost: { min: number; max: number };
  immediateActionRequired: boolean;
  insuranceRelevant: boolean;
  summary: string;
}

export interface DetectedDamage {
  type: string;
  severity: 'minor' | 'moderate' | 'severe';
  location: string;
  description: string;
  estimatedCost: { min: number; max: number };
  urgency: 'immediate' | 'soon' | 'monitor';
  recommendedAction: string;
}

export interface BulkImageAnalysisRequest {
  images: Array<{ imageUrl?: string; imageBase64?: string }>;
  analysisType: AnalysisType[];
  propertyContext?: PropertyContext;
}

export interface BulkImageAnalysisResult {
  results: ImageAnalysisResult[];
  aggregatedCondition: ConditionAssessment;
  overallPhotoQuality: PhotoQualityScore;
  keyIssues: string[];
  totalProcessingTime: number;
}

// ─── Analysis Prompts ──────────────────────────────────────────────

const CONDITION_PROMPT = `Analyze the condition of this property from the image. Assess:
1. Overall condition (excellent/good/fair/poor)
2. Score out of 100
3. Categories: Walls, Floors, Ceiling, Fixtures, Appliances, Windows, Doors
4. Signs of wear, damage, or needed repairs
5. Estimated age of visible elements
6. Maintenance level observed
7. Whether renovation is needed and estimated cost range

Return JSON:
{
  "overallCondition": "excellent|good|fair|poor",
  "overallScore": <0-100>,
  "categories": [
    { "name": "<category>", "score": <0-100>, "condition": "<desc>", "notes": "<detail>" }
  ],
  "estimatedAge": "<description>",
  "maintenanceLevel": "<well-maintained|average|needs-attention|neglected>",
  "renovationNeeded": <bool>,
  "estimatedRenovationCost": { "min": <number>, "max": <number> },
  "highlights": ["<positive1>", ...],
  "concerns": ["<concern1>", ...],
  "summary": "<2-3 sentence summary>"
}`;

const FEATURE_PROMPT = `Identify all visible features and elements in this property image:
1. Room type and sub-type
2. All visible features (counters, cabinets, fixtures, appliances, etc.)
3. Quality assessment (premium/standard/basic) for each feature
4. Square footage estimate if possible
5. Ceiling height estimate
6. Natural light assessment
7. Overall impression

Return JSON:
{
  "roomType": "<type>",
  "subType": "<subtype>",
  "confidence": <0-1>,
  "detectedFeatures": [
    { "feature": "<name>", "confidence": <0-1>, "quality": "premium|standard|basic", "description": "<desc>", "estimatedValue": <number> }
  ],
  "squareFootageEstimate": { "min": <number>, "max": <number> },
  "ceilingHeight": "<standard|high|vaulted|cathedral>",
  "naturalLight": "abundant|adequate|limited|poor",
  "overallImpression": "<description>"
}`;

const STAGING_PROMPT = `Provide staging and improvement suggestions for this property based on the image:
1. Priority items (high/medium/low)
2. Category of improvement
3. Specific suggestion
4. Estimated cost range
5. Expected impact on appeal
6. ROI potential
7. Timeframe for implementation

Return JSON:
{
  "stagingSuggestions": [
    {
      "priority": "high|medium|low",
      "category": "<category>",
      "suggestion": "<specific suggestion>",
      "estimatedCost": "<cost range>",
      "expectedImpact": "<impact description>",
      "roi": "high|medium|low",
      "timeframe": "<timeframe>"
    }
  ]
}`;

const QUALITY_PROMPT = `Evaluate the technical quality of this real estate photo:
1. Overall score (0-100)
2. Technical quality (exposure, focus, white balance)
3. Composition (framing, angles, rule of thirds)
4. Lighting (natural/artificial, even distribution)
5. Clarity and sharpness
6. Issues (distortion, noise, blur, etc.)
7. MLS compliance
8. Recommendations for improvement

Return JSON:
{
  "overallScore": <0-100>,
  "technicalScore": <0-100>,
  "compositionScore": <0-100>,
  "lightingScore": <0-100>,
  "clarityScore": <0-100>,
  "issues": [
    { "type": "<issue type>", "severity": "critical|warning|info", "description": "<desc>", "fix": "<suggestion>" }
  ],
  "recommendations": ["<rec1>", ...],
  "mlsCompliant": <bool>
}`;

const ROOM_PROMPT = `Identify the room type and style from this property image:
1. Room type (living room, kitchen, bedroom, bathroom, etc.)
2. Sub-type if applicable
3. Design style (modern, traditional, contemporary, etc.)
4. Color palette
5. Materials visible
6. Unique features

Return JSON:
{
  "roomType": "<type>",
  "subType": "<subtype>",
  "confidence": <0-1>,
  "visibleFeatures": ["<feature1>", ...],
  "style": "<style>",
  "colorPalette": ["<color1>", ...],
  "condition": "<condition>",
  "architecturalStyle": "<style>",
  "interiorDesignStyle": "<style>",
  "era": "<era>",
  "materials": ["<material1>", ...],
  "uniqueFeatures": ["<feature1>", ...],
  "targetBuyerProfile": "<profile>",
  "marketAppeal": <0-100>
}`;

const DAMAGE_PROMPT = `Inspect this property image for any signs of damage or issues:
1. Water damage, stains, cracks, mold, structural issues
2. Severity of each issue found
3. Location in the image
4. Estimated repair cost
5. Urgency of repair
6. Whether insurance might cover it
7. Overall risk level

Return JSON:
{
  "damages": [
    {
      "type": "<damage type>",
      "severity": "minor|moderate|severe",
      "location": "<location>",
      "description": "<desc>",
      "estimatedCost": { "min": <number>, "max": <number> },
      "urgency": "immediate|soon|monitor",
      "recommendedAction": "<action>"
    }
  ],
  "overallRiskLevel": "low|moderate|high|critical",
  "estimatedRepairCost": { "min": <number>, "max": <number> },
  "immediateActionRequired": <bool>,
  "insuranceRelevant": <bool>,
  "summary": "<summary>"
}`;

// ─── Image Analyzer ────────────────────────────────────────────────

export class ImageAnalyzer {
  private providerManager: AIProviderManager;

  constructor(providerManager: AIProviderManager) {
    this.providerManager = providerManager;
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    const { analysisType, options = {} } = request;
    const types = analysisType.includes('full_analysis')
      ? (['condition_assessment', 'feature_detection', 'photo_quality', 'room_identification', 'staging_suggestions'] as AnalysisType[])
      : analysisType;

    const result: ImageAnalysisResult = {
      processingTime: 0,
      confidence: 0,
    };

    const promises: Promise<void>[] = [];

    for (const type of types) {
      promises.push(
        this.runAnalysisType(type, request, result, options).catch((err) => {
          console.error(`Analysis type ${type} failed:`, err);
        })
      );
    }

    await Promise.all(promises);

    // Calculate overall confidence
    const scores: number[] = [];
    if (result.conditionAssessment) scores.push(result.conditionAssessment.overallScore / 100);
    if (result.featureDetection) scores.push(result.featureDetection.detectedFeatures.reduce((s, f) => s + f.confidence, 0) / Math.max(result.featureDetection.detectedFeatures.length, 1));
    if (result.photoQuality) scores.push(result.photoQuality.overallScore / 100);
    if (result.roomIdentification) scores.push(result.roomIdentification.confidence);

    result.confidence = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : 0;

    result.processingTime = Date.now() - startTime;
    return result;
  }

  async analyzeBulk(request: BulkImageAnalysisRequest): Promise<BulkImageAnalysisResult> {
    const startTime = Date.now();
    const results: ImageAnalysisResult[] = [];

    for (const image of request.images) {
      const result = await this.analyzeImage({
        ...image,
        analysisType: request.analysisType,
        propertyContext: request.propertyContext,
      });
      results.push(result);
    }

    // Aggregate results
    const conditions = results.filter((r) => r.conditionAssessment).map((r) => r.conditionAssessment!);
    const qualities = results.filter((r) => r.photoQuality).map((r) => r.photoQuality!);

    return {
      results,
      aggregatedCondition: this.aggregateConditions(conditions),
      overallPhotoQuality: this.aggregatePhotoQuality(qualities),
      keyIssues: this.extractKeyIssues(results),
      totalProcessingTime: Date.now() - startTime,
    };
  }

  async assessPropertyCondition(
    imageUrl: string,
    context?: PropertyContext
  ): Promise<ConditionAssessment> {
    const result = await this.analyzeImage({
      imageUrl,
      analysisType: ['condition_assessment'],
      propertyContext: context,
    });
    return result.conditionAssessment ?? this.getDefaultConditionAssessment();
  }

  async detectFeatures(
    imageUrl: string,
    context?: PropertyContext
  ): Promise<FeatureDetectionResult> {
    const result = await this.analyzeImage({
      imageUrl,
      analysisType: ['feature_detection'],
      propertyContext: context,
    });
    return result.featureDetection ?? this.getDefaultFeatureDetection();
  }

  async getStagingSuggestions(
    imageUrl: string,
    maxSuggestions: number = 10
  ): Promise<StagingSuggestion[]> {
    const result = await this.analyzeImage({
      imageUrl,
      analysisType: ['staging_suggestions'],
      options: { maxSuggestions },
    });
    return result.stagingSuggestions ?? [];
  }

  async scorePhotoQuality(imageUrl: string): Promise<PhotoQualityScore> {
    const result = await this.analyzeImage({
      imageUrl,
      analysisType: ['photo_quality'],
    });
    return result.photoQuality ?? this.getDefaultPhotoQuality();
  }

  // ─── Private Methods ──────────────────────────────────────────

  private async runAnalysisType(
    type: AnalysisType,
    request: ImageAnalysisRequest,
    result: ImageAnalysisResult,
    options: AnalysisOptions
  ): Promise<void> {
    const provider = this.providerManager.getPrimaryProvider();
    if (!provider) {
      this.applyDefaults(type, result);
      return;
    }

    const prompt = this.getPromptForType(type);
    if (!prompt) return;

    try {
      const visionResult = await provider.vision({
        imageUrl: request.imageUrl,
        imageBase64: request.imageBase64,
        prompt,
        maxTokens: 2000,
      });

      const parsed = JSON.parse(visionResult.content);

      switch (type) {
        case 'condition_assessment':
          result.conditionAssessment = this.parseConditionAssessment(parsed);
          break;
        case 'feature_detection':
          result.featureDetection = this.parseFeatureDetection(parsed);
          break;
        case 'staging_suggestions':
          result.stagingSuggestions = this.parseStagingSuggestions(parsed, options.maxSuggestions ?? 10);
          break;
        case 'photo_quality':
          result.photoQuality = this.parsePhotoQuality(parsed);
          break;
        case 'room_identification':
          result.roomIdentification = this.parseRoomIdentification(parsed);
          result.styleAnalysis = this.parseStyleAnalysis(parsed);
          break;
        case 'damage_detection':
          result.damageDetection = this.parseDamageDetection(parsed);
          break;
      }
    } catch {
      this.applyDefaults(type, result);
    }
  }

  private getPromptForType(type: AnalysisType): string {
    switch (type) {
      case 'condition_assessment': return CONDITION_PROMPT;
      case 'feature_detection': return FEATURE_PROMPT;
      case 'staging_suggestions': return STAGING_PROMPT;
      case 'photo_quality': return QUALITY_PROMPT;
      case 'room_identification':
      case 'style_analysis': return ROOM_PROMPT;
      case 'damage_detection': return DAMAGE_PROMPT;
      default: return FEATURE_PROMPT;
    }
  }

  private parseConditionAssessment(parsed: Record<string, unknown>): ConditionAssessment {
    return {
      overallCondition: (parsed.overallCondition as ConditionAssessment['overallCondition']) ?? 'good',
      overallScore: (parsed.overallScore as number) ?? 70,
      categories: Array.isArray(parsed.categories)
        ? (parsed.categories as Array<Record<string, unknown>>).map((c) => ({
            name: (c.name as string) ?? 'Unknown',
            score: (c.score as number) ?? 50,
            condition: (c.condition as string) ?? 'Unknown',
            notes: (c.notes as string) ?? '',
          }))
        : [],
      estimatedAge: (parsed.estimatedAge as string) ?? 'Unknown',
      maintenanceLevel: (parsed.maintenanceLevel as string) ?? 'Average',
      renovationNeeded: (parsed.renovationNeeded as boolean) ?? false,
      estimatedRenovationCost: parsed.estimatedRenovationCost as { min: number; max: number } | undefined,
      highlights: Array.isArray(parsed.highlights) ? (parsed.highlights as string[]) : [],
      concerns: Array.isArray(parsed.concerns) ? (parsed.concerns as string[]) : [],
      summary: (parsed.summary as string) ?? '',
    };
  }

  private parseFeatureDetection(parsed: Record<string, unknown>): FeatureDetectionResult {
    return {
      roomType: (parsed.roomType as string) ?? 'Unknown',
      subType: parsed.subType as string | undefined,
      confidence: (parsed.confidence as number) ?? 0.5,
      detectedFeatures: Array.isArray(parsed.detectedFeatures)
        ? (parsed.detectedFeatures as Array<Record<string, unknown>>).map((f) => ({
            feature: (f.feature as string) ?? 'Unknown',
            confidence: (f.confidence as number) ?? 0.5,
            quality: (f.quality as DetectedFeature['quality']) ?? 'standard',
            description: (f.description as string) ?? '',
            estimatedValue: f.estimatedValue as number | undefined,
          }))
        : [],
      squareFootageEstimate: parsed.squareFootageEstimate as { min: number; max: number } | undefined,
      ceilingHeight: parsed.ceilingHeight as string | undefined,
      naturalLight: (parsed.naturalLight as FeatureDetectionResult['naturalLight']) ?? 'adequate',
      overallImpression: (parsed.overallImpression as string) ?? '',
    };
  }

  private parseStagingSuggestions(
    parsed: Record<string, unknown>,
    maxSuggestions: number
  ): StagingSuggestion[] {
    const raw = Array.isArray(parsed.stagingSuggestions)
      ? (parsed.stagingSuggestions as Array<Record<string, unknown>>)
      : [];

    return raw.slice(0, maxSuggestions).map((s) => ({
      priority: (s.priority as StagingSuggestion['priority']) ?? 'medium',
      category: (s.category as string) ?? 'General',
      suggestion: (s.suggestion as string) ?? '',
      estimatedCost: (s.estimatedCost as string) ?? 'Unknown',
      expectedImpact: (s.expectedImpact as string) ?? '',
      roi: (s.roi as StagingSuggestion['roi']) ?? 'medium',
      timeframe: (s.timeframe as string) ?? 'Unknown',
    }));
  }

  private parsePhotoQuality(parsed: Record<string, unknown>): PhotoQualityScore {
    return {
      overallScore: (parsed.overallScore as number) ?? 60,
      technicalScore: (parsed.technicalScore as number) ?? 60,
      compositionScore: (parsed.compositionScore as number) ?? 60,
      lightingScore: (parsed.lightingScore as number) ?? 60,
      clarityScore: (parsed.clarityScore as number) ?? 60,
      dimensions: { width: 0, height: 0 },
      issues: Array.isArray(parsed.issues)
        ? (parsed.issues as Array<Record<string, unknown>>).map((i) => ({
            type: (i.type as string) ?? 'Unknown',
            severity: (i.severity as PhotoIssue['severity']) ?? 'info',
            description: (i.description as string) ?? '',
            fix: (i.fix as string) ?? '',
          }))
        : [],
      recommendations: Array.isArray(parsed.recommendations) ? (parsed.recommendations as string[]) : [],
      mlsCompliant: (parsed.mlsCompliant as boolean) ?? true,
    };
  }

  private parseRoomIdentification(parsed: Record<string, unknown>): RoomIdentificationResult {
    return {
      roomType: (parsed.roomType as string) ?? 'Unknown',
      subType: parsed.subType as string | undefined,
      confidence: (parsed.confidence as number) ?? 0.5,
      visibleFeatures: Array.isArray(parsed.visibleFeatures) ? (parsed.visibleFeatures as string[]) : [],
      style: (parsed.style as string) ?? 'Unknown',
      colorPalette: Array.isArray(parsed.colorPalette) ? (parsed.colorPalette as string[]) : [],
      condition: (parsed.condition as string) ?? 'Unknown',
    };
  }

  private parseStyleAnalysis(parsed: Record<string, unknown>): StyleAnalysisResult {
    return {
      architecturalStyle: (parsed.architecturalStyle as string) ?? 'Unknown',
      interiorDesignStyle: (parsed.interiorDesignStyle as string) ?? 'Unknown',
      era: (parsed.era as string) ?? 'Unknown',
      colorScheme: Array.isArray(parsed.colorPalette) ? (parsed.colorPalette as string[]) : [],
      materials: Array.isArray(parsed.materials) ? (parsed.materials as string[]) : [],
      uniqueFeatures: Array.isArray(parsed.uniqueFeatures) ? (parsed.uniqueFeatures as string[]) : [],
      targetBuyerProfile: (parsed.targetBuyerProfile as string) ?? 'General',
      marketAppeal: (parsed.marketAppeal as number) ?? 50,
    };
  }

  private parseDamageDetection(parsed: Record<string, unknown>): DamageDetectionResult {
    return {
      damages: Array.isArray(parsed.damages)
        ? (parsed.damages as Array<Record<string, unknown>>).map((d) => ({
            type: (d.type as string) ?? 'Unknown',
            severity: (d.severity as DetectedDamage['severity']) ?? 'minor',
            location: (d.location as string) ?? 'Unknown',
            description: (d.description as string) ?? '',
            estimatedCost: (d.estimatedCost as { min: number; max: number }) ?? { min: 0, max: 0 },
            urgency: (d.urgency as DetectedDamage['urgency']) ?? 'monitor',
            recommendedAction: (d.recommendedAction as string) ?? '',
          }))
        : [],
      overallRiskLevel: (parsed.overallRiskLevel as DamageDetectionResult['overallRiskLevel']) ?? 'low',
      estimatedRepairCost: (parsed.estimatedRepairCost as { min: number; max: number }) ?? { min: 0, max: 0 },
      immediateActionRequired: (parsed.immediateActionRequired as boolean) ?? false,
      insuranceRelevant: (parsed.insuranceRelevant as boolean) ?? false,
      summary: (parsed.summary as string) ?? '',
    };
  }

  private applyDefaults(type: AnalysisType, result: ImageAnalysisResult): void {
    switch (type) {
      case 'condition_assessment':
        result.conditionAssessment = this.getDefaultConditionAssessment();
        break;
      case 'feature_detection':
        result.featureDetection = this.getDefaultFeatureDetection();
        break;
      case 'photo_quality':
        result.photoQuality = this.getDefaultPhotoQuality();
        break;
      case 'room_identification':
        result.roomIdentification = { roomType: 'Unknown', confidence: 0, visibleFeatures: [], style: 'Unknown', colorPalette: [], condition: 'Unknown' };
        break;
      case 'damage_detection':
        result.damageDetection = { damages: [], overallRiskLevel: 'low', estimatedRepairCost: { min: 0, max: 0 }, immediateActionRequired: false, insuranceRelevant: false, summary: 'No analysis available' };
        break;
    }
  }

  private getDefaultConditionAssessment(): ConditionAssessment {
    return {
      overallCondition: 'good',
      overallScore: 70,
      categories: [],
      estimatedAge: 'Unable to determine',
      maintenanceLevel: 'Average',
      renovationNeeded: false,
      highlights: [],
      concerns: ['Unable to perform AI analysis - default values applied'],
      summary: 'Condition assessment unavailable. Manual inspection recommended.',
    };
  }

  private getDefaultFeatureDetection(): FeatureDetectionResult {
    return {
      roomType: 'Unknown',
      confidence: 0,
      detectedFeatures: [],
      naturalLight: 'adequate',
      overallImpression: 'Feature detection unavailable.',
    };
  }

  private getDefaultPhotoQuality(): PhotoQualityScore {
    return {
      overallScore: 50,
      technicalScore: 50,
      compositionScore: 50,
      lightingScore: 50,
      clarityScore: 50,
      dimensions: { width: 0, height: 0 },
      issues: [],
      recommendations: ['Unable to analyze photo quality. Manual review recommended.'],
      mlsCompliant: true,
    };
  }

  private aggregateConditions(conditions: ConditionAssessment[]): ConditionAssessment {
    if (conditions.length === 0) return this.getDefaultConditionAssessment();

    const avgScore = Math.round(
      conditions.reduce((s, c) => s + c.overallScore, 0) / conditions.length
    );

    const allConcerns = conditions.flatMap((c) => c.concerns);
    const allHighlights = conditions.flatMap((c) => c.highlights);
    const renovationNeeded = conditions.some((c) => c.renovationNeeded);

    let overallCondition: ConditionAssessment['overallCondition'];
    if (avgScore >= 85) overallCondition = 'excellent';
    else if (avgScore >= 70) overallCondition = 'good';
    else if (avgScore >= 50) overallCondition = 'fair';
    else overallCondition = 'poor';

    return {
      overallCondition,
      overallScore: avgScore,
      categories: conditions[0]?.categories ?? [],
      estimatedAge: conditions[0]?.estimatedAge ?? 'Unknown',
      maintenanceLevel: conditions[0]?.maintenanceLevel ?? 'Average',
      renovationNeeded,
      highlights: [...new Set(allHighlights)].slice(0, 10),
      concerns: [...new Set(allConcerns)].slice(0, 10),
      summary: `Overall condition: ${overallCondition} (score: ${avgScore}/100). ${conditions.length} images analyzed.`,
    };
  }

  private aggregatePhotoQuality(qualities: PhotoQualityScore[]): PhotoQualityScore {
    if (qualities.length === 0) return this.getDefaultPhotoQuality();

    const avg = (key: keyof PhotoQualityScore) =>
      Math.round(
        qualities.reduce((s, q) => s + ((q[key] as number) || 0), 0) / qualities.length
      );

    const allIssues = qualities.flatMap((q) => q.issues);
    const allRecs = qualities.flatMap((q) => q.recommendations);

    return {
      overallScore: avg('overallScore'),
      technicalScore: avg('technicalScore'),
      compositionScore: avg('compositionScore'),
      lightingScore: avg('lightingScore'),
      clarityScore: avg('clarityScore'),
      dimensions: qualities[0]?.dimensions ?? { width: 0, height: 0 },
      issues: allIssues.slice(0, 20),
      recommendations: [...new Set(allRecs)].slice(0, 10),
      mlsCompliant: qualities.every((q) => q.mlsCompliant),
    };
  }

  private extractKeyIssues(results: ImageAnalysisResult[]): string[] {
    const issues: string[] = [];

    for (const result of results) {
      if (result.conditionAssessment?.concerns) {
        issues.push(...result.conditionAssessment.concerns);
      }
      if (result.damageDetection?.damages) {
        for (const damage of result.damageDetection.damages) {
          if (damage.severity === 'severe' || damage.urgency === 'immediate') {
            issues.push(`${damage.type}: ${damage.description}`);
          }
        }
      }
      if (result.photoQuality?.issues) {
        for (const issue of result.photoQuality.issues) {
          if (issue.severity === 'critical') {
            issues.push(`Photo issue: ${issue.description}`);
          }
        }
      }
    }

    return [...new Set(issues)].slice(0, 15);
  }
}
