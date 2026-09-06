import {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentStatus,
  AppointmentType,
  CalendarSyncConfig,
} from '@/types';
import { PrismaClient, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export class AppointmentService {
  private static instance: AppointmentService;

  static getInstance(): AppointmentService {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService();
    }
    return AppointmentService.instance;
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const confirmationCode = this.generateConfirmationCode();

    const appointment = await prisma.appointment.create({
      data: {
        type: input.type,
        status: AppointmentStatus.SCHEDULED,
        propertyId: input.propertyId,
        listingId: input.listingId,
        agentId: input.agentId,
        userId: input.userId,
        startDateTime: input.startDateTime,
        endDateTime: input.endDateTime,
        timezone: input.timezone || 'America/New_York',
        notes: input.notes,
        specialInstructions: input.specialInstructions,
        confirmationCode,
        attendees: {
          create: {
            userId: input.userId,
            role: 'guest',
            status: 'confirmed',
          },
        },
        ...(input.agentId && {
          agentAttendee: {
            create: {
              userId: input.agentId,
              role: 'agent',
              status: 'confirmed',
            },
          },
        }),
      },
      include: this.getAppointmentInclude(),
    });

    return this.formatAppointment(appointment);
  }

  async updateAppointment(input: UpdateAppointmentInput, userId: string): Promise<Appointment> {
    const { id, ...data } = input;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new Error('Appointment not found');

    if (data.status && data.status !== existing.status) {
      await this.validateStatusTransition(existing.status, data.status);
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.startDateTime && { startDateTime: data.startDateTime }),
        ...(data.endDateTime && { endDateTime: data.endDateTime }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.cancellationReason && { cancellationReason: data.cancellationReason }),
        ...(data.status === AppointmentStatus.CONFIRMED && { confirmedAt: new Date() }),
        ...(data.status === AppointmentStatus.COMPLETED && { completedAt: new Date() }),
        ...(data.status === AppointmentStatus.CANCELLED && { cancelledAt: new Date() }),
      },
      include: this.getAppointmentInclude(),
    });

    return this.formatAppointment(appointment);
  }

  async cancelAppointment(id: string, reason: string, userId: string): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error('Appointment not found');

    if (appointment.userId !== userId && appointment.agentId !== userId) {
      throw new Error('Not authorized to cancel this appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new Error('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed appointment');
    }

    return this.updateAppointment({
      id,
      status: AppointmentStatus.CANCELLED,
      cancellationReason: reason,
    }, userId);
  }

  async confirmAppointment(id: string, userId: string): Promise<Appointment> {
    return this.updateAppointment({
      id,
      status: AppointmentStatus.CONFIRMED,
    }, userId);
  }

  async completeAppointment(id: string, userId: string): Promise<Appointment> {
    return this.updateAppointment({
      id,
      status: AppointmentStatus.COMPLETED,
    }, userId);
  }

  async rescheduleAppointment(
    id: string,
    newStartDateTime: Date,
    newEndDateTime: Date,
    userId: string
  ): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new Error('Appointment not found');

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new Error('Cannot reschedule a cancelled appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot reschedule a completed appointment');
    }

    await this.updateAppointment({
      id,
      status: AppointmentStatus.RESCHEDULED,
    }, userId);

    return this.updateAppointment({
      id,
      startDateTime: newStartDateTime,
      endDateTime: newEndDateTime,
      status: AppointmentStatus.SCHEDULED,
    }, userId);
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: this.getAppointmentInclude(),
    });

    return appointment ? this.formatAppointment(appointment) : null;
  }

  async getAppointmentByConfirmationCode(code: string): Promise<Appointment | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { confirmationCode: code },
      include: this.getAppointmentInclude(),
    });

    return appointment ? this.formatAppointment(appointment) : null;
  }

  async getUserAppointments(
    userId: string,
    status?: AppointmentStatus,
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const where: Prisma.AppointmentWhereInput = {
      OR: [
        { userId },
        { agentId: userId },
      ],
      ...(status && { status }),
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { startDateTime: 'asc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: this.getAppointmentInclude(),
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments: appointments.map(a => this.formatAppointment(a)),
      total,
    };
  }

  async getAgentAppointments(
    agentId: string,
    startDate?: Date,
    endDate?: Date,
    pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const where: Prisma.AppointmentWhereInput = {
      agentId,
      ...(startDate && { startDateTime: { gte: startDate } }),
      ...(endDate && { endDateTime: { lte: endDate } }),
      status: { not: AppointmentStatus.CANCELLED },
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy: { startDateTime: 'asc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: this.getAppointmentInclude(),
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments: appointments.map(a => this.formatAppointment(a)),
      total,
    };
  }

  async getPropertyAppointments(propertyId: string): Promise<Appointment[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        propertyId,
        status: { not: AppointmentStatus.CANCELLED },
      },
      orderBy: { startDateTime: 'asc' },
      include: this.getAppointmentInclude(),
    });

    return appointments.map(a => this.formatAppointment(a));
  }

  async createOpenHouseEvent(
    listingId: string,
    agentId: string,
    event: {
      startDateTime: Date;
      endDateTime: Date;
      description?: string;
      maxAttendees?: number;
    }
  ): Promise<Appointment> {
    const confirmationCode = this.generateConfirmationCode();

    const appointment = await prisma.appointment.create({
      data: {
        type: AppointmentType.OPEN_HOUSE,
        status: AppointmentStatus.SCHEDULED,
        propertyId: listingId,
        agentId,
        userId: agentId,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        notes: event.description,
        confirmationCode,
        attendees: {
          create: {
            userId: agentId,
            role: 'host',
            status: 'confirmed',
          },
        },
      },
      include: this.getAppointmentInclude(),
    });

    return this.formatAppointment(appointment);
  }

  async registerForOpenHouse(
    appointmentId: string,
    userId: string
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { attendees: true },
    });

    if (!appointment) throw new Error('Open house not found');
    if (appointment.type !== AppointmentType.OPEN_HOUSE) throw new Error('Not an open house event');
    if (appointment.status !== AppointmentStatus.SCHEDULED && appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new Error('Open house is not accepting registrations');
    }

    const existingRegistration = appointment.attendees.find(a => a.userId === userId);
    if (existingRegistration) throw new Error('Already registered for this open house');

    await prisma.appointmentAttendee.create({
      data: {
        appointmentId,
        userId,
        role: 'guest',
        status: 'confirmed',
      },
    });
  }

  async sendConfirmation(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        property: { select: { title: true, address: true, city: true } },
        attendees: true,
      },
    });

    if (!appointment) throw new Error('Appointment not found');

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });
  }

  async sendReminder(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        property: { select: { title: true, address: true, city: true } },
      },
    });

    if (!appointment) throw new Error('Appointment not found');

    const hoursUntil = (appointment.startDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil > 24 || hoursUntil < 1) return;

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });
  }

  async sendFollowUp(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new Error('Can only send follow-up for completed appointments');
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { followUpSent: true },
    });
  }

  async submitFeedback(
    appointmentId: string,
    userId: string,
    feedback: {
      rating?: number;
      comments?: string;
      interested?: boolean;
      followUpNeeded?: boolean;
    }
  ): Promise<void> {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new Error('Can only submit feedback for completed appointments');
    }

    await prisma.appointmentFeedback.create({
      data: {
        appointmentId,
        userId,
        rating: feedback.rating,
        comments: feedback.comments,
        interested: feedback.interested,
        followUpNeeded: feedback.followUpNeeded,
      },
    });
  }

  async getUpcomingAppointments(hoursAhead = 24): Promise<Appointment[]> {
    const now = new Date();
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        startDateTime: { gte: now, lte: future },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
      orderBy: { startDateTime: 'asc' },
      include: this.getAppointmentInclude(),
    });

    return appointments.map(a => this.formatAppointment(a));
  }

  async getAppointmentStats(agentId?: string): Promise<{
    total: number;
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
    cancellationRate: number;
  }> {
    const where: Prisma.AppointmentWhereInput = agentId ? { agentId } : {};

    const [total, scheduled, confirmed, completed, cancelled, noShow] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: AppointmentStatus.SCHEDULED } }),
      prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CONFIRMED } }),
      prisma.appointment.count({ where: { ...where, status: AppointmentStatus.COMPLETED } }),
      prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CANCELLED } }),
      prisma.appointment.count({ where: { ...where, status: AppointmentStatus.NO_SHOW } }),
    ]);

    return {
      total,
      scheduled,
      confirmed,
      completed,
      cancelled,
      noShow,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
    };
  }

  async syncWithCalendar(appointmentId: string, config: CalendarSyncConfig): Promise<string | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        property: { select: { title: true, address: true } },
      },
    });

    if (!appointment) throw new Error('Appointment not found');

    const calendarEvent = {
      summary: `${appointment.type} - ${appointment.property?.title || 'Property'}`,
      description: appointment.notes || '',
      location: appointment.property?.address || '',
      start: appointment.startDateTime.toISOString(),
      end: appointment.endDateTime.toISOString(),
      attendees: [],
    };

    const eventId = `cal_${nanoid(12)}`;

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { calendarEventId: eventId },
    });

    return eventId;
  }

  async getCalendarEvents(agentId: string, start: Date, end: Date): Promise<Appointment[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        agentId,
        startDateTime: { gte: start },
        endDateTime: { lte: end },
        status: { not: AppointmentStatus.CANCELLED },
      },
      orderBy: { startDateTime: 'asc' },
      include: this.getAppointmentInclude(),
    });

    return appointments.map(a => this.formatAppointment(a));
  }

  private async validateStatusTransition(from: AppointmentStatus, to: AppointmentStatus): Promise<void> {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.RESCHEDULED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
        AppointmentStatus.RESCHEDULED,
      ],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [
        AppointmentStatus.RESCHEDULED,
      ],
      [AppointmentStatus.RESCHEDULED]: [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CANCELLED,
      ],
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new Error(`Invalid status transition from ${from} to ${to}`);
    }
  }

  private generateConfirmationCode(): string {
    return `APT-${nanoid(8).toUpperCase()}`;
  }

  private getAppointmentInclude() {
    return {
      property: {
        select: {
          id: true,
          title: true,
          slug: true,
          address: true,
          city: true,
          state: true,
          price: true,
          bedrooms: true,
          bathrooms: true,
          sqft: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          headshot: true,
          averageRating: true,
          brokerage: true,
        },
      },
      attendees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      feedback: true,
    };
  }

  private formatAppointment(appointment: any): Appointment {
    return {
      id: appointment.id,
      type: appointment.type,
      status: appointment.status,
      propertyId: appointment.propertyId,
      listingId: appointment.listingId,
      agentId: appointment.agentId,
      userId: appointment.userId,
      startDateTime: appointment.startDateTime,
      endDateTime: appointment.endDateTime,
      timezone: appointment.timezone,
      notes: appointment.notes,
      specialInstructions: appointment.specialInstructions,
      cancellationReason: appointment.cancellationReason,
      confirmationCode: appointment.confirmationCode,
      confirmedAt: appointment.confirmedAt,
      completedAt: appointment.completedAt,
      cancelledAt: appointment.cancelledAt,
      attendees: appointment.attendees?.map((a: any) => ({
        id: a.id,
        appointmentId: a.appointmentId,
        userId: a.userId,
        role: a.role,
        status: a.status,
        name: a.user?.name,
        email: a.user?.email,
        phone: a.phone,
      })) || [],
      feedback: appointment.feedback ? {
        id: appointment.feedback.id,
        appointmentId: appointment.feedback.appointmentId,
        userId: appointment.feedback.userId,
        rating: appointment.feedback.rating,
        comments: appointment.feedback.comments,
        interested: appointment.feedback.interested,
        followUpNeeded: appointment.feedback.followUpNeeded,
        createdAt: appointment.feedback.createdAt,
      } : undefined,
      property: appointment.property ? {
        id: appointment.property.id,
        title: appointment.property.title,
        slug: appointment.property.slug,
        address: appointment.property.address,
        city: appointment.property.city,
        state: appointment.property.state,
        price: Number(appointment.property.price),
        bedrooms: appointment.property.bedrooms,
        bathrooms: Number(appointment.property.bathrooms),
        sqft: appointment.property.sqft,
        yearBuilt: 0,
        primaryImage: appointment.property.images?.[0]?.url,
        propertyType: 'HOUSE' as any,
        listingType: 'SALE' as any,
        status: 'ACTIVE' as any,
        viewCount: 0,
        createdAt: new Date(),
      } : undefined,
      agent: appointment.agent ? {
        id: appointment.agent.id,
        firstName: appointment.agent.firstName,
        lastName: appointment.agent.lastName,
        email: appointment.agent.email,
        phone: appointment.agent.phone,
        title: '',
        headshot: appointment.agent.headshot,
        brokerage: appointment.agent.brokerage,
        averageRating: Number(appointment.agent.averageRating),
        totalReviews: 0,
        totalSales: 0,
        isFeatured: false,
        isVerified: true,
      } : undefined,
      calendarEventId: appointment.calendarEventId,
      reminderSent: appointment.reminderSent || false,
      followUpSent: appointment.followUpSent || false,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}

export const appointmentService = AppointmentService.getInstance();
