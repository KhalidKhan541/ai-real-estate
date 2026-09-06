import { nanoid } from 'nanoid';

// ─── Types & Enums ───────────────────────────────────────────────────────────

export enum ReviewType {
  AGENT = 'AGENT',
  PROPERTY = 'PROPERTY',
  LENDER = 'LENDER',
  TITLE_COMPANY = 'TITLE_COMPANY',
  HOME_INSPECTOR = 'HOME_INSPECTOR',
  VENDOR = 'VENDOR',
}

export enum ReviewStatus {
  DRAFT = 'DRAFT',
  PENDING_MODERATION = 'PENDING_MODERATION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  FLAGGED = 'FLAGGED',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
  EDITED = 'EDITED',
}

export enum ModerationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  FLAG = 'FLAG',
  HIDE = 'HIDE',
  EDIT = 'EDIT',
  REQUEST_REVISION = 'REQUEST_REVISION',
}

export enum ReportReason {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  FALSE_INFORMATION = 'FALSE_INFORMATION',
  HARASSMENT = 'HARASSMENT',
  CONFLICT_OF_INTEREST = 'CONFLICT_OF_INTEREST',
  DUPLICATE = 'DUPLICATE',
  OTHER = 'OTHER',
}

export interface RatingBreakdown {
  communication: number;
  professionalism: number;
  marketKnowledge: number;
  negotiationSkills: number;
  responsiveness: number;
  closingProcess: number;
  overallExperience: number;
}

export interface PropertyRatings {
  location: number;
  value: number;
  condition: number;
  amenities: number;
  neighborhood: number;
  parking: number;
  storage: number;
  overallRating: number;
}

export interface Review {
  id: string;
  type: ReviewType;
  status: ReviewStatus;
  rating: number;
  ratings: RatingBreakdown | PropertyRatings;
  title: string;
  content: string;
  pros?: string;
  cons?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  targetId: string;
  targetName: string;
  transactionId?: string;
  propertyId?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  response?: ReviewResponse;
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: Date;
  reports: ReviewReport[];
  isVerified: boolean;
  isAnonymous: boolean;
  isEdited: boolean;
  editHistory: EditHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ReviewResponse {
  id: string;
  reviewerId: string;
  reviewerName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ReviewReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reason: ReportReason;
  description?: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface EditHistoryEntry {
  editedAt: Date;
  previousContent: string;
  previousRating?: number;
  editReason?: string;
}

export interface CreateReviewInput {
  type: ReviewType;
  rating: number;
  ratings: RatingBreakdown | PropertyRatings;
  title: string;
  content: string;
  pros?: string;
  cons?: string;
  reviewerId: string;
  reviewerName: string;
  targetId: string;
  targetName: string;
  transactionId?: string;
  propertyId?: string;
  isAnonymous?: boolean;
}

export interface EditReviewInput {
  rating?: number;
  ratings?: RatingBreakdown | PropertyRatings;
  title?: string;
  content?: string;
  pros?: string;
  cons?: string;
  editReason?: string;
}

export interface ReviewFilter {
  type?: ReviewType[];
  status?: ReviewStatus[];
  targetId?: string;
  reviewerId?: string;
  minRating?: number;
  maxRating?: number;
  isVerified?: boolean;
  hasResponse?: boolean;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'most_helpful' | 'recently_updated';
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  medianRating: number;
  ratingDistribution: Record<number, number>;
  responseRate: number;
  averageResponseTime: number;
  flaggedReviews: number;
  verifiedReviewPercent: number;
  totalHelpfulVotes: number;
}

export interface AgentReviewStats extends ReviewStats {
  agentId: string;
  agentName: string;
  totalTransactions: number;
  repeatClientRate: number;
  averageRatingByCategory: {
    communication: number;
    professionalism: number;
    marketKnowledge: number;
    negotiationSkills: number;
    responsiveness: number;
    closingProcess: number;
  };
}

export interface PropertyReviewStats extends ReviewStats {
  propertyId: string;
  averageRatings: {
    location: number;
    value: number;
    condition: number;
    amenities: number;
    neighborhood: number;
  };
}

// ─── Service Implementation ──────────────────────────────────────────────────

export class ReviewService {
  private reviews: Map<string, Review> = new Map();
  private helpfulVotes: Map<string, Set<string>> = new Map();

  // ── Review CRUD ──────────────────────────────────────────────────────

  createReview(input: CreateReviewInput): Review {
    this.validateReviewInput(input);

    const id = `rev_${nanoid(10)}`;
    const now = new Date();

    const review: Review = {
      id,
      type: input.type,
      status: ReviewStatus.PENDING_MODERATION,
      rating: input.rating,
      ratings: input.ratings,
      title: input.title,
      content: input.content,
      pros: input.pros,
      cons: input.cons,
      reviewerId: input.reviewerId,
      reviewerName: input.isAnonymous ? 'Anonymous' : input.reviewerName,
      reviewerAvatar: undefined,
      targetId: input.targetId,
      targetName: input.targetName,
      transactionId: input.transactionId,
      propertyId: input.propertyId,
      helpfulCount: 0,
      notHelpfulCount: 0,
      reports: [],
      isVerified: !!input.transactionId,
      isAnonymous: input.isAnonymous || false,
      isEdited: false,
      editHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    this.reviews.set(id, review);
    return review;
  }

  editReview(reviewId: string, reviewerId: string, input: EditReviewInput): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    if (review.reviewerId !== reviewerId) {
      throw new Error('Only the original reviewer can edit a review');
    }

    if (review.status === ReviewStatus.DELETED) {
      throw new Error('Cannot edit a deleted review');
    }

    const history: EditHistoryEntry = {
      editedAt: new Date(),
      previousContent: review.content,
      previousRating: review.rating,
      editReason: input.editReason,
    };
    review.editHistory.push(history);

    if (input.rating !== undefined) review.rating = input.rating;
    if (input.ratings !== undefined) review.ratings = input.ratings;
    if (input.title !== undefined) review.title = input.title;
    if (input.content !== undefined) review.content = input.content;
    if (input.pros !== undefined) review.pros = input.pros;
    if (input.cons !== undefined) review.cons = input.cons;

    review.isEdited = true;
    review.status = ReviewStatus.PENDING_MODERATION;
    review.updatedAt = new Date();

    return review;
  }

  deleteReview(reviewId: string, reviewerId: string): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    if (review.reviewerId !== reviewerId) {
      throw new Error('Only the original reviewer can delete a review');
    }

    review.status = ReviewStatus.DELETED;
    review.updatedAt = new Date();
    return review;
  }

  // ── Response Management ──────────────────────────────────────────────

  addResponse(
    reviewId: string,
    responderId: string,
    responderName: string,
    content: string
  ): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    if (review.response) {
      throw new Error('Review already has a response');
    }

    review.response = {
      id: `resp_${nanoid(8)}`,
      reviewerId: responderId,
      reviewerName: responderName,
      content,
      createdAt: new Date(),
    };

    review.updatedAt = new Date();
    return review;
  }

  editResponse(reviewId: string, responderId: string, content: string): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    if (!review.response) throw new Error('Review has no response');
    if (review.response.reviewerId !== responderId) {
      throw new Error('Only the original responder can edit the response');
    }

    review.response.content = content;
    review.response.updatedAt = new Date();
    review.updatedAt = new Date();

    return review;
  }

  deleteResponse(reviewId: string, responderId: string): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    if (!review.response) throw new Error('Review has no response');
    if (review.response.reviewerId !== responderId) {
      throw new Error('Only the original responder can delete the response');
    }

    review.response = undefined;
    review.updatedAt = new Date();

    return review;
  }

  // ── Moderation ───────────────────────────────────────────────────────

  moderateReview(
    reviewId: string,
    moderatorId: string,
    action: ModerationAction,
    notes?: string
  ): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    review.moderatedBy = moderatorId;
    review.moderatedAt = new Date();
    review.moderationNotes = notes;

    switch (action) {
      case ModerationAction.APPROVE:
        review.status = ReviewStatus.APPROVED;
        review.publishedAt = new Date();
        break;
      case ModerationAction.REJECT:
        review.status = ReviewStatus.REJECTED;
        break;
      case ModerationAction.FLAG:
        review.status = ReviewStatus.FLAGGED;
        break;
      case ModerationAction.HIDE:
        review.status = ReviewStatus.HIDDEN;
        break;
      case ModerationAction.REQUEST_REVISION:
        review.status = ReviewStatus.DRAFT;
        break;
    }

    review.updatedAt = new Date();
    return review;
  }

  approveReview(reviewId: string, moderatorId: string): Review {
    return this.moderateReview(reviewId, moderatorId, ModerationAction.APPROVE);
  }

  rejectReview(reviewId: string, moderatorId: string, reason?: string): Review {
    return this.moderateReview(reviewId, moderatorId, ModerationAction.REJECT, reason);
  }

  flagReview(reviewId: string, moderatorId: string, reason?: string): Review {
    return this.moderateReview(reviewId, moderatorId, ModerationAction.FLAG, reason);
  }

  getPendingReviews(): Review[] {
    return Array.from(this.reviews.values()).filter(
      (r) => r.status === ReviewStatus.PENDING_MODERATION
    );
  }

  getFlaggedReviews(): Review[] {
    return Array.from(this.reviews.values()).filter(
      (r) => r.status === ReviewStatus.FLAGGED
    );
  }

  // ── Report Management ────────────────────────────────────────────────

  reportReview(
    reviewId: string,
    reporterId: string,
    reporterName: string,
    reason: ReportReason,
    description?: string
  ): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    const existingReport = review.reports.find((r) => r.reporterId === reporterId);
    if (existingReport) {
      throw new Error('You have already reported this review');
    }

    review.reports.push({
      id: `rpt_${nanoid(8)}`,
      reporterId,
      reporterName,
      reason,
      description,
      reportedAt: new Date(),
    });

    if (review.reports.length >= 3 && review.status !== ReviewStatus.FLAGGED) {
      review.status = ReviewStatus.FLAGGED;
    }

    review.updatedAt = new Date();
    return review;
  }

  resolveReport(
    reviewId: string,
    reportId: string,
    resolverId: string,
    resolution: string
  ): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    const report = review.reports.find((r) => r.id === reportId);
    if (!report) throw new Error(`Report ${reportId} not found`);

    report.resolvedAt = new Date();
    report.resolvedBy = resolverId;
    report.resolution = resolution;

    review.updatedAt = new Date();
    return review;
  }

  // ── Helpful Votes ────────────────────────────────────────────────────

  markHelpful(reviewId: string, userId: string): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    if (userId === review.reviewerId) {
      throw new Error('Cannot vote on your own review');
    }

    const notHelpfulSet = this.helpfulVotes.get(`${reviewId}_not_helpful`);
    if (notHelpfulSet?.has(userId)) {
      notHelpfulSet.delete(userId);
      review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
    }

    let helpfulSet = this.helpfulVotes.get(`${reviewId}_helpful`);
    if (!helpfulSet) {
      helpfulSet = new Set();
      this.helpfulVotes.set(`${reviewId}_helpful`, helpfulSet);
    }

    if (helpfulSet.has(userId)) {
      helpfulSet.delete(userId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      helpfulSet.add(userId);
      review.helpfulCount += 1;
    }

    review.updatedAt = new Date();
    return review;
  }

  markNotHelpful(reviewId: string, userId: string): Review {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error(`Review ${reviewId} not found`);

    if (userId === review.reviewerId) {
      throw new Error('Cannot vote on your own review');
    }

    const helpfulSet = this.helpfulVotes.get(`${reviewId}_helpful`);
    if (helpfulSet?.has(userId)) {
      helpfulSet.delete(userId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    }

    let notHelpfulSet = this.helpfulVotes.get(`${reviewId}_not_helpful`);
    if (!notHelpfulSet) {
      notHelpfulSet = new Set();
      this.helpfulVotes.set(`${reviewId}_not_helpful`, notHelpfulSet);
    }

    if (notHelpfulSet.has(userId)) {
      notHelpfulSet.delete(userId);
      review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
    } else {
      notHelpfulSet.add(userId);
      review.notHelpfulCount += 1;
    }

    review.updatedAt = new Date();
    return review;
  }

  // ── Analytics & Stats ────────────────────────────────────────────────

  getReviewStats(targetId: string, type?: ReviewType): ReviewStats {
    let reviews = Array.from(this.reviews.values()).filter(
      (r) =>
        r.targetId === targetId &&
        r.status === ReviewStatus.PUBLISHED
    );

    if (type) {
      reviews = reviews.filter((r) => r.type === type);
    }

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        medianRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        responseRate: 0,
        averageResponseTime: 0,
        flaggedReviews: 0,
        verifiedReviewPercent: 0,
        totalHelpfulVotes: 0,
      };
    }

    const ratings = reviews.map((r) => r.rating);
    const averageRating = ratings.reduce((sum, r) => sum + r, 0) / totalReviews;
    const sortedRatings = [...ratings].sort((a, b) => a - b);
    const medianRating = sortedRatings[Math.floor(sortedRatings.length / 2)];

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const rating of ratings) {
      const rounded = Math.round(rating) as keyof typeof ratingDistribution;
      ratingDistribution[rounded] = (ratingDistribution[rounded] || 0) + 1;
    }

    const reviewsWithResponse = reviews.filter((r) => r.response);
    const responseRate = (reviewsWithResponse.length / totalReviews) * 100;

    const responseTimes = reviewsWithResponse
      .filter((r) => r.response?.createdAt)
      .map((r) => {
        const created = new Date(r.createdAt);
        const responded = new Date(r.response!.createdAt);
        return (responded.getTime() - created.getTime()) / (1000 * 60 * 60);
      });

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    const flaggedReviews = Array.from(this.reviews.values()).filter(
      (r) => r.targetId === targetId && r.status === ReviewStatus.FLAGGED
    ).length;

    const verifiedCount = reviews.filter((r) => r.isVerified).length;
    const verifiedReviewPercent = (verifiedCount / totalReviews) * 100;

    const totalHelpfulVotes = reviews.reduce(
      (sum, r) => sum + r.helpfulCount + r.notHelpfulCount,
      0
    );

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      medianRating,
      ratingDistribution,
      responseRate: Math.round(responseRate * 10) / 10,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      flaggedReviews,
      verifiedReviewPercent: Math.round(verifiedReviewPercent * 10) / 10,
      totalHelpfulVotes,
    };
  }

  getAgentReviewStats(agentId: string): AgentReviewStats {
    const baseStats = this.getReviewStats(agentId, ReviewType.AGENT);
    const reviews = Array.from(this.reviews.values()).filter(
      (r) =>
        r.targetId === agentId &&
        r.type === ReviewType.AGENT &&
        r.status === ReviewStatus.PUBLISHED
    );

    let totalTransactions = 0;
    let repeatClientIds = new Set<string>();
    let clientIds = new Set<string>();

    const categoryRatings = {
      communication: 0,
      professionalism: 0,
      marketKnowledge: 0,
      negotiationSkills: 0,
      responsiveness: 0,
      closingProcess: 0,
    };
    let categoryCount = 0;

    for (const review of reviews) {
      if (review.transactionId) totalTransactions++;
      if (clientIds.has(review.reviewerId)) {
        repeatClientIds.add(review.reviewerId);
      }
      clientIds.add(review.reviewerId);

      const ratings = review.ratings as RatingBreakdown;
      if (ratings.communication) {
        categoryRatings.communication += ratings.communication;
        categoryRatings.professionalism += ratings.professionalism;
        categoryRatings.marketKnowledge += ratings.marketKnowledge;
        categoryRatings.negotiationSkills += ratings.negotiationSkills;
        categoryRatings.responsiveness += ratings.responsiveness;
        categoryRatings.closingProcess += ratings.closingProcess;
        categoryCount++;
      }
    }

    const repeatClientRate =
      clientIds.size > 0 ? (repeatClientIds.size / clientIds.size) * 100 : 0;

    return {
      ...baseStats,
      agentId,
      agentName: reviews[0]?.targetName || '',
      totalTransactions,
      repeatClientRate: Math.round(repeatClientRate * 10) / 10,
      averageRatingByCategory: {
        communication:
          categoryCount > 0
            ? Math.round((categoryRatings.communication / categoryCount) * 10) / 10
            : 0,
        professionalism:
          categoryCount > 0
            ? Math.round((categoryRatings.professionalism / categoryCount) * 10) / 10
            : 0,
        marketKnowledge:
          categoryCount > 0
            ? Math.round((categoryRatings.marketKnowledge / categoryCount) * 10) / 10
            : 0,
        negotiationSkills:
          categoryCount > 0
            ? Math.round((categoryRatings.negotiationSkills / categoryCount) * 10) / 10
            : 0,
        responsiveness:
          categoryCount > 0
            ? Math.round((categoryRatings.responsiveness / categoryCount) * 10) / 10
            : 0,
        closingProcess:
          categoryCount > 0
            ? Math.round((categoryRatings.closingProcess / categoryCount) * 10) / 10
            : 0,
      },
    };
  }

  getPropertyReviewStats(propertyId: string): PropertyReviewStats {
    const baseStats = this.getReviewStats(propertyId, ReviewType.PROPERTY);
    const reviews = Array.from(this.reviews.values()).filter(
      (r) =>
        r.targetId === propertyId &&
        r.type === ReviewType.PROPERTY &&
        r.status === ReviewStatus.PUBLISHED
    );

    const avgRatings = {
      location: 0,
      value: 0,
      condition: 0,
      amenities: 0,
      neighborhood: 0,
    };
    let count = 0;

    for (const review of reviews) {
      const ratings = review.ratings as PropertyRatings;
      if (ratings.location) {
        avgRatings.location += ratings.location;
        avgRatings.value += ratings.value;
        avgRatings.condition += ratings.condition;
        avgRatings.amenities += ratings.amenities;
        avgRatings.neighborhood += ratings.neighborhood;
        count++;
      }
    }

    return {
      ...baseStats,
      propertyId,
      averageRatings: {
        location: count > 0 ? Math.round((avgRatings.location / count) * 10) / 10 : 0,
        value: count > 0 ? Math.round((avgRatings.value / count) * 10) / 10 : 0,
        condition: count > 0 ? Math.round((avgRatings.condition / count) * 10) / 10 : 0,
        amenities: count > 0 ? Math.round((avgRatings.amenities / count) * 10) / 10 : 0,
        neighborhood:
          count > 0 ? Math.round((avgRatings.neighborhood / count) * 10) / 10 : 0,
      },
    };
  }

  // ── Queries ───────────────────────────────────────────────────────────

  getReview(reviewId: string): Review | undefined {
    return this.reviews.get(reviewId);
  }

  searchReviews(filter: ReviewFilter): Review[] {
    let results = Array.from(this.reviews.values());

    if (filter.type && filter.type.length > 0) {
      results = results.filter((r) => filter.type!.includes(r.type));
    }

    if (filter.status && filter.status.length > 0) {
      results = results.filter((r) => filter.status!.includes(r.status));
    }

    if (filter.targetId) {
      results = results.filter((r) => r.targetId === filter.targetId);
    }

    if (filter.reviewerId) {
      results = results.filter((r) => r.reviewerId === filter.reviewerId);
    }

    if (filter.minRating !== undefined) {
      results = results.filter((r) => r.rating >= filter.minRating!);
    }

    if (filter.maxRating !== undefined) {
      results = results.filter((r) => r.rating <= filter.maxRating!);
    }

    if (filter.isVerified !== undefined) {
      results = results.filter((r) => r.isVerified === filter.isVerified);
    }

    if (filter.hasResponse !== undefined) {
      results = results.filter((r) =>
        filter.hasResponse ? !!r.response : !r.response
      );
    }

    if (filter.search) {
      const term = filter.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.content.toLowerCase().includes(term)
      );
    }

    if (filter.createdAfter) {
      results = results.filter((r) => r.createdAt >= filter.createdAfter!);
    }

    if (filter.createdBefore) {
      results = results.filter((r) => r.createdAt <= filter.createdBefore!);
    }

    switch (filter.sortBy) {
      case 'newest':
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'oldest':
        results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'highest':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'most_helpful':
        results.sort((a, b) => b.helpfulCount - a.helpfulCount);
        break;
      case 'recently_updated':
        results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      default:
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return results;
  }

  getPublishedReviews(targetId: string, type?: ReviewType): Review[] {
    return this.searchReviews({
      targetId,
      type: type ? [type] : undefined,
      status: [ReviewStatus.PUBLISHED],
      sortBy: 'newest',
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private validateReviewInput(input: CreateReviewInput): void {
    if (!input.title) throw new Error('Review title is required');
    if (!input.content) throw new Error('Review content is required');
    if (input.content.length < 10) throw new Error('Review content must be at least 10 characters');
    if (input.content.length > 5000) throw new Error('Review content must be less than 5000 characters');
    if (input.rating < 1 || input.rating > 5) throw new Error('Rating must be between 1 and 5');
    if (!input.reviewerId) throw new Error('Reviewer ID is required');
    if (!input.targetId) throw new Error('Target ID is required');
  }
}

// ── Export singleton ──────────────────────────────────────────────────────

export const reviewService = new ReviewService();
