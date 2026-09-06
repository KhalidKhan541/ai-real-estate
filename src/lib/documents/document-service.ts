import { nanoid } from 'nanoid';

// ─── Types & Enums ───────────────────────────────────────────────────────────

export enum DocumentCategory {
  LISTING = 'LISTING',
  PURCHASE_AGREEMENT = 'PURCHASE_AGREEMENT',
  ADDENDUM = 'ADDENDUM',
  DISCLOSURE = 'DISCLOSURE',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  APPRAISAL = 'APPRAISAL',
  TITLE = 'TITLE',
  FINANCING = 'FINANCING',
  INSURANCE = 'INSURANCE',
  CLOSING = 'CLOSING',
  TAX = 'TAX',
  HOA = 'HOA',
  SURVEY = 'SURVEY',
  WALKTHROUGH = 'WALKTHROUGH',
  COMMUNICATION = 'COMMUNICATION',
  IDENTIFICATION = 'IDENTIFICATION',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  SIGNED = 'SIGNED',
  EXECUTED = 'EXECUTED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
  VOIDED = 'VOIDED',
}

export enum SignatureStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  SIGNED = 'SIGNED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  RETRACTED = 'RETRACTED',
}

export enum SignatureField {
  SIGNATURE = 'SIGNATURE',
  INITIAL = 'INITIAL',
  DATE = 'DATE',
  TEXT = 'TEXT',
  CHECKBOX = 'CHECKBOX',
  DROPDOWN = 'DROPDOWN',
  SIGNATURE_DATE = 'SIGNATURE_DATE',
}

export enum AccessLevel {
  PRIVATE = 'PRIVATE',
  AGENT_ONLY = 'AGENT_ONLY',
  TRANSACTION_PARTIES = 'TRANSACTION_PARTIES',
  PUBLIC = 'PUBLIC',
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  changeNotes?: string;
  checksum: string;
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  requesterId: string;
  requesterName: string;
  requestDate: Date;
  expiresAt: Date;
  status: SignatureStatus;
  signers: Signer[];
  message?: string;
  reminderCount: number;
  lastReminderAt?: Date;
  completedAt?: Date;
}

export interface Signer {
  id: string;
  name: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'AGENT' | 'LENDER' | 'TITLE' | 'OTHER';
  status: SignatureStatus;
  signedAt?: Date;
  ipAddress?: string;
  verificationMethod: 'EMAIL' | 'SMS' | 'KBA' | 'IN_PERSON';
  fields: SignatureFieldConfig[];
  accessCode?: string;
}

export interface SignatureFieldConfig {
  id: string;
  type: SignatureField;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  signerId: string;
  value?: string;
  options?: string[];
  fontSize?: number;
  fontFamily?: string;
}

export interface Document {
  id: string;
  transactionId?: string;
  propertyId?: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  status: DocumentStatus;
  accessLevel: AccessLevel;
  currentVersion: number;
  versions: DocumentVersion[];
  tags: string[];
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
  metadata: Record<string, unknown>;
  signatureRequest?: SignatureRequest;
  expiryDate?: Date;
  retentionDays?: number;
  isConfidential: boolean;
  isTemplate: boolean;
  templateVariables?: string[];
  folder?: string;
  relatedDocuments: string[];
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  content: string;
  variables: TemplateVariable[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  usageCount: number;
  tags: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT';
  label: string;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  placeholder?: string;
}

export interface UploadDocumentInput {
  name: string;
  description?: string;
  category: DocumentCategory;
  transactionId?: string;
  propertyId?: string;
  accessLevel?: AccessLevel;
  tags?: string[];
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isConfidential?: boolean;
  folder?: string;
  expiryDate?: Date;
  retentionDays?: number;
  metadata?: Record<string, unknown>;
}

export interface DocumentFilter {
  category?: DocumentCategory[];
  status?: DocumentStatus[];
  transactionId?: string;
  propertyId?: string;
  uploadedBy?: string;
  tags?: string[];
  search?: string;
  folder?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  isTemplate?: boolean;
  isConfidential?: boolean;
}

export interface DocumentStats {
  totalDocuments: number;
  byCategory: Record<DocumentCategory, number>;
  byStatus: Record<DocumentStatus, number>;
  pendingSignatures: number;
  expiredDocuments: number;
  recentUploads: number;
  totalStorageUsed: number;
}

// ─── Service Implementation ──────────────────────────────────────────────────

export class DocumentService {
  private documents: Map<string, Document> = new Map();
  private templates: Map<string, DocumentTemplate> = new Map();
  private signatureRequests: Map<string, SignatureRequest> = new Map();

  // ── Document Upload & Management ─────────────────────────────────────

  uploadDocument(input: UploadDocumentInput): Document {
    this.validateUploadInput(input);

    const id = `doc_${nanoid(12)}`;
    const now = new Date();

    const document: Document = {
      id,
      transactionId: input.transactionId,
      propertyId: input.propertyId,
      name: input.name,
      description: input.description,
      category: input.category,
      status: DocumentStatus.DRAFT,
      accessLevel: input.accessLevel || AccessLevel.TRANSACTION_PARTIES,
      currentVersion: 1,
      versions: [
        {
          id: `ver_${nanoid(8)}`,
          versionNumber: 1,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          uploadedBy: 'system',
          uploadedAt: now,
          checksum: this.generateChecksum(input.fileUrl),
        },
      ],
      tags: input.tags || [],
      uploadedBy: 'system',
      uploadedByName: 'System',
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata || {},
      isConfidential: input.isConfidential || false,
      isTemplate: false,
      folder: input.folder,
      relatedDocuments: [],
      expiryDate: input.expiryDate,
      retentionDays: input.retentionDays,
    };

    this.documents.set(id, document);
    return document;
  }

  uploadNewVersion(
    documentId: string,
    fileUrl: string,
    fileSize: number,
    mimeType: string,
    uploadedBy: string,
    changeNotes?: string
  ): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    if (doc.status === DocumentStatus.ARCHIVED || doc.status === DocumentStatus.VOIDED) {
      throw new Error(`Cannot upload new version for document in status ${doc.status}`);
    }

    const newVersionNumber = doc.currentVersion + 1;
    const version: DocumentVersion = {
      id: `ver_${nanoid(8)}`,
      versionNumber: newVersionNumber,
      fileUrl,
      fileSize,
      mimeType,
      uploadedBy,
      uploadedAt: new Date(),
      changeNotes,
      checksum: this.generateChecksum(fileUrl),
    };

    doc.versions.push(version);
    doc.currentVersion = newVersionNumber;
    doc.updatedAt = new Date();

    return doc;
  }

  // ── Version Control ──────────────────────────────────────────────────

  getVersionHistory(documentId: string): DocumentVersion[] {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    return [...doc.versions].sort((a, b) => b.versionNumber - a.versionNumber);
  }

  getVersion(documentId: string, versionNumber: number): DocumentVersion | undefined {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    return doc.versions.find((v) => v.versionNumber === versionNumber);
  }

  revertToVersion(documentId: string, versionNumber: number): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    const targetVersion = doc.versions.find((v) => v.versionNumber === versionNumber);
    if (!targetVersion) {
      throw new Error(`Version ${versionNumber} not found`);
    }

    const revertVersion: DocumentVersion = {
      id: `ver_${nanoid(8)}`,
      versionNumber: doc.currentVersion + 1,
      fileUrl: targetVersion.fileUrl,
      fileSize: targetVersion.fileSize,
      mimeType: targetVersion.mimeType,
      uploadedBy: 'system',
      uploadedAt: new Date(),
      changeNotes: `Reverted to version ${versionNumber}`,
      checksum: targetVersion.checksum,
    };

    doc.versions.push(revertVersion);
    doc.currentVersion = revertVersion.versionNumber;
    doc.updatedAt = new Date();

    return doc;
  }

  compareVersions(
    documentId: string,
    versionA: number,
    versionB: number
  ): { versionA: DocumentVersion; versionB: DocumentVersion; differences: string[] } {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    const verA = doc.versions.find((v) => v.versionNumber === versionA);
    const verB = doc.versions.find((v) => v.versionNumber === versionB);

    if (!verA) throw new Error(`Version ${versionA} not found`);
    if (!verB) throw new Error(`Version ${versionB} not found`);

    const differences: string[] = [];
    if (verA.fileUrl !== verB.fileUrl) differences.push('File URL changed');
    if (verA.fileSize !== verB.fileSize) {
      differences.push(
        `File size changed: ${verA.fileSize} → ${verB.fileSize} bytes`
      );
    }
    if (verA.checksum !== verB.checksum) differences.push('File content changed');

    return { versionA: verA, versionB: verB, differences };
  }

  // ── Document Templates ───────────────────────────────────────────────

  createTemplate(
    name: string,
    description: string,
    category: DocumentCategory,
    content: string,
    variables: TemplateVariable[],
    createdBy: string
  ): DocumentTemplate {
    if (!name) throw new Error('Template name is required');
    if (!content) throw new Error('Template content is required');

    const id = `tmpl_${nanoid(10)}`;
    const now = new Date();

    const template: DocumentTemplate = {
      id,
      name,
      description,
      category,
      content,
      variables,
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy,
      isActive: true,
      usageCount: 0,
      tags: [],
    };

    this.templates.set(id, template);
    return template;
  }

  updateTemplate(
    templateId: string,
    updates: Partial<Pick<DocumentTemplate, 'name' | 'description' | 'content' | 'variables' | 'isActive'>>
  ): DocumentTemplate {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    if (updates.name !== undefined) template.name = updates.name;
    if (updates.description !== undefined) template.description = updates.description;
    if (updates.content !== undefined) {
      template.content = updates.content;
      template.version += 1;
    }
    if (updates.variables !== undefined) template.variables = updates.variables;
    if (updates.isActive !== undefined) template.isActive = updates.isActive;

    template.updatedAt = new Date();
    return template;
  }

  generateDocumentFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    transactionId?: string,
    propertyId?: string
  ): Document {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);
    if (!template.isActive) throw new Error(`Template ${templateId} is not active`);

    const missingVars = template.variables
      .filter((v) => v.required && !variables[v.name])
      .map((v) => v.label);

    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    let content = template.content;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(placeholder, value);
    }

    template.usageCount += 1;

    const id = `doc_${nanoid(12)}`;
    const now = new Date();

    const document: Document = {
      id,
      transactionId,
      propertyId,
      name: `${template.name} - Generated`,
      description: `Generated from template: ${template.name}`,
      category: template.category,
      status: DocumentStatus.DRAFT,
      accessLevel: AccessLevel.TRANSACTION_PARTIES,
      currentVersion: 1,
      versions: [
        {
          id: `ver_${nanoid(8)}`,
          versionNumber: 1,
          fileUrl: `generated/${id}/v1.pdf`,
          fileSize: content.length,
          mimeType: 'application/pdf',
          uploadedBy: 'template-engine',
          uploadedAt: now,
          changeNotes: `Generated from template ${template.name}`,
          checksum: this.generateChecksum(content),
        },
      ],
      tags: [...template.tags],
      uploadedBy: 'system',
      uploadedByName: 'Template Engine',
      createdAt: now,
      updatedAt: now,
      metadata: { templateId, templateVersion: template.version, generatedVariables: variables },
      isConfidential: false,
      isTemplate: false,
      templateVariables: Object.keys(variables),
      relatedDocuments: [],
    };

    this.documents.set(id, document);
    return document;
  }

  getTemplate(templateId: string): DocumentTemplate | undefined {
    return this.templates.get(templateId);
  }

  getTemplatesByCategory(category: DocumentCategory): DocumentTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category && t.isActive
    );
  }

  // ── E-Signature Management ───────────────────────────────────────────

  createSignatureRequest(
    documentId: string,
    requesterId: string,
    requesterName: string,
    signers: Omit<Signer, 'id' | 'status' | 'signedAt' | 'fields'>[],
    message?: string,
    expiresInDays: number = 7
  ): SignatureRequest {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    if (doc.status === DocumentStatus.SIGNED || doc.status === DocumentStatus.EXECUTED) {
      throw new Error('Document is already fully signed');
    }

    const id = `sig_${nanoid(10)}`;
    const now = new Date();

    const signatureRequest: SignatureRequest = {
      id,
      documentId,
      requesterId,
      requesterName,
      requestDate: now,
      expiresAt: new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000),
      status: SignatureStatus.PENDING,
      signers: signers.map((s) => ({
        ...s,
        id: `signer_${nanoid(8)}`,
        status: SignatureStatus.PENDING,
        fields: [],
      })),
      message,
      reminderCount: 0,
    };

    this.signatureRequests.set(id, signatureRequest);
    doc.signatureRequest = signatureRequest;
    doc.status = DocumentStatus.PENDING_SIGNATURE;
    doc.updatedAt = now;

    return signatureRequest;
  }

  sendSignatureRequest(requestId: string): SignatureRequest {
    const request = this.signatureRequests.get(requestId);
    if (!request) throw new Error(`Signature request ${requestId} not found`);

    for (const signer of request.signers) {
      if (signer.status === SignatureStatus.PENDING) {
        signer.status = SignatureStatus.SENT;
      }
    }

    request.status = SignatureStatus.SENT;
    return request;
  }

  recordSignature(
    requestId: string,
    signerId: string,
    ipAddress: string
  ): SignatureRequest {
    const request = this.signatureRequests.get(requestId);
    if (!request) throw new Error(`Signature request ${requestId} not found`);

    const signer = request.signers.find((s) => s.id === signerId);
    if (!signer) throw new Error(`Signer ${signerId} not found`);

    if (new Date() > request.expiresAt) {
      signer.status = SignatureStatus.EXPIRED;
      throw new Error('Signature request has expired');
    }

    signer.status = SignatureStatus.SIGNED;
    signer.signedAt = new Date();
    signer.ipAddress = ipAddress;

    const allSigned = request.signers.every(
      (s) => s.status === SignatureStatus.SIGNED
    );

    if (allSigned) {
      request.status = SignatureStatus.SIGNED;
      request.completedAt = new Date();

      const doc = this.documents.get(request.documentId);
      if (doc) {
        doc.status = DocumentStatus.SIGNED;
        doc.updatedAt = new Date();
      }
    } else {
      const anySigned = request.signers.some(
        (s) => s.status === SignatureStatus.SIGNED
      );
      if (anySigned) {
        request.status = SignatureStatus.PARTIALLY_SIGNED;
        const doc = this.documents.get(request.documentId);
        if (doc) {
          doc.status = DocumentStatus.PARTIALLY_SIGNED;
        }
      }
    }

    return request;
  }

  declineSignature(requestId: string, signerId: string, reason: string): SignatureRequest {
    const request = this.signatureRequests.get(requestId);
    if (!request) throw new Error(`Signature request ${requestId} not found`);

    const signer = request.signers.find((s) => s.id === signerId);
    if (!signer) throw new Error(`Signer ${signerId} not found`);

    signer.status = SignatureStatus.DECLINED;
    request.status = SignatureStatus.DECLINED;

    const doc = this.documents.get(request.documentId);
    if (doc) {
      doc.status = DocumentStatus.REJECTED;
      doc.updatedAt = new Date();
    }

    return request;
  }

  sendReminder(requestId: string): SignatureRequest {
    const request = this.signatureRequests.get(requestId);
    if (!request) throw new Error(`Signature request ${requestId} not found`);

    if (new Date() > request.expiresAt) {
      throw new Error('Signature request has expired');
    }

    request.reminderCount += 1;
    request.lastReminderAt = new Date();

    return request;
  }

  // ── Document Access & Tracking ───────────────────────────────────────

  trackAccess(documentId: string, userId: string): void {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    doc.lastAccessedAt = new Date();
    doc.lastAccessedBy = userId;
  }

  checkAccess(documentId: string, userId: string, userRole: string): boolean {
    const doc = this.documents.get(documentId);
    if (!doc) return false;

    switch (doc.accessLevel) {
      case AccessLevel.PUBLIC:
        return true;
      case AccessLevel.PRIVATE:
        return doc.uploadedBy === userId;
      case AccessLevel.AGENT_ONLY:
        return ['AGENT', 'BROKER', 'ADMIN'].includes(userRole);
      case AccessLevel.TRANSACTION_PARTIES:
        return true;
      default:
        return false;
    }
  }

  // ── Document Organization ────────────────────────────────────────────

  moveToFolder(documentId: string, folder: string): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    doc.folder = folder;
    doc.updatedAt = new Date();
    return doc;
  }

  addTag(documentId: string, tag: string): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    if (!doc.tags.includes(tag)) {
      doc.tags.push(tag);
      doc.updatedAt = new Date();
    }

    return doc;
  }

  removeTag(documentId: string, tag: string): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    doc.tags = doc.tags.filter((t) => t !== tag);
    doc.updatedAt = new Date();
    return doc;
  }

  linkDocuments(docId1: string, docId2: string): void {
    const doc1 = this.documents.get(docId1);
    const doc2 = this.documents.get(docId2);
    if (!doc1) throw new Error(`Document ${doc1} not found`);
    if (!doc2) throw new Error(`Document ${doc2} not found`);

    if (!doc1.relatedDocuments.includes(docId2)) {
      doc1.relatedDocuments.push(docId2);
    }
    if (!doc2.relatedDocuments.includes(docId1)) {
      doc2.relatedDocuments.push(docId1);
    }
  }

  // ── Document Lifecycle ───────────────────────────────────────────────

  approveDocument(documentId: string, approverId: string): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    if (doc.status !== DocumentStatus.PENDING_REVIEW) {
      throw new Error(`Cannot approve document in status ${doc.status}`);
    }

    doc.status = DocumentStatus.APPROVED;
    doc.updatedAt = new Date();
    return doc;
  }

  rejectDocument(documentId: string, rejectorId: string, reason: string): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    doc.status = DocumentStatus.REJECTED;
    doc.updatedAt = new Date();
    doc.metadata = { ...doc.metadata, rejectionReason: reason, rejectedBy: rejectorId };
    return doc;
  }

  archiveDocument(documentId: string): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    doc.status = DocumentStatus.ARCHIVED;
    doc.updatedAt = new Date();
    return doc;
  }

  voidDocument(documentId: string, reason: string): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    doc.status = DocumentStatus.VOIDED;
    doc.updatedAt = new Date();
    doc.metadata = { ...doc.metadata, voidReason: reason };
    return doc;
  }

  markAsExecuted(documentId: string): Document {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    if (doc.status !== DocumentStatus.SIGNED) {
      throw new Error(`Cannot execute document in status ${doc.status}`);
    }

    doc.status = DocumentStatus.EXECUTED;
    doc.updatedAt = new Date();
    return doc;
  }

  // ── Expiration Management ────────────────────────────────────────────

  checkExpiredDocuments(): Document[] {
    const now = new Date();
    const expired: Document[] = [];

    for (const doc of this.documents.values()) {
      if (
        doc.expiryDate &&
        doc.expiryDate < now &&
        doc.status !== DocumentStatus.EXPIRED &&
        doc.status !== DocumentStatus.ARCHIVED &&
        doc.status !== DocumentStatus.VOIDED
      ) {
        doc.status = DocumentStatus.EXPIRED;
        doc.updatedAt = now;
        expired.push(doc);
      }
    }

    return expired;
  }

  // ── Queries & Analytics ──────────────────────────────────────────────

  getDocument(documentId: string): Document | undefined {
    return this.documents.get(documentId);
  }

  searchDocuments(filter: DocumentFilter): Document[] {
    let results = Array.from(this.documents.values());

    if (filter.category && filter.category.length > 0) {
      results = results.filter((d) => filter.category!.includes(d.category));
    }

    if (filter.status && filter.status.length > 0) {
      results = results.filter((d) => filter.status!.includes(d.status));
    }

    if (filter.transactionId) {
      results = results.filter((d) => d.transactionId === filter.transactionId);
    }

    if (filter.propertyId) {
      results = results.filter((d) => d.propertyId === filter.propertyId);
    }

    if (filter.uploadedBy) {
      results = results.filter((d) => d.uploadedBy === filter.uploadedBy);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter((d) =>
        filter.tags!.some((tag) => d.tags.includes(tag))
      );
    }

    if (filter.search) {
      const term = filter.search.toLowerCase();
      results = results.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.description?.toLowerCase().includes(term)
      );
    }

    if (filter.folder) {
      results = results.filter((d) => d.folder === filter.folder);
    }

    if (filter.createdAfter) {
      results = results.filter((d) => d.createdAt >= filter.createdAfter!);
    }

    if (filter.createdBefore) {
      results = results.filter((d) => d.createdAt <= filter.createdBefore!);
    }

    if (filter.isTemplate !== undefined) {
      results = results.filter((d) => d.isTemplate === filter.isTemplate);
    }

    if (filter.isConfidential !== undefined) {
      results = results.filter((d) => d.isConfidential === filter.isConfidential);
    }

    return results;
  }

  getDocumentsByTransaction(transactionId: string): Document[] {
    return Array.from(this.documents.values()).filter(
      (d) => d.transactionId === transactionId
    );
  }

  getDocumentsByProperty(propertyId: string): Document[] {
    return Array.from(this.documents.values()).filter(
      (d) => d.propertyId === propertyId
    );
  }

  getDocumentStats(): DocumentStats {
    const docs = Array.from(this.documents.values());

    const byCategory = {} as Record<DocumentCategory, number>;
    const byStatus = {} as Record<DocumentStatus, number>;

    for (const cat of Object.values(DocumentCategory)) {
      byCategory[cat] = 0;
    }
    for (const stat of Object.values(DocumentStatus)) {
      byStatus[stat] = 0;
    }

    let totalStorageUsed = 0;
    let pendingSignatures = 0;
    let expiredDocuments = 0;
    let recentUploads = 0;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const doc of docs) {
      byCategory[doc.category]++;
      byStatus[doc.status]++;

      for (const ver of doc.versions) {
        totalStorageUsed += ver.fileSize;
      }

      if (doc.status === DocumentStatus.PENDING_SIGNATURE) pendingSignatures++;
      if (doc.status === DocumentStatus.EXPIRED) expiredDocuments++;
      if (doc.createdAt >= oneWeekAgo) recentUploads++;
    }

    return {
      totalDocuments: docs.length,
      byCategory,
      byStatus,
      pendingSignatures,
      expiredDocuments,
      recentUploads,
      totalStorageUsed,
    };
  }

  deleteDocument(documentId: string): void {
    const doc = this.documents.get(documentId);
    if (!doc) throw new Error(`Document ${documentId} not found`);

    if (doc.isConfidential) {
      throw new Error('Cannot delete confidential documents. Archive instead.');
    }

    this.documents.delete(documentId);
  }

  private validateUploadInput(input: UploadDocumentInput): void {
    if (!input.name) throw new Error('Document name is required');
    if (!input.fileUrl) throw new Error('File URL is required');
    if (input.fileSize <= 0) throw new Error('File size must be positive');

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (input.fileSize > maxSize) {
      throw new Error(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimeTypes.includes(input.mimeType)) {
      throw new Error(`Unsupported MIME type: ${input.mimeType}`);
    }
  }

  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `chk_${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }
}

// ── Export singleton ──────────────────────────────────────────────────────

export const documentService = new DocumentService();
