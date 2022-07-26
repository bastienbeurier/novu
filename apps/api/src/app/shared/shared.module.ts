import { Module } from '@nestjs/common';
import {
  DalService,
  UserRepository,
  OrganizationRepository,
  EnvironmentRepository,
  NotificationTemplateRepository,
  SubscriberRepository,
  NotificationRepository,
  MessageRepository,
  NotificationGroupRepository,
  MessageTemplateRepository,
  MemberRepository,
  LogRepository,
  IntegrationRepository,
  ChangeRepository,
  JobRepository,
  FeedRepository,
} from '@novu/dal';
import { AnalyticsService } from './services/analytics/analytics.service';
import { MailService } from './services/mail/mail.service';
import { QueueService } from './services/queue';
import { StorageService } from './services/storage/storage.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

const DAL_MODELS = [
  UserRepository,
  OrganizationRepository,
  EnvironmentRepository,
  NotificationTemplateRepository,
  SubscriberRepository,
  NotificationRepository,
  MessageRepository,
  MessageTemplateRepository,
  NotificationGroupRepository,
  MemberRepository,
  LogRepository,
  IntegrationRepository,
  ChangeRepository,
  JobRepository,
  FeedRepository,
];

const dalService = new DalService();

export const ANALYTICS_SERVICE = 'AnalyticsService';

const PROVIDERS = [
  {
    provide: QueueService,
    useFactory: () => {
      return new QueueService();
    },
  },
  {
    provide: DalService,
    useFactory: async () => {
      await dalService.connect(process.env.MONGO_URL);

      return dalService;
    },
  },
  ...DAL_MODELS,
  StorageService,
  {
    provide: ANALYTICS_SERVICE,
    useFactory: async () => {
      const analyticsService = new AnalyticsService();

      await analyticsService.initialize();

      return analyticsService;
    },
  },
  MailService,
];

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'WS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'socket_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  providers: [...PROVIDERS],
  exports: [...PROVIDERS, ClientsModule],
})
export class SharedModule {}
